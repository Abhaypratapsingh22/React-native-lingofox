---
name: clerk-webhooks
description:
  Clerk webhooks for real-time events and data syncing. Verify with verifyWebhook
  from the framework-specific package. Handle user, session, organization, billing, and
  payment events. Build event-driven features like database sync, notifications, and
  integrations.
allowed-tools: WebFetch
license: MIT
metadata:
  author: clerk
  version: 1.2.0
compatibility: Requires CLERK_WEBHOOK_SIGNING_SECRET (svix signing secret from Clerk dashboard)
---

# Webhooks

Output complete, working webhook handlers with `verifyWebhook(req)` verification in every handler.

## When to Use Webhooks

Webhooks are **asynchronous and eventually consistent**. Delivery is fast but not guaranteed to be immediate, and may occasionally fail (Svix retries on a fixed schedule). Use them for:

- Database sync (a separate users / orgs table that follows Clerk)
- Notifications (welcome emails, Slack pings, internal alerts)
- Integrations triggered by lifecycle events

Do NOT rely on webhook delivery as part of a synchronous flow such as onboarding ("user signs up, then we read X from our DB"). For data the user just created, read it from the [Clerk session token](https://clerk.com/docs/guides/sessions/session-tokens) or call the Backend API directly. Webhooks fill the gap when you need data about _other_ users or events the session token doesn't carry.

## Verify Every Webhook

Use `verifyWebhook(req)` from the framework-specific package (`@clerk/nextjs/webhooks`, `@clerk/express/webhooks`, etc.). It reads `CLERK_WEBHOOK_SIGNING_SECRET` automatically and throws on bad signatures. Skipping verification, even for notification-only handlers, exposes the endpoint to spoofed events.

## Make the Webhook Route Public

Webhook routes must be excluded from Clerk middleware protection. Without this, Clerk returns 401.

```typescript
// proxy.ts (Next.js <=15: middleware.ts)
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/api/webhooks(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) await auth.protect();
});
```

## Complete Webhook Handler (Next.js App Router)

```typescript
// app/api/webhooks/route.ts
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  // ALWAYS verify - never skip, even for notification-only handlers
  let evt;
  try {
    evt = await verifyWebhook(req); // uses CLERK_WEBHOOK_SIGNING_SECRET automatically
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response("Verification failed", { status: 400 });
  }

  const svixId = req.headers.get("svix-id");
  if (!svixId) return new Response("Missing svix-id", { status: 400 });

  // Use the event timestamp for ordering (from Svix headers or event payload)
  const eventTimestamp = new Date(req.headers.get("svix-timestamp") ?? Date.now());

  try {
    await db.$transaction(async (tx) => {
      await tx.webhookDeliveries.create({ data: { svixId } });

      // Helper: only apply if incoming event is newer than stored timestamp
      const isNewer = (existingTimestamp: Date | null) =>
        !existingTimestamp || eventTimestamp > existingTimestamp;

      if (evt.type === "user.created" || evt.type === "user.updated") {
        const {
          id,
          email_addresses,
          primary_email_address_id,
          first_name,
          last_name,
        } = evt.data;
        const email = email_addresses.find(
          (entry) => entry.id === primary_email_address_id,
        )?.email_address ?? null;
        const name = `${first_name ?? ""} ${last_name ?? ""}`.trim();

        // Check existing user's last event timestamp
        const existing = await tx.users.findUnique({ where: { clerkId: id } });
        if (isNewer(existing?.lastEventAt ?? null)) {
          await tx.users.upsert({
            where: { clerkId: id },
            create: {
              clerkId: id,
              email,
              name,
              first_name,
              last_name,
              lastEventAt: eventTimestamp,
              deletedAt: null,
            },
            update: {
              email,
              first_name,
              last_name,
              name,
              lastEventAt: eventTimestamp,
              deletedAt: null,
            },
          });
        }
      }

      if (evt.type === "user.deleted") {
        const clerkId = evt.data.id;
        // Create tombstone instead of deleting — retain deletedAt timestamp
        const existing = await tx.users.findUnique({ where: { clerkId } });
        if (!existing || isNewer(existing.lastEventAt ?? null)) {
          await tx.users.upsert({
            where: { clerkId },
            create: {
              clerkId,
              email: null,
              name: null,
              first_name: null,
              last_name: null,
              lastEventAt: eventTimestamp,
              deletedAt: eventTimestamp,
            },
            update: {
              lastEventAt: eventTimestamp,
              deletedAt: eventTimestamp,
            },
          });
        }
      }

      if (
        evt.type === "organizationMembership.created" ||
        evt.type === "organizationMembership.updated"
      ) {
        const { organization, public_user_data, role } = evt.data;
        const orgId = organization.id;
        const userId = public_user_data.user_id;

        const existing = await tx.teamMembers.findUnique({
          where: { orgId_userId: { orgId, userId } },
        });
        if (isNewer(existing?.lastEventAt ?? null)) {
          await tx.teamMembers.upsert({
            where: { orgId_userId: { orgId, userId } },
            create: {
              orgId,
              userId,
              role,
              lastEventAt: eventTimestamp,
              deletedAt: null,
            },
            update: {
              role,
              lastEventAt: eventTimestamp,
              deletedAt: null,
            },
          });
        }
      }

      if (evt.type === "organizationMembership.deleted") {
        const orgId = evt.data.organization.id;
        const userId = evt.data.public_user_data.user_id;

        const existing = await tx.teamMembers.findUnique({
          where: { orgId_userId: { orgId, userId } },
        });
        if (!existing || isNewer(existing.lastEventAt ?? null)) {
          // Tombstone: mark deleted, don't remove
          await tx.teamMembers.upsert({
            where: { orgId_userId: { orgId, userId } },
            create: {
              orgId,
              userId,
              role: null,
              lastEventAt: eventTimestamp,
              deletedAt: eventTimestamp,
            },
            update: {
              lastEventAt: eventTimestamp,
              deletedAt: eventTimestamp,
            },
          });
        }
      }
    });
  } catch (err: any) {
    const target = err?.meta?.target;
    const isSvixIdConflict =
      err?.code === "P2002" &&
      (target === "svixId" ||
        (Array.isArray(target) && target.includes("svixId")) ||
        String(target).includes("svixId"));
    if (isSvixIdConflict) return new Response(null, { status: 200 });
    throw err;
  }

  return new Response("OK", { status: 200 });
}
```

## Full Example: Welcome Email (Resend) + Slack Notification on user.created

Notification-only handlers still verify the signature. Same pattern as the database-sync handler:

```typescript
// app/api/webhooks/route.ts
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/db"; // your database client

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  // Step 1: ALWAYS verify the webhook signature - NEVER skip this
  let evt;
  try {
    evt = await verifyWebhook(req); // uses CLERK_WEBHOOK_SIGNING_SECRET env var
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response("Verification failed", { status: 400 });
  }

  // Step 2: Listen for user.created event
  if (evt.type === "user.created") {
    // Step 3: Extract user email and name from webhook payload
    const {
      id,
      email_addresses,
      primary_email_address_id,
      first_name,
      last_name,
    } = evt.data;
    const email = email_addresses.find(
      (entry) => entry.id === primary_email_address_id,
    )?.email_address ?? null;
    const name = `${first_name ?? ""} ${last_name ?? ""}`.trim();

    const svixId = req.headers.get("svix-id");
    if (!svixId) return new Response("Missing svix-id", { status: 400 });
    try {
      await db.$transaction(async (tx) => {
        await tx.webhookDeliveries.create({ data: { svixId } });
        const outboxItems = [
          {
            key: `${svixId}:slack-new-user`,
            svixId,
            kind: "slack-new-user",
            status: "pending",
            payload: { name, email },
          },
        ];
        // Only queue welcome email if we have a recipient
        if (email) {
          outboxItems.push({
            key: `${svixId}:welcome-email`,
            svixId,
            kind: "welcome-email",
            status: "pending",
            payload: { email, name },
          });
        }
        await tx.outbox.createMany({ data: outboxItems });
      });
    } catch (err: any) {
      const target = err?.meta?.target;
      const isSvixIdConflict =
        err?.code === "P2002" &&
        (target === "svixId" ||
          (Array.isArray(target) && target.includes("svixId")) ||
          String(target).includes("svixId"));
      if (isSvixIdConflict) return new Response(null, { status: 200 });
      throw err;
    }
  }

  // Always return 200 to acknowledge receipt
  return new Response("OK", { status: 200 });
}
```

The outbox worker deduplicates by the distinct `${svixId}:welcome-email` and `${svixId}:slack-new-user` keys, passes `svixId` as Resend's `idempotencyKey`, checks Resend's `result.error`, and checks Slack `response.ok` before marking each action complete. This provides at-least-once delivery: durable status skips known completions, but a crash after a provider accepts a request and before status is persisted can produce a duplicate, including after Resend's 24-hour idempotency window expires.

```typescript
const emailAction = await db.outbox.findUnique({
  where: { key: `${svixId}:welcome-email` },
});
if (emailAction && emailAction.status !== "completed") {
  const result = await resend.emails.send(
    {
      from: "noreply@yourdomain.com",
      to: email,
      subject: "Welcome!",
      html: `<p>Hi ${name}, welcome to our app!</p>`,
    },
    { idempotencyKey: svixId },
  );
  if (result.error) throw result.error;

  await db.outbox.update({
    where: { key: emailAction.key },
    data: { status: "completed", completedAt: new Date(), svixId },
  });
}

const slackKey = `${svixId}:slack-new-user`;
const staleBefore = new Date(Date.now() - 10 * 60 * 1000);
await db.outbox.updateMany({
  where: {
    key: slackKey,
    status: "processing",
    updatedAt: { lt: staleBefore },
  },
  data: { status: "pending" },
});
const slackClaim = await db.outbox.updateMany({
  where: { key: slackKey, status: "pending" },
  data: { status: "processing" },
});
if (slackClaim.count !== 1) return;

const text = `New user signed up: ${name} (${email})`;
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10_000);
let response: Response;
try {
  response = await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal: controller.signal,
  });
} finally {
  clearTimeout(timeout);
}
if (!response.ok) throw new Error(`Slack delivery failed: ${response.status}`);

await db.outbox.update({
  where: { key: slackKey },
  data: { status: "completed", completedAt: new Date(), svixId },
});
```

**Also include proxy.ts (Next.js <=15: middleware.ts) to make the route public:**

```typescript
// proxy.ts (Next.js <=15: middleware.ts)
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
const isPublicRoute = createRouteMatcher(["/api/webhooks(.*)"]);
export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) await auth.protect();
});
```

## Full Example: Organization Membership Sync to Database

```typescript
// app/api/webhooks/route.ts
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";
import { db } from "@/lib/db"; // your database client

export async function POST(req: NextRequest) {
  // ALWAYS verify signature - never skip, even for simple handlers
  let evt;
  try {
    evt = await verifyWebhook(req); // uses CLERK_WEBHOOK_SIGNING_SECRET env var
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response("Verification failed", { status: 400 });
  }

  const svixId = req.headers.get("svix-id");
  if (!svixId) return new Response("Missing svix-id", { status: 400 });

  try {
    await db.$transaction(async (tx) => {
      await tx.webhookDeliveries.create({ data: { svixId } });

      if (evt.type === "organization.created") {
        const { id, name } = evt.data;
        await tx.workspaces.upsert({
          where: { orgId: id },
          create: { orgId: id, name, createdAt: new Date() },
          update: { name },
        });
      }

      if (evt.type === "organizationMembership.created") {
        // Extract organization ID, user ID, and role from payload
        const { organization, public_user_data, role } = evt.data;
        const orgId = organization.id;
        const userId = public_user_data.user_id;

        // Add to team_members table
        await tx.team_members.upsert({
          where: { orgId_userId: { orgId, userId } },
          create: { orgId, userId, role },
          update: { role },
        });
      }

      if (evt.type === "organizationMembership.deleted") {
        // Extract organization ID and user ID from payload
        const { organization, public_user_data } = evt.data;
        const orgId = organization.id;
        const userId = public_user_data.user_id;

        // Remove from team_members table
        await tx.team_members.deleteMany({ where: { orgId, userId } });
      }
    });
  } catch (err: any) {
    const target = err?.meta?.target;
    const isSvixIdConflict =
      err?.code === "P2002" &&
      (target === "svixId" ||
        (Array.isArray(target) && target.includes("svixId")) ||
        String(target).includes("svixId"));
    if (isSvixIdConflict) return new Response(null, { status: 200 });
    throw err;
  }

  // Return 200 status on success
  return new Response("OK", { status: 200 });
}
```

## Other Frameworks

For Express, Astro, Fastify, Nuxt, React Router, and TanStack Start, use the framework-specific `verifyWebhook` adapter. Each Clerk SDK package ships its own (`@clerk/express/webhooks`, `@clerk/astro/webhooks`, `@clerk/fastify/webhooks`, etc.).

See `references/frameworks.md` for full handler examples per framework.

## Type Narrowing for `evt.data`

`verifyWebhook` returns `WebhookEvent`, a discriminated union of all event types. Narrow with `evt.type` to get type-safe access to `evt.data`:

```typescript
const evt = await verifyWebhook(req);

if (evt.type === "user.created") {
  // evt.data is now UserJSON, autocompletes id, email_addresses, etc.
  console.log(evt.data.id);
}
```

For manual typing of nested payloads, import the JSON types from your framework's webhook subpath: `DeletedObjectJSON`, `EmailJSON`, `OrganizationInvitationJSON`, `OrganizationJSON`, `OrganizationMembershipJSON`, `SessionJSON`, `SMSMessageJSON`, `UserJSON`.

## Payload Field Reference

### User events (`user.created`, `user.updated`, `user.deleted`)

```typescript
const {
  id, // Clerk user ID
  email_addresses, // array; [0].email_address is primary email
  first_name,
  last_name,
  image_url,
  public_metadata,
} = evt.data;
```

### Organization events (`organization.created`, `organization.updated`, `organization.deleted`)

```typescript
const {
  id, // org ID
  name, // org name
  slug,
} = evt.data;
```

### Organization Membership events (`organizationMembership.created`, `organizationMembership.updated`, `organizationMembership.deleted`)

```typescript
const {
  organization, // { id, name, ... }
  public_user_data, // { user_id, first_name, last_name, ... }
  role, // e.g. 'org:admin', 'org:member'
} = evt.data;
// Access: organization.id, public_user_data.user_id, role
```

## Supported Events (Full Catalog)

**User**: `user.created` `user.updated` `user.deleted`

**Session**: `session.created` `session.ended` `session.removed` `session.revoked`

**Organization**: `organization.created` `organization.updated` `organization.deleted`

**Organization Membership**: `organizationMembership.created` `organizationMembership.updated` `organizationMembership.deleted`

**Organization Domain**: `organizationDomain.created` `organizationDomain.updated` `organizationDomain.deleted`

**Organization Invitation**: `organizationInvitation.accepted` `organizationInvitation.created` `organizationInvitation.revoked`

**Communication**: `email.created` `sms.created`

**Waitlist**: `waitlistEntry.created` `waitlistEntry.updated`

**Permission**: `permission.created` `permission.updated` `permission.deleted`

**Role**: `role.created` `role.updated` `role.deleted`

**Subscription**: `subscription.created` `subscription.updated` `subscription.active` `subscription.pastDue`

**Subscription Item**: `subscriptionItem.created` `subscriptionItem.active` `subscriptionItem.updated` `subscriptionItem.canceled` `subscriptionItem.upcoming` `subscriptionItem.ended` `subscriptionItem.abandoned` `subscriptionItem.incomplete` `subscriptionItem.pastDue` `subscriptionItem.freeTrialEnding`

**Payment**: `paymentAttempt.created` `paymentAttempt.updated`

## Webhook Reliability

**Retries**: Svix retries failed webhooks on a set schedule (see [Svix Retry Schedule](https://docs.svix.com/retries)). Return 2xx to succeed, 4xx/5xx to retry. Use the `svix-id` header as an idempotency key to deduplicate retried events.

**Replay**: Failed webhooks can be replayed from Dashboard.

## Common Pitfalls

| Symptom                      | Cause                            | Fix                                                               |
| ---------------------------- | -------------------------------- | ----------------------------------------------------------------- |
| Verification fails (Next.js) | Wrong import or usage            | Use `@clerk/nextjs/webhooks`, pass `req` directly                 |
| Verification fails (Express) | Using `express.json()`           | Use `express.raw({ type: 'application/json' })` for webhook route |
| Route not found (404)        | Wrong path                       | Use `/api/webhooks` or preserve existing path                     |
| Not authorized (401)         | Route is protected by middleware | Make route public in `clerkMiddleware()`                          |
| No data in DB                | Async job pending                | Wait/check logs                                                   |
| Duplicate entries            | Only handling `user.created`     | Also handle `user.updated`                                        |
| Timeouts                     | Handler too slow                 | Persist event to durable queue/outbox **before** returning 2xx; return non-2xx if persistence fails so Clerk retries |

## Testing & Deployment

**Local**: Use the Clerk CLI's first-party tunnel — no auth or linked project needed:

```sh
clerk webhooks listen --token "$(clerk webhooks token)" --forward-to http://localhost:3000/api/webhooks
```

Add the printed relay URL (`https://webhooks.clerk.com/in/c_.../`) as a webhook endpoint in the Dashboard — events don't flow until you do. `svix-*` headers are preserved, so `verifyWebhook()` works against that endpoint's signing secret as usual. Flags, offline signature checks (`clerk webhooks verify`), and agent-mode behavior are in the `clerk-cli` skill. Without the CLI, tunnel `localhost:3000` yourself (`ngrok`, `localtunnel`, `Cloudflare Tunnel`) and add the public URL to the Dashboard endpoint.

**Production**: Update webhook endpoint URL to production domain. Copy `CLERK_WEBHOOK_SIGNING_SECRET` to production env vars.

## References

| Reference                  | Description                                                                              |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| `references/frameworks.md` | Webhook handler examples for Express, Astro, Fastify, Nuxt, React Router, TanStack Start |

## See Also

- `clerk-cli` - `clerk webhooks listen`/`verify` for local webhook testing
- `clerk-setup` - Initial Clerk install
- `clerk-orgs` - Org membership events
- `clerk-billing` - Subscription, subscription item, and payment attempt events
- `clerk-backend-api` - Sync via direct API calls
