import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import OverviewPage from "./pages/OverviewPage";
import TradingPage from "./pages/TradingPage";
import AnalysisPage from "./pages/AnalysisPage";
import BacktestPage from "./pages/BacktestPage";
import SocialPage from "./pages/SocialPage";
import WalletsPage from "./pages/WalletsPage";
import SecurityPage from "./pages/SecurityPage";
import GemPage from "./pages/GemPage";
import GameFiPage from "./pages/GameFiPage";
import LoginPage from "./pages/LoginPage";
import UsersPage from "./pages/UsersPage";

function ProtectedLayout() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-brand-muted text-sm">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user.role === "admin";

  return (
    <div className="min-h-screen flex bg-brand-bg text-brand-text font-sans">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <Routes>
          <Route path="/" element={<OverviewPage onMenuToggle={() => setSidebarOpen(true)} />} />
          <Route path="/trading" element={<TradingPage onMenuToggle={() => setSidebarOpen(true)} />} />
          <Route path="/analysis" element={<AnalysisPage onMenuToggle={() => setSidebarOpen(true)} />} />
          <Route path="/backtest" element={<BacktestPage onMenuToggle={() => setSidebarOpen(true)} />} />
          <Route path="/social" element={<SocialPage onMenuToggle={() => setSidebarOpen(true)} />} />
          <Route path="/wallets" element={<WalletsPage onMenuToggle={() => setSidebarOpen(true)} />} />
          <Route path="/gems" element={<GemPage onMenuToggle={() => setSidebarOpen(true)} />} />
          <Route path="/gamefi" element={<GameFiPage onMenuToggle={() => setSidebarOpen(true)} />} />
          <Route path="/security" element={<SecurityPage onMenuToggle={() => setSidebarOpen(true)} />} />
          {/* Admin only */}
          {isAdmin && (
            <Route path="/users" element={<UsersPage onMenuToggle={() => setSidebarOpen(true)} />} />
          )}
        </Routes>
      </div>
      <BottomNav onMoreClick={() => setSidebarOpen(true)} />
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="w-12 h-12 border-4 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
