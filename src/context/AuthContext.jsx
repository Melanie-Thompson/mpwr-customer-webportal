import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signIn,
  signOut,
  getCurrentUser,
  fetchAuthSession,
  confirmSignIn,
} from 'aws-amplify/auth';
import useStore from '../store/useStore';
import { setAuthToken } from '../api/client';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [challengeName, setChallengeName] = useState(null);
  const [challengeUser, setChallengeUser] = useState(null);

  const { setUser: setStoreUser, setCustomerId, loadCustomerData } = useStore();

  // Check current auth state on mount
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      setIsLoading(true);
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();

      if (currentUser && session.tokens) {
        setUser(currentUser);
        setIsAuthenticated(true);

        // Set the auth token on the API client
        const idToken = session.tokens.idToken?.toString();
        if (idToken) {
          setAuthToken(idToken);
        }

        // Extract customer ID from user attributes or username
        const customerId = currentUser.username || currentUser.userId;
        if (customerId) {
          setCustomerId(customerId);
        }

        // Load customer data after authentication
        try {
          await loadCustomerData();
        } catch (err) {
          console.error('Failed to load customer data:', err);
        }
      }
    } catch (error) {
      // User is not authenticated
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = useCallback(async (username, password) => {
    setAuthError(null);
    setIsLoading(true);

    try {
      const result = await signIn({ username, password });

      // Check if there's a challenge (like NEW_PASSWORD_REQUIRED)
      if (result.nextStep) {
        const { signInStep } = result.nextStep;

        if (signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
          setChallengeName('NEW_PASSWORD_REQUIRED');
          setChallengeUser(username);
          setIsLoading(false);
          return { challengeName: 'NEW_PASSWORD_REQUIRED' };
        }

        if (signInStep === 'DONE') {
          // Sign in complete
          await checkAuthState();
          return { success: true };
        }
      }

      // If we get here with isSignedIn true, we're done
      if (result.isSignedIn) {
        await checkAuthState();
        return { success: true };
      }

      return { success: false };
    } catch (error) {
      console.error('Sign in error:', error);
      setAuthError(error.message || 'Failed to sign in');
      setIsLoading(false);
      return { error: error.message || 'Failed to sign in' };
    }
  }, []);

  const handleNewPasswordChallenge = useCallback(async (newPassword) => {
    setAuthError(null);
    setIsLoading(true);

    try {
      const result = await confirmSignIn({
        challengeResponse: newPassword,
      });

      if (result.isSignedIn || result.nextStep?.signInStep === 'DONE') {
        setChallengeName(null);
        setChallengeUser(null);
        await checkAuthState();
        return { success: true };
      }

      setIsLoading(false);
      return { success: false };
    } catch (error) {
      console.error('New password error:', error);
      setAuthError(error.message || 'Failed to set new password');
      setIsLoading(false);
      return { error: error.message || 'Failed to set new password' };
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      setUser(null);
      setIsAuthenticated(false);
      setChallengeName(null);
      setChallengeUser(null);
      setStoreUser(null);
      setAuthToken(null); // Clear the API auth token
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, [setStoreUser]);

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  const value = {
    isAuthenticated,
    isLoading,
    user,
    authError,
    challengeName,
    challengeUser,
    signIn: handleSignIn,
    signOut: handleSignOut,
    completeNewPassword: handleNewPasswordChallenge,
    clearError,
    checkAuthState,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
