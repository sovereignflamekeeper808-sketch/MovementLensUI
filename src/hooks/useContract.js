"use client";
// 1CMC RLRJ — Settlement Contract Hook
// Handles all interactions with the MovementPayCoreSettlement contract

import { useState, useCallback, useMemo } from "react";
import { ethers } from "ethers";
import {
  SETTLEMENT_ABI,
  ERC20_ABI,
  SETTLEMENT_ADDRESSES,
  SETTLEMENT_STATUS,
  USDT_DECIMALS,
  parseUSDT,
  formatUSDT,
  CHAINS,
} from "../lib/contracts";

export function useContract(signer, provider, chainId) {
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  // Get settlement contract instance
  const settlement = useMemo(() => {
    if (!provider || !chainId) return null;
    const address = SETTLEMENT_ADDRESSES[chainId];
    if (!address || address === "0x0000000000000000000000000000000000000000") return null;
    const signerOrProvider = signer || provider;
    return new ethers.Contract(address, SETTLEMENT_ABI, signerOrProvider);
  }, [signer, provider, chainId]);

  // Get USDT contract instance
  const usdtContract = useMemo(() => {
    if (!provider || !chainId) return null;
    const chain = Object.values(CHAINS).find((c) => c.id === chainId);
    if (!chain || !chain.usdt) return null;
    const signerOrProvider = signer || provider;
    return new ethers.Contract(chain.usdt, ERC20_ABI, signerOrProvider);
  }, [signer, provider, chainId]);

  // Approve USDT spending
  const approveUSDT = useCallback(
    async (amount) => {
      if (!usdtContract || !signer) throw new Error("Not connected");
      setIsLoading(true);
      setError(null);

      try {
        const parsedAmount = parseUSDT(amount);
        const settlementAddr = SETTLEMENT_ADDRESSES[chainId];
        const tx = await usdtContract.approve(settlementAddr, parsedAmount);
        setTxHash(tx.hash);
        await tx.wait();
        return tx.hash;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [usdtContract, signer, chainId]
  );

  // Check USDT allowance
  const checkAllowance = useCallback(
    async (owner) => {
      if (!usdtContract) return "0";
      const settlementAddr = SETTLEMENT_ADDRESSES[chainId];
      const allowance = await usdtContract.allowance(owner, settlementAddr);
      return formatUSDT(allowance);
    },
    [usdtContract, chainId]
  );

  // Initiate a payment
  const initiatePayment = useCallback(
    async (payee, amount, biometricHash, chainName) => {
      if (!settlement || !signer) throw new Error("Not connected");
      setIsLoading(true);
      setError(null);
      setTxHash(null);

      try {
        const parsedAmount = parseUSDT(amount);

        // Check and approve if needed
        const signerAddr = await signer.getAddress();
        const settlementAddr = SETTLEMENT_ADDRESSES[chainId];
        const currentAllowance = await usdtContract.allowance(signerAddr, settlementAddr);

        if (currentAllowance < parsedAmount) {
          const approveTx = await usdtContract.approve(settlementAddr, parsedAmount);
          await approveTx.wait();
        }

        // Initiate the payment
        const tx = await settlement.initiatePayment(
          payee,
          parsedAmount,
          biometricHash,
          chainName || "ethereum"
        );

        setTxHash(tx.hash);
        const receipt = await tx.wait();

        // Extract settlement ID from events
        let settlementId = null;
        for (const log of receipt.logs) {
          try {
            const parsed = settlement.interface.parseLog(log);
            if (parsed && parsed.name === "PaymentInitiated") {
              settlementId = parsed.args.settlementId;
              break;
            }
          } catch {
            continue;
          }
        }

        return {
          txHash: receipt.hash,
          settlementId,
          blockNumber: receipt.blockNumber,
        };
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [settlement, signer, usdtContract, chainId]
  );

  // Get settlement details
  const getSettlement = useCallback(
    async (settlementId) => {
      if (!settlement) return null;
      const data = await settlement.getSettlement(settlementId);
      return {
        settlementId: data.settlementId,
        payer: data.payer,
        payee: data.payee,
        amount: formatUSDT(data.amount),
        fee: formatUSDT(data.fee),
        status: SETTLEMENT_STATUS[data.status] || { label: "Unknown", color: "text-gray-400" },
        statusCode: Number(data.status),
        createdAt: new Date(Number(data.createdAt) * 1000),
        settledAt: data.settledAt > 0 ? new Date(Number(data.settledAt) * 1000) : null,
        biometricHash: data.biometricHash,
        chain: data.chain,
      };
    },
    [settlement]
  );

  // Get protocol stats
  const getProtocolStats = useCallback(async () => {
    if (!settlement) return null;

    try {
      const [volume, fees, count, escrow, feeBps] = await Promise.all([
        settlement.totalVolumeSettled(),
        settlement.totalFeesCollected(),
        settlement.totalSettlements(),
        settlement.escrowBalance(),
        settlement.feeBasisPoints(),
      ]);

      return {
        totalVolume: formatUSDT(volume),
        totalFees: formatUSDT(fees),
        totalSettlements: Number(count),
        escrowBalance: formatUSDT(escrow),
        feeBps: Number(feeBps),
        feePercent: (Number(feeBps) / 100).toFixed(2),
      };
    } catch {
      return null;
    }
  }, [settlement]);

  // Calculate fee for amount
  const calculateFee = useCallback(
    async (amount) => {
      if (!settlement) return "0.00";
      try {
        const fee = await settlement.calculateFee(parseUSDT(amount));
        return formatUSDT(fee);
      } catch {
        return "0.00";
      }
    },
    [settlement]
  );

  return {
    settlement,
    usdtContract,
    isLoading,
    txHash,
    error,
    approveUSDT,
    checkAllowance,
    initiatePayment,
    getSettlement,
    getProtocolStats,
    calculateFee,
    isContractAvailable: !!settlement,
  };
}
