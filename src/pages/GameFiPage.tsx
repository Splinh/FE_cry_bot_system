import { useState, useEffect } from "react";
import axios from "axios";
import {
  Gamepad2, Plus, Calculator, Trash2, Compass, TrendingUp,
  ExternalLink, Globe, ShoppingBag, Info,
  Zap, DollarSign, X, Play, Shield, Clock,
  Sparkles, CheckCircle2, Circle, Users, Bot, Coins, Award
} from "lucide-react";
import Header from "../components/Header";
import { API } from "../config";

export default function GameFiPage({ onMenuToggle }: { onMenuToggle?: () => void }) {
  // Tabs
  const [activeTab, setActiveTab] = useState<"frost" | "radar" | "scanner">("frost");
  
  // GameFi Radar State
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    name: "", symbol: "", chain: "ONEchain", token_price: 0, 
    nft_floor_price: 0, daily_roi_estimate: 0, onchain_users_24h: 0, note: ""
  });

  // Scanner State
  const [scannedTokens, setScannedTokens] = useState<any[]>([]);
  const [scannerLoading, setScannerLoading] = useState(false);

  // Detail panel
  const [selectedToken, setSelectedToken] = useState<any>(null);

  // ============================================
  // FROST KINGDOM STUDIO STATE
  // ============================================
  const [calcInput, setCalcInput] = useState({
    speedup_5m_units: 9620, // 5.95K + 3.67K
    speedup_1h_units: 165,  // 147 + 18
    speedup_8h_units: 11,
    shields_8h_units: 3,
    city_reloc_units: 5,
    rdia_amount: 33,
    diamonds_amount: 13300,
    chests_amount: 1177,    // 912 tím + 265 tech chest
    pass_cost_usd: 14.99,
    vnd_rate: 25400
  });

  const [calcResult, setCalcResult] = useState<any>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Frost Accounts
  const [frostAccounts, setFrostAccounts] = useState<any[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [accountForm, setAccountForm] = useState({
    name: "",
    server: "Server 4",
    wallet_address: "",
    castle_level: 1,
    has_pass: 0,
    pass_expiry: "",
    rdia_balance: 0,
    speedup_hours: 0,
    referral_code: "",
    referred_by: "",
    note: ""
  });

  // Checklist state (persisted locally)
  const [checkedMissions, setCheckedMissions] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("frost_missions_checklist");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleMission = (id: string) => {
    setCheckedMissions(prev => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem("frost_missions_checklist", JSON.stringify(next));
      return next;
    });
  };

  // API Calls
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

  const fetchFrostAccounts = async () => {
    setAccountsLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/gamefi/frost/accounts`);
      if (data.success) {
        setFrostAccounts(data.accounts || []);
      }
    } catch (e) {}
    setAccountsLoading(false);
  };

  const runCalculator = async () => {
    setCalcLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/gamefi/frost/calculator`, calcInput);
      if (data.success) {
        setCalcResult(data);
      }
    } catch (e) {}
    setCalcLoading(false);
  };

  useEffect(() => {
    fetchProjects();
    fetchFrostAccounts();
    runCalculator();
  }, []);

  const handleAddAccount = async (e: any) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/api/gamefi/frost/accounts`, accountForm);
      setShowAddAccount(false);
      setAccountForm({
        name: "", server: "Server 4", wallet_address: "",
        castle_level: 1, has_pass: 0, pass_expiry: "",
        rdia_balance: 0, speedup_hours: 0, referral_code: "", referred_by: "", note: ""
      });
      fetchFrostAccounts();
    } catch {}
  };

  const handleDeleteAccount = async (id: number) => {
    if (!confirm("Xóa tài khoản này khỏi danh sách theo dõi?")) return;
    try {
      await axios.delete(`${API}/api/gamefi/frost/accounts/${id}`);
      fetchFrostAccounts();
    } catch {}
  };

  const handleAdd = async (e: any) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/api/gamefi`, formData);
      setShowAdd(false);
      setFormData({ name: "", symbol: "", chain: "ONEchain", token_price: 0, nft_floor_price: 0, daily_roi_estimate: 0, onchain_users_24h: 0, note: "" });
      fetchProjects();
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa dự án này?")) return;
    try {
      await axios.delete(`${API}/api/gamefi/${id}`);
      fetchProjects();
    } catch {}
  };

  const handleImport = (token: any) => {
    setFormData({
      name: token.name,
      symbol: token.symbol,
      chain: token.chain || "ONEchain",
      token_price: token.price,
      nft_floor_price: token.nft_floor_price || 0,
      daily_roi_estimate: token.daily_roi_estimate || 0,
      onchain_users_24h: token.volume_24h > 1000 ? Math.round(token.volume_24h / 500) : 1000,
      note: token.note || `Quét từ CoinGecko (Hạng #${token.rank})`
    });
    setShowAdd(true);
    setActiveTab("radar");
  };

  const loadUserInventoryPreset = () => {
    setCalcInput({
      speedup_5m_units: 9620,
      speedup_1h_units: 165,
      speedup_8h_units: 11,
      shields_8h_units: 3,
      city_reloc_units: 5,
      rdia_amount: 33,
      diamonds_amount: 13300,
      chests_amount: 1177,
      pass_cost_usd: 14.99,
      vnd_rate: 25400
    });
    setTimeout(() => {
      runCalculator();
    }, 100);
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
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#070D1E]">
      <Header title="GameFi & NFT Hub" subtitle="Frost Kingdom S4 • Cross Ramp Mint • Multi-Account Farm" onMenuToggle={onMenuToggle} />
      
      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        
        {/* Main Tab Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1C2541] pb-4">
          <div className="flex items-center space-x-2 md:space-x-4">
            <button
              onClick={() => setActiveTab("frost")}
              className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "frost"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                  : "bg-brand-surface text-brand-muted hover:text-white border border-[#1C2541]"
              }`}
            >
              <Sparkles size={17} className={activeTab === "frost" ? "text-yellow-300 animate-pulse" : "text-cyan-400"} />
              <span>❄️ Frost Kingdom Studio</span>
              <span className="text-[10px] bg-red-500 text-white font-extrabold px-1.5 py-0.5 rounded-full uppercase ml-1 animate-pulse">S4 Live</span>
            </button>

            <button
              onClick={() => setActiveTab("radar")}
              className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "radar"
                  ? "bg-brand-accent text-black shadow-[0_0_15px_rgba(243,186,47,0.4)]"
                  : "bg-brand-surface text-brand-muted hover:text-white border border-[#1C2541]"
              }`}
            >
              <Gamepad2 size={17} /> <span>GameFi Radar</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("scanner");
                fetchScannedTokens();
              }}
              className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "scanner"
                  ? "bg-brand-accent text-black shadow-[0_0_15px_rgba(243,186,47,0.4)]"
                  : "bg-brand-surface text-brand-muted hover:text-white border border-[#1C2541]"
              }`}
            >
              <Compass size={17} /> <span>Top Scanner</span>
            </button>
          </div>
          
          {activeTab === "radar" && (
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-brand-accent text-black px-4 py-2 rounded-lg font-bold hover:shadow-[0_0_15px_rgba(243,186,47,0.4)] transition-all cursor-pointer">
              <Plus size={16} /> Thêm Game
            </button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: ❄️ FROST KINGDOM STUDIO (SERVER 4 COMMAND CENTER) */}
        {/* ========================================================================= */}
        {activeTab === "frost" && (
          <div className="space-y-6">
            
            {/* 1. Hero Status Banner */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#0D1B3E] via-[#0B132B] to-[#08182B] border border-cyan-500/30 rounded-2xl p-5 md:p-6 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Server 4 Event Active</span>
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-mono px-2 py-0.5 rounded border border-cyan-500/30">NEXUS • ONEchain</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
                    ❄️ Frost Kingdom Command Center
                  </h2>
                  <p className="text-brand-muted text-sm mt-1 max-w-2xl">
                    Hệ thống theo dõi đa tài khoản Server 4, máy tính quy đổi kho đồ ra tiền qua cổng <strong className="text-cyan-300">Cross Ramp</strong>, checklist nhiệm vụ <strong className="text-yellow-400">ONEquest</strong> và công cụ tự động hóa Humanized RPA.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <a href="https://games.onechain.nexus/frostkingdom" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all">
                    <Play size={14} /> <span>Vào Game (Web/PC)</span> <ExternalLink size={11} className="opacity-70" />
                  </a>
                  <a href="https://games.onechain.nexus/frostkingdom" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1C2541] hover:bg-[#253256] text-cyan-300 font-bold text-xs border border-cyan-500/20 transition-all">
                    <Coins size={14} /> <span>Cổng Cross Ramp</span> <ExternalLink size={11} className="opacity-70" />
                  </a>
                  <a href="https://onechain.nexus" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1C2541] hover:bg-[#253256] text-yellow-400 font-bold text-xs border border-yellow-500/20 transition-all">
                    <Award size={14} /> <span>ONEquest</span> <ExternalLink size={11} className="opacity-70" />
                  </a>
                </div>
              </div>

              {/* Fast Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-cyan-500/20">
                <div className="bg-[#070D1E]/80 rounded-xl p-3 border border-cyan-500/10">
                  <span className="text-[10px] text-brand-muted uppercase font-bold">Hard Cap $RDIA</span>
                  <p className="text-lg font-extrabold text-cyan-300">500.000 <span className="text-xs text-brand-muted">Token</span></p>
                </div>
                <div className="bg-[#070D1E]/80 rounded-xl p-3 border border-green-500/10">
                  <span className="text-[10px] text-brand-muted uppercase font-bold">Reward Pool Share</span>
                  <p className="text-lg font-extrabold text-green-400">5% <span className="text-xs text-brand-muted">Doanh thu game</span></p>
                </div>
                <div className="bg-[#070D1E]/80 rounded-xl p-3 border border-yellow-500/10">
                  <span className="text-[10px] text-brand-muted uppercase font-bold">Gói Mở Khóa Mint</span>
                  <p className="text-lg font-extrabold text-yellow-400">$14.99 <span className="text-xs text-brand-muted">/ tháng</span></p>
                </div>
                <div className="bg-[#070D1E]/80 rounded-xl p-3 border border-purple-500/10">
                  <span className="text-[10px] text-brand-muted uppercase font-bold">Quy Trình Rút Cash</span>
                  <p className="text-lg font-extrabold text-purple-400">3 Ví $\rightarrow$ Sàn P2P</p>
                </div>
              </div>
            </div>

            {/* 2. Interactive Cross Ramp & Mint Calculator */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Form: Inputs */}
              <div className="lg:col-span-6 bg-brand-surface border border-[#1C2541] rounded-2xl p-5 md:p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-[#1C2541] pb-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Calculator size={18} className="text-cyan-400" />
                    <span>Máy Tính Quy Đổi Kho Đồ (Cross Ramp)</span>
                  </h3>
                  <button
                    onClick={loadUserInventoryPreset}
                    className="text-xs bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles size={12} /> Nạp Kho Đồ Thực Tế
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-brand-muted font-bold block mb-1">⚡ Vé Tăng Tốc 5 Phút (Cái)</label>
                    <input
                      type="number"
                      value={calcInput.speedup_5m_units}
                      onChange={e => setCalcInput({...calcInput, speedup_5m_units: Number(e.target.value)})}
                      className="w-full bg-[#0B132B] border border-[#1C2541] text-white p-2.5 rounded-xl font-mono focus:border-cyan-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-brand-muted font-bold block mb-1">⚡ Vé Tăng Tốc 1 Giờ (Cái)</label>
                    <input
                      type="number"
                      value={calcInput.speedup_1h_units}
                      onChange={e => setCalcInput({...calcInput, speedup_1h_units: Number(e.target.value)})}
                      className="w-full bg-[#0B132B] border border-[#1C2541] text-white p-2.5 rounded-xl font-mono focus:border-cyan-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-brand-muted font-bold block mb-1">⚡ Vé Tăng Tốc 8 Giờ (Cái)</label>
                    <input
                      type="number"
                      value={calcInput.speedup_8h_units}
                      onChange={e => setCalcInput({...calcInput, speedup_8h_units: Number(e.target.value)})}
                      className="w-full bg-[#0B132B] border border-[#1C2541] text-white p-2.5 rounded-xl font-mono focus:border-cyan-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-brand-muted font-bold block mb-1">🛡️ Khiên Bảo Vệ 8h ($SHLD)</label>
                    <input
                      type="number"
                      value={calcInput.shields_8h_units}
                      onChange={e => setCalcInput({...calcInput, shields_8h_units: Number(e.target.value)})}
                      className="w-full bg-[#0B132B] border border-[#1C2541] text-white p-2.5 rounded-xl font-mono focus:border-cyan-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-brand-muted font-bold block mb-1">🏰 Dịch Chuyển Tím ($CITY)</label>
                    <input
                      type="number"
                      value={calcInput.city_reloc_units}
                      onChange={e => setCalcInput({...calcInput, city_reloc_units: Number(e.target.value)})}
                      className="w-full bg-[#0B132B] border border-[#1C2541] text-white p-2.5 rounded-xl font-mono focus:border-cyan-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-brand-muted font-bold block mb-1">💎 Kim Cương Đỏ ($RDIA)</label>
                    <input
                      type="number"
                      value={calcInput.rdia_amount}
                      onChange={e => setCalcInput({...calcInput, rdia_amount: Number(e.target.value)})}
                      className="w-full bg-[#0B132B] border border-[#1C2541] text-white p-2.5 rounded-xl font-mono focus:border-cyan-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-brand-muted font-bold block mb-1">🎁 Tổng Rương Tím + Tech</label>
                    <input
                      type="number"
                      value={calcInput.chests_amount}
                      onChange={e => setCalcInput({...calcInput, chests_amount: Number(e.target.value)})}
                      className="w-full bg-[#0B132B] border border-[#1C2541] text-white p-2.5 rounded-xl font-mono focus:border-cyan-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-brand-muted font-bold block mb-1">👑 Chi Phí Gói Imperial ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={calcInput.pass_cost_usd}
                      onChange={e => setCalcInput({...calcInput, pass_cost_usd: Number(e.target.value)})}
                      className="w-full bg-[#0B132B] border border-[#1C2541] text-white p-2.5 rounded-xl font-mono focus:border-cyan-400 outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={runCalculator}
                  disabled={calcLoading}
                  className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Calculator size={16} /> <span>{calcLoading ? "Đang Tính Toán..." : "Tính Lại Giá Trị & ROI"}</span>
                </button>
              </div>

              {/* Right Form: Results & Financials */}
              <div className="lg:col-span-6 bg-gradient-to-b from-brand-surface to-[#0B132B] border border-cyan-500/20 rounded-2xl p-5 md:p-6 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center border-b border-[#1C2541] pb-3 mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <DollarSign size={18} className="text-green-400" />
                      <span>Kết Quả Định Giá & Doanh Thu Ròng</span>
                    </h3>
                    {calcResult?.financials && (
                      <span className="text-xs font-extrabold bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full border border-green-500/30">
                        {calcResult.financials.recommendation}
                      </span>
                    )}
                  </div>

                  {calcResult ? (
                    <div className="space-y-4">
                      {/* Big numbers */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#070D1E] rounded-xl p-4 border border-[#1C2541]">
                          <span className="text-xs text-brand-muted uppercase font-bold">Tổng Giá Trị Kho Đồ</span>
                          <p className="text-2xl font-extrabold text-white mt-1">${calcResult.financials.total_gross_usd}</p>
                          <p className="text-xs text-cyan-400 font-mono mt-0.5">≈ {calcResult.financials.total_gross_vnd.toLocaleString()} VNĐ</p>
                        </div>
                        <div className="bg-[#070D1E] rounded-xl p-4 border border-green-500/30 bg-green-500/5">
                          <span className="text-xs text-green-400 uppercase font-bold">Lợi Nhuận Ròng (Net ROI)</span>
                          <p className="text-2xl font-extrabold text-green-400 mt-1">${calcResult.financials.net_profit_usd}</p>
                          <p className="text-xs text-green-300 font-mono mt-0.5">+{calcResult.financials.roi_pct}% (Sau khi trừ $14.99 pass)</p>
                        </div>
                      </div>

                      {/* Item Breakdown details */}
                      <div className="bg-[#070D1E] rounded-xl p-3.5 border border-[#1C2541] space-y-2.5 text-sm">
                        <div className="flex justify-between items-center text-xs pb-2 border-b border-[#1C2541]/50">
                          <span className="text-brand-muted flex items-center gap-1.5"><Clock size={13} className="text-yellow-400"/> Tổng Tăng Tốc ($SPDP)</span>
                          <span className="text-white font-mono font-bold">{calcResult.input_summary.total_speedup_hours} Giờ $\rightarrow$ <strong className="text-green-400">${calcResult.token_breakdown.spdp.usd_value}</strong></span>
                        </div>
                        <div className="flex justify-between items-center text-xs pb-2 border-b border-[#1C2541]/50">
                          <span className="text-brand-muted flex items-center gap-1.5"><Shield size={13} className="text-blue-400"/> Khiên & Dịch Chuyển ($SHLD/$CITY)</span>
                          <span className="text-white font-mono font-bold">${(calcResult.token_breakdown.shld.usd_value + calcResult.token_breakdown.city.usd_value).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs pb-2 border-b border-[#1C2541]/50">
                          <span className="text-brand-muted flex items-center gap-1.5"><Coins size={13} className="text-cyan-400"/> 33 $RDIA (Giá trị + Cổ tức/tháng)</span>
                          <span className="text-white font-mono font-bold">${calcResult.token_breakdown.rdia.usd_value} <span className="text-green-400">(+{calcResult.token_breakdown.rdia.est_monthly_dividend_oneusd} $ONEUSD/mo)</span></span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-brand-muted flex items-center gap-1.5"><Sparkles size={13} className="text-purple-400"/> Phôi Rương Ghép Trang Bị NFT</span>
                          <span className="text-white font-mono font-bold">${calcResult.token_breakdown.equipment_nfts.est_usd_value}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-brand-muted py-8">Đang tính toán...</div>
                  )}
                </div>

                <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-start gap-2.5">
                  <Info size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-brand-muted">
                    <strong className="text-white">Chiến lược đề xuất:</strong> Bạn đang có hơn <strong>1.000+ giờ tăng tốc</strong> và <strong>33 $RDIA</strong>. Khi mở gói <strong>Imperial Logistics Officer ($14.99)</strong>, bạn hoàn vốn ngay lập tức và thu về lợi nhuận gấp nhiều lần chi phí bỏ ra.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Multi-Account Farm Manager (3 Accounts) */}
            <div className="bg-brand-surface border border-[#1C2541] rounded-2xl p-5 md:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1C2541] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users size={18} className="text-purple-400" />
                    <span>Quản Lý Đa Tài Khoản (3 Accounts Farm)</span>
                  </h3>
                  <p className="text-xs text-brand-muted mt-0.5">
                    Quản lý độc lập 3 ví để đua sự kiện Server 4, tự ref chéo hoa hồng, và rút cash qua nhiều địa chỉ nạp an toàn.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddAccount(true)}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
                >
                  <Plus size={14} /> Thêm Tài Khoản
                </button>
              </div>

              {/* Add Account Modal Form */}
              {showAddAccount && (
                <form onSubmit={handleAddAccount} className="bg-[#0B132B] border border-purple-500/30 rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-bold text-white">Thêm Tài Khoản Mới</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input placeholder="Tên tài khoản (VD: S4_Main_1)" required value={accountForm.name} onChange={e=>setAccountForm({...accountForm, name: e.target.value})} className="bg-[#070D1E] border border-[#1C2541] text-white p-2 text-xs rounded-lg outline-none focus:border-purple-400" />
                    <input placeholder="Server (VD: Server 4)" value={accountForm.server} onChange={e=>setAccountForm({...accountForm, server: e.target.value})} className="bg-[#070D1E] border border-[#1C2541] text-white p-2 text-xs rounded-lg outline-none focus:border-purple-400" />
                    <input placeholder="Địa chỉ Ví Web3" value={accountForm.wallet_address} onChange={e=>setAccountForm({...accountForm, wallet_address: e.target.value})} className="bg-[#070D1E] border border-[#1C2541] text-white p-2 text-xs rounded-lg outline-none focus:border-purple-400" />
                    <input type="number" placeholder="Cấp Castle" value={accountForm.castle_level || ""} onChange={e=>setAccountForm({...accountForm, castle_level: Number(e.target.value)})} className="bg-[#070D1E] border border-[#1C2541] text-white p-2 text-xs rounded-lg outline-none focus:border-purple-400" />
                    <input type="number" placeholder="Số dư RDIA" value={accountForm.rdia_balance || ""} onChange={e=>setAccountForm({...accountForm, rdia_balance: Number(e.target.value)})} className="bg-[#070D1E] border border-[#1C2541] text-white p-2 text-xs rounded-lg outline-none focus:border-purple-400" />
                    <input placeholder="Mã Ref / Ghi chú" value={accountForm.note} onChange={e=>setAccountForm({...accountForm, note: e.target.value})} className="bg-[#070D1E] border border-[#1C2541] text-white p-2 text-xs rounded-lg outline-none focus:border-purple-400" />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowAddAccount(false)} className="px-4 py-1.5 text-xs text-brand-muted hover:text-white">Hủy</button>
                    <button type="submit" className="px-5 py-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg">Lưu</button>
                  </div>
                </form>
              )}

              {/* Account Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#1C2541] text-brand-muted uppercase font-bold bg-[#0B132B]">
                      <th className="py-3 px-3">Tài Khoản</th>
                      <th className="py-3 px-3">Server</th>
                      <th className="py-3 px-3">Castle Lv</th>
                      <th className="py-3 px-3">Gói Mint</th>
                      <th className="py-3 px-3">Số Dư $RDIA</th>
                      <th className="py-3 px-3">Địa Chỉ Ví Web3</th>
                      <th className="py-3 px-3">Ghi Chú</th>
                      <th className="py-3 px-3 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C2541]/40">
                    {accountsLoading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-6 text-brand-muted">
                          Đang tải danh sách tài khoản...
                        </td>
                      </tr>
                    ) : frostAccounts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-6 text-brand-muted">
                          Chưa có tài khoản nào được lưu. Bạn có thể bấm "Thêm Tài Khoản" để quản lý 3 tài khoản S1, S4-Main, S4-Clone!
                        </td>
                      </tr>
                    ) : (
                      frostAccounts.map(acc => (
                        <tr key={acc.id} className="hover:bg-[#1C2541]/20 transition-colors">
                          <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-400"></span>
                            {acc.name}
                          </td>
                          <td className="py-3 px-3 text-cyan-300 font-mono font-bold">{acc.server}</td>
                          <td className="py-3 px-3 font-bold text-yellow-400 font-mono">Lv.{acc.castle_level}</td>
                          <td className="py-3 px-3">
                            {acc.has_pass ? (
                              <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-bold">Active</span>
                            ) : (
                              <span className="bg-brand-muted/20 text-brand-muted px-2 py-0.5 rounded">Chưa mở</span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-bold text-white font-mono">{acc.rdia_balance} RDIA</td>
                          <td className="py-3 px-3 font-mono text-brand-muted truncate max-w-[140px]">{acc.wallet_address || "Chưa gắn ví"}</td>
                          <td className="py-3 px-3 text-brand-muted">{acc.note || "—"}</td>
                          <td className="py-3 px-3 text-center">
                            <button onClick={() => handleDeleteAccount(acc.id)} className="text-brand-muted hover:text-red-400 p-1 cursor-pointer">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Server 4 Missions & ONEquest Checklist + Bot Assistant Info */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Checklist */}
              <div className="lg:col-span-7 bg-brand-surface border border-[#1C2541] rounded-2xl p-5 md:p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-[#1C2541] pb-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Award size={18} className="text-yellow-400" />
                    <span>Checklist Nhiệm Vụ ONEquest Server 4</span>
                  </h3>
                  <span className="text-xs text-brand-muted">Đổi trực tiếp ra $ONE</span>
                </div>

                <div className="space-y-2.5">
                  {[
                    { id: "m1", title: "Kết nối ví Web3 & Tạo nhân vật Server 4", reward: "+50 $ONE", tag: "Onboarding" },
                    { id: "m2", title: "Nâng cấp Lâu Đài đạt mốc Castle Lv.5", reward: "+50 $ONE + Gói Tăng Tốc", tag: "Progression" },
                    { id: "m3", title: "Nâng cấp Lâu Đài đạt mốc Castle Lv.10 (Mở khóa Mint)", reward: "+150 $ONE + 5 Vé SSR", tag: "Hot Milestone" },
                    { id: "m4", title: "Gia nhập Top Alliance & Cống hiến 5 lần hàng ngày", reward: "+40 $ONE", tag: "Alliance" },
                    { id: "m5", title: "Tự Ref / Giới thiệu bạn bè qua link Referral S1", reward: "20% hoa hồng $ONE", tag: "Referral Loop" },
                    { id: "m6", title: "Đạt mốc Lực Chiến (Battle Power) 100K trong tuần đầu", reward: "+350 $ONE", tag: "Leaderboard" }
                  ].map(m => {
                    const isChecked = !!checkedMissions[m.id];
                    return (
                      <div
                        key={m.id}
                        onClick={() => toggleMission(m.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? "bg-green-500/5 border-green-500/30 text-white"
                            : "bg-[#0B132B] border-[#1C2541] text-brand-muted hover:border-brand-accent/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isChecked ? (
                            <CheckCircle2 size={18} className="text-green-400 shrink-0" />
                          ) : (
                            <Circle size={18} className="text-brand-muted shrink-0" />
                          )}
                          <div>
                            <p className={`text-xs font-bold ${isChecked ? "line-through text-brand-muted" : "text-white"}`}>
                              {m.title}
                            </p>
                            <span className="text-[10px] text-cyan-400 font-mono">{m.tag}</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold font-mono text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                          {m.reward}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bot Assistant Guide */}
              <div className="lg:col-span-5 bg-gradient-to-br from-[#0B132B] to-brand-surface border border-cyan-500/20 rounded-2xl p-5 md:p-6 space-y-4">
                <div className="border-b border-[#1C2541] pb-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Bot size={18} className="text-cyan-400" />
                    <span>Frost Kingdom RPA Assistant</span>
                  </h3>
                  <p className="text-xs text-brand-muted mt-0.5">Công cụ tự động hóa chạy máy cục bộ (Anti-ban)</p>
                </div>

                <div className="space-y-3 text-xs text-brand-muted">
                  <div className="bg-[#070D1E] rounded-xl p-3 border border-[#1C2541] space-y-1.5 font-mono">
                    <p className="text-cyan-300 font-bold"># Khởi chạy tool từ Terminal:</p>
                    <p className="text-white bg-[#0B132B] p-2 rounded border border-[#1C2541]">
                      cd tools/frost_assistant && python frost_assistant.py
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px]">1</span>
                      <span className="text-white">Bấm phím <strong>1, 2, 3</strong>: Chụp mẫu nút Xây nhà, Quest, Merge lính.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px]">2</span>
                      <span className="text-white">Bấm phím <strong>6</strong>: Test Dry-Run chụp ảnh kiểm tra vị trí nút.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px]">3</span>
                      <span className="text-white">Bấm phím <strong>7</strong>: Bắt đầu cày tự động 24/7.</span>
                    </div>
                  </div>

                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-300">
                    <strong>Dừng khẩn cấp:</strong> Đẩy mạnh con trỏ chuột về <strong>Góc Trên-Trái</strong> màn hình (Failsafe).
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: GAMEFI RADAR (ORIGINAL RADAR) */}
        {/* ========================================================================= */}
        {activeTab === "radar" && (
          <div>
            {/* Modal Add Form */}
            {showAdd && (
              <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-6 mb-6">
                <h3 className="text-white font-bold mb-4 text-lg">Thêm Dự Án Mới</h3>
                <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input placeholder="Tên Game" required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="bg-[#0B132B] border border-[#1C2541] text-white p-2.5 rounded-lg focus:border-brand-accent outline-none" />
                  <input placeholder="Symbol (VD: RDIA / AXS)" required value={formData.symbol} onChange={e=>setFormData({...formData, symbol: e.target.value})} className="bg-[#0B132B] border border-[#1C2541] text-white p-2.5 rounded-lg focus:border-brand-accent outline-none" />
                  <input placeholder="Chain (VD: ONEchain)" value={formData.chain} onChange={e=>setFormData({...formData, chain: e.target.value})} className="bg-[#0B132B] border border-[#1C2541] text-white p-2.5 rounded-lg focus:border-brand-accent outline-none" />
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

            {loading ? (
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
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SCANNER TAB */}
        {/* ========================================================================= */}
        {activeTab === "scanner" && (
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
