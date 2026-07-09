import { db, auth } from "./firebase";

export interface PaymentPlan {
  id: "starter" | "professional" | "enterprise";
  name: string;
  price: string;
  priceId?: string;
  features: string[];
}

export const PLANS: PaymentPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: "R$ 49/mês",
    features: [
      "1 Loja/Agenda",
      "Até 3 Profissionais",
      "Agendamentos ilimitados",
      "Suporte por e-mail",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: "R$ 99/mês",
    features: [
      "Até 3 Lojas/Agendas",
      "Até 10 Profissionais",
      "Agendamentos ilimitados",
      "Relatórios de faturamento",
      "Suporte priorizado",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "R$ 199/mês",
    features: [
      "Lojas/Agendas ilimitadas",
      "Profissionais ilimitados",
      "Agendamentos ilimitados",
      "Relatórios avançados (MRR, LTV)",
      "Multi-usuários admins",
      "Suporte 24/7 via WhatsApp",
    ],
  },
];

export const PaymentProvider = {
  async createCheckoutSession(planId: string, stripeCustomerId?: string | null): Promise<{ url: string, stripeCustomerId?: string }> {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    const idToken = await user.getIdToken();
    const response = await fetch("/api/payment/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        plan: planId,
        stripeCustomerId,
      }),
    });

    const contentType = response.headers.get("content-type");
    let errorMsg = "Erro ao iniciar o Stripe Checkout";
    let data: any = null;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
      if (!response.ok) {
        errorMsg = data.error || errorMsg;
      }
    } else {
      const text = await response.text();
      if (!response.ok) {
        if (text.includes("<!DOCTYPE html>") || text.includes("<html")) {
          errorMsg = `O servidor retornou uma página HTML (Status ${response.status}). Verifique se o backend está respondendo corretamente e se as variáveis de ambiente (como STRIPE_SECRET_KEY e STRIPE_PRICE_*) estão configuradas no painel de configurações do AI Studio.`;
        } else {
          errorMsg = text || errorMsg;
        }
      }
    }

    if (!response.ok) {
      throw new Error(errorMsg);
    }

    return data;
  },

  async createPortalSession(stripeCustomerId?: string | null): Promise<{ url: string, stripeCustomerId?: string }> {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    const idToken = await user.getIdToken();
    const response = await fetch("/api/payment/create-portal-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        stripeCustomerId,
      }),
    });

    const contentType = response.headers.get("content-type");
    let errorMsg = "Erro ao abrir o Portal do Cliente";
    let data: any = null;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
      if (!response.ok) {
        errorMsg = data.error || errorMsg;
      }
    } else {
      const text = await response.text();
      if (!response.ok) {
        if (text.includes("<!DOCTYPE html>") || text.includes("<html")) {
          errorMsg = `O servidor retornou uma página HTML (Status ${response.status}). Verifique se as variáveis de ambiente do Stripe estão devidamente configuradas.`;
        } else {
          errorMsg = text || errorMsg;
        }
      }
    }

    if (!response.ok) {
      throw new Error(errorMsg);
    }

    return data;
  }
};
