/**
 * Environment Configuration Interface
 * 
 * Defines all environment variables available in the application.
 * These variables are injected via window.__env in index.html
 */
export interface EnvConfig {
  /** API Gateway base URL */
  API_URL: string;
  
  /** Keycloak server URL */
  KEYCLOAK_URL: string;
  
  /** Keycloak realm name */
  KEYCLOAK_REALM: string;
  
  /** Keycloak client ID for frontend */
  KEYCLOAK_CLIENT_ID: string;
}

/**
 * Default environment configuration
 * Used as fallback when window.__env is not available
 */
export const defaultEnv: EnvConfig = {
  API_URL: 'http://localhost:8080',
  KEYCLOAK_URL: 'http://localhost:8180',
  KEYCLOAK_REALM: 'vento-realm',
  KEYCLOAK_CLIENT_ID: 'vento-frontend',
};

/**
 * Get environment configuration
 * Returns window.__env if available, otherwise returns defaultEnv
 * 
 * @returns EnvConfig - The environment configuration object
 */
export function getEnv(): EnvConfig {
  if (typeof window !== 'undefined' && (window as any).__env) {
    return (window as any).__env as EnvConfig;
  }
  return defaultEnv;
}

/**
 * Get a specific environment variable
 * 
 * @param key - The environment variable key
 * @param fallback - Optional fallback value if key doesn't exist
 * @returns The environment variable value or fallback
 */
export function getEnvValue<K extends keyof EnvConfig>(
  key: K,
  fallback?: EnvConfig[K]
): EnvConfig[K] {
  const env = getEnv();
  return env[key] ?? fallback ?? defaultEnv[key];
}
