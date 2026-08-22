import PostHog from 'posthog-react-native'

// Configuration loaded from environment variables (EXPO_PUBLIC_ prefix embeds them at build time)
const projectToken = process.env.EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN as string | undefined
const host = (process.env.EXPO_PUBLIC_POSTHOG_HOST as string) || 'https://us.i.posthog.com'
const isPostHogConfigured = Boolean(projectToken && projectToken !== 'phc_your_project_token_here')

if (__DEV__ && !isPostHogConfigured) {
  console.warn(
    'EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, ' +
      'this causes events to be silently missed. This error stops appearing once ' +
      'EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN is configured.'
  )
}

/**
 * PostHog client instance for LingoFox (Expo/React Native)
 *
 * Reads EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN and EXPO_PUBLIC_POSTHOG_HOST
 * from the .env file. These are embedded at Metro build time.
 *
 * Required peer dependencies already installed:
 *   react-native-svg (surveys UI), @react-native-async-storage/async-storage
 *
 * @see https://posthog.com/docs/libraries/react-native
 */
export const posthog = new PostHog(projectToken || 'placeholder_key', {
  host,

  // Disable analytics when no token is configured — keeps the app functional
  disabled: !isPostHogConfigured,

  // Capture app lifecycle events (installed, opened, backgrounded, etc.)
  captureAppLifecycleEvents: true,

  // Batching to optimise battery / network usage
  flushAt: 20,
  flushInterval: 10000,
  maxBatchSize: 100,
  maxQueueSize: 1000,

  // Feature flags
  preloadFeatureFlags: true,
  sendFeatureFlagEvent: true,
  featureFlagsRequestTimeoutMs: 10000,

  // Network
  requestTimeout: 10000,
  fetchRetryCount: 3,
  fetchRetryDelay: 3000,
})

export const isPostHogEnabled = isPostHogConfigured
