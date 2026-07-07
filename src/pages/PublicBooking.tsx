import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { BookingWizard } from "../components/BookingWizard";
import { Sparkles, Scissors, Activity, Loader2 } from "lucide-react";
import { db } from "../lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { Tenant, Service, Professional } from "../types";
import { PageTransition } from "../components/PageTransition";

export function PublicBooking() {
  const { slug } = useParams();
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!slug) return;
      try {
        // Find tenant by slug (since slug is the doc ID)
        const tenantRef = doc(db, "tenants", slug);
        const tenantSnap = await getDoc(tenantRef);
        
        if (!tenantSnap.exists()) {
          setError(true);
          setLoading(false);
          return;
        }
        
        setTenant({ id: tenantSnap.id, ...tenantSnap.data() } as Tenant);
        
        // Fetch services
        const servicesSnap = await getDocs(collection(db, `tenants/${slug}/services`));
        setServices(servicesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Service)));
        
        // Fetch professionals
        const profsSnap = await getDocs(collection(db, `tenants/${slug}/professionals`));
        setProfessionals(profsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Professional)));
        
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-brand-50">
        <Loader2 className="h-8 w-8 animate-spin text-brand-900" />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen bg-brand-50 flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl text-brand-900 mb-2">Página não encontrada</h1>
        <p className="text-brand-600 mb-6">Esta loja não existe ou o link foi desativado.</p>
        <a href="/" className="px-6 py-2 bg-brand-900 text-white rounded-xl font-medium">Voltar para o Início</a>
      </div>
    );
  }

  const isTrialExpired = tenant.status === 'trial' && tenant.trialEndsAt && new Date() > new Date(tenant.trialEndsAt);
  const isBlocked = tenant.status === 'inactive' || tenant.status === 'past_due' || isTrialExpired;

  if (isBlocked) {
    return (
      <div className="min-h-screen bg-brand-50 flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl text-brand-900 mb-2">Página indisponível</h1>
        <p className="text-brand-600 mb-6">Esta loja não está aceitando agendamentos no momento (assinatura inativa).</p>
      </div>
    );
  }

  const getIcon = () => {
    switch(tenant.type) {
      case 'clinic': return <Sparkles className="w-5 h-5" />;
      case 'barbershop':
      case 'barber':
      case 'salon': return <Scissors className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  return (
    <PageTransition className="min-h-screen bg-brand-50 flex flex-col">
      <header className="bg-white border-b border-brand-100 h-16 flex items-center px-6 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto w-full flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-900 flex items-center justify-center text-brand-50 uppercase">
            {tenant.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-lg font-medium tracking-tight text-brand-900">
              {tenant.name}
            </h1>
            <p className="text-xs text-brand-500 capitalize tracking-wider">{tenant.type}</p>
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto">
        <BookingWizard 
          tenantId={tenant.id}
          services={services} 
          professionals={professionals} 
        />
      </main>
    </PageTransition>
  );
}
