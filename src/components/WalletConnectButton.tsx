import { useState } from "react";
import { BrowserProvider, formatEther, formatUnits, Contract } from "ethers";

import { API } from "../config";

// ERC-20 USDT contract addresses per chain
const USDT_CONTRACTS: Record<number, string> = {
  1: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // Ethereum
  56: "0x55d398326f99059fF775485246999027B3197955", // BSC (USDT-BEP20)
  137: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // Polygon
  42161: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // Arbitrum
  10: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", // Optimism
};

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum",
  56: "BSC",
  137: "Polygon",
  42161: "Arbitrum",
  10: "Optimism",
  11155111: "Sepolia (Testnet)",
};

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

type WalletType = "metamask" | "phantom" | null;

interface WalletState {
  connected: boolean;
  address: string;
  chainId: number;
  chainName: string;
  ethBalance: string;
  usdtBalance: string;
  walletType: WalletType;
}

interface WalletConnectProps {
  onDeposit?: (
    amount: number,
    txHash: string,
    walletType: string,
    chain: string,
  ) => void;
}

export default function WalletConnectButton({ onDeposit }: WalletConnectProps) {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: "",
    chainId: 0,
    chainName: "",
    ethBalance: "0",
    usdtBalance: "0",
    walletType: null,
  });
  const [depositAmt, setDepositAmt] = useState(100);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [, setSolWallet] = useState<{
    connected: boolean;
    address: string;
    balance: string;
  }>({
    connected: false,
    address: "",
    balance: "0",
  });

  // ============================
  // MetaMask (EVM)
  // ============================
  const connectMetaMask = async () => {
    if (!(window as any).ethereum) {
      setMsg("❌ MetaMask chưa cài! Tải tại metamask.io");
      return;
    }
    setLoading(true);
    try {
      const provider = new BrowserProvider((window as any).ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const address = accounts[0];
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      const ethBal = await provider.getBalance(address);

      // Get USDT balance
      let usdtBal = "0";
      const usdtAddr = USDT_CONTRACTS[chainId];
      if (usdtAddr) {
        try {
          const contract = new Contract(usdtAddr, ERC20_ABI, provider);
          const decimals = await contract.decimals();
          const bal = await contract.balanceOf(address);
          usdtBal = formatUnits(bal, decimals);
        } catch {
          usdtBal = "0";
        }
      }

      setWallet({
        connected: true,
        address,
        chainId,
        chainName: CHAIN_NAMES[chainId] || `Chain #${chainId}`,
        ethBalance: parseFloat(formatEther(ethBal)).toFixed(4),
        usdtBalance: parseFloat(usdtBal).toFixed(2),
        walletType: "metamask",
      });
      setMsg(
        `✅ Đã kết nối MetaMask: ${address.slice(0, 6)}...${address.slice(-4)}`,
      );
    } catch (e: any) {
      setMsg(`❌ ${e.message || "Lỗi kết nối MetaMask"}`);
    }
    setLoading(false);
    setTimeout(() => setMsg(""), 4000);
  };

  // ============================
  // Phantom (Solana)
  // ============================
  const connectPhantom = async () => {
    const phantom = (window as any).solana;
    if (!phantom?.isPhantom) {
      setMsg("❌ Phantom chưa cài! Tải tại phantom.app");
      return;
    }
    setLoading(true);
    try {
      const resp = await phantom.connect();
      const address = resp.publicKey.toString();

      // Get SOL balance
      let solBal = "0";
      try {
        const { Connection, PublicKey, LAMPORTS_PER_SOL } =
          await import("@solana/web3.js");
        const conn = new Connection(
          "https://api.mainnet-beta.solana.com",
          "confirmed",
        );
        const bal = await conn.getBalance(new PublicKey(address));
        solBal = (bal / LAMPORTS_PER_SOL).toFixed(4);
      } catch {
        solBal = "?";
      }

      setSolWallet({ connected: true, address, balance: solBal });
      setWallet({
        connected: true,
        address,
        chainId: -1,
        chainName: "Solana",
        ethBalance: solBal,
        usdtBalance: "0",
        walletType: "phantom",
      });
      setMsg(
        `✅ Đã kết nối Phantom: ${address.slice(0, 6)}...${address.slice(-4)}`,
      );
    } catch (e: any) {
      setMsg(`❌ ${e.message || "Lỗi kết nối Phantom"}`);
    }
    setLoading(false);
    setTimeout(() => setMsg(""), 4000);
  };

  // ============================
  // Disconnect
  // ============================
  const disconnect = () => {
    if (wallet.walletType === "phantom") {
      (window as any).solana?.disconnect();
      setSolWallet({ connected: false, address: "", balance: "0" });
    }
    setWallet({
      connected: false,
      address: "",
      chainId: 0,
      chainName: "",
      ethBalance: "0",
      usdtBalance: "0",
      walletType: null,
    });
    setMsg("Đã ngắt kết nối");
    setTimeout(() => setMsg(""), 2000);
  };

  // ============================
  // Deposit (Send to bot wallet)
  // ============================
  const handleDeposit = async () => {
    if (depositAmt <= 0) return;
    setLoading(true);
    setMsg("");
    try {
      // For now: credit via paper trading deposit API
      // Real: would sign tx to send tokens to bot wallet
      const res = await fetch(`${API}/api/trading/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: depositAmt,
          note: `${wallet.walletType === "metamask" ? "🦊 MetaMask" : "👻 Phantom"} (${wallet.chainName}) - ${wallet.address.slice(0, 8)}...`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg(
          `✅ Nạp $${depositAmt} thành công từ ${wallet.walletType === "metamask" ? "MetaMask" : "Phantom"}!`,
        );
        onDeposit?.(depositAmt, "", wallet.walletType || "", wallet.chainName);
      } else {
        setMsg(`❌ ${data.error || "Lỗi nạp"}`);
      }
    } catch (e: any) {
      setMsg(`❌ ${e.message || "Lỗi"}`);
    }
    setLoading(false);
    setTimeout(() => setMsg(""), 5000);
  };

  return (
    <div className="space-y-3">
      {/* Connect Buttons */}
      {!wallet.connected ? (
        <div className="flex space-x-2">
          <button
            onClick={connectMetaMask}
            disabled={loading}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer disabled:opacity-50 bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] flex items-center justify-center space-x-2"
          >
            <span className="text-lg">🦊</span>
            <span>{loading ? "Đang kết nối..." : "MetaMask"}</span>
          </button>
          <button
            onClick={connectPhantom}
            disabled={loading}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer disabled:opacity-50 bg-gradient-to-r from-purple-500 to-violet-600 text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] flex items-center justify-center space-x-2"
          >
            <span className="text-lg">👻</span>
            <span>{loading ? "Đang kết nối..." : "Phantom"}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Connected Info */}
          <div className="bg-[#0B132B] border border-[#1C2541] rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">
                  {wallet.walletType === "metamask" ? "🦊" : "👻"}
                </span>
                <span className="text-white font-bold text-sm">
                  {wallet.walletType === "metamask" ? "MetaMask" : "Phantom"}
                </span>
                <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded font-bold">
                  CONNECTED
                </span>
              </div>
              <button
                onClick={disconnect}
                className="text-[10px] text-red-400 hover:text-red-300 cursor-pointer"
              >
                Ngắt kết nối
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-brand-muted">
                Address:{" "}
                <span className="text-white font-mono">
                  {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                </span>
              </div>
              <div className="text-brand-muted">
                Chain:{" "}
                <span className="text-brand-accent font-bold">
                  {wallet.chainName}
                </span>
              </div>
              <div className="text-brand-muted">
                {wallet.walletType === "metamask" ? "ETH" : "SOL"}:{" "}
                <span className="text-white font-bold">
                  {wallet.ethBalance}
                </span>
              </div>
              {wallet.walletType === "metamask" && (
                <div className="text-brand-muted">
                  USDT:{" "}
                  <span className="text-green-400 font-bold">
                    ${wallet.usdtBalance}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Deposit Form */}
          <div>
            <label className="text-[10px] text-brand-muted uppercase font-bold block mb-1">
              Số tiền nạp (USDT)
            </label>
            <input
              type="number"
              value={depositAmt}
              onChange={(e) => setDepositAmt(Number(e.target.value))}
              min={1}
              className="w-full bg-[#0B132B] border border-[#1C2541] rounded-lg px-4 py-2.5 text-white text-sm focus:border-brand-accent outline-none"
            />
            <div className="flex space-x-1 mt-1">
              {[10, 50, 100, 500, 1000].map((v) => (
                <button
                  key={v}
                  onClick={() => setDepositAmt(v)}
                  className={`text-[9px] px-1.5 py-0.5 rounded cursor-pointer ${depositAmt === v ? "bg-brand-accent text-black" : "bg-[#1C2541] text-brand-muted hover:text-white"}`}
                >
                  ${v}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleDeposit}
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all cursor-pointer disabled:opacity-50 bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-[0_0_20px_rgba(74,222,128,0.3)]"
          >
            {loading
              ? "⏳ Đang xử lý..."
              : `📥 NẠP $${depositAmt} TỪ ${wallet.walletType === "metamask" ? "METAMASK" : "PHANTOM"}`}
          </button>
        </div>
      )}

      {msg && (
        <p
          className={`text-xs font-bold ${msg.startsWith("✅") ? "text-green-400" : msg.startsWith("❌") ? "text-red-400" : "text-brand-muted"}`}
        >
          {msg}
        </p>
      )}
    </div>
  );
}
