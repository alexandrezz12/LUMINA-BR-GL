import React, { useState, FormEvent } from "react";
import { useAuth } from "../lib/AuthProvider";
import { Navigate, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Loader2, ArrowRight, Chrome } from "lucide-react";
import { toast } from "sonner";

export function Login() {
  const { user, signIn, signInWithEmail, signUpWithEmail } = useAuth();
  const navigate = useNavigate();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !name)) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, name);
        toast.success("Conta criada com sucesso! Seja bem-vindo ao Lumina.");
      } else {
        await signInWithEmail(email, password);
        toast.success("Login efetuado com sucesso!");
      }
      navigate("/admin");
    } catch (err: any) {
      console.error("Erro na autenticação:", err);
      let errMsg = "Ocorreu um erro ao processar a autenticação.";
      
      if (err.code === "auth/email-already-in-use") {
        errMsg = "Este e-mail já está sendo utilizado por outra conta.";
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        errMsg = "E-mail ou senha incorretos. Por favor, verifique.";
      } else if (err.code === "auth/invalid-email") {
        errMsg = "O formato do e-mail inserido é inválido.";
      } else if (err.message) {
        errMsg = err.message;
      }
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn();
      // AuthProvider redirect state will automatically navigate if redirecting,
      // or the useEffect/App.tsx logic will handle the redirect on popup.
    } catch (err: any) {
      console.error("Erro ao fazer login com Google:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-brand-50 px-4">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-1/2 w-[600px] h-[250px] bg-brand-900/5 rounded-full blur-[100px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      
      <div className="bg-white p-8 sm:p-10 rounded-3xl border border-brand-100 shadow-xl max-w-md w-full relative z-10 transition-all">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-950 tracking-tight">Lumina</h1>
          <p className="text-brand-500 text-sm mt-1">
            {isSignUp ? "Crie sua conta para começar" : "Gestão de agendamentos premium"}
          </p>
        </div>

        {/* Toggle tabs */}
        <div className="flex bg-brand-50 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setEmail(""); setPassword(""); setName(""); }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${!isSignUp ? "bg-white text-brand-950 shadow-sm" : "text-brand-400 hover:text-brand-700"}`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setEmail(""); setPassword(""); setName(""); }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${isSignUp ? "bg-white text-brand-950 shadow-sm" : "text-brand-400 hover:text-brand-700"}`}
          >
            Criar Conta
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-brand-800" htmlFor="name">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
                <input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-brand-50/50 border border-brand-100/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-brand-950 placeholder-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-900/10 focus:border-brand-900 transition-all"
                  required={isSignUp}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-brand-800" htmlFor="email">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
              <input
                id="email"
                type="email"
                placeholder="exemplo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-brand-50/50 border border-brand-100/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-brand-950 placeholder-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-900/10 focus:border-brand-900 transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-brand-800" htmlFor="password">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
              <input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-brand-50/50 border border-brand-100/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-brand-950 placeholder-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-900/10 focus:border-brand-900 transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-900 hover:bg-brand-800 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 shadow-md cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {isSignUp ? "Criar Minha Conta" : "Entrar no Sistema"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-brand-100"></div>
          <span className="flex-shrink mx-4 text-brand-400 text-xs font-semibold uppercase tracking-wider">ou entrar com</span>
          <div className="flex-grow border-t border-brand-100"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white hover:bg-brand-50 disabled:opacity-50 text-brand-900 border border-brand-200 font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
        >
          <Chrome className="w-4 h-4 text-brand-900 shrink-0" />
          Google
        </button>

        <div className="text-center mt-8 text-xs text-brand-400">
          {isSignUp ? (
            <p>
              Ao se cadastrar, você concorda com nossos{" "}
              <a href="#" className="underline hover:text-brand-600">Termos de Uso</a> e{" "}
              <a href="#" className="underline hover:text-brand-600">Políticas de Privacidade</a>.
            </p>
          ) : (
            <p>
              Precisa de ajuda? Entre em contato com{" "}
              <a href="mailto:suporte@luminaagendamentos.com" className="underline hover:text-brand-600">suporte@luminaagendamentos.com</a>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
