import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Retrieves an environment variable.
 * Fails fast and exits the application if the variable is required (no default value provided) and missing.
 * 
 * @param {string} key - The name of the environment variable.
 * @param {any} [defaultValue] - The default value to return if the environment variable is not defined.
 * @returns {string} The environment variable value or defaultValue.
 */
export const getEnv = (key, defaultValue = undefined) => {
  const value = process.env[key];
  if (value === undefined || value === null || value === '') {
    if (defaultValue === undefined) {
      console.error(`❌ Environment Configuration Error: Required environment variable "${key}" is not set.`);
      process.exit(1);
    }
    return defaultValue;
  }
  return value;
};

// Validate required environment variables immediately on load
const REQUIRED_ENV_VARS = [
  'MONGO_URI',
  'JWT_SECRET',
  'FRONTEND_URL',
  'AUTH0_CLIENT_ID',
  'AUTH0_ISSUER_BASE_URL',
  'LLM_WORKERS_CONFIG'
];

for (const key of REQUIRED_ENV_VARS) {
  getEnv(key);
}

