import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  RefreshCw,
  Clock,
  BarChart3,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Zap,
  Target,
} from "lucide-react";
import Header from "../components/Header";
import { API } from "../config";

interface ReportSummary {
  id: string;
  type: string;
  date: string;
  time: string;
  timestamp: string;
  pnl: number;
  balance: number;
  winrate: number;
  trades_closed: number;
  btc_price: number;
  fear_greed: number;
}

interface ReportDetail {
  id: string;
  type: string;
  date: string;
  time: string;
  timestamp: string;
  trading: {
    balance: number;
    open_positions: number;
    open_positions_detail: Array<{
      coin: string;
      direction: string;
      entry: number;
      pnl: number;
    }>;
    today_closed: number;
    today_pnl: number;
    today_wins: number;
    today_winrate: number;
    total_closed: number;
    total_pnl: number;
    total_winrate: number;
    auto_trade_enabled: boolean;
    top_trades: Array<{ coin: string; direction: string; pnl: number }>;
    worst_trades: Array<{ coin: string; direction: string; pnl: number }>;
  };
  market: {
    fear_greed: { value: number; sentiment: string };
    btc_price: number;
  };
  macro: {
    risk_level: string;
    events_today: Array<{
      title: string;
      type: string;
      impact: string;
      time: string;
    }>;
    events_upcoming: Array<{
      title: string;
      type: string;
      impact: string;
      hours_until: number;
      date: string;
    }>;
  };
}

function fngColor(value: number): string {
  if (value <= 25) return "text-red-400";
  if (value <= 45) return "text-orange-400";
  if (value <= 55) return "text-yellow-400";
  if (value <= 75) return "text-green-400";
  return "text-emerald-400";
}

function riskColor(level: string): string {
  if (level === "CRITICAL") return "text-red-400 bg-red-500/10 border-red-500/30";
  if (level === "HIGH") return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
  return "text-green-400 bg-green-500/10 border-green-500/30";
}

function impactBadge(impact: string) {
  const colors: Record<string, string> = {
    CRITICAL: "bg-red-500/20 text-red-300 border-red-500/40",
    HIGH: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
    MEDIUM: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  };
  return colors[impact] || "bg-gray-500/20 text-gray-300 border-gray-500/40";
}

export default function ReportsPage({
  onMenuToggle,
}: {
  onMenuToggle?: () => void;
}) {
  const [history, setHistory] = useState<ReportSummary[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [autoStatus, setAutoStatus] = useState({
    morning: true,
    nightly: true,
  });

  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/reports/history?limit=30`);
      setHistory(res.data.reports || []);
    } catch (err) {
      console.error("Failed to fetch report history:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLatest = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/reports/latest`);
      setSelectedReport(res.data);
    } catch (err) {
      console.error("Failed to fetch latest report:", err);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    fetchLatest();
  }, [fetchHistory, fetchLatest]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await axios.post(`${API}/api/reports/generate`);
      setSelectedReport(res.data);
      await fetchHistory();
    } catch (err) {
      console.error("Failed to generate report:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectReport = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    try {
      const res = await axios.get(`${API}/api/reports/${id}`);
      setSelectedReport(res.data);
      setExpandedId(id);
    } catch (err) {
      console.error("Failed to fetch report detail:", err);
    }
  };

  const toggleAuto = async (type: "morning" | "nightly") => {
    try {
      const newState = {
        ...autoStatus,
        [type]: !autoStatus[type],
      };
      const res = await axios.post(`${API}/api/reports/toggle`, {
        morning: newState.morning,
        nightly: newState.nightly,
      });
      setAutoStatus({
        morning: res.data.morning_enabled,
        nightly: res.data.nightly_enabled,
      });
    } catch (err) {
      console.error("Failed to toggle auto report:", err);
    }
  };

  const r = selectedReport;

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Báo Cáo Hiệu Suất" onMenuToggle={onMenuToggle} />

      <div className="p-4 md:p-6 space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-accent to-[#D49E20] text-brand-bg font-bold rounded-xl hover:shadow-lg hover:shadow-brand-accent/20 transition-all disabled:opacity-50 text-sm"
            >
              <RefreshCw size={16} className={generating ? "animate-spin" : ""} />
              {generating ? "Đang tạo..." : "Tạo Report Ngay"}
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => toggleAuto("morning")}
              className={`px-3 py-2 rounded-lg border transition-all font-medium ${
                autoStatus.morning
                  ? "bg-brand-accent/10 border-brand-accent/40 text-brand-accent"
                  : "bg-brand-surface border-[#1C2541] text-brand-muted"
              }`}
            >
              ☀️ Sáng 08:00 {autoStatus.morning ? "ON" : "OFF"}
            </button>
            <button
              onClick={() => toggleAuto("nightly")}
              className={`px-3 py-2 rounded-lg border transition-all font-medium ${
                autoStatus.nightly
                  ? "bg-brand-accent/10 border-brand-accent/40 text-brand-accent"
                  : "bg-brand-surface border-[#1C2541] text-brand-muted"
              }`}
            >
              🌙 Tối 23:59 {autoStatus.nightly ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* Latest Report Detail */}
        {r && (
          <div className="space-y-4">
            {/* Report Header */}
            <div className="bg-brand-surface rounded-2xl border border-[#1C2541] p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-accent/20 to-brand-accent/5 flex items-center justify-center">
                    <FileText size={20} className="text-brand-accent" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">
                      Báo Cáo {r.date}
                    </h3>
                    <p className="text-brand-muted text-xs">
                      {r.type === "morning" ? "☀️ Buổi sáng" : "📊 Cuối ngày"} · {r.time}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Balance */}
                <div className="bg-[#0B132B] rounded-xl p-3 border border-[#1C2541]/50">
                  <p className="text-brand-muted text-xs mb-1">Số dư</p>
                  <p className="text-white font-bold text-lg">
                    ${r.trading.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Today PnL */}
                <div className="bg-[#0B132B] rounded-xl p-3 border border-[#1C2541]/50">
                  <p className="text-brand-muted text-xs mb-1">PnL Hôm Nay</p>
                  <div className="flex items-center gap-1.5">
                    {r.trading.today_pnl >= 0 ? (
                      <TrendingUp size={16} className="text-emerald-400" />
                    ) : (
                      <TrendingDown size={16} className="text-rose-400" />
                    )}
                    <p className={`font-bold text-lg ${r.trading.today_pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {r.trading.today_pnl >= 0 ? "+" : ""}${r.trading.today_pnl.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Win Rate */}
                <div className="bg-[#0B132B] rounded-xl p-3 border border-[#1C2541]/50">
                  <p className="text-brand-muted text-xs mb-1">Win Rate</p>
                  <p className="text-white font-bold text-lg">
                    {r.trading.today_winrate.toFixed(1)}%
                  </p>
                  <p className="text-brand-muted text-[10px]">
                    {r.trading.today_wins}/{r.trading.today_closed} trades
                  </p>
                </div>

                {/* BTC Price */}
                <div className="bg-[#0B132B] rounded-xl p-3 border border-[#1C2541]/50">
                  <p className="text-brand-muted text-xs mb-1">BTC</p>
                  <p className="text-white font-bold text-lg">
                    ${r.market.btc_price.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Market & Macro Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fear & Greed + Macro */}
              <div className="bg-brand-surface rounded-2xl border border-[#1C2541] p-5">
                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                  <BarChart3 size={16} className="text-brand-accent" />
                  Tâm Lý Thị Trường
                </h4>

                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#1C2541"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        className={fngColor(r.market.fear_greed.value)}
                        strokeWidth="3"
                        strokeDasharray={`${r.market.fear_greed.value}, 100`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-sm font-bold ${fngColor(r.market.fear_greed.value)}`}>
                        {r.market.fear_greed.value}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className={`font-bold ${fngColor(r.market.fear_greed.value)}`}>
                      {r.market.fear_greed.sentiment}
                    </p>
                    <p className="text-brand-muted text-xs">Fear & Greed Index</p>
                  </div>
                </div>

                {/* Macro Risk */}
                <div className={`px-3 py-2 rounded-lg border text-sm font-medium ${riskColor(r.macro.risk_level)}`}>
                  <AlertTriangle size={14} className="inline mr-1.5" />
                  Macro Risk: {r.macro.risk_level}
                </div>
              </div>

              {/* Macro Events */}
              <div className="bg-brand-surface rounded-2xl border border-[#1C2541] p-5">
                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                  <Calendar size={16} className="text-brand-accent" />
                  Sự Kiện Kinh Tế
                </h4>

                {r.macro.events_today.length > 0 && (
                  <div className="mb-3">
                    <p className="text-brand-muted text-xs mb-2 font-medium">📅 Hôm Nay</p>
                    <div className="space-y-1.5">
                      {r.macro.events_today.map((ev, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${impactBadge(ev.impact)}`}>
                            {ev.impact}
                          </span>
                          <span className="text-white">{ev.title}</span>
                          {ev.time && <span className="text-brand-muted text-xs">({ev.time})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {r.macro.events_upcoming.length > 0 && (
                  <div>
                    <p className="text-brand-muted text-xs mb-2 font-medium">⏰ Sắp Tới</p>
                    <div className="space-y-1.5">
                      {r.macro.events_upcoming.slice(0, 4).map((ev, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${impactBadge(ev.impact)}`}>
                            {ev.impact}
                          </span>
                          <span className="text-white truncate">{ev.title}</span>
                          <span className="text-brand-muted text-xs whitespace-nowrap">({ev.date})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {r.macro.events_today.length === 0 && r.macro.events_upcoming.length === 0 && (
                  <p className="text-brand-muted text-sm">Không có sự kiện đáng chú ý</p>
                )}
              </div>
            </div>

            {/* Trading Details Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Open Positions */}
              <div className="bg-brand-surface rounded-2xl border border-[#1C2541] p-5">
                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                  <Target size={16} className="text-brand-accent" />
                  Vị Thế Đang Mở ({r.trading.open_positions})
                </h4>
                {r.trading.open_positions_detail.length > 0 ? (
                  <div className="space-y-2">
                    {r.trading.open_positions_detail.map((pos, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-[#0B132B] rounded-lg px-3 py-2 border border-[#1C2541]/50"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                            pos.direction === "LONG"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-rose-500/20 text-rose-400"
                          }`}>
                            {pos.direction}
                          </span>
                          <span className="text-white font-medium text-sm">{pos.coin}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-brand-muted text-xs">${pos.entry.toLocaleString()}</p>
                          <p className={`text-xs font-bold ${pos.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {pos.pnl >= 0 ? "+" : ""}${pos.pnl.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-brand-muted text-sm">Không có vị thế mở</p>
                )}
              </div>

              {/* Cumulative Stats */}
              <div className="bg-brand-surface rounded-2xl border border-[#1C2541] p-5">
                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                  <Zap size={16} className="text-brand-accent" />
                  Thống Kê Tích Lũy
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-brand-muted text-sm">Tổng lệnh đóng</span>
                    <span className="text-white font-bold">{r.trading.total_closed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-brand-muted text-sm">Win Rate tổng</span>
                    <span className="text-white font-bold">{r.trading.total_winrate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-brand-muted text-sm">PnL tích lũy</span>
                    <span className={`font-bold ${r.trading.total_pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {r.trading.total_pnl >= 0 ? "+" : ""}${r.trading.total_pnl.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-brand-muted text-sm">Auto-Trade</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      r.trading.auto_trade_enabled
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-rose-500/20 text-rose-400"
                    }`}>
                      {r.trading.auto_trade_enabled ? "ON" : "OFF"}
                    </span>
                  </div>

                  {/* Top Trades */}
                  {r.trading.top_trades.length > 0 && (
                    <div className="pt-2 border-t border-[#1C2541]">
                      <p className="text-brand-muted text-xs mb-2">🏆 Best Trades</p>
                      {r.trading.top_trades
                        .filter((t) => t.pnl > 0)
                        .slice(0, 3)
                        .map((t, i) => (
                          <p key={i} className="text-emerald-400 text-xs">
                            🟢 {t.coin} {t.direction} → +${t.pnl.toFixed(2)}
                          </p>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report History */}
        <div className="bg-brand-surface rounded-2xl border border-[#1C2541] p-5">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Clock size={18} className="text-brand-accent" />
            Lịch Sử Báo Cáo
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <FileText size={32} className="text-brand-muted mx-auto mb-2" />
              <p className="text-brand-muted text-sm">Chưa có báo cáo nào</p>
              <p className="text-brand-muted text-xs mt-1">Bấm "Tạo Report Ngay" để tạo báo cáo đầu tiên</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((report) => (
                <button
                  key={report.id}
                  onClick={() => handleSelectReport(report.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                    expandedId === report.id
                      ? "bg-brand-accent/5 border-brand-accent/30"
                      : "bg-[#0B132B] border-[#1C2541]/50 hover:border-[#2B3A63]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {expandedId === report.id ? (
                        <ChevronDown size={14} className="text-brand-accent" />
                      ) : (
                        <ChevronRight size={14} className="text-brand-muted" />
                      )}
                      <div>
                        <p className="text-white font-medium text-sm">
                          {report.date}
                          <span className="text-brand-muted ml-2 text-xs">{report.time}</span>
                        </p>
                        <p className="text-brand-muted text-xs">
                          {report.trades_closed} trades · WR: {report.winrate.toFixed(1)}% · BTC ${report.btc_price.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`font-bold text-sm ${report.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {report.pnl >= 0 ? "+" : ""}${report.pnl.toFixed(2)}
                      </p>
                      <p className="text-brand-muted text-xs">
                        F&G: {report.fear_greed}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
