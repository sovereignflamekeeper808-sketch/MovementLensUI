// 1CMC RLRJ — Movement Identity Authentication Backend Service
// Secure communication between frontend and backend for identity verification

import { ethers } from 'ethers';

/**
 * Backend Authentication Service
 * Handles secure communication with the backend for identity verification
 */
export class MovementAuthService {
  constructor(baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') {
    this.baseURL = baseURL;
    this.token = null;
  }

  /**
   * Set authentication token from localStorage
   */
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('movement-auth-token', token);
    }
  }

  /**
   * Get stored authentication token
   */
  getToken() {
    if (this.token) return this.token;
    this.token = localStorage.getItem('movement-auth-token');
    return this.token;
  }

  /**
   * Clear authentication token
   */
  clearToken() {
    this.token = null;
    localStorage.removeItem('movement-auth-token');
  }

  /**
   * Make authenticated API request
   */
  private async request(
    endpoint,
    options = {}
  ) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Register a new user/identity with the backend
   * @param {string} walletAddress - User's wallet address
   * @param {Object} identityData - Movement Identity object
   * @returns {Promise<Object>} Registration result with auth token
   */
  async registerIdentity(walletAddress, identityData) {
    try {
      const response = await this.request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          walletAddress: ethers.getAddress(walletAddress),
          identityId: identityData.identityId,
          metadata: identityData.metadata,
          credentialCount: identityData.webauthnCredentials.length,
        }),
      });

      if (response.token) {
        this.setToken(response.token);
      }

      return {
        success: true,
        userId: response.userId,
        token: response.token,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Authenticate user with biometric proof
   * @param {string} walletAddress - User's wallet address
   * @param {Object} biometricProof - Identity proof from verifyPaymentWithIdentity
   * @returns {Promise<Object>} Authentication result with session token
   */
  async authenticateWithBiometric(walletAddress, biometricProof) {
    try {
      const response = await this.request('/api/auth/biometric-login', {
        method: 'POST',
        body: JSON.stringify({
          walletAddress: ethers.getAddress(walletAddress),
          identityId: biometricProof.identityId,
          identityProofHash: biometricProof.identityProofHash,
          biometricHash: biometricProof.biometricHash,
          timestamp: biometricProof.timestamp,
        }),
      });

      if (response.token) {
        this.setToken(response.token);
      }

      return {
        success: true,
        token: response.token,
        sessionExpiry: response.sessionExpiry,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Register a WebAuthn credential with backend
   * @param {string} walletAddress - User's wallet address
   * @param {Object} credentialBinding - Credential binding data from identityBinding.js
   * @returns {Promise<Object>} Registration confirmation
   */
  async registerCredential(walletAddress, credentialBinding) {
    try {
      const response = await this.request('/api/credentials/register', {
        method: 'POST',
        body: JSON.stringify({
          walletAddress: ethers.getAddress(walletAddress),
          credentialId: credentialBinding.credentialId,
          bindingHash: credentialBinding.bindingHash,
          publicKey: credentialBinding.publicKey,
          registeredAt: credentialBinding.registeredAt,
        }),
      });

      return {
        success: true,
        credentialId: response.credentialId,
        backendId: response.backendId,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Verify payment with backend before submission to blockchain
   * @param {string} walletAddress - User's wallet address
   * @param {Object} paymentData - Payment details
   * @param {Object} biometricProof - Identity proof
   * @returns {Promise<Object>} Verification confirmation with nonce
   */
  async verifyPayment(walletAddress, paymentData, biometricProof) {
    try {
      const response = await this.request('/api/payments/verify', {
        method: 'POST',
        body: JSON.stringify({
          walletAddress: ethers.getAddress(walletAddress),
          amount: paymentData.amount,
          recipient: ethers.getAddress(paymentData.recipient),
          chain: paymentData.chain,
          identityProofHash: biometricProof.identityProofHash,
          biometricHash: biometricProof.biometricHash,
          timestamp: biometricProof.timestamp,
        }),
      });

      return {
        success: true,
        verificationNonce: response.verificationNonce,
        expiresAt: response.expiresAt,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Submit verified payment to blockchain
   * @param {string} walletAddress - User's wallet address
   * @param {string} verificationNonce - Nonce from verifyPayment
   * @param {string} txHash - Transaction hash from blockchain
   * @returns {Promise<Object>} Submission confirmation
   */
  async submitPaymentTxHash(walletAddress, verificationNonce, txHash) {
    try {
      const response = await this.request('/api/payments/submit', {
        method: 'POST',
        body: JSON.stringify({
          walletAddress: ethers.getAddress(walletAddress),
          verificationNonce,
          txHash,
        }),
      });

      return {
        success: true,
        paymentId: response.paymentId,
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Revoke a credential on backend
   * @param {string} walletAddress - User's wallet address
   * @param {string} credentialId - Credential ID to revoke
   * @returns {Promise<Object>} Revocation confirmation
   */
  async revokeCredential(walletAddress, credentialId) {
    try {
      const response = await this.request('/api/credentials/revoke', {
        method: 'POST',
        body: JSON.stringify({
          walletAddress: ethers.getAddress(walletAddress),
          credentialId,
        }),
      });

      return {
        success: true,
        revokedAt: response.revokedAt,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get user's identity and credentials from backend
   * @param {string} walletAddress - User's wallet address
   * @returns {Promise<Object>} User identity data
   */
  async getUserIdentity(walletAddress) {
    try {
      const response = await this.request(
        `/api/users/${ethers.getAddress(walletAddress)}/identity`
      );

      return {
        success: true,
        identity: response.identity,
        credentials: response.credentials,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get payment history from backend
   * @param {string} walletAddress - User's wallet address
   * @returns {Promise<Object>} Payment history
   */
  async getPaymentHistory(walletAddress) {
    try {
      const response = await this.request(
        `/api/users/${ethers.getAddress(walletAddress)}/payments`
      );

      return {
        success: true,
        payments: response.payments,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Logout and clear authentication
   * @returns {Promise<Object>} Logout confirmation
   */
  async logout() {
    try {
      await this.request('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearToken();
    }

    return { success: true };
  }
}

// Export singleton instance
export const authService = new MovementAuthService();
