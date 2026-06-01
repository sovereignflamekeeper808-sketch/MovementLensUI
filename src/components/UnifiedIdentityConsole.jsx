'use client';

import React from 'react';
import MovementIdentityPanel from './MovementIdentityPanel';
import BackendIdentityPanel from './BackendIdentityPanel';
import MovementPaymentPanel from './MovementPaymentPanel';

/**
 * Unified Identity Console
 * Combines Movement Identity, Backend Authentication, and Payment Verification
 * into a single sovereign identity management interface
 */
export default function UnifiedIdentityConsole({ walletAddress }) {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 py-10 px-4">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500 tracking-wider">
          🔐 Sovereign Identity Console
        </h1>
        <p className="text-gray-400 text-base max-w-2xl mx-auto">
          Unified identity, authentication, and payment verification powered by
          WebAuthn biometric security and backend verification.
        </p>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-lg bg-gradient-to-r from-gold-500/10 to-gold-500/5 border border-gold-500/30 text-gold-300 text-sm">
        <p className="flex items-center gap-2">
          <span>ℹ️</span>
          <span>
            <strong>Wallet Connected:</strong> {walletAddress?.slice(0, 10)}...
            {walletAddress?.slice(-8)}
          </span>
        </p>
      </div>

      {/* Panels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Movement Identity Panel */}
        <div className="md:col-span-1">
          <MovementIdentityPanel walletAddress={walletAddress} />
        </div>

        {/* Backend Identity Panel */}
        <div className="md:col-span-1">
          <BackendIdentityPanel walletAddress={walletAddress} />
        </div>
      </div>

      {/* Payment Panel - Full Width */}
      <div className="md:col-span-2">
        <MovementPaymentPanel walletAddress={walletAddress} />
      </div>

      {/* Footer Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 border-t border-gold-500/20">
        <div className="p-4 rounded-lg bg-black/50 border border-gold-500/10">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">
            Local Storage
          </p>
          <p className="text-sm text-gold-300">
            Movement Identity data persisted in browser
          </p>
        </div>

        <div className="p-4 rounded-lg bg-black/50 border border-gold-500/10">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">
            Backend Verified
          </p>
          <p className="text-sm text-gold-300">
            Identity and payments verified on backend
          </p>
        </div>

        <div className="p-4 rounded-lg bg-black/50 border border-gold-500/10">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">
            Blockchain Secured
          </p>
          <p className="text-sm text-gold-300">
            Payments settled with identity proof on-chain
          </p>
        </div>
      </div>

      {/* Security Notice */}
      <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-500/20 text-blue-300 text-xs">
        <p className="font-semibold mb-1">🛡️ Security Notice</p>
        <p>
          Your biometric data never leaves your device. Only cryptographic
          proofs are transmitted to the backend and blockchain.
        </p>
      </div>
    </div>
  );
}
