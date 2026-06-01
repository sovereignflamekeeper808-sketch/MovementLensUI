'use client';

import React, { useState, useEffect } from 'react';
import useBackendAuth from '@/hooks/useBackendAuth';

export default function BackendIdentityPanel({ walletAddress }) {
  const {
    isAuthenticated,
    authToken,
    user,
    isLoading,
    error,
    registerWithBackend,
    authenticateWithBiometric,
    logout,
    fetchUserIdentity,
  } = useBackendAuth(walletAddress);

  const [userIdentity, setUserIdentity] = useState(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    email: '',
    name: '',
  });

  // Load user identity when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadUserIdentity();
    }
  }, [isAuthenticated]);

  const loadUserIdentity = async () => {
    const result = await fetchUserIdentity();
    if (result.success) {
      setUserIdentity(result);
    }
  };

  const handleRegister = async () => {
    if (!registrationData.email) {
      alert('Please enter an email address');
      return;
    }

    const result = await registerWithBackend({
      email: registrationData.email,
      name: registrationData.name,
    });

    if (result.success) {
      setShowRegisterForm(false);
      setRegistrationData({ email: '', name: '' });
      loadUserIdentity();
    }
  };

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      setUserIdentity(null);
    }
  };

  return (
    <div className="w-full p-6 rounded-xl bg-gradient-to-b from-black/50 to-black/30 backdrop-blur-xl border border-gold-500/20 shadow-2xl space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-300 to-gold-500 tracking-wider">
          Backend Identity
        </h2>
        <p className="text-sm text-gray-400">
          Secure backend authentication and session management
        </p>
      </div>

      {/* Authentication Status */}
      <div className="p-4 rounded-lg bg-black/50 border border-gold-500/10">
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest">
          Authentication Status
        </p>
        <div className="flex items-center gap-3">
          <div
            className={`h-3 w-3 rounded-full ${
              isAuthenticated
                ? 'bg-green-500 animate-pulse'
                : 'bg-red-500'
            }`}
          ></div>
          <span
            className={`text-sm font-semibold ${
              isAuthenticated
                ? 'text-green-400'
                : 'text-red-400'
            }`}
          >
            {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </span>
        </div>
      </div>

      {/* User Info (When Authenticated) */}
      {isAuthenticated && user && (
        <div className="space-y-3">
          {/* User ID */}
          <div className="p-4 rounded-lg bg-black/50 border border-gold-500/10">
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-widest">
              User ID
            </p>
            <p className="font-mono text-gold-300 text-xs break-all">
              {user.userId}
            </p>
          </div>

          {/* Auth Token (Truncated) */}
          <div className="p-4 rounded-lg bg-black/50 border border-gold-500/10">
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-widest">
              Session Token
            </p>
            <p className="font-mono text-gold-300 text-xs break-all">
              {authToken?.slice(0, 20)}...
            </p>
          </div>
        </div>
      )}

      {/* User Identity Data */}
      {isAuthenticated && userIdentity && (
        <div className="p-4 rounded-lg bg-black/50 border border-gold-500/10 space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-widest">
            Identity Data
          </p>

          {userIdentity.identity && (
            <div className="space-y-2 text-xs">
              <p>
                <span className="text-gold-500">Credentials:</span>{' '}
                {userIdentity.identity.credentialCount || 0}
              </p>
              <p>
                <span className="text-gold-500">Status:</span>{' '}
                {userIdentity.identity.status || 'Active'}
              </p>
              <p>
                <span className="text-gold-500">Verified:</span>{' '}
                {userIdentity.identity.verified ? '✓' : '✗'}
              </p>
            </div>
          )}

          {userIdentity.credentials && userIdentity.credentials.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gold-500/10">
              <p className="text-gold-500 text-xs mb-2">Bound Credentials:</p>
              <div className="space-y-1 text-xs text-gray-400">
                {userIdentity.credentials.map((cred, idx) => (
                  <p key={idx}>
                    • {cred.bindingHash?.slice(0, 16)}... ({cred.status})
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Registration Form */}
      {!isAuthenticated && showRegisterForm && (
        <div className="p-4 rounded-lg bg-black/50 border border-gold-500/10 space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-widest">
            Register New Identity
          </p>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Email</label>
            <input
              type="email"
              value={registrationData.email}
              onChange={(e) =>
                setRegistrationData({
                  ...registrationData,
                  email: e.target.value,
                })
              }
              placeholder="user@example.com"
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-gold-500/20 text-gold-300 text-sm focus:outline-none focus:border-gold-500/50"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Name (Optional)
            </label>
            <input
              type="text"
              value={registrationData.name}
              onChange={(e) =>
                setRegistrationData({
                  ...registrationData,
                  name: e.target.value,
                })
              }
              placeholder="John Doe"
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-gold-500/20 text-gold-300 text-sm focus:outline-none focus:border-gold-500/50"
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {!isAuthenticated ? (
          <>
            <button
              onClick={() => setShowRegisterForm(!showRegisterForm)}
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 text-black font-bold hover:from-gold-400 hover:to-gold-500 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? 'Processing...' : '🔐 Register with Backend'}
            </button>

            {showRegisterForm && (
              <button
                onClick={handleRegister}
                disabled={isLoading}
                className="w-full py-3 rounded-lg bg-green-600 text-white font-bold hover:bg-green-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Registering...' : '✓ Confirm Registration'}
              </button>
            )}
          </>
        ) : (
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-red-900/40 text-red-400 font-semibold hover:bg-red-900/60 transition disabled:opacity-50"
          >
            {isLoading ? 'Logging out...' : '🚪 Logout'}
          </button>
        )}

        {isAuthenticated && !showRegisterForm && (
          <button
            onClick={loadUserIdentity}
            disabled={isLoading}
            className="w-full py-2 rounded-lg bg-gold-900/40 text-gold-400 font-semibold hover:bg-gold-900/60 transition disabled:opacity-50 text-sm"
          >
            {isLoading ? 'Refreshing...' : '🔄 Refresh Identity'}
          </button>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center">
          <p className="text-gold-400 animate-pulse text-sm">
            Processing backend request…
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
    </div>
  );
}
