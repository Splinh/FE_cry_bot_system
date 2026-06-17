import { useState, useEffect } from "react";
import axios from "axios";
import { Copy, CheckCircle } from "lucide-react";
import Header from "../components/Header";

import { API } from "../config";

export default function WalletsPage({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const [wallets, setWallets] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [batchCount, setBatchCount] = useState(5);
  const [creating, setCreating] = useState(false);

  const fetchWallets = () => {
    axios
      .get(`${API}/api/wallets`)
      .then((r) => {
        setWallets(r.data.wallets || []);
        setSummary(r.data.summary || {});
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const copyAddr = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(addr);
    setTimeout(() => setCopied(null), 2000);
  };

  const createSingle = async () => {
    setCreating(true);
    try {
      await axios.post(`${API}/api/wallets/create`, {
        label: newLabel || "",
        count: 1,
      });
      setNewLabel("");
      fetchWallets();
    } catch {}
    setCreating(false);
  };

  const createBatch = async () => {
    setCreating(true);
    try {
      await axios.post(`${API}/api/wallets/create`, {
        label: "Airdrop",
        count: batchCount,
      });
      fetchWallets();
    } catch {}
    setCreating(false);
  };

  const exportAll = async () => {
    try {
      const r = await axios.get(`${API}/api/wallets/export`);
      navigator.clipboard.writeText(r.data.addresses);
      alert("📋 Đã copy danh sách địa chỉ vào clipboard!");
    } catch {}
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <Header title="Wallet Library" subtitle="EVM Multi-chain Wallets" onMenuToggle={onMenuToggle} />
      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniCard
            label="Total Wallets"
            value={summary.total_wallets ?? 0}
            color="text-brand-accent"
          />
          <MiniCard
            label="Active"
            value={summary.active_wallets ?? 0}
            color="text-green-400"
          />
          <MiniCard
            label="Inactive"
            value={summary.inactive_wallets ?? 0}
            color="text-brand-muted"
          />
          <MiniCard
            label="Total TXs"
            value={summary.total_transactions ?? 0}
            color="text-blue-400"
          />
        </div>

        {/* Create Wallet */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              ➕ Tạo Ví Mới
            </h3>
            <div className="space-y-3">
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Tên ví (VD: GameFi_1)"
                className="w-full bg-[#0B132B] border border-[#1C2541] rounded-lg px-4 py-2.5 text-white text-sm focus:border-brand-accent outline-none"
              />
              <button
                onClick={createSingle}
                disabled={creating}
                className="w-full py-3 bg-gradient-to-r from-brand-accent to-[#D49E20] text-brand-bg font-bold rounded-xl hover:shadow-[0_0_20px_rgba(243,186,47,0.3)] transition-all cursor-pointer disabled:opacity-50"
              >
                {creating ? "Đang tạo..." : "🔑 TẠO 1 VÍ"}
              </button>
            </div>
          </div>
          <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              📦 Tạo Hàng Loạt
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={batchCount}
                  onChange={(e) => setBatchCount(Number(e.target.value))}
                  className="w-24 bg-[#0B132B] border border-[#1C2541] rounded-lg px-4 py-2.5 text-white text-sm text-center focus:border-brand-accent outline-none"
                />
                <span className="text-brand-muted text-sm">ví (max 20)</span>
              </div>
              <button
                onClick={createBatch}
                disabled={creating}
                className="w-full py-3 bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8] text-white font-bold rounded-xl hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all cursor-pointer disabled:opacity-50"
              >
                {creating ? "Đang tạo..." : `🚀 TẠO ${batchCount} VÍ`}
              </button>
              <button
                onClick={exportAll}
                className="w-full py-2 border border-[#1C2541] text-brand-muted font-semibold rounded-lg hover:text-white hover:border-brand-accent transition-all cursor-pointer text-sm"
              >
                📋 Copy Tất Cả Địa Chỉ
              </button>
            </div>
          </div>
        </div>

        {/* Wallet List */}
        <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
            Danh Sách Ví ({wallets.length})
          </h3>
          <p className="text-xs text-brand-muted mb-4">
            🔒 Private keys mã hóa AES-256. Chỉ xem được qua Telegram + PIN.
          </p>
          {wallets.length === 0 ? (
            <p className="text-center text-brand-muted py-8">
              Chưa có ví nào. Nhấn "Tạo Ví" ở trên.
            </p>
          ) : (
            <div className="space-y-2">
              {wallets.map((w, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-[#0B132B] rounded-xl border border-[#1C2541] hover:border-brand-accent/40 transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-accent to-[#D49E20] flex items-center justify-center text-brand-bg font-bold text-xs">
                      {w.id || i + 1}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {w.label || `Wallet #${i + 1}`}
                      </p>
                      <p className="text-[11px] text-brand-muted font-mono">
                        {w.address}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] bg-[#1C2541] px-2 py-0.5 rounded text-brand-muted">
                      TX: {w.tx_count || 0}
                    </span>
                    {w.networks?.length > 0 && (
                      <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">
                        {w.networks.join(", ")}
                      </span>
                    )}
                    <button
                      onClick={() => copyAddr(w.address)}
                      className="p-1.5 rounded-lg hover:bg-[#1C2541] cursor-pointer"
                    >
                      {copied === w.address ? (
                        <CheckCircle size={14} className="text-green-400" />
                      ) : (
                        <Copy size={14} className="text-brand-muted" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniCard({
  label,
  value,
  color,
}: {
  label: string;
  value: any;
  color: string;
}) {
  return (
    <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-4">
      <p className="text-[10px] text-brand-muted uppercase tracking-wider font-semibold">
        {label}
      </p>
      <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
    </div>
  );
}
