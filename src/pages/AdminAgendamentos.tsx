import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, Search, Filter, Loader2, ChevronDown } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "../lib/AuthProvider";
import { Tenant, Appointment } from "../types";
import { PageTransition } from "../components/PageTransition";
import { toast } from "sonner";

type AppointmentRow = Appointment & {
  tenantName: string;
  serviceName: string;
  professionalName: string;
  id: string;
}

export function AdminAgendamentos() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadAppointments() {
      if (!user) return;
      try {
        const qTenants = query(collection(db, "tenants"), where("ownerId", "==", user.uid));
        const tenantSnap = await getDocs(qTenants);
        const tenantList = tenantSnap.docs.map(d => ({ id: d.id, ...d.data() } as Tenant));
        
        let allAppointments: AppointmentRow[] = [];
        
        for (const t of tenantList) {
          const servicesSnap = await getDocs(collection(db, `tenants/${t.id}/services`));
          const servicesMap = new Map();
          servicesSnap.docs.forEach(d => servicesMap.set(d.id, d.data().name));

          const profSnap = await getDocs(collection(db, `tenants/${t.id}/professionals`));
          const profMap = new Map();
          profSnap.docs.forEach(d => profMap.set(d.id, d.data().name));

          const apptSnap = await getDocs(collection(db, `tenants/${t.id}/appointments`));
          const appts = apptSnap.docs.map(d => {
            const data = d.data() as Appointment;
            return {
              ...data,
              id: d.id,
              tenantId: t.id, // needed for updates
              tenantName: t.name,
              serviceName: servicesMap.get(data.serviceId) || 'Serviço Excluído',
              professionalName: profMap.get(data.professionalId) || 'Profissional Excluído'
            } as AppointmentRow & { tenantId: string };
          });
          allAppointments = [...allAppointments, ...appts];
        }

        allAppointments.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateB.getTime() - dateA.getTime();
        });

        setAppointments(allAppointments);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadAppointments();
  }, [user]);

  const toggleStatus = async (appt: AppointmentRow & { tenantId: string }) => {
    const newStatus = appt.status === 'confirmed' ? 'pending' : 'confirmed';
    try {
      await updateDoc(doc(db, `tenants/${appt.tenantId}/appointments`, appt.id), {
        status: newStatus
      });
      setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: newStatus } : a));
    } catch (e) {
      toast.error("Erro ao atualizar status.");
    }
  };

  const filteredAppointments = appointments.filter(a => 
    a.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageTransition className="p-6 md:p-8 max-w-6xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-medium text-brand-900 tracking-tight mb-2">Agendamentos</h1>
          <p className="text-brand-600">Acompanhe todos os agendamentos da sua loja.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative group">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-brand-400 group-focus-within:text-brand-900 transition-colors" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, loja ou serviço..." 
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-brand-200 outline-none focus:ring-2 focus:ring-brand-900/20 focus:border-brand-900 transition-all bg-white shadow-sm text-brand-900 placeholder:text-brand-400"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-brand-100 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-brand-900 mb-4" />
            <p className="text-brand-500">Buscando agendamentos...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px]">
            <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-4">
              <CalendarIcon className="w-8 h-8 text-brand-400" />
            </div>
            <p className="font-medium text-brand-900 text-lg mb-1">Nenhum resultado</p>
            <p className="text-brand-500">Não localizamos nenhum agendamento com esse termo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-brand-100">
                  <th className="px-6 py-4 text-xs font-semibold text-brand-500 uppercase tracking-wider w-[30%]">Cliente</th>
                  <th className="px-6 py-4 text-xs font-semibold text-brand-500 uppercase tracking-wider w-[30%]">Serviço & Loja</th>
                  <th className="px-6 py-4 text-xs font-semibold text-brand-500 uppercase tracking-wider w-[20%]">Data / Hora</th>
                  <th className="px-6 py-4 text-xs font-semibold text-brand-500 uppercase tracking-wider w-[20%] text-right bg-transparent">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {filteredAppointments.map((agendamento) => (
                  <tr key={agendamento.id} className="hover:bg-brand-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-medium uppercase border border-brand-200">
                          {agendamento.customerName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-brand-900 text-sm">{agendamento.customerName}</p>
                          <p className="text-sm text-brand-500 mt-0.5">{agendamento.customerPhone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-brand-900 font-medium text-sm mb-1">{agendamento.serviceName}</p>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-brand-50 text-brand-600 text-xs font-medium rounded-md border border-brand-100">
                        {agendamento.tenantName}
                      </span>
                      <p className="text-xs text-brand-500 mt-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-300"></span>
                        {agendamento.professionalName}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-brand-900 text-sm font-medium mb-1">
                        <CalendarIcon className="w-4 h-4 text-brand-400" /> 
                        {new Date(agendamento.date + "T" + agendamento.time).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-brand-500">
                        <Clock className="w-4 h-4 text-brand-300" /> {agendamento.time}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => toggleStatus(agendamento as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                        agendamento.status === 'confirmed' ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${agendamento.status === 'confirmed' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        {agendamento.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                        <ChevronDown className="w-3.5 h-3.5 opacity-50 ml-1" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
