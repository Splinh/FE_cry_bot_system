import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Send,
  Wallet,
  Settings,
  Bot,
  Shield,
  Gem,
  LogOut,
  X,
  Gamepad2,
  Users,
  History,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const allLinks = [
  { to: "/", icon: LayoutDashboard, label: "Overview", perm: "overview" },
  { to: "/trading", icon: TrendingUp, label: "Đặt Lệnh", perm: "trading" },
  { to: "/analysis", icon: BarChart3, label: "Phân Tích", perm: "analysis" },
  { to: "/backtest", icon: History, label: "Backtest", perm: "backtest" },
  { to: "/social", icon: Send, label: "Social Airdrop", perm: "social" },
  { to: "/wallets", icon: Wallet, label: "Wallets", perm: "wallets" },
  { to: "/gems", icon: Gem, label: "Gem Scanner", perm: "gems" },
  { to: "/gamefi", icon: Gamepad2, label: "GameFi Tracker", perm: "gamefi" },
  { to: "/security", icon: Shield, label: "Security", perm: "security" },
];

export default function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const { user, logout } = useAuth();

  const [btcPrice, setBtcPrice] = useState<string>("62700.00");
  const [priceChange, setPriceChange] = useState<string>("0.00");

  useEffect(() => {
    const ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@ticker");
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.c) {
          const price = parseFloat(data.c).toFixed(2);
          setBtcPrice(price);
          setPriceChange(parseFloat(data.P).toFixed(2));
          
          const sign = parseFloat(data.P) >= 0 ? "🟢" : "🔴";
          document.title = `${sign} $${parseFloat(price).toLocaleString()} | CryptoBot`;
        }
      } catch (err) {
        console.error("Error parsing Binance WS ticker:", err);
      }
    };
    return () => {
      ws.close();
    };
  }, []);

  const isAdmin = user?.role === "admin";
  const userPerms = user?.permissions || [];

  // Admin sees everything, regular users see only permitted links
  const links = isAdmin
    ? allLinks
    : allLinks.filter((l) => userPerms.includes(l.perm));

  const sidebarContent = (
    <>
      <div className="p-6 flex items-center justify-between border-b border-[#1C2541]/50">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-accent to-[#D49E20] flex items-center justify-center shadow-lg shadow-brand-accent/20">
            <Bot size={22} className="text-brand-bg" />
          </div>
          <h1 className="text-xl font-bold tracking-wider text-white">
            CRYPTO<span className="text-brand-accent">BOT</span>
          </h1>
        </div>
        {/* Close button - mobile only */}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg text-brand-muted hover:text-white hover:bg-[#1C2541] transition-all cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 mt-6">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-300 font-medium ${
                isActive
                  ? "bg-gradient-to-r from-brand-accent/20 to-transparent border-l-4 border-brand-accent text-brand-accent shadow-[inset_20px_0_20px_-20px_rgba(243,186,47,0.3)]"
                  : "text-[#8AA2CA] border-l-4 border-transparent hover:bg-[#1C2541]/50 hover:text-white hover:border-[#2B3A63]"
              }`
            }
          >
            <Icon size={20} />
            <span className="text-sm tracking-wide">{label}</span>
          </NavLink>
        ))}

        {/* Admin-only: User Management */}
        {isAdmin && (
          <NavLink
            to="/users"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-300 font-medium ${
                isActive
                  ? "bg-gradient-to-r from-brand-accent/20 to-transparent border-l-4 border-brand-accent text-brand-accent shadow-[inset_20px_0_20px_-20px_rgba(243,186,47,0.3)]"
                  : "text-[#8AA2CA] border-l-4 border-transparent hover:bg-[#1C2541]/50 hover:text-white hover:border-[#2B3A63]"
              }`
            }
          >
            <Users size={20} />
            <span className="text-sm tracking-wide">Quản Lý Users</span>
          </NavLink>
        )}
      </nav>

      <div className="p-4 border-t border-[#1C2541] bg-[#0A1024] space-y-2.5">
        {/* Realtime Price Ticker */}
        <div className="px-4 py-3 bg-[#0B132B] border border-[#1C2541] rounded-xl flex items-center justify-between shadow-inner">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${parseFloat(priceChange) >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${parseFloat(priceChange) >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <span className="text-xs text-[#8AA2CA] font-medium tracking-wide">BTC/USDT</span>
          </div>
          <div className="text-right">
            <p className={`text-sm font-bold tracking-tight ${parseFloat(priceChange) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ${parseFloat(btcPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className={`text-[10px] font-semibold ${parseFloat(priceChange) >= 0 ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
              {parseFloat(priceChange) >= 0 ? '+' : ''}{priceChange}%
            </p>
          </div>
        </div>

        {user && (
          <div className="flex items-center justify-between px-4 py-2">
            <div>
              <p className="text-white text-sm font-bold">{user.username}</p>
              <p className="text-[10px] text-brand-accent font-bold uppercase">
                {user.role}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg text-[#8AA2CA] hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
        <NavLink
          to="/settings"
          onClick={onClose}
          className="flex items-center space-x-3 px-4 py-3.5 rounded-xl text-[#8AA2CA] hover:text-white transition-all font-medium"
        >
          <Settings size={20} />
          <span className="text-sm tracking-wide">Settings</span>
        </NavLink>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-brand-surface border-r border-[#1C2541] flex-col z-10 shadow-xl shadow-black/20 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={onClose}
          />
          <aside className="fixed inset-y-0 left-0 w-72 bg-brand-surface flex flex-col z-50 shadow-2xl shadow-black/40 md:hidden animate-slide-in">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
