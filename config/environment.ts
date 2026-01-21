/**
 * Environment Configuration
 * Manages environment variables and runtime settings
 */

export type Environment = 'development' | 'staging' | 'production' | 'test';

export interface EnvironmentConfig {
  env: Environment;
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
  apiBaseUrl: string;
  enableDebug: boolean;
  enableTelemetry: boolean;
}

function getEnvironment(): Environment {
  const env = import.meta.env.MODE || 'development';
  if (['development', 'staging', 'production', 'test'].includes(env)) {
    return env as Environment;
  }
  return 'development';
}

export const environment: EnvironmentConfig = {
  env: getEnvironment(),
  isProduction: getEnvironment() === 'production',
  isDevelopment: getEnvironment() === 'development',
  isTest: getEnvironment() === 'test',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
  enableTelemetry: import.meta.env.VITE_ENABLE_TELEMETRY === 'true',
};

export function validateEnvironment(): void {
  const requiredVars: string[] = [];
  const missingVars = requiredVars.filter(
    (varName) => !import.meta.env[varName]
  );

  if (missingVars.length > 0) {
    console.warn(
      `Missing environment variables: ${missingVars.join(', ')}`
    );
  }
}
