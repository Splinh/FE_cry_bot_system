import { Activity, Menu } from "lucide-react";

export default function Header({
  title,
  subtitle,
  onMenuToggle,
}: {
  title: string;
  subtitle?: string;
  onMenuToggle?: () => void;
}) {
  return (
    <header className="h-14 md:h-16 flex items-center justify-between px-4 md:px-8 bg-brand-surface/80 border-b border-[#1C2541] backdrop-blur-md z-10 shrink-0">
      <div className="flex items-center space-x-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden p-1.5 rounded-lg text-brand-muted hover:text-white hover:bg-[#1C2541] transition-all cursor-pointer"
          >
            <Menu size={22} />
          </button>
        )}
        <div>
          <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">{title}</h2>
          {subtitle && (
            <p className="text-[10px] md:text-xs text-brand-muted mt-0.5 uppercase tracking-widest font-semibold flex items-center">
              <Activity size={11} className="mr-1" /> {subtitle}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
