import { useState } from "react";
import { PLANS, PaymentProvider } from "../lib/PaymentProvider";
import { useAuth } from "../lib/AuthProvider";
import { Loader2, Check, Sparkles, LogOut, ArrowRight, ShieldAlert, ArrowLeft, CreditCard, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Link } from "react-router-dom";

interface PricingProps {
  currentStatus?: string;
}

export function Pricing({ currentStatus }: PricingProps) {
  const { user, dbUser, logOut } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const handleSubscribe = async (planId: string) => {
    setLoadingPlan(planId);
    try {
      const result = await PaymentProvider.createCheckoutSession(planId, dbUser?.stripe_customer_id);
      
      // If server returned a new stripeCustomerId (e.g. created a new one), we can save it in client side user doc if they don't have one!
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

      // Redirect in the same window (prevents Safari/mobile popup blocker and pattern errors)
      window.location.href = result.url;
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast.error(error.message || "Não foi possível iniciar o pagamento. Tente novamente.");
    } finally {
      setLoadingPlan(null);
    }
  };

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

      window.location.href = result.url;
    } catch (e: any) {
      console.error("Error redirecting to Customer Portal:", e);
      toast.error(e.message || "Erro ao abrir o portal de faturamento. Certifique-se de que possui uma assinatura.");
    } finally {
      setPortalLoading(false);
    }
  };

  const isSubscribed = currentStatus === "active" || currentStatus === "trialing" || user?.email === "alexandrealvesszz12@gmail.com";

  return (
    <div className="min-h-screen bg-brand-50 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tight text-brand-900">Lumina</span>
              <span className="text-xs bg-brand-900/10 text-brand-900 px-2 py-0.5 rounded-full font-semibold">SaaS</span>
            </div>
            {isSubscribed && (
              <Link
                to="/admin"
                className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-950 transition-colors ml-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao Painel
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isSubscribed && (
              <Link
                to="/admin"
                className="flex sm:hidden items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-950 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Painel
              </Link>
            )}
            <button
              onClick={logOut}
              className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair da Conta
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-900/5 border border-brand-900/10 text-brand-800 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Planos Lumina
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-brand-950">
            Escolha o plano ideal para o seu negócio
          </h1>
          <p className="text-base sm:text-lg text-brand-600">
            Todos os planos incluem um **período de teste gratuito de 7 dias**. Cancele quando quiser diretamente no painel.
          </p>

          {/* Banner for already subscribed users to manage billing */}
          {isSubscribed && (
            <div className="mt-8 p-6 rounded-3xl bg-emerald-50 border border-emerald-100 text-emerald-900 max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-left shadow-sm">
              <div className="flex items-start gap-3">
                <CreditCard className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-950">Você já possui uma assinatura ativa!</h4>
                  <p className="text-xs text-emerald-700 mt-1">
                    Para visualizar suas faturas, atualizar o cartão ou cancelar/alterar no portal de auto-serviço Stripe:
                  </p>
                </div>
              </div>
              <button
                onClick={handleOpenPortal}
                disabled={portalLoading}
                className="w-full sm:w-auto shrink-0 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
              >
                {portalLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    Acessar Faturamento
                    <ExternalLink className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          )}

          {currentStatus && currentStatus !== "free" && currentStatus !== "active" && currentStatus !== "trialing" && (
            <div className="mt-6 flex items-center justify-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 max-w-xl mx-auto text-sm text-left">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-semibold">Sua assinatura está com status: {currentStatus === "past_due" ? "Pendente de Pagamento" : currentStatus}</p>
                <p className="text-xs text-amber-700 mt-0.5">Selecione um plano abaixo para reativar sua conta ou atualizar sua forma de pagamento.</p>
              </div>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
          {PLANS.map((plan) => {
            const isPopular = plan.id === "professional";
            return (
              <div
                key={plan.id}
                id={`plan-card-${plan.id}`}
                className={`relative flex flex-col justify-between bg-white rounded-3xl p-8 transition-all duration-300 border shadow-md hover:shadow-xl ${
                  isPopular
                    ? "border-brand-900 ring-2 ring-brand-900/20 md:scale-105 z-10"
                    : "border-brand-100"
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-900 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" /> Mais Escolhido
                  </span>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-brand-950">{plan.name}</h3>
                    <p className="text-xs text-brand-500 mt-1">Para negócios de todos os portes</p>
                  </div>

                  <div className="flex items-baseline">
                    <span className="text-4xl font-extrabold tracking-tight text-brand-950">
                      {plan.price.split("/")[0]}
                    </span>
                    <span className="text-brand-500 text-sm ml-1">/mês</span>
                  </div>

                  <hr className="border-brand-100" />

                  <ul className="space-y-4">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-brand-700">
                        <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-brand-50">
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loadingPlan !== null}
                    className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                      isPopular
                        ? "bg-brand-900 text-white hover:bg-brand-800"
                        : "bg-brand-50 text-brand-900 hover:bg-brand-100 border border-brand-200"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loadingPlan === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Iniciando checkout...
                      </>
                    ) : (
                      <>
                        Iniciar Teste de 7 Dias
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust elements */}
        <div className="mt-20 text-center text-xs text-brand-500 space-y-2">
          <p>Pagamento 100% seguro processado via Stripe.</p>
          <p>Dúvidas? Entre em contato com o suporte: suporte@luminaagendamentos.com</p>
        </div>
      </div>
    </div>
  );
}
