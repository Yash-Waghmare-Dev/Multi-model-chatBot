/**
 * Environment and configuration validation
 */

const validateEnvironment = (): void => {
  const requiredEnvVars: Record<string, string | undefined> = {
    "VITE_WEBHOOK_URL": import.meta.env.VITE_WEBHOOK_URL,
  };

  const missing = Object.entries(requiredEnvVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0 && import.meta.env.PROD) {
    console.warn(
      `Missing environment variables in production: ${missing.join(", ")}`
    );
  }
};

export const initializeApp = (): void => {
  validateEnvironment();

  // Set up global error handler for unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled promise rejection:", event.reason);
  });
};
