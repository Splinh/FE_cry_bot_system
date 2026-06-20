import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  AlertCircle,
  Zap,
  Activity,
  X,
  Crosshair,
  Search,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";
import Header from "../components/Header";
import WalletConnectButton from "../components/WalletConnectButton";

import { API } from "../config";

const POPULAR_TOKENS = [
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
  "PEPE",
  "WIF",
  "BONK",
  "JUP",
  "RENDER",
];

export default function TradingPage({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const [trading, setTrading] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [prices, setPrices] = useState<any>({});

  // Quick Trade state
  const [coin, setCoin] = useState("BTC");
  const [direction, setDirection] = useState("LONG");
  const [volume, setVolume] = useState(100);
  const [leverage, setLeverage] = useState(10);
  const [marketType, setMarketType] = useState<"SPOT" | "FUTURES">("FUTURES");
  const [tradeLoading, setTradeLoading] = useState(false);

  // Wallet selection
  const [wallets, setWallets] = useState<any[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [tradeMsg, setTradeMsg] = useState("");

  // Deposit/Withdraw
  const [dwTab, setDwTab] = useState<"deposit" | "withdraw" | "real">(
    "deposit",
  );
  const [dwAmount, setDwAmount] = useState(100);
  const [dwNote, setDwNote] = useState("");
  const [dwLoading, setDwLoading] = useState(false);
  const [dwMsg, setDwMsg] = useState("");
  const [balHistory, setBalHistory] = useState<any[]>([]);
  const [showDwPanel, setShowDwPanel] = useState(false);

  // SL/TP toast
  const [slTpToasts, setSlTpToasts] = useState<any[]>([]);

  // Token search
  const [tokenSearch, setTokenSearch] = useState("");
  const [, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

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
        const [t, h, s, p] = await Promise.all([
          axios.get(`${API}/api/trading`),
          axios.get(`${API}/api/trading/history`),
          axios.get(`${API}/api/signals`),
          axios.get(`${API}/api/prices`),
        ]);
        setTrading(t.data);
        setHistory(h.data.history || []);
        setSignals(s.data.signals || []);
        setPrices(p.data.prices || {});
      } catch {}
      // Poll SL/TP events
      try {
        const ev = await axios.get(`${API}/api/trading/sl-tp-events`);
        const events = ev.data.events || [];
        if (events.length > 0) {
          setSlTpToasts((prev) => [...prev, ...events].slice(-5));
          setTimeout(() => setSlTpToasts([]), 6000);
        }
      } catch {}
    };
    fetchAll();
    const iv = setInterval(fetchAll, 2000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (marketType === "SPOT") setLeverage(1);
    else if (leverage <= 1) setLeverage(10);
  }, [marketType]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowSearch(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleAT = async () => {
    try {
      const res = await axios.post(`${API}/api/trading/toggle`);
      setTrading((p: any) => ({
        ...p,
        auto_trade_enabled: res.data.auto_trade_enabled,
      }));
    } catch {}
  };

  const openTrade = async () => {
    setTradeLoading(true);
    setTradeMsg("");
    try {
      const res = await axios.post(`${API}/api/trading/open`, {
        coin,
        direction,
        usdt_size: volume,
        leverage: marketType === "SPOT" ? 1 : leverage,
        wallet_id: selectedWallet?.id || null,
        wallet_label: selectedWallet?.label || "",
      });
      if (res.data.success) {
        const wName = selectedWallet ? ` | 👛 ${selectedWallet.label}` : "";
        if (res.data.is_dca) {
          const p = res.data.position;
          setTradeMsg(
            `🔄 DCA #${p.dca_count}: ${direction} ${coin} +$${volume} → Total: $${p.usdt_size?.toFixed(0)} | Avg Entry: $${p.entry_price?.toFixed(2)}${wName}`,
          );
        } else {
          setTradeMsg(
            `✅ ${direction} ${coin} ${marketType} x${marketType === "SPOT" ? 1 : leverage} | $${volume}${wName}`,
          );
        }
        setTimeout(() => setTradeMsg(""), 5000);
      }
    } catch (e: any) {
      setTradeMsg(`❌ ${e.response?.data?.detail || "Lỗi mở lệnh"}`);
    }
    setTradeLoading(false);
  };

  const closeTrade = async (key: string) => {
    try {
      await axios.post(`${API}/api/trading/close/${key}`);
    } catch {}
  };

  const handleDepositWithdraw = async () => {
    setDwLoading(true);
    setDwMsg("");
    try {
      const url =
        dwTab === "deposit"
          ? `${API}/api/trading/deposit`
          : `${API}/api/trading/withdraw`;
      const res = await axios.post(url, { amount: dwAmount, note: dwNote });
      if (res.data.success) {
        setDwMsg(
          `✅ ${dwTab === "deposit" ? "Nạp" : "Rút"} $${dwAmount} thành công! Balance: $${res.data.balance_after}`,
        );
        setDwNote("");
        // Refresh balance history
        const bh = await axios.get(`${API}/api/trading/balance-history`);
        setBalHistory(bh.data.history || []);
      }
    } catch (e: any) {
      setDwMsg(`❌ ${e.response?.data?.detail || "Lỗi"}`);
    }
    setDwLoading(false);
    setTimeout(() => setDwMsg(""), 4000);
  };

  const selectToken = (t: string) => {
    setCoin(t.toUpperCase());
    setTokenSearch("");
    setShowSearch(false);
  };

  const searchResults =
    tokenSearch.length > 0
      ? POPULAR_TOKENS.filter((t) =>
          t.includes(tokenSearch.toUpperCase()),
        ).slice(0, 8)
      : [];

  if (!trading)
    return (
      <div className="flex-1 flex items-center justify-center text-brand-muted">
        <Activity size={20} className="animate-spin mr-2" /> Đang kết nối...
      </div>
    );

  const effectiveLev = marketType === "SPOT" ? 1 : leverage;
  const coinPrice = prices[`${coin}USDT`]?.price || 0;
  const margin = volume / effectiveLev;
  const liqPct = effectiveLev > 1 ? (1 / effectiveLev) * 100 : 0;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <Header title="Đặt Lệnh & Theo Dõi" subtitle="SPOT / FUTURES Trading" onMenuToggle={onMenuToggle} />
      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Live Price Ticker */}
        {Object.keys(prices).length > 0 && (
          <div className="flex items-center space-x-4 bg-brand-surface border border-[#1C2541] rounded-xl px-5 py-3 overflow-x-auto">
            <span className="text-[10px] text-brand-muted uppercase font-bold shrink-0 flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse shadow-[0_0_6px_#4ade80]" />{" "}
              LIVE
            </span>
            {Object.entries(prices).map(([sym, data]: any) => (
              <div
                key={sym}
                className="flex items-center space-x-2 shrink-0 cursor-pointer hover:opacity-80"
                onClick={() => selectToken(sym.replace("USDT", ""))}
              >
                <span className="text-white font-bold text-sm">
                  {sym.replace("USDT", "")}
                </span>
                <span className="text-white text-sm font-mono">
                  $
                  {data.price?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${(data.change_pct || 0) >= 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}
                >
                  {(data.change_pct || 0) >= 0 ? "+" : ""}
                  {(data.change_pct || 0).toFixed(2)}%
                </span>
                <span className="text-[#1C2541]">|</span>
              </div>
            ))}
          </div>
        )}

        {/* Control Panel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-brand-surface border border-[#1C2541] rounded-xl p-4 md:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:items-center gap-3 md:space-x-8">
            <Stat
              label="Balance"
              value={`$${trading.balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              color="text-white"
            />
            <Stat
              label="Realized"
              value={`${trading.total_pnl >= 0 ? "+" : ""}$${trading.total_pnl?.toFixed(2)}`}
              color={trading.total_pnl >= 0 ? "text-green-400" : "text-red-400"}
            />
            <Stat
              label="Unrealized"
              value={`${(trading.unrealized_pnl || 0) >= 0 ? "+" : ""}$${(trading.unrealized_pnl || 0).toFixed(2)}`}
              color={
                (trading.unrealized_pnl || 0) >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }
              pulse
            />
            <Stat
              label="Win Rate"
              value={`${trading.win_rate_percent?.toFixed(1)}%`}
              color="text-blue-400"
            />
            <Stat
              label="Trades"
              value={trading.total_trades}
              color="text-white"
            />
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => {
                setShowDwPanel(!showDwPanel);
                if (!showDwPanel)
                  axios
                    .get(`${API}/api/trading/balance-history`)
                    .then((r) => setBalHistory(r.data.history || []))
                    .catch(() => {});
              }}
              className="px-5 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
            >
              💰 Nạp / Rút
            </button>
            <button
              onClick={toggleAT}
              className={`px-6 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                trading.auto_trade_enabled
                  ? "bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500 hover:text-white shadow-[0_0_15px_rgba(74,222,128,0.2)]"
                  : "bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white"
              }`}
            >
              {trading.auto_trade_enabled ? "⚡ AUTO: ON" : "⏸ AUTO: OFF"}
            </button>
          </div>
        </div>

        {/* Deposit/Withdraw Panel */}
        {showDwPanel && (
          <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setDwTab("deposit")}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center ${
                    dwTab === "deposit"
                      ? "bg-green-500 text-white shadow-[0_0_15px_rgba(74,222,128,0.3)]"
                      : "bg-[#0B132B] border border-[#1C2541] text-green-400 hover:bg-green-500/10"
                  }`}
                >
                  <ArrowDownCircle size={14} className="mr-1.5" /> NẠP TIỀN
                </button>
                <button
                  onClick={() => setDwTab("withdraw")}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center ${
                    dwTab === "withdraw"
                      ? "bg-red-500 text-white shadow-[0_0_15px_rgba(248,113,113,0.3)]"
                      : "bg-[#0B132B] border border-[#1C2541] text-red-400 hover:bg-red-500/10"
                  }`}
                >
                  <ArrowUpCircle size={14} className="mr-1.5" /> RÚT TIỀN
                </button>
                <button
                  onClick={() => setDwTab("real")}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center ${
                    dwTab === "real"
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                      : "bg-[#0B132B] border border-[#1C2541] text-blue-400 hover:bg-blue-500/10"
                  }`}
                >
                  <Wallet size={14} className="mr-1.5" /> NẠP THẬT
                </button>
              </div>
              <button
                onClick={() => setShowDwPanel(false)}
                className="p-1 rounded-lg hover:bg-[#1C2541] cursor-pointer"
              >
                <X size={16} className="text-brand-muted" />
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Form - Demo or Real */}
              {dwTab === "real" ? (
                <div className="lg:col-span-2">
                  <WalletConnectButton
                    onDeposit={() => {
                      // Refresh balance history after real deposit
                      axios
                        .get(`${API}/api/trading/balance-history`)
                        .then((r) => setBalHistory(r.data.history || []))
                        .catch(() => {});
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-brand-muted uppercase font-bold block mb-1">
                      Số tiền (USDT)
                    </label>
                    <input
                      type="number"
                      value={dwAmount}
                      onChange={(e) => setDwAmount(Number(e.target.value))}
                      min={1}
                      className="w-full bg-[#0B132B] border border-[#1C2541] rounded-lg px-4 py-2.5 text-white text-sm focus:border-brand-accent outline-none"
                    />
                    <div className="flex space-x-1 mt-1">
                      {[50, 100, 500, 1000, 5000].map((v) => (
                        <button
                          key={v}
                          onClick={() => setDwAmount(v)}
                          className={`text-[9px] px-1.5 py-0.5 rounded cursor-pointer ${dwAmount === v ? "bg-brand-accent text-black" : "bg-[#1C2541] text-brand-muted hover:text-white"}`}
                        >
                          ${v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-brand-muted uppercase font-bold block mb-1">
                      Ghi chú
                    </label>
                    <input
                      type="text"
                      value={dwNote}
                      onChange={(e) => setDwNote(e.target.value)}
                      placeholder={
                        dwTab === "deposit"
                          ? "VD: Nạp từ Binance..."
                          : "VD: Rút về ví cá nhân..."
                      }
                      className="w-full bg-[#0B132B] border border-[#1C2541] rounded-lg px-4 py-2.5 text-white text-sm focus:border-brand-accent outline-none"
                    />
                  </div>
                  <button
                    onClick={handleDepositWithdraw}
                    disabled={dwLoading}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all cursor-pointer disabled:opacity-50 ${
                      dwTab === "deposit"
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-[0_0_20px_rgba(74,222,128,0.3)]"
                        : "bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-[0_0_20px_rgba(248,113,113,0.3)]"
                    }`}
                  >
                    {dwLoading
                      ? "⏳..."
                      : dwTab === "deposit"
                        ? `📥 NẠP $${dwAmount}`
                        : `📤 RÚT $${dwAmount}`}
                  </button>
                  {dwMsg && (
                    <p
                      className={`text-sm font-bold ${dwMsg.startsWith("✅") ? "text-green-400" : "text-red-400"}`}
                    >
                      {dwMsg}
                    </p>
                  )}
                </div>
              )}
              {/* History */}
              <div>
                <label className="text-[10px] text-brand-muted uppercase font-bold block mb-2">
                  Lịch sử nạp/rút
                </label>
                <div className="space-y-1.5 max-h-48 overflow-auto">
                  {balHistory.length === 0 ? (
                    <p className="text-xs text-brand-muted py-4 text-center">
                      Chưa có giao dịch
                    </p>
                  ) : (
                    balHistory
                      .slice()
                      .reverse()
                      .map((h: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-3 py-2 bg-[#0B132B] rounded-lg text-xs"
                        >
                          <div className="flex items-center space-x-2">
                            <span
                              className={`font-bold ${h.type === "DEPOSIT" ? "text-green-400" : "text-red-400"}`}
                            >
                              {h.type === "DEPOSIT" ? "📥 +" : "📤 -"}$
                              {h.amount}
                            </span>
                            <span className="text-brand-muted">{h.note}</span>
                          </div>
                          <span className="text-brand-muted text-[10px]">
                            ${h.balance_after}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SL/TP Auto-Close Toasts */}
        {slTpToasts.length > 0 && (
          <div className="fixed top-4 right-4 z-50 space-y-2">
            {slTpToasts.map((t: any, i: number) => (
              <div
                key={i}
                className={`px-5 py-3 rounded-xl shadow-2xl text-sm font-bold animate-pulse border ${
                  t.reason === "SL_HIT"
                    ? "bg-red-500/20 border-red-500/50 text-red-400"
                    : t.reason === "LIQUIDATED"
                      ? "bg-red-900/40 border-red-500 text-red-300"
                      : "bg-green-500/20 border-green-500/50 text-green-400"
                }`}
              >
                {t.reason === "SL_HIT"
                  ? "🔴 SL HIT"
                  : t.reason === "LIQUIDATED"
                    ? "💀 LIQUIDATED"
                    : `🟢 ${t.reason}`}{" "}
                | {t.key?.split("_")[0]} | PnL: ${t.pnl >= 0 ? "+" : ""}$
                {t.pnl?.toFixed(2)}
              </div>
            ))}
          </div>
        )}

        {/* ===== QUICK TRADE PANEL ===== */}
        <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center">
            <Crosshair size={14} className="mr-2 text-brand-accent" /> Vào Lệnh
          </h3>

          {/* SPOT / FUTURES */}
          <div className="flex items-center space-x-3 mb-4">
            <button
              onClick={() => setMarketType("SPOT")}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                marketType === "SPOT"
                  ? "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                  : "bg-[#0B132B] border border-[#1C2541] text-blue-400 hover:bg-blue-500/10"
              }`}
            >
              💎 SPOT
            </button>
            <button
              onClick={() => setMarketType("FUTURES")}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                marketType === "FUTURES"
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                  : "bg-[#0B132B] border border-[#1C2541] text-orange-400 hover:bg-orange-500/10"
              }`}
            >
              🔥 FUTURES
            </button>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {/* Token Search */}
            <div className="relative" ref={searchRef}>
              <label className="text-[10px] text-brand-muted uppercase font-bold block mb-1">
                Token
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={tokenSearch || coin}
                  onChange={(e) => {
                    setTokenSearch(e.target.value);
                    setCoin(e.target.value.toUpperCase());
                  }}
                  onFocus={() => setTokenSearch("")}
                  placeholder="BTC, ETH, SOL..."
                  className="w-full bg-[#0B132B] border border-[#1C2541] rounded-lg pl-8 pr-3 py-2.5 text-white text-sm focus:border-brand-accent outline-none"
                />
                <Search
                  size={14}
                  className="absolute left-2.5 top-3 text-brand-muted"
                />
              </div>
              {tokenSearch.length > 0 &&
                (searchResults.length > 0 || tokenSearch.length >= 2) && (
                  <div className="absolute z-20 w-full mt-1 bg-[#0B132B] border border-[#1C2541] rounded-lg shadow-lg max-h-48 overflow-auto">
                    {searchResults.map((t) => (
                      <button
                        key={t}
                        onClick={() => selectToken(t)}
                        className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#1C2541] flex justify-between cursor-pointer"
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
                          Dùng "{tokenSearch.toUpperCase()}"
                        </button>
                      )}
                  </div>
                )}
            </div>

            {/* Direction */}
            <div>
              <label className="text-[10px] text-brand-muted uppercase font-bold block mb-1">
                Hướng
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setDirection("LONG")}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                    direction === "LONG"
                      ? "bg-green-500 text-white shadow-[0_0_15px_rgba(74,222,128,0.3)]"
                      : "bg-[#0B132B] border border-[#1C2541] text-green-400 hover:bg-green-500/10"
                  }`}
                >
                  {marketType === "SPOT" ? "MUA" : "LONG"}
                </button>
                {marketType === "FUTURES" && (
                  <button
                    onClick={() => setDirection("SHORT")}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                      direction === "SHORT"
                        ? "bg-red-500 text-white shadow-[0_0_15px_rgba(248,113,113,0.3)]"
                        : "bg-[#0B132B] border border-[#1C2541] text-red-400 hover:bg-red-500/10"
                    }`}
                  >
                    SHORT
                  </button>
                )}
              </div>
            </div>

            {/* Volume */}
            <div>
              <label className="text-[10px] text-brand-muted uppercase font-bold block mb-1">
                Volume (USDT)
              </label>
              <input
                type="number"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                min={10}
                max={100000}
                className="w-full bg-[#0B132B] border border-[#1C2541] rounded-lg px-3 py-2.5 text-white text-sm focus:border-brand-accent outline-none"
              />
              <div className="flex space-x-1 mt-1">
                {[5, 10, 20, 30, 50, 100, 250, 500, 1000].map((v) => (
                  <button
                    key={v}
                    onClick={() => setVolume(v)}
                    className={`text-[9px] px-1.5 py-0.5 rounded cursor-pointer ${volume === v ? "bg-brand-accent text-black" : "bg-[#1C2541] text-brand-muted hover:text-white"}`}
                  >
                    ${v}
                  </button>
                ))}
              </div>
            </div>

            {/* Leverage */}
            <div>
              <label className="text-[10px] text-brand-muted uppercase font-bold block mb-1">
                Đòn Bẩy:{" "}
                <span
                  className={`${marketType === "SPOT" ? "text-blue-400" : effectiveLev >= 20 ? "text-red-400" : effectiveLev >= 5 ? "text-yellow-400" : "text-green-400"}`}
                >
                  x{effectiveLev}
                </span>
              </label>
              {marketType === "FUTURES" ? (
                <>
                  <input
                    type="range"
                    min={2}
                    max={125}
                    value={leverage}
                    onChange={(e) => setLeverage(Number(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-brand-accent"
                  />
                  <div className="flex justify-between mt-1">
                    {[5, 10, 25, 50, 100].map((l) => (
                      <button
                        key={l}
                        onClick={() => setLeverage(l)}
                        className={`text-[9px] px-1 py-0.5 rounded cursor-pointer ${leverage === l ? "bg-brand-accent text-black" : "text-brand-muted hover:text-white"}`}
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

            {/* Wallet Selector */}
            <div>
              <label className="text-[10px] text-brand-muted uppercase font-bold block mb-1">
                <Wallet size={10} className="inline mr-1" />
                Ví
              </label>
              {wallets.length > 0 ? (
                <>
                  <select
                    value={selectedWallet?.id || ""}
                    onChange={(e) => {
                      const w = wallets.find(
                        (w: any) => w.id === Number(e.target.value),
                      );
                      setSelectedWallet(w || null);
                    }}
                    className="w-full bg-[#0B132B] border border-[#1C2541] rounded-lg px-3 py-2.5 text-white text-sm focus:border-brand-accent outline-none appearance-none cursor-pointer"
                  >
                    {wallets.map((w: any) => (
                      <option key={w.id} value={w.id}>
                        {w.label} ({w.address?.slice(0, 6)}...
                        {w.address?.slice(-4)})
                      </option>
                    ))}
                  </select>
                  <p className="text-[9px] text-brand-muted mt-1 font-mono truncate">
                    {selectedWallet?.address}
                  </p>
                </>
              ) : (
                <div className="bg-[#0B132B] border border-red-500/20 rounded-lg px-3 py-2.5 text-red-400 text-[10px]">
                  Chưa có ví. Tạo ví tại trang Wallets
                </div>
              )}
            </div>

            {/* Execute */}
            <div className="flex flex-col justify-end">
              <button
                onClick={openTrade}
                disabled={tradeLoading}
                className={`py-3 rounded-xl font-bold text-sm transition-all cursor-pointer disabled:opacity-50 ${
                  direction === "LONG"
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-[0_0_20px_rgba(74,222,128,0.3)]"
                    : "bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-[0_0_20px_rgba(248,113,113,0.3)]"
                }`}
              >
                {tradeLoading
                  ? "Đang mở..."
                  : `${marketType === "SPOT" ? "MUA" : direction} ${coin} x${effectiveLev}`}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-3 flex flex-wrap items-center gap-2 md:gap-4 text-xs text-brand-muted bg-[#0B132B] rounded-lg px-4 py-2">
            <span
              className={`font-bold px-2 py-0.5 rounded text-[10px] ${marketType === "SPOT" ? "bg-blue-500/10 text-blue-400" : "bg-orange-500/10 text-orange-400"}`}
            >
              {marketType}
            </span>
            <span>
              💰{" "}
              <span className="text-white font-bold">
                ${coinPrice.toLocaleString()}
              </span>
            </span>
            <span>
              📊 Margin:{" "}
              <span className="text-white">${margin.toFixed(2)}</span>
            </span>
            <span>
              ⚡ Size:{" "}
              <span className="text-brand-accent font-bold">
                ${volume.toLocaleString()}
              </span>
            </span>
            {marketType === "FUTURES" && (
              <span className="text-red-400">
                💀 Liq: -{liqPct.toFixed(1)}%
              </span>
            )}
            {effectiveLev >= 20 && (
              <span className="text-red-400 font-bold animate-pulse">
                ⚠ RỦI RO CAO
              </span>
            )}
          </div>

          {tradeMsg && (
            <p
              className={`mt-2 text-sm font-bold ${tradeMsg.startsWith("✅") ? "text-green-400" : "text-red-400"}`}
            >
              {tradeMsg}
            </p>
          )}
        </div>

        {/* AI Signals */}
        {signals.length > 0 && (
          <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center">
              <Zap size={14} className="mr-2 text-brand-accent" /> AI Signals (
              {signals.length})
            </h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {signals.map((sig: any, i: number) => (
                <div
                  key={i}
                  className="p-4 bg-[#0B132B] rounded-xl border border-[#1C2541]"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-white">{sig.coin}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${sig.direction === "LONG" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}
                    >
                      {sig.direction} {sig.type}
                    </span>
                  </div>
                  <div className="text-xs text-brand-muted space-y-1">
                    <p>
                      Entry: <span className="text-white">${sig.entry}</span>
                    </p>
                    <p>
                      TP:{" "}
                      <span className="text-green-400">
                        {sig.tp1} / {sig.tp2} / {sig.tp3}
                      </span>
                    </p>
                    <p>
                      SL: <span className="text-red-400">{sig.sl}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Open Positions */}
        <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center">
            <Activity size={14} className="mr-2 text-brand-accent" />
            Lệnh Đang Mở ({trading.open_positions?.length || 0})
            {trading.open_positions?.length > 0 && (
              <span className="ml-2 w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_#4ade80]" />
            )}
          </h3>
          {!trading.open_positions?.length ? (
            <div className="flex flex-col items-center py-8 text-brand-muted">
              <AlertCircle size={32} className="opacity-30 mb-2" />
              <p className="text-sm">Không có lệnh nào đang mở</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {trading.open_positions.map((pos: any, i: number) => (
                <div
                  key={i}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-[#0B132B] rounded-xl border border-[#1C2541] hover:border-brand-accent/40 transition-all"
                >
                  <div className="flex items-center space-x-4">
                    <span
                      className={`w-3 h-3 rounded ${pos.direction === "LONG" ? "bg-green-400 shadow-[0_0_6px_#4ade80]" : "bg-red-400 shadow-[0_0_6px_#f87171]"}`}
                    />
                    <div>
                      <span className="font-bold text-white text-lg">
                        {pos.coin}
                      </span>
                      <span
                        className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded ${pos.direction === "LONG" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}
                      >
                        {pos.direction}
                      </span>
                      <span
                        className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${(pos.type || "FUTURES") === "SPOT" ? "bg-blue-500/10 text-blue-400" : "bg-orange-500/10 text-orange-400"}`}
                      >
                        {pos.type || "FUTURES"}
                      </span>
                      {(pos.leverage || 1) > 1 && (
                        <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-accent/10 text-brand-accent">
                          x{pos.leverage}
                        </span>
                      )}
                      {(pos.dca_count || 0) > 0 && (
                        <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
                          🔄 DCA ×{pos.dca_count}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 md:gap-5 text-sm">
                    <div className="text-brand-muted">
                      Entry:{" "}
                      <span className="text-white">
                        ${pos.entry_price?.toFixed(2)}
                      </span>
                      {pos.last_dca_price > 0 && (
                        <span className="text-cyan-400 text-[9px] ml-1" title="Giá DCA gần nhất">
                          (DCA: ${pos.last_dca_price?.toFixed(2)})
                        </span>
                      )}
                    </div>
                    {pos.current_price > 0 && (
                      <div className="text-brand-muted">
                        Now:{" "}
                        <span
                          className={`font-bold ${pos.current_price >= pos.entry_price ? "text-green-400" : "text-red-400"}`}
                        >
                          $
                          {pos.current_price?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}
                    <div className="text-brand-muted">
                      Size:{" "}
                      <span className="text-white">
                        ${pos.usdt_size?.toFixed(0)}
                      </span>
                    </div>
                    {/* SL/TP Levels */}
                    {pos.sl > 0 && (
                      <div className="text-red-400 text-[10px]">
                        SL: ${pos.sl?.toFixed(2)}
                      </div>
                    )}
                    {pos.tp1 > 0 && (
                      <div className="text-green-400 text-[10px]">
                        TP: ${pos.tp1?.toFixed(2)}
                      </div>
                    )}
                    {/* Wallet badge */}
                    {pos.wallet_label && (
                      <span className="text-[9px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded">
                        👛 {pos.wallet_label}
                      </span>
                    )}
                    {pos.pnl_pct != null && (
                      <div
                        className={`text-xs font-bold px-2 py-1 rounded ${(pos.pnl || 0) >= 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}
                      >
                        {(pos.pnl || 0) >= 0 ? "+" : ""}
                        {(
                          ((pos.pnl || 0) / (pos.usdt_size || 1)) *
                          100 *
                          (pos.leverage || 1)
                        ).toFixed(2)}
                        %
                      </div>
                    )}
                    <div
                      className={`font-extrabold text-xl min-w-[80px] text-right ${(pos.pnl || 0) >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      {(pos.pnl || 0) >= 0 ? "+" : ""}$
                      {(pos.pnl || 0).toFixed(2)}
                    </div>
                    <button
                      onClick={() => closeTrade(pos.key || pos.id)}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                      title="Đóng lệnh"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== LIMIT ORDERS ===== */}
        <LimitOrderSection coin={coin} prices={prices} />

        {/* ===== DCA MODE ===== */}
        <DCASection />


        <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
            Lịch Sử ({history.length})
          </h3>
          {!history.length ? (
            <p className="text-brand-muted text-sm py-4 text-center">
              Chưa có lịch sử giao dịch
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-brand-muted text-xs uppercase border-b border-[#1C2541]">
                    <th className="text-left py-2 px-3">Coin</th>
                    <th className="text-left py-2 px-3">Type</th>
                    <th className="text-left py-2 px-3">Dir</th>
                    <th className="text-right py-2 px-3">Entry</th>
                    <th className="text-right py-2 px-3">Close</th>
                    <th className="text-right py-2 px-3">Size</th>
                    <th className="text-right py-2 px-3">PnL</th>
                    <th className="text-left py-2 px-3">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {history
                    .slice()
                    .reverse()
                    .map((h: any, i: number) => (
                      <tr
                        key={i}
                        className="border-b border-[#1C2541]/50 hover:bg-[#1C2541]/30"
                      >
                        <td className="py-2.5 px-3 font-bold text-white">
                          {h.coin}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-xs ${h.type === "SPOT" ? "text-blue-400" : "text-orange-400"}`}
                        >
                          {h.type || "FUT"}{" "}
                          {h.leverage > 1 ? `x${h.leverage}` : ""}
                        </td>
                        <td
                          className={`py-2.5 px-3 font-bold ${h.direction === "LONG" ? "text-green-400" : "text-red-400"}`}
                        >
                          {h.direction}
                        </td>
                        <td className="py-2.5 px-3 text-right text-brand-muted">
                          ${h.entry_price?.toFixed(4)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-brand-muted">
                          ${h.close_price?.toFixed(4)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-white">
                          ${h.usdt_size?.toFixed(1)}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-bold ${h.pnl >= 0 ? "text-green-400" : "text-red-400"}`}
                        >
                          {h.pnl >= 0 ? "+" : ""}${h.pnl?.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-brand-muted text-xs">
                          {h.close_reason || "-"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
  pulse,
}: {
  label: string;
  value: any;
  color: string;
  pulse?: boolean;
}) {
  return (
    <div>
      <p className="text-brand-muted text-xs uppercase tracking-wider font-semibold">
        {label}
      </p>
      <p
        className={`text-2xl font-extrabold ${color} ${pulse ? "animate-pulse" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

// ===== LIMIT ORDER SECTION =====
function LimitOrderSection({ coin, prices }: { coin: string; prices: any }) {
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loCoin, setLoCoin] = useState(coin);
  const [loDirection, setLoDirection] = useState("LONG");
  const [loPrice, setLoPrice] = useState(0);
  const [loSize, setLoSize] = useState(100);
  const [loLeverage, setLoLeverage] = useState(1);
  const [loExpiry, setLoExpiry] = useState(24);
  const [loLoading, setLoLoading] = useState(false);
  const [loMsg, setLoMsg] = useState("");

  // Sync coin
  useEffect(() => {
    setLoCoin(coin);
    const p = prices?.[coin + "USDT"]?.price;
    if (p) setLoPrice(loDirection === "LONG" ? +(p * 0.97).toFixed(2) : +(p * 1.03).toFixed(2));
  }, [coin]);

  const fetchOrders = () => {
    axios.get(`${API}/api/orders/pending`).then(r => setPendingOrders(r.data.orders || [])).catch(() => {});
  };

  useEffect(() => {
    fetchOrders();
    const iv = setInterval(fetchOrders, 5000);
    return () => clearInterval(iv);
  }, []);

  // Poll for filled events
  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const r = await axios.get(`${API}/api/orders/events`);
        const events = r.data.events || [];
        if (events.length > 0) {
          fetchOrders();
          events.forEach((e: any) => {
            setLoMsg(`✅ Limit ${e.direction} ${e.coin} đã khớp @ $${e.filled?.toLocaleString()}`);
            setTimeout(() => setLoMsg(""), 5000);
          });
        }
      } catch {}
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  const createOrder = async () => {
    setLoLoading(true);
    setLoMsg("");
    try {
      const res = await axios.post(`${API}/api/orders/create`, {
        coin: loCoin, direction: loDirection, trigger_price: loPrice,
        usdt_size: loSize, leverage: loLeverage, expiry_hours: loExpiry,
      });
      if (res.data.success) {
        setLoMsg(`✅ Đã đặt lệnh ${loDirection} ${loCoin} @ $${loPrice.toLocaleString()}`);
        fetchOrders();
        setShowForm(false);
      }
    } catch (e: any) {
      setLoMsg(`❌ ${e.response?.data?.detail || "Lỗi đặt lệnh"}`);
    }
    setLoLoading(false);
    setTimeout(() => setLoMsg(""), 4000);
  };

  const cancelOrder = async (id: string) => {
    try {
      await axios.delete(`${API}/api/orders/cancel/${id}`);
      fetchOrders();
    } catch {}
  };

  return (
    <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
          ⏳ Lệnh Chờ (Limit Orders)
          {pendingOrders.length > 0 && (
            <span className="ml-2 text-[10px] bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded font-bold">
              {pendingOrders.length}
            </span>
          )}
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-brand-accent/10 text-brand-accent text-xs font-bold rounded-lg hover:bg-brand-accent/20 transition-all cursor-pointer"
        >
          {showForm ? "✕ Đóng" : "+ Đặt Lệnh Chờ"}
        </button>
      </div>

      {loMsg && (
        <p className={`text-xs font-bold mb-3 ${loMsg.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>
          {loMsg}
        </p>
      )}

      {/* Form */}
      {showForm && (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-6 mb-4 p-4 bg-[#0B132B] rounded-xl border border-[#1C2541]">
          <div>
            <label className="text-[10px] text-brand-muted uppercase font-bold block mb-1">Coin</label>
            <input value={loCoin} onChange={e => setLoCoin(e.target.value.toUpperCase())}
              className="w-full bg-[#0B132B] border border-[#1C2541] rounded-lg px-3 py-2 text-white text-xs focus:border-brand-accent outline-none" />
          </div>
          <div>
            <label className="text-[10px] text-brand-muted uppercase font-bold block mb-1">Hướng</label>
            <div className="flex space-x-1">
              {["LONG", "SHORT"].map(d => (
                <button key={d} onClick={() => setLoDirection(d)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                    loDirection === d
                      ? d === "LONG" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                      : "bg-[#1C2541] text-brand-muted hover:text-white"
                  }`}>{d}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-brand-muted uppercase font-bold block mb-1">Giá Trigger ($)</label>
            <input type="number" value={loPrice} onChange={e => setLoPrice(Number(e.target.value))}
              className="w-full bg-[#0B132B] border border-[#1C2541] rounded-lg px-3 py-2 text-white text-xs focus:border-brand-accent outline-none" />
          </div>
          <div>
            <label className="text-[10px] text-brand-muted uppercase font-bold block mb-1">Volume ($)</label>
            <input type="number" value={loSize} onChange={e => setLoSize(Number(e.target.value))}
              className="w-full bg-[#0B132B] border border-[#1C2541] rounded-lg px-3 py-2 text-white text-xs focus:border-brand-accent outline-none" />
          </div>
          <div>
            <label className="text-[10px] text-brand-muted uppercase font-bold block mb-1">Hết hạn (giờ)</label>
            <input type="number" value={loExpiry} onChange={e => setLoExpiry(Number(e.target.value))}
              className="w-full bg-[#0B132B] border border-[#1C2541] rounded-lg px-3 py-2 text-white text-xs focus:border-brand-accent outline-none" />
          </div>
          <div className="flex flex-col justify-end">
            <button onClick={createOrder} disabled={loLoading}
              className="py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-brand-accent to-[#D49E20] text-black hover:shadow-[0_0_15px_rgba(243,186,47,0.3)] transition-all cursor-pointer disabled:opacity-50">
              {loLoading ? "⏳..." : "📌 ĐẶT"}
            </button>
          </div>
        </div>
      )}

      {/* Pending list */}
      {pendingOrders.length === 0 ? (
        <p className="text-brand-muted text-xs py-3 text-center">Không có lệnh chờ nào</p>
      ) : (
        <div className="space-y-2">
          {pendingOrders.map((o: any) => (
            <div key={o.id} className="flex items-center justify-between px-4 py-3 bg-[#0B132B] rounded-xl border border-[#1C2541] hover:border-brand-accent/30 transition-all">
              <div className="flex items-center space-x-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  o.direction === "LONG" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                }`}>{o.direction}</span>
                <span className="text-white font-bold">{o.coin}</span>
                <span className="text-brand-muted text-xs">@ <span className="text-brand-accent font-bold">${o.trigger_price?.toLocaleString()}</span></span>
                <span className="text-brand-muted text-xs">| ${o.usdt_size}</span>
                {o.leverage > 1 && <span className="text-[10px] text-brand-accent">x{o.leverage}</span>}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-brand-muted">⏰ {o.expires_at?.split("T")[0]} {o.expires_at?.split("T")[1]?.slice(0, 5)}</span>
                <button onClick={() => cancelOrder(o.id)}
                  className="px-2 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white text-xs transition-all cursor-pointer">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== DCA SECTION =====
function DCASection() {
  const [plans, setPlans] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [dcaCoin, setDcaCoin] = useState("BTC");
  const [dcaAmount, setDcaAmount] = useState(50);
  const [dcaInterval, setDcaInterval] = useState("daily");
  const [dcaTotalBuys, setDcaTotalBuys] = useState(30);
  const [dcaLoading, setDcaLoading] = useState(false);
  const [dcaMsg, setDcaMsg] = useState("");

  const fetchPlans = () => {
    axios.get(`${API}/api/dca/plans`).then(r => setPlans(r.data.plans || [])).catch(() => {});
  };

  useEffect(() => {
    fetchPlans();
    const iv = setInterval(fetchPlans, 10000);
    return () => clearInterval(iv);
  }, []);

  const createPlan = async () => {
    setDcaLoading(true);
    setDcaMsg("");
    try {
      const res = await axios.post(`${API}/api/dca/create`, {
        coin: dcaCoin, amount_per_buy: dcaAmount, interval: dcaInterval,
        total_buys: dcaTotalBuys, leverage: 1,
      });
      if (res.data.success) {
        setDcaMsg(`✅ DCA Plan ${dcaCoin} đã tạo: $${dcaAmount}/${dcaInterval} x${dcaTotalBuys}`);
        fetchPlans();
        setShowForm(false);
      }
    } catch (e: any) {
      setDcaMsg(`❌ ${e.response?.data?.detail || "Lỗi tạo DCA"}`);
    }
    setDcaLoading(false);
    setTimeout(() => setDcaMsg(""), 4000);
  };

  const togglePlan = async (id: string) => {
    try {
      await axios.post(`${API}/api/dca/toggle/${id}`);
      fetchPlans();
    } catch {}
  };

  const deletePlan = async (id: string) => {
    if (!confirm("Xóa DCA plan này?")) return;
    try {
      await axios.delete(`${API}/api/dca/delete/${id}`);
      fetchPlans();
    } catch {}
  };

  const intervalLabel: any = { hourly: "Mỗi giờ", daily: "Hàng ngày", weekly: "Hàng tuần" };

  return (
    <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
          🔄 DCA Mode
          {plans.length > 0 && (
            <span className="ml-2 text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-bold">
              {plans.filter(p => p.status === "ACTIVE").length} active
            </span>
          )}
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-500/20 transition-all cursor-pointer"
        >
          {showForm ? "✕ Đóng" : "+ Tạo DCA Plan"}
        </button>
      </div>

      {dcaMsg && (
        <p className={`text-xs font-bold mb-3 ${dcaMsg.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>
          {dcaMsg}
        </p>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-5 mb-4 p-4 bg-[#0B132B] rounded-xl border border-[#1C2541]">
          <div>
            <label className="text-[10px] text-brand-muted uppercase font-bold block mb-1">Coin</label>
            <select value={dcaCoin} onChange={e => setDcaCoin(e.target.value)}
              className="w-full bg-[#0B132B] border border-[#1C2541] rounded-lg px-3 py-2 text-white text-xs focus:border-blue-400 outline-none cursor-pointer">
              {["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "LINK", "DOT", "AVAX"].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-brand-muted uppercase font-bold block mb-1">Mỗi lần ($)</label>
            <input type="number" value={dcaAmount} min={10} onChange={e => setDcaAmount(Number(e.target.value))}
              className="w-full bg-[#0B132B] border border-[#1C2541] rounded-lg px-3 py-2 text-white text-xs focus:border-blue-400 outline-none" />
          </div>
          <div>
            <label className="text-[10px] text-brand-muted uppercase font-bold block mb-1">Chu kỳ</label>
            <div className="flex space-x-1">
              {(["hourly", "daily", "weekly"] as const).map(iv => (
                <button key={iv} onClick={() => setDcaInterval(iv)}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold cursor-pointer ${
                    dcaInterval === iv ? "bg-blue-500 text-white" : "bg-[#1C2541] text-brand-muted hover:text-white"
                  }`}>{iv === "hourly" ? "1H" : iv === "daily" ? "1D" : "1W"}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-brand-muted uppercase font-bold block mb-1">Số lần</label>
            <input type="number" value={dcaTotalBuys} min={1} onChange={e => setDcaTotalBuys(Number(e.target.value))}
              className="w-full bg-[#0B132B] border border-[#1C2541] rounded-lg px-3 py-2 text-white text-xs focus:border-blue-400 outline-none" />
            <p className="text-[8px] text-brand-muted mt-0.5">Tổng: ${(dcaAmount * dcaTotalBuys).toLocaleString()}</p>
          </div>
          <div className="flex flex-col justify-end">
            <button onClick={createPlan} disabled={dcaLoading}
              className="py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all cursor-pointer disabled:opacity-50">
              {dcaLoading ? "⏳..." : "🚀 TẠO PLAN"}
            </button>
          </div>
        </div>
      )}

      {/* Plans List */}
      {plans.length === 0 ? (
        <p className="text-brand-muted text-xs py-3 text-center">Chưa có DCA plan nào</p>
      ) : (
        <div className="space-y-2">
          {plans.map((p: any) => {
            const progress = p.total_buys > 0 ? (p.buys_done / p.total_buys) * 100 : 0;
            return (
              <div key={p.id} className="p-4 bg-[#0B132B] rounded-xl border border-[#1C2541] hover:border-blue-500/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className={`w-2 h-2 rounded-full ${p.status === "ACTIVE" ? "bg-green-400 shadow-[0_0_6px_#4ade80] animate-pulse" : "bg-yellow-400"}`} />
                    <span className="text-white font-bold">{p.coin}</span>
                    <span className="text-[10px] text-brand-muted">${p.amount_per_buy} / {intervalLabel[p.interval] || p.interval}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      p.status === "ACTIVE" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                    }`}>{p.status}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => togglePlan(p.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        p.status === "ACTIVE"
                          ? "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                          : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                      }`}>
                      {p.status === "ACTIVE" ? "⏸ Pause" : "▶ Resume"}
                    </button>
                    <button onClick={() => deletePlan(p.id)}
                      className="px-2 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white text-xs transition-all cursor-pointer">
                      🗑
                    </button>
                  </div>
                </div>
                {/* Progress + Stats */}
                <div className="flex items-center space-x-4 text-xs text-brand-muted">
                  <span>📊 {p.buys_done}/{p.total_buys} lần mua</span>
                  <span>💰 Đã đầu tư: <span className="text-white font-bold">${p.total_invested?.toLocaleString()}</span></span>
                  {p.avg_entry > 0 && <span>📈 Avg: <span className="text-brand-accent font-bold">${p.avg_entry?.toLocaleString()}</span></span>}
                  {p.next_buy_at && p.status === "ACTIVE" && (
                    <span>⏰ Next: {p.next_buy_at?.split("T")[0]} {p.next_buy_at?.split("T")[1]?.slice(0, 5)}</span>
                  )}
                </div>
                {p.total_buys > 0 && (
                  <div className="mt-2 h-1.5 bg-[#1C2541] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

