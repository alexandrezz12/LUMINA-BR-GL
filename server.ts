import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import crypto from "crypto";

dotenv.config();

import fs from "fs";

let dbAdmin: any = null;
try {
  let adminApp: any;
  let dbId: string | undefined = undefined;
  
  // Resolve firebase-applet-config.json safely using process.cwd() so it works under Vercel bundling
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  let config: any = null;
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch (err) {
      console.warn("Could not parse firebase-applet-config.json:", err);
    }
  }

  const projectId = config?.projectId || process.env.VITE_FIREBASE_PROJECT_ID || "lumina-agendamentos";
  const dbIdFromConfig = config?.firestoreDatabaseId || "(default)";

  // Try to find service account credentials in environment variables
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  let credential: any = null;

  if (serviceAccountVar) {
    try {
      let saJson: any;
      if (serviceAccountVar.trim().startsWith("{")) {
        saJson = JSON.parse(serviceAccountVar);
      } else {
        // Handle base64 encoded service account
        saJson = JSON.parse(Buffer.from(serviceAccountVar, "base64").toString("utf8"));
      }
      credential = admin.cert(saJson);
      console.log("Initializing Firebase Admin with Service Account from environment variable.");
    } catch (saErr: any) {
      console.warn("Found service account variable but failed to parse it:", saErr.message || saErr);
    }
  }

  // If no service account env var, and we are NOT on Vercel, try applicationDefault (for Cloud Run)
  if (!credential && !process.env.VERCEL) {
    try {
      credential = admin.applicationDefault();
      console.log("Initializing Firebase Admin with Application Default Credentials.");
    } catch (adcErr: any) {
      console.warn("Application Default Credentials not available:", adcErr.message || adcErr);
    }
  }

  // Set up initialization options
  const appConfig: admin.AppOptions = { projectId };
  if (credential) {
    appConfig.credential = credential;
  }

  if (admin.getApps().length === 0) {
    adminApp = admin.initializeApp(appConfig);
  } else {
    adminApp = admin.getApp();
  }

  dbId = dbIdFromConfig === "(default)" ? undefined : dbIdFromConfig;
  dbAdmin = dbId ? getFirestore(adminApp, dbId) : getFirestore(adminApp);
  console.log("Firebase Admin initialized successfully with database:", dbId || "(default)", "Project:", projectId);
} catch (e: any) {
  console.error("Firebase Admin initialization failed:", e.message || e);
}

const app = express();
const PORT = 3000;

// Support Vercel serverless routing where the /api prefix might be stripped by the serverless handler
// Put this at the very top of the middleware stack so it applies to ALL routes
app.use((req, res, next) => {
  if (process.env.VERCEL) {
    if (req.url === "/api") {
      req.url = "/api/";
    } else if (!req.url.startsWith("/api/")) {
      req.url = "/api" + req.url;
    }
  }
  next();
});

app.use(cors());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend fully operational on Vercel!" });
});

// Custom JSON parser to extract raw body for Stripe webhook signature verification
app.use(express.json({
  verify: (req: any, res, buf) => {
    if (req.originalUrl?.startsWith("/api/webhook/stripe")) {
      req.rawBody = buf;
    }
  }
}));

// ======== STRIPE CLIENT LAZY INITIALIZATION ========
import Stripe from "stripe";

let stripeInstance: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required. Configure it in Settings.");
    }
    if (key.startsWith("pk_")) {
      throw new Error("A variável STRIPE_SECRET_KEY está configurada com uma chave pública (Publishable Key - 'pk_...'). Você deve usar uma chave secreta (Secret Key - 'sk_...') obtida no painel da Stripe.");
    }
    stripeInstance = new Stripe(key, {
      apiVersion: "2023-10-16" as any,
    });
  }
  return stripeInstance;
}

// ======== AUTHENTICATION VERIFIER HELPERS ========
function base64urlDecode(str: string): string {
  return Buffer.from(str, 'base64url').toString('utf8');
}

async function verifyGoogleTokenManually(token: string, projectId: string) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error("Formato de token JWT inválido.");
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const header = JSON.parse(base64urlDecode(headerB64));
  const payload = JSON.parse(base64urlDecode(payloadB64));

  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new Error(`Issuer inválido: ${payload.iss}`);
  }

  if (payload.aud !== projectId) {
    throw new Error(`Audience inválida: ${payload.aud}`);
  }

  const currentTime = Math.floor(Date.now() / 1000);
  if (payload.exp && currentTime > payload.exp + 300) { // 5-minute clock-skew buffer
    throw new Error("O token de autenticação expirou.");
  }

  const certsRes = await fetch("https://www.googleapis.com/robot/v1/metadata/x509/securetoken-system@system.gserviceaccount.com");
  if (!certsRes.ok) {
    throw new Error("Não foi possível buscar os certificados públicos do Google.");
  }
  const certs = await certsRes.json();
  const kid = header.kid;
  const cert = certs[kid];

  if (!cert) {
    throw new Error(`Chave pública não encontrada para o kid: ${kid}`);
  }

  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(`${headerB64}.${payloadB64}`);
  const isValid = verify.verify(cert, signatureB64, 'base64url');

  if (!isValid) {
    throw new Error("Falha na verificação da assinatura criptográfica do token.");
  }

  return {
    ...payload,
    uid: payload.sub || payload.user_id,
    email: payload.email,
    email_verified: payload.email_verified,
  };
}

async function getAuthenticatedUser(req: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Não autorizado. Token não fornecido.");
  }
  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    return decodedToken;
  } catch (err: any) {
    console.warn("verifyIdToken standard verification failed, attempting secure bypass for clock-skew:", err.message || err);
    try {
      let projectId = "lumina-agendamentos";
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        if (config.projectId) {
          projectId = config.projectId;
        }
      }
      const decodedManual = await verifyGoogleTokenManually(token, projectId);
      console.log("Successfully verified token manually with clock-skew bypass!");
      return decodedManual;
    } catch (manualErr: any) {
      console.error("Manual token verification also failed:", manualErr);
      throw new Error("Sessão expirada ou inválida. Faça login novamente.");
    }
  }
}

// ======== DATABASE UPDATING HELPERS FOR STRIPE HOOKS ========
async function getUserIdByCustomerId(customerId: string): Promise<string | null> {
  if (!dbAdmin) return null;
  try {
    const snap = await dbAdmin.collection("users").where("stripe_customer_id", "==", customerId).get();
    if (!snap.empty) {
      return snap.docs[0].id;
    }
  } catch (e) {
    console.error("Error finding user by customer ID:", e);
  }
  return null;
}

async function logPaymentEvent(userId: string | null, event: Stripe.Event) {
  if (!dbAdmin) return;
  const targetUserId = userId || "unknown";
  try {
    const logId = event.id;
    await dbAdmin
      .collection("users")
      .doc(targetUserId)
      .collection("payment_logs")
      .doc(logId)
      .set({
        id: logId,
        eventType: event.type,
        payload: event.data.object,
        timestamp: new Date().toISOString(),
      });
  } catch (e) {
    console.error("Failed to log payment event:", e);
  }
}

async function updateUserSubscription(userId: string, subscription: any, customerId: string) {
  if (!dbAdmin) return;
  const priceId = subscription.items.data[0].price.id;
  const status = subscription.status;

  const updateData: any = {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    subscription_status: status,
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  };

  if (subscription.trial_end) {
    updateData.trial_end = new Date(subscription.trial_end * 1000).toISOString();
  }
  if (subscription.current_period_end) {
    updateData.next_billing_date = new Date(subscription.current_period_end * 1000).toISOString();
  }

  // Retrieve payment method card brand/last4 if available
  try {
    if (subscription.default_payment_method) {
      const stripe = getStripe();
      const pm = await stripe.paymentMethods.retrieve(subscription.default_payment_method as string);
      if (pm.card) {
        updateData.payment_method = `${pm.card.brand.toUpperCase()} **** ${pm.card.last4}`;
      }
    }
  } catch (e) {
    console.error("Could not retrieve default payment method details:", e);
  }

  // Update user profile
  await dbAdmin.collection("users").doc(userId).set(updateData, { merge: true });

  // Update detail doc in subcollection
  await dbAdmin
    .collection("users")
    .doc(userId)
    .collection("subscriptions")
    .doc(subscription.id)
    .set({
      id: subscription.id,
      status: status,
      priceId: priceId,
      plan: priceId.includes("starter") ? "starter" : priceId.includes("professional") ? "professional" : "enterprise",
      currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      createdAt: new Date().toISOString(),
    });
}

// ======== API ROUTES (STRIPE INTEGRATION) ========

app.get("/api/payment/verify-session", async (req, res) => {
  try {
    const sessionId = req.query.session_id as string;
    if (!sessionId) {
      return res.status(400).json({ error: "O parâmetro session_id é obrigatório." });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    const subscription = session.subscription as any;
    res.json({
      status: "success",
      userId: session.metadata?.userId || session.client_reference_id,
      customerId: session.customer,
      subscriptionId: subscription?.id || null,
      priceId: subscription?.items?.data?.[0]?.price?.id || null,
      subscriptionStatus: subscription?.status || null,
      currentPeriodEnd: subscription?.current_period_end || null,
    });
  } catch (error: any) {
    console.error("Verify Session error:", error);
    res.status(500).json({ error: error.message || "Erro ao verificar sessão do Stripe." });
  }
});

app.get("/api/payment/subscription-status", async (req, res) => {
  try {
    const decodedToken = await getAuthenticatedUser(req);
    const userId = decodedToken.uid;
    const email = decodedToken.email;

    const stripe = getStripe();
    // 1. Search customer by email
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return res.json({ status: "none", customerId: null });
    }

    const customerId = customers.data[0].id;

    // 2. Search subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return res.json({ 
        status: "none", 
        customerId,
        subscriptionId: null,
        priceId: null,
      });
    }

    const sub = subscriptions.data[0] as any;
    res.json({
      status: "success",
      customerId,
      subscriptionId: sub.id,
      subscriptionStatus: sub.status,
      priceId: sub.items.data[0].price.id,
      currentPeriodEnd: sub.current_period_end,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    });
  } catch (error: any) {
    console.error("Get subscription status error:", error);
    res.status(500).json({ error: error.message || "Erro ao obter status da assinatura." });
  }
});

app.post("/api/payment/create-checkout-session", async (req, res) => {
  try {
    const decodedToken = await getAuthenticatedUser(req);
    const userId = decodedToken.uid;
    const email = decodedToken.email;

    const { plan, stripeCustomerId: clientCustomerId } = req.body;
    if (!plan) {
      return res.status(400).json({ error: "O plano (plan) é obrigatório." });
    }

    const priceId = plan === "starter" ? process.env.STRIPE_PRICE_STARTER :
                    plan === "professional" ? process.env.STRIPE_PRICE_PROFESSIONAL :
                    plan === "enterprise" ? process.env.STRIPE_PRICE_ENTERPRISE : null;

    if (!priceId) {
      return res.status(400).json({ 
        error: `O preço para o plano '${plan}' não está configurado no servidor. Defina STRIPE_PRICE_${plan.toUpperCase()} nas Configurações do AI Studio.` 
      });
    }

    if (!priceId.startsWith("price_")) {
      return res.status(400).json({
        error: `O ID do preço configurado para o plano '${plan}' é inválido ("${priceId}"). Ele deve começar com "price_" (por exemplo, "price_1P..."). Por favor, acesse o painel da Stripe, crie um produto recorrente mensal e copie o correspondente "Price ID" para as variáveis de ambiente.`
      });
    }

    const stripe = getStripe();

    // Check if user has an existing stripe_customer_id
    let stripeCustomerId = clientCustomerId || null;
    if (!stripeCustomerId) {
      try {
        const customers = await stripe.customers.list({
          email: email,
          limit: 1,
        });
        if (customers.data.length > 0) {
          stripeCustomerId = customers.data[0].id;
        }
      } catch (stripeErr) {
        console.warn("Could not search Stripe customer by email:", stripeErr);
      }
    }

    if (!stripeCustomerId && dbAdmin) {
      try {
        const userDoc = await dbAdmin.collection("users").doc(userId).get();
        if (userDoc.exists()) {
          stripeCustomerId = userDoc.data().stripe_customer_id;
        }
      } catch (dbErr) {
        console.warn("Could not fetch user customer ID from Firestore Admin SDK, using fallback.", dbErr);
      }
    }

    // Create a new Customer if not exists
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: email,
        metadata: { userId },
      });
      stripeCustomerId = customer.id;

      if (dbAdmin) {
        try {
          await dbAdmin.collection("users").doc(userId).set({
            stripe_customer_id: stripeCustomerId,
          }, { merge: true });
        } catch (dbErr) {
          console.warn("Could not save new stripeCustomerId to Firestore Admin SDK, client will handle fallback.", dbErr);
        }
      }
    }

    // Dynamically resolve client application URL from headers for frictionless production/preview redirects
    const host = req.get("host");
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const resolvedAppUrl = host ? `${protocol}://${host}` : (process.env.APP_URL || "http://localhost:3000");

    // Create checkout session with 7 days free trial
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
        metadata: { userId },
      },
      client_reference_id: userId,
      success_url: `${resolvedAppUrl}/admin?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${resolvedAppUrl}/admin/planos`,
      metadata: { userId },
    });

    res.json({ url: session.url, stripeCustomerId });
  } catch (error: any) {
    console.error("Create Checkout Session error:", error);
    res.status(500).json({ error: error.message || "Erro interno ao iniciar o Stripe Checkout." });
  }
});

app.post("/api/payment/create-portal-session", async (req, res) => {
  try {
    const decodedToken = await getAuthenticatedUser(req);
    const userId = decodedToken.uid;
    const email = decodedToken.email;

    const { stripeCustomerId: clientCustomerId } = req.body;
    let stripeCustomerId = clientCustomerId || null;

    if (!stripeCustomerId) {
      try {
        const stripe = getStripe();
        const customers = await stripe.customers.list({
          email: email,
          limit: 1,
        });
        if (customers.data.length > 0) {
          stripeCustomerId = customers.data[0].id;
        }
      } catch (stripeErr) {
        console.warn("Could not search Stripe customer by email for portal session:", stripeErr);
      }
    }

    if (!stripeCustomerId && dbAdmin) {
      try {
        const userDoc = await dbAdmin.collection("users").doc(userId).get();
        if (userDoc.exists()) {
          stripeCustomerId = userDoc.data().stripe_customer_id;
        }
      } catch (dbErr) {
        console.warn("Could not fetch user customer ID for portal session from Firestore Admin SDK, using client-provided value.", dbErr);
      }
    }

    const stripe = getStripe();

    if (!stripeCustomerId) {
      try {
        const customer = await stripe.customers.create({
          email: email,
          metadata: { userId },
        });
        stripeCustomerId = customer.id;

        if (dbAdmin) {
          try {
            await dbAdmin.collection("users").doc(userId).set({
              stripe_customer_id: stripeCustomerId,
            }, { merge: true });
          } catch (dbErr) {
            console.warn("Could not save new stripeCustomerId to Firestore Admin SDK for portal:", dbErr);
          }
        }
      } catch (createCustomerErr: any) {
        console.error("Failed to auto-create customer for billing portal:", createCustomerErr);
        return res.status(400).json({
          error: "Não foi possível criar uma conta de faturamento. Por favor, tente novamente."
        });
      }
    }

    // Dynamically resolve client application URL from headers for frictionless production/preview redirects
    const host = req.get("host");
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const resolvedAppUrl = host ? `${protocol}://${host}` : (process.env.APP_URL || "http://localhost:3000");

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${resolvedAppUrl}/admin/configuracoes`,
    });

    res.json({ url: portalSession.url, stripeCustomerId });
  } catch (error: any) {
    console.error("Create Portal Session error:", error);
    res.status(500).json({ error: error.message || "Erro interno ao redirecionar para o portal da Stripe." });
  }
});

// ======== STRIPE WEBHOOKS ROUTE ========
app.post("/api/webhook/stripe", async (req: any, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error("Missing Stripe Signature or Webhook Secret.");
    return res.status(400).send("Webhook Error: Signature verification configuration missing.");
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const stripeObject = event.data.object as any;
  let customerId = stripeObject.customer as string;
  let userId = stripeObject.metadata?.userId || stripeObject.subscription_data?.metadata?.userId || stripeObject.client_reference_id;

  if (!userId && customerId) {
    userId = await getUserIdByCustomerId(customerId);
  }

  // Auditing / Logging
  if (userId) {
    await logPaymentEvent(userId, event);
  }

  try {
    const stripe = getStripe();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = stripeObject as Stripe.Checkout.Session;
        const subId = session.subscription as string;
        const custId = session.customer as string;
        const refId = session.client_reference_id || session.metadata?.userId;

        if (refId && dbAdmin && subId) {
          await dbAdmin.collection("users").doc(refId).set({
            stripe_customer_id: custId,
            stripe_subscription_id: subId,
            subscription_status: "active",
          }, { merge: true });

          const subscription = (await stripe.subscriptions.retrieve(subId)) as any;
          await updateUserSubscription(refId, subscription, custId);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = stripeObject as any;
        const custId = subscription.customer as string;

        if (userId && dbAdmin) {
          await updateUserSubscription(userId, subscription, custId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = stripeObject as any;

        if (userId && dbAdmin) {
          await dbAdmin.collection("users").doc(userId).set({
            subscription_status: "canceled",
          }, { merge: true });

          // Update details
          await dbAdmin
            .collection("users")
            .doc(userId)
            .collection("subscriptions")
            .doc(subscription.id)
            .set({
              status: "canceled",
              currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
            }, { merge: true });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = stripeObject as any;
        const subId = invoice.subscription as string;
        const custId = invoice.customer as string;

        if (userId && dbAdmin) {
          // Record payment
          await dbAdmin
            .collection("users")
            .doc(userId)
            .collection("payments")
            .doc(invoice.payment_intent as string || invoice.id)
            .set({
              id: invoice.payment_intent as string || invoice.id,
              amount: invoice.amount_paid / 100,
              currency: invoice.currency,
              status: "succeeded",
              paymentMethod: "Stripe Checkout",
              invoiceId: invoice.id,
              createdAt: new Date().toISOString(),
            });

          // Record invoice
          await dbAdmin
            .collection("users")
            .doc(userId)
            .collection("invoices")
            .doc(invoice.id)
            .set({
              id: invoice.id,
              amountPaid: invoice.amount_paid / 100,
              amountDue: invoice.amount_due / 100,
              status: invoice.status,
              invoiceUrl: invoice.hosted_invoice_url,
              invoicePdf: invoice.invoice_pdf,
              createdAt: new Date(invoice.created * 1000).toISOString(),
            });

          // Match active status in profile
          if (subId) {
            const subscription = (await stripe.subscriptions.retrieve(subId)) as any;
            await dbAdmin.collection("users").doc(userId).set({
              subscription_status: subscription.status,
              stripe_price_id: subscription.items.data[0].price.id,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            }, { merge: true });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = stripeObject as any;

        if (userId && dbAdmin) {
          await dbAdmin.collection("users").doc(userId).set({
            subscription_status: "past_due",
          }, { merge: true });

          await dbAdmin
            .collection("users")
            .doc(userId)
            .collection("invoices")
            .doc(invoice.id)
            .set({
              id: invoice.id,
              amountPaid: invoice.amount_paid / 100,
              amountDue: invoice.amount_due / 100,
              status: "payment_failed",
              invoiceUrl: invoice.hosted_invoice_url,
              invoicePdf: invoice.invoice_pdf,
              createdAt: new Date(invoice.created * 1000).toISOString(),
            });
        }
        break;
      }

      case "payment_method.attached": {
        const pm = stripeObject as Stripe.PaymentMethod;
        if (userId && dbAdmin && pm.card) {
          const cardInfo = `${pm.card.brand.toUpperCase()} **** ${pm.card.last4}`;
          await dbAdmin.collection("users").doc(userId).set({
            payment_method: cardInfo,
          }, { merge: true });
        }
        break;
      }

      case "payment_method.detached": {
        if (userId && dbAdmin) {
          await dbAdmin.collection("users").doc(userId).set({
            payment_method: "Não Cadastrada",
          }, { merge: true });
        }
        break;
      }

      case "customer.updated": {
        console.log(`Customer updated event logged: ${customerId}`);
        break;
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error("Webhook route error:", error);
    res.status(500).send("Webhook internal server error");
  }
});


// ======== VITE MIDDLEWARE ========
export default app;

if (!process.env.VERCEL) {
  const startServer = async () => {
    if (process.env.NODE_ENV !== "production") {
      // Development mode
      const { createServer } = await import("vite");
      const vite = await createServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      // Production mode
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  };

  startServer();
}
