"use client";
// 1CMC RLRJ — Wallet Connection Hook
// Handles MetaMask / injected wallet connection and chain switching

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CHAINS, ERC20_ABI, USDT_DECIMALS, formatUSDT } from "../lib/contracts";

export function useWallet() {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [balance, setBalance] = useState("0.00");
  const [usdtBalance, setUsdtBalance] = useState("0.00");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const isConnected = !!account;

  // Get current chain config
  const currentChain = Object.values(CHAINS).find((c) => c.id === chainId) || null;

  // Connect wallet
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("No wallet detected. Please install MetaMask.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      const walletSigner = await browserProvider.getSigner();
      const network = await browserProvider.getNetwork();

      setProvider(browserProvider);
      setSigner(walletSigner);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
    setBalance("0.00");
    setUsdtBalance("0.00");
  }, []);

  // Switch chain
  const switchChain = useCallback(async (targetChainId) => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + targetChainId.toString(16) }],
      });
    } catch (err) {
      if (err.code === 4902) {
        setError("Chain not added to wallet. Please add it manually.");
      } else {
        setError(err.message);
      }
    }
  }, []);

  // Fetch balances
  const fetchBalances = useCallback(async () => {
    if (!provider || !account) return;

    try {
      // Native balance
      const ethBal = await provider.getBalance(account);
      setBalance(parseFloat(ethers.formatEther(ethBal)).toFixed(4));

      // USDT balance
      const chain = Object.values(CHAINS).find((c) => c.id === chainId);
      if (chain && chain.usdt) {
        const usdtContract = new ethers.Contract(chain.usdt, ERC20_ABI, provider);
        const usdtBal = await usdtContract.balanceOf(account);
        setUsdtBalance(formatUSDT(usdtBal));
      }
    } catch (err) {
      console.error("Balance fetch error:", err);
    }
  }, [provider, account, chainId]);

  // Listen for account and chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = (newChainId) => {
      setChainId(parseInt(newChainId, 16));
      // Refresh provider
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(browserProvider);
      browserProvider.getSigner().then(setSigner);
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [disconnect]);

  // Auto-fetch balances when connected
  useEffect(() => {
    if (isConnected) {
      fetchBalances();
      const interval = setInterval(fetchBalances, 15000); // Every 15s
      return () => clearInterval(interval);
    }
  }, [isConnected, fetchBalances]);

  return {
    account,
    chainId,
    currentChain,
    provider,
    signer,
    balance,
    usdtBalance,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    switchChain,
    fetchBalances,
  };
}
