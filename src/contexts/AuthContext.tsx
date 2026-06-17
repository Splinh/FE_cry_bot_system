import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";
import { API } from "../config";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  status: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  register: (
    username: string,
    password: string,
    email?: string,
  ) => Promise<{ error: string | null; pending?: boolean }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => null,
  register: async () => ({ error: null }),
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );
  const [loading, setLoading] = useState(true);

  // Set axios default auth header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Check token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem("token");
      if (!savedToken) {
        setLoading(false);
        return;
      }
      try {
        axios.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
        const res = await axios.get(`${API}/api/auth/me`);
        setUser(res.data);
        setToken(savedToken);
      } catch {
        // Token invalid/expired
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common["Authorization"];
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (
    username: string,
    password: string,
  ): Promise<string | null> => {
    try {
      const res = await axios.post(`${API}/api/auth/login`, {
        username,
        password,
      });
      if (res.data.success) {
        const t = res.data.token;
        localStorage.setItem("token", t);
        setToken(t);
        setUser(res.data.user);
        return null; // no error
      }
      return "Đăng nhập thất bại";
    } catch (e: any) {
      return e.response?.data?.detail || "Sai username hoặc mật khẩu";
    }
  };

  const register = async (
    username: string,
    password: string,
    email?: string,
  ): Promise<{ error: string | null; pending?: boolean }> => {
    try {
      const res = await axios.post(`${API}/api/auth/register`, {
        username,
        password,
        email: email || "",
      });
      if (res.data.success) {
        if (res.data.pending) {
          return { error: null, pending: true };
        }
        // Fallback: auto login if token returned
        if (res.data.token) {
          const t = res.data.token;
          localStorage.setItem("token", t);
          setToken(t);
          setUser(res.data.user);
        }
        return { error: null };
      }
      return { error: "Đăng ký thất bại" };
    } catch (e: any) {
      return { error: e.response?.data?.detail || "Lỗi đăng ký" };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
