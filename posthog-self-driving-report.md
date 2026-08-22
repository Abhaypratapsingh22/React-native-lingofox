# PostHog Self-driving Setup Report — LingoFox

_Generated: 2026-08-22_

## Summary

PostHog Self-driving has been configured for LingoFox: Session Replay, Error Tracking, and Support (Conversations) products were enabled server-side; seven signal sources were wired up to feed the inbox; a 7-scout troop was tuned to match this project's surfaces; two custom domain scouts and two Replay Vision scanners were created to watch LingoFox's onboarding funnel and lesson experience. Findings will start appearing in the Self-driving inbox at https://us.posthog.com/project/570131/inbox within approximately 30 minutes.

---

## AI data processing

**Approved.** Organization-level AI data processing approval was granted before this run started (enforced by the setup wizard).

---

## GitHub

**Connected during this run.** GitHub account: `Abhaypratapsingh22` (integration id: 239036). Self-driving can now research findings in the repository and open draft fix PRs.

---

## Products enabled

| Product | Status | Notes |
|---|---|---|
| Session Replay | **Already enabled** | Server-side recording toggle was already on. This is a mobile app (posthog-react-native), so the server flip is on but recordings only arrive once replay is configured in the SDK. |
| Error Tracking | **Already enabled** | Exception autocapture was already on server-side. As with replay, mobile SDK configuration controls what actually gets captured. |
| Support (Conversations) | **Enabled** | Newly enabled this run. Tickets only arrive once an inbound channel (email / inbox / Slack) is connected in PostHog. See Follow-ups. |

**Mobile SDK note:** For both Session Replay and Error Tracking, the server-side toggle is on. But posthog-react-native requires explicit SDK configuration to send mobile recordings and capture exceptions — these won't flow automatically. See Follow-ups for the specific SDK changes needed.

---

## Signal sources

| source\_product | source\_type | Action |
|---|---|---|
| `signals_scout` | `cross_source_issue` | **On by default** — no row needed; scout findings reach the inbox automatically. |
| `health_checks` | `health_issue` | **Enabled** |
| `error_tracking` | `issue_created` | **Enabled** |
| `error_tracking` | `issue_reopened` | **Enabled** |
| `error_tracking` | `issue_spiking` | **Enabled** |
| `session_replay` | `session_analysis_cluster` | **Enabled** (sample\_rate: 0.1 applied by server) |
| `conversations` | `ticket` | **Enabled** (stays dormant until an inbound channel is connected) |
| `replay_vision` | — | **Self-authorizing** — scanners created in step 6c carry `emits_signals: true`; no separate source row needed. |

---

## Connected tools

No external tools were selected. All connected-tool sources are skipped (not used).

---

## Scout troop

**Budget:** 100 runs/day (early-access default, confirmed via `scout-metadata-get`). 0 runs used today.  
**Banner:** _"Scouts are in early access. Each project gets up to 100 scout runs a day. Contact team-self-driving@posthog.com if you need more."_

### Enabled (7 scouts)

| Scout | What it watches |
|---|---|
| `signals-scout-general` | Cross-product correlations and surfaces no specialist covers |
| `signals-scout-product-analytics` | Saved funnels, retention, and lifecycle flows for conversion regressions |
| `signals-scout-feature-flags` | Flag evaluation cliffs, ghost flags, response-distribution shifts, and flag debt |
| `signals-scout-health-checks` | PostHog instrumentation health issues worth acting on |
| `signals-scout-observability-gaps` | Events with significant volume but no insight, dashboard, or alert coverage |
| `signals-scout-lingofox-onboarding` _(custom)_ | Sign-up → language selection → first lesson funnel conversion, day-over-day |
| `signals-scout-lingofox-lessons` _(custom)_ | Lesson start → lesson completion rate by lesson type (video, audio, chat, vocabulary) |

### Disabled (21 scouts) — intentional

| Scout | Reason disabled |
|---|---|
| `signals-scout-error-tracking` | Covered by the `error_tracking` native signal source; a scout would duplicate it |
| `signals-scout-session-replay` | Covered by the `session_replay` native signal source; a scout would duplicate it |
| `signals-scout-ai-observability` | No AI/LLM SDK or `$ai_*` events detected in this project |
| `signals-scout-revenue-analytics` | No payment SDK (Stripe, Paddle, etc.) detected |
| `signals-scout-surveys` | No PostHog surveys in use (0 surveys, product not enabled) |
| `signals-scout-web-analytics` | Mobile app — no web traffic or pageview attribution tracking |
| `signals-scout-web-vitals` | Mobile app — no Core Web Vitals |
| `signals-scout-csp-violations` | Mobile app — no Content Security Policy |
| `signals-scout-experiments` | No active A/B experiments found |
| `signals-scout-customer-analytics` | No group/accounts analytics (B2B not applicable here) |
| `signals-scout-data-pipelines` | No CDP destinations, batch exports, or hog flows |
| `signals-scout-data-warehouse` | No external data warehouse sources connected |
| `signals-scout-logs` | PostHog logs product not in use |
| `signals-scout-apm` | No distributed tracing / OpenTelemetry spans |
| `signals-scout-conversations` | Conversations product just enabled; no ticket data yet (re-enable once tickets are flowing) |
| `signals-scout-replay-vision` | Reads trends across accumulated scanner observations; scanners just created, no history yet |
| `signals-scout-anomaly-detection` | No dashboards or insights yet — nothing to watch for anomalies |

| `signals-scout-inbox-validation` | Fresh setup — no shipped fixes to validate yet |
| `signals-scout-insight-alerts` | No insight alerts configured |
| `signals-scout-mcp-tool-calls` | Not applicable for this project |
| `signals-scout-skills-store` | Not applicable for this project |
| `signals-scout-tasks` | Not applicable for this project |

**Re-enable follow-ups (when applicable):**
- `signals-scout-experiments` — enable if you start running A/B tests in PostHog
- `signals-scout-surveys` — enable if you add PostHog in-app surveys
- `signals-scout-ai-observability` — enable if you add LLM/AI instrumentation (`$ai_*` events)
- `signals-scout-conversations` — enable once support tickets are flowing (requires inbound channel)
- `signals-scout-replay-vision` — enable after scanners have accumulated a week of observations
- `signals-scout-anomaly-detection` — enable once you have dashboards with saved insights

---

## Custom scouts

### Created

**`signals-scout-lingofox-onboarding`**  
- **Watches:** Sign-up → onboarding screen → language selection → first lesson start, day-over-day conversion at each step  
- **Discriminator:** Any step-over-step conversion rate drops ≥15 pp over ≥2 consecutive days (vs prior-week rolling average); disqualifies when total volume is under 20 sign-ups or the drop is within normal weekend/weekday variance  
- **Why no built-in covers it:** `signals-scout-product-analytics` watches *saved* funnel insights — none exist yet on a fresh project. No other enabled scout owns raw event-level funnel steps  
- **Evidence:** `app/(auth)/sign-up.tsx`, `app/(auth)/onboarding.tsx`, `app/language-selection.tsx`, `app/(tabs)/home.tsx` — all core onboarding screens confirmed in the repo

**`signals-scout-lingofox-lessons`**  
- **Watches:** lesson_started → lesson_completed conversion rate, split by lesson type (video AI teacher, audio, chat tutor, vocabulary review)  
- **Discriminator:** Completion rate drops ≥15 pp on any single lesson type over ≥2 days, or ≥10 pp aggregate over ≥3 days; disqualifies when fewer than 30 lesson starts exist in 14 days  
- **Why no built-in covers it:** Same as above — `signals-scout-product-analytics` needs saved funnel insights. The lesson completion loop is the core retention signal for a language learning app and has no built-in owner  
- **Evidence:** AGENTS.md describes four lesson types (video AI teacher, audio, chat tutor, vocabulary review) as confirmed product surfaces

### Surfaces considered and ruled out

| Surface | Filter that killed it |
|---|---|
| XP / streak system | Not watchable — local state in Zustand/AsyncStorage; events may not reach PostHog |
| AI tutor session health | Uncertain — Stream Vision Agents are server-side; event flow from sessions unknown |
| Language selection alone | Too narrow — folded into the onboarding funnel scout, which already covers it |

### Noise escape hatch

If a custom scout turns out noisy, set `emit: false` on its config in PostHog to switch it to dry-run mode (it will still run and log, but write nothing to the inbox).

---

## Replay Vision scanners

Replay Vision scanners are LLMs that watch individual session recordings on a schedule and push what they find directly to the Self-driving inbox. Findings arrive at half weight — they need corroboration from a second independent observation before being promoted into a full report, which prevents a single bad recording from triggering false alarms.

**No recordings exist yet** — the scanners are armed and start working automatically the day recordings begin arriving (no second setup needed).

### Created

| Scanner | Type | Query scope | Sampling | Estimated monthly credits |
|---|---|---|---|---|
| **LingoFox lesson flow breakage** | monitor | Recordings visiting a screen with "home", "onboarding", or "language-selection" in the URL (lesson discovery, home, onboarding, and language selection screens) | 0.5 (50% of matched sessions) | 0 (no recordings yet) |
| **LingoFox learner frustration** | monitor | Recordings containing a `$rageclick` event (any screen) | 1.0 (all matched sessions) | 0 (no recordings yet) |

**Breakage monitor** (`LingoFox lesson flow breakage`) — watches for blank screens where lesson content should appear, AI tutor not responding, home screen failing to load lessons, onboarding steps that don't advance, language selection not registering, and lesson completion with no XP shown. Scoped to home, onboarding, and language-selection screens because those form the gateway to the full lesson experience (the lesson screens are being built and will be covered as their routes register hits in replay).

**Frustration monitor** (`LingoFox learner frustration`) — gated on `$rageclick`, watches any session where a user rage-tapped a lesson card, hammered an unresponsive Continue button, retried vocabulary answers with no feedback, or got stuck on the auth screen. The `$rageclick` gate makes this a high-precision filter.

---

## Follow-ups

- [ ] **Enable mobile Session Replay in the SDK** — the server-side toggle is on, but `posthog-react-native` requires opt-in replay configuration. Add `enableSessionReplay: true` (and optionally `sessionReplayConfig`) to your PostHog init call. Docs: https://posthog.com/docs/session-replay/mobile
- [ ] **Enable mobile Exception Capture in the SDK** — similarly, posthog-react-native needs `captureNativeExceptions: true` or equivalent in your init call for error tracking to receive crashes and exceptions. Docs: https://posthog.com/docs/error-tracking
- [ ] **Connect a Support inbound channel** — Conversations product is enabled but the `conversations / ticket` source stays dormant until you connect an inbound channel (email, inbox widget, or Slack). Go to PostHog → Support settings to connect one.
- [ ] **Enable `signals-scout-replay-vision`** — after the Replay Vision scanners have accumulated a week of observations, enable this scout in your inbox to get trend reports across scanner findings.
- [ ] **Widen the breakage scanner query when lesson screens are built** — the breakage scanner currently targets "home" URL sessions. Once lesson screen routes are live (e.g. `/lesson/[id]`), update the scanner's query to also include those URLs so broken lesson content is caught in-session.
- [ ] **Review lesson event names** — the two custom scouts reference generic event names (lesson_started, lesson_completed, language_selected). Confirm the actual event names being captured in posthog-react-native and update the scout bodies if they differ.

---

## What happens next

- The scout coordinator picks up the new configs within ~30 minutes and schedules first runs
- Each run draws from the 100-run daily budget; with 7 scouts that's ~7 runs/day, well within budget
- Findings cluster into reports in the inbox at https://us.posthog.com/project/570131/inbox
- Immediately-actionable reports can launch coding tasks directly from the inbox
- Replay Vision scanners begin scanning as soon as session recordings arrive
