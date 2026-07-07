import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { format, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ChevronLeft, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  CheckCircle2, 
  ArrowRight,
  Scissors,
  Sparkles,
  Activity,
  Loader2,
  Star
} from "lucide-react";
import { Service, Professional } from "../types";
import { cn } from "../lib/utils";
import { db } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"
];

type BookingWizardProps = {
  tenantId: string;
  services: Service[];
  professionals: Professional[];
};

export function BookingWizard({ tenantId, services, professionals }: BookingWizardProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customer, setCustomer] = useState({ name: "", phone: "" });

  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const handleSendReview = async () => {
    if (reviewSubmitting) return;
    setReviewSubmitting(true);
    try {
      const reviewId = Math.random().toString(36).substring(2, 10);
      const docRef = doc(db, `tenants/${tenantId}/reviews`, reviewId);
      await setDoc(docRef, {
        rating: Number(rating),
        comment: reviewComment.trim() || "Excelente serviço!",
        customerName: customer.name || "Cliente Satisfeito",
        serviceName: selectedServiceData?.name || "Cortes",
        createdAt: serverTimestamp()
      });
      setReviewSubmitted(true);
      toast.success("Obrigado pelo seu comentário e avaliação!");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível registrar a avaliação agora.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const goToStep = (newStep: number) => {
    setDirection(newStep > step ? 1 : -1);
    setStep(newStep);
  };

  const handleNext = () => goToStep(step + 1);
  const handleBack = () => goToStep(step - 1);

  const selectedServiceData = services.find(s => s.id === selectedService);
  const selectedProfessionalData = professionals.find(p => p.id === selectedProfessional);

  // Auto-select first available working day when professional or step changes
  useEffect(() => {
    if (step === 3 && selectedProfessionalData) {
      let tempDate = new Date();
      for (let i = 0; i < 15; i++) {
        const dateToCheck = addDays(new Date(), i);
        const dayOfWeek = dateToCheck.getDay();
        const isWorkingDay = selectedProfessionalData.workingDays
          ? selectedProfessionalData.workingDays.includes(dayOfWeek)
          : dayOfWeek !== 0; // Default to Monday-Saturday if not specified

        if (isWorkingDay) {
          setSelectedDate(dateToCheck);
          setSelectedTime(null);
          break;
        }
      }
    }
  }, [step, selectedProfessional, selectedProfessionalData]);

  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedProfessional || !selectedTime) return;
    
    setIsSubmitting(true);
    try {
      const appointmentId = Math.random().toString(36).substring(2, 10);
      const docRef = doc(db, `tenants/${tenantId}/appointments`, appointmentId);
      
      await setDoc(docRef, {
        serviceId: selectedService,
        professionalId: selectedProfessional,
        date: format(selectedDate, "yyyy-MM-dd"),
        time: selectedTime,
        customerName: customer.name,
        customerPhone: customer.phone,
        createdAt: serverTimestamp(),
        status: 'pending'
      });
      
      goToStep(5); // Success step
    } catch (e) {
      console.error(e);
      toast.error("Houve um erro ao confirmar seu agendamento. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 30 : -30,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 30 : -30,
      opacity: 0,
    }),
  };


  return (
    <div className="max-w-2xl mx-auto w-full pt-4 sm:pt-12 md:pt-24 pb-12 px-4">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-medium text-brand-900">
            {step === 1 && "Escolha o Serviço"}
            {step === 2 && "Escolha o Profissional"}
            {step === 3 && "Escolha Data e Hora"}
            {step === 4 && "Seus Dados"}
            {step === 5 && "Agendamento Confirmado!"}
          </h2>
          {step > 1 && step < 5 && (
            <button 
              onClick={handleBack}
              className="flex items-center text-sm font-medium text-brand-600 hover:text-brand-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Voltar
            </button>
          )}
        </div>
        
        {step < 5 && (
          <div className="flex gap-2 h-1.5 w-full bg-brand-100 rounded-full overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i}
                className={cn(
                  "h-full flex-1 transition-colors duration-300",
                  i <= step ? "bg-brand-600" : "bg-transparent"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Main Form Area */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full"
          >
            {/* STEP 1: SERVICE */}
            {step === 1 && (
              <div className="space-y-4">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service.id);
                      setSelectedProfessional(null); // Reset prof on service change
                      setTimeout(() => goToStep(2), 200);
                    }}
                    className={cn(
                      "w-full text-left p-5 rounded-2xl border transition-all duration-200 group flex items-start gap-4",
                      selectedService === service.id 
                        ? "border-brand-600 bg-white ring-1 ring-brand-600 shadow-sm"
                        : "border-brand-200 bg-white/60 hover:bg-white hover:border-brand-300"
                    )}
                  >
                    <div className={cn(
                      "p-3 rounded-xl transition-colors",
                      selectedService === service.id ? "bg-brand-100 text-brand-700" : "bg-brand-50 text-brand-500 group-hover:bg-brand-100"
                    )}>
                      <Sparkles className="w-5 h-5"/>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-medium text-brand-900">{service.name}</h3>
                        <span className="font-medium text-brand-900">R$ {service.price}</span>
                      </div>
                      <p className="text-sm text-brand-500 mb-2">{service.description}</p>
                      <div className="flex items-center text-xs font-medium text-brand-500 gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {service.duration} min
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* STEP 2: PROFESSIONAL */}
            {step === 2 && (
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {professionals.filter(p => !selectedService || p.serviceIds.includes(selectedService)).map((prof) => (
                  <button
                    key={prof.id}
                    onClick={() => {
                      setSelectedProfessional(prof.id);
                      setTimeout(() => goToStep(3), 200);
                    }}
                    className={cn(
                      "flex flex-col items-center text-center p-4 sm:p-6 rounded-2xl border transition-all duration-200",
                      selectedProfessional === prof.id
                        ? "border-brand-600 bg-white ring-1 ring-brand-600 shadow-sm"
                        : "border-brand-200 bg-white/60 hover:bg-white hover:border-brand-300"
                    )}
                  >
                    <img 
                      src={prof.avatar} 
                      alt={prof.name}
                      className="w-20 h-20 rounded-full object-cover mb-4 border-2 border-brand-50"
                    />
                    <h3 className="font-medium text-brand-900 mb-1">{prof.name}</h3>
                    <p className="text-sm text-brand-500">{prof.role}</p>
                  </button>
                ))}
                {professionals.filter(p => !selectedService || p.serviceIds.includes(selectedService)).length === 0 && (
                  <div className="col-span-2 text-center py-12 text-brand-500">
                    Nenhum profissional disponível para este serviço no momento.
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: DATE & TIME */}
            {step === 3 && (
              <div className="space-y-8">
                {/* Date Selector */}
                <div>
                  <h3 className="text-sm font-medium text-brand-700 mb-3 ml-1 uppercase tracking-wider">Selecione o Dia</h3>
                  <div className="flex overflow-x-auto gap-3 pb-4 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((i) => {
                      const date = addDays(new Date(), i);
                      
                      const dayOfWeek = date.getDay();
                      // Respect the professional's custom working days
                      const isWorkingDay = selectedProfessionalData?.workingDays
                        ? selectedProfessionalData.workingDays.includes(dayOfWeek)
                        : dayOfWeek !== 0; // Default: Seg a Sáb (pula Domingo)

                      if (!isWorkingDay) return null;
                      
                      const isSelected = isSameDay(date, selectedDate);
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            setSelectedDate(date);
                            setSelectedTime(null);
                          }}
                          className={cn(
                            "flex flex-col items-center min-w-[72px] p-3 rounded-2xl border snap-start transition-all",
                            isSelected 
                              ? "bg-brand-900 text-white border-brand-900 shadow-md transform scale-105" 
                              : "bg-white border-brand-100 text-brand-600 hover:border-brand-300"
                          )}
                        >
                          <span className="text-xs font-medium uppercase mb-1 opacity-80">
                            {format(date, "EEE", { locale: ptBR })}
                          </span>
                          <span className="text-xl">
                            {format(date, "dd")}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Selector */}
                <div>
                  <h3 className="text-sm font-medium text-brand-700 mb-3 ml-1 uppercase tracking-wider">Horários Disponíveis</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                    {TIME_SLOTS.map((time, i) => {
                      // Randomly disable some slots to look realistic (using index + date to be deterministic)
                      const disableMask = (i + selectedDate.getDate()) % 5 === 0;
                      
                      return (
                        <button
                          key={time}
                          disabled={disableMask}
                          onClick={() => {
                            setSelectedTime(time);
                            setTimeout(() => goToStep(4), 200);
                          }}
                          className={cn(
                            "py-2.5 rounded-xl text-sm font-medium border transition-all",
                            disableMask 
                              ? "opacity-40 bg-brand-50 border-brand-100 cursor-not-allowed line-through text-brand-300"
                              : selectedTime === time
                                ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                                : "bg-white border-brand-200 text-brand-700 hover:border-brand-400 hover:bg-brand-50"
                          )}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: CUSTOMER DETAILS */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-brand-100 shadow-sm mb-6">
                  <h3 className="text-lg text-brand-900 mb-4">Resumo do Agendamento</h3>
                  
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <div className="mt-0.5 text-brand-400"><Scissors className="w-5 h-5"/></div>
                      <div>
                        <p className="font-medium text-brand-900">{selectedServiceData?.name}</p>
                        <p className="text-sm text-brand-500">Duração: {selectedServiceData?.duration} min • R$ {selectedServiceData?.price}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 items-start">
                      <div className="mt-0.5 text-brand-400"><User className="w-5 h-5"/></div>
                      <div>
                        <p className="font-medium text-brand-900">Com {selectedProfessionalData?.name}</p>
                        <p className="text-sm text-brand-500">{selectedProfessionalData?.role}</p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <div className="mt-0.5 text-brand-400"><CalendarIcon className="w-5 h-5"/></div>
                      <div>
                        <p className="font-medium text-brand-900">
                          {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                        </p>
                        <p className="text-sm text-brand-500">Às {selectedTime}h</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-700 mb-1.5 ml-1">Seu Nome Completo</label>
                    <input 
                      type="text" 
                      value={customer.name}
                      onChange={e => setCustomer({...customer, name: e.target.value})}
                      placeholder="Ex: Maria Beatriz Silva"
                      className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-700 mb-1.5 ml-1">WhatsApp</label>
                    <input 
                      type="tel" 
                      value={customer.phone}
                      onChange={e => setCustomer({...customer, phone: e.target.value})}
                      placeholder="(00) 00000-0000"
                      className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: SUCCESS */}
            {step === 5 && (
              <div className="text-center py-6 flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
                  className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4 border border-emerald-100"
                >
                  <CheckCircle2 className="w-8 h-8" />
                </motion.div>
                <h3 className="text-2xl font-medium text-brand-900 mb-2">Tudo Certo, {customer.name.split(' ')[0]}!</h3>
                <p className="text-brand-600 mb-6 max-w-sm text-sm">
                  Seu agendamento para <strong>{selectedServiceData?.name}</strong> foi confirmado para {format(selectedDate, "dd/MM")} às {selectedTime}h com {selectedProfessionalData?.name}.
                </p>



                <button 
                  onClick={() => {
                    setStep(1);
                    setSelectedService(null);
                    setSelectedProfessional(null);
                    setSelectedTime(null);
                    setCustomer({ name: "", phone: "" });
                    setRating(5);
                    setReviewComment("");
                    setReviewSubmitted(false);
                  }}
                  className="px-6 py-2.5 bg-brand-50 hover:bg-brand-100 text-brand-800 rounded-xl font-medium text-sm transition-colors border border-brand-100 cursor-pointer"
                >
                  Fazer novo agendamento
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Nav Controls */}
      {step < 5 && (
        <div className="mt-8 pt-6 border-t border-brand-100 flex justify-end">
          <button
            onClick={step === 4 ? handleConfirmBooking : handleNext}
            disabled={
              (step === 1 && !selectedService) ||
              (step === 2 && !selectedProfessional) ||
              (step === 3 && !selectedTime) ||
              (step === 4 && (!customer.name || customer.phone.length < 10 || isSubmitting))
            }
            className="flex items-center gap-2 px-8 py-3.5 bg-brand-800 hover:bg-brand-900 disabled:opacity-50 disabled:hover:bg-brand-800 text-white rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            {step === 4 ? (
              isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirmando...</> : "Confirmar Agendamento"
            ) : "Continuar"}
            {step < 4 && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
}
