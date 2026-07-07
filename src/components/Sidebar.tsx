import { Sparkles, Calendar, Users, Settings, Activity, LogOut, ShieldAlert, Store, CreditCard } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";
import { useAuth } from "../lib/AuthProvider";

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const location = useLocation();
  const { user, dbUser, logOut } = useAuth();

  const links = [
    { href: "/admin", label: "Dashboard", icon: Activity },
    { href: "/admin/loja", label: "Minha Loja", icon: Store },
    { href: "/admin/agendamentos", label: "Agendamentos", icon: Calendar },
    { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
  ];

  const isSuperAdmin = user?.email === 'alexandrealvesszz12@gmail.com';

  return (
    <>
      <div 
        className={cn("fixed inset-0 bg-brand-950/80 z-30 md:hidden transition-opacity duration-300", isOpen ? "opacity-100" : "opacity-0 pointer-events-none")} 
        onClick={onClose} 
      />
      <aside className={cn(
        "w-64 bg-brand-950 text-brand-50 flex flex-col h-screen fixed top-0 left-0 z-40 transition-transform duration-300 ease-in-out md:translate-x-0 tracking-tight",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex flex-col gap-2 border-b border-brand-800">
          <div className="flex justify-between items-center w-full">
            <div className="w-8 h-8 rounded-full bg-brand-800 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand-100" />
            </div>
            <button onClick={onClose} className="md:hidden text-brand-400 hover:text-white p-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
          <h1 className="text-xl font-medium tracking-tight mt-2">
            Lumina Admin
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                  isActive 
                    ? "bg-brand-800 text-white" 
                    : "text-brand-300 hover:bg-brand-800/50 hover:text-brand-50"
                )}
              >
                <link.icon className={cn(
                  "w-4 h-4", 
                  isActive ? "text-brand-100" : "text-brand-400 group-hover:text-brand-300"
                )} />
                {link.label}
              </Link>
            );
          })}

          <Link
            to="/admin/planos"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
              location.pathname === "/admin/planos"
                ? "bg-brand-800 text-white"
                : "text-brand-300 hover:bg-brand-800/50 hover:text-brand-50"
            )}
          >
            <CreditCard className="w-4 h-4 text-brand-400 group-hover:text-brand-300" />
            Minha Assinatura
          </Link>

          {isSuperAdmin && (
            <div className="pt-6 mt-6 border-t border-brand-800 space-y-1">
              <span className="px-3 text-xs font-semibold text-brand-400 uppercase tracking-wider">Super Admin</span>
              <Link
                to="/admin/super"
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group mt-2",
                  location.pathname === "/admin/super"
                    ? "bg-brand-800 text-white" 
                    : "text-brand-300 hover:bg-brand-800/50 hover:text-brand-50"
                )}
              >
                <ShieldAlert className={cn(
                  "w-4 h-4", 
                  location.pathname === "/admin/super" ? "text-brand-100" : "text-brand-400 group-hover:text-brand-300"
                )} />
                Painel Mestre
              </Link>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-brand-800">
          <button onClick={() => { logOut(); onClose?.(); }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-400 hover:text-brand-50 hover:bg-brand-800/50 transition-all w-full text-left">
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
