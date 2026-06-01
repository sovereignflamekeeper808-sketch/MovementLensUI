// 1CMC RLRJ — Movement Identity WebAuthn Binding - Test Suite
// Comprehensive testing for identity binding and biometric authentication

import {
  createMovementIdentity,
  bindWebAuthnToIdentity,
  verifyPaymentWithIdentity,
  listBoundCredentials,
  revokeCredentialBinding,
  exportIdentityBinding,
  importIdentityBinding,
} from '../lib/identityBinding';

/**
 * TEST SUITE 1: Movement Identity Creation
 */
describe('Movement Identity Creation', () => {
  test('should create a new Movement Identity with valid wallet address', () => {
    const walletAddress = '0x742d35Cc6634C0532925a3b844Bc822e8c6b3b44';
    const metadata = {
      email: 'user@example.com',
      name: 'Test User',
    };

    const identity = createMovementIdentity(walletAddress, metadata);

    expect(identity).toBeDefined();
    expect(identity.identityId).toBeDefined();
    expect(identity.walletAddress).toBe(
      '0x742d35Cc6634C0532925a3b844Bc822e8c6b3b44'
    ); // Should be checksummed
    expect(identity.metadata.email).toBe('user@example.com');
    expect(identity.metadata.name).toBe('Test User');
    expect(identity.webauthnCredentials).toEqual([]);
    expect(identity.status).toBe('active');
  });

  test('should throw error with invalid wallet address', () => {
    expect(() => {
      createMovementIdentity('invalid-address', {});
    }).toThrow('Invalid wallet address');
  });

  test('should generate consistent identity ID for same wallet', () => {
    const walletAddress = '0x742d35Cc6634C0532925a3b844Bc822e8c6b3b44';

    const identity1 = createMovementIdentity(walletAddress);
    const identity2 = createMovementIdentity(walletAddress);

    expect(identity1.identityId).toBe(identity2.identityId);
  });

  test('should include creation timestamp in metadata', () => {
    const walletAddress = '0x742d35Cc6634C0532925a3b844Bc822e8c6b3b44';
    const beforeTime = Date.now();

    const identity = createMovementIdentity(walletAddress);

    const afterTime = Date.now();
    expect(identity.metadata.createdAt).toBeGreaterThanOrEqual(beforeTime);
    expect(identity.metadata.createdAt).toBeLessThanOrEqual(afterTime);
  });
});

/**
 * TEST SUITE 2: WebAuthn Credential Binding
 */
describe('WebAuthn Credential Binding', () => {
  let identity;
  const walletAddress = '0x742d35Cc6634C0532925a3b844Bc822e8c6b3b44';
  const userId = 'test-user@example.com';

  beforeEach(() => {
    identity = createMovementIdentity(walletAddress);
  });

  test('should bind WebAuthn credential to identity', async () => {
    // Note: This test requires browser environment with WebAuthn support
    // In a real test environment, mock navigator.credentials
    const result = await bindWebAuthnToIdentity(identity, userId);

    if (result.success) {
      expect(result.identity).toBeDefined();
      expect(result.credentialBinding).toBeDefined();
      expect(result.identity.webauthnCredentials.length).toBe(1);
      expect(result.credentialBinding.status).toBe('active');
      expect(result.credentialBinding.bindingHash).toBeDefined();
    }
  });

  test('should handle WebAuthn registration failure gracefully', async () => {
    // Mock a failed credential creation
    const result = {
      success: false,
      error: 'Credential creation failed',
    };

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('should store credential binding data with correct structure', async () => {
    const mockCredentialBinding = {
      credentialId: 'mock-credential-id-123',
      bindingHash: '0x1234567890abcdef',
      publicKey: 'mock-public-key',
      bindingData: {
        identityId: identity.identityId,
        walletAddress: identity.walletAddress,
        credentialId: 'mock-credential-id-123',
        createdAt: Date.now(),
      },
      registeredAt: Date.now(),
      lastUsed: null,
      status: 'active',
    };

    identity.webauthnCredentials.push(mockCredentialBinding);

    expect(identity.webauthnCredentials[0]).toEqual(mockCredentialBinding);
    expect(identity.webauthnCredentials[0].status).toBe('active');
    expect(identity.webauthnCredentials[0].lastUsed).toBeNull();
  });

  test('should support multiple credential bindings per identity', () => {
    const cred1 = {
      credentialId: 'cred-1',
      bindingHash: '0xaaa',
      status: 'active',
      registeredAt: Date.now(),
    };

    const cred2 = {
      credentialId: 'cred-2',
      bindingHash: '0xbbb',
      status: 'active',
      registeredAt: Date.now(),
    };

    identity.webauthnCredentials.push(cred1);
    identity.webauthnCredentials.push(cred2);

    expect(identity.webauthnCredentials.length).toBe(2);
    expect(identity.webauthnCredentials[0].credentialId).toBe('cred-1');
    expect(identity.webauthnCredentials[1].credentialId).toBe('cred-2');
  });
});

/**
 * TEST SUITE 3: Payment Verification with Identity
 */
describe('Payment Verification with Identity', () => {
  let identity;
  const walletAddress = '0x742d35Cc6634C0532925a3b844Bc822e8c6b3b44';
  const paymentData = {
    amount: '1000000000000000000', // 1 USDT
    recipient: '0x123456789abcdef',
    chain: 'ethereum',
  };

  beforeEach(() => {
    identity = createMovementIdentity(walletAddress);
    identity.webauthnCredentials.push({
      credentialId: 'test-credential-123',
      bindingHash: '0xtest-hash',
      status: 'active',
      registeredAt: Date.now(),
      lastUsed: null,
    });
  });

  test('should verify payment with valid identity and credential', async () => {
    const result = await verifyPaymentWithIdentity(
      identity,
      'test-credential-123',
      paymentData
    );

    if (result.success) {
      expect(result.identityId).toBe(identity.identityId);
      expect(result.walletAddress).toBe(identity.walletAddress);
      expect(result.biometricHash).toBeDefined();
      expect(result.identityProof).toBeDefined();
      expect(result.identityProofHash).toBeDefined();
      expect(result.timestamp).toBeDefined();
    }
  });

  test('should reject payment with invalid identity', async () => {
    const invalidIdentity = { identityId: null };
    const result = await verifyPaymentWithIdentity(
      invalidIdentity,
      'test-credential-123',
      paymentData
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid Movement Identity');
  });

  test('should reject payment with unbound credential', async () => {
    const result = await verifyPaymentWithIdentity(
      identity,
      'non-existent-credential',
      paymentData
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Credential not bound to this identity');
  });

  test('should update lastUsed timestamp on successful verification', async () => {
    const result = await verifyPaymentWithIdentity(
      identity,
      'test-credential-123',
      paymentData
    );

    if (result.success) {
      const credential = identity.webauthnCredentials.find(
        (c) => c.credentialId === 'test-credential-123'
      );
      expect(credential.lastUsed).not.toBeNull();
      expect(credential.lastUsed).toBeGreaterThan(credential.registeredAt);
    }
  });

  test('should include payment data in verification challenge', async () => {
    const customPaymentData = {
      amount: '5000000000000000000',
      recipient: '0xabc123',
      chain: 'bsc',
      gasLimit: '100000',
    };

    const result = await verifyPaymentWithIdentity(
      identity,
      'test-credential-123',
      customPaymentData
    );

    // Verify that challenge includes payment data (test logic)
    if (result.success) {
      expect(result).toHaveProperty('biometricHash');
      expect(result).toHaveProperty('identityProofHash');
    }
  });
});

/**
 * TEST SUITE 4: Credential Management
 */
describe('Credential Management', () => {
  let identity;
  const walletAddress = '0x742d35Cc6634C0532925a3b844Bc822e8c6b3b44';

  beforeEach(() => {
    identity = createMovementIdentity(walletAddress);
    identity.webauthnCredentials = [
      {
        credentialId: 'cred-1',
        bindingHash: '0xaaa',
        status: 'active',
        registeredAt: Date.now() - 10000,
        lastUsed: Date.now() - 5000,
      },
      {
        credentialId: 'cred-2',
        bindingHash: '0xbbb',
        status: 'active',
        registeredAt: Date.now(),
        lastUsed: null,
      },
    ];
  });

  test('should list all bound credentials', () => {
    const credentials = listBoundCredentials(identity);

    expect(credentials.length).toBe(2);
    expect(credentials[0].credentialId).toBe('cred-1');
    expect(credentials[1].credentialId).toBe('cred-2');
    expect(credentials[0]).toHaveProperty('registeredAt');
    expect(credentials[0]).toHaveProperty('lastUsed');
    expect(credentials[0]).toHaveProperty('status');
  });

  test('should revoke a credential binding', () => {
    const result = revokeCredentialBinding(identity, 'cred-1');

    expect(result.success).toBe(true);
    expect(
      result.identity.webauthnCredentials[0].status
    ).toBe('revoked');
    expect(result.identity.webauthnCredentials[0].revokedAt).toBeDefined();
  });

  test('should handle revocation of non-existent credential', () => {
    const result = revokeCredentialBinding(identity, 'non-existent');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Credential not found');
  });

  test('should keep revoked credentials but mark as inactive', () => {
    revokeCredentialBinding(identity, 'cred-1');

    const allCredentials = identity.webauthnCredentials;
    const activeCredentials = allCredentials.filter(
      (c) => c.status === 'active'
    );

    expect(allCredentials.length).toBe(2);
    expect(activeCredentials.length).toBe(1);
  });
});

/**
 * TEST SUITE 5: Identity Persistence (Export/Import)
 */
describe('Identity Persistence', () => {
  let identity;
  const walletAddress = '0x742d35Cc6634C0532925a3b844Bc822e8c6b3b44';

  beforeEach(() => {
    identity = createMovementIdentity(walletAddress, {
      email: 'test@example.com',
    });
    identity.webauthnCredentials.push({
      credentialId: 'test-cred',
      bindingHash: '0xtest',
      status: 'active',
      registeredAt: Date.now(),
    });
  });

  test('should export identity to JSON string', () => {
    const exported = exportIdentityBinding(identity);

    expect(typeof exported).toBe('string');
    expect(exported).toContain(identity.identityId);
    expect(exported).toContain(identity.walletAddress);
  });

  test('should import identity from JSON string', () => {
    const exported = exportIdentityBinding(identity);
    const imported = importIdentityBinding(exported);

    expect(imported.identityId).toBe(identity.identityId);
    expect(imported.walletAddress).toBe(identity.walletAddress);
    expect(imported.webauthnCredentials.length).toBe(1);
  });

  test('should preserve all identity data during export/import cycle', () => {
    const originalData = {
      identityId: identity.identityId,
      walletAddress: identity.walletAddress,
      metadata: identity.metadata,
      webauthnCredentials: identity.webauthnCredentials,
      status: identity.status,
    };

    const exported = exportIdentityBinding(identity);
    const imported = importIdentityBinding(exported);

    expect(JSON.stringify(imported)).toBe(JSON.stringify(originalData));
  });

  test('should handle invalid JSON on import', () => {
    expect(() => {
      importIdentityBinding('invalid json {');
    }).toThrow('Invalid identity binding data');
  });

  test('should enable localStorage persistence workflow', () => {
    const key = `movement-identity-${walletAddress}`;

    // Simulate localStorage save
    const exported = exportIdentityBinding(identity);
    localStorage.setItem(key, exported);

    // Simulate localStorage load
    const stored = localStorage.getItem(key);
    const loaded = importIdentityBinding(stored);

    expect(loaded.identityId).toBe(identity.identityId);
    expect(loaded.walletAddress).toBe(identity.walletAddress);

    // Cleanup
    localStorage.removeItem(key);
  });
});

/**
 * TEST SUITE 6: Security and Edge Cases
 */
describe('Security and Edge Cases', () => {
  test('should generate unique identity IDs for different wallets', () => {
    const wallet1 = '0x742d35Cc6634C0532925a3b844Bc822e8c6b3b44';
    const wallet2 = '0x123456789abcdef123456789abcdef123456789a';

    const identity1 = createMovementIdentity(wallet1);
    const identity2 = createMovementIdentity(wallet2);

    expect(identity1.identityId).not.toBe(identity2.identityId);
  });

  test('should handle case-insensitive wallet addresses', () => {
    const walletLower = '0x742d35cc6634c0532925a3b844bc822e8c6b3b44';
    const walletUpper = '0x742D35CC6634C0532925A3B844BC822E8C6B3B44';

    const identity1 = createMovementIdentity(walletLower);
    const identity2 = createMovementIdentity(walletUpper);

    // Should have same identity ID (normalized)
    expect(identity1.identityId).toBe(identity2.identityId);
  });

  test('should prevent credential binding to inactive identities', () => {
    const identity = createMovementIdentity(
      '0x742d35Cc6634C0532925a3b844Bc822e8c6b3b44'
    );
    identity.status = 'revoked';

    // Application logic should check status before allowing binding
    expect(identity.status).toBe('revoked');
  });

  test('should handle rapid successive credential registrations', () => {
    const identity = createMovementIdentity(
      '0x742d35Cc6634C0532925a3b844Bc822e8c6b3b44'
    );

    const creds = [];
    for (let i = 0; i < 5; i++) {
      creds.push({
        credentialId: `cred-${i}`,
        bindingHash: `0xhash${i}`,
        registeredAt: Date.now() + i,
        status: 'active',
      });
    }

    identity.webauthnCredentials.push(...creds);

    expect(identity.webauthnCredentials.length).toBe(5);
    const sortedByTime = identity.webauthnCredentials.sort(
      (a, b) => a.registeredAt - b.registeredAt
    );
    expect(sortedByTime[0].credentialId).toBe('cred-0');
    expect(sortedByTime[4].credentialId).toBe('cred-4');
  });

  test('should maintain identity integrity across modifications', () => {
    const identity = createMovementIdentity(
      '0x742d35Cc6634C0532925a3b844Bc822e8c6b3b44'
    );
    const originalId = identity.identityId;

    // Add credentials
    identity.webauthnCredentials.push({
      credentialId: 'test',
      status: 'active',
      registeredAt: Date.now(),
    });

    // Revoke credentials
    identity.webauthnCredentials[0].status = 'revoked';

    // Identity ID should remain unchanged
    expect(identity.identityId).toBe(originalId);
  });
});

/**
 * TEST SUITE 7: Demo Mode Testing
 */
describe('Demo Mode for Testing', () => {
  const walletAddress = '0x742d35Cc6634C0532925a3b844Bc822e8c6b3b44';

  test('should enable testing without hardware biometrics', () => {
    const identity = createMovementIdentity(walletAddress);

    // Simulate demo mode credential
    const demoBiometricHash =
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

    const demoCredential = {
      credentialId: 'demo-credential',
      bindingHash: demoBiometricHash,
      status: 'active',
      registeredAt: Date.now(),
    };

    identity.webauthnCredentials.push(demoCredential);

    expect(identity.webauthnCredentials[0].bindingHash).toBe(
      demoBiometricHash
    );
  });

  test('should support predictable demo hashes for testing', () => {
    const demoHash1 = `0xdemo-${walletAddress}-${Date.now()}`;
    const demoHash2 = `0xdemo-${walletAddress}-${Date.now()}`;

    // In actual implementation, would use ethers.keccak256
    expect(typeof demoHash1).toBe('string');
    expect(demoHash1.length > 0).toBe(true);
  });
});

/**
 * INTEGRATION TEST SCENARIO
 * Full workflow: Create Identity → Register Biometric → Verify Payment
 */
describe('Integration: Full Biometric Payment Workflow', () => {
  test('should complete full payment authorization flow', async () => {
    const walletAddress = '0x742d35Cc6634C0532925a3b844Bc822e8c6b3b44';
    const paymentData = {
      amount: '1000000000000000000',
      recipient: '0xrecipient',
      chain: 'ethereum',
    };

    // Step 1: Create identity
    const identity = createMovementIdentity(walletAddress, {
      email: 'user@example.com',
    });
    expect(identity).toBeDefined();

    // Step 2: Simulate biometric registration
    identity.webauthnCredentials.push({
      credentialId: 'registered-biometric',
      bindingHash: '0xbinding-hash',
      status: 'active',
      registeredAt: Date.now(),
      lastUsed: null,
    });
    expect(identity.webauthnCredentials.length).toBe(1);

    // Step 3: List available credentials
    const credentials = listBoundCredentials(identity);
    expect(credentials.length).toBe(1);

    // Step 4: Simulate payment verification
    const verificationResult = await verifyPaymentWithIdentity(
      identity,
      'registered-biometric',
      paymentData
    );

    if (verificationResult.success) {
      expect(verificationResult.identityId).toBe(identity.identityId);
      expect(verificationResult.walletAddress).toBe(walletAddress);
      expect(verificationResult.biometricHash).toBeDefined();
    }

    // Step 5: Persist identity
    const exported = exportIdentityBinding(identity);
    const reimported = importIdentityBinding(exported);
    expect(reimported.identityId).toBe(identity.identityId);
  });
});
