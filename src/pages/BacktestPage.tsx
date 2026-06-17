import { useState, useEffect } from "react";
import axios from "axios";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  History,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Loader,
  BarChart3,
  Target,
  Shield,
  Flame,
} from "lucide-react";
import Header from "../components/Header";
import { API } from "../config";

const TIMEFRAMES = ["5m", "15m", "1h", "4h", "1d"];
const PERIODS = [
  { label: "7 ngày", days: 7 },
  { label: "14 ngày", days: 14 },
  { label: "30 ngày", days: 30 },
  { label: "90 ngày", days: 90 },
  { label: "180 ngày", days: 180 },
  { label: "1 năm", days: 365 },
];

const COINS = [
  "BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX",
  "DOT", "MATIC", "LINK", "UNI", "LTC", "ATOM", "APT", "ARB",
  "OP", "INJ", "SUI", "SEI", "NEAR", "PEPE", "WIF", "BONK",
];

export default function BacktestPage({ onMenuToggle }: { onMenuToggle?: () => void }) {
  // Config
  const [coin, setCoin] = useState("BTC");
  const [timeframe, setTimeframe] = useState("1h");
  const [days, setDays] = useState(30);
  const [leverage, setLeverage] = useState(1);
  const [riskPerTrade, setRiskPerTrade] = useState(0.02);
  const [slPct, setSlPct] = useState(0.02);
  const [tp1Pct, setTp1Pct] = useState(0.03);
  const [tp2Pct, setTp2Pct] = useState(0.06);
  const [tp3Pct, setTp3Pct] = useState(0.10);
  const [minScore, setMinScore] = useState(3);

  // State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [presets, setPresets] = useState<any>({});
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tab, setTab] = useState<"metrics" | "trades" | "signals">("metrics");

  useEffect(() => {
    axios.get(`${API}/api/backtest/presets`).then(r => {
      setPresets(r.data.presets || {});
    }).catch(() => {});
  }, []);

  const applyPreset = (key: string) => {
    const p = presets[key];
    if (!p) return;
    setRiskPerTrade(p.risk_per_trade);
    setSlPct(p.sl_pct);
    setTp1Pct(p.tp1_pct);
    setTp2Pct(p.tp2_pct);
    setTp3Pct(p.tp3_pct);
    setMinScore(p.min_score);
    setLeverage(p.leverage);
    setActivePreset(key);
  };

  const runBacktest = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post(`${API}/api/backtest/run`, {
        coin, timeframe, days, leverage,
        risk_per_trade: riskPerTrade,
        sl_pct: slPct,
        tp1_pct: tp1Pct,
        tp2_pct: tp2Pct,
        tp3_pct: tp3Pct,
        min_score: minScore,
      });
      setResult(res.data);
      setTab("metrics");
    } catch (e: any) {
      setResult({ error: e.response?.data?.detail || "Lỗi chạy backtest" });
    }
    setLoading(false);
  };

  const m = result?.metrics || {};
  const equityCurve = result?.equity_curve || [];
  const trades = result?.trades || [];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <Header title="Backtesting" subtitle="Test chiến lược trên dữ liệu lịch sử" onMenuToggle={onMenuToggle} />
      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4 md:space-y-6">

        {/* ===== CONFIG PANEL ===== */}
        <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center">
            <History size={14} className="mr-2 text-brand-accent" /> Cấu Hình Backtest
          </h3>

          {/* Presets */}
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(presets).map(([key, p]: any) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activePreset === key
                    ? "bg-brand-accent text-brand-bg shadow-lg shadow-brand-accent/20"
                    : "bg-[#0B132B] border border-[#1C2541] text-brand-muted hover:text-white hover:border-brand-accent/30"
                }`}
              >
                {key === "conservative" && "🛡️ "}
                {key === "balanced" && "⚖️ "}
                {key === "aggressive" && "🔥 "}
                {key === "scalping" && "⚡ "}
                {p.label}
                <span className="ml-1 opacity-60">x{p.leverage}</span>
              </button>
            ))}
          </div>

          {/* Main Config Grid */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 mb-4">
            {/* Coin */}
            <div>
              <label className="text-[10px] text-brand-muted uppercase font-bold block mb-1">Token</label>
              <select
                value={coin}
                onChange={e => { setCoin(e.target.value); setActivePreset(null); }}
                className="w-full bg-[#0B132B] border border-[#1C2541] rounded-lg px-3 py-2.5 text-white text-sm focus:border-brand-accent outline-none cursor-pointer"
              >
                {COINS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Timeframe */}
            <div>
              <label className="text-[10px] text-brand-muted uppercase font-bold block mb-1">Timeframe</label>
              <div className="flex flex-wrap gap-1">
                {TIMEFRAMES.map(tf => (
                  <button
                    key={tf}
                    onClick={() => { setTimeframe(tf); setActivePreset(null); }}
                    className={`text-[10px] px-2 py-1.5 rounded cursor-pointer font-bold ${
                      timeframe === tf ? "bg-brand-accent text-black" : "bg-[#0B132B] border border-[#1C2541] text-brand-muted hover:text-white"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Period */}
            <div>
              <label className="text-[10px] text-brand-muted uppercase font-bold block mb-1">Thời gian</label>
              <div className="flex flex-wrap gap-1">
                {PERIODS.map(p => (
                  <button
                    key={p.days}
                    onClick={() => { setDays(p.days); setActivePreset(null); }}
                    className={`text-[10px] px-2 py-1.5 rounded cursor-pointer font-bold ${
                      days === p.days ? "bg-brand-accent text-black" : "bg-[#0B132B] border border-[#1C2541] text-brand-muted hover:text-white"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Leverage */}
            <div>
              <label className="text-[10px] text-brand-muted uppercase font-bold block mb-1">
                Đòn bẩy: <span className={leverage >= 20 ? "text-red-400" : leverage >= 5 ? "text-yellow-400" : "text-green-400"}>x{leverage}</span>
              </label>
              <input
                type="range" min={1} max={50} value={leverage}
                onChange={e => { setLeverage(Number(e.target.value)); setActivePreset(null); }}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-brand-accent"
              />
              <div className="flex justify-between text-[9px] text-brand-muted mt-0.5">
                {[1, 5, 10, 25, 50].map(l => (
                  <button key={l} onClick={() => setLeverage(l)}
                    className={`cursor-pointer ${leverage === l ? "text-brand-accent font-bold" : "hover:text-white"}`}>
                    x{l}
                  </button>
                ))}
              </div>
            </div>

            {/* SL/TP Quick */}
            <div>
              <label className="text-[10px] text-brand-muted uppercase font-bold block mb-1">SL / TP1</label>
              <div className="flex space-x-1.5">
                <div className="flex-1">
                  <input type="number" step={0.005} min={0.001} max={0.2} value={slPct}
                    onChange={e => { setSlPct(Number(e.target.value)); setActivePreset(null); }}
                    className="w-full bg-[#0B132B] border border-red-500/20 rounded-lg px-2 py-2 text-red-400 text-xs text-center focus:border-red-500 outline-none"
                  />
                  <p className="text-[8px] text-red-400/60 text-center mt-0.5">SL {(slPct * 100).toFixed(1)}%</p>
                </div>
                <div className="flex-1">
                  <input type="number" step={0.005} min={0.001} max={0.5} value={tp1Pct}
                    onChange={e => { setTp1Pct(Number(e.target.value)); setActivePreset(null); }}
                    className="w-full bg-[#0B132B] border border-green-500/20 rounded-lg px-2 py-2 text-green-400 text-xs text-center focus:border-green-500 outline-none"
                  />
                  <p className="text-[8px] text-green-400/60 text-center mt-0.5">TP1 {(tp1Pct * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Run Button */}
            <div className="flex flex-col justify-end">
              <button
                onClick={runBacktest}
                disabled={loading}
                className="py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-brand-accent to-[#D49E20] text-black hover:shadow-[0_0_20px_rgba(243,186,47,0.3)] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? <Loader size={14} className="animate-spin" /> : <Zap size={14} />}
                <span>{loading ? "Đang chạy..." : "RUN BACKTEST"}</span>
              </button>
            </div>
          </div>

          {/* Advanced Settings (Collapsible) */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[10px] text-brand-muted hover:text-white cursor-pointer uppercase font-bold"
          >
            {showAdvanced ? "▼" : "▶"} Cài đặt nâng cao
          </button>
          {showAdvanced && (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 mt-3 pt-3 border-t border-[#1C2541]">
              <ParamInput label="Risk/Trade" value={riskPerTrade} onChange={setRiskPerTrade} step={0.005} suffix="%" multiplier={100} />
              <ParamInput label="TP2 %" value={tp2Pct} onChange={setTp2Pct} step={0.01} suffix="%" multiplier={100} color="text-green-400" />
              <ParamInput label="TP3 %" value={tp3Pct} onChange={setTp3Pct} step={0.01} suffix="%" multiplier={100} color="text-green-400" />
              <div>
                <label className="text-[10px] text-brand-muted uppercase font-bold block mb-1">Min Score</label>
                <div className="flex space-x-1">
                  {[2, 3, 4, 5].map(s => (
                    <button key={s} onClick={() => { setMinScore(s); setActivePreset(null); }}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                        minScore === s ? "bg-brand-accent text-black" : "bg-[#0B132B] border border-[#1C2541] text-brand-muted hover:text-white"
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===== ERROR ===== */}
        {result?.error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 flex items-center space-x-3">
            <AlertCircle size={20} className="text-red-400 shrink-0" />
            <p className="text-red-400 text-sm">{result.error}</p>
          </div>
        )}

        {/* ===== RESULTS ===== */}
        {result && !result.error && (
          <>
            {/* Period Info */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-brand-muted bg-brand-surface border border-[#1C2541] rounded-xl px-5 py-3">
              <span className="text-white font-bold">{result.symbol}</span>
              <span className="text-[#1C2541]">|</span>
              <span>TF: <span className="text-white">{result.timeframe}</span></span>
              <span className="text-[#1C2541]">|</span>
              <span>x<span className="text-brand-accent font-bold">{result.leverage}</span></span>
              <span className="text-[#1C2541]">|</span>
              <span>{result.candles} nến</span>
              <span className="text-[#1C2541]">|</span>
              <span>{result.total_signals} signals</span>
              <span className="text-[#1C2541]">|</span>
              <span>{result.period?.start?.split("T")[0]} → {result.period?.end?.split("T")[0]}</span>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <MetricCard icon={TrendingUp} label="Tổng PnL" value={`${m.total_pnl >= 0 ? "+" : ""}$${m.total_pnl?.toFixed(2)}`}
                color={m.total_pnl >= 0 ? "text-green-400" : "text-red-400"} glow={m.total_pnl >= 0 ? "green" : "red"} />
              <MetricCard icon={Target} label="Win Rate" value={`${m.win_rate?.toFixed(1)}%`}
                color={m.win_rate >= 50 ? "text-green-400" : "text-yellow-400"} sub={`${m.win_count}W / ${m.loss_count}L`} />
              <MetricCard icon={BarChart3} label="Return" value={`${m.return_pct >= 0 ? "+" : ""}${m.return_pct?.toFixed(1)}%`}
                color={m.return_pct >= 0 ? "text-green-400" : "text-red-400"} glow={m.return_pct >= 0 ? "green" : "red"} />
              <MetricCard icon={Shield} label="Max DD" value={`-${m.max_drawdown?.toFixed(1)}%`}
                color={m.max_drawdown > 20 ? "text-red-400" : m.max_drawdown > 10 ? "text-yellow-400" : "text-green-400"} />
              <MetricCard icon={Flame} label="Sharpe" value={m.sharpe_ratio?.toFixed(2)}
                color={m.sharpe_ratio >= 1 ? "text-green-400" : m.sharpe_ratio >= 0 ? "text-yellow-400" : "text-red-400"} />
              <MetricCard icon={BarChart3} label="Profit Factor" value={m.profit_factor >= 999 ? "∞" : m.profit_factor?.toFixed(2)}
                color={m.profit_factor >= 1.5 ? "text-green-400" : "text-yellow-400"} />
            </div>

            {/* Balance Row */}
            <div className="flex flex-wrap items-center gap-4 text-sm bg-brand-surface border border-[#1C2541] rounded-xl px-5 py-3">
              <span className="text-brand-muted">Initial: <span className="text-white font-bold">${m.initial_balance?.toLocaleString()}</span></span>
              <span className="text-brand-muted">→</span>
              <span className="text-brand-muted">Final: <span className={`font-extrabold text-lg ${m.final_balance >= m.initial_balance ? "text-green-400" : "text-red-400"}`}>
                ${m.final_balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span></span>
              <span className="text-[#1C2541]">|</span>
              <span className="text-brand-muted">Avg Win: <span className="text-green-400 font-bold">${m.avg_win?.toFixed(2)}</span></span>
              <span className="text-brand-muted">Avg Loss: <span className="text-red-400 font-bold">${m.avg_loss?.toFixed(2)}</span></span>
              <span className="text-[#1C2541]">|</span>
              <span className="text-[10px] text-brand-muted">
                SL: {m.sl_count} | TP1: {m.tp1_count} | TP2: {m.tp2_count} | TP3: {m.tp3_count}
                {m.liq_count > 0 && <span className="text-red-400"> | 💀 LIQ: {m.liq_count}</span>}
              </span>
            </div>

            {/* Equity Curve Chart */}
            <div className="bg-brand-surface border border-[#1C2541] rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-brand-accent/5 rounded-full blur-[80px]" />
              <h3 className="text-lg font-bold text-white mb-4 relative z-10 flex items-center">
                <TrendingUp size={16} className="mr-2 text-brand-accent" /> Equity Curve
              </h3>
              <div className="h-72 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={equityCurve}>
                    <defs>
                      <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={m.total_pnl >= 0 ? "#4ade80" : "#f87171"} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={m.total_pnl >= 0 ? "#4ade80" : "#f87171"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1C2541" vertical={false} />
                    <XAxis dataKey="time" stroke="#5A6785" tick={{ fill: "#8AA2CA", fontSize: 9 }}
                      axisLine={false} tickLine={false}
                      tickFormatter={v => v?.split("T")[0]?.slice(5) || v} />
                    <YAxis stroke="#5A6785" tick={{ fill: "#8AA2CA", fontSize: 10 }}
                      axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "rgba(11,19,43,0.95)", borderColor: "#2B3A63", borderRadius: 8, color: "#fff" }}
                      formatter={(v: any) => [`$${Number(v).toFixed(2)}`, "Balance"]}
                      labelFormatter={l => l?.replace("T", " ").slice(0, 16)}
                    />
                    <Area type="monotone" dataKey="balance"
                      stroke={m.total_pnl >= 0 ? "#4ade80" : "#f87171"}
                      strokeWidth={2} fill="url(#eqGrad)"
                      dot={false} activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tabs: Trades / Signals */}
            <div className="bg-brand-surface border border-[#1C2541] rounded-xl overflow-hidden">
              <div className="flex border-b border-[#1C2541]">
                {[
                  { key: "trades", label: `📊 Trades (${trades.length})` },
                  { key: "signals", label: `⚡ Signals (${result.total_signals})` },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key as any)}
                    className={`flex-1 px-4 py-3 text-sm font-bold transition-all cursor-pointer ${
                      tab === t.key
                        ? "text-brand-accent border-b-2 border-brand-accent bg-brand-accent/5"
                        : "text-brand-muted hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Trades Table */}
              {tab === "trades" && (
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-[#0B132B] z-10">
                      <tr className="text-brand-muted uppercase">
                        <th className="text-left py-2.5 px-3">#</th>
                        <th className="text-left py-2.5 px-3">Hướng</th>
                        <th className="text-left py-2.5 px-3">Entry</th>
                        <th className="text-left py-2.5 px-3">Close</th>
                        <th className="text-left py-2.5 px-3">Size</th>
                        <th className="text-left py-2.5 px-3">PnL</th>
                        <th className="text-left py-2.5 px-3">Reason</th>
                        <th className="text-left py-2.5 px-3">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map((t: any, i: number) => {
                        const pnl = t.pnl || 0;
                        const isWin = pnl >= 0;
                        return (
                          <tr key={i} className="border-t border-[#1C2541]/50 hover:bg-[#1C2541]/20">
                            <td className="py-2 px-3 text-brand-muted">{i + 1}</td>
                            <td className="py-2 px-3">
                              <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                                t.direction === "LONG" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                              }`}>
                                {t.direction}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-white font-mono">${t.entry_price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="py-2 px-3 text-white font-mono">${t.close_price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="py-2 px-3 text-brand-accent">${t.usdt_size?.toFixed(0)}</td>
                            <td className={`py-2 px-3 font-bold ${isWin ? "text-green-400" : "text-red-400"}`}>
                              {isWin ? "+" : ""}${pnl.toFixed(2)}
                            </td>
                            <td className="py-2 px-3">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                t.close_reason === "SL_HIT" ? "bg-red-500/10 text-red-400" :
                                t.close_reason === "LIQUIDATED" ? "bg-red-900/20 text-red-300" :
                                t.close_reason?.includes("TP") ? "bg-green-500/10 text-green-400" :
                                "bg-[#1C2541] text-brand-muted"
                              }`}>
                                {t.close_reason}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-brand-muted text-[10px]">{t.open_time?.split("T")[0]}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {trades.length === 0 && (
                    <div className="py-8 text-center text-brand-muted text-sm">Không có trade nào được thực hiện</div>
                  )}
                </div>
              )}

              {/* Signals List */}
              {tab === "signals" && (
                <div className="max-h-96 overflow-y-auto p-3 space-y-1.5">
                  {(result.signals || []).slice(0, 100).map((s: any, i: number) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-[#0B132B] rounded-lg text-xs">
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                          s.direction === "LONG" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                        }`}>
                          {s.direction}
                        </span>
                        <span className="text-white font-mono">${s.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        <span className="text-brand-accent font-bold text-[10px]">Score: {s.score}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex flex-wrap gap-1 max-w-[300px]">
                          {(s.reasons || []).slice(0, 3).map((r: string, j: number) => (
                            <span key={j} className="text-[9px] px-1.5 py-0.5 rounded bg-[#1C2541] text-brand-muted">{r}</span>
                          ))}
                        </div>
                        <span className="text-brand-muted text-[10px] shrink-0">{s.time?.split("T")[0]}</span>
                      </div>
                    </div>
                  ))}
                  {(result.signals || []).length === 0 && (
                    <div className="py-8 text-center text-brand-muted text-sm">Không có signal nào</div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Empty State */}
        {!result && !loading && (
          <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-12 text-center">
            <History size={48} className="text-brand-accent/20 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">Chưa có kết quả</h3>
            <p className="text-brand-muted text-sm">Chọn coin, timeframe, cấu hình chiến lược rồi nhấn <span className="text-brand-accent font-bold">RUN BACKTEST</span></p>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Sub-components =====

function MetricCard({ icon: Icon, label, value, color, sub, glow }: any) {
  return (
    <div className={`bg-brand-surface border border-[#1C2541] rounded-xl p-4 hover:border-brand-accent/40 transition-all group relative overflow-hidden ${
      glow === "green" ? "shadow-[inset_0_0_20px_rgba(74,222,128,0.05)]" :
      glow === "red" ? "shadow-[inset_0_0_20px_rgba(248,113,113,0.05)]" : ""
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-brand-muted uppercase tracking-widest font-semibold">{label}</span>
        <Icon size={14} className={`${color} opacity-40 group-hover:opacity-100 transition-opacity`} />
      </div>
      <div className={`text-xl font-extrabold ${color}`}>{value}</div>
      {sub && <p className="text-[10px] text-brand-muted mt-0.5">{sub}</p>}
    </div>
  );
}

function ParamInput({ label, value, onChange, step, suffix, multiplier, color }: any) {
  return (
    <div>
      <label className="text-[10px] text-brand-muted uppercase font-bold block mb-1">{label}</label>
      <input
        type="number" step={step} min={0.001} max={1} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className={`w-full bg-[#0B132B] border border-[#1C2541] rounded-lg px-3 py-2 ${color || "text-white"} text-xs text-center focus:border-brand-accent outline-none`}
      />
      {suffix && (
        <p className={`text-[8px] ${color || "text-brand-muted"} text-center mt-0.5`}>
          {(value * (multiplier || 1)).toFixed(1)}{suffix}
        </p>
      )}
    </div>
  );
}
