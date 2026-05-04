"use client";
// 1CMC RLRJ — Movement Lens UI — Main Page
// Composes all sovereign ecosystem components

import { useState, useCallback } from "react";
import Header from "../components/Header";
import WalletConnect from "../components/WalletConnect";
import ChainSelector from "../components/ChainSelector";
import PaymentFlow from "../components/PaymentFlow";
import Dashboard from "../components/Dashboard";
import TransactionList from "../components/TransactionList";
import useWallet from "../hooks/useWallet";
import useContract from "../hooks/useContract";
import { CHAINS } from "../lib/contracts";

export default function Home() {
  const {
    account,
    chainId,
    ethBalance,
    usdtBalance,
    isConnecting,
    error: walletError,
    connect,
    disconnect,
    switchChain,
  } = useWallet();

  const {
    initiatePayment,
    getProtocolStats,
    calculateFee,
    isLoading,
    txHash,
    error: contractError,
  } = useContract(account, chainId);

  const [settlements, setSettlements] = useState([]);
  const [activeTab, setActiveTab] = useState("pay"); // pay | history

  // Find chain name from chainId
  const currentChain = Object.values(CHAINS).find((c) => c.id === chainId);
  const chainName = currentChain?.name || "Unknown";

  // Wrap initiatePayment to also track local settlement list
  const handleInitiatePayment = useCallback(
    async (payee, amount, biometricHash, chain) => {
      const result = await initiatePayment(payee, amount, biometricHash, chain);

      // Add to local settlements list
      setSettlements((prev) => [
        {
          settlementId: result.settlementId || `local-${Date.now()}`,
          payer: account,
          payee,
          amount,
          fee: (parseFloat(amount) * 0.005).toFixed(2),
          status: 1, // Escrowed
          createdAt: Math.floor(Date.now() / 1000),
          chain: chain || chainName,
          txHash: result.txHash,
        },
        ...prev,
      ]);

      return result;
    },
    [initiatePayment, account, chainName]
  );

  // -- Not Connected: Show Wallet Connect Screen --
  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <WalletConnect
          onConnect={connect}
          isConnecting={isConnecting}
          error={walletError}
        />
      </div>
    );
  }

  // -- Connected: Show Full App --
  return (
    <div className="min-h-screen pb-20">
      {/* Fixed Header */}
      <Header
        account={account}
        chainId={chainId}
        ethBalance={ethBalance}
        usdtBalance={usdtBalance}
        onDisconnect={disconnect}
      />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pt-24 space-y-6">
        {/* Dashboard Stats */}
        <Dashboard getProtocolStats={getProtocolStats} />

        {/* Chain Selector */}
        <ChainSelector currentChainId={chainId} onSwitch={switchChain} />

        {/* Tab Switcher */}
        <div className="flex gap-1 p-1 rounded-xl bg-sovereign-card border border-sovereign-border">
          <button
            onClick={() => setActiveTab("pay")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "pay"
                ? "bg-sovereign-gold/10 text-sovereign-gold border border-sovereign-gold/30"
                : "text-sovereign-muted hover:text-sovereign-text"
            }`}
          >
            Send Payment
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "history"
                ? "bg-sovereign-gold/10 text-sovereign-gold border border-sovereign-gold/30"
                : "text-sovereign-muted hover:text-sovereign-text"
            }`}
          >
            History
            {settlements.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-sovereign-gold/20 text-sovereign-gold text-[10px]">
                {settlements.length}
              </span>
            )}
          </button>
        </div>

        {/* Active Tab Content */}
        {activeTab === "pay" ? (
          <PaymentFlow
            account={account}
            usdtBalance={usdtBalance}
            chainName={chainName}
            onInitiatePayment={handleInitiatePayment}
            calculateFee={calculateFee}
            isLoading={isLoading}
            txHash={txHash}
            error={contractError}
          />
        ) : (
          <TransactionList settlements={settlements} chainId={chainId} />
        )}

        {/* Footer */}
        <footer className="text-center py-8 border-t border-sovereign-border/30">
          <p className="text-[10px] text-sovereign-muted/50 uppercase tracking-[0.2em]">
            1CMC RLRJ Sovereign Ecosystem
          </p>
          <p className="text-[10px] text-sovereign-muted/30 mt-1">
            &copy; 2026 Robert Lee Russell Jr. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}
