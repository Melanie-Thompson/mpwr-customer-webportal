import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import cognitoConfig, { authEnvironment } from './config/cognito';
import './index.css';
import App from './App.jsx';

// Configure Amplify with Cognito
Amplify.configure(cognitoConfig);

// Log environment for debugging (remove in production if needed)
if (authEnvironment.isDevelopment) {
  console.log('Auth environment:', authEnvironment.environment);
  console.log('Using User Pool:', authEnvironment.userPoolId);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
