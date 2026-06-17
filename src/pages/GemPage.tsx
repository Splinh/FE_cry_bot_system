import { useState, useEffect } from "react";
import axios from "axios";
import {
  Search,
  Zap,
  Clock,
  TrendingUp,
  AlertCircle,
  Loader,
  ShoppingCart,
} from "lucide-react";
import Header from "../components/Header";

import { API } from "../config";
const CHAINS = ["solana", "ethereum", "bsc", "arbitrum", "base", "polygon"];

export default function GemPage({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const [tab, setTab] = useState<
    "portfolio" | "gems" | "new" | "cex" | "analyze"
  >("portfolio");
  const [chain, setChain] = useState("solana");
  const [gems, setGems] = useState<any[]>([]);
  const [newTokens, setNewTokens] = useState<any[]>([]);
  const [cexTokens, setCexTokens] = useState<any[]>([]);
  const [tokenQuery, setTokenQuery] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Gem buy state
  const [gemVolume, setGemVolume] = useState(100);
  const [buyLoading, setBuyLoading] = useState<string | null>(null);
  const [buyMsg, setBuyMsg] = useState("");

  // Gem portfolio state
  const [gemPositions, setGemPositions] = useState<any[]>([]);
  const [gemHistory, setGemHistory] = useState<any[]>([]);

  const fetchGemPortfolio = () => {
    axios
      .get(`${API}/api/trading`)
      .then((r) => {
        const open = (r.data.open_positions || []).filter(
          (p: any) => p.type === "GEM",
        );
        const closed = (r.data.history || []).filter(
          (h: any) => h.type === "GEM",
        );
        setGemPositions(open);
        setGemHistory(closed);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchGemPortfolio();
    const iv = setInterval(fetchGemPortfolio, 5000);
    return () => clearInterval(iv);
  }, []);

  const scanGems = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/api/gems/scan?chain=${chain}`);
      setGems(r.data.gems || []);
    } catch {
      setGems([]);
    }
    setLoading(false);
  };

  const scanNew = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/api/gems/new?chain=${chain}&hours=1`);
      setNewTokens(r.data.tokens || []);
    } catch {
      setNewTokens([]);
    }
    setLoading(false);
  };

  const scanCex = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/api/listing/potential`);
      setCexTokens(r.data.tokens || []);
    } catch {
      setCexTokens([]);
    }
    setLoading(false);
  };

  const analyzeToken = async () => {
    if (!tokenQuery) return;
    setLoading(true);
    try {
      const r = await axios.get(
        `${API}/api/gems/analyze?query=${encodeURIComponent(tokenQuery)}`,
      );
      setAnalysis(r.data.result);
    } catch {
      setAnalysis(null);
    }
    setLoading(false);
  };

  const tabs = [
    {
      key: "portfolio",
      label: "📦 Portfolio",
      action: () => fetchGemPortfolio(),
    },
    { key: "gems", label: "💎 DEX Gems", action: scanGems },
    { key: "new", label: "🆕 New Listings", action: scanNew },
    { key: "cex", label: "🏦 CEX Potential", action: scanCex },
    { key: "analyze", label: "🔍 Analyze Token", action: () => {} },
  ] as const;

  const buyGem = async (gem: any) => {
    if (!gem.price || gem.price <= 0) {
      setBuyMsg("❌ Token chưa có giá");
      setTimeout(() => setBuyMsg(""), 3000);
      return;
    }
    setBuyLoading(gem.symbol || gem.name);
    try {
      const res = await axios.post(`${API}/api/gems/buy`, {
        symbol: gem.symbol || gem.name,
        name: gem.name || gem.symbol,
        price: gem.price,
        chain: gem.chain || chain,
        volume: gemVolume,
        pair_address: gem.pair_address || "",
      });
      if (res.data.success) {
        setBuyMsg(`✅ Đã mua ${gem.symbol} @ $${gem.price} | $${gemVolume}`);
        fetchGemPortfolio(); // Refresh portfolio
      }
    } catch (e: any) {
      setBuyMsg(`❌ ${e.response?.data?.detail || "Lỗi mua"}`);
    }
    setBuyLoading(null);
    setTimeout(() => setBuyMsg(""), 4000);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <Header title="Gem Scanner" subtitle="Tìm kèo x100" onMenuToggle={onMenuToggle} />
      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-brand-surface border border-[#1C2541] rounded-xl p-1.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                tab === t.key
                  ? "bg-brand-accent text-brand-bg shadow-lg"
                  : "text-brand-muted hover:text-white hover:bg-[#1C2541]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Gem Portfolio Tab */}
        {tab === "portfolio" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">
                💼 Gem Portfolio ({gemPositions.length} lệnh mở)
              </h2>
              <button
                onClick={fetchGemPortfolio}
                className="text-xs text-brand-accent hover:text-white cursor-pointer"
              >
                🔄 Refresh
              </button>
            </div>
            {gemPositions.length === 0 ? (
              <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-8 text-center">
                <p className="text-brand-muted">
                  📦 Chưa có gem nào trong portfolio
                </p>
                <p className="text-[10px] text-brand-muted mt-1">
                  Vào tab DEX Gems → Scan → MUA để thêm
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {gemPositions.map((p: any, i: number) => {
                  const pnl = p.pnl || 0;
                  const pnlPct = p.entry_price
                    ? (((p.current_price || p.entry_price) - p.entry_price) /
                        p.entry_price) *
                      100
                    : 0;
                  const fmtPrice = (v: number) =>
                    v < 0.01 ? v?.toFixed(8) : v?.toFixed(4);
                  return (
                    <div
                      key={i}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-[#0B132B] rounded-xl border border-[#1C2541] hover:border-brand-accent/40 transition-all"
                    >
                      <div className="flex items-center space-x-4">
                        <span className="w-3 h-3 rounded bg-green-400 shadow-[0_0_6px_#4ade80]" />
                        <div>
                          <span className="font-bold text-white text-lg">
                            {p.coin}
                          </span>
                          <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">
                            LONG
                          </span>
                          <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">
                            GEM
                          </span>
                          {p.chain && (
                            <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 uppercase">
                              {p.chain}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 md:gap-5 text-sm">
                        <div className="text-brand-muted">
                          Entry:{" "}
                          <span className="text-white">
                            ${fmtPrice(p.entry_price)}
                          </span>
                        </div>
                        <div className="text-brand-muted">
                          Now:{" "}
                          <span
                            className={`font-bold ${(p.current_price || p.entry_price) >= p.entry_price ? "text-green-400" : "text-red-400"}`}
                          >
                            ${fmtPrice(p.current_price || p.entry_price)}
                          </span>
                        </div>
                        <div className="text-brand-muted">
                          Size:{" "}
                          <span className="text-white">
                            ${p.usdt_size?.toFixed(0)}
                          </span>
                        </div>
                        <div className="text-red-400 text-[10px]">
                          SL: ${fmtPrice(p.sl)}
                        </div>
                        <div className="text-green-400 text-[10px]">
                          TP: ${fmtPrice(p.tp1)}
                        </div>
                        <div
                          className={`text-xs font-bold px-2 py-1 rounded ${pnlPct >= 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}
                        >
                          {pnlPct >= 0 ? "+" : ""}
                          {pnlPct.toFixed(2)}%
                        </div>
                        <div
                          className={`font-extrabold text-xl min-w-[80px] text-right ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}
                        >
                          {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                        </div>
                        <button
                          onClick={async () => {
                            if (!confirm(`Chốt lệnh ${p.coin}?`)) return;
                            try {
                              await axios.post(`${API}/api/trading/close/${p._key}`);
                              fetchGemPortfolio();
                            } catch {}
                          }}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                          title="Đóng lệnh"
                        >
                          ✖
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Gem History */}
            {gemHistory.length > 0 && (
              <div>
                <h3 className="text-white font-bold text-sm mb-2">
                  📜 Lịch sử Gem ({gemHistory.length})
                </h3>
                <div className="bg-brand-surface border border-[#1C2541] rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#1C2541] text-brand-muted">
                        <th className="px-3 py-2 text-left">COIN</th>
                        <th className="px-3 py-2 text-left">ENTRY</th>
                        <th className="px-3 py-2 text-left">CLOSE</th>
                        <th className="px-3 py-2 text-left">SIZE</th>
                        <th className="px-3 py-2 text-left">PNL</th>
                        <th className="px-3 py-2 text-left">REASON</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gemHistory.map((h: any, i: number) => (
                        <tr key={i} className="border-b border-[#1C2541]/50">
                          <td className="px-3 py-2 text-white font-bold">
                            {h.coin}
                          </td>
                          <td className="px-3 py-2 text-white">
                            ${h.entry_price?.toFixed(8)}
                          </td>
                          <td className="px-3 py-2 text-white">
                            ${h.close_price?.toFixed(8)}
                          </td>
                          <td className="px-3 py-2 text-brand-accent">
                            ${h.usdt_size}
                          </td>
                          <td
                            className={`px-3 py-2 font-bold ${(h.pnl || 0) >= 0 ? "text-green-400" : "text-red-400"}`}
                          >
                            ${h.pnl?.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-brand-muted">
                            {h.close_reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DEX Gems Tab */}
        {tab === "gems" && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <select
                value={chain}
                onChange={(e) => setChain(e.target.value)}
                className="bg-[#0B132B] border border-[#1C2541] rounded-lg px-4 py-2.5 text-white text-sm focus:border-brand-accent outline-none cursor-pointer"
              >
                {CHAINS.map((c) => (
                  <option key={c} value={c}>
                    {c.toUpperCase()}
                  </option>
                ))}
              </select>
              <button
                onClick={scanGems}
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-brand-accent to-[#D49E20] text-brand-bg font-bold rounded-xl hover:shadow-[0_0_20px_rgba(243,186,47,0.3)] transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-2"
              >
                {loading ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <Zap size={14} />
                )}
                <span>{loading ? "Đang quét..." : "SCAN GEMS"}</span>
              </button>
            </div>
            {/* Gem Buy Volume Bar */}
            <div className="flex flex-wrap items-center gap-2 bg-[#0B132B] border border-[#1C2541] rounded-xl px-4 py-2">
              <ShoppingCart size={14} className="text-brand-accent" />
              <span className="text-[10px] text-brand-muted uppercase font-bold">
                Volume Mua:
              </span>
              {[5, 10, 20, 30, 50, 100, 250, 500, 1000].map((v) => (
                <button
                  key={v}
                  onClick={() => setGemVolume(v)}
                  className={`text-[9px] px-2 py-1 rounded cursor-pointer font-bold ${gemVolume === v ? "bg-brand-accent text-black" : "bg-[#1C2541] text-brand-muted hover:text-white"}`}
                >
                  ${v}
                </button>
              ))}
              <input
                type="number"
                value={gemVolume}
                onChange={(e) => setGemVolume(Number(e.target.value))}
                min={10}
                className="w-20 bg-[#0B132B] border border-[#1C2541] rounded-lg px-2 py-1 text-white text-xs focus:border-brand-accent outline-none"
              />
              <span className="text-brand-accent font-bold text-xs">
                ${gemVolume}
              </span>
              {buyMsg && (
                <span
                  className={`text-xs font-bold ml-auto ${buyMsg.startsWith("✅") ? "text-green-400" : "text-red-400"}`}
                >
                  {buyMsg}
                </span>
              )}
            </div>
            <GemList
              items={gems}
              onBuy={buyGem}
              buyLoading={buyLoading}
              gemVolume={gemVolume}
            />
          </div>
        )}

        {/* New DEX Listings Tab */}
        {tab === "new" && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <select
                value={chain}
                onChange={(e) => setChain(e.target.value)}
                className="bg-[#0B132B] border border-[#1C2541] rounded-lg px-4 py-2.5 text-white text-sm focus:border-brand-accent outline-none cursor-pointer"
              >
                {CHAINS.map((c) => (
                  <option key={c} value={c}>
                    {c.toUpperCase()}
                  </option>
                ))}
              </select>
              <button
                onClick={scanNew}
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8] text-white font-bold rounded-xl hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-2"
              >
                {loading ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <Clock size={14} />
                )}
                <span>{loading ? "Đang quét..." : "SCAN < 1H"}</span>
              </button>
            </div>
            <GemList
              items={newTokens}
              onBuy={buyGem}
              buyLoading={buyLoading}
              gemVolume={gemVolume}
            />
          </div>
        )}

        {/* CEX Potential Tab */}
        {tab === "cex" && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={scanCex}
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:shadow-[0_0_20px_rgba(74,222,128,0.3)] transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-2"
              >
                {loading ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <TrendingUp size={14} />
                )}
                <span>
                  {loading
                    ? "Đang quét Binance/Gate/MEXC..."
                    : "TÌM TOKEN SẮP LÊN BINANCE"}
                </span>
              </button>
            </div>
            {cexTokens.length === 0 ? (
              <EmptyState text="Nhấn nút để quét token có trên Gate/MEXC nhưng chưa có trên Binance" />
            ) : (
              <div className="overflow-x-auto bg-brand-surface border border-[#1C2541] rounded-xl">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-brand-muted text-xs uppercase border-b border-[#1C2541] bg-[#0B132B]">
                      <th className="text-left py-3 px-4">Symbol</th>
                      <th className="text-left py-3 px-4">Có trên</th>
                      <th className="text-left py-3 px-4">Chưa có</th>
                      <th className="text-center py-3 px-4">Khả năng</th>
                      <th className="text-center py-3 px-4">Score</th>
                      <th className="text-left py-3 px-4">Contact / Mua</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cexTokens.map((t: any, i: number) => {
                      const links = t.links || {};
                      return (
                      <tr
                        key={i}
                        className="border-b border-[#1C2541]/50 hover:bg-[#1C2541]/30"
                      >
                        <td className="py-3 px-4 font-bold text-white">
                          {t.symbol}
                        </td>
                        <td className="py-3 px-4">
                          {t.on_exchanges?.map((ex: string, j: number) => (
                            <span
                              key={j}
                              className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded mr-1"
                            >
                              {ex}
                            </span>
                          ))}
                        </td>
                        <td className="py-3 px-4 text-red-400 text-xs font-bold">
                          {t.not_on}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded ${
                              t.confidence === "CAO"
                                ? "bg-green-500/15 text-green-400"
                                : t.confidence === "TRUNG BINH"
                                  ? "bg-yellow-500/15 text-yellow-400"
                                  : "bg-brand-muted/10 text-brand-muted"
                            }`}
                          >
                            {t.confidence}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-extrabold text-lg ${t.score >= 80 ? "text-green-400" : t.score >= 60 ? "text-yellow-400" : "text-brand-muted"}`}
                          >
                            {t.score}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {links.website && (
                              <a href={links.website} target="_blank" rel="noopener noreferrer"
                                className="text-[10px] px-1.5 py-0.5 rounded bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/25 transition-all font-bold"
                                title="Website">🌐</a>
                            )}
                            {links.twitter && (
                              <a href={links.twitter} target="_blank" rel="noopener noreferrer"
                                className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 hover:bg-sky-500/25 transition-all font-bold"
                                title="Twitter/X">🐦</a>
                            )}
                            {links.telegram && (
                              <a href={links.telegram} target="_blank" rel="noopener noreferrer"
                                className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/25 transition-all font-bold"
                                title="Telegram">📲</a>
                            )}
                            {links.discord && (
                              <a href={links.discord} target="_blank" rel="noopener noreferrer"
                                className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/25 transition-all font-bold"
                                title="Discord">💬</a>
                            )}
                            {links.coingecko && (
                              <a href={links.coingecko} target="_blank" rel="noopener noreferrer"
                                className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 hover:bg-green-500/25 transition-all font-bold"
                                title="CoinGecko">📊</a>
                            )}
                            {links.gate_trade && (
                              <a href={links.gate_trade} target="_blank" rel="noopener noreferrer"
                                className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/30 transition-all font-bold"
                                title="Mua trên Gate.io">🛒 Gate</a>
                            )}
                            {links.mexc_trade && (
                              <a href={links.mexc_trade} target="_blank" rel="noopener noreferrer"
                                className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/30 transition-all font-bold"
                                title="Mua trên MEXC">🛒 MEXC</a>
                            )}
                            {Object.keys(links).length === 0 && (
                              <span className="text-[10px] text-brand-muted">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Analyze Token Tab */}
        {tab === "analyze" && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                value={tokenQuery}
                onChange={(e) => setTokenQuery(e.target.value)}
                placeholder="Nhập tên token hoặc contract address..."
                className="flex-1 bg-[#0B132B] border border-[#1C2541] rounded-lg px-4 py-2.5 text-white text-sm focus:border-brand-accent outline-none"
                onKeyDown={(e) => e.key === "Enter" && analyzeToken()}
              />
              <button
                onClick={analyzeToken}
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-2"
              >
                {loading ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <Search size={14} />
                )}
                <span>{loading ? "Đang phân tích..." : "ANALYZE"}</span>
              </button>
            </div>
            {analysis && (
              <div className="space-y-4">
                {/* Header Card */}
                <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-full blur-[60px]" />
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-extrabold text-white">
                          {analysis.name}
                        </h3>
                        <p className="text-brand-accent font-bold">
                          ${analysis.symbol}
                        </p>
                        {analysis.chain_name && (
                          <p className="text-xs text-brand-muted mt-1">
                            🌐{" "}
                            <span className="text-white font-medium">
                              {analysis.chain_name}
                            </span>
                          </p>
                        )}
                        {analysis.dex && (
                          <p className="text-xs text-brand-muted">
                            📍 DEX:{" "}
                            <span className="text-white">{analysis.dex}</span>
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-extrabold text-white">
                          $
                          {(analysis.price || 0) < 0.01
                            ? (analysis.price || 0).toFixed(8)
                            : (analysis.price || 0).toFixed(4)}
                        </p>
                        <div className="flex space-x-2 mt-1 justify-end">
                          {analysis.price_change &&
                            Object.entries(analysis.price_change).map(
                              ([k, v]: any) =>
                                v ? (
                                  <span
                                    key={k}
                                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${Number(v) >= 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}
                                  >
                                    {k}: {Number(v) >= 0 ? "+" : ""}
                                    {Number(v).toFixed(1)}%
                                  </span>
                                ) : null,
                            )}
                        </div>
                      </div>
                    </div>

                    {/* Contract */}
                    {analysis.address && (
                      <div className="flex items-center space-x-2 bg-[#0B132B] rounded-lg px-4 py-2 mb-4">
                        <span className="text-[11px] text-brand-muted font-mono flex-1">
                          {analysis.address}
                        </span>
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(analysis.address)
                          }
                          className="text-xs text-brand-accent hover:text-white cursor-pointer font-bold"
                        >
                          📋 Copy
                        </button>
                      </div>
                    )}

                    {/* Description / Purpose */}
                    {analysis.description && (
                      <div className="bg-[#0B132B] border border-[#1C2541] rounded-lg p-4 mb-4">
                        <p className="text-xs text-brand-muted uppercase font-bold mb-1">
                          📝 Mô tả / Mục đích Token
                        </p>
                        <p className="text-sm text-white leading-relaxed">
                          {analysis.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MiniStat
                    label="💎 Gem Score"
                    value={analysis.gem?.gem_score ?? "?"}
                    color={
                      (analysis.gem?.gem_score || 0) >= 70
                        ? "text-green-400"
                        : "text-yellow-400"
                    }
                  />
                  <MiniStat
                    label="🛡️ Safety"
                    value={`${analysis.safety?.score ?? "?"}/100`}
                    color={
                      (analysis.safety?.score || 0) >= 60
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  />
                  <MiniStat
                    label="💧 Liquidity"
                    value={`$${(analysis.liquidity || 0).toLocaleString()}`}
                    color="text-blue-400"
                  />
                  <MiniStat
                    label="🏷️ FDV"
                    value={`$${(analysis.fdv || 0).toLocaleString()}`}
                    color="text-brand-accent"
                  />
                  <MiniStat
                    label="📊 Volume 24h"
                    value={`$${(analysis.volume_24h || 0).toLocaleString()}`}
                    color="text-white"
                  />
                  <MiniStat
                    label="💰 Market Cap"
                    value={`$${(analysis.market_cap || 0).toLocaleString()}`}
                    color="text-purple-400"
                  />
                  <MiniStat
                    label="🟢 Buys 24h"
                    value={analysis.buys_24h || 0}
                    color="text-green-400"
                  />
                  <MiniStat
                    label="🔴 Sells 24h"
                    value={analysis.sells_24h || 0}
                    color="text-red-400"
                  />
                </div>

                {/* VC Backing */}
                {analysis.vc_backing?.length > 0 && (
                  <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-5">
                    <p className="text-sm font-bold text-green-400 uppercase mb-3">
                      💰 Quỹ Đầu Tư (VC Backing)
                    </p>
                    <div className="grid gap-2 md:grid-cols-2">
                      {analysis.vc_backing.map((vc: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-[#0B132B] rounded-lg p-3 border border-green-500/10"
                        >
                          <div className="flex items-center space-x-3">
                            <span
                              className={`w-3 h-3 rounded-full ${vc.tier === 1 ? "bg-yellow-400 shadow-[0_0_6px_#facc15]" : "bg-blue-400"}`}
                            />
                            <div>
                              <p className="text-white font-bold text-sm">
                                {vc.name}
                              </p>
                              <p className="text-[10px] text-brand-muted">
                                Tier {vc.tier} • Score: {vc.score}/10
                              </p>
                            </div>
                          </div>
                          {vc.url && (
                            <a
                              href={vc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:text-white transition-colors"
                            >
                              🌐 Website
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Website & Social Links */}
                {(analysis.website ||
                  Object.keys(analysis.socials || {}).length > 0) && (
                  <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-5">
                    <p className="text-sm font-bold text-white uppercase mb-3">
                      🔗 Links
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.website && (
                        <a
                          href={analysis.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-[#0B132B] border border-[#1C2541] rounded-lg text-xs font-bold text-brand-accent hover:bg-brand-accent/10 hover:border-brand-accent/30 transition-all"
                        >
                          🌐 Website
                        </a>
                      )}
                      {Object.entries(analysis.socials || {}).map(
                        ([key, url]: any) => (
                          <a
                            key={key}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-[#0B132B] border border-[#1C2541] rounded-lg text-xs font-bold text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all capitalize"
                          >
                            {key === "twitter"
                              ? "🐦"
                              : key === "telegram"
                                ? "📲"
                                : key === "discord"
                                  ? "💬"
                                  : "🔗"}{" "}
                            {key}
                          </a>
                        ),
                      )}
                      {analysis.dexscreener_url && (
                        <a
                          href={analysis.dexscreener_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-[#0B132B] border border-[#1C2541] rounded-lg text-xs font-bold text-green-400 hover:bg-green-500/10 hover:border-green-500/30 transition-all"
                        >
                          📊 DexScreener
                        </a>
                      )}
                      {analysis.explorer_url && (
                        <a
                          href={analysis.explorer_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-[#0B132B] border border-[#1C2541] rounded-lg text-xs font-bold text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/30 transition-all"
                        >
                          🔍 Explorer
                        </a>
                      )}
                      {analysis.pair_url && (
                        <a
                          href={analysis.pair_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-[#0B132B] border border-[#1C2541] rounded-lg text-xs font-bold text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/30 transition-all"
                        >
                          📈 Chart
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Safety Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.safety?.warnings?.length > 0 && (
                    <div className="bg-brand-surface border border-red-500/20 rounded-xl p-5">
                      <p className="text-sm font-bold text-red-400 uppercase mb-2">
                        ⚠ Cảnh báo
                      </p>
                      <div className="space-y-1">
                        {analysis.safety.warnings.map(
                          (w: string, i: number) => (
                            <p key={i} className="text-xs text-red-400/80">
                              • {w}
                            </p>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                  {analysis.safety?.positives?.length > 0 && (
                    <div className="bg-brand-surface border border-green-500/20 rounded-xl p-5">
                      <p className="text-sm font-bold text-green-400 uppercase mb-2">
                        ✅ Điểm tốt
                      </p>
                      <div className="space-y-1">
                        {analysis.safety.positives.map(
                          (p: string, i: number) => (
                            <p key={i} className="text-xs text-green-400/80">
                              • {p}
                            </p>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function GemList({
  items,
  onBuy,
  buyLoading,
  gemVolume,
}: {
  items: any[];
  onBuy?: (gem: any) => void;
  buyLoading?: string | null;
  gemVolume?: number;
}) {
  if (!items.length) return <EmptyState text="Nhấn nút Scan để bắt đầu quét" />;

  const copyAddr = (addr: string) => {
    navigator.clipboard.writeText(addr);
  };

  // shortenAddr available if needed
  // const shortenAddr = (addr: string) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((g: any, i: number) => (
        <div
          key={i}
          className="bg-brand-surface border border-[#1C2541] rounded-xl p-4 hover:border-brand-accent/40 transition-all group relative overflow-hidden"
        >
          {/* Glow */}
          {(g.gem_score || 0) >= 70 && (
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-400/5 rounded-full blur-[40px]" />
          )}

          {/* Header: Name + Score */}
          <div className="flex justify-between items-start mb-3 relative z-10">
            <div>
              <p className="font-bold text-white text-lg leading-tight">
                {g.name || "Unknown"}
              </p>
              <p className="text-xs text-brand-accent font-bold">{g.symbol}</p>
              {g.chain && (
                <p className="text-[10px] text-brand-muted uppercase mt-0.5">
                  {g.chain}
                </p>
              )}
            </div>
            <div className="text-right">
              <div
                className={`text-2xl font-extrabold ${
                  (g.gem_score || 0) >= 70
                    ? "text-green-400"
                    : (g.gem_score || 0) >= 40
                      ? "text-yellow-400"
                      : "text-red-400"
                }`}
              >
                {g.gem_score || 0}
              </div>
              <p className="text-[9px] text-brand-muted uppercase">GEM SCORE</p>
            </div>
          </div>

          {/* Contract Address */}
          {g.address && (
            <div className="flex items-center space-x-2 mb-3 bg-[#0B132B] rounded-lg px-3 py-1.5">
              <span className="text-[10px] text-brand-muted font-mono flex-1 truncate">
                {g.address}
              </span>
              <button
                onClick={() => copyAddr(g.address)}
                className="text-[10px] text-brand-accent hover:text-white transition-colors cursor-pointer shrink-0"
              >
                📋 Copy
              </button>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mb-3">
            <div className="text-brand-muted">
              💰 Price:{" "}
              <span className="text-white font-medium">
                $
                {(g.price || 0) < 0.01
                  ? (g.price || 0).toFixed(8)
                  : (g.price || 0).toFixed(4)}
              </span>
            </div>
            <div className="text-brand-muted">
              💧 Liq:{" "}
              <span className="text-white font-medium">
                ${(g.liquidity || 0).toLocaleString()}
              </span>
            </div>
            <div className="text-brand-muted">
              📊 Vol:{" "}
              <span className="text-white font-medium">
                ${(g.volume_24h || 0).toLocaleString()}
              </span>
            </div>
            <div className="text-brand-muted">
              🏷️ FDV:{" "}
              <span className="text-brand-accent font-medium">
                ${(g.fdv || 0).toLocaleString()}
              </span>
            </div>
            {g.buys_24h != null && (
              <div className="text-brand-muted">
                🟢 Buy:{" "}
                <span className="text-green-400 font-medium">{g.buys_24h}</span>
              </div>
            )}
            {g.sells_24h != null && (
              <div className="text-brand-muted">
                🔴 Sell:{" "}
                <span className="text-red-400 font-medium">{g.sells_24h}</span>
              </div>
            )}
          </div>

          {/* Price Changes */}
          <div className="flex items-center space-x-3 text-xs mb-3">
            {g.price_change_5m != null && (
              <span
                className={`px-2 py-0.5 rounded ${Number(g.price_change_5m) >= 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}
              >
                5m: {Number(g.price_change_5m) >= 0 ? "+" : ""}
                {Number(g.price_change_5m).toFixed(1)}%
              </span>
            )}
            {g.price_change_1h != null && (
              <span
                className={`px-2 py-0.5 rounded ${Number(g.price_change_1h) >= 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}
              >
                1h: {Number(g.price_change_1h) >= 0 ? "+" : ""}
                {Number(g.price_change_1h).toFixed(1)}%
              </span>
            )}
            {g.price_change_24h != null && (
              <span
                className={`px-2 py-0.5 rounded ${Number(g.price_change_24h) >= 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}
              >
                24h: {Number(g.price_change_24h) >= 0 ? "+" : ""}
                {Number(g.price_change_24h).toFixed(1)}%
              </span>
            )}
          </div>

          {/* Safety */}
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="text-brand-muted">
              🛡️ Safety:{" "}
              <span
                className={`font-bold ${(g.safety_score || 0) >= 60 ? "text-green-400" : (g.safety_score || 0) >= 30 ? "text-yellow-400" : "text-red-400"}`}
              >
                {g.safety_score || 0}/100
              </span>
            </span>
            {g.age_mins != null && (
              <span className="text-brand-muted">
                ⏱️{" "}
                {g.age_mins < 60
                  ? `${Math.round(g.age_mins)}m ago`
                  : `${(g.age_mins / 60).toFixed(1)}h ago`}
              </span>
            )}
          </div>

          {/* Warnings */}
          {g.warnings?.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2 mb-3">
              {g.warnings.slice(0, 3).map((w: string, j: number) => (
                <p key={j} className="text-[10px] text-red-400">
                  ⚠ {w}
                </p>
              ))}
            </div>
          )}

          {/* Links + Buy */}
          <div className="flex space-x-2">
            {g.dexscreener_url && g.pair_address && (
              <a
                href={g.dexscreener_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center py-2 bg-[#0B132B] border border-[#1C2541] rounded-lg text-xs font-bold text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all"
              >
                📊 DexScreener
              </a>
            )}
            {g.url && (
              <a
                href={g.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center py-2 bg-[#0B132B] border border-[#1C2541] rounded-lg text-xs font-bold text-brand-accent hover:bg-brand-accent/10 hover:border-brand-accent/30 transition-all"
              >
                🔗 Chart
              </a>
            )}
            {onBuy && (
              <button
                onClick={() => onBuy(g)}
                disabled={buyLoading === (g.symbol || g.name)}
                className="flex-1 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-xs font-bold hover:shadow-[0_0_15px_rgba(74,222,128,0.3)] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1"
              >
                <ShoppingCart size={12} />
                <span>
                  {buyLoading === (g.symbol || g.name)
                    ? "⏳..."
                    : `MUA $${gemVolume || 100}`}
                </span>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center py-12 text-brand-muted">
      <AlertCircle size={40} className="opacity-20 mb-3" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: any;
  color: string;
}) {
  return (
    <div className="bg-[#0B132B] rounded-lg p-3">
      <p className="text-[10px] text-brand-muted uppercase tracking-wider font-semibold">
        {label}
      </p>
      <p className={`text-xl font-extrabold ${color}`}>{value}</p>
    </div>
  );
}
