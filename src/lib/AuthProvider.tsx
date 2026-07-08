import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface DBUserType {
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_price_id?: string;
  subscription_status?: string;
  next_billing_date?: string;
  current_period_end?: string;
  trial_end?: string;
  payment_method?: string;
  email?: string;
  displayName?: string;
}

interface AuthContextType {
  user: User | null;
  dbUser: DBUserType | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

import { ReactNode } from "react";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DBUserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubSnapshot: (() => void) | null = null;

    // Processar o resultado de login via redirecionamento (especialmente útil no mobile)
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log("Usuário autenticado com sucesso via redirect:", result.user);
        }
      })
      .catch((error: any) => {
        console.error("Erro no redirecionamento do Firebase Auth:", error);
        if (error.code === "auth/unauthorized-domain") {
          toast.error("Domínio não autorizado! Adicione luminaagendamento.com.br e seu link do Vercel aos 'Domínios Autorizados' no Console do Firebase.");
        } else {
          toast.error("Erro ao completar login via redirecionamento. Verifique se os pop-ups ou cookies estão permitidos.");
        }
      });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (unsubSnapshot) {
        unsubSnapshot();
        unsubSnapshot = null;
      }

      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        unsubSnapshot = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            setDbUser(snapshot.data() as DBUserType);
          } else {
            // Auto create free tier user doc on first sign in
            setDoc(userRef, {
              email: currentUser.email || "",
              displayName: currentUser.displayName || "",
              subscription_status: "free",
              createdAt: new Date().toISOString()
            }).catch((e) => {
              console.error("Error creating default user profile:", e);
            });
          }
        }, (error) => {
          console.error("Firestore onSnapshot error for user profile:", error);
          // Let's call handleFirestoreError for tracking, but don't halt the UI
          try {
            handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
          } catch (e) {
            // Ignored
          }
        });

        // Background synchronization of Stripe subscription status to heal missing database records
        const syncStripeSubscription = async () => {
          try {
            const idToken = await currentUser.getIdToken();
            const res = await fetch("/api/payment/subscription-status", {
              headers: {
                "Authorization": `Bearer ${idToken}`
              }
            });
            if (res.ok) {
              const data = await res.json();
              if (data.status === "success" || (data.status === "none" && data.customerId)) {
                await setDoc(userRef, {
                  stripe_customer_id: data.customerId || null,
                  stripe_subscription_id: data.subscriptionId || null,
                  stripe_price_id: data.priceId || null,
                  subscription_status: data.subscriptionStatus || "free",
                  current_period_end: data.currentPeriodEnd ? new Date(data.currentPeriodEnd * 1000).toISOString() : null,
                }, { merge: true });
              }
            }
          } catch (syncErr) {
            console.warn("Background Stripe subscription status sync failed:", syncErr);
          }
        };
        syncStripeSubscription();
      } else {
        setDbUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    // Verificar se o dispositivo é móvel ou tela muito pequena (onde popups falham)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

    if (isMobile) {
      try {
        await signInWithRedirect(auth, provider);
      } catch (error: any) {
        console.error("Sign-in with redirect error", error);
        toast.error("Erro ao fazer login via redirecionamento. Tente novamente.");
      }
      return;
    }

    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Sign-in error", error);
      if (error.code === "auth/popup-blocked") {
        toast.info("Pop-up bloqueado pelo navegador. Redirecionando para página de login...");
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirectError) {
          console.error("Redirect fallback error", redirectError);
          toast.error("Falha ao tentar redirecionar. Permita pop-ups no navegador e tente de novo.");
        }
      } else if (error.code === "auth/unauthorized-domain") {
        toast.error("Domínio não autorizado no Firebase! Adicione luminaagendamento.com.br e seu link do Vercel aos 'Domínios Autorizados' no Console do Firebase.");
      } else {
        toast.error("Falha ao entrar com Google. Se tiver bloqueadores de pop-up ou cookies, por favor, permita-os.");
      }
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign-out error", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, dbUser, loading, signIn, logOut }}>
      {loading ? (
        <div className="flex h-screen w-full items-center justify-center bg-brand-50">
          <Loader2 className="h-8 w-8 animate-spin text-brand-900" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

