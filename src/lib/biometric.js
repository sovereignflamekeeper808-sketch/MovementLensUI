// 1CMC RLRJ — Movement Lens Biometric Authentication
// WebAuthn-based biometric auth for sovereign payment authorization

import { ethers } from "ethers";

/**
 * Check if the device supports WebAuthn biometric authentication
 */
export async function isBiometricAvailable() {
  if (!window.PublicKeyCredential) return false;

  try {
    const available =
      await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch {
    return false;
  }
}

/**
 * Register a new biometric credential for Movement Lens
 * @param {string} userId - User wallet address
 * @returns {Object} Credential registration result
 */
export async function registerBiometric(userId) {
  const challenge = crypto.getRandomValues(new Uint8Array(32));

  const publicKeyOptions = {
    challenge,
    rp: {
      name: "Movement Lens | 1CMC RLRJ",
      id: window.location.hostname,
    },
    user: {
      id: new TextEncoder().encode(userId),
      name: userId,
      displayName: "Movement Lens User",
    },
    pubKeyCredParams: [
      { type: "public-key", alg: -7 }, // ES256
      { type: "public-key", alg: -257 }, // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      userVerification: "required",
      residentKey: "preferred",
    },
    timeout: 60000,
    attestation: "none",
  };

  try {
    const credential = await navigator.credentials.create({
      publicKey: publicKeyOptions,
    });

    return {
      success: true,
      credentialId: bufferToBase64(credential.rawId),
      publicKey: bufferToBase64(
        credential.response.getPublicKey
          ? credential.response.getPublicKey()
          : credential.response.attestationObject
      ),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Authenticate with biometrics for a payment
 * @param {string} credentialId - Previously registered credential ID
 * @param {string} paymentData - Payment details to sign
 * @returns {Object} Authentication result with biometric hash
 */
export async function authenticatePayment(credentialId, paymentData) {
  const challenge = new TextEncoder().encode(
    JSON.stringify({
      action: "movement_lens_payment",
      data: paymentData,
      timestamp: Date.now(),
    })
  );

  const publicKeyOptions = {
    challenge,
    rpId: window.location.hostname,
    allowCredentials: credentialId
      ? [
          {
            type: "public-key",
            id: base64ToBuffer(credentialId),
          },
        ]
      : [],
    userVerification: "required",
    timeout: 60000,
  };

  try {
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyOptions,
    });

    // Generate biometric hash from the authenticator response
    const authData = new Uint8Array(assertion.response.authenticatorData);
    const signature = new Uint8Array(assertion.response.signature);

    // Create a keccak256 hash for on-chain verification
    const combined = new Uint8Array([...authData, ...signature]);
    const biometricHash = ethers.keccak256(combined);

    return {
      success: true,
      biometricHash,
      credentialId: bufferToBase64(assertion.rawId),
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Generate a simulated biometric hash for demo/testnet use
 * @param {string} walletAddress - User's wallet address
 * @returns {string} bytes32 biometric hash
 */
export function generateDemoBiometricHash(walletAddress) {
  const data = `movement-lens-biometric-${walletAddress}-${Date.now()}`;
  return ethers.keccak256(ethers.toUtf8Bytes(data));
}

// Utility functions
function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
