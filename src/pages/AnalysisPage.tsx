import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Flame,
  BarChart3,
  Search,
  X,
  Activity,
  Wallet,
  Calendar,
  AlertTriangle,
  Clock,
  Shield,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import Header from "../components/Header";

import { API } from "../config";

export default function AnalysisPage({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const [prices, setPrices] = useState<any>({});
  const [scalping, setScalping] = useState<any[]>([]);
  const [scalpLevFilter, setScalpLevFilter] = useState<number | null>(null);

  // TA Analysis
  const [taCoin, setTaCoin] = useState("BTC");
  const [taLeverage, setTaLeverage] = useState(10);
  const [taMarket, setTaMarket] = useState<"SPOT" | "FUTURES">("FUTURES");
  const [taTimeframe, setTaTimeframe] = useState("auto");
  const [taResult, setTaResult] = useState<any>(null);
  const [taLoading, setTaLoading] = useState(false);

  // Trade execution from analysis
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeMsg, setTradeMsg] = useState("");
  const [tradeVolume, setTradeVolume] = useState(100);

  // Limit Order from analysis
  const [limitLoading, setLimitLoading] = useState(false);
  const [limitMsg, setLimitMsg] = useState("");

  // Wallet selection
  const [wallets, setWallets] = useState<any[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);

  // Token search
  const [tokenSearch, setTokenSearch] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Macro Events
  const [macroEvents, setMacroEvents] = useState<any[]>([]);
  const [macroRisk, setMacroRisk] = useState<any>({});
  const [macroExpanded, setMacroExpanded] = useState(true);

  // Popular tokens
  const ALL_TOKENS = [
    "BTC",
    "ETH",
    "SOL",
    "BNB",
    "XRP",
    "DOGE",
    "ADA",
    "AVAX",
    "DOT",
    "MATIC",
    "LINK",
    "SHIB",
    "UNI",
    "LTC",
    "ATOM",
    "FIL",
    "APT",
    "ARB",
    "OP",
    "INJ",
    "SUI",
    "SEI",
    "TIA",
    "NEAR",
    "FTM",
    "SAND",
    "MANA",
    "AAVE",
    "CRV",
    "MKR",
    "PEPE",
    "WIF",
    "BONK",
    "JUP",
    "RENDER",
    "FET",
    "TAO",
    "WLD",
    "PYTH",
    "JTO",
  ];

  // Fetch wallets once
  useEffect(() => {
    axios
      .get(`${API}/api/wallets`)
      .then((r) => {
        const wl = r.data.wallets || [];
        setWallets(wl);
        if (wl.length > 0 && !selectedWallet) setSelectedWallet(wl[0]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [p, sc] = await Promise.all([
          axios.get(`${API}/api/prices`),
          axios.get(`${API}/api/trading/scalping`),
        ]);
        setPrices(p.data.prices || {});
        setScalping(sc.data.signals || []);
      } catch {}
    };
    fetchAll();
    const iv = setInterval(fetchAll, 3000);
    return () => clearInterval(iv);
  }, []);

  // Fetch macro events
  useEffect(() => {
    const fetchMacro = async () => {
      try {
        const [cal, risk] = await Promise.all([
          axios.get(`${API}/api/macro/calendar?days=14`),
          axios.get(`${API}/api/macro/risk`),
        ]);
        setMacroEvents((cal.data.events || []).filter((e: any) => !e.is_past));
        setMacroRisk(risk.data || {});
      } catch {}
    };
    fetchMacro();
    const iv = setInterval(fetchMacro, 60000); // Refresh every 60s
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (tokenSearch.length > 0) {
      const q = tokenSearch.toUpperCase();
      setSearchResults(ALL_TOKENS.filter((t) => t.includes(q)).slice(0, 8));
      setShowSearch(true);
    } else {
      setShowSearch(false);
    }
  }, [tokenSearch]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowSearch(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectToken = (t: string) => {
    setTaCoin(t.toUpperCase());
    setTokenSearch("");
    setShowSearch(false);
  };

  const runAnalysis = async (overrideLeverage?: number | any) => {
    setTaLoading(true);
    const targetLev = typeof overrideLeverage === "number" ? overrideLeverage : taLeverage;
    try {
      const res = await axios.get(`${API}/api/trading/analyze/${taCoin}`, {
        params: {
          leverage: taMarket === "SPOT" ? 1 : targetLev,
          market_type: taMarket.toLowerCase(),
          timeframe: taTimeframe,
        },
      });
      setTaResult(res.data);
    } catch {
      setTaResult({ error: "Lỗi phân tích" });
    }
    setTaLoading(false);
  };

  const executeTrade = async (
    coin: string,
    direction: string,
    leverage: number,
    volume?: number,
  ) => {
    setTradeLoading(true);
    setTradeMsg("");
    try {
      const res = await axios.post(`${API}/api/trading/open`, {
        coin,
        direction,
        usdt_size: volume || tradeVolume,
        leverage,
        wallet_id: selectedWallet?.id || null,
        wallet_label: selectedWallet?.label || "",
      });
      if (res.data.success) {
        const wName = selectedWallet ? ` | 👛 ${selectedWallet.label}` : "";
        setTradeMsg(
          `✅ Đã mở: ${direction} ${coin} x${leverage} | $${volume || tradeVolume}${wName}`,
        );
        setTimeout(() => setTradeMsg(""), 4000);
      }
    } catch (e: any) {
      setTradeMsg(`❌ ${e.response?.data?.detail || "Lỗi mở lệnh"}`);
      setTimeout(() => setTradeMsg(""), 4000);
    }
    setTradeLoading(false);
  };

  const executeLimitOrder = async (
    coin: string,
    direction: string,
    triggerPrice: number,
    leverage: number
  ) => {
    setLimitLoading(true);
    setLimitMsg("");
    try {
      const res = await axios.post(`${API}/api/orders/create`, {
        coin,
        direction,
        trigger_price: triggerPrice,
        usdt_size: tradeVolume,
        leverage: taMarket === "SPOT" ? 1 : leverage,
        expiry_hours: 24,
      });
      if (res.data.success) {
        setLimitMsg(
          `✅ Đã đặt limit ${direction} ${coin} @ $${triggerPrice.toLocaleString()} | Size: $${tradeVolume}`
        );
        setTimeout(() => setLimitMsg(""), 5000);
      }
    } catch (e: any) {
      setLimitMsg(`❌ ${e.response?.data?.detail || "Lỗi đặt lệnh chờ"}`);
      setTimeout(() => setLimitMsg(""), 5000);
    }
    setLimitLoading(false);
  };

  const quickTrade = (sig: any) => {
    executeTrade(sig.coin, sig.direction, sig.leverage, tradeVolume);
  };

  const filteredScalp = scalpLevFilter
    ? scalping.filter((s) => s.leverage === scalpLevFilter)
    : scalping;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <Header
        title="Phân Tích Kỹ Thuật"
        subtitle="TA Analysis + Scalping Signals"
        onMenuToggle={onMenuToggle}
      />
      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* ===== TA ANALYSIS PANEL ===== */}
        <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center">
            <BarChart3 size={14} className="mr-2 text-brand-accent" /> Phân Tích
            Token
          </h3>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-4">
            {/* Token Search */}
            <div className="relative" ref={searchRef}>
              <label className="text-[10px] text-brand-muted uppercase font-bold block mb-1">
                Token
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={tokenSearch || taCoin}
                  onChange={(e) => {
                    setTokenSearch(e.target.value);
                    setTaCoin(e.target.value.toUpperCase());
                  }}
                  onFocus={() => setTokenSearch("")}
                  placeholder="Nhập token... (BTC, ETH, SOL...)"
                  className="w-full bg-[#0B132B] border border-[#1C2541] rounded-lg pl-8 pr-3 py-2.5 text-white text-sm focus:border-brand-accent outline-none"
                />
                <Search
                  size={14}
                  className="absolute left-2.5 top-3 text-brand-muted"
                />
              </div>
              {showSearch && searchResults.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-[#0B132B] border border-[#1C2541] rounded-lg shadow-lg max-h-48 overflow-auto">
                  {searchResults.map((t) => (
                    <button
                      key={t}
                      onClick={() => selectToken(t)}
                      className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#1C2541] flex justify-between items-center cursor-pointer"
                    >
                      <span className="font-bold">{t}</span>
                      {prices[t + "USDT"] && (
                        <span className="text-brand-muted text-xs">
                          ${prices[t + "USDT"]?.price?.toLocaleString()}
                        </span>
                      )}
                    </button>
                  ))}
                  {tokenSearch.length >= 2 &&
                    !searchResults.includes(tokenSearch.toUpperCase()) && (
                      <button
                        onClick={() => selectToken(tokenSearch)}
                        className="w-full text-left px-3 py-2 text-sm text-brand-accent hover:bg-[#1C2541] cursor-pointer border-t border-[#1C2541]"
                      >
                        🔍 Phân tích "{tokenSearch.toUpperCase()}"
                      </button>
                    )}
                </div>
              )}
              {/* Quick tokens */}
              <div className="flex flex-wrap gap-1 mt-1">
                {["BTC", "ETH", "SOL", "BNB", "DOGE", "XRP"].map((t) => (
                  <button
                    key={t}
                    onClick={() => selectToken(t)}
                    className={`text-[9px] px-1.5 py-0.5 rounded cursor-pointer ${taCoin === t ? "bg-brand-accent text-black" : "bg-[#1C2541] text-brand-muted hover:text-white"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Market Type */}
            <div>
              <label className="text-[10px] text-brand-muted uppercase font-bold block mb-1">
                Thị Trường
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setTaMarket("SPOT");
                    setTaLeverage(1);
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                    taMarket === "SPOT"
                      ? "bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                      : "bg-[#0B132B] border border-[#1C2541] text-blue-400 hover:bg-blue-500/10"
                  }`}
                >
                  💎 SPOT
                </button>
                <button
                  onClick={() => {
                    setTaMarket("FUTURES");
                    if (taLeverage <= 1) setTaLeverage(10);
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                    taMarket === "FUTURES"
                      ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.3)]"
                      : "bg-[#0B132B] border border-[#1C2541] text-orange-400 hover:bg-orange-500/10"
                  }`}
                >
                  🔥 FUTURES
                </button>
              </div>
            </div>

            {/* Leverage */}
            <div>
              <label className="text-[10px] text-brand-muted uppercase font-bold block mb-1">
                Đòn Bẩy:{" "}
                <span
                  className={`${taMarket === "SPOT" ? "text-blue-400" : taLeverage >= 20 ? "text-red-400" : "text-yellow-400"}`}
                >
                  x{taMarket === "SPOT" ? 1 : taLeverage}
                </span>
              </label>
              {taMarket === "FUTURES" ? (
                <>
                  <input
                    type="range"
                    min={2}
                    max={125}
                    value={taLeverage}
                    onChange={(e) => setTaLeverage(Number(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-brand-accent"
                  />
                  <div className="flex justify-between mt-1">
                    {[5, 10, 25, 50, 100].map((l) => (
                      <button
                        key={l}
                        onClick={() => setTaLeverage(l)}
                        className={`text-[9px] px-1 py-0.5 rounded cursor-pointer ${taLeverage === l ? "bg-brand-accent text-black" : "text-brand-muted hover:text-white"}`}
                      >
                        x{l}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="bg-[#0B132B] border border-[#1C2541] rounded-lg px-3 py-2.5 text-blue-400 text-sm font-bold text-center">
                  x1 (SPOT)
                </div>
              )}
            </div>

            {/* Timeframe selector */}
            <div>
              <label className="text-[10px] text-brand-muted uppercase font-bold block mb-1">
                Timeframe
              </label>
              <div className="flex flex-wrap gap-1">
                {["auto", "1m", "5m", "15m", "30m", "1h", "4h", "1d"].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTaTimeframe(tf)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                      taTimeframe === tf
                        ? "bg-brand-accent text-black shadow-[0_0_8px_rgba(243,186,47,0.3)]"
                        : "bg-[#0B132B] border border-[#1C2541] text-brand-muted hover:text-white hover:border-brand-accent/30"
                    }`}
                  >
                    {tf === "auto" ? "⚡ Auto" : tf}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-brand-muted mt-1">
                {taTimeframe === "auto"
                  ? `Auto → ${taMarket === "SPOT" ? "1d" : taLeverage >= 50 ? "5m" : taLeverage >= 20 ? "15m" : taLeverage >= 10 ? "1h" : "4h"}`
                  : `Đang dùng: ${taTimeframe}`}
              </p>
            </div>

            {/* Analyze button */}
            <div className="flex flex-col justify-end">
              <button
                onClick={runAnalysis}
                disabled={taLoading}
                className="py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-brand-accent to-[#D49E20] text-black hover:shadow-[0_0_20px_rgba(243,186,47,0.3)] transition-all cursor-pointer disabled:opacity-50"
              >
                {taLoading ? "⏳ Đang phân tích..." : `🔍 Phân Tích ${taCoin}`}
              </button>
            </div>
          </div>
        </div>

        {/* Cảnh báo đòn bẩy quá cao nếu có */}
        {taResult && taResult.leverage_warning && (
          <div className="mb-6 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="text-yellow-400 shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="text-yellow-400 font-bold text-sm">⚠️ Cảnh báo đòn bẩy quá cao</h4>
                <p className="text-xs text-yellow-100/90 mt-1 leading-relaxed">{taResult.leverage_warning}</p>
              </div>
            </div>
            {taResult.recommended_leverage && (
              <button
                onClick={() => {
                  setTaLeverage(taResult.recommended_leverage);
                  runAnalysis(taResult.recommended_leverage);
                }}
                className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xs rounded-lg transition-all shrink-0 cursor-pointer shadow-[0_0_10px_rgba(234,179,8,0.2)]"
              >
                Áp dụng x{taResult.recommended_leverage}
              </button>
            )}
          </div>
        )}

        {/* ===== TA RESULT AS SIGNAL CARD ===== */}
        {taResult && !taResult.error && (
          <div
            className={`bg-brand-surface border rounded-xl p-5 relative ${taResult.direction === "LONG" ? "border-green-500/30" : taResult.direction === "SHORT" ? "border-red-500/30" : "border-[#1C2541]"}`}
          >
            <button
              onClick={() => setTaResult(null)}
              className="absolute top-3 right-3 text-brand-muted hover:text-white cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Header like scalping signal */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-3xl font-extrabold text-white">
                  {taCoin}
                </span>
                <span
                  className={`text-sm font-bold px-3 py-1.5 rounded-lg ${taResult.direction === "LONG" ? "bg-green-500/20 text-green-400 shadow-[0_0_10px_rgba(74,222,128,0.15)]" : taResult.direction === "SHORT" ? "bg-red-500/20 text-red-400 shadow-[0_0_10px_rgba(248,113,113,0.15)]" : "bg-[#1C2541] text-brand-muted"}`}
                >
                  {taResult.direction === "LONG"
                    ? "🟢 LONG"
                    : taResult.direction === "SHORT"
                      ? "🔴 SHORT"
                      : "⚪ NEUTRAL"}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded ${taResult.market_type === "SPOT" ? "bg-blue-500/10 text-blue-400" : "bg-orange-500/10 text-orange-400"}`}
                >
                  {taResult.market_type || "FUTURES"}
                </span>
                <span className="text-[10px] font-bold px-2 py-1 rounded bg-brand-accent/10 text-brand-accent">
                  x{taResult.leverage}
                </span>
                <span className="text-[10px] px-2 py-1 rounded bg-[#1C2541] text-brand-muted">
                  {taResult.timeframe}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-brand-muted">
                  Bull:{" "}
                  <span className="text-green-400 font-bold">
                    {taResult.bull_score}
                  </span>
                </span>
                <span className="text-sm text-brand-muted">
                  Bear:{" "}
                  <span className="text-red-400 font-bold">
                    {taResult.bear_score}
                  </span>
                </span>
              </div>
            </div>

            {/* Reasons */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {(taResult.reasons || []).map((r: string, i: number) => (
                <span
                  key={i}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-[#0B132B] text-brand-muted border border-[#1C2541]"
                >
                  {r}
                </span>
              ))}
            </div>

            {/* AI Recommendation Alert */}
            {taResult.ai_recommendation && (
              <div
                className={`p-4 rounded-xl border mb-4 flex items-start space-x-3 ${
                  taResult.is_recommended
                    ? "bg-green-500/10 border-green-500/30 text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.05)]"
                    : "bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_15px_rgba(248,113,113,0.05)]"
                }`}
              >
                <span className="text-xl mt-0.5">
                  {taResult.is_recommended ? "🤖" : "⚠️"}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                    Đánh giá & Khuyến nghị của AI
                  </h4>
                  <p className="text-xs font-semibold leading-relaxed">
                    {taResult.ai_recommendation}
                  </p>
                </div>
              </div>
            )}

            {/* Indicators Row */}
            {taResult.indicators && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-4">
                <IndicatorCard
                  label="RSI"
                  value={taResult.indicators.rsi}
                  color={
                    taResult.indicators.rsi < 30
                      ? "text-green-400"
                      : taResult.indicators.rsi > 70
                        ? "text-red-400"
                        : "text-white"
                  }
                />
                <IndicatorCard
                  label="ADX"
                  value={taResult.indicators.adx}
                  color={
                    taResult.indicators.adx > 25
                      ? "text-brand-accent"
                      : "text-white"
                  }
                />
                <IndicatorCard
                  label="RR Ratio"
                  value={`${taResult.rr_ratio}:1`}
                  color={
                    taResult.rr_ratio >= 2
                      ? "text-green-400"
                      : "text-yellow-400"
                  }
                />
                <IndicatorCard
                  label="ROI"
                  value={`+${taResult.potential_roi}%`}
                  color="text-green-400"
                />
                <IndicatorCard
                  label="Max Loss"
                  value={`-${taResult.max_loss}%`}
                  color="text-red-400"
                />
                <IndicatorCard
                  label="Liq Price"
                  value={`$${taResult.liq_price?.toLocaleString()}`}
                  color="text-red-400"
                />
              </div>
            )}

            {/* Smart SL/TP Method Badge + Macro Risk */}
            {(taResult.sl_method || taResult.macro_risk) && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {taResult.sl_method && (
                  <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Shield size={10} className="mr-1" />
                    SL Method: {taResult.sl_method}
                  </span>
                )}
                {taResult.sl_method_detail && (
                  <span className="text-[10px] px-2 py-1 rounded-lg bg-[#0B132B] text-brand-muted border border-[#1C2541]">
                    {taResult.sl_method_detail}
                  </span>
                )}
                {taResult.atr > 0 && (
                  <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    ATR: {taResult.atr.toFixed(4)}
                  </span>
                )}
                {taResult.macro_risk && (
                  <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                    taResult.macro_risk === "CRITICAL"
                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                      : taResult.macro_risk === "HIGH"
                        ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                        : "bg-green-500/10 text-green-400 border-green-500/20"
                  }`}>
                    <AlertTriangle size={10} className="mr-1" />
                    Macro: {taResult.macro_risk}
                  </span>
                )}
              </div>
            )}

            {/* Macro Warnings */}
            {taResult.macro_context?.warnings?.length > 0 && (
              <div className="mb-4 space-y-1.5">
                {taResult.macro_context.warnings.map((w: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-yellow-500/5 border border-yellow-500/15">
                    <AlertTriangle size={12} className="text-yellow-400 shrink-0" />
                    <span className="text-yellow-300">{w.level || w}</span>
                    <span className="text-brand-muted">{w.message || ""}</span>
                    {w.advice && <span className="text-brand-muted italic ml-auto hidden sm:inline">→ {w.advice}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Entry/SL/TP - luon hien nhu scalping card */}
            {taResult.sl && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
                <LevelCard
                  label="ENTRY"
                  value={taResult.entry || taResult.price}
                  color="blue"
                />
                <LevelCard
                  label={`SL (-${taResult.sl_pct}%)`}
                  value={taResult.sl}
                  color="red"
                  sub={`Loss: -${taResult.max_loss}%`}
                />
                <LevelCard
                  label={`TP1 (+${taResult.tp1_pct}%)`}
                  value={taResult.tp1}
                  color="green"
                  sub={`ROI: +${taResult.potential_roi}%`}
                />
                <LevelCard label="TP2" value={taResult.tp2} color="green" />
                <LevelCard label="TP3" value={taResult.tp3} color="green" />
              </div>
            )}

            {/* S/R Levels */}
            <div className="flex flex-wrap items-center gap-3 md:gap-6 text-xs text-brand-muted bg-[#0B132B] rounded-lg px-4 py-2 mb-4">
              {taResult.support > 0 && (
                <span>
                  📉 S:{" "}
                  <span className="text-green-400 font-bold">
                    ${taResult.support?.toLocaleString()}
                  </span>
                </span>
              )}
              {taResult.resistance > 0 && (
                <span>
                  📈 R:{" "}
                  <span className="text-red-400 font-bold">
                    ${taResult.resistance?.toLocaleString()}
                  </span>
                </span>
              )}
              {taResult.bb_lower > 0 && (
                <span>
                  BB↓:{" "}
                  <span className="text-blue-400">
                    ${taResult.bb_lower?.toLocaleString()}
                  </span>
                </span>
              )}
              {taResult.bb_upper > 0 && (
                <span>
                  BB↑:{" "}
                  <span className="text-blue-400">
                    ${taResult.bb_upper?.toLocaleString()}
                  </span>
                </span>
              )}
              {taResult.ema20 > 0 && (
                <span>
                  EMA20:{" "}
                  <span className="text-yellow-400">
                    ${taResult.ema20?.toLocaleString()}
                  </span>
                </span>
              )}
            </div>

            {/* ===== TRADE EXECUTION - luon hien ===== */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-[#0B132B] rounded-xl p-4 border border-[#1C2541]">
              {/* Wallet Selector */}
              <div>
                <label className="text-[10px] text-brand-muted uppercase font-bold block mb-1">
                  <Wallet size={10} className="inline mr-1" />
                  Ví
                </label>
                {wallets.length > 0 ? (
                  <select
                    value={selectedWallet?.id || ""}
                    onChange={(e) => {
                      const w = wallets.find(
                        (w: any) => w.id === Number(e.target.value),
                      );
                      setSelectedWallet(w || null);
                    }}
                    className="w-44 bg-[#0B132B] border border-[#1C2541] rounded-lg px-2 py-2 text-white text-xs focus:border-brand-accent outline-none appearance-none cursor-pointer"
                  >
                    {wallets.map((w: any) => (
                      <option key={w.id} value={w.id}>
                        {w.label} ({w.address?.slice(0, 6)}...
                        {w.address?.slice(-4)})
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-red-400 text-[10px]">Chưa có ví</span>
                )}
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-brand-muted uppercase font-bold block mb-1">
                  Volume (USDT)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={tradeVolume}
                    onChange={(e) => setTradeVolume(Number(e.target.value))}
                    min={10}
                    className="w-28 bg-[#0B132B] border border-[#1C2541] rounded-lg px-3 py-2 text-white text-sm focus:border-brand-accent outline-none"
                  />
                  {[50, 100, 250, 500].map((v) => (
                    <button
                      key={v}
                      onClick={() => setTradeVolume(v)}
                      className={`text-[9px] px-2 py-1 rounded cursor-pointer ${tradeVolume === v ? "bg-brand-accent text-black" : "bg-[#1C2541] text-brand-muted hover:text-white"}`}
                    >
                      ${v}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() =>
                  executeTrade(
                    taCoin,
                    taResult.trade_direction || taResult.direction || "LONG",
                    taResult.leverage || taLeverage,
                  )
                }
                disabled={tradeLoading || taResult.is_recommended === false}
                className={`px-8 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer disabled:opacity-50 ${
                  taResult.is_recommended === false
                    ? "bg-[#1C2541] text-brand-muted cursor-not-allowed hover:shadow-none border border-[#2B3A63]/50"
                    : (taResult.trade_direction || taResult.direction) === "SHORT"
                      ? "bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-[0_0_20px_rgba(248,113,113,0.4)]"
                      : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-[0_0_20px_rgba(74,222,128,0.4)]"
                }`}
              >
                {tradeLoading
                  ? "⏳..."
                  : taResult.is_recommended === false
                    ? `Không nên vào lệnh ${taCoin}`
                    : `⚡ VÀO LỆNH ${taResult.trade_direction || "LONG"} ${taCoin} x${taResult.leverage || taLeverage}`}
              </button>
            </div>
            {tradeMsg && (
              <p
                className={`mt-2 text-sm font-bold ${tradeMsg.startsWith("✅") ? "text-green-400" : "text-red-400"}`}
              >
                {tradeMsg}
              </p>
            )}

            {/* ===== LIMIT ORDER SIGNALS ===== */}
            {taResult.limit_entries && taResult.limit_entries.length > 0 && (
              <div className="mt-6 pt-6 border-t border-[#1C2541]">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center">
                  <Activity size={14} className="mr-2 text-brand-accent" /> Tín Hiệu Giá Chờ (Limit Orders)
                </h4>
                
                {limitMsg && (
                  <div className={`mb-4 px-4 py-3 rounded-xl text-xs font-bold ${
                    limitMsg.startsWith("✅") ? "bg-green-500/10 border border-green-500/30 text-green-400" : "bg-red-500/10 border border-red-500/30 text-red-400"
                  }`}>
                    {limitMsg}
                  </div>
                )}

                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
                  {taResult.limit_entries.map((entry: any, index: number) => {
                    const isLong = entry.direction === "LONG";
                    const cardBorder = isLong ? "border-green-500/20 hover:border-green-500/40" : "border-red-500/20 hover:border-red-500/40";
                    const badgeClass = isLong ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20";
                    
                    // Score coloring
                    const scoreColor = entry.score >= 9 ? "text-green-400 bg-green-500/10 border-green-500/20" 
                      : entry.score >= 7 ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" 
                      : "text-blue-400 bg-blue-500/10 border-blue-500/20";

                    return (
                      <div
                        key={index}
                        className={`p-3 bg-[#0B132B] rounded-xl border ${cardBorder} transition-all duration-300 flex flex-col justify-between`}
                      >
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${badgeClass}`}>
                              {isLong ? "🟢 BUY LIMIT" : "🔴 SELL LIMIT"}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${scoreColor}`}>
                              Độ mạnh: {entry.score}/10
                            </span>
                          </div>

                          <div className="text-white font-mono font-bold text-lg mb-1">
                            ${entry.entry_price?.toLocaleString()}
                          </div>
                          
                          <div className="text-[10px] text-brand-muted mb-2 flex items-center justify-between">
                            <span>Cách giá hiện tại:</span>
                            <span className={isLong ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                              {isLong ? "↓" : "↑"} {entry.distance_pct}%
                            </span>
                          </div>

                          <p className="text-[10px] text-brand-muted bg-[#1C2541]/40 rounded px-2 py-1 mb-3 italic">
                            💡 {entry.reason}
                          </p>
                        </div>

                        <button
                          onClick={() => executeLimitOrder(taCoin, entry.direction, entry.entry_price, taResult.leverage || taLeverage)}
                          disabled={limitLoading}
                          className={`w-full py-1.5 font-bold text-xs rounded-lg transition-all cursor-pointer disabled:opacity-50 ${
                            isLong
                              ? "bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500 hover:text-white font-bold"
                              : "bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white font-bold"
                          }`}
                        >
                          {limitLoading ? "⏳ Đang đặt..." : "⚡ Đặt Limit"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TA Error */}
        {taResult?.error && (
          <div className="bg-brand-surface border border-red-500/30 rounded-xl p-5 relative">
            <button
              onClick={() => setTaResult(null)}
              className="absolute top-3 right-3 text-brand-muted hover:text-white cursor-pointer"
            >
              <X size={16} />
            </button>
            <p className="text-red-400 text-sm">❌ {taResult.error}</p>
          </div>
        )}

        {/* Trade message */}
        {tradeMsg && (
          <div
            className={`px-4 py-3 rounded-xl text-sm font-bold ${tradeMsg.startsWith("✅") ? "bg-green-500/10 border border-green-500/30 text-green-400" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}
          >
            {tradeMsg}
          </div>
        )}

        {/* Quick Volume & Wallet Setting */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3 bg-brand-surface border border-[#1C2541] rounded-xl px-4 md:px-5 py-3">
          <span className="text-[10px] text-brand-muted uppercase font-bold">
            <Wallet size={10} className="inline mr-1" />
            Ví:
          </span>
          {wallets.length > 0 ? (
            <select
              value={selectedWallet?.id || ""}
              onChange={(e) => {
                const w = wallets.find(
                  (w: any) => w.id === Number(e.target.value),
                );
                setSelectedWallet(w || null);
              }}
              className="bg-[#0B132B] border border-[#1C2541] rounded-lg px-2 py-1.5 text-white text-xs focus:border-brand-accent outline-none appearance-none cursor-pointer"
            >
              {wallets.map((w: any) => (
                <option key={w.id} value={w.id}>
                  {w.label} ({w.address?.slice(0, 6)}...{w.address?.slice(-4)})
                </option>
              ))}
            </select>
          ) : (
            <span className="text-red-400 text-[10px]">Chưa có ví</span>
          )}
          <span className="text-[#1C2541]">|</span>
          <span className="text-[10px] text-brand-muted uppercase font-bold">
            Volume:
          </span>
          {[5, 10, 20, 30, 50, 100, 250, 500, 1000].map((v) => (
            <button
              key={v}
              onClick={() => setTradeVolume(v)}
              className={`text-xs px-3 py-1.5 rounded-lg cursor-pointer font-bold ${tradeVolume === v ? "bg-brand-accent text-black" : "bg-[#0B132B] border border-[#1C2541] text-brand-muted hover:text-white"}`}
            >
              ${v}
            </button>
          ))}
          <input
            type="number"
            value={tradeVolume}
            onChange={(e) => setTradeVolume(Number(e.target.value))}
            min={10}
            className="w-24 bg-[#0B132B] border border-[#1C2541] rounded-lg px-3 py-1.5 text-white text-sm focus:border-brand-accent outline-none"
          />
          <span className="text-brand-accent font-bold text-sm">
            ${tradeVolume}
          </span>
        </div>

        {/* ===== SCALPING SIGNALS ===== */}
        <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center">
            <Flame size={14} className="mr-2 text-orange-400" /> Scalping
            Signals ({filteredScalp.length})
            <span className="ml-2 text-[10px] text-red-400 normal-case font-normal">
              ⚠ High Risk / High Reward
            </span>
          </h3>

          {/* Leverage Filter */}
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-[10px] text-brand-muted uppercase font-bold">
              Lọc:
            </span>
            <button
              onClick={() => setScalpLevFilter(null)}
              className={`text-[10px] px-2.5 py-1 rounded-lg cursor-pointer ${!scalpLevFilter ? "bg-brand-accent text-black font-bold" : "bg-[#1C2541] text-brand-muted hover:text-white"}`}
            >
              Tất Cả
            </button>
            {[5, 10, 25, 50].map((l) => (
              <button
                key={l}
                onClick={() => setScalpLevFilter(l)}
                className={`text-[10px] px-2.5 py-1 rounded-lg cursor-pointer ${scalpLevFilter === l ? "bg-brand-accent text-black font-bold" : "bg-[#1C2541] text-brand-muted hover:text-white"}`}
              >
                x{l} {l >= 25 ? "🔥" : ""}
              </button>
            ))}
          </div>

          {filteredScalp.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-brand-muted">
              <Activity size={32} className="opacity-30 mb-2" />
              <p className="text-sm">Không có tín hiệu scalping phù hợp</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredScalp.slice(0, 15).map((sig, i) => (
                <div
                  key={i}
                  className="p-4 bg-[#0B132B] rounded-xl border border-[#1C2541] hover:border-brand-accent/40 transition-all"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-white text-lg">
                        {sig.coin}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${sig.direction === "LONG" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}
                      >
                        {sig.direction}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${sig.type === "SPOT" ? "bg-blue-500/10 text-blue-400" : "bg-orange-500/10 text-orange-400"}`}
                      >
                        {sig.type}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-accent/10 text-brand-accent">
                        x{sig.leverage}
                      </span>
                      <span className="text-[10px] text-brand-muted">
                        {sig.timeframe}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {(sig.reasons || []).map((r: string, j: number) => (
                      <span
                        key={j}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-[#1C2541] text-brand-muted"
                      >
                        {r}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-xs mb-2">
                    <span className="text-brand-muted">
                      💰{" "}
                      <span className="text-white font-mono">
                        ${sig.price?.toLocaleString()}
                      </span>
                    </span>
                    <span className="text-brand-muted">
                      📊 RR:{" "}
                      <span
                        className={`font-bold ${sig.rr_ratio >= 2 ? "text-green-400" : "text-yellow-400"}`}
                      >
                        {sig.rr_ratio}:1
                      </span>
                    </span>
                    <span className="text-brand-muted">
                      🛑 SL:{" "}
                      <span className="text-red-400">
                        ${sig.sl?.toLocaleString()}
                      </span>{" "}
                      <span className="text-[9px]">(-{sig.sl_pct}%)</span>
                    </span>
                    <span className="text-brand-muted">
                      🎯 TP1:{" "}
                      <span className="text-green-400">
                        ${sig.tp1?.toLocaleString()}
                      </span>{" "}
                      <span className="text-[9px]">(+{sig.tp1_pct}%)</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="text-green-400 font-bold">
                      📈 +{sig.potential_roi}%
                    </span>
                    <span className="text-red-400">📉 -{sig.max_loss}%</span>
                    <span className="text-brand-muted">
                      💀 ${sig.liq_price?.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => quickTrade(sig)}
                      disabled={tradeLoading}
                      className={`flex-1 py-2 font-bold text-xs rounded-lg transition-all cursor-pointer disabled:opacity-50 ${
                        sig.direction === "LONG"
                          ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-[0_0_12px_rgba(74,222,128,0.3)]"
                          : "bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-[0_0_12px_rgba(248,113,113,0.3)]"
                      }`}
                    >
                      ⚡ VÀO LỆNH
                    </button>
                    <button
                      onClick={() => {
                        setTaCoin(sig.coin);
                        setTaLeverage(sig.leverage);
                        setTaMarket(sig.leverage > 1 ? "FUTURES" : "SPOT");
                        setTimeout(runAnalysis, 100);
                      }}
                      className="px-3 py-2 bg-[#1C2541] text-brand-accent font-bold text-xs rounded-lg hover:bg-brand-accent/10 transition-all cursor-pointer"
                    >
                      🔍
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== MACRO EVENTS PANEL ===== */}
        <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-5">
          <button
            onClick={() => setMacroExpanded(!macroExpanded)}
            className="w-full flex items-center justify-between cursor-pointer"
          >
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
              <Calendar size={14} className="mr-2 text-blue-400" /> Macro
              Events — Lịch Kinh Tế
              {macroRisk.risk_level && macroRisk.risk_level !== "NORMAL" && (
                <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded ${
                  macroRisk.risk_level === "CRITICAL"
                    ? "bg-red-500/15 text-red-400 animate-pulse"
                    : "bg-yellow-500/15 text-yellow-400"
                }`}>
                  {macroRisk.risk_level === "CRITICAL" ? "🔴" : "🟡"} {macroRisk.risk_level}
                </span>
              )}
            </h3>
            {macroExpanded ? <ChevronUp size={16} className="text-brand-muted" /> : <ChevronDown size={16} className="text-brand-muted" />}
          </button>

          {macroExpanded && (
            <div className="mt-4 space-y-3">
              {/* Risk Summary Banner */}
              {macroRisk.warnings?.length > 0 && (
                <div className={`rounded-xl p-4 border ${
                  macroRisk.risk_level === "CRITICAL"
                    ? "bg-red-500/5 border-red-500/20"
                    : "bg-yellow-500/5 border-yellow-500/20"
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={14} className={macroRisk.risk_level === "CRITICAL" ? "text-red-400" : "text-yellow-400"} />
                    <span className="text-sm font-bold text-white">Cảnh Báo Rủi Ro</span>
                  </div>
                  <div className="space-y-1.5">
                    {macroRisk.warnings.slice(0, 3).map((w: any, i: number) => (
                      <div key={i} className="text-xs text-brand-muted">
                        <span className="font-bold">{w.level}</span>{" "}
                        {w.message}
                        {w.advice && (
                          <span className="text-brand-accent ml-1">→ {w.advice}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Events Timeline */}
              {macroEvents.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-brand-muted">
                  <Calendar size={28} className="opacity-30 mb-2" />
                  <p className="text-sm">Không có sự kiện nào trong 14 ngày tới</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {macroEvents.slice(0, 10).map((ev: any, i: number) => {
                    const impactColor =
                      ev.impact === "CRITICAL" ? "border-red-500/30 bg-red-500/5"
                        : ev.impact === "HIGH" ? "border-yellow-500/20 bg-yellow-500/5"
                          : "border-[#1C2541] bg-[#0B132B]";
                    const impactBadge =
                      ev.impact === "CRITICAL" ? "bg-red-500/15 text-red-400"
                        : ev.impact === "HIGH" ? "bg-yellow-500/15 text-yellow-400"
                          : "bg-blue-500/10 text-blue-400";
                    const impactIcon =
                      ev.impact === "CRITICAL" ? "🔴"
                        : ev.impact === "HIGH" ? "🟡"
                          : "🟢";
                    const hoursUntil = ev.hours_until || 0;
                    const isUrgent = hoursUntil > 0 && hoursUntil <= 24;
                    const isUpcoming48 = hoursUntil > 24 && hoursUntil <= 48;

                    return (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:border-brand-accent/30 ${impactColor}`}>
                        {/* Date Column */}
                        <div className="text-center min-w-[52px] shrink-0">
                          <div className="text-[10px] text-brand-muted uppercase">
                            {new Date(ev.date).toLocaleDateString("vi-VN", { weekday: "short" })}
                          </div>
                          <div className="text-sm font-bold text-white">
                            {new Date(ev.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                          </div>
                          {ev.time && ev.time !== "00:00" && (
                            <div className="text-[9px] text-brand-muted">{ev.time} UTC</div>
                          )}
                        </div>

                        {/* Event Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-white truncate">{ev.title}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${impactBadge}`}>
                              {impactIcon} {ev.impact}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1C2541] text-brand-muted">
                              {ev.type}
                            </span>
                          </div>
                          {ev.info?.crypto_impact && (
                            <p className="text-[10px] text-brand-muted mt-0.5 truncate">
                              📊 {ev.info.crypto_impact}
                            </p>
                          )}
                        </div>

                        {/* Countdown */}
                        <div className="text-right shrink-0">
                          {hoursUntil > 0 ? (
                            <div className={`text-xs font-bold ${
                              isUrgent ? "text-red-400 animate-pulse" : isUpcoming48 ? "text-yellow-400" : "text-brand-muted"
                            }`}>
                              <Clock size={10} className="inline mr-1" />
                              {hoursUntil < 1
                                ? `${Math.round(hoursUntil * 60)}m`
                                : hoursUntil < 24
                                  ? `${Math.round(hoursUntil)}h`
                                  : `${Math.round(hoursUntil / 24)}d`}
                            </div>
                          ) : (
                            <span className="text-[10px] text-brand-muted">Đã qua</span>
                          )}
                          {ev.forecast && (
                            <div className="text-[9px] text-brand-muted mt-0.5">
                              F: {ev.forecast}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Summary footer */}
              <div className="flex items-center justify-between text-[10px] text-brand-muted pt-2 border-t border-[#1C2541]">
                <span>
                  Tổng: {macroEvents.length} sự kiện | Critical: {macroRisk.critical_count || 0} | High: {macroRisk.high_count || 0}
                </span>
                <span className={`font-bold ${
                  macroRisk.risk_level === "CRITICAL" ? "text-red-400" : macroRisk.risk_level === "HIGH" ? "text-yellow-400" : "text-green-400"
                }`}>
                  Risk Level: {macroRisk.risk_level || "NORMAL"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function IndicatorCard({
  label,
  value,
  color,
}: {
  label: string;
  value: any;
  color: string;
}) {
  return (
    <div className="bg-[#0B132B] rounded-lg p-3 text-center border border-[#1C2541]">
      <p className="text-brand-muted text-[10px] uppercase font-bold">
        {label}
      </p>
      <p className={`font-extrabold text-xl ${color}`}>{value}</p>
    </div>
  );
}

function LevelCard({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: number;
  color: string;
  sub?: string;
}) {
  const colors: any = {
    blue: "border-blue-500/20",
    red: "border-red-500/20",
    green: "border-green-500/20",
  };
  const textColors: any = {
    blue: "text-blue-400",
    red: "text-red-400",
    green: "text-green-400",
  };
  return (
    <div className={`bg-[#0B132B] rounded-lg p-3 border ${colors[color]}`}>
      <p className={`${textColors[color]} font-bold text-[10px] uppercase`}>
        {label}
      </p>
      <p className="text-white font-bold">${value?.toLocaleString()}</p>
      {sub && <p className={`${textColors[color]} text-[10px]`}>{sub}</p>}
    </div>
  );
}
