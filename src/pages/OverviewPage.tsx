import { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Wallet, Send, Clock, Activity, Calendar, AlertTriangle, Shield } from "lucide-react";
import Header from "../components/Header";

import { API } from "../config";

export default function OverviewPage({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const [data, setData] = useState<any>(null);
  const [pnlHistory, setPnlHistory] = useState<any[]>([]);
  const [macroRisk, setMacroRisk] = useState<any>({});

  // Fetch macro risk
  useEffect(() => {
    const fetchMacro = async () => {
      try {
        const res = await axios.get(`${API}/api/macro/risk`);
        setMacroRisk(res.data || {});
      } catch {}
    };
    fetchMacro();
    const iv = setInterval(fetchMacro, 60000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API}/api/overview`);
        setData(res.data);
        // Mô phỏng biểu đồ PnL timeline
        setPnlHistory((prev) => {
          const now = new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          });
          const next = [...prev, { time: now, value: res.data.total_pnl || 0 }];
          return next.slice(-20);
        });
      } catch {}
    };
    fetch();
    const iv = setInterval(fetch, 5000);
    return () => clearInterval(iv);
  }, []);

  if (!data)
    return (
      <div className="flex-1 flex items-center justify-center text-brand-muted">
        Loading...
      </div>
    );

  const cards = [
    {
      title: "Balance",
      value: `$${(data.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: Wallet,
      color: "text-brand-accent",
    },
    {
      title: "Realized PnL",
      value: `$${(data.total_pnl || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: data.total_pnl >= 0 ? "text-green-400" : "text-red-400",
    },
    {
      title: "Win Rate",
      value: `${(data.win_rate || 0).toFixed(1)}%`,
      icon: Activity,
      color: "text-blue-400",
    },
    {
      title: "Uptime",
      value: `${data.uptime_minutes || 0} min`,
      icon: Clock,
      color: "text-purple-400",
    },
    {
      title: "Open Positions",
      value: data.open_positions_count || 0,
      icon: TrendingUp,
      color: "text-brand-accent",
    },
    {
      title: "Tele Bots",
      value: data.tele_bots || 0,
      icon: Send,
      color: "text-blue-400",
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <Header title="Dashboard Overview" subtitle="Live Terminal" onMenuToggle={onMenuToggle} />
      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4">
          {cards.map((c, i) => (
            <div
              key={i}
              className="bg-brand-surface border border-[#1C2541] rounded-xl p-3 md:p-4 hover:border-brand-accent/40 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-brand-muted uppercase tracking-widest font-semibold">
                  {c.title}
                </span>
                <c.icon
                  size={14}
                  className={`${c.color} opacity-40 group-hover:opacity-100 transition-opacity`}
                />
              </div>
              <div className={`text-lg md:text-xl font-extrabold ${c.color}`}>
                {c.value}
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-brand-surface border border-[#1C2541] rounded-2xl p-4 md:p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-accent/5 rounded-full blur-[80px]" />
          <h3 className="text-lg font-bold text-white mb-4 relative z-10">
            PnL Timeline (Live)
          </h3>
          <div className="h-48 md:h-64 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pnlHistory}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1C2541"
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  stroke="#5A6785"
                  tick={{ fill: "#8AA2CA", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="#5A6785"
                  tick={{ fill: "#8AA2CA", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(11,19,43,0.95)",
                    borderColor: "#2B3A63",
                    borderRadius: 8,
                    color: "#fff",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#F3BA2F"
                  strokeWidth={3}
                  dot={{
                    r: 3,
                    fill: "#0B132B",
                    stroke: "#F3BA2F",
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-5">
            <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">
              System
            </h4>
            <div className="space-y-2 text-sm">
              <Row
                label="Status"
                value={
                  <span className="text-green-400 font-bold">
                    {data.status}
                  </span>
                }
              />
              <Row label="Version" value={data.version} />
              <Row
                label="Auto-Trade"
                value={
                  data.auto_trade ? (
                    <span className="text-green-400">ON</span>
                  ) : (
                    <span className="text-red-400">OFF</span>
                  )
                }
              />
              <Row label="Admins" value={data.admin_count} />
              <Row label="Total Trades" value={data.total_trades} />
            </div>
          </div>
          <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-5">
            <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">
              Botnet
            </h4>
            <div className="space-y-2 text-sm">
              <Row label="Telegram Sessions" value={data.tele_bots} />
              <Row label="Twitter Accounts" value={data.twitter_bots} />
              <Row
                label="Network"
                value={
                  data.tele_bots + data.twitter_bots > 0 ? (
                    <span className="text-green-400">Active</span>
                  ) : (
                    <span className="text-brand-muted">Idle</span>
                  )
                }
              />
            </div>
          </div>

          {/* Upcoming Macro Events */}
          <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-5 md:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
                <Calendar size={14} className="mr-2 text-blue-400" />
                Sự Kiện Sắp Tới
              </h4>
              {macroRisk.risk_level && (
                <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                  macroRisk.risk_level === "CRITICAL"
                    ? "bg-red-500/15 text-red-400 animate-pulse"
                    : macroRisk.risk_level === "HIGH"
                      ? "bg-yellow-500/15 text-yellow-400"
                      : "bg-green-500/15 text-green-400"
                }`}>
                  {macroRisk.risk_level === "CRITICAL" ? "🔴" : macroRisk.risk_level === "HIGH" ? "🟡" : "🟢"} {macroRisk.risk_level || "NORMAL"}
                </span>
              )}
            </div>

            {/* Risk Warning */}
            {macroRisk.warnings?.length > 0 && (
              <div className={`mb-3 px-3 py-2 rounded-lg border text-xs ${
                macroRisk.risk_level === "CRITICAL"
                  ? "bg-red-500/5 border-red-500/20 text-red-400"
                  : "bg-yellow-500/5 border-yellow-500/20 text-yellow-400"
              }`}>
                <AlertTriangle size={12} className="inline mr-1" />
                {macroRisk.warnings[0]?.message || "Có sự kiện kinh tế quan trọng sắp tới"}
              </div>
            )}

            {/* Events List */}
            <div className="space-y-1.5">
              {(macroRisk.upcoming_events || []).length === 0 ? (
                <p className="text-brand-muted text-xs text-center py-3">Không có sự kiện nào trong tuần</p>
              ) : (
                (macroRisk.upcoming_events || []).slice(0, 5).map((ev: any, i: number) => {
                  const hoursUntil = ev.hours_until || 0;
                  const isUrgent = hoursUntil > 0 && hoursUntil <= 24;
                  const impactBadge =
                    ev.impact === "CRITICAL" ? "bg-red-500/15 text-red-400"
                      : ev.impact === "HIGH" ? "bg-yellow-500/15 text-yellow-400"
                        : "bg-blue-500/10 text-blue-400";
                  return (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#1C2541]/50">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${impactBadge}`}>
                          {ev.type}
                        </span>
                        <span className="text-xs text-white truncate">{ev.title}</span>
                      </div>
                      <div className={`text-xs font-bold shrink-0 ml-2 ${
                        isUrgent ? "text-red-400" : "text-brand-muted"
                      }`}>
                        <Clock size={10} className="inline mr-0.5" />
                        {hoursUntil < 1
                          ? `${Math.round(hoursUntil * 60)}m`
                          : hoursUntil < 24
                            ? `${Math.round(hoursUntil)}h`
                            : `${Math.round(hoursUntil / 24)}d`}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-[#1C2541]/50">
      <span className="text-brand-muted">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}
