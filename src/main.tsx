/**
 * Application Entry Point
 * Initializes and renders the React application
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { validateEnvironment } from '../config/environment';
import { logger } from '../config/logging.config';

// Validate environment on startup
validateEnvironment();

// Initialize application
logger.info('LightRail AI starting', {
  version: '1.0.0',
  environment: import.meta.env.MODE,
});

// Mount React application
const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  logger.error('Root element not found');
}
