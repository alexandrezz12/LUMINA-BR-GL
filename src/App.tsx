/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminLojas } from './pages/AdminLojas';
import { AdminLojaDetalhes } from './pages/AdminLojaDetalhes';
import { AdminAgendamentos } from './pages/AdminAgendamentos';
import { AdminConfig } from './pages/AdminConfig';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { PublicBooking } from './pages/PublicBooking';
import { LandingPage } from './pages/LandingPage';
import { Pricing } from './pages/Pricing';
import { Login } from './pages/Login';
import { AuthProvider, useAuth } from './lib/AuthProvider';
import { Loader2, Menu } from 'lucide-react';
import { useState } from 'react';
import { Toaster } from 'sonner';

import { ReactNode } from 'react';

// Require authenticated user AND active subscription
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, dbUser, loading } = useAuth();
  
  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-brand-50">
      <Loader2 className="h-8 w-8 animate-spin text-brand-900" />
    </div>
  );
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isSuperAdmin = user.email === "alexandrealvesszz12@gmail.com";
  const subscriptionStatus = dbUser?.subscription_status;
  
  // Calculate if the user is within the 7-day free trial period since registration (createdAt)
  let isWithinTrial = false;
  if (dbUser?.createdAt) {
    try {
      const createdTime = new Date(dbUser.createdAt).getTime();
      const now = new Date().getTime();
      const diffTime = now - createdTime;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      if (diffDays >= 0 && diffDays <= 7) {
        isWithinTrial = true;
      }
    } catch (e) {
      console.error("Error parsing user createdAt date:", e);
    }
  }

  const hasActiveSubscription = 
    subscriptionStatus === "active" || 
    subscriptionStatus === "trialing" || 
    isWithinTrial;

  if (!isSuperAdmin && !hasActiveSubscription) {
    return <Navigate to="/admin/planos" replace />;
  }
  
  return <>{children}</>;
}

// Require authenticated user (for selecting a plan / managing subscriptions)
function SubscriptionRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-brand-50">
      <Loader2 className="h-8 w-8 animate-spin text-brand-900" />
    </div>
  );
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function PricingPageWrapper() {
  const { dbUser } = useAuth();
  return <Pricing currentStatus={dbUser?.subscription_status} />;
}

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-brand-50 flex flex-col md:flex-row">
        {/* Mobile Header */}
        <div className="md:hidden bg-brand-950 text-white p-4 flex justify-between items-center z-20 sticky top-0">
          <div className="flex items-center gap-3">
            <span className="text-xl font-medium tracking-tight">Lumina Admin</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="p-2 -mr-2 text-brand-300 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 md:ml-64 overflow-y-auto min-h-screen relative">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/super" element={<SuperAdminDashboard />} />
            <Route path="/lojas" element={<AdminLojas />} />
            <Route path="/loja" element={<AdminLojaDetalhes />} />
            <Route path="/lojas/:tenantId" element={<AdminLojaDetalhes />} />
            <Route path="/agendamentos" element={<AdminAgendamentos />} />
            <Route path="/configuracoes" element={<AdminConfig />} />
          </Routes>
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/planos" element={
            <SubscriptionRoute>
              <PricingPageWrapper />
            </SubscriptionRoute>
          } />
          <Route path="/admin/*" element={<AdminLayout />} />
          <Route path="/b/:slug" element={<PublicBooking />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

