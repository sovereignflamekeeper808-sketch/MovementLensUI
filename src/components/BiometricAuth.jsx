'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  createMovementIdentity,
  bindWebAuthnToIdentity,
  verifyPaymentWithIdentity,
  listBoundCredentials,
  isBiometricAvailable,
} from '@/lib/identityBinding';
import {
  isBiometricAvailable as checkBiometricSupport,
  generateDemoBiometricHash,
} from '@/lib/biometric';

export default function BiometricAuth({
  walletAddress,
  paymentData,
  onAuthSuccess,
  onAuthError,
  isDemoMode = false,
}) {
  const [identity, setIdentity] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [biometricSupport, setBiometricSupport] = useState(false);
  const [boundCredentials, setBoundCredentials] = useState([]);
  const [selectedCredentialId, setSelectedCredentialId] = useState(null);
  const [authStatus, setAuthStatus] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('check'); // check, register, authenticate

  // Check biometric support on mount
  useEffect(() => {
    const checkSupport = async () => {
      const supported = await checkBiometricSupport();
      setBiometricSupport(supported || isDemoMode);
    };
    checkSupport();
  }, [isDemoMode]);

  // Initialize or load Movement Identity
  useEffect(() => {
    if (!walletAddress) return;

    const initializeIdentity = async () => {
      // Try to load from localStorage
      const stored = localStorage.getItem(
        `movement-identity-${walletAddress}`
      );

      if (stored) {
        try {
          const loadedIdentity = JSON.parse(stored);
          setIdentity(loadedIdentity);
          setBoundCredentials(
            loadedIdentity.webauthnCredentials.filter(
              (c) => c.status === 'active'
            )
          );
          setStep('authenticate');
        } catch (err) {
          console.error('Failed to load identity:', err);
          setError('Failed to load saved identity');
        }
      } else {
        // Create new identity
        const newIdentity = createMovementIdentity(walletAddress, {
          email: '', // Can be populated from user input
          createdAt: Date.now(),
        });
        setIdentity(newIdentity);
        localStorage.setItem(
          `movement-identity-${walletAddress}`,
          JSON.stringify(newIdentity)
        );
        setStep('register');
      }
    };

    initializeIdentity();
  }, [walletAddress]);

  // Register biometric for identity
  const handleRegisterBiometric = async () => {
    if (!identity || !biometricSupport) {
      setError('Biometric not supported on this device');
      return;
    }

    setIsScanning(true);
    setError(null);
    setAuthStatus('Registering biometric...');

    try {
      const result = await bindWebAuthnToIdentity(
        identity,
        walletAddress
      );

      if (result.success) {
        const updatedIdentity = result.identity;
        setIdentity(updatedIdentity);
        setBoundCredentials(
          updatedIdentity.webauthnCredentials.filter(
            (c) => c.status === 'active'
          )
        );

        // Save to localStorage
        localStorage.setItem(
          `movement-identity-${walletAddress}`,
          JSON.stringify(updatedIdentity)
        );

        setAuthStatus('Biometric registered successfully!');
        setStep('authenticate');

        // Auto-select the newly registered credential
        if (result.credentialBinding) {
          setSelectedCredentialId(result.credentialBinding.credentialId);
        }
      } else {
        setError(result.error || 'Failed to register biometric');
      }
    } catch (err) {
      setError(err.message);
      setAuthStatus(null);
    } finally {
      setIsScanning(false);
    }
  };

  // Authenticate with biometric
  const handleAuthenticatePayment = async () => {
    if (!identity) {
      setError('Identity not initialized');
      return;
    }

    if (!selectedCredentialId && boundCredentials.length > 0) {
      setError('Please select a credential');
      return;
    }

    if (boundCredentials.length === 0) {
      setError('No registered biometric credentials. Register one first.');
      setStep('register');
      return;
    }

    setIsScanning(true);
    setError(null);
    setAuthStatus('Scanning biometric...');

    try {
      let authResult;

      if (isDemoMode) {
        // Demo mode: generate mock biometric hash
        const demoHash = generateDemoBiometricHash(walletAddress);
        authResult = {
          success: true,
          identityId: identity.identityId,
          walletAddress: identity.walletAddress,
          biometricHash: demoHash,
          identityProofHash: demoHash,
          timestamp: Date.now(),
          credentialId: selectedCredentialId || boundCredentials[0].credentialId,
        };
      } else {
        // Production mode: use actual WebAuthn
        const credentialId = selectedCredentialId || boundCredentials[0].credentialId;
        authResult = await verifyPaymentWithIdentity(
          identity,
          credentialId,
          paymentData
        );
      }

      if (authResult.success) {
        setAuthStatus('Biometric verified! Authorizing payment...');

        // Update localStorage with latest credential usage
        localStorage.setItem(
          `movement-identity-${walletAddress}`,
          JSON.stringify(identity)
        );

        // Call success callback
        onAuthSuccess({
          ...authResult,
          identity,
        });
      } else {
        setError(authResult.error || 'Authentication failed');
        setAuthStatus(null);
      }
    } catch (err) {
      setError(err.message);
      setAuthStatus(null);
    } finally {
      setIsScanning(false);
    }
  };

  // Render based on step
  if (!biometricSupport && !isDemoMode) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 text-red-400">
        <p>⚠️ Biometric authentication not supported on this device</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#7C3AED]">
          Movement Identity Verification
        </h2>
        <p className="text-[#7C7C8C] text-sm mt-2">
          Bind your biometric to authorize this payment
        </p>
      </div>

      {/* Registration Step */}
      {step === 'register' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-b from-[#12121A] to-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-8 space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="text-5xl mb-4">🔐</div>
            <h3 className="text-xl font-semibold text-[#D4AF37]">
              Register Your Biometric
            </h3>
            <p className="text-[#7C7C8C] text-sm">
              Scan your fingerprint or face to bind to your Movement Identity
            </p>
          </div>

          <button
            onClick={handleRegisterBiometric}
            disabled={isScanning}
            className="w-full bg-gradient-to-r from-[#D4AF37] to-[#7C3AED] hover:opacity-90 disabled:opacity-50 text-[#0A0A0F] font-bold py-3 rounded-lg transition"
          >
            {isScanning ? 'Scanning...' : 'Start Biometric Registration'}
          </button>

          {isDemoMode && (
            <p className="text-xs text-[#7C7C8C] text-center italic">
              Demo Mode: Will generate mock biometric hash
            </p>
          )}
        </motion.div>
      )}

      {/* Authentication Step */}
      {step === 'authenticate' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-b from-[#12121A] to-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-8 space-y-6"
        >
          {/* Credential Selection */}
          {boundCredentials.length > 1 && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-[#D4AF37]">
                Select Biometric Credential
              </label>
              <select
                value={selectedCredentialId || ''}
                onChange={(e) => setSelectedCredentialId(e.target.value)}
                className="w-full bg-[#12121A] border border-[#1E1E2E] rounded-lg px-4 py-2 text-white"
              >
                <option value="">Choose a credential...</option>
                {boundCredentials.map((cred) => (
                  <option key={cred.credentialId} value={cred.credentialId}>
                    Credential registered{' '}
                    {new Date(cred.registeredAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Authentication UI */}
          <div className="text-center space-y-4">
            {isScanning && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-6xl mb-4"
              >
                👁️
              </motion.div>
            )}
            {!isScanning && <div className="text-5xl mb-4">👆</div>}

            <h3 className="text-xl font-semibold text-[#D4AF37]">
              {isScanning
                ? 'Scanning Biometric...'
                : 'Authorize Payment with Biometric'}
            </h3>
            <p className="text-[#7C7C8C] text-sm">
              {isScanning
                ? 'Keep your finger on the scanner'
                : 'Place your finger on the biometric sensor'}
            </p>
          </div>

          <button
            onClick={handleAuthenticatePayment}
            disabled={isScanning}
            className="w-full bg-gradient-to-r from-[#D4AF37] to-[#7C3AED] hover:opacity-90 disabled:opacity-50 text-[#0A0A0F] font-bold py-3 rounded-lg transition"
          >
            {isScanning ? 'Verifying...' : 'Verify with Biometric'}
          </button>

          <button
            onClick={() => setStep('register')}
            className="w-full bg-[#1E1E2E] hover:bg-[#2A2A3E] text-[#D4AF37] font-semibold py-2 rounded-lg transition text-sm"
          >
            Register New Credential
          </button>

          {isDemoMode && (
            <p className="text-xs text-[#7C7C8C] text-center italic">
              Demo Mode: Will generate mock biometric verification
            </p>
          )}
        </motion.div>
      )}

      {/* Status Messages */}
      {authStatus && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-[#10B981]/10 border border-[#10B981]/50 rounded-lg p-4 text-[#10B981] text-sm text-center"
        >
          {authStatus}
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm text-center"
        >
          ⚠️ {error}
        </motion.div>
      )}

      {/* Identity Info (Debug) */}
      {identity && (
        <div className="bg-[#1E1E2E]/50 rounded-lg p-4 text-xs text-[#7C7C8C] space-y-1">
          <p>
            <span className="text-[#D4AF37]">Identity ID:</span>{' '}
            {identity.identityId.slice(0, 16)}...
          </p>
          <p>
            <span className="text-[#D4AF37]">Wallet:</span>{' '}
            {identity.walletAddress}
          </p>
          <p>
            <span className="text-[#D4AF37]">Credentials:</span>{' '}
            {boundCredentials.length}
          </p>
        </div>
      )}
    </div>
  );
}
