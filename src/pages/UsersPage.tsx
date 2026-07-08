import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../config";
import { useAuth } from "../contexts/AuthContext";
import {
  Users,
  Check,
  X,
  Trash2,
  Lock,
  Unlock,
  Settings,
  Menu,
  Clock,
  CheckCircle,
  XCircle,
  Crown,
} from "lucide-react";

interface UserItem {
  id: number;
  username: string;
  email: string;
  role: string;
  status: string;
  permissions: string[];
  is_active: boolean;
  approved_by: number | null;
  created_at: string;
}

interface PermissionDef {
  key: string;
  label: string;
  description: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending:
    "bg-amber-500/15 text-amber-400 border-amber-500/30",
  approved:
    "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  rejected:
    "bg-red-500/15 text-red-400 border-red-500/30",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock size={12} />,
  approved: <CheckCircle size={12} />,
  rejected: <XCircle size={12} />,
};

export default function UsersPage({
  onMenuToggle,
}: {
  onMenuToggle?: () => void;
}) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<
    PermissionDef[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "pending">("all");
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editPerms, setEditPerms] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/api/users`);
      setUsers(res.data.users);
      setAvailablePermissions(res.data.available_permissions || []);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const pendingCount = users.filter((u) => u.status === "pending").length;
  const filteredUsers =
    tab === "pending" ? users.filter((u) => u.status === "pending") : users;

  const handleApprove = async (userId: number) => {
    setActionLoading(userId);
    try {
      await axios.put(`${API}/api/users/${userId}/approve`);
      await fetchUsers();
    } catch (err) {
      console.error(err);
    }
    setActionLoading(null);
  };

  const handleReject = async (userId: number) => {
    setActionLoading(userId);
    try {
      await axios.put(`${API}/api/users/${userId}/reject`);
      await fetchUsers();
    } catch (err) {
      console.error(err);
    }
    setActionLoading(null);
  };

  const handleToggleActive = async (userId: number) => {
    setActionLoading(userId);
    try {
      await axios.put(`${API}/api/users/${userId}/toggle-active`);
      await fetchUsers();
    } catch (err) {
      console.error(err);
    }
    setActionLoading(null);
  };

  const handleDelete = async (userId: number, username: string) => {
    if (!confirm(`Xoá user "${username}"? Hành động này không thể hoàn tác.`))
      return;
    setActionLoading(userId);
    try {
      await axios.delete(`${API}/api/users/${userId}`);
      await fetchUsers();
    } catch (err) {
      console.error(err);
    }
    setActionLoading(null);
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    setActionLoading(userId);
    try {
      await axios.put(`${API}/api/users/${userId}/role`, { role: newRole });
      await fetchUsers();
    } catch (err) {
      console.error(err);
    }
    setActionLoading(null);
  };

  const openPermissions = (user: UserItem) => {
    setEditingUser(user);
    setEditPerms([...user.permissions]);
  };

  const togglePerm = (key: string) => {
    setEditPerms((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const savePermissions = async () => {
    if (!editingUser) return;
    setActionLoading(editingUser.id);
    try {
      await axios.put(`${API}/api/users/${editingUser.id}/permissions`, {
        permissions: editPerms,
      });
      setEditingUser(null);
      await fetchUsers();
    } catch (err) {
      console.error(err);
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-brand-bg/80 backdrop-blur-xl border-b border-brand-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 rounded-lg text-brand-muted hover:text-white hover:bg-brand-surface2 transition-all cursor-pointer"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Users size={22} className="text-brand-accent" />
            <h1 className="text-xl font-bold text-white">Quản Lý Users</h1>
          </div>
        </div>
        <div className="text-sm text-brand-muted">
          {users.length} users • {pendingCount} chờ duyệt
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab("all")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              tab === "all"
                ? "bg-brand-accent/20 text-brand-accent border border-brand-accent/30"
                : "bg-brand-surface text-brand-muted border border-brand-border hover:text-white"
            }`}
          >
            Tất cả ({users.length})
          </button>
          <button
            onClick={() => setTab("pending")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              tab === "pending"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "bg-brand-surface text-brand-muted border border-brand-border hover:text-white"
            }`}
          >
            Chờ duyệt ({pendingCount})
          </button>
        </div>

        {/* Pending Banner */}
        {pendingCount > 0 && tab === "all" && (
          <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <Clock size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-amber-200 font-medium text-sm">
                {pendingCount} tài khoản đang chờ duyệt
              </p>
              <p className="text-amber-400/60 text-xs mt-0.5">
                Click vào tab "Chờ duyệt" để xem và duyệt nhanh
              </p>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-brand-muted text-[11px] uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-bold">User</th>
                  <th className="text-left px-5 py-3 font-bold">Role</th>
                  <th className="text-left px-5 py-3 font-bold">Trạng thái</th>
                  <th className="text-left px-5 py-3 font-bold">Quyền</th>
                  <th className="text-left px-5 py-3 font-bold">Ngày tạo</th>
                  <th className="text-right px-5 py-3 font-bold">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  const isLoading = actionLoading === u.id;

                  return (
                    <tr
                      key={u.id}
                      className={`border-b border-brand-border/50 hover:bg-brand-surface2/30 transition-colors ${
                        !u.is_active ? "opacity-50" : ""
                      }`}
                    >
                      {/* User info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${
                              u.role === "admin"
                                ? "bg-gradient-to-br from-brand-accent/30 to-amber-500/30 text-brand-accent"
                                : "bg-brand-surface2 text-brand-muted"
                            }`}
                          >
                            {u.username[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-semibold flex items-center gap-1.5">
                              {u.username}
                              {isSelf && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-brand-accent/20 text-brand-accent rounded-md font-bold">
                                  BẠN
                                </span>
                              )}
                            </p>
                            <p className="text-brand-muted text-xs">
                              {u.email || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-4">
                        {isSelf ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-accent/15 text-brand-accent text-xs font-bold">
                            <Crown size={12} /> {u.role}
                          </span>
                        ) : u.status === "approved" ? (
                          <select
                            value={u.role}
                            onChange={(e) =>
                              handleRoleChange(u.id, e.target.value)
                            }
                            disabled={isLoading}
                            className="bg-brand-surface2 border border-brand-border text-white text-xs rounded-lg px-2 py-1.5 outline-none focus:border-brand-accent cursor-pointer"
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        ) : (
                          <span className="text-brand-muted text-xs">
                            {u.role}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${
                            STATUS_COLORS[u.status] || STATUS_COLORS.pending
                          }`}
                        >
                          {STATUS_ICONS[u.status]} {u.status}
                        </span>
                      </td>

                      {/* Permissions */}
                      <td className="px-5 py-4">
                        {u.status === "approved" ? (
                          <button
                            onClick={() => openPermissions(u)}
                            className="inline-flex items-center gap-1 text-xs text-brand-muted hover:text-brand-accent transition-colors cursor-pointer"
                          >
                            <Settings size={12} />
                            {u.permissions.length} quyền
                          </button>
                        ) : (
                          <span className="text-brand-muted/50 text-xs">—</span>
                        )}
                      </td>

                      {/* Created at */}
                      <td className="px-5 py-4 text-brand-muted text-xs">
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString("vi-VN")
                          : "—"}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {u.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(u.id)}
                                disabled={isLoading}
                                className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all disabled:opacity-50 cursor-pointer"
                                title="Duyệt"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => handleReject(u.id)}
                                disabled={isLoading}
                                className="p-2 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-all disabled:opacity-50 cursor-pointer"
                                title="Từ chối"
                              >
                                <X size={14} />
                              </button>
                            </>
                          )}

                          {u.status === "approved" && !isSelf && (
                            <>
                              <button
                                onClick={() => handleToggleActive(u.id)}
                                disabled={isLoading}
                                className={`p-2 rounded-lg transition-all disabled:opacity-50 cursor-pointer ${
                                  u.is_active
                                    ? "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"
                                    : "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                                }`}
                                title={u.is_active ? "Khoá" : "Mở khoá"}
                              >
                                {u.is_active ? (
                                  <Lock size={14} />
                                ) : (
                                  <Unlock size={14} />
                                )}
                              </button>
                            </>
                          )}

                          {!isSelf && (
                            <button
                              onClick={() => handleDelete(u.id, u.username)}
                              disabled={isLoading}
                              className="p-2 rounded-lg bg-red-500/10 text-red-400/70 hover:bg-red-500/20 hover:text-red-400 transition-all disabled:opacity-50 cursor-pointer"
                              title="Xoá"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-brand-muted">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {tab === "pending"
                  ? "Không có user nào đang chờ duyệt"
                  : "Chưa có user nào"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Permissions Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setEditingUser(null)}
          />
          <div className="relative bg-brand-surface border border-brand-border rounded-2xl shadow-2xl shadow-black/60 w-full max-w-md">
            {/* Header */}
            <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold">Phân quyền</h3>
                <p className="text-brand-muted text-xs mt-0.5">
                  {editingUser.username}
                </p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-lg text-brand-muted hover:text-white hover:bg-brand-surface2 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Permissions List */}
            <div className="px-6 py-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {availablePermissions.map((perm) => {
                const isChecked = editPerms.includes(perm.key);
                return (
                  <label
                    key={perm.key}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      isChecked
                        ? "bg-brand-accent/10 border-brand-accent/30"
                        : "bg-brand-surface2/50 border-brand-border hover:border-brand-muted"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePerm(perm.key)}
                      className="accent-brand-accent w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          isChecked ? "text-white" : "text-brand-muted"
                        }`}
                      >
                        {perm.label}
                      </p>
                      <p className="text-xs text-brand-muted/60 mt-0.5">
                        {perm.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-brand-border flex items-center justify-between">
              <p className="text-xs text-brand-muted">
                {editPerms.length} quyền được chọn
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-sm text-brand-muted hover:text-white border border-brand-border hover:border-brand-muted transition-all cursor-pointer"
                >
                  Huỷ
                </button>
                <button
                  onClick={savePermissions}
                  disabled={actionLoading === editingUser.id}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-brand-accent to-emerald-400 text-black hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  💾 Lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
