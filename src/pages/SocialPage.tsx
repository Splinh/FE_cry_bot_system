import { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";

import { API } from "../config";

export default function SocialPage({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const [social, setSocial] = useState<any>(null);
  const [claimBot, setClaimBot] = useState("blumcrypto_bot");
  const [claimCmd, setClaimCmd] = useState("/start");
  const [tweetId, setTweetId] = useState("");
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const r = await axios.get(`${API}/api/social`);
        setSocial(r.data);
      } catch {}
    };
    fetch();
    const iv = setInterval(fetch, 5000);
    return () => clearInterval(iv);
  }, []);

  const addLog = (msg: string) =>
    setLog((prev) =>
      [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 20),
    );

  const handleClaim = async () => {
    try {
      const r = await axios.post(`${API}/api/social/claimall`, {
        bot_username: claimBot,
        command: claimCmd,
      });
      addLog(`✅ Mass Claim gửi thành công (${r.data.bots} bots)`);
    } catch (e: any) {
      addLog(`❌ Lỗi: ${e.response?.data?.detail || "Network error"}`);
    }
  };

  const handleRaid = async () => {
    if (!tweetId) return;
    try {
      const r = await axios.post(`${API}/api/social/raid`, {
        tweet_id: tweetId,
      });
      addLog(`🔥 X-Raid đã kích hoạt (${r.data.accounts} accounts)`);
    } catch (e: any) {
      addLog(`❌ Lỗi Raid: ${e.response?.data?.detail || "Network error"}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <Header
        title="Social Airdrop Automation"
        subtitle="Botnet Control Center"
        onMenuToggle={onMenuToggle}
      />
      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusCard
            label="Telegram Sessions"
            value={social?.telegram_workers_count ?? 0}
            color="text-blue-400"
          />
          <StatusCard
            label="Twitter Accounts"
            value={social?.twitter_workers_count ?? 0}
            color="text-sky-400"
          />
          <StatusCard
            label="Network"
            value={social?.is_active ? "ACTIVE" : "IDLE"}
            color={social?.is_active ? "text-green-400" : "text-brand-muted"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Telegram Mass Claim */}
          <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              📲 Telegram Mass Claim
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-brand-muted uppercase font-semibold block mb-1">
                  Bot Username
                </label>
                <input
                  value={claimBot}
                  onChange={(e) => setClaimBot(e.target.value)}
                  className="w-full bg-[#0B132B] border border-[#1C2541] rounded-lg px-4 py-2.5 text-white text-sm focus:border-brand-accent outline-none transition-colors"
                  placeholder="blumcrypto_bot"
                />
              </div>
              <div>
                <label className="text-xs text-brand-muted uppercase font-semibold block mb-1">
                  Command
                </label>
                <input
                  value={claimCmd}
                  onChange={(e) => setClaimCmd(e.target.value)}
                  className="w-full bg-[#0B132B] border border-[#1C2541] rounded-lg px-4 py-2.5 text-white text-sm focus:border-brand-accent outline-none transition-colors"
                  placeholder="/start"
                />
              </div>
              <button
                onClick={handleClaim}
                className="w-full py-3 bg-gradient-to-r from-brand-accent to-[#D49E20] text-brand-bg font-bold rounded-xl hover:shadow-[0_0_20px_rgba(243,186,47,0.3)] transition-all cursor-pointer"
              >
                🚀 MASS CLAIM NOW
              </button>
            </div>
          </div>

          {/* Twitter X-Raid */}
          <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              🐦 Twitter X-Raid
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-brand-muted uppercase font-semibold block mb-1">
                  Tweet ID
                </label>
                <input
                  value={tweetId}
                  onChange={(e) => setTweetId(e.target.value)}
                  className="w-full bg-[#0B132B] border border-[#1C2541] rounded-lg px-4 py-2.5 text-white text-sm focus:border-brand-accent outline-none transition-colors"
                  placeholder="1234567890123456789"
                />
              </div>
              <p className="text-xs text-brand-muted">
                Tất cả tài khoản Twitter sẽ đồng loạt Like + Retweet bài viết
                này.
              </p>
              <button
                onClick={handleRaid}
                className="w-full py-3 bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8] text-white font-bold rounded-xl hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all cursor-pointer"
              >
                🔥 X-RAID LAUNCH
              </button>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
            📋 Activity Log
          </h3>
          <div className="bg-[#0B132B] rounded-lg p-4 max-h-48 overflow-y-auto font-mono text-xs space-y-1">
            {log.length === 0 ? (
              <p className="text-brand-muted">Chưa có hoạt động nào...</p>
            ) : (
              log.map((l, i) => (
                <p key={i} className="text-brand-text">
                  {l}
                </p>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusCard({
  label,
  value,
  color,
}: {
  label: string;
  value: any;
  color: string;
}) {
  return (
    <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-5">
      <p className="text-xs text-brand-muted uppercase tracking-wider font-semibold mb-1">
        {label}
      </p>
      <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
    </div>
  );
}
