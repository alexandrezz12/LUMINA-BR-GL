import { useState, useEffect } from "react";
import { PageTransition } from "../components/PageTransition";
import { useAuth } from "../lib/AuthProvider";
import { db } from "../lib/firebase";
import { doc, getDocs, collection, query, where } from "firebase/firestore";
import { Tenant } from "../types";
import { PaymentProvider } from "../lib/PaymentProvider";
import { Loader2, CreditCard, Sparkles, AlertCircle, Check, ArrowRight, ShieldCheck, ExternalLink, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export function AdminConfig() {
  const { user, dbUser } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loadingTenant, setLoadingTenant] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    async function loadTenant() {
      if (!user) return;
      try {
        const q = query(collection(db, "tenants"), where("ownerId", "==", user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setTenant({ id: snap.docs[0].id, ...snap.docs[0].data() } as Tenant);
        }
      } catch (err) {
        console.error("Erro ao carregar loja: ", err);
      } finally {
        setLoadingTenant(false);
      }
    }
    loadTenant();
  }, [user]);

  const handleOpenPortal = async () => {
    setPortalLoading(true);
    try {
      const result = await PaymentProvider.createPortalSession(dbUser?.stripe_customer_id);
      
      if (result.stripeCustomerId && dbUser && !dbUser.stripe_customer_id) {
        const { doc, updateDoc } = await import("firebase/firestore");
        const { db } = await import("../lib/firebase");
        try {
          await updateDoc(doc(db, "users", user!.uid), {
            stripe_customer_id: result.stripeCustomerId
          });
        } catch (dbErr) {
          console.error("Failed to save stripe_customer_id on client:", dbErr);
        }
      }

      window.open(result.url, "_blank");
    } catch (e: any) {
      console.error("Error redirecting to Customer Portal:", e);
      toast.error(e.message || "Erro ao abrir o portal de faturamento. Certifique-se de que possui uma assinatura.");
    } finally {
      setPortalLoading(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "active":
        return (
          <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-200">
            Assinatura Ativa
          </span>
        );
      case "trialing":
        return (
          <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border bg-blue-50 text-blue-700 border-blue-200 animate-pulse">
            Período de Teste (7 Dias)
          </span>
        );
      case "past_due":
        return (
          <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border bg-rose-50 text-rose-700 border-rose-200">
            Atrasado (Past Due)
          </span>
        );
      case "canceled":
        return (
          <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border bg-gray-50 text-gray-700 border-gray-200">
            Cancelado
          </span>
        );
      default:
        return (
          <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border bg-amber-50 text-amber-700 border-amber-200 animate-pulse">
            Incompleto / Sem Plano
          </span>
        );
    }
  };

  const formatBillingDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Extract human-readable plan name
  const getPlanName = () => {
    const priceId = dbUser?.stripe_price_id;
    const status = dbUser?.subscription_status;
    if (!status || status === "free") return "Nenhum";
    
    // We can save the plan name directly in dbUser.plan, otherwise guess based on common pricing
    if (priceId?.includes("starter")) return "Starter";
    if (priceId?.includes("professional")) return "Professional";
    if (priceId?.includes("enterprise")) return "Enterprise";
    return "Assinatura Lumina";
  };

  return (
    <PageTransition className="p-6 md:p-10 max-w-4xl mx-auto space-y-10 min-h-screen">
      <div>
        <h1 className="text-4xl font-medium text-brand-900 tracking-tight mb-2">Conta & Preferências</h1>
        <p className="text-brand-500 text-lg">Gerencie os detalhes do seu perfil e a assinatura da sua plataforma.</p>
      </div>

      {/* Seção de Assinatura Real-Time Stripe */}
      <div className="bg-white rounded-[2rem] border border-brand-100 shadow-sm p-8 md:p-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-50 pb-6">
          <div>
            <h2 className="text-2xl font-medium text-brand-900 tracking-tight">Assinatura Lumina</h2>
            <p className="text-brand-500 text-sm mt-1">Gerencie seu plano mensal e pagamentos do Stripe.</p>
          </div>
          
          <div className="flex items-center gap-3">
            {getStatusBadge(dbUser?.subscription_status)}
            {dbUser?.subscription_status && dbUser.subscription_status !== "free" && (
              <span className="bg-brand-900 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                Plano {getPlanName()}
              </span>
            )}
          </div>
        </div>

        {/* Warning for past_due users */}
        {dbUser?.subscription_status === "past_due" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4 text-amber-900">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold">Pagamento Recusado</h4>
              <p className="text-sm text-amber-700 mt-1 leading-relaxed">
                Houve uma falha na sua última cobrança. Por favor, acesse o Portal do Cliente abaixo para atualizar seus dados de faturamento e regularizar sua assinatura.
              </p>
            </div>
          </div>
        )}

        {/* Details and Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Billing Info Table */}
          <div className="space-y-4 bg-brand-50/20 border border-brand-100 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-brand-900 uppercase tracking-wider mb-2">Detalhes de Faturamento</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-brand-500">Plano Atual:</span>
                <span className="font-medium text-brand-900">{getPlanName()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-500">Status do Faturamento:</span>
                <span className="font-semibold capitalize text-brand-900">{dbUser?.subscription_status || "Sem Assinatura"}</span>
              </div>
              {dbUser?.trial_end && dbUser.subscription_status === "trialing" && (
                <div className="flex justify-between text-sm">
                  <span className="text-brand-500">Fim do Teste Grátis:</span>
                  <span className="font-medium text-brand-900 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-brand-400" />
                    {formatBillingDate(dbUser.trial_end)}
                  </span>
                </div>
              )}
              {dbUser?.current_period_end && dbUser.subscription_status === "active" && (
                <div className="flex justify-between text-sm">
                  <span className="text-brand-500">Próxima Cobrança:</span>
                  <span className="font-medium text-brand-900 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-brand-400" />
                    {formatBillingDate(dbUser.current_period_end)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-brand-500">Forma de Pagamento:</span>
                <span className="font-medium text-brand-900">{dbUser?.payment_method || "Não Cadastrada"}</span>
              </div>
            </div>
          </div>

          {/* Customer Portal Action Card */}
          <div className="border border-brand-100 rounded-2xl p-6 space-y-4 flex flex-col justify-between h-full bg-white">
            <div>
              <h3 className="text-lg font-bold text-brand-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand-600" />
                Auto-Serviço Stripe
              </h3>
              <p className="text-sm text-brand-500 mt-2 leading-relaxed">
                Gerencie sua assinatura de forma totalmente segura no portal oficial da Stripe. Lá você poderá:
              </p>
              <ul className="text-xs text-brand-600 space-y-1.5 mt-3 pl-4 list-disc">
                <li>Atualizar ou adicionar cartões de crédito</li>
                <li>Fazer upgrade ou downgrade de planos</li>
                <li>Baixar faturas e recibos anteriores</li>
                <li>Cancelar sua assinatura a qualquer momento</li>
              </ul>
            </div>

            <div className="space-y-3 mt-6">
              <Link
                to="/admin/planos"
                className="w-full bg-brand-50 hover:bg-brand-100 text-brand-900 border border-brand-200 font-semibold py-3.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-brand-600" />
                Alterar ou Escolher Plano
              </Link>

              <button
                onClick={handleOpenPortal}
                disabled={portalLoading}
                className="w-full bg-brand-900 hover:bg-brand-800 disabled:opacity-50 text-white font-semibold py-3.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
              >
                {portalLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Abrindo portal...
                  </>
                ) : (
                  <>
                    Gerenciar Pagamentos (Stripe)
                    <ExternalLink className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dados do Proprietário */}
      <div className="bg-white rounded-[2rem] border border-brand-100 shadow-sm p-8 md:p-10">
        <h2 className="text-xl text-brand-900 mb-6 border-b border-brand-50 pb-4">Dados do Proprietário</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div>
            <label className="block text-sm font-medium text-brand-900 mb-2 ml-1">Nome Completo</label>
            <input type="text" readOnly value={user?.displayName || "Lojista"} className="w-full px-4 py-3 rounded-xl border border-brand-200 outline-none focus:ring-2 focus:ring-brand-900/20 focus:border-brand-900 transition-all bg-brand-50/50 text-brand-600 font-medium" />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-900 mb-2 ml-1">Conta Google (Email)</label>
            <input type="email" readOnly value={user?.email || ""} className="w-full px-4 py-3 rounded-xl border border-brand-200 outline-none focus:ring-2 focus:ring-brand-900/20 focus:border-brand-900 transition-all bg-brand-50/50 text-brand-600 font-medium" />
          </div>
        </div>

        <h2 className="text-xl text-brand-900 mb-6 border-b border-brand-50 pb-4">Notificações</h2>
        
        <div className="space-y-3">
          <label className="flex items-start gap-4 p-4 border border-brand-100 bg-brand-50/30 rounded-2xl cursor-pointer hover:bg-brand-50/80 transition-colors">
            <input type="checkbox" defaultChecked className="mt-1 w-5 h-5 rounded border-brand-300 text-brand-900 focus:ring-brand-900 focus:ring-offset-0" />
            <div>
              <p className="font-medium text-brand-900">Novos Agendamentos</p>
              <p className="text-sm text-brand-500 mt-0.5">Receber aviso quando novos clientes realizarem reservas confirmadas no site.</p>
            </div>
          </label>
          
          <label className="flex items-start gap-4 p-4 border border-brand-100 bg-brand-50/30 rounded-2xl cursor-pointer hover:bg-brand-50/80 transition-colors">
            <input type="checkbox" defaultChecked className="mt-1 w-5 h-5 rounded border-brand-300 text-brand-900 focus:ring-brand-900 focus:ring-offset-0" />
            <div>
              <p className="font-medium text-brand-900">Atualizações da Plataforma</p>
              <p className="text-sm text-brand-500 mt-0.5">Ficar por dentro das novas features e ferramentas de gestão do Lumina.</p>
            </div>
          </label>
        </div>
      </div>
    </PageTransition>
  );
}
