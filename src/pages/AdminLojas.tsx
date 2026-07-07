import { useState, useEffect } from "react";
import {
  Building,
  Link as LinkIcon,
  CheckCircle2,
  ChevronRight,
  Plus,
  Loader2,
  Settings,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../lib/AuthProvider";
import { Tenant } from "../types";
import { PageTransition } from "../components/PageTransition";
import { toast } from "sonner";

export function AdminLojas() {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { user, dbUser } = useAuth();
  const navigate = useNavigate();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreType, setNewStoreType] = useState("salon");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getActivePlan = () => {
    const isSuperAdmin = user?.email === "alexandrealvesszz12@gmail.com";
    if (isSuperAdmin) return "enterprise";
    
    const status = dbUser?.subscription_status;
    if (status !== "active" && status !== "trialing") {
      return "free";
    }

    const priceId = dbUser?.stripe_price_id;
    if (priceId) {
      const pid = priceId.toLowerCase();
      if (pid.includes("enterprise") || pid.includes("ent")) return "enterprise";
      if (pid.includes("professional") || pid.includes("pro")) return "professional";
      if (pid.includes("starter") || pid.includes("start")) return "starter";
    }

    if (dbUser?.plan) {
      const p = dbUser.plan.toLowerCase();
      if (p === "enterprise" || p === "professional" || p === "starter") {
        return p;
      }
    }

    return "starter";
  };

  useEffect(() => {
    async function loadTenants() {
      if (!user) return;
      try {
        const q = query(
          collection(db, "tenants"),
          where("ownerId", "==", user.uid),
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((d) => {
          const docData = d.data();
          return {
            ...docData,
            id: d.id,
            createdAt: docData.createdAt?.toDate
              ? docData.createdAt.toDate().toISOString()
              : docData.createdAt,
          } as Tenant;
        });
        setTenants(data);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, "tenants");
      } finally {
        setLoading(false);
      }
    }
    loadTenants();
  }, [user]);

  const copyToClipboard = (slug: string) => {
    const link = `${window.location.origin}/b/${slug}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(slug);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const handleCreateStore = async () => {
    if (!newStoreName || !user) return;

    const activePlan = getActivePlan();
    const maxStores = activePlan === "enterprise" ? Infinity : activePlan === "professional" ? 3 : 1;
    if (tenants.length >= maxStores) {
      toast.error(`Seu plano atual (${activePlan.toUpperCase()}) permite no máximo ${maxStores} loja(s). Por favor, faça o upgrade do seu plano.`);
      navigate("/admin/planos");
      return;
    }

    setIsSubmitting(true);

    // Naïve slug generation, adding random prefix to ensure uniqueness
    const baseSlug = generateSlug(newStoreName);
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

    const firestorePayload = {
      slug: slug,
      name: newStoreName,
      type: newStoreType as any,
      status: "trial",
      plan: "standard",
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: serverTimestamp(),
      ownerId: user.uid,
    };

    try {
      await setDoc(doc(db, "tenants", slug), firestorePayload);

      const newTenant: Tenant = {
        id: slug,
        slug: slug,
        name: newStoreName,
        type: newStoreType as any,
        status: "trial",
        plan: "standard",
        trialEndsAt: firestorePayload.trialEndsAt,
        createdAt: new Date().toISOString(),
        ownerId: user.uid,
      };

      setTenants([...tenants, newTenant]);
      setShowModal(false);
      setNewStoreName("");
      toast.success("Loja criada com sucesso!");
    } catch (error) {
      toast.error("Erro ao criar loja. Verifique o console.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-medium text-brand-900 tracking-tight mb-2">
            Minhas Lojas
          </h1>
          <p className="text-brand-500 text-lg">
            Gerencie todas as suas lojas e os links de agendamento online.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-900 text-white font-medium rounded-xl hover:bg-brand-800 transition-all shadow-sm active:scale-95 w-full md:w-auto"
        >
          <Plus className="w-5 h-5" />
          Nova Loja
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-brand-100 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-brand-900 mb-4" />
            <p className="text-brand-500 font-medium">Buscando suas lojas...</p>
          </div>
        ) : tenants.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] p-8 text-center bg-brand-50/30">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-brand-100 flex items-center justify-center mb-6 text-brand-300">
              <Building className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-medium text-brand-900 mb-2">
              Sua primeira loja
            </h3>
            <p className="text-brand-500 max-w-md mx-auto mb-8 text-lg">
              Você ainda não criou nenhuma loja. Comece adicionando uma para
              inserir seus serviços e receber clientes!
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-8 py-3 bg-brand-900 text-white font-medium rounded-xl hover:bg-brand-800 transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-5 h-5" />
              Criar Nova Loja
            </button>
          </div>
        ) : (
          <div className="divide-y divide-brand-50">
            {tenants.map((tenant) => (
              <div
                key={tenant.id}
                className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-brand-50/50 transition-colors group"
              >
                <div className="flex items-start md:items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-900 font-medium text-2xl uppercase shadow-sm shrink-0">
                    {tenant.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-medium text-brand-900 text-xl tracking-tight">
                        {tenant.name}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${
                        tenant.status === 'active' ? 'bg-emerald-100/80 text-emerald-700' :
                        tenant.status === 'trial' ? 'bg-amber-100/80 text-amber-700' :
                        'bg-red-100/80 text-red-700'
                      }`}>
                        {tenant.status === "active" ? "Ativa" : tenant.status === "trial" ? "Em Teste" : "Inativa"}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest bg-brand-900 text-white`}>
                        Plano {getActivePlan().toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-brand-500 capitalize flex items-center gap-2 mt-2">
                       <span>{
                         tenant.type === 'salon' ? 'Salão' : 
                         (tenant.type === 'barbershop' || tenant.type === 'barber') ? 'Barbearia' : 
                         tenant.type === 'clinic' ? 'Estética' : 
                         tenant.type === 'studio' ? 'Estúdio' : 'Outro'
                       }</span>
                       <span className="w-1 h-1 rounded-full bg-brand-300"></span>
                       <span>Criada em {new Date(tenant.createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                  <Link
                    to={`/admin/lojas/${tenant.id}`}
                    className="flex-1 md:flex-none flex justify-center items-center gap-2 px-5 py-2.5 text-sm font-medium text-brand-900 bg-white border border-brand-200 hover:border-brand-900 hover:shadow-sm rounded-xl transition-all"
                  >
                    <Settings className="w-4 h-4" /> Gerenciar
                  </Link>
                  <button
                    onClick={() => copyToClipboard(tenant.slug)}
                    className="flex-1 md:flex-none flex justify-center items-center gap-2 px-5 py-2.5 text-sm font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-100 rounded-xl transition-all"
                  >
                    {copiedLink === tenant.slug ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />{" "}
                        <span className="text-emerald-700">Copiado</span>
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-4 h-4" /> Copiar Link
                      </>
                    )}
                  </button>
                  <Link
                    to={`/b/${tenant.slug}`}
                    target="_blank"
                    className="flex-1 md:flex-none flex justify-center items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-brand-900 bg-white border border-brand-200 hover:border-brand-900 hover:shadow-sm rounded-xl transition-all"
                  >
                    Acessar Tela
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-brand-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl flex flex-col">
            <div className="px-8 pt-8 pb-6 border-b border-brand-50">
              <h2 className="text-2xl font-medium text-brand-900">
                Cadastrar Nova Loja
              </h2>
              <p className="text-brand-500 text-sm mt-1">
                Preencha os dados da sua nova loja.
              </p>
            </div>

            <div className="p-8 space-y-5">
              <div>
                <label className="block text-sm font-medium text-brand-900 mb-2">
                  Nome do Estabelecimento *
                </label>
                <input
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  type="text"
                  placeholder="Ex: Studio Bella"
                  className="w-full px-4 py-3 bg-brand-50/50 rounded-xl border border-brand-200 outline-none focus:ring-2 focus:ring-brand-900/20 focus:border-brand-900 transition-all font-medium text-brand-900 placeholder:text-brand-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-900 mb-2">
                  Tipo *
                </label>
                <select
                  value={newStoreType}
                  onChange={(e) => setNewStoreType(e.target.value)}
                  className="w-full px-4 py-3 bg-brand-50/50 rounded-xl border border-brand-200 outline-none focus:ring-2 focus:ring-brand-900/20 focus:border-brand-900 transition-all font-medium text-brand-900"
                >
                  <option value="salon">Salão de Beleza</option>
                  <option value="barbershop">Barbearia</option>
                  <option value="clinic">Clínica de Estética</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-brand-50 flex justify-end gap-3 bg-brand-50/30 rounded-b-[2rem]">
              <button
                disabled={isSubmitting}
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 text-brand-600 font-medium hover:bg-brand-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleCreateStore}
                className="px-8 py-2.5 bg-brand-900 text-white font-medium rounded-xl hover:bg-brand-800 transition-all shadow-sm active:scale-95 disabled:opacity-70 flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Salvar Loja
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
