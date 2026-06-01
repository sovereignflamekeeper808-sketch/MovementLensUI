'use client';

// 1CMC RLRJ — useIdentityBinding Hook
// React hook for managing Movement Identity binding state

import { useState, useCallback, useEffect } from 'react';
import {
  createMovementIdentity,
  bindWebAuthnToIdentity,
  verifyPaymentWithIdentity,
  listBoundCredentials,
  revokeCredentialBinding,
  exportIdentityBinding,
  importIdentityBinding,
} from '@/lib/identityBinding';

/**
 * Custom hook for Managing Movement Identity and WebAuthn binding
 * @param {string} walletAddress - User's wallet address
 * @returns {Object} Identity management state and methods
 */
export default function useIdentityBinding(walletAddress) {
  const [identity, setIdentity] = useState(null);
  const [boundCredentials, setBoundCredentials] = useState([]);
  const [selectedCredentialId, setSelectedCredentialId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize or load identity on wallet connection
  useEffect(() => {
    if (!walletAddress) {
      setIdentity(null);
      setBoundCredentials([]);
      setSelectedCredentialId(null);
      setIsInitialized(false);
      return;
    }

    const initializeIdentity = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Try to load from localStorage
        const storageKey = `movement-identity-${walletAddress}`;
        const stored = localStorage.getItem(storageKey);

        let loadedIdentity;

        if (stored) {
          try {
            loadedIdentity = importIdentityBinding(stored);
          } catch (err) {
            console.error('Failed to load stored identity:', err);
            // Create new if storage is corrupted
            loadedIdentity = createMovementIdentity(walletAddress);
          }
        } else {
          // Create new identity
          loadedIdentity = createMovementIdentity(walletAddress, {
            email: '', // Can be populated from user profile
            createdAt: Date.now(),
          });
        }

        setIdentity(loadedIdentity);

        // Update bound credentials list
        const activeCredentials = loadedIdentity.webauthnCredentials.filter(
          (c) => c.status === 'active'
        );
        setBoundCredentials(activeCredentials);

        // Auto-select first active credential
        if (activeCredentials.length > 0 && !selectedCredentialId) {
          setSelectedCredentialId(activeCredentials[0].credentialId);
        }

        setIsInitialized(true);
      } catch (err) {
        setError(err.message);
        setIsInitialized(true);
      } finally {
        setIsLoading(false);
      }
    };

    initializeIdentity();
  }, [walletAddress]);

  // Register a new biometric credential
  const registerBiometric = useCallback(
    async (userId) => {
      if (!identity) {
        setError('Identity not initialized');
        return { success: false, error: 'Identity not initialized' };
      }

      try {
        setIsLoading(true);
        setError(null);

        const result = await bindWebAuthnToIdentity(identity, userId);

        if (result.success) {
          const updatedIdentity = result.identity;
          setIdentity(updatedIdentity);

          // Update credentials list
          const activeCredentials = updatedIdentity.webauthnCredentials.filter(
            (c) => c.status === 'active'
          );
          setBoundCredentials(activeCredentials);

          // Auto-select newly registered credential
          if (result.credentialBinding) {
            setSelectedCredentialId(result.credentialBinding.credentialId);
          }

          // Save to localStorage
          const storageKey = `movement-identity-${walletAddress}`;
          localStorage.setItem(storageKey, exportIdentityBinding(updatedIdentity));

          return { success: true, credential: result.credentialBinding };
        } else {
          setError(result.error || 'Failed to register biometric');
          return { success: false, error: result.error };
        }
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsLoading(false);
      }
    },
    [identity, walletAddress]
  );

  // Verify a payment with biometric authentication
  const verifyPayment = useCallback(
    async (paymentData, credentialId = null) => {
      if (!identity) {
        setError('Identity not initialized');
        return { success: false, error: 'Identity not initialized' };
      }

      if (boundCredentials.length === 0) {
        setError('No registered biometric credentials');
        return {
          success: false,
          error: 'No registered biometric credentials',
          needsRegistration: true,
        };
      }

      const cred = credentialId || selectedCredentialId;
      if (!cred) {
        setError('Please select a credential');
        return { success: false, error: 'Please select a credential' };
      }

      try {
        setIsLoading(true);
        setError(null);

        const result = await verifyPaymentWithIdentity(
          identity,
          cred,
          paymentData
        );

        if (result.success) {
          // Save updated identity (with lastUsed timestamp)
          const storageKey = `movement-identity-${walletAddress}`;
          localStorage.setItem(storageKey, exportIdentityBinding(identity));

          return {
            success: true,
            ...result,
            identity,
          };
        } else {
          setError(result.error || 'Payment verification failed');
          return { success: false, error: result.error };
        }
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsLoading(false);
      }
    },
    [identity, selectedCredentialId, boundCredentials, walletAddress]
  );

  // Revoke a credential
  const revokeBiometric = useCallback(
    async (credentialId) => {
      if (!identity) {
        setError('Identity not initialized');
        return { success: false, error: 'Identity not initialized' };
      }

      try {
        setIsLoading(true);
        setError(null);

        const result = revokeCredentialBinding(identity, credentialId);

        if (result.success) {
          const updatedIdentity = result.identity;
          setIdentity(updatedIdentity);

          // Update credentials list
          const activeCredentials = updatedIdentity.webauthnCredentials.filter(
            (c) => c.status === 'active'
          );
          setBoundCredentials(activeCredentials);

          // If revoked credential was selected, select a new one
          if (selectedCredentialId === credentialId) {
            if (activeCredentials.length > 0) {
              setSelectedCredentialId(activeCredentials[0].credentialId);
            } else {
              setSelectedCredentialId(null);
            }
          }

          // Save to localStorage
          const storageKey = `movement-identity-${walletAddress}`;
          localStorage.setItem(storageKey, exportIdentityBinding(updatedIdentity));

          return { success: true };
        } else {
          setError(result.error || 'Failed to revoke credential');
          return { success: false, error: result.error };
        }
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsLoading(false);
      }
    },
    [identity, selectedCredentialId, walletAddress]
  );

  // Clear identity (on logout)
  const clearIdentity = useCallback(() => {
    if (walletAddress) {
      const storageKey = `movement-identity-${walletAddress}`;
      localStorage.removeItem(storageKey);
    }
    setIdentity(null);
    setBoundCredentials([]);
    setSelectedCredentialId(null);
    setError(null);
  }, [walletAddress]);

  return {
    // State
    identity,
    boundCredentials,
    selectedCredentialId,
    isLoading,
    error,
    isInitialized,
    hasCredentials: boundCredentials.length > 0,

    // Actions
    registerBiometric,
    verifyPayment,
    revokeBiometric,
    clearIdentity,
    setSelectedCredentialId,
  };
}
