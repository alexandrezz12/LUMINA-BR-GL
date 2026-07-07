import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { doc, getDoc, collection, getDocs, setDoc, deleteDoc, query, where, serverTimestamp } from "firebase/firestore";
import { Tenant, Service, Professional } from "../types";
import { ChevronLeft, Plus, Scissors, User, Loader2, Trash2, Clock, Tag, Building, Camera, Image, Calendar } from "lucide-react";
import { PageTransition } from "../components/PageTransition";
import { useAuth } from "../lib/AuthProvider";
import { toast } from "sonner";

export function AdminLojaDetalhes() {
  const { tenantId: routeTenantId } = useParams<{ tenantId: string }>();
  const { user, dbUser } = useAuth();
  
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
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(routeTenantId || null);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"services" | "professionals">("services");

  // Formulário Onboarding
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreType, setNewStoreType] = useState("salon");
  const [isOnboardingSubmitting, setIsOnboardingSubmitting] = useState(false);

  // Formulário Serviço
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    name: "", description: "", duration: 60, price: 0
  });

  // Formulário Profissional
  const [showProfModal, setShowProfModal] = useState(false);
  const [profForm, setProfForm] = useState({
    name: "", 
    role: "", 
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200", 
    serviceIds: [] as string[],
    workingDays: [1, 2, 3, 4, 5, 6] as number[] // Seg a Sáb por padrão
  });

  // Câmera e Upload
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 300, height: 300, facingMode: "user" } });
      setCameraStream(stream);
      setIsCameraActive(true);
    } catch (err) {
      console.error("Erro ao acessar câmera: ", err);
      toast.error("Não foi possível acessar a câmera. Verifique as permissões de vídeo.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    const video = document.getElementById("webcam") as HTMLVideoElement;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 300;
    canvas.height = video.videoHeight || 300;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg");
      setProfForm({ ...profForm, avatar: dataUrl });
      toast.success("Foto tirada com sucesso!");
    }
    stopCamera();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setProfForm({ ...profForm, avatar: reader.result });
          toast.success("Foto carregada da galeria!");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setLoading(true);
      try {
        let activeId = tenantId;

        // Se não tiver ID definido na rota nem no estado, busca o do usuário atual
        if (!activeId) {
          const q = query(collection(db, "tenants"), where("ownerId", "==", user.uid));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const firstTenant = snap.docs[0];
            activeId = firstTenant.id;
            setTenantId(activeId);
            setTenant({ id: firstTenant.id, ...firstTenant.data() } as Tenant);
          } else {
            // Usuário não possui loja ainda
            setTenant(null);
            setLoading(false);
            return;
          }
        } else {
          const tDoc = await getDoc(doc(db, "tenants", activeId));
          if (tDoc.exists()) {
            setTenant({ id: tDoc.id, ...tDoc.data() } as Tenant);
          } else {
            setTenant(null);
            setLoading(false);
            return;
          }
        }

        if (activeId) {
          const sSnap = await getDocs(collection(db, `tenants/${activeId}/services`));
          setServices(sSnap.docs.map(d => ({ id: d.id, ...d.data() } as Service)));

          const pSnap = await getDocs(collection(db, `tenants/${activeId}/professionals`));
          setProfessionals(pSnap.docs.map(d => ({ id: d.id, ...d.data() } as Professional)));
        }
      } catch (e) {
        console.error(e);
        toast.error("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [tenantId, user]);

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
    setIsOnboardingSubmitting(true);

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
      toast.success("Sua loja foi criada com sucesso!");
      setTenantId(slug);
    } catch (error) {
      toast.error("Erro ao criar loja. Tente novamente.");
      console.error(error);
    } finally {
      setIsOnboardingSubmitting(false);
    }
  };

  const handleSaveService = async () => {
    if (!tenantId) return;
    if (!serviceForm.name || !serviceForm.price || !serviceForm.duration) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    setIsSubmitting(true);
    const path = `tenants/${tenantId}/services`;
    try {
      const sId = "s-" + Math.random().toString(36).substring(2, 9);
      const newService = {
        name: serviceForm.name,
        description: serviceForm.description || " ",
        duration: Number(serviceForm.duration),
        price: Number(serviceForm.price)
      };
      await setDoc(doc(db, path, sId), newService);
      setServices([...services, { id: sId, tenantId, ...newService } as Service]);
      setShowServiceModal(false);
      setServiceForm({ name: "", description: "", duration: 60, price: 0 });
      toast.success("Serviço adicionado com sucesso!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar serviço.");
      handleFirestoreError(e, OperationType.WRITE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveProfessional = async () => {
    if (!tenantId) return;
    if (!profForm.name || !profForm.role) {
      toast.error("Preencha o nome e o cargo.");
      return;
    }
    setIsSubmitting(true);
    const path = `tenants/${tenantId}/professionals`;
    try {
      const pId = "p-" + Math.random().toString(36).substring(2, 9);
      const newProf = {
        name: profForm.name,
        role: profForm.role,
        avatar: profForm.avatar,
        serviceIds: profForm.serviceIds,
        workingDays: profForm.workingDays
      };
      await setDoc(doc(db, path, pId), newProf);
      setProfessionals([...professionals, { id: pId, tenantId, ...newProf } as Professional]);
      setShowProfModal(false);
      setProfForm({ name: "", role: "", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200", serviceIds: [], workingDays: [1, 2, 3, 4, 5, 6] });
      toast.success("Profissional adicionado com sucesso!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar profissional.");
      handleFirestoreError(e, OperationType.WRITE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'service' | 'professional', id: string } | null>(null);

  const handleDeleteService = (id: string) => {
    setDeleteConfirm({ type: 'service', id });
  };

  const handleDeleteProfessional = (id: string) => {
    setDeleteConfirm({ type: 'professional', id });
  };

  const executeDeleteService = async (id: string) => {
    const activeTenantId = tenantId || tenant?.id;
    if (!activeTenantId) return;
    try {
      await deleteDoc(doc(db, `tenants/${activeTenantId}/services`, id));
      setServices(services.filter(s => s.id !== id));
      toast.success("Serviço excluído com sucesso.");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao excluir serviço.");
    }
  };

  const executeDeleteProfessional = async (id: string) => {
    const activeTenantId = tenantId || tenant?.id;
    if (!activeTenantId) return;
    try {
      await deleteDoc(doc(db, `tenants/${activeTenantId}/professionals`, id));
      setProfessionals(professionals.filter(p => p.id !== id));
      toast.success("Profissional excluído com sucesso.");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao excluir profissional.");
    }
  };

  if (loading) return <div className="p-12 flex justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-brand-400" /></div>;
  
  if (!tenant) {
    return (
      <PageTransition className="p-6 md:p-8 max-w-xl mx-auto min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-[2.5rem] border border-brand-100 shadow-xl w-full">
          <div className="w-16 h-16 bg-brand-50 rounded-3xl flex items-center justify-center mb-6 text-brand-900 border border-brand-100">
            <Building className="w-8 h-8 text-brand-700" />
          </div>
          <h2 className="text-3xl font-medium text-brand-900 tracking-tight mb-2">Crie sua loja</h2>
          <p className="text-brand-500 mb-8 text-sm md:text-base leading-relaxed">
            Dê um nome e defina o segmento do seu negócio para ativar seu link de reservas personalizado.
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">Nome do Estabelecimento *</label>
              <input 
                type="text"
                value={newStoreName}
                onChange={e => setNewStoreName(e.target.value)}
                placeholder="Ex: Barbearia Lumina, Salão da Ana..."
                className="w-full px-5 py-4 bg-brand-50/50 rounded-2xl border border-brand-200 outline-none focus:ring-2 focus:ring-brand-900/20 focus:border-brand-900 transition-all font-medium text-brand-900 placeholder:text-brand-400 text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">Segmento do Negócio</label>
              <select 
                value={newStoreType}
                onChange={e => setNewStoreType(e.target.value)}
                className="w-full px-5 py-4 bg-brand-50/50 rounded-2xl border border-brand-200 outline-none focus:ring-2 focus:ring-brand-900/20 focus:border-brand-900 transition-all font-medium text-brand-900 text-base appearance-none cursor-pointer"
              >
                <option value="salon">Salão de Beleza</option>
                <option value="barber">Barbearia</option>
                <option value="clinic">Clínica de Estética</option>
                <option value="studio">Estúdio de Tatuagem / Piercing</option>
                <option value="other">Outro segmento de serviços</option>
              </select>
            </div>

            <button 
              onClick={handleCreateStore}
              disabled={isOnboardingSubmitting || !newStoreName.trim()}
              className="w-full bg-brand-900 hover:bg-brand-800 disabled:opacity-50 text-white font-medium py-4 rounded-2xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 mt-8 text-base"
            >
              {isOnboardingSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Criando...
                </>
              ) : (
                <>
                  Começar Agora
                </>
              )}
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-start md:items-center gap-4">
          <Link to="/admin" className="mt-1 md:mt-0 shrink-0 w-12 h-12 bg-white/50 backdrop-blur border border-brand-200 rounded-2xl flex items-center justify-center text-brand-600 hover:bg-white hover:text-brand-900 transition-all hover:shadow-sm">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-medium text-brand-900 tracking-tight mb-1">{tenant.name}</h1>
            <p className="text-brand-500 text-sm md:text-base">Gerencie o catálogo de serviços e a equipe de atendimento.</p>
          </div>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="flex gap-2 p-1.5 bg-brand-100/50 rounded-2xl w-max mb-8 border border-brand-100/50">
        <button 
          onClick={() => setActiveTab("services")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === "services" ? "bg-white text-brand-900 shadow-sm border border-brand-100/50" : "text-brand-500 hover:text-brand-700 hover:bg-white/50"}`}
        >
          <Scissors className="w-4 h-4" /> Serviços
        </button>
        <button 
          onClick={() => setActiveTab("professionals")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === "professionals" ? "bg-white text-brand-900 shadow-sm border border-brand-100/50" : "text-brand-500 hover:text-brand-700 hover:bg-white/50"}`}
        >
          <User className="w-4 h-4" /> Profissionais
        </button>
      </div>

      {/* Services Content */}
      {activeTab === "services" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-xl font-medium text-brand-900">Catálogo de Serviços</h2>
              <p className="text-sm text-brand-500 mt-1">Configure o que a sua loja oferece ({services.length})</p>
            </div>
            <button onClick={() => setShowServiceModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-brand-900 text-white text-sm font-medium rounded-xl hover:bg-brand-800 transition-all shadow-sm active:scale-95">
              <Plus className="w-4 h-4" /> Novo Serviço
            </button>
          </div>
          
          {services.length === 0 ? (
            <div className="text-center py-16 px-6 bg-white rounded-3xl border border-brand-100 border-dashed">
              <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-brand-300">
                <Scissors className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-brand-900 mb-2">Nenhum serviço cadastrado</h3>
              <p className="text-brand-500 max-w-sm mx-auto mb-6">Você precisa adicionar pelo menos um serviço para que seus clientes possam agendar.</p>
              <button onClick={() => setShowServiceModal(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-100 text-brand-900 text-sm font-medium rounded-xl hover:bg-brand-200 transition-all">
                <Plus className="w-4 h-4" /> Cadastrar o primeiro
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map(s => (
                <div key={s.id} className="group relative bg-white p-6 rounded-3xl border border-brand-100 shadow-sm hover:shadow-md hover:border-brand-200 transition-all flex flex-col h-full">
                  <div className="flex justify-between items-start border-b border-brand-50 pb-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-50/80 flex items-center justify-center text-brand-600">
                      <Scissors className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-2">
                       <button onClick={() => handleDeleteService(s.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 transition-colors" title="Excluir">
                         <Trash2 className="w-4 h-4" />
                       </button>
                       <div className="text-right">
                         <span className="block text-lg font-medium text-brand-900">
                           {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(s.price))}
                         </span>
                         <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-brand-50 text-brand-700 text-xs font-medium rounded-md mt-1">
                           <Clock className="w-3 h-3" /> {s.duration} min
                         </span>
                       </div>
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-lg font-medium text-brand-900 mb-2 leading-tight">{s.name}</h3>
                    <p className="text-sm text-brand-500 line-clamp-2">{s.description || 'Sem descrição'}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-brand-50">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-400">
                      Serviço Ativo
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Professionals Content */}
      {activeTab === "professionals" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-xl font-medium text-brand-900">Equipe de Atendimento</h2>
              <p className="text-sm text-brand-500 mt-1">Pessoas que irão atender na sua loja ({professionals.length})</p>
            </div>
            <button 
              onClick={() => {
                const activePlan = getActivePlan();
                const maxProfs = activePlan === "enterprise" ? Infinity : activePlan === "professional" ? 10 : 3;
                if (professionals.length >= maxProfs) {
                  toast.error(`Seu plano atual (${activePlan.toUpperCase()}) permite no máximo ${maxProfs} profissional(is) por loja. Por favor, faça o upgrade de seu plano.`);
                  return;
                }
                setShowProfModal(true);
              }} 
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-900 text-white text-sm font-medium rounded-xl hover:bg-brand-800 transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" /> Novo Profissional
            </button>
          </div>

          {professionals.length === 0 ? (
            <div className="text-center py-16 px-6 bg-white rounded-3xl border border-brand-100 border-dashed">
              <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-brand-300">
                <User className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-brand-900 mb-2">Nenhum profissional cadastrado</h3>
              <p className="text-brand-500 max-w-sm mx-auto mb-6">Sua loja precisa de pelo menos uma pessoa para realizar os atendimentos.</p>
              <button 
                onClick={() => {
                  const activePlan = getActivePlan();
                  const maxProfs = activePlan === "enterprise" ? Infinity : activePlan === "professional" ? 10 : 3;
                  if (professionals.length >= maxProfs) {
                    toast.error(`Seu plano atual (${activePlan.toUpperCase()}) permite no máximo ${maxProfs} profissional(is) por loja. Por favor, faça o upgrade de seu plano.`);
                    return;
                  }
                  setShowProfModal(true);
                }} 
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-100 text-brand-900 text-sm font-medium rounded-xl hover:bg-brand-200 transition-all"
              >
                <Plus className="w-4 h-4" /> Adicionar membro
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {professionals.map(p => (
                <div key={p.id} className="group relative bg-white p-6 rounded-3xl border border-brand-100 shadow-sm flex flex-col items-center text-center hover:shadow-md hover:border-brand-200 transition-all overflow-hidden">
                  <div className="absolute top-4 right-4 z-10">
                      <button onClick={() => handleDeleteProfessional(p.id)} className="w-8 h-8 rounded-full flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors shadow-sm border border-red-100" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </button>
                  </div>
                  
                  <div className="relative mb-5">
                    <img src={p.avatar} alt={p.name} className="w-24 h-24 rounded-full object-cover shadow-sm ring-4 ring-brand-50" />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-100 text-brand-900 rounded-full flex items-center justify-center border-4 border-white">
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-xl text-brand-900 mb-1">{p.name}</h3>
                  <p className="text-sm text-brand-500 mb-3 font-medium">{p.role}</p>
                  
                  <div className="flex gap-1 justify-center mb-5">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dayChar, index) => {
                      const isWorking = p.workingDays ? p.workingDays.includes(index) : index !== 0; // Segunda a Sábado por padrão
                      return (
                        <span 
                          key={index} 
                          className={`w-6 h-6 text-[10px] font-bold rounded-full flex items-center justify-center border transition-all ${isWorking ? 'bg-brand-900 text-white border-brand-900 shadow-sm' : 'bg-brand-50 text-brand-300 border-brand-100/50'}`} 
                          title={['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][index]}
                        >
                          {dayChar}
                        </span>
                      );
                    })}
                  </div>
                  
                  <div className="mt-auto w-full pt-4 border-t border-brand-50">
                    <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 bg-brand-50 px-4 py-2 rounded-xl inline-block w-full">
                      {p.serviceIds.length} serviços habilitados
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Serviço */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-brand-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-8 pt-8 pb-6 border-b border-brand-50">
               <h2 className="text-2xl font-medium text-brand-900">Novo Serviço</h2>
               <p className="text-brand-500 text-sm mt-1">Preencha os dados do serviço oferecido.</p>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-5">
              <div>
                <label className="block text-sm font-medium text-brand-900 mb-2">Nome do Serviço *</label>
                <input value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} type="text" className="w-full px-4 py-3 bg-brand-50/50 rounded-xl border border-brand-200 outline-none focus:ring-2 focus:ring-brand-900/20 focus:border-brand-900 transition-all font-medium text-brand-900 placeholder:text-brand-300" placeholder="Ex: Corte Degrade" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-brand-900 mb-2">Descrição</label>
                <textarea rows={3} value={serviceForm.description} onChange={e => setServiceForm({...serviceForm, description: e.target.value})} className="w-full px-4 py-3 bg-brand-50/50 rounded-xl border border-brand-200 outline-none focus:ring-2 focus:ring-brand-900/20 focus:border-brand-900 transition-all text-sm text-brand-900 placeholder:text-brand-300 resize-none" placeholder="Detalhes opcionais sobre o serviço..." />
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-brand-900 mb-2">Duração (min) *</label>
                  <input value={serviceForm.duration} onChange={e => setServiceForm({...serviceForm, duration: Number(e.target.value)})} type="number" min="5" step="5" className="w-full px-4 py-3 bg-brand-50/50 rounded-xl border border-brand-200 outline-none focus:ring-2 focus:ring-brand-900/20 focus:border-brand-900 transition-all font-medium text-brand-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-900 mb-2">Valor (R$) *</label>
                  <input value={serviceForm.price || ''} onChange={e => setServiceForm({...serviceForm, price: Number(e.target.value)})} type="number" min="0" step="0.01" className="w-full px-4 py-3 bg-brand-50/50 rounded-xl border border-brand-200 outline-none focus:ring-2 focus:ring-brand-900/20 focus:border-brand-900 transition-all font-medium text-brand-900" placeholder="0.00" />
                </div>
              </div>

            </div>
            
            <div className="p-6 border-t border-brand-50 flex justify-end gap-3 bg-brand-50/30 rounded-b-[2rem]">
              <button disabled={isSubmitting} onClick={() => setShowServiceModal(false)} className="px-6 py-2.5 text-brand-600 font-medium hover:bg-brand-100 rounded-xl transition-colors">Cancelar</button>
              <button onClick={handleSaveService} disabled={isSubmitting} className="px-8 py-2.5 bg-brand-900 text-white font-medium rounded-xl flex items-center gap-2 hover:bg-brand-800 transition-all shadow-sm active:scale-95 disabled:opacity-70">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Profissional */}
      {showProfModal && (
        <div className="fixed inset-0 bg-brand-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-8 pt-8 pb-6 border-b border-brand-50">
               <h2 className="text-2xl font-medium text-brand-900">Novo Profissional</h2>
               <p className="text-brand-500 text-sm mt-1">Preencha os dados do membro da equipe.</p>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-5">
              <div>
                <label className="block text-sm font-medium text-brand-900 mb-2">Nome Completo *</label>
                <input value={profForm.name} onChange={e => setProfForm({...profForm, name: e.target.value})} type="text" className="w-full px-4 py-3 bg-brand-50/50 rounded-xl border border-brand-200 outline-none focus:ring-2 focus:ring-brand-900/20 focus:border-brand-900 transition-all font-medium text-brand-900 placeholder:text-brand-300" placeholder="Ex: João Silva" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-brand-900 mb-2">Especialidade / Cargo *</label>
                <input value={profForm.role} onChange={e => setProfForm({...profForm, role: e.target.value})} type="text" className="w-full px-4 py-3 bg-brand-50/50 rounded-xl border border-brand-200 outline-none focus:ring-2 focus:ring-brand-900/20 focus:border-brand-900 transition-all font-medium text-brand-900 placeholder:text-brand-300" placeholder="Ex: Barbeiro Master" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-brand-900 mb-2">Foto do Profissional</label>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-brand-50/50 rounded-2xl border border-brand-200">
                  <img src={profForm.avatar} alt="Preview" className="w-16 h-16 rounded-full object-cover shadow-sm ring-2 ring-brand-100" />
                  
                  <div className="flex flex-col gap-2 w-full">
                    {isCameraActive ? (
                      <div className="flex flex-col items-center gap-2 bg-brand-950 p-2 rounded-xl overflow-hidden w-full relative">
                        <video id="webcam" autoPlay playsInline className="w-full max-w-[200px] h-[150px] object-cover rounded-lg"></video>
                        <div className="flex gap-2">
                          <button type="button" onClick={capturePhoto} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-sm">
                            <Camera className="w-3.5 h-3.5" /> Tirar Foto
                          </button>
                          <button type="button" onClick={stopCamera} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <button 
                          type="button" 
                          onClick={startCamera} 
                          className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-900 hover:bg-brand-800 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
                        >
                          <Camera className="w-4 h-4" /> Tirar Foto
                        </button>
                        <label 
                          className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-brand-50 border border-brand-200 text-brand-900 text-xs font-semibold rounded-xl cursor-pointer transition-all shadow-sm"
                        >
                          <Image className="w-4 h-4" /> Galeria / Arquivos
                          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>
                      </div>
                    )}
                    <span className="text-[10px] text-brand-400 mt-1">Use a câmera, suba um arquivo ou insira uma URL direta abaixo.</span>
                    <input 
                      value={profForm.avatar} 
                      onChange={e => setProfForm({...profForm, avatar: e.target.value})} 
                      type="text" 
                      placeholder="Ou digite a URL da foto..." 
                      className="w-full px-3 py-2 bg-white rounded-lg border border-brand-200 outline-none text-xs text-brand-900 mt-1" 
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-900 mb-2">Dias que trabalha *</label>
                <div className="flex flex-wrap gap-1.5 bg-brand-50/50 border border-brand-200 rounded-2xl p-2.5">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => {
                    const isSelected = profForm.workingDays.includes(index);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setProfForm({ ...profForm, workingDays: profForm.workingDays.filter(d => d !== index) });
                          } else {
                            setProfForm({ ...profForm, workingDays: [...profForm.workingDays, index].sort() });
                          }
                        }}
                        className={`flex-1 min-w-[48px] py-2 text-xs font-semibold rounded-xl border transition-all ${
                          isSelected 
                            ? 'bg-brand-900 text-white border-brand-900 shadow-sm' 
                            : 'bg-white text-brand-500 border-brand-200 hover:bg-brand-50'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="pt-2">
                <label className="block text-sm font-medium text-brand-900 mb-3">Serviços que realiza</label>
                <div className="bg-brand-50/50 border border-brand-200 rounded-2xl p-2 max-h-48 overflow-y-auto">
                  {services.length === 0 ? (
                    <div className="text-sm text-brand-500 p-4 text-center">Nenhum serviço cadastrado na loja.</div>
                  ) : (
                    <div className="space-y-1">
                      {services.map(s => (
                        <label key={s.id} className="flex items-center gap-3 p-3 hover:bg-white rounded-xl cursor-pointer transition-colors border border-transparent hover:border-brand-100 hover:shadow-sm">
                          <input 
                            type="checkbox" 
                            checked={profForm.serviceIds.includes(s.id)}
                            onChange={(e) => {
                              if (e.target.checked) setProfForm({...profForm, serviceIds: [...profForm.serviceIds, s.id]});
                              else setProfForm({...profForm, serviceIds: profForm.serviceIds.filter(id => id !== s.id)});
                            }}
                            className="w-5 h-5 rounded border-brand-300 text-brand-900 focus:ring-brand-900 focus:ring-offset-0"
                          />
                          <div className="flex-1">
                            <span className="block text-sm font-medium text-brand-900">{s.name}</span>
                            <span className="block text-xs text-brand-500">{s.duration} min • R$ {s.price}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-brand-50 flex justify-end gap-3 bg-brand-50/30 rounded-b-[2rem]">
              <button disabled={isSubmitting} onClick={() => { stopCamera(); setShowProfModal(false); }} className="px-6 py-2.5 text-brand-600 font-medium hover:bg-brand-100 rounded-xl transition-colors">Cancelar</button>
              <button onClick={handleSaveProfessional} disabled={isSubmitting} className="px-8 py-2.5 bg-brand-900 text-white font-medium rounded-xl flex items-center gap-2 hover:bg-brand-800 transition-all shadow-sm active:scale-95 disabled:opacity-70">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-brand-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl border border-brand-100 text-center space-y-6">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-100 shadow-sm">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-medium text-brand-900">Tem certeza?</h3>
              <p className="text-sm text-brand-500 mt-2">
                Esta ação é permanente e removerá o {deleteConfirm.type === 'service' ? 'serviço' : 'profissional'} do seu sistema.
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirm(null)} 
                className="flex-1 py-2.5 border border-brand-200 text-brand-600 hover:bg-brand-50 font-medium rounded-xl transition-colors text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (deleteConfirm.type === 'service') {
                    executeDeleteService(deleteConfirm.id);
                  } else {
                    executeDeleteProfessional(deleteConfirm.id);
                  }
                  setDeleteConfirm(null);
                }} 
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all shadow-sm text-sm active:scale-95"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </PageTransition>
  );
}

