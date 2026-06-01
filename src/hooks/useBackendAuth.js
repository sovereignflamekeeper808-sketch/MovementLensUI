'use client';

// 1CMC RLRJ — useBackendAuth Hook
// React hook for backend authentication and state management

import { useState, useCallback, useEffect } from 'react';
import { authService } from '@/lib/authService';
import useIdentityBinding from '@/hooks/useIdentityBinding';

/**
 * Custom hook for backend authentication with Movement Identity
 * @param {string} walletAddress - User's wallet address
 * @returns {Object} Authentication state and methods
 */
export default function useBackendAuth(walletAddress) {
  const {
    identity,
    verifyPayment: verifyPaymentLocal,
    isInitialized: identityInitialized,
  } = useIdentityBinding(walletAddress);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getToken();
      if (token) {
        setAuthToken(token);
        setIsAuthenticated(true);
      }
    };

    initAuth();
  }, []);

  // Register identity with backend
  const registerWithBackend = useCallback(
    async (metadata = {}) => {
      if (!identity || !walletAddress) {
        setError('Identity not initialized');
        return { success: false, error: 'Identity not initialized' };
      }

      try {
        setIsLoading(true);
        setError(null);

        const result = await authService.registerIdentity(walletAddress, identity);

        if (result.success) {
          setIsAuthenticated(true);
          setAuthToken(result.token);
          setUser({
            userId: result.userId,
            walletAddress,
            identityId: identity.identityId,
          });

          return { success: true, userId: result.userId };
        } else {
          setError(result.error || 'Registration failed');
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

  // Authenticate with biometric proof
  const authenticateWithBiometric = useCallback(
    async (biometricProof) => {
      if (!walletAddress) {
        setError('Wallet address not available');
        return { success: false, error: 'Wallet address not available' };
      }

      try {
        setIsLoading(true);
        setError(null);

        const result = await authService.authenticateWithBiometric(
          walletAddress,
          biometricProof
        );

        if (result.success) {
          setIsAuthenticated(true);
          setAuthToken(result.token);

          return {
            success: true,
            token: result.token,
            sessionExpiry: result.sessionExpiry,
          };
        } else {
          setError(result.error || 'Authentication failed');
          return { success: false, error: result.error };
        }
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsLoading(false);
      }
    },
    [walletAddress]
  );

  // Verify and submit payment
  const submitPaymentWithVerification = useCallback(
    async (paymentData, credentialId = null) => {
      if (!isAuthenticated) {
        setError('Not authenticated with backend');
        return { success: false, error: 'Not authenticated with backend' };
      }

      try {
        setIsLoading(true);
        setError(null);

        // Step 1: Verify payment locally with biometric
        const biometricResult = await verifyPaymentLocal(paymentData, credentialId);

        if (!biometricResult.success) {
          setError(biometricResult.error || 'Biometric verification failed');
          return { success: false, error: biometricResult.error };
        }

        // Step 2: Verify with backend
        const backendVerification = await authService.verifyPayment(
          walletAddress,
          paymentData,
          biometricResult
        );

        if (!backendVerification.success) {
          setError(backendVerification.error || 'Backend verification failed');
          return { success: false, error: backendVerification.error };
        }

        return {
          success: true,
          verificationNonce: backendVerification.verificationNonce,
          biometricProof: biometricResult,
          expiresAt: backendVerification.expiresAt,
        };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, walletAddress, verifyPaymentLocal]
  );

  // Submit transaction hash after blockchain confirmation
  const submitTransactionHash = useCallback(
    async (verificationNonce, txHash) => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await authService.submitPaymentTxHash(
          walletAddress,
          verificationNonce,
          txHash
        );

        if (result.success) {
          return {
            success: true,
            paymentId: result.paymentId,
            status: result.status,
          };
        } else {
          setError(result.error || 'Transaction submission failed');
          return { success: false, error: result.error };
        }
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsLoading(false);
      }
    },
    [walletAddress]
  );

  // Register credential with backend
  const registerCredentialWithBackend = useCallback(
    async (credentialBinding) => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await authService.registerCredential(
          walletAddress,
          credentialBinding
        );

        if (result.success) {
          return { success: true, backendId: result.backendId };
        } else {
          setError(result.error || 'Credential registration failed');
          return { success: false, error: result.error };
        }
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsLoading(false);
      }
    },
    [walletAddress]
  );

  // Get user identity from backend
  const fetchUserIdentity = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await authService.getUserIdentity(walletAddress);

      if (result.success) {
        return { success: true, ...result };
      } else {
        setError(result.error || 'Failed to fetch identity');
        return { success: false, error: result.error };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  // Get payment history from backend
  const fetchPaymentHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await authService.getPaymentHistory(walletAddress);

      if (result.success) {
        return { success: true, payments: result.payments };
      } else {
        setError(result.error || 'Failed to fetch payment history');
        return { success: false, error: result.error };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  // Logout
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setIsAuthenticated(false);
      setAuthToken(null);
      setUser(null);
      setError(null);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // Auth state
    isAuthenticated,
    authToken,
    user,
    isLoading,
    error,
    isInitialized: identityInitialized && isAuthenticated,

    // Auth methods
    registerWithBackend,
    authenticateWithBiometric,
    logout,

    // Payment methods
    submitPaymentWithVerification,
    submitTransactionHash,
    registerCredentialWithBackend,

    // Data fetching
    fetchUserIdentity,
    fetchPaymentHistory,
  };
}
