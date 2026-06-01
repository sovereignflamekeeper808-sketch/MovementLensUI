'use client';

import React, { useState } from 'react';
import useIdentityBinding from '@/hooks/useIdentityBinding';

export default function MovementIdentityPanel({ walletAddress, onPaymentVerified }) {
  const {
    identity,
    boundCredentials,
    selectedCredentialId,
    registerBiometric,
    verifyPayment,
    revokeBiometric,
    isInitialized,
    hasCredentials,
    isLoading,
    error,
    setSelectedCredentialId,
  } = useIdentityBinding(walletAddress);

  const [paymentData, setPaymentData] = useState({
    amount: '',
    recipient: '',
    chain: 'ethereum',
  });

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  // Handle biometric registration with user ID
  const handleRegisterBiometric = async () => {
    const result = await registerBiometric(walletAddress);
    if (result.success) {
      // Registration successful - UI will update via hook state
      console.log('Biometric registered:', result.credential);
    }
  };

  // Handle payment verification with form data
  const handleVerifyPayment = async () => {
    if (!paymentData.amount || !paymentData.recipient) {
      alert('Please fill in all payment details');
      return;
    }

    const result = await verifyPayment(paymentData, selectedCredentialId);

    if (result.success) {
      setVerificationResult(result);
      setShowPaymentForm(false);

      // Callback to parent component
      if (onPaymentVerified) {
        onPaymentVerified(result);
      }

      // Clear form after 3 seconds
      setTimeout(() => {
        setVerificationResult(null);
        setPaymentData({ amount: '', recipient: '', chain: 'ethereum' });
      }, 3000);
    }
  };

  if (!isInitialized) {
    return (
      <div className="w-full max-w-xl mx-auto p-6 rounded-xl bg-black/40 backdrop-blur-xl border border-gold-500/20 shadow-lg">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-400"></div>
            </div>
          </div>
          <p className="text-gold-400 text-sm animate-pulse">
            Initializing Movement Identity…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto p-6 rounded-xl bg-gradient-to-b from-black/50 to-black/30 backdrop-blur-xl border border-gold-500/20 shadow-2xl space-y-6">
      {/* Identity Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-300 to-gold-500 tracking-wider">
          Movement Identity
        </h2>
        <p className="text-sm text-gray-400">
          Sovereign biometric identity bound to your wallet
        </p>
      </div>

      {/* Identity Info */}
      {identity && (
        <div className="space-y-3">
          {/* Wallet Address */}
          <div className="p-4 rounded-lg bg-black/50 border border-gold-500/10 hover:border-gold-500/20 transition">
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-widest">
              Wallet Address
            </p>
            <p className="font-mono text-gold-300 text-xs break-all">
              {identity.walletAddress}
            </p>
          </div>

          {/* Identity ID */}
          <div className="p-4 rounded-lg bg-black/50 border border-gold-500/10 hover:border-gold-500/20 transition">
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-widest">
              Identity Hash
            </p>
            <p className="font-mono text-gold-300 text-xs break-all">
              {identity.identityId.slice(0, 16)}...{identity.identityId.slice(-8)}
            </p>
          </div>

          {/* Identity Status */}
          <div className="p-4 rounded-lg bg-black/50 border border-gold-500/10">
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest">
              Identity Status
            </p>
            <div className="flex items-center gap-2">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  identity.status === 'active'
                    ? 'bg-green-500 animate-pulse'
                    : 'bg-red-500'
                }`}
              ></div>
              <span
                className={`text-sm font-semibold ${
                  identity.status === 'active'
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}
              >
                {identity.status.charAt(0).toUpperCase() +
                  identity.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Credential Status */}
      <div className="p-4 rounded-lg bg-black/50 border border-gold-500/10">
        <p className="text-xs text-gray-500 mb-3 uppercase tracking-widest">
          Biometric Credentials
        </p>

        {hasCredentials ? (
          <div className="space-y-3">
            <p className="text-green-400 text-sm font-semibold">
              ✓ {boundCredentials.length} Credential
              {boundCredentials.length !== 1 ? 's' : ''} Registered
            </p>

            {boundCredentials.length > 1 && (
              <div className="space-y-2">
                <label className="text-xs text-gray-400">Select Credential:</label>
                <select
                  value={selectedCredentialId || ''}
                  onChange={(e) => setSelectedCredentialId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-gold-500/20 text-gold-300 text-sm focus:outline-none focus:border-gold-500/50"
                >
                  {boundCredentials.map((cred) => (
                    <option key={cred.credentialId} value={cred.credentialId}>
                      Registered{' '}
                      {new Date(cred.registeredAt).toLocaleDateString()}
                      {cred.lastUsed
                        ? ` (Last used: ${new Date(cred.lastUsed).toLocaleString()})`
                        : ' (Never used)'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Credential Details */}
            {selectedCredentialId && (
              <div className="mt-3 p-3 rounded-lg bg-black/30 border border-gold-500/10 text-xs text-gray-400 space-y-1">
                {boundCredentials
                  .filter((c) => c.credentialId === selectedCredentialId)
                  .map((cred) => (
                    <div key={cred.credentialId}>
                      <p>
                        <span className="text-gold-500">Status:</span> {cred.status}
                      </p>
                      <p>
                        <span className="text-gold-500">Registered:</span>{' '}
                        {new Date(cred.registeredAt).toLocaleString()}
                      </p>
                      {cred.lastUsed && (
                        <p>
                          <span className="text-gold-500">Last Used:</span>{' '}
                          {new Date(cred.lastUsed).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-red-400 text-sm">
            No credentials registered. Register a biometric to continue.
          </p>
        )}
      </div>

      {/* Payment Verification Form */}
      {hasCredentials && showPaymentForm && (
        <div className="p-4 rounded-lg bg-black/50 border border-gold-500/10 space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-widest">
            Payment Details
          </p>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Amount (USDT)</label>
            <input
              type="text"
              value={paymentData.amount}
              onChange={(e) =>
                setPaymentData({ ...paymentData, amount: e.target.value })
              }
              placeholder="1.0"
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-gold-500/20 text-gold-300 text-sm focus:outline-none focus:border-gold-500/50"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Recipient Address
            </label>
            <input
              type="text"
              value={paymentData.recipient}
              onChange={(e) =>
                setPaymentData({ ...paymentData, recipient: e.target.value })
              }
              placeholder="0x..."
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-gold-500/20 text-gold-300 text-sm focus:outline-none focus:border-gold-500/50 font-mono"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Chain</label>
            <select
              value={paymentData.chain}
              onChange={(e) =>
                setPaymentData({ ...paymentData, chain: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-gold-500/20 text-gold-300 text-sm focus:outline-none focus:border-gold-500/50"
            >
              <option value="ethereum">Ethereum</option>
              <option value="bsc">BSC</option>
              <option value="avalanche">Avalanche</option>
            </select>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {!hasCredentials ? (
          <button
            onClick={handleRegisterBiometric}
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 text-black font-bold hover:from-gold-400 hover:to-gold-500 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isLoading ? 'Registering…' : '🔐 Register Biometric'}
          </button>
        ) : (
          <>
            <button
              onClick={() => setShowPaymentForm(!showPaymentForm)}
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-gold-600 to-gold-700 text-black font-bold hover:from-gold-500 hover:to-gold-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {showPaymentForm ? '✕ Cancel' : '💳 Verify Payment'}
            </button>

            {showPaymentForm && (
              <button
                onClick={handleVerifyPayment}
                disabled={isLoading}
                className="w-full py-3 rounded-lg bg-green-600 text-white font-bold hover:bg-green-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying…' : '✓ Authorize Payment'}
              </button>
            )}
          </>
        )}

        {hasCredentials && boundCredentials.length > 1 && !showPaymentForm && (
          <button
            onClick={() => revokeBiometric(selectedCredentialId)}
            disabled={isLoading}
            className="w-full py-2 rounded-lg bg-red-900/40 text-red-400 font-semibold hover:bg-red-900/60 transition disabled:opacity-50 text-sm"
          >
            Revoke Selected Credential
          </button>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center">
          <p className="text-gold-400 animate-pulse text-sm">
            Processing biometric authentication…
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-lg bg-red-900/40 border border-red-500/30 text-red-300 text-sm space-y-1">
          <p className="font-semibold">⚠️ Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Success State */}
      {verificationResult && (
        <div className="p-4 rounded-lg bg-green-900/40 border border-green-500/30 text-green-300 text-sm space-y-2">
          <p className="font-semibold">✓ Payment Verified</p>
          <p className="text-xs text-green-400/80">
            Identity Proof Hash: {verificationResult.identityProofHash?.slice(0, 16)}...
          </p>
        </div>
      )}
    </div>
  );
}
