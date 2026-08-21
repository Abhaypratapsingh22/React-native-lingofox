Read AGENTS.md first and follow it strictly.

Use the installed GetStream agent skills and the Stream docs to implement Stream audio call setup for the selected lesson flow. When a user taps a lesson, keep the existing Audio Lesson screen UI and add the ability to start, join, mute/unmute, and end an audio-only Stream call.

Use Expo API routes for Stream token generation and call creation. Do not expose Stream secrets in the Expo app.

**Configure the Expo Router production origin to the deployed API server, or enable `EXPO_UNSTABLE_DEPLOY_SERVER` for EAS builds. Define the failure behavior when native builds cannot reach the API routes (show error state, retry logic, fallback to cached tokens).**

**Define a deterministic Stream call type and call ID from the selected lesson flow, selected language, and authenticated Clerk user, and have the token/call-creation API return this identity. Ensure retries reuse the same identity rather than generating a new call, so the mobile client and Vision Agent both invoke getOrCreate on the identical Stream call.**

**Update the Expo API route handling Stream token generation and call/session creation to authenticate the Clerk token server-side and derive userId from the authenticated identity. Ignore any client-supplied user ID, verify the authenticated user is authorized for the selected lesson and language, and only then generate the Stream token or create the call/session.**

Preserve the existing UI and lesson data. Add clear loading, joined, error, muted, connecting, ended states and user info on audio ui.