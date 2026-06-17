import { useState, useEffect } from "react";
import axios from "axios";
import { Gamepad2, Plus, Calculator, Trash2 } from "lucide-react";
import Header from "../components/Header";
import { API } from "../config";

export default function GameFiPage({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
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

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <Header title="GameFi & NFT Data" subtitle="Tracking & ROI Analytics" onMenuToggle={onMenuToggle} />
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Gamepad2 className="text-brand-accent" /> GameFi Radar
          </h2>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-brand-accent text-black px-4 py-2 rounded-lg font-bold hover:shadow-[0_0_15px_rgba(243,186,47,0.4)] transition-all cursor-pointer">
            <Plus size={16} /> Thêm Game
          </button>
        </div>

        {showAdd && (
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
               return (
                <div key={p.id} className="bg-brand-surface border border-[#1C2541] rounded-xl p-5 hover:border-brand-accent/30 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white leading-tight">{p.name}</h3>
                      <p className="text-brand-accent text-sm font-bold">${p.symbol} <span className="text-brand-muted text-[10px] ml-1 px-1.5 py-0.5 rounded bg-[#1C2541] uppercase">{p.chain}</span></p>
                    </div>
                    <button onClick={() => handleDelete(p.id)} className="text-brand-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
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
    </div>
  );
}
