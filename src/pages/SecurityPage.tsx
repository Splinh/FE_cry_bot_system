import { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";

import { API } from "../config";

interface AuditLog {
  time: string;
  chat_id: number;
  action: string;
  detail?: string;
}

export default function SecurityPage({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    axios
      .get(`${API}/api/security/audit`)
      .then((r) => setLogs(r.data.logs || []))
      .catch(() => {});
    const iv = setInterval(() => {
      axios
        .get(`${API}/api/security/audit`)
        .then((r) => setLogs(r.data.logs || []))
        .catch(() => {});
    }, 10000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <Header title="Security & Audit" subtitle="System Protection" onMenuToggle={onMenuToggle} />
      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Security Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoCard
            title="Encryption"
            value="AES-256 (Fernet)"
            desc="Private keys are encrypted at rest"
          />
          <InfoCard
            title="Authentication"
            value="PIN + Whitelist"
            desc="Multi-layer access control"
          />
          <InfoCard
            title="Rate Limiting"
            value="Active"
            desc="Prevents API abuse"
          />
        </div>

        {/* Audit Log */}
        <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
            📜 Audit Log (Last 30)
          </h3>
          <div className="bg-[#0B132B] rounded-lg p-4 max-h-[400px] overflow-y-auto font-mono text-xs space-y-1">
            {logs.length === 0 ? (
              <p className="text-brand-muted">Chưa có log bảo mật nào.</p>
            ) : (
              logs.map((l, i) => {
                const logTime = new Date(l.time).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                });
                const actionLower = l.action.toLowerCase();
                const isWarn = actionLower.includes("warn");
                const isError =
                  actionLower.includes("fail") ||
                  actionLower.includes("deny") ||
                  actionLower.includes("error");
                const isSuccess =
                  actionLower.includes("success") ||
                  actionLower.includes("approve");

                const detailStr = l.detail ? ` - ${l.detail}` : "";
                const logText = `[${logTime}] Chat ${l.chat_id}: ${l.action}${detailStr}`;

                return (
                  <p
                    key={i}
                    className={`py-0.5 border-b border-[#1C2541]/30 last:border-0 ${
                      isWarn
                        ? "text-yellow-400"
                        : isError
                          ? "text-red-400"
                          : isSuccess
                            ? "text-green-400"
                            : "text-brand-muted"
                    }`}
                  >
                    {logText}
                  </p>
                );
              })
            )}
          </div>
        </div>

        {/* Security Tips */}
        <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
            🛡️ Lưu Ý Bảo Mật
          </h3>
          <ul className="text-sm text-brand-muted space-y-2 list-disc list-inside">
            <li>
              Private Keys{" "}
              <strong className="text-brand-accent">KHÔNG BAO GIỜ</strong> được
              gửi qua API
            </li>
            <li>
              Chỉ có thể xem Private Key qua lệnh{" "}
              <code className="bg-[#1C2541] px-1.5 py-0.5 rounded text-brand-accent">
                /wallet export
              </code>{" "}
              trên Telegram sau khi nhập PIN
            </li>
            <li>
              Thiết lập Whitelist để chỉ cho phép Telegram ID của bạn truy cập
              Bot
            </li>
            <li>
              Nếu dùng VPS: Dùng Firewall chặn port 8000 từ bên ngoài (chỉ cho
              localhost)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  value,
  desc,
}: {
  title: string;
  value: string;
  desc: string;
}) {
  return (
    <div className="bg-brand-surface border border-[#1C2541] rounded-xl p-5">
      <p className="text-xs text-brand-muted uppercase tracking-wider font-semibold">
        {title}
      </p>
      <p className="text-xl font-extrabold text-green-400 mt-1">{value}</p>
      <p className="text-xs text-brand-muted mt-1">{desc}</p>
    </div>
  );
}
