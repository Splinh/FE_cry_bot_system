import { useState, useEffect } from "react";
import axios from "axios";
import {
  Gamepad2, Plus, Calculator, Trash2, Compass, TrendingUp,
  ExternalLink, Globe, ShoppingBag, Info, ChevronDown, ChevronUp,
  Shield, Zap, DollarSign, Users, X, Play,
} from "lucide-react";
import Header from "../components/Header";
import { API } from "../config";

export default function GameFiPage({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Tabs state
  const [activeTab, setActiveTab] = useState<"radar" | "scanner">("radar");
  const [scannedTokens, setScannedTokens] = useState<any[]>([]);
  const [scannerLoading, setScannerLoading] = useState(false);

  // Detail panel
  const [selectedToken, setSelectedToken] = useState<any>(null);

  // Modal state
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    name: "", symbol: "", chain: "SOL", token_price: 0, 
    nft_floor_price: 0, daily_roi_estimate: 0, onchain_users_24h: 0, note: ""
  });

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/gamefi`);
      setProjects(data.projects || []);
    } catch (e) {}
    setLoading(false);
  };

  const fetchScannedTokens = async () => {
    setScannerLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/gamefi/scan`);
      if (data.success) {
        setScannedTokens(data.tokens || []);
      }
    } catch (e) {}
    setScannerLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleAdd = async (e: any) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/api/gamefi`, formData);
      setShowAdd(false);
      setFormData({name: "", symbol: "", chain: "SOL", token_price: 0, nft_floor_price: 0, daily_roi_estimate: 0, onchain_users_24h: 0, note: ""});
      fetchProjects();
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if(!confirm("Xóa dự án này?")) return;
    try {
      await axios.delete(`${API}/api/gamefi/${id}`);
      fetchProjects();
    } catch {}
  };

  const handleImport = (token: any) => {
    setFormData({
      name: token.name,
      symbol: token.symbol,
      chain: token.chain || "SOL",
      token_price: token.price,
      nft_floor_price: token.nft_floor_price || 0,
      daily_roi_estimate: token.daily_roi_estimate || 0,
      onchain_users_24h: token.volume_24h > 1000 ? Math.round(token.volume_24h / 500) : 1000,
      note: token.note || `Quét từ CoinGecko (Hạng #${token.rank})`
    });
    setShowAdd(true);
    setActiveTab("radar");
  };

  const riskColor = (level: string) => {
    if (level === "LOW") return "bg-green-500/15 text-green-400";
    if (level === "MEDIUM") return "bg-yellow-500/15 text-yellow-400";
    return "bg-red-500/15 text-red-400";
  };

  const statusColor = (s: string) => {
    if (s === "active") return "bg-green-500/15 text-green-400";
    if (s === "beta") return "bg-blue-500/15 text-blue-400";
    return "bg-brand-muted/15 text-brand-muted";
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <Header title="GameFi & NFT Data" subtitle="Tracking & ROI Analytics" onMenuToggle={onMenuToggle} />
      <div className="flex-1 overflow-auto p-4 md:p-6">
        
        {/* Tab Selection */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-[#1C2541] pb-4">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => setActiveTab("radar")}
              className={`text-lg font-bold flex items-center gap-2 pb-2 transition-all cursor-pointer border-b-2 ${
                activeTab === "radar"
                  ? "text-white border-brand-accent"
                  : "text-brand-muted border-transparent hover:text-white"
              }`}
            >
              <Gamepad2 size={18} className={activeTab === "radar" ? "text-brand-accent" : ""} /> GameFi Radar
            </button>
            <button
              onClick={() => {
                setActiveTab("scanner");
                fetchScannedTokens();
              }}
              className={`text-lg font-bold flex items-center gap-2 pb-2 transition-all cursor-pointer border-b-2 ${
                activeTab === "scanner"
                  ? "text-white border-brand-accent"
                  : "text-brand-muted border-transparent hover:text-white"
              }`}
            >
              <Compass size={18} className={activeTab === "scanner" ? "text-brand-accent" : ""} /> Bộ Quét GameFi (Scanner)
            </button>
          </div>
          
          {activeTab === "radar" && (
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-brand-accent text-black px-4 py-2 rounded-lg font-bold hover:shadow-[0_0_15px_rgba(243,186,47,0.4)] transition-all cursor-pointer self-start sm:self-auto">
              <Plus size={16} /> Thêm Game
            </button>
          )}
        </div>

        {/* Modal Add Form */}
        {showAdd && activeTab === "radar" && (
          <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-6 mb-6">
            <h3 className="text-white font-bold mb-4 text-lg">Thêm Dự Án Mới</h3>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="Tên Game" required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="bg-[#0B132B] border border-[#1C2541] text-white p-2.5 rounded-lg focus:border-brand-accent outline-none" />
              <input placeholder="Symbol (VD: AXS)" required value={formData.symbol} onChange={e=>setFormData({...formData, symbol: e.target.value})} className="bg-[#0B132B] border border-[#1C2541] text-white p-2.5 rounded-lg focus:border-brand-accent outline-none" />
              <input placeholder="Chain" value={formData.chain} onChange={e=>setFormData({...formData, chain: e.target.value})} className="bg-[#0B132B] border border-[#1C2541] text-white p-2.5 rounded-lg focus:border-brand-accent outline-none" />
              <input type="number" step="0.00001" placeholder="Token Price ($)" value={formData.token_price || ""} onChange={e=>setFormData({...formData, token_price: Number(e.target.value)})} className="bg-[#0B132B] border border-[#1C2541] text-white p-2.5 rounded-lg focus:border-brand-accent outline-none" />
              <input type="number" step="0.01" placeholder="NFT Floor Price ($)" value={formData.nft_floor_price || ""} onChange={e=>setFormData({...formData, nft_floor_price: Number(e.target.value)})} className="bg-[#0B132B] border border-[#1C2541] text-white p-2.5 rounded-lg focus:border-brand-accent outline-none" />
              <input type="number" step="0.1" placeholder="Daily ROI ($)" value={formData.daily_roi_estimate || ""} onChange={e=>setFormData({...formData, daily_roi_estimate: Number(e.target.value)})} className="bg-[#0B132B] border border-[#1C2541] text-white p-2.5 rounded-lg focus:border-brand-accent outline-none" />
              <input type="number" placeholder="Users 24h" value={formData.onchain_users_24h || ""} onChange={e=>setFormData({...formData, onchain_users_24h: Number(e.target.value)})} className="bg-[#0B132B] border border-[#1C2541] text-white p-2.5 rounded-lg focus:border-brand-accent outline-none" />
              <input placeholder="Ghi chú" value={formData.note} onChange={e=>setFormData({...formData, note: e.target.value})} className="bg-[#0B132B] border border-[#1C2541] text-white p-2.5 rounded-lg focus:border-brand-accent outline-none" />
              
              <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-2.5 text-brand-muted hover:text-white cursor-pointer transition-colors">Hủy</button>
                <button type="submit" className="bg-brand-accent text-black px-6 py-2.5 rounded-lg font-bold hover:bg-[#E5B02C] cursor-pointer transition-colors">Lưu Dự Án</button>
              </div>
            </form>
          </div>
        )}

        {/* Tab Contents */}
        {activeTab === "radar" ? (
          loading ? (
            <div className="text-center text-brand-muted py-10">Đang tải dữ liệu...</div>
          ) : projects.length === 0 ? (
            <div className="text-center text-brand-muted py-10 bg-brand-surface rounded-xl border border-[#1C2541]">
              Chưa có dự án GameFi nào. Hãy thêm dự án đầu tiên!
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map(p => {
                 const daysToRoi = p.daily_roi_estimate > 0 && p.nft_floor_price > 0 ? (p.nft_floor_price / p.daily_roi_estimate).toFixed(0) : "N/A";
                 const isSelected = selectedToken?.symbol === p.symbol;
                 return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedToken(isSelected ? null : p)}
                    className={`bg-brand-surface border rounded-xl p-5 transition-all group cursor-pointer ${
                      isSelected
                        ? "border-brand-accent ring-2 ring-brand-accent/30 bg-brand-accent/5 shadow-[0_0_20px_rgba(243,186,47,0.08)]"
                        : "border-[#1C2541] hover:border-brand-accent/30 hover:shadow-[0_0_15px_rgba(243,186,47,0.05)]"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white leading-tight flex items-center gap-2">
                          {p.name}
                          {isSelected && <span className="text-[10px] bg-brand-accent text-black font-extrabold px-1.5 py-0.5 rounded uppercase">Đang Xem</span>}
                        </h3>
                        <p className="text-brand-accent text-sm font-bold">${p.symbol} <span className="text-brand-muted text-[10px] ml-1 px-1.5 py-0.5 rounded bg-[#1C2541] uppercase">{p.chain}</span></p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(p.id);
                        }}
                        className="text-brand-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1"
                        title="Xóa dự án"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                    
                    <div className="space-y-2.5 mb-5 px-1">
                      <div className="flex justify-between items-center text-sm border-b border-[#1C2541]/50 pb-2"><span className="text-[#8AA2CA]">Token Price</span><span className="text-white font-mono">${p.token_price}</span></div>
                      <div className="flex justify-between items-center text-sm border-b border-[#1C2541]/50 pb-2"><span className="text-[#8AA2CA]">NFT Floor</span><span className="text-white font-mono">${p.nft_floor_price}</span></div>
                      <div className="flex justify-between items-center text-sm"><span className="text-[#8AA2CA]">UAW (24h)</span><span className="text-white font-mono">{p.onchain_users_24h.toLocaleString()}</span></div>
                    </div>

                    <div className="bg-[#0B132B] rounded-lg p-3.5 border border-green-500/10 shadow-[inset_0_0_10px_rgba(74,222,128,0.02)]">
                      <div className="flex items-center gap-2 text-green-400 font-bold mb-2 text-sm">
                        <Calculator size={14}/> <span>ROI Estimate</span>
                      </div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-brand-muted">Daily Profit:</span>
                        <span className="text-green-400 font-bold">${p.daily_roi_estimate}/day</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-brand-muted">Breakeven:</span>
                        <span className="text-yellow-400 font-bold">{daysToRoi} days</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Scanner Tab */
          <div className="space-y-4">
            {scannerLoading ? (
              <div className="text-center text-brand-muted py-10">⏳ Đang quét dữ liệu GameFi thời gian thực...</div>
            ) : scannedTokens.length === 0 ? (
              <div className="text-center text-brand-muted py-10 bg-brand-surface rounded-xl border border-[#1C2541]">
                Không tìm thấy token GameFi nào hoặc lỗi kết nối. Vui lòng thử lại sau.
              </div>
            ) : (
              <div className="bg-brand-surface border border-[#1C2541] rounded-xl overflow-hidden shadow-lg">
                <div className="p-4 bg-[#0B132B] border-b border-[#1C2541] flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-brand-accent" /> TOP GAMEFI & P2E TOKENS
                  </h3>
                  <button onClick={fetchScannedTokens} className="text-xs text-brand-accent hover:underline cursor-pointer">
                    🔄 Làm mới
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1C2541] text-[10px] text-brand-muted uppercase font-bold bg-[#0B132B]/50">
                        <th className="py-3 px-4 w-12 text-center">Hạng</th>
                        <th className="py-3 px-4">Token / Dự Án</th>
                        <th className="py-3 px-4 text-right">Giá</th>
                        <th className="py-3 px-4 text-right">24h</th>
                        <th className="py-3 px-4 hidden md:table-cell">Thể Loại</th>
                        <th className="py-3 px-4 hidden lg:table-cell">Cách Earn</th>
                        <th className="py-3 px-4 text-center">Hành Động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1C2541]/40 text-sm">
                      {scannedTokens.map((t) => (
                        <tr key={t.symbol} className={`hover:bg-[#1C2541]/20 transition-colors cursor-pointer ${selectedToken?.symbol === t.symbol ? "bg-brand-accent/5 border-l-2 border-l-brand-accent" : ""}`}
                            onClick={() => setSelectedToken(selectedToken?.symbol === t.symbol ? null : t)}>
                          <td className="py-3.5 px-4 text-center font-mono text-brand-muted font-bold">
                            #{t.rank}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {t.image ? (
                                <img src={t.image} alt={t.name} className="w-7 h-7 rounded-full" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent text-xs font-bold font-mono">
                                  {t.symbol.slice(0, 2)}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-white flex items-center gap-2">
                                  {t.name}
                                  {t.status && (
                                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${statusColor(t.status)}`}>
                                      {t.status}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-brand-accent text-xs font-mono font-bold">{t.symbol}</span>
                                  {t.chain && t.chain !== "Unknown" && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1C2541] text-brand-muted">{t.chain}</span>
                                  )}
                                  {t.risk_level && (
                                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${riskColor(t.risk_level)}`}>
                                      {t.risk_level === "LOW" ? "🟢" : t.risk_level === "MEDIUM" ? "🟡" : "🔴"} {t.risk_level}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                            ${t.price >= 1 ? t.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4}) : t.price.toFixed(6)}
                          </td>
                          <td className={`py-3.5 px-4 text-right font-mono font-bold ${t.price_change_24h > 0 ? "text-green-400" : t.price_change_24h < 0 ? "text-red-400" : "text-white"}`}>
                            {t.price_change_24h > 0 ? "+" : ""}{t.price_change_24h.toFixed(2)}%
                          </td>
                          <td className="py-3.5 px-4 hidden md:table-cell">
                            <span className="text-xs text-brand-muted">{t.category || "—"}</span>
                          </td>
                          <td className="py-3.5 px-4 hidden lg:table-cell">
                            <span className="text-xs text-brand-muted truncate block max-w-[180px]">{t.earn_model || "—"}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1.5 justify-center">
                              <button
                                onClick={() => setSelectedToken(selectedToken?.symbol === t.symbol ? null : t)}
                                className="text-xs bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                                title="Xem chi tiết"
                              >
                                <Info size={12} />
                              </button>
                              <button
                                onClick={() => handleImport(t)}
                                className="text-xs bg-brand-accent/10 hover:bg-brand-accent hover:text-black border border-brand-accent/30 text-brand-accent font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                                title="Thêm vào Radar"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
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

        {/* ===== DETAIL PANEL ===== */}
        {selectedToken && (
          <div className="bg-brand-surface border border-brand-accent/20 rounded-xl p-5 shadow-[0_0_30px_rgba(243,186,47,0.05)] animate-in mt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {selectedToken.image ? (
                  <img src={selectedToken.image} alt={selectedToken.name} className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent font-bold">
                    {selectedToken.symbol.slice(0, 2)}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedToken.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-brand-accent font-mono font-bold text-sm">${selectedToken.symbol}</span>
                    {selectedToken.chain && selectedToken.chain !== "Unknown" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1C2541] text-brand-muted">{selectedToken.chain}</span>
                    )}
                    {selectedToken.category && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">{selectedToken.category}</span>
                    )}
                    {selectedToken.status && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${statusColor(selectedToken.status)}`}>
                        {selectedToken.status}
                      </span>
                    )}
                    {selectedToken.risk_level && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${riskColor(selectedToken.risk_level)}`}>
                        Risk: {selectedToken.risk_level}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedToken(null)} className="text-brand-muted hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Description */}
            {selectedToken.note && (
              <p className="text-sm text-brand-muted mb-4 pl-1">{selectedToken.note}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Quick Links */}
              <div className="bg-[#0B132B] rounded-xl p-4 border border-[#1C2541]">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Globe size={12} className="text-blue-400" /> Link Truy Cập
                </h4>
                <div className="space-y-2">
                  {selectedToken.play_url ? (
                    <a href={selectedToken.play_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors">
                      <Play size={13} className="shrink-0" />
                      <span className="font-bold">🎮 Chơi Ngay</span>
                      <ExternalLink size={10} className="ml-auto shrink-0 opacity-50" />
                    </a>
                  ) : (
                    <span className="text-xs text-brand-muted">🎮 Chưa có link chơi</span>
                  )}
                  {selectedToken.website && (
                    <a href={selectedToken.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                      <Globe size={13} className="shrink-0" />
                      <span>Website</span>
                      <ExternalLink size={10} className="ml-auto shrink-0 opacity-50" />
                    </a>
                  )}
                  {selectedToken.marketplace_url && (
                    <a href={selectedToken.marketplace_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors">
                      <ShoppingBag size={13} className="shrink-0" />
                      <span>Marketplace / NFT</span>
                      <ExternalLink size={10} className="ml-auto shrink-0 opacity-50" />
                    </a>
                  )}
                </div>
                {/* Platform */}
                {selectedToken.platform?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#1C2541]">
                    <span className="text-[10px] text-brand-muted uppercase font-bold">Platform:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedToken.platform.map((p: string, i: number) => (
                        <span key={i} className="text-[9px] px-2 py-0.5 rounded bg-[#1C2541] text-brand-muted">{p}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* How to Earn */}
              <div className="bg-[#0B132B] rounded-xl p-4 border border-green-500/10 lg:col-span-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <DollarSign size={12} className="text-green-400" /> Cách Kiếm Tiền
                </h4>
                {selectedToken.earn_model && (
                  <div className="mb-3">
                    <span className="text-[10px] text-brand-muted uppercase font-bold">Mô hình: </span>
                    <span className="text-sm text-brand-accent font-bold">{selectedToken.earn_model}</span>
                  </div>
                )}
                {selectedToken.how_to_earn?.length > 0 ? (
                  <ol className="space-y-1.5">
                    {selectedToken.how_to_earn.map((step: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-brand-muted">
                        <span className="text-brand-accent font-bold shrink-0 w-5 text-center">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-brand-muted">Chưa có hướng dẫn chi tiết</p>
                )}
              </div>
            </div>

            {/* ROI + Investment Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#0B132B] rounded-lg p-3 border border-[#1C2541] text-center">
                <p className="text-[10px] text-brand-muted uppercase font-bold">Token Price</p>
                <p className="text-lg font-extrabold text-white">
                  ${selectedToken.price >= 1 ? selectedToken.price.toLocaleString(undefined, {maximumFractionDigits: 4}) : selectedToken.price.toFixed(6)}
                </p>
              </div>
              <div className="bg-[#0B132B] rounded-lg p-3 border border-green-500/10 text-center">
                <p className="text-[10px] text-brand-muted uppercase font-bold">Daily ROI</p>
                <p className="text-lg font-extrabold text-green-400">${selectedToken.daily_roi_estimate}/day</p>
              </div>
              <div className="bg-[#0B132B] rounded-lg p-3 border border-yellow-500/10 text-center">
                <p className="text-[10px] text-brand-muted uppercase font-bold">NFT Floor</p>
                <p className="text-lg font-extrabold text-yellow-400">${selectedToken.nft_floor_price}</p>
              </div>
              <div className="bg-[#0B132B] rounded-lg p-3 border border-blue-500/10 text-center">
                <p className="text-[10px] text-brand-muted uppercase font-bold">Hòa Vốn</p>
                <p className="text-lg font-extrabold text-blue-400">
                  {selectedToken.daily_roi_estimate > 0 && selectedToken.nft_floor_price > 0
                    ? `${(selectedToken.nft_floor_price / selectedToken.daily_roi_estimate).toFixed(0)} ngày`
                    : "N/A"}
                </p>
              </div>
            </div>

            {/* Min investment */}
            {selectedToken.min_investment && (
              <div className="mt-3 flex items-center gap-2 text-xs text-brand-muted bg-[#0B132B] rounded-lg px-4 py-2.5 border border-[#1C2541]">
                <Zap size={12} className="text-brand-accent shrink-0" />
                <span className="font-bold text-white">Vốn tối thiểu:</span>
                <span>{selectedToken.min_investment}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => handleImport(selectedToken)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-brand-accent to-[#D49E20] text-black hover:shadow-[0_0_20px_rgba(243,186,47,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Calculator size={14} /> Tính ROI & Thêm Radar
              </button>
              {selectedToken.play_url && (
                <a href={selectedToken.play_url} target="_blank" rel="noopener noreferrer"
                  className="px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-[0_0_20px_rgba(74,222,128,0.3)] transition-all flex items-center gap-2"
                >
                  <Play size={14} /> Chơi Ngay
                </a>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
