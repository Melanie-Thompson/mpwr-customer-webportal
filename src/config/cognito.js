/**
 * AWS Cognito Configuration for MPWR Customer Portal
 * Uses environment variables set via CircleCI contexts for dev/prod
 */

// Determine environment
const environment = import.meta.env.VITE_ENVIRONMENT || 'local';
const isProduction = environment === 'prod' || environment === 'production';
const isDevelopment = environment === 'dev' || environment === 'development' || environment === 'local';

// Dev defaults (used for local development)
const DEV_DEFAULTS = {
  userPoolId: 'us-east-1_4vx7mJKbk',
  userPoolClientId: 'uq3s8i6ndrrq3tkl1p571bjqf',
  domain: 'mpwr-dev-borrower.auth.us-east-1.amazoncognito.com',
};

// Get Cognito config from environment variables or use dev defaults for local
const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID || DEV_DEFAULTS.userPoolId;
const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID || DEV_DEFAULTS.userPoolClientId;
const cognitoDomain = import.meta.env.VITE_COGNITO_DOMAIN || DEV_DEFAULTS.domain;

export const cognitoConfig = {
  Auth: {
    Cognito: {
      userPoolId,
      userPoolClientId,
      loginWith: {
        oauth: {
          domain: cognitoDomain,
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: [window.location.origin],
          redirectSignOut: [window.location.origin],
          responseType: 'code',
        },
      },
    },
  },
};

// Export environment info for debugging
export const authEnvironment = {
  environment,
  isProduction,
  isDevelopment,
  userPoolId,
};

export default cognitoConfig;
