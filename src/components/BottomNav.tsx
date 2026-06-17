import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Wallet,
  MoreHorizontal,
} from "lucide-react";

/**
 * Bottom Navigation Bar — Mobile Only.
 * Hien thi 5 tab chinh, tab "More" mo sidebar.
 */
export default function BottomNav({ onMoreClick }: { onMoreClick?: () => void }) {
  const location = useLocation();
  
  const tabs = [
    { to: "/", icon: LayoutDashboard, label: "Tổng Quan" },
    { to: "/trading", icon: TrendingUp, label: "Giao Dịch" },
    { to: "/analysis", icon: BarChart3, label: "Phân Tích" },
    { to: "/wallets", icon: Wallet, label: "Ví" },
  ];

  const isMoreActive = ["/social", "/gems", "/gamefi", "/security", "/backtest", "/users"].some(
    (p) => location.pathname.startsWith(p)
  );

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-brand-surface/95 backdrop-blur-lg border-t border-[#1C2541] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
                isActive
                  ? "text-brand-accent"
                  : "text-brand-muted active:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`relative ${isActive ? "scale-110" : ""} transition-transform`}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-accent" />
                  )}
                </div>
                <span className={`text-[10px] mt-1 font-medium ${isActive ? "font-bold" : ""}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
        
        {/* More tab → opens sidebar */}
        <button
          onClick={onMoreClick}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 cursor-pointer ${
            isMoreActive ? "text-brand-accent" : "text-brand-muted active:text-white"
          }`}
        >
          <div className={`relative ${isMoreActive ? "scale-110" : ""} transition-transform`}>
            <MoreHorizontal size={22} strokeWidth={isMoreActive ? 2.5 : 1.8} />
            {isMoreActive && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-accent" />
            )}
          </div>
          <span className={`text-[10px] mt-1 font-medium ${isMoreActive ? "font-bold" : ""}`}>
            Thêm
          </span>
        </button>
      </div>
    </nav>
  );
}
