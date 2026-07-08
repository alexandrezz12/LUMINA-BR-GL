import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Scissors, 
  Sparkles, 
  Clock, 
  Calendar, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Zap, 
  TrendingUp, 
  Users, 
  Smartphone, 
  MessageSquare, 
  HelpCircle,
  Building,
  UserCheck,
  Check,
  DollarSign,
  Share2,
  Eye,
  Shield,
  Bell,
  Lock,
  CalendarDays,
  RefreshCw,
  BarChart3,
  ChevronRight,
  Menu,
  X,
  Star,
  SmartphoneIcon,
  Laptop
} from "lucide-react";
import { useAuth } from "../lib/AuthProvider";
import { toast } from "sonner";

export function LandingPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/admin");
    }
  }, [user, navigate]);

  // States for interactive product demo
  const [activeDemoTab, setActiveDemoTab] = useState<"booking" | "calendar" | "team" | "financial">("booking");
  
  // Interactive Customer Booking State
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState<number>(1);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // States for interactive dashboard quick-actions
  const [blockedSlots, setBlockedSlots] = useState<string[]>([]);
  const [simulatedAppointments, setSimulatedAppointments] = useState<any[]>([
    { id: 1, time: "09:00", customer: "Carlos Souza", service: "Corte Degradê", status: "finished", professional: "Thiago" },
    { id: 2, time: "10:30", customer: "Ana Beatriz", service: "Mechas + Escova", status: "confirmed", professional: "Mariana" },
    { id: 3, time: "14:00", customer: "Bruno Alencar", service: "Barba Terapia", status: "link", professional: "Thiago" },
  ]);

  const handleStartTrial = () => {
    if (user) {
      navigate("/admin");
    } else {
      navigate("/login");
    }
  };

  // Run a quick simulation of automatic WhatsApp notification trigger
  const triggerBookingSimulation = () => {
    if (!selectedService || !selectedProfessional || !selectedTime) {
      toast.error("Por favor, selecione o serviço, profissional e horário no simulador!");
      return;
    }
    setIsSubmittingBooking(true);
    setTimeout(() => {
      setBookingStep(2);
      setIsSubmittingBooking(false);
      toast.success("Demonstração: Notificação enviada para o cliente no WhatsApp!");
      
      // Sync into simulated dashboard appointments dynamically
      const newAppt = {
        id: Date.now(),
        time: selectedTime,
        customer: "Você (Simulador)",
        service: selectedService,
        status: "link",
        professional: selectedProfessional
      };
      setSimulatedAppointments(prev => [
        ...prev.filter(a => a.time !== selectedTime),
        newAppt
      ].sort((a, b) => a.time.localeCompare(b.time)));
    }, 1200);
  };

  const resetBookingSimulator = () => {
    setSelectedService(null);
    setSelectedProfessional(null);
    setSelectedTime(null);
    setBookingStep(1);
  };

  const toggleBlockSlot = (time: string) => {
    if (blockedSlots.includes(time)) {
      setBlockedSlots(prev => prev.filter(t => t !== time));
      toast.success(`Horário das ${time} desbloqueado com sucesso.`);
    } else {
      setBlockedSlots(prev => [...prev, time]);
      setSimulatedAppointments(prev => prev.filter(a => a.time !== time));
      toast.success(`Horário das ${time} bloqueado temporariamente.`);
    }
  };

  return (
    <div className="min-h-screen bg-brand-950 text-white selection:bg-brand-800 selection:text-white font-sans overflow-x-hidden antialiased">
      
      {/* Decorative Grid and Ambient Lights */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      
      {/* Dynamic Ambient Blur Orbs */}
      <div className="absolute top-0 left-1/2 w-[800px] h-[350px] bg-brand-800/10 rounded-full blur-[130px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-[800px] left-10 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[1000px] right-10 w-[600px] h-[600px] bg-brand-700/5 rounded-full blur-[180px] pointer-events-none" />

      {/* Premium Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-brand-950/80 border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-10 h-10 bg-brand-900/60 rounded-xl flex items-center justify-center border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <Scissors className="w-5 h-5 text-amber-200" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-white leading-none">Lumina</span>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-300 mt-1">Agendamento Premium</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-brand-300">
            <a href="#demo" className="hover:text-white transition-all hover:scale-95 duration-150">Demonstração</a>
            <a href="#how-it-works" className="hover:text-white transition-all hover:scale-95 duration-150">Como funciona</a>
            <a href="#features" className="hover:text-white transition-all hover:scale-95 duration-150">Recursos</a>
            <a href="#pricing" className="hover:text-white transition-all hover:scale-95 duration-150">Planos</a>
            <a href="#faq" className="hover:text-white transition-all hover:scale-95 duration-150">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <Link 
                to="/admin" 
                className="px-5 py-2.5 bg-white hover:bg-brand-50 text-brand-950 text-sm font-semibold rounded-xl transition-all shadow-[0_4px_12px_rgba(255,255,255,0.08)] flex items-center gap-2 active:scale-95"
              >
                Ir para o Painel <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <button 
                  onClick={() => navigate("/login")} 
                  className="text-sm font-semibold text-brand-300 hover:text-white transition-colors cursor-pointer"
                >
                  Entrar no sistema
                </button>
                <button 
                  onClick={handleStartTrial}
                  className="px-5 py-2.5 bg-brand-900 hover:bg-brand-850 text-white text-sm font-semibold rounded-xl transition-all border border-white/[0.08] shadow-lg flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  Criar conta grátis
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Icon */}
          <button 
            className="md:hidden p-2 text-brand-200 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-brand-950 border-b border-white/[0.06] overflow-hidden"
            >
              <div className="px-6 py-6 space-y-4 flex flex-col text-base font-medium text-brand-300">
                <a href="#demo" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-2 border-b border-white/[0.02]">Demonstração</a>
                <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-2 border-b border-white/[0.02]">Como funciona</a>
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-2 border-b border-white/[0.02]">Recursos</a>
                <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-2 border-b border-white/[0.02]">Planos</a>
                <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-2">FAQ</a>
                
                <div className="pt-4 space-y-3">
                  {user ? (
                    <Link 
                      to="/admin" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-3 bg-white text-brand-950 font-bold rounded-xl text-center block"
                    >
                      Ir para o Painel
                    </Link>
                  ) : (
                    <>
                      <button 
                        onClick={() => { navigate("/login"); setMobileMenuOpen(false); }} 
                        className="w-full py-3 border border-white/[0.08] text-white font-semibold rounded-xl text-center block bg-brand-900/30 cursor-pointer"
                      >
                        Entrar
                      </button>
                      <button 
                        onClick={() => { navigate("/login"); setMobileMenuOpen(false); }}
                        className="w-full py-3 bg-brand-900 text-white font-bold rounded-xl text-center block cursor-pointer"
                      >
                        Começar 7 dias grátis
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-28 md:pb-24 max-w-7xl mx-auto px-6 sm:px-8 text-center space-y-12">
        
        {/* Dynamic Trust Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-900/40 text-amber-200 text-xs font-bold uppercase tracking-wider border border-amber-500/20 shadow-[0_0_15px_rgba(167,187,177,0.05)]"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" /> Teste de 7 dias grátis — Sem cartão de crédito
        </motion.div>

        {/* Headings - Copy-oriented to convert B2B pain points */}
        <div className="space-y-6 max-w-4xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05] text-white font-sans"
          >
            Pare de confirmar horários pelo <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-100 to-white">WhatsApp</span>.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-brand-200 text-lg sm:text-xl md:text-2xl font-light max-w-3xl mx-auto leading-relaxed"
          >
            Seus clientes agendam sozinhos 24h por dia. Organize sua equipe, reduza cancelamentos e eleve a imagem do seu negócio com o link mais premium do mercado.
          </motion.p>
        </div>

        {/* Action Buttons & Micro Social Proof */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto"
        >
          <button 
            onClick={handleStartTrial}
            className="w-full sm:w-auto px-8 py-4.5 bg-white hover:bg-brand-50 text-brand-950 font-bold rounded-2xl transition-all hover:scale-[1.02] shadow-[0_20px_40px_rgba(255,255,255,0.06)] flex items-center justify-center gap-3 text-base group cursor-pointer"
          >
            Começar Grátis Agora <ArrowRight className="w-5 h-5 text-brand-950 group-hover:translate-x-1 transition-transform" />
          </button>
          <a 
            href="#demo"
            className="w-full sm:w-auto px-8 py-4.5 bg-brand-900/40 hover:bg-brand-900/75 text-brand-100 border border-white/[0.08] font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 text-base active:scale-95"
          >
            Ver Demonstração Live
          </a>
        </motion.div>

        {/* Quick Value Pillars */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 max-w-4xl mx-auto border-t border-white/[0.04]"
        >
          <div className="flex items-center justify-center gap-2 text-brand-300 text-sm">
            <CheckCircle2 className="w-4 h-4 text-amber-200" />
            <span>Setup pronto em 5 minutos</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-brand-300 text-sm">
            <CheckCircle2 className="w-4 h-4 text-amber-200" />
            <span>Notificações automáticas</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-brand-300 text-sm">
            <CheckCircle2 className="w-4 h-4 text-amber-200" />
            <span>90% menos tempo no WhatsApp</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-brand-300 text-sm">
            <CheckCircle2 className="w-4 h-4 text-amber-200" />
            <span>Sincronização 2 vias</span>
          </div>
        </motion.div>
      </section>

      {/* Interactive Product Demonstration (The Centerpiece) */}
      <section id="demo" className="py-20 bg-brand-950 relative border-t border-white/[0.03]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-12">
          
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-xs uppercase tracking-widest font-extrabold text-amber-200 px-3 py-1 bg-brand-900/40 rounded-full border border-amber-500/10">PREVIEW INTERATIVO</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Experimente o sistema agora mesmo</h2>
            <p className="text-brand-300 text-sm sm:text-base leading-relaxed">
              Desenvolvemos uma interface limpa inspirada nos maiores produtos SaaS do mundo. Alterne entre os painéis abaixo e teste como funciona para o seu cliente e para você.
            </p>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex flex-row overflow-x-auto hide-scrollbar md:flex-wrap md:justify-center items-center gap-2 max-w-3xl mx-auto bg-brand-900/30 p-1.5 rounded-2xl border border-white/[0.04] w-full">
            <button
              onClick={() => setActiveDemoTab("booking")}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${activeDemoTab === "booking" ? "bg-white text-brand-950 shadow-md" : "text-brand-300 hover:text-white"}`}
            >
              <Smartphone className={`w-4 h-4 ${activeDemoTab === "booking" ? "text-brand-600" : "text-brand-400"}`} /> Link do Cliente (Agendamento)
            </button>
            <button
              onClick={() => setActiveDemoTab("calendar")}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${activeDemoTab === "calendar" ? "bg-white text-brand-950 shadow-md" : "text-brand-300 hover:text-white"}`}
            >
              <Calendar className={`w-4 h-4 ${activeDemoTab === "calendar" ? "text-brand-600" : "text-brand-400"}`} /> Agenda do Negócio
            </button>
            <button
              onClick={() => setActiveDemoTab("team")}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${activeDemoTab === "team" ? "bg-white text-brand-950 shadow-md" : "text-brand-300 hover:text-white"}`}
            >
              <Users className={`w-4 h-4 ${activeDemoTab === "team" ? "text-brand-600" : "text-brand-400"}`} /> Escala da Equipe
            </button>
            <button
              onClick={() => setActiveDemoTab("financial")}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${activeDemoTab === "financial" ? "bg-white text-brand-950 shadow-md" : "text-brand-300 hover:text-white"}`}
            >
              <BarChart3 className={`w-4 h-4 ${activeDemoTab === "financial" ? "text-brand-600" : "text-brand-400"}`} /> Painel Financeiro
            </button>
          </div>

          {/* Main Simulated Area Container */}
          <div className="bg-brand-900/10 border border-white/[0.06] rounded-[2.5rem] p-4 sm:p-8 shadow-3xl backdrop-blur-md max-w-5xl mx-auto min-h-[500px] flex flex-col justify-between">
            
            <AnimatePresence mode="wait">
              
              {/* Tab 1: Booking Link Sim */}
              {activeDemoTab === "booking" && (
                <motion.div
                  key="booking"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
                >
                  {/* Explanation Column */}
                  <div className="md:col-span-5 space-y-6 order-2 md:order-1">
                    <div className="space-y-3">
                      <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/10">VISÃO DO CLIENTE</span>
                      <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Como seu cliente fará o agendamento</h3>
                      <p className="text-brand-300 text-sm leading-relaxed">
                        Esqueça a troca de áudios no WhatsApp. O cliente clica no seu link do Instagram, escolhe o serviço, profissional, horário ideal e confirma. 
                      </p>
                    </div>

                    <div className="space-y-4 bg-brand-900/30 p-5 rounded-2xl border border-white/[0.04]">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-200">Simule agora no celular ao lado:</h4>
                      <ol className="text-xs text-brand-200 space-y-2.5 list-decimal list-inside">
                        <li>Selecione um <strong>Serviço</strong></li>
                        <li>Escolha um <strong>Profissional</strong></li>
                        <li>Selecione o <strong>Horário</strong> conveniente</li>
                        <li>Clique em <strong>Confirmar Agendamento</strong></li>
                      </ol>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={handleStartTrial}
                        className="px-5 py-3 bg-white text-brand-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                      >
                        Quero um link assim <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* High-Fidelity Mobile UI Simulation */}
                  <div className="md:col-span-7 flex justify-center order-1 md:order-2">
                    <div className="w-full max-w-[320px] bg-brand-950 border-[6px] border-brand-900/90 rounded-[2.5rem] shadow-2xl relative overflow-hidden aspect-[9/18] flex flex-col justify-between">
                      {/* Speaker notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-4 bg-brand-900/90 rounded-b-xl z-20 flex items-center justify-center">
                        <div className="w-8 h-1 bg-brand-950 rounded-full" />
                      </div>

                      {/* Phone Screen Header */}
                      <div className="bg-brand-900/40 p-4 pt-6 border-b border-white/[0.04] text-center space-y-1">
                        <span className="text-[9px] uppercase tracking-wider text-amber-300 font-extrabold">LUMINA RESERVAS</span>
                        <h4 className="text-sm font-bold text-white">Barbearia Don Corleone</h4>
                        <p className="text-[10px] text-brand-400">Goiânia, GO</p>
                      </div>

                      {/* Phone Screen Scrollable Area */}
                      <div className="p-4 flex-1 overflow-y-auto space-y-5 hide-scrollbar text-left text-xs">
                        {bookingStep === 1 ? (
                          <>
                            {/* Step 1: Services */}
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">1. Selecione o Serviço</span>
                              <div className="space-y-1.5">
                                {[
                                  { name: "Corte Degradê Premium", price: "R$ 55", duration: "40 min" },
                                  { name: "Barba Terapia + Toalha Quente", price: "R$ 45", duration: "30 min" },
                                  { name: "Combo Don Corleone (Corte + Barba)", price: "R$ 90", duration: "70 min" },
                                ].map((serv) => (
                                  <button
                                    key={serv.name}
                                    onClick={() => setSelectedService(serv.name)}
                                    className={`w-full p-2.5 rounded-xl border text-left transition-all flex justify-between items-center ${selectedService === serv.name ? "bg-amber-500/10 border-amber-500/50 text-white" : "bg-brand-900/20 border-white/[0.04] text-brand-300"}`}
                                  >
                                    <div>
                                      <p className="font-semibold text-[11px]">{serv.name}</p>
                                      <p className="text-[9px] text-brand-400">{serv.duration}</p>
                                    </div>
                                    <span className="font-bold text-amber-200 text-[11px]">{serv.price}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Step 2: Professional */}
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">2. Selecione o Profissional</span>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  { name: "Thiago Santos", desc: "Especialista Degradê" },
                                  { name: "Mariana Alencar", desc: "Estilo & Barba" },
                                ].map((prof) => (
                                  <button
                                    key={prof.name}
                                    onClick={() => setSelectedProfessional(prof.name)}
                                    className={`p-2 rounded-xl border text-left transition-all ${selectedProfessional === prof.name ? "bg-amber-500/10 border-amber-500/50 text-white" : "bg-brand-900/20 border-white/[0.04] text-brand-300"}`}
                                  >
                                    <p className="font-bold text-[10px]">{prof.name}</p>
                                    <p className="text-[8px] text-brand-400 mt-0.5">{prof.desc}</p>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Step 3: Hours */}
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">3. Horário Disponível</span>
                              <div className="grid grid-cols-4 gap-1.5">
                                {["09:00", "10:30", "14:00", "15:30", "16:30", "17:40"].map((time) => (
                                  <button
                                    key={time}
                                    onClick={() => setSelectedTime(time)}
                                    className={`py-2 rounded-lg text-[10px] font-bold text-center border transition-all ${selectedTime === time ? "bg-amber-500 text-brand-950 border-amber-500" : "bg-brand-900/20 border-white/[0.04] text-brand-300"}`}
                                  >
                                    {time}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : (
                          // Success screen
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="py-6 text-center space-y-4"
                          >
                            <div className="w-12 h-12 bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                              <CheckCircle2 className="w-7 h-7" />
                            </div>
                            <div className="space-y-1">
                              <h5 className="font-bold text-white text-sm">Agendamento Confirmado!</h5>
                              <p className="text-[10px] text-brand-300">Seu horário foi sincronizado e reservado com sucesso no Lumina.</p>
                            </div>
                            <div className="bg-brand-900/40 p-3 rounded-xl border border-white/[0.04] text-left space-y-1">
                              <p className="text-[9px] text-brand-400">RESUMO:</p>
                              <p className="text-[10px] font-bold text-white">✂️ {selectedService}</p>
                              <p className="text-[10px] text-brand-200">👤 Profissional: {selectedProfessional}</p>
                              <p className="text-[10px] text-brand-200">📅 Horário: Hoje às {selectedTime}</p>
                            </div>
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl text-center">
                              <p className="text-[9px] text-emerald-300 font-semibold flex items-center justify-center gap-1">
                                <MessageSquare className="w-3 h-3" /> WhatsApp de Confirmação Enviado!
                              </p>
                            </div>
                            <button
                              onClick={resetBookingSimulator}
                              className="px-4 py-2 bg-brand-900 text-white rounded-lg text-[10px] font-bold tracking-wider uppercase hover:bg-brand-800 transition-colors mx-auto"
                            >
                              Agendar Outro
                            </button>
                          </motion.div>
                        )}
                      </div>

                      {/* Phone Screen Footer Button */}
                      {bookingStep === 1 && (
                        <div className="p-3 bg-brand-900/30 border-t border-white/[0.04]">
                          <button
                            onClick={triggerBookingSimulation}
                            disabled={isSubmittingBooking || !selectedService || !selectedProfessional || !selectedTime}
                            className="w-full py-3 bg-amber-500 disabled:opacity-40 hover:bg-amber-400 text-brand-950 font-bold rounded-xl transition-all flex items-center justify-center gap-1 text-[11px] tracking-wider uppercase cursor-pointer"
                          >
                            {isSubmittingBooking ? (
                              <span>Reservando...</span>
                            ) : (
                              <span className="flex items-center gap-1">Confirmar Agendamento <ArrowRight className="w-3.5 h-3.5" /></span>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tab 2: Dashboard Calendar Sim */}
              {activeDemoTab === "calendar" && (
                <motion.div
                  key="calendar"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
                >
                  <div className="md:col-span-4 space-y-6 order-2 md:order-1">
                    <div>
                      <span className="text-[10px] font-bold tracking-widest text-amber-300 uppercase bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/10">VISÃO DO ADMIN</span>
                      <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-3">Sua Agenda Inteligente</h3>
                      <p className="text-brand-300 text-sm leading-relaxed mt-1">
                        Visualize em tempo real todos os compromissos agendados por clientes ou adicionados manualmente pela recepção. 
                      </p>
                    </div>

                    <div className="space-y-3 bg-brand-900/30 p-5 rounded-2xl border border-white/[0.04]">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-200">Experimente no calendário ao lado:</h4>
                      <p className="text-xs text-brand-300 leading-relaxed">
                        Precisa de um tempo livre para almoço ou reunião? Clique em <strong>"Bloquear Horário"</strong> na lista para trancar instantaneamente os horários do link de reservas do cliente!
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={handleStartTrial}
                        className="px-5 py-3 bg-white text-brand-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                      >
                        Experimentar Grátis <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Calendar Desktop Simulation */}
                  <div className="md:col-span-8 bg-brand-950 rounded-2xl border border-white/[0.06] p-4 space-y-4 order-1 md:order-2">
                    <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-amber-200" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Calendário Semanal Integrado</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-brand-900/50 rounded-full text-brand-300">Hoje</span>
                    </div>

                    {/* Timeline Grid */}
                    <div className="space-y-2.5">
                      {["09:00", "10:30", "14:00", "15:30", "16:30"].map((time) => {
                        const appt = simulatedAppointments.find(a => a.time === time);
                        const isBlocked = blockedSlots.includes(time);

                        return (
                          <div key={time} className="flex gap-3 items-center text-xs">
                            <span className="w-10 font-bold text-brand-400 shrink-0 text-right">{time}</span>
                            
                            {isBlocked ? (
                              <div className="flex-1 bg-red-950/20 border border-red-500/20 p-2.5 rounded-xl flex justify-between items-center text-red-300">
                                <span className="font-medium">🔒 Horário Bloqueado (Almoço / Particular)</span>
                                <button 
                                  onClick={() => toggleBlockSlot(time)}
                                  className="text-[9px] uppercase font-bold text-red-400 hover:underline"
                                >
                                  Desbloquear
                                </button>
                              </div>
                            ) : appt ? (
                              <div className={`flex-1 p-2.5 rounded-xl border flex justify-between items-center ${appt.status === 'finished' ? "bg-brand-900/30 border-white/[0.04] text-brand-300" : "bg-brand-900/60 border-amber-500/20 text-white"}`}>
                                <div className="space-y-0.5">
                                  <p className="font-bold">{appt.customer} <span className="text-[9px] font-normal text-brand-400">({appt.service})</span></p>
                                  <p className="text-[9px] text-brand-400">Atendido por: {appt.professional}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${appt.status === 'finished' ? "bg-brand-900 text-brand-400" : "bg-amber-500/10 text-amber-200 border border-amber-500/20"}`}>
                                    {appt.status === 'finished' ? 'Finalizado' : 'Via Link 🔗'}
                                  </span>
                                  <button 
                                    onClick={() => toggleBlockSlot(time)}
                                    className="p-1 hover:bg-brand-950 rounded text-brand-400 hover:text-red-400 transition-colors"
                                    title="Bloquear Horário"
                                  >
                                    <Lock className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex-1 border border-dashed border-white/[0.05] p-2.5 rounded-xl flex justify-between items-center text-brand-400 group">
                                <span className="italic text-[11px]">Disponível para agendamentos</span>
                                <button
                                  onClick={() => toggleBlockSlot(time)}
                                  className="text-[9px] uppercase font-bold text-amber-200 hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  Bloquear Horário
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tab 3: Team Scale Sim */}
              {activeDemoTab === "team" && (
                <motion.div
                  key="team"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
                >
                  <div className="md:col-span-5 space-y-6 order-2 md:order-1">
                    <div>
                      <span className="text-[10px] font-bold tracking-widest text-amber-300 uppercase bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/10">ESCALA & EQUIPE</span>
                      <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-3">Gerencie múltiplos profissionais de forma independente</h3>
                      <p className="text-brand-300 text-sm leading-relaxed mt-1">
                        Cada colaborador tem sua própria página interna, horários de trabalho customizáveis e uma lista de serviços que ele executa. 
                      </p>
                    </div>

                    <ul className="space-y-3 text-xs text-brand-200">
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Agendas independentes que evitam conflitos de horários</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Definição de comissões customizadas por profissional</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Relatório individual de faturamento por colaborador</li>
                    </ul>

                    <div className="flex gap-4">
                      <button 
                        onClick={handleStartTrial}
                        className="px-5 py-3 bg-white text-brand-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                      >
                        Começar Meu Teste <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Team Members List Desktop Card Simulation */}
                  <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 order-1 md:order-2">
                    {/* Professional 1 */}
                    <div className="bg-brand-950 p-4 rounded-2xl border border-white/[0.06] space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img 
                            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100&h=100" 
                            className="w-10 h-10 rounded-xl object-cover border border-white/[0.08]" 
                            alt="Mariana Alencar" 
                          />
                          <div>
                            <h4 className="text-xs font-bold text-white">Mariana Alencar</h4>
                            <p className="text-[9px] text-emerald-400 flex items-center gap-1">🟢 Disponível Hoje</p>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 bg-brand-900/50 rounded-lg text-amber-200">PRO</span>
                      </div>
                      
                      <div className="space-y-2 pt-2 border-t border-white/[0.03] text-[10px]">
                        <p className="text-brand-400 uppercase tracking-wider font-bold">Serviços que realiza:</p>
                        <div className="flex flex-wrap gap-1">
                          <span className="px-2 py-0.5 bg-brand-900 rounded-md text-brand-300">Mechas</span>
                          <span className="px-2 py-0.5 bg-brand-900 rounded-md text-brand-300">Escova</span>
                          <span className="px-2 py-0.5 bg-brand-900 rounded-md text-brand-300">Penteados</span>
                        </div>
                      </div>

                      <div className="space-y-1 pt-2 border-t border-white/[0.03]">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-brand-400">Ocupação Hoje</span>
                          <span className="text-amber-200 font-bold">60%</span>
                        </div>
                        <div className="w-full h-1.5 bg-brand-900 rounded-full overflow-hidden">
                          <div className="w-[60%] h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full" />
                        </div>
                      </div>
                    </div>

                    {/* Professional 2 */}
                    <div className="bg-brand-950 p-4 rounded-2xl border border-white/[0.06] space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img 
                            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&h=100" 
                            className="w-10 h-10 rounded-xl object-cover border border-white/[0.08]" 
                            alt="Thiago Santos" 
                          />
                          <div>
                            <h4 className="text-xs font-bold text-white">Thiago Santos</h4>
                            <p className="text-[9px] text-emerald-400 flex items-center gap-1">🟢 Disponível Hoje</p>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 bg-brand-900/50 rounded-lg text-amber-200">PRO</span>
                      </div>
                      
                      <div className="space-y-2 pt-2 border-t border-white/[0.03] text-[10px]">
                        <p className="text-brand-400 uppercase tracking-wider font-bold">Serviços que realiza:</p>
                        <div className="flex flex-wrap gap-1">
                          <span className="px-2 py-0.5 bg-brand-900 rounded-md text-brand-300">Corte</span>
                          <span className="px-2 py-0.5 bg-brand-900 rounded-md text-brand-300">Barba</span>
                          <span className="px-2 py-0.5 bg-brand-900 rounded-md text-brand-300">Corte Máquina</span>
                        </div>
                      </div>

                      <div className="space-y-1 pt-2 border-t border-white/[0.03]">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-brand-400">Ocupação Hoje</span>
                          <span className="text-amber-200 font-bold">85%</span>
                        </div>
                        <div className="w-full h-1.5 bg-brand-900 rounded-full overflow-hidden">
                          <div className="w-[85%] h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tab 4: Financial Analytics Sim */}
              {activeDemoTab === "financial" && (
                <motion.div
                  key="financial"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
                >
                  <div className="md:col-span-5 space-y-6 order-2 md:order-1">
                    <div>
                      <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/10">PAINEL FINANCEIRO</span>
                      <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-3">Monitore seu faturamento e conversão</h3>
                      <p className="text-brand-300 text-sm leading-relaxed mt-1">
                        Acompanhe gráficos limpos de faturamento, tíquete médio de serviços e veja exatamente quanto o seu negócio gerou de lucro através do agendamento automático. 
                      </p>
                    </div>

                    <div className="space-y-2 bg-brand-900/30 p-4.5 rounded-2xl border border-white/[0.04]">
                      <p className="text-xs text-brand-300 leading-relaxed">
                        A taxa de conversão mostra a porcentagem de pessoas que abriram seu link de reservas e agendaram um horário, ajudando você a otimizar sua divulgação!
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={handleStartTrial}
                        className="px-5 py-3 bg-white text-brand-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                      >
                        Começar Agora <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Financial Simulation Card Grid */}
                  <div className="md:col-span-7 bg-brand-950 p-6 rounded-2xl border border-white/[0.06] space-y-6 order-1 md:order-2">
                    <div className="grid grid-cols-3 gap-3 text-left">
                      {/* Revenue */}
                      <div className="bg-brand-900/20 p-3 rounded-xl border border-white/[0.04] space-y-1">
                        <span className="text-[8px] uppercase font-bold text-brand-400">Faturamento Mês</span>
                        <p className="text-sm sm:text-lg font-bold text-white">R$ 14.850,00</p>
                        <span className="text-[8px] text-emerald-400 font-bold flex items-center gap-0.5">📈 +22.4%</span>
                      </div>
                      
                      {/* Ticket */}
                      <div className="bg-brand-900/20 p-3 rounded-xl border border-white/[0.04] space-y-1">
                        <span className="text-[8px] uppercase font-bold text-brand-400">Tíquete Médio</span>
                        <p className="text-sm sm:text-lg font-bold text-white">R$ 72,50</p>
                        <span className="text-[8px] text-brand-400 font-bold">Estável</span>
                      </div>

                      {/* Conversão */}
                      <div className="bg-brand-900/20 p-3 rounded-xl border border-white/[0.04] space-y-1">
                        <span className="text-[8px] uppercase font-bold text-brand-400">Conversão Link</span>
                        <p className="text-sm sm:text-lg font-bold text-amber-200">62.6%</p>
                        <span className="text-[8px] text-amber-200 font-bold">Excelente</span>
                      </div>
                    </div>

                    {/* Custom Tailwind Mini Chart Representation */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] text-brand-400">
                        <span>Picos de Reservas Semanal</span>
                        <span>Faturamento Semanal</span>
                      </div>
                      <div className="h-28 bg-brand-900/10 border border-white/[0.03] rounded-xl flex items-end justify-between p-4 gap-2">
                        {[
                          { day: "Seg", val: "30%", valLabel: "R$ 1.200" },
                          { day: "Ter", val: "55%", valLabel: "R$ 2.400" },
                          { day: "Qua", val: "40%", valLabel: "R$ 1.800" },
                          { day: "Qui", val: "70%", valLabel: "R$ 3.100" },
                          { day: "Sex", val: "95%", valLabel: "R$ 4.500" },
                          { day: "Sáb", val: "100%", valLabel: "R$ 5.200" },
                        ].map((bar) => (
                          <div key={bar.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer">
                            <span className="text-[8px] font-bold text-amber-200 opacity-0 group-hover:opacity-100 transition-opacity">{bar.valLabel}</span>
                            <div 
                              className="w-full bg-gradient-to-t from-brand-900 via-amber-600/60 to-amber-400 rounded-t-md group-hover:brightness-125 transition-all" 
                              style={{ height: bar.val }} 
                            />
                            <span className="text-[9px] text-brand-300 font-bold">{bar.day}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
            </AnimatePresence>

          </div>

        </div>
      </section>

      {/* Illustrated "How it Works" Workflow */}
      <section id="how-it-works" className="py-24 bg-brand-950 relative border-t border-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-widest font-extrabold text-amber-200">AUTOMAÇÃO COMPLETA</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Como funciona o agendamento</h2>
            <p className="text-brand-300 text-sm sm:text-base leading-relaxed">
              Do clique no link do Instagram ao atendimento na poltrona. Tudo acontece de forma fluida e totalmente automatizada.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="bg-brand-900/10 border border-white/[0.04] p-8 rounded-[2.5rem] space-y-6 relative flex flex-col justify-between hover:border-amber-500/10 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-extrabold text-amber-300 bg-brand-900/60 px-3 py-1 rounded-full border border-white/[0.04]">Passo 01</span>
                  <span className="text-3xl font-extrabold text-white/[0.04]">01</span>
                </div>
                <h3 className="text-xl font-bold">Cliente acessa seu link</h3>
                <p className="text-brand-300 text-sm leading-relaxed">
                  Ele encontra seu link personalizado na bio do Instagram ou WhatsApp e acessa instantaneamente de qualquer dispositivo, sem precisar baixar nenhum aplicativo lento.
                </p>
              </div>
              
              {/* Wireframe Mini Vector representing Step 1 */}
              <div className="bg-brand-950 p-4 rounded-2xl border border-white/[0.06] text-[10px] space-y-2 mt-4 text-left">
                <p className="text-brand-400 font-bold flex items-center gap-1">🔗 lumina.com.br/b/seu-negocio</p>
                <div className="h-1 bg-brand-900 rounded-full w-full" />
                <div className="h-1 bg-brand-900 rounded-full w-2/3" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-brand-900/10 border border-white/[0.04] p-8 rounded-[2.5rem] space-y-6 relative flex flex-col justify-between hover:border-amber-500/10 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-extrabold text-amber-300 bg-brand-900/60 px-3 py-1 rounded-full border border-white/[0.04]">Passo 02</span>
                  <span className="text-3xl font-extrabold text-white/[0.04]">02</span>
                </div>
                <h3 className="text-xl font-bold">Reserva em menos de 1 min</h3>
                <p className="text-brand-300 text-sm leading-relaxed">
                  Ele seleciona o serviço desejado, escolhe o profissional da equipe de sua preferência e seleciona um dos horários disponíveis na agenda inteligente.
                </p>
              </div>

              {/* Wireframe Mini Vector representing Step 2 */}
              <div className="bg-brand-950 p-4 rounded-2xl border border-white/[0.06] space-y-2 mt-4 text-[9px] text-left">
                <div className="flex justify-between items-center bg-brand-900/30 p-1 rounded-lg">
                  <span className="text-brand-200">✂️ Corte Degradê</span>
                  <span className="text-amber-200 font-bold">R$ 55</span>
                </div>
                <div className="flex justify-between items-center bg-brand-900/30 p-1 rounded-lg">
                  <span className="text-brand-200">👤 Thiago Santos</span>
                  <span className="text-brand-400">Barbeiro</span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-brand-900/10 border border-white/[0.04] p-8 rounded-[2.5rem] space-y-6 relative flex flex-col justify-between hover:border-amber-500/10 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-extrabold text-amber-300 bg-brand-900/60 px-3 py-1 rounded-full border border-white/[0.04]">Passo 03</span>
                  <span className="text-3xl font-extrabold text-white/[0.04]">03</span>
                </div>
                <h3 className="text-xl font-bold">Confirmação automática</h3>
                <p className="text-brand-300 text-sm leading-relaxed">
                  O cliente recebe o agendamento confirmado via e-mail ou WhatsApp automaticamente. A agenda do profissional e o painel financeiro são atualizados no mesmo instante.
                </p>
              </div>

              {/* Wireframe Mini Vector representing Step 3 */}
              <div className="bg-brand-950 p-3 rounded-2xl border border-white/[0.06] space-y-2 mt-4 text-[9px] text-left">
                <p className="text-emerald-400 font-bold flex items-center gap-1">🟢 Notificação de Sucesso</p>
                <div className="p-2 bg-emerald-500/5 rounded-lg border border-emerald-500/15 text-brand-300 text-[8px] leading-relaxed">
                  "Seu agendamento foi confirmado para hoje às 14:00."
                </div>
              </div>
            </div>

          </div>

          <div className="text-center pt-4">
            <button
              onClick={handleStartTrial}
              className="px-8 py-4 bg-white text-brand-950 font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all text-sm inline-flex items-center gap-2 cursor-pointer shadow-lg"
            >
              Criar meu Link de Agendamento em 5 Minutos <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Bento Grid Features - Stripe/Linear Style */}
      <section id="features" className="py-24 bg-brand-900/10 border-y border-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16">
          
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-xs uppercase tracking-widest font-extrabold text-amber-200">RECURSOS DO SISTEMA</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Desenvolvido para alta performance</h2>
            <p className="text-brand-300 text-sm sm:text-base leading-relaxed">
              Substitua dezenas de controles em planilhas, conversas no WhatsApp e agendas de papel por uma única central de comando de alto padrão.
            </p>
          </div>

          {/* Bento Layout Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Box 1: Link personalizado (Big) */}
            <div className="md:col-span-8 bg-brand-950/60 border border-white/[0.04] rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group hover:border-white/[0.08] transition-all">
              <div className="absolute top-0 right-0 w-80 h-80 bg-brand-800/10 rounded-full blur-3xl pointer-events-none" />
              <div className="space-y-4 max-w-lg">
                <div className="w-12 h-12 bg-brand-900/50 rounded-2xl flex items-center justify-center text-amber-200 border border-white/[0.06]">
                  <Share2 className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight">Link Exclusivo com Sua Identidade</h3>
                <p className="text-brand-300 text-sm leading-relaxed">
                  Crie uma URL amigável e de fácil memorização para compartilhar no Instagram. A página de agendamentos carrega instantaneamente, mantendo a sofisticação e as cores de seu estabelecimento.
                </p>
              </div>

              <div className="mt-8 bg-brand-900/20 p-4 rounded-2xl border border-white/[0.04] font-mono text-xs flex justify-between items-center text-brand-300">
                <span>www.luminaagendamentos.com.br/b/seu-negocio</span>
                <span className="text-amber-200 font-bold uppercase text-[9px] px-2 py-0.5 bg-amber-500/10 rounded">Ativo 🟢</span>
              </div>
            </div>

            {/* Box 2: WhatsApp (Small) */}
            <div className="md:col-span-4 bg-brand-950/60 border border-white/[0.04] rounded-3xl p-8 flex flex-col justify-between hover:border-white/[0.08] transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-brand-900/50 rounded-2xl flex items-center justify-center text-amber-200 border border-white/[0.06]">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Lembretes & Confirmações</h3>
                <p className="text-brand-300 text-xs sm:text-sm leading-relaxed">
                  Reduza o não comparecimento em até 85%. O sistema envia notificações de confirmação de forma rápida no WhatsApp.
                </p>
              </div>
              <span className="text-xs font-bold text-amber-200/80 mt-4 flex items-center gap-1">Evite ausências de clientes ⚡</span>
            </div>

            {/* Box 3: Google Agenda */}
            <div className="md:col-span-4 bg-brand-950/60 border border-white/[0.04] rounded-3xl p-8 flex flex-col justify-between hover:border-white/[0.08] transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-brand-900/50 rounded-2xl flex items-center justify-center text-amber-200 border border-white/[0.06]">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Sincronia Google Calendar</h3>
                <p className="text-brand-300 text-xs sm:text-sm leading-relaxed">
                  Mantenha sua agenda pessoal sincronizada de duas vias. Se você agendar um compromisso médico no Google, o Lumina bloqueia automaticamente o horário para clientes!
                </p>
              </div>
              <span className="text-[10px] text-brand-400 font-semibold tracking-wider uppercase mt-4">Sincronização 2 vias</span>
            </div>

            {/* Box 4: Bloqueio de horários (Big) */}
            <div className="md:col-span-8 bg-brand-950/60 border border-white/[0.04] rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group hover:border-white/[0.08] transition-all">
              <div className="space-y-4 max-w-lg">
                <div className="w-12 h-12 bg-brand-900/50 rounded-2xl flex items-center justify-center text-amber-200 border border-white/[0.06]">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight">Bloqueio de Agenda Flexível</h3>
                <p className="text-brand-300 text-sm leading-relaxed">
                  Precisa bloquear uma tarde para cursos, férias ou almoços prolongados? Use a ferramenta de bloqueio de horários para fechar a agenda de profissionais específicos temporariamente com facilidade.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1.5 bg-red-950/20 border border-red-500/20 text-red-300 rounded-xl">Almoço Thiago (12:00 - 13:30) 🔒</span>
                <span className="px-3 py-1.5 bg-red-950/20 border border-red-500/20 text-red-300 rounded-xl">Folga Segunda Mariana (O dia todo) 🔒</span>
              </div>
            </div>

            {/* Box 5: Equipe e multi profissionais */}
            <div className="md:col-span-4 bg-brand-950/60 border border-white/[0.04] rounded-3xl p-8 flex flex-col justify-between hover:border-white/[0.08] transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-brand-900/50 rounded-2xl flex items-center justify-center text-amber-200 border border-white/[0.06]">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Controle da Equipe</h3>
                <p className="text-brand-300 text-xs sm:text-sm leading-relaxed">
                  Gerencie escalas individuais, folgas, férias e configure comissões independentes por colaborador de forma automatizada no painel.
                </p>
              </div>
            </div>

            {/* Box 6: Financeiro e relatórios */}
            <div className="md:col-span-4 bg-brand-950/60 border border-white/[0.04] rounded-3xl p-8 flex flex-col justify-between hover:border-white/[0.08] transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-brand-900/50 rounded-2xl flex items-center justify-center text-amber-200 border border-white/[0.06]">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Relatórios Financeiros</h3>
                <p className="text-brand-300 text-xs sm:text-sm leading-relaxed">
                  Acompanhe gráficos de receitas mensais, tíquete médio, faturamento por profissional e saiba exatamente quais os seus serviços de maior sucesso.
                </p>
              </div>
            </div>

            {/* Box 7: Serviços ilimitados */}
            <div className="md:col-span-4 bg-brand-950/60 border border-white/[0.04] rounded-3xl p-8 flex flex-col justify-between hover:border-white/[0.08] transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-brand-900/50 rounded-2xl flex items-center justify-center text-amber-200 border border-white/[0.06]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Serviços Ilimitados</h3>
                <p className="text-brand-300 text-xs sm:text-sm leading-relaxed">
                  Sem limites artificiais para segurar o crescimento do seu negócio. Cadastre quantos serviços, categorias e combos desejar!
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Social Proof Section with High Profile Brazilian Reviews */}
      <section className="py-24 bg-brand-950 relative border-t border-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16">
          
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-widest font-extrabold text-amber-200">QUEM JÁ USA</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Mais de 500 profissionais confiam no Lumina</h2>
            <p className="text-brand-300 text-sm sm:text-base leading-relaxed">
              Veja a opinião de donos de estabelecimentos reais que transformaram suas rotinas de trabalho após desativar o agendamento manual.
            </p>
          </div>

          {/* Social Proof Statistics Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-brand-900/20 p-8 rounded-[2.5rem] border border-white/[0.04] text-center">
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-white">+500</p>
              <p className="text-xs text-brand-300 uppercase tracking-wider font-semibold">Profissionais ativos</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-amber-200">+20 mil</p>
              <p className="text-xs text-brand-300 uppercase tracking-wider font-semibold">Agendamentos processados</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-white">97%</p>
              <p className="text-xs text-brand-300 uppercase tracking-wider font-semibold">Taxa de satisfação geral</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-amber-200">14 min</p>
              <p className="text-xs text-brand-300 uppercase tracking-wider font-semibold">Economizados por cliente</p>
            </div>
          </div>

          {/* Testimonial Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Review 1 */}
            <div className="bg-brand-900/10 border border-white/[0.04] p-8 rounded-3xl space-y-6 hover:border-brand-900/40 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-4 h-4 fill-amber-400" />)}
                </div>
                <p className="text-brand-100 text-sm italic leading-relaxed">
                  "O Lumina mudou completamente nossa barbearia. Meus clientes adoram o design limpo do link. Reduzimos as mensagens de marcação no WhatsApp e o faturamento subiu porque as pessoas agendam mais por conveniência."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-white/[0.03]">
                <img 
                  src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=100&h=100" 
                  className="w-10 h-10 rounded-full object-cover border border-white/[0.06]" 
                  alt="Thiago Barber" 
                />
                <div>
                  <h4 className="text-xs font-bold text-white">Thiago Santos (@thiago.barber)</h4>
                  <p className="text-[10px] text-brand-400">Don Corleone Barber — Goiânia, GO</p>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="bg-brand-900/10 border border-white/[0.04] p-8 rounded-3xl space-y-6 hover:border-brand-900/40 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-4 h-4 fill-amber-400" />)}
                </div>
                <p className="text-brand-100 text-sm italic leading-relaxed">
                  "Eu trabalhava sozinha e perdia muito tempo respondendo mensagens no meio do atendimento para confirmar horários. Agora, coloco meu link do Lumina na bio do Instagram e as clientes agendam direto. Sofisticado demais!"
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-white/[0.03]">
                <img 
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100&h=100" 
                  className="w-10 h-10 rounded-full object-cover border border-white/[0.06]" 
                  alt="Aline Lashes" 
                />
                <div>
                  <h4 className="text-xs font-bold text-white">Aline Lima (@alinelima.beauty)</h4>
                  <p className="text-[10px] text-brand-400">Lash Designer — Campinas, SP</p>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="bg-brand-900/10 border border-white/[0.04] p-8 rounded-3xl space-y-6 hover:border-brand-900/40 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-4 h-4 fill-amber-400" />)}
                </div>
                <p className="text-brand-100 text-sm italic leading-relaxed">
                  "Gerenciar uma clínica com 5 profissionais de estética era caótico com agendas de papel e conflitos constantes de horários. O painel multifuncional do Lumina resolveu tudo em horas. Cada esteticista controla o seu!"
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-white/[0.03]">
                <img 
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100&h=100" 
                  className="w-10 h-10 rounded-full object-cover border border-white/[0.06]" 
                  alt="Dra. Mariana" 
                />
                <div>
                  <h4 className="text-xs font-bold text-white">Dra. Mariana G. (@clinicaderma)</h4>
                  <p className="text-[10px] text-brand-400">CEO Clínica Serene — Balneário Camboriú, SC</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* High-Contrast Pricing Tiers (Highlighting PRO) */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-6 sm:px-8 space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="px-4 py-1.5 rounded-full bg-brand-900/50 text-amber-200 text-xs font-bold uppercase tracking-wider border border-white/[0.06]">
            PREÇO SIMPLES E TRANSPARENTE
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">O plano perfeito para o tamanho do seu negócio</h2>
          <p className="text-brand-300 text-sm sm:text-base leading-relaxed">
            Sem pegadinhas ou taxas extras de agendamento. Teste grátis por 7 dias. Altere o plano ou cancele quando quiser diretamente no painel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          
          {/* Plan Standard (Independent Professionals) */}
          <div className="bg-brand-950/40 border border-white/[0.06] rounded-[2.5rem] p-8 sm:p-10 flex flex-col justify-between hover:border-brand-900/30 transition-all relative">
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider bg-brand-900/50 px-2.5 py-1 rounded">PARA PROFISSIONAIS AUTÔNOMOS</span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">Plano Standard</h3>
                <p className="text-brand-300 text-xs sm:text-sm">Ideal para manicures, lash designers, esteticistas autônomas e profissionais independentes.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-extrabold text-white">R$ 49</span>
                <span className="text-brand-300 text-sm">/mês</span>
              </div>

              <div className="border-t border-white/[0.04] pt-6 space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-white">O que está incluso:</p>
                <ul className="space-y-3.5 text-xs sm:text-sm text-brand-300">
                  <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <strong>1 Profissional Ativo</strong></li>
                  <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Link de reservas exclusivo</li>
                  <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Serviços e categorias ilimitadas</li>
                  <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Calendário e controle manual integrado</li>
                  <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Banco de dados e CRM de clientes</li>
                </ul>
              </div>
            </div>

            <button 
              onClick={handleStartTrial}
              className="w-full py-4 mt-8 bg-brand-900 hover:bg-brand-850 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-white/[0.06] text-xs sm:text-sm cursor-pointer"
            >
              Iniciar Teste Grátis de 7 Dias <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Plan Pro (Salons, Barbershops, Clinics) - Dynamic and Premium Design Accent */}
          <div className="bg-brand-900/20 border-2 border-amber-500/40 rounded-[2.5rem] p-8 sm:p-10 flex flex-col justify-between hover:border-amber-500/60 transition-all relative shadow-[0_20px_50px_rgba(245,158,11,0.06)]">
            <span className="absolute -top-3 left-10 bg-gradient-to-r from-amber-500 to-yellow-400 text-brand-950 text-[9px] uppercase tracking-widest font-extrabold px-4 py-1.5 rounded-full shadow-md">
              Mais Escolhido — Escala Total ⭐
            </span>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-amber-200 uppercase tracking-wider bg-amber-500/10 px-2.5 py-1 rounded">PARA ESTABELECIMENTOS & EQUIPES</span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">Plano PRO</h3>
                <p className="text-brand-300 text-xs sm:text-sm">Ideal para barbearias em expansão, salões de beleza, clínicas e estúdios que trabalham em equipe.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-extrabold text-white">R$ 99</span>
                <span className="text-brand-300 text-sm">/mês</span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md ml-2">Melhor Valor</span>
              </div>

              <div className="border-t border-white/[0.04] pt-6 space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-200">Tudo do Standard, mais:</p>
                <ul className="space-y-3.5 text-xs sm:text-sm text-brand-200">
                  <li className="flex items-center gap-3"><Check className="w-4 h-4 text-amber-300 shrink-0" /> <strong>Múltiplos Profissionais Ilimitados</strong></li>
                  <li className="flex items-center gap-3"><Check className="w-4 h-4 text-amber-300 shrink-0" /> Multi-agenda individual simultânea</li>
                  <li className="flex items-center gap-3"><Check className="w-4 h-4 text-amber-300 shrink-0" /> Gráficos e relatórios financeiros avançados</li>
                  <li className="flex items-center gap-3"><Check className="w-4 h-4 text-amber-300 shrink-0" /> Controle de escalas e comissões de colaboradores</li>
                  <li className="flex items-center gap-3"><Check className="w-4 h-4 text-amber-300 shrink-0" /> Suporte VIP prioritário no WhatsApp</li>
                </ul>
              </div>
            </div>

            <button 
              onClick={handleStartTrial}
              className="w-full py-4 mt-8 bg-white hover:bg-brand-50 text-brand-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs sm:text-sm shadow-xl cursor-pointer"
            >
              Iniciar Teste de 7 Dias Grátis <ArrowRight className="w-4 h-4 text-brand-950" />
            </button>
          </div>

        </div>

        <div className="max-w-2xl mx-auto bg-brand-900/10 border border-white/[0.03] p-5 rounded-2xl text-center text-xs text-brand-300">
          💡 <strong>O plano PRO se paga sozinho:</strong> Se você evitar apenas 1 cancelamento ou não comparecimento de cliente por mês graças às notificações automáticas, o plano PRO já gerou lucro líquido para você!
        </div>
      </section>

      {/* B2B FAQ Section to Remove Conversion Objections */}
      <section id="faq" className="py-24 bg-brand-900/10 border-t border-white/[0.02]">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-16">
          
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-widest font-extrabold text-amber-200">DÚVIDAS SOLUCIONADAS</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Perguntas Frequentes</h2>
            <p className="text-brand-300 text-sm sm:text-base leading-relaxed">
              Resolvemos as principais objeções de nossos parceiros antes de começarem o teste gratuito de 7 dias.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            
            {/* FAQ 1 */}
            <div className="bg-brand-950/60 border border-white/[0.04] p-6 rounded-2xl space-y-2">
              <h4 className="font-bold text-white text-sm sm:text-base flex items-start gap-2">
                <HelpCircle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                Preciso instalar algum aplicativo no celular?
              </h4>
              <p className="text-brand-300 text-xs sm:text-sm leading-relaxed">
                Não. O Lumina é 100% baseado na web. Seus clientes realizam o agendamento direto pelo link do Instagram sem precisar baixar nada na Play Store ou App Store. O proprietário e equipe usam a versão otimizada pelo navegador no celular ou computador de forma rápida.
              </p>
            </div>

            {/* FAQ 2 */}
            <div className="bg-brand-950/60 border border-white/[0.04] p-6 rounded-2xl space-y-2">
              <h4 className="font-bold text-white text-sm sm:text-base flex items-start gap-2">
                <HelpCircle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                Funciona bem no celular e computador?
              </h4>
              <p className="text-brand-300 text-xs sm:text-sm leading-relaxed">
                Sim! Toda a interface foi exaustivamente desenhada para carregar em menos de 1 segundo nos celulares, considerando que 95% dos clientes de estética e beleza virão do aplicativo do Instagram. O painel administrativo também é perfeito em computadores e tablets de recepção.
              </p>
            </div>

            {/* FAQ 3 */}
            <div className="bg-brand-950/60 border border-white/[0.04] p-6 rounded-2xl space-y-2">
              <h4 className="font-bold text-white text-sm sm:text-base flex items-start gap-2">
                <HelpCircle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                Existe fidelidade ou multa para cancelar?
              </h4>
              <p className="text-brand-300 text-xs sm:text-sm leading-relaxed">
                Absolutamente nenhuma. Você pode testar por 7 dias grátis sem qualquer compromisso. O plano de assinatura é mensal e você pode cancelar com apenas um único clique no painel a qualquer momento.
              </p>
            </div>

            {/* FAQ 4 */}
            <div className="bg-brand-950/60 border border-white/[0.04] p-6 rounded-2xl space-y-2">
              <h4 className="font-bold text-white text-sm sm:text-base flex items-start gap-2">
                <HelpCircle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                Quais formas de pagamento são aceitas?
              </h4>
              <p className="text-brand-300 text-xs sm:text-sm leading-relaxed">
                Para assinar o sistema após os 7 dias grátis, nós aceitamos PIX ou Cartão de Crédito de forma rápida e segura. O faturamento é realizado de forma recorrente a cada mês.
              </p>
            </div>

            {/* FAQ 5 */}
            <div className="bg-brand-950/60 border border-white/[0.04] p-6 rounded-2xl space-y-2">
              <h4 className="font-bold text-white text-sm sm:text-base flex items-start gap-2">
                <HelpCircle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                Tenho uma barbearia com 5 cadeiras. O Lumina serve?
              </h4>
              <p className="text-brand-300 text-xs sm:text-sm leading-relaxed">
                Sim! O Lumina PRO foi projetado exatamente para barbearias, salões e clínicas que operam em equipe. Você pode configurar uma agenda para cada barbeiro e eles mesmos gerenciam seus dias e horários pelo celular.
              </p>
            </div>

            {/* FAQ 6 */}
            <div className="bg-brand-950/60 border border-white/[0.04] p-6 rounded-2xl space-y-2">
              <h4 className="font-bold text-white text-sm sm:text-base flex items-start gap-2">
                <HelpCircle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                Posso trancar horários fora do expediente?
              </h4>
              <p className="text-brand-300 text-xs sm:text-sm leading-relaxed">
                Com certeza. Você define o horário de funcionamento do estabelecimento e de cada colaborador (ex: Terça a Sábado das 09:00 às 19:00). Nesses limites, os clientes só conseguem escolher horários livres autorizados pelo sistema.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Elegant Footer CTA */}
      <section className="py-24 text-center relative px-6 max-w-5xl mx-auto space-y-10">
        <div className="space-y-4">
          <span className="text-xs uppercase tracking-widest font-extrabold text-amber-200">COMECE HOJE</span>
          <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight">Leve a imagem do seu negócio para o próximo nível</h2>
          <p className="text-brand-200 text-sm sm:text-lg max-w-xl mx-auto leading-relaxed">
            Faça como mais de 500 profissionais no Brasil. Automatize sua agenda, passe maior profissionalismo para seus clientes e gaste seu tempo no que realmente importa.
          </p>
        </div>

        <button 
          onClick={handleStartTrial}
          className="px-10 py-5 bg-white hover:bg-brand-50 text-brand-950 font-bold rounded-2xl hover:scale-105 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)] inline-flex items-center gap-3 text-base sm:text-lg cursor-pointer"
        >
          Iniciar Meu Teste de 7 Dias Grátis <ArrowRight className="w-5 h-5 text-brand-950" />
        </button>
      </section>

      {/* Comprehensive Footer Layout */}
      <footer className="border-t border-white/[0.04] py-16 bg-brand-950 text-xs sm:text-sm text-brand-400">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 grid grid-cols-2 md:grid-cols-12 gap-10 border-b border-white/[0.02] pb-12 mb-12">
          
          {/* Column 1: Brand details */}
          <div className="col-span-2 md:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-900 rounded-lg flex items-center justify-center border border-white/[0.08]">
                <Scissors className="w-4 h-4 text-amber-200" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">Lumina</span>
            </div>
            <p className="text-brand-300 leading-relaxed text-xs">
              O sistema de agendamento online ultra-premium projetado para barbearias, salões de beleza, clínicas de estética e profissionais de destaque no Brasil.
            </p>
            <p className="text-[10px] text-brand-500">CNPJ: 45.892.391/0001-20</p>
          </div>

          {/* Column 2: Recursos */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider">Recursos</h5>
            <ul className="space-y-2.5 text-xs">
              <li><a href="#features" className="hover:text-white transition-colors">Link de Reservas</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">WhatsApp Automático</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Google Agenda</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Controle Financeiro</a></li>
            </ul>
          </div>

          {/* Column 3: Empresa */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider">Empresa</h5>
            <ul className="space-y-2.5 text-xs">
              <li><a href="#pricing" className="hover:text-white transition-colors">Planos & Preços</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Como funciona</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Perguntas Frequentes</a></li>
              <li><a href="mailto:suporte@luminaagendamentos.com.br" className="hover:text-white transition-colors">Contato</a></li>
            </ul>
          </div>

          {/* Column 4: Links de Conformidade */}
          <div className="col-span-2 md:col-span-4 space-y-4 text-left">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider">Legal & Suporte</h5>
            <ul className="space-y-2.5 text-xs">
              <li><span className="text-brand-400">Termos de Uso de Serviço</span></li>
              <li><span className="text-brand-400">Política de Privacidade & Cookies</span></li>
              <li><span className="text-brand-400">Conformidade Geral LGPD Brasil</span></li>
              <li className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-brand-300 font-medium">Suporte: suporte@luminaagendamentos.com.br</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright details */}
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 Lumina Agendamentos Premium. Todos os direitos reservados. Feito para alta conversão.</p>
          <div className="flex gap-6 text-xs text-brand-300">
            <span className="hover:text-white cursor-pointer transition-colors">Instagram</span>
            <span className="hover:text-white cursor-pointer transition-colors">Facebook</span>
            <span className="hover:text-white cursor-pointer transition-colors">LinkedIn</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
