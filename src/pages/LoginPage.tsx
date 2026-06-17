import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPendingMessage("");
    setLoading(true);

    if (isRegister) {
      const result = await register(username, password, email);
      if (result.error) {
        setError(result.error);
      } else if (result.pending) {
        setPendingMessage(
          "✅ Tài khoản đã được tạo thành công! Đang chờ admin duyệt. Vui lòng liên hệ admin để được kích hoạt."
        );
        setUsername("");
        setPassword("");
        setEmail("");
      }
    } else {
      const err = await login(username, password);
      if (err) setError(err);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-brand-bg">
      <div className="w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-accent to-emerald-400 flex items-center justify-center text-2xl shadow-lg shadow-brand-accent/20">
              🤖
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              CRYPTO<span className="text-brand-accent">BOT</span>
            </h1>
          </div>
          <p className="text-brand-muted text-sm">
            {isRegister ? "Tạo tài khoản mới" : "Đăng nhập để tiếp tục"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-8 shadow-2xl shadow-black/40">
          {/* Pending Success Message */}
          {pendingMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-4 text-emerald-400 text-sm font-medium mb-5 leading-relaxed">
              {pendingMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="text-[11px] text-brand-muted uppercase font-bold tracking-wider block mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập username"
                required
                minLength={3}
                className="w-full bg-[#0B132B] border border-[#1C2541] rounded-xl px-4 py-3 text-white text-sm focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 outline-none transition-all placeholder-brand-muted/50"
              />
            </div>

            {/* Email (register only) */}
            {isRegister && (
              <div>
                <label className="text-[11px] text-brand-muted uppercase font-bold tracking-wider block mb-2">
                  Email <span className="text-brand-muted/50">(tuỳ chọn)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full bg-[#0B132B] border border-[#1C2541] rounded-xl px-4 py-3 text-white text-sm focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 outline-none transition-all placeholder-brand-muted/50"
                />
              </div>
            )}

            {/* Password */}
            <div>
              <label className="text-[11px] text-brand-muted uppercase font-bold tracking-wider block mb-2">
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                required
                minLength={6}
                className="w-full bg-[#0B132B] border border-[#1C2541] rounded-xl px-4 py-3 text-white text-sm focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 outline-none transition-all placeholder-brand-muted/50"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm font-medium">
                ❌ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all cursor-pointer disabled:opacity-50 bg-gradient-to-r from-brand-accent to-emerald-400 text-black hover:shadow-[0_0_30px_rgba(0,255,171,0.25)] active:scale-[0.98]"
            >
              {loading
                ? "⏳ Đang xử lý..."
                : isRegister
                  ? "🚀 Đăng Ký"
                  : "🔐 Đăng Nhập"}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
                setPendingMessage("");
              }}
              className="text-sm text-brand-muted hover:text-brand-accent transition-colors cursor-pointer"
            >
              {isRegister
                ? "Đã có tài khoản? Đăng nhập"
                : "Chưa có tài khoản? Đăng ký ngay"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-brand-muted/40 text-xs mt-6">
          CryptoBot System v1.0 — Secure Trading Dashboard
        </p>
      </div>
    </div>
  );
}
