// 1CMC RLRJ — Movement Pay Core Contract Configuration
// Smart contract addresses and ABI definitions for the settlement engine

export const CHAINS = {
  ethereum: {
    id: 1,
    name: "Ethereum",
    rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY",
    explorer: "https://etherscan.io",
    usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    priority: "primary",
    symbol: "ETH",
    color: "#627EEA",
  },
  sepolia: {
    id: 11155111,
    name: "Sepolia (Testnet)",
    rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY",
    explorer: "https://sepolia.etherscan.io",
    usdt: "",
    priority: "testnet",
    symbol: "ETH",
    color: "#627EEA",
  },
  bsc: {
    id: 56,
    name: "BNB Smart Chain",
    rpcUrl: "https://bsc-dataseed.binance.org/",
    explorer: "https://bscscan.com",
    usdt: "0x55d398326f99059fF775485246999027B3197955",
    priority: "primary",
    symbol: "BNB",
    color: "#F3BA2F",
  },
  avalanche: {
    id: 43114,
    name: "Avalanche",
    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
    explorer: "https://snowtrace.io",
    usdt: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
    priority: "secondary",
    symbol: "AVAX",
    color: "#E84142",
  },
};

// Settlement contract addresses (update after deployment)
export const SETTLEMENT_ADDRESSES = {
  1: "0x0000000000000000000000000000000000000000",
  11155111: "0x0000000000000000000000000000000000000000",
  56: "0x0000000000000000000000000000000000000000",
  43114: "0x0000000000000000000000000000000000000000",
};

export const SETTLEMENT_ABI = [
  "function initiatePayment(address payee, uint256 amount, bytes32 biometricHash, string chain) external returns (bytes32)",
  "function confirmSettlement(bytes32 settlementId) external",
  "function refundSettlement(bytes32 settlementId) external",
  "function raiseDispute(bytes32 settlementId, string reason) external",
  "function batchConfirmSettlements(bytes32[] settlementIds) external",
  "function getSettlement(bytes32 settlementId) external view returns (tuple(bytes32 settlementId, address payer, address payee, uint256 amount, uint256 fee, uint8 status, uint256 createdAt, uint256 settledAt, bytes32 biometricHash, string chain))",
  "function calculateFee(uint256 amount) external view returns (uint256)",
  "function isExpired(bytes32 settlementId) external view returns (bool)",
  "function escrowBalance() external view returns (uint256)",
  "function totalVolumeSettled() external view returns (uint256)",
  "function totalFeesCollected() external view returns (uint256)",
  "function totalSettlements() external view returns (uint256)",
  "function feeBasisPoints() external view returns (uint256)",
  "event PaymentInitiated(bytes32 indexed settlementId, address indexed payer, address indexed payee, uint256 amount, bytes32 biometricHash)",
  "event SettlementConfirmed(bytes32 indexed settlementId, uint256 settledAt)",
  "event SettlementRefunded(bytes32 indexed settlementId, address indexed payer, uint256 amount)",
];

export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
  "function name() external view returns (string)",
];

export const SETTLEMENT_STATUS = {
  0: { label: "Pending", color: "text-sovereign-muted", badge: "" },
  1: { label: "Escrowed", color: "text-yellow-400", badge: "badge-escrowed" },
  2: { label: "Confirmed", color: "text-blue-400", badge: "" },
  3: { label: "Settled", color: "text-emerald-400", badge: "badge-settled" },
  4: { label: "Refunded", color: "text-red-400", badge: "badge-refunded" },
  5: { label: "Disputed", color: "text-purple-400", badge: "badge-disputed" },
};

export const USDT_DECIMALS = 6;

export function parseUSDT(amount) {
  return BigInt(Math.round(parseFloat(amount) * 1e6));
}

export function formatUSDT(amount) {
  return (Number(amount) / 1e6).toFixed(2);
}
