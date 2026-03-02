/**
 * Version information utility
 * Provides build-time version information and runtime version display
 */

interface VersionInfo {
  version: string;
  buildTime: string;
  gitCommit: string;
  gitBranch: string;
  isProduction: boolean;
  environment: string;
}

// Build-time constants injected by Vite
declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;
declare const __GIT_COMMIT__: string;
declare const __GIT_BRANCH__: string;

/**
 * Get comprehensive version information
 */
export function getVersionInfo(): VersionInfo {
  return {
    version: __APP_VERSION__ || '1.0.0',
    buildTime: __BUILD_TIME__ || new Date().toISOString(),
    gitCommit: __GIT_COMMIT__ || 'unknown',
    gitBranch: __GIT_BRANCH__ || 'unknown',
    isProduction: import.meta.env.PROD,
    environment: import.meta.env.MODE,
  };
}

/**
 * Get a human-readable version string
 */
export function getVersionString(): string {
  const info = getVersionInfo();
  const buildDate = new Date(info.buildTime).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `v${info.version} (${info.gitCommit}) - ${buildDate}`;
}

/**
 * Get a fun, branded version display with Aaron's Love
 */
export function getPoweredByString(): string {
  const info = getVersionInfo();
  const version = getVersionString();

  // Fun messages based on environment/branch
  const messages = {
    production: [
      "🚀 Powered by Aaron's Love",
      "💖 Built with Aaron's Love",
      "🌟 Aaron's Love Production",
      "✨ Crafted with Aaron's Love",
    ],
    development: [
      "🛠️ Aaron's Love Development",
      "🔧 Built with Aaron's Love",
      "💻 Aaron's Love Dev Mode",
      "🎯 Aaron's Love Testing",
    ],
    staging: [
      "🎭 Aaron's Love Staging",
      "🎪 Aaron's Love Preview",
      "🎨 Aaron's Love Showcase",
    ],
  };

  const env = info.isProduction ? 'production' : 'development';
  const envMessages = messages[env] || messages.development;
  const randomMessage = envMessages[Math.floor(Math.random() * envMessages.length)];

  return `${randomMessage} - ${version}`;
}

/**
 * Get a compact version for display in footers/headers
 */
export function getCompactVersion(): string {
  const info = getVersionInfo();
  return `v${info.version}-${info.gitCommit}`;
}

/**
 * Check if this is a development build
 */
export function isDevelopment(): boolean {
  return !getVersionInfo().isProduction;
}

/**
 * Check if this is a production build
 */
export function isProduction(): boolean {
  return getVersionInfo().isProduction;
}

/**
 * Get a simple powered-by string without version info for clean footer display
 */
export function getSimplePoweredByString(): string {
  return "💖 Built with Aaron's Love";
}
