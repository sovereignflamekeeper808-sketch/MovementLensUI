// 1CMC RLRJ — Movement Identity WebAuthn Binding
// Bind Movement Identity (wallet address + user metadata) to WebAuthn credentials

import { ethers } from "ethers";

/**
 * Create a Movement Identity binding record
 * @param {string} walletAddress - Ethereum wallet address
 * @param {Object} metadata - User metadata (name, email, etc.)
 * @returns {Object} Identity binding data
 */
export function createMovementIdentity(walletAddress, metadata = {}) {
  if (!ethers.isAddress(walletAddress)) {
    throw new Error("Invalid wallet address");
  }

  const identityId = ethers.keccak256(
    ethers.toUtf8Bytes(`movement-identity-${walletAddress}`)
  );

  return {
    identityId,
    walletAddress: ethers.getAddress(walletAddress), // Checksummed
    metadata: {
      createdAt: Date.now(),
      ...metadata,
    },
    webauthnCredentials: [],
    status: "active",
  };
}

/**
 * Register a WebAuthn credential and bind it to a Movement Identity
 * @param {Object} identity - Movement Identity object
 * @param {string} userId - User ID for WebAuthn registration
 * @returns {Promise<Object>} Updated identity with new credential binding
 */
export async function bindWebAuthnToIdentity(identity, userId) {
  const challenge = crypto.getRandomValues(new Uint8Array(32));

  const publicKeyOptions = {
    challenge,
    rp: {
      name: "Movement Lens | 1CMC RLRJ",
      id: window.location.hostname,
    },
    user: {
      id: new TextEncoder().encode(identity.identityId),
      name: userId,
      displayName: `Movement Identity: ${identity.walletAddress}`,
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

    if (!credential) {
      return {
        success: false,
        error: "Credential creation failed",
      };
    }

    // Generate credential binding hash
    const bindingData = {
      identityId: identity.identityId,
      walletAddress: identity.walletAddress,
      credentialId: bufferToBase64(credential.rawId),
      createdAt: Date.now(),
    };

    const bindingHash = ethers.keccak256(
      ethers.toUtf8Bytes(JSON.stringify(bindingData))
    );

    const credentialBinding = {
      credentialId: bufferToBase64(credential.rawId),
      bindingHash,
      publicKey: bufferToBase64(
        credential.response.getPublicKey
          ? credential.response.getPublicKey()
          : credential.response.attestationObject
      ),
      bindingData,
      registeredAt: Date.now(),
      lastUsed: null,
      status: "active",
    };

    // Add to identity
    identity.webauthnCredentials.push(credentialBinding);

    return {
      success: true,
      identity,
      credentialBinding,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Verify a payment using the bound WebAuthn credential and Movement Identity
 * @param {Object} identity - Movement Identity object
 * @param {string} credentialId - Credential ID to use for authentication
 * @param {Object} paymentData - Payment details
 * @returns {Promise<Object>} Verification result with identity proof
 */
export async function verifyPaymentWithIdentity(
  identity,
  credentialId,
  paymentData
) {
  if (!identity.identityId) {
    return {
      success: false,
      error: "Invalid Movement Identity",
    };
  }

  // Find the credential binding
  const credentialBinding = identity.webauthnCredentials.find(
    (cred) => cred.credentialId === credentialId
  );

  if (!credentialBinding) {
    return {
      success: false,
      error: "Credential not bound to this identity",
    };
  }

  // Create challenge that includes identity verification
  const challenge = new TextEncoder().encode(
    JSON.stringify({
      action: "movement_lens_payment",
      identityId: identity.identityId,
      walletAddress: identity.walletAddress,
      paymentData,
      timestamp: Date.now(),
    })
  );

  const publicKeyOptions = {
    challenge,
    rpId: window.location.hostname,
    allowCredentials: [
      {
        type: "public-key",
        id: base64ToBuffer(credentialId),
      },
    ],
    userVerification: "required",
    timeout: 60000,
  };

  try {
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyOptions,
    });

    if (!assertion) {
      return {
        success: false,
        error: "Authentication failed",
      };
    }

    // Generate verification hash
    const authData = new Uint8Array(assertion.response.authenticatorData);
    const signature = new Uint8Array(assertion.response.signature);
    const combined = new Uint8Array([...authData, ...signature]);
    const biometricHash = ethers.keccak256(combined);

    // Create identity proof
    const identityProof = ethers.solidityPacked(
      ["bytes32", "address", "bytes32"],
      [identity.identityId, identity.walletAddress, biometricHash]
    );

    const identityProofHash = ethers.keccak256(identityProof);

    // Update last used
    credentialBinding.lastUsed = Date.now();

    return {
      success: true,
      identityId: identity.identityId,
      walletAddress: identity.walletAddress,
      biometricHash,
      identityProof,
      identityProofHash,
      timestamp: Date.now(),
      credentialId: bufferToBase64(assertion.rawId),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * List all WebAuthn credentials bound to a Movement Identity
 * @param {Object} identity - Movement Identity object
 * @returns {Array} Array of credential metadata
 */
export function listBoundCredentials(identity) {
  return identity.webauthnCredentials.map((cred) => ({
    credentialId: cred.credentialId,
    bindingHash: cred.bindingHash,
    registeredAt: cred.registeredAt,
    lastUsed: cred.lastUsed,
    status: cred.status,
  }));
}

/**
 * Revoke a WebAuthn credential from a Movement Identity
 * @param {Object} identity - Movement Identity object
 * @param {string} credentialId - Credential ID to revoke
 * @returns {Object} Updated identity
 */
export function revokeCredentialBinding(identity, credentialId) {
  const credentialIndex = identity.webauthnCredentials.findIndex(
    (cred) => cred.credentialId === credentialId
  );

  if (credentialIndex === -1) {
    return {
      success: false,
      error: "Credential not found",
    };
  }

  identity.webauthnCredentials[credentialIndex].status = "revoked";
  identity.webauthnCredentials[credentialIndex].revokedAt = Date.now();

  return {
    success: true,
    identity,
  };
}

/**
 * Export identity binding data for storage
 * @param {Object} identity - Movement Identity object
 * @returns {string} JSON stringified identity
 */
export function exportIdentityBinding(identity) {
  return JSON.stringify(identity);
}

/**
 * Import identity binding data from storage
 * @param {string} identityJson - JSON stringified identity
 * @returns {Object} Movement Identity object
 */
export function importIdentityBinding(identityJson) {
  try {
    return JSON.parse(identityJson);
  } catch (error) {
    throw new Error("Invalid identity binding data");
  }
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
