# Grimório de Bolso

A mobile-first PWA for esoteric practice tracking, with XP progression, an in-app
economy, a community layer and tiered paid content unlocked automatically from an
external payment platform.

**Live:** [daily-arcane.com](https://daily-arcane.com)

> Interface and content are in Brazilian Portuguese. This document is in English.

<!-- TODO: add a screenshot or GIF here. Two or three screens is enough.
     Drag an image into a GitHub issue comment to get a hosted URL, then use it. -->

---

## What it is

Users log personal esoteric practices — meditation, sigil work, tarot draws — and
earn XP and in-app currency for consistency. Progression unlocks mastery levels;
currency buys cosmetic items from a shop. Around that sits a social layer: a
community forum, friendships, item trading, private correspondence and a ranking
board.

Some content is free; some is unlocked by buying an ebook or holding an active
subscription pass. Purchases happen on Hotmart, a third-party checkout platform,
which means access has to be granted asynchronously by webhook — the user never
returns to the app to "activate" anything.

I built and run this end to end: schema, frontend, gamification economy, payment
integration, deployment.

## Stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite, Tailwind, installable PWA with service worker |
| Backend | Supabase (Postgres, Auth, PostgREST) |
| Business logic | Postgres functions (PL/pgSQL) — XP, entitlements, grant queue |
| Payments | Hotmart → Cloudflare Worker → Supabase |
| Hosting | Cloudflare Pages (app) and Workers (webhook, custom domain) |
| Migrations | Plain SQL, versioned, applied in order |

There is no application server. Authorization lives in the database as Row Level
Security policies, and the only privileged code path is the webhook Worker.

## Engineering notes

The parts of this project I'd actually want to discuss in an interview.

### Authorization is a database concern, not a frontend one

Every table has RLS enabled, and access tiers are expressed as policies rather than
as checks in React. A user reads their own rows; premium content is gated on an
`entitlements` row or an active pass; moderation tables have no policy at all, so
they are reachable only by the service role.

The practical consequence is that a bug in the client cannot leak paid content — the
query simply returns nothing. Policies carry inline comments explaining the intent of
each rule, because a policy you can't read is a policy you'll eventually break.

### The webhook is built around the assumption that it will fail

Hotmart deactivates a webhook endpoint that returns errors. Returning `5xx` to force
a retry would therefore risk taking down *every* future sale, not just the failed
one. So the Worker always responds `200`, and reliability is handled a different way:

1. **Persist the raw payload first.** Every event is written to `webhook_events`
   before any processing. If processing fails, the event still exists and can be
   replayed.
2. **Idempotency lives in the database.** Unique indexes on `circle_passes.ref_id`
   and on `pending_grants (ref_id, grant_kind, grimoire_id)`, plus
   `Prefer: resolution=ignore-duplicates` on entitlements. Reprocessing an event is
   safe by construction — no double grants.
3. **Purchases from users who don't exist yet.** A buyer may not have an account when
   they pay. Those grants go into a `pending_grants` queue applied by a trigger on
   `on_auth_user_created`, so signing up later collects everything owed.
4. **Unknown products still grant access.** Rather than registering each new product
   id by hand, any approved purchase that isn't the subscription grants a month of
   access; the content entitlement is added only when the product maps to a known
   item. New releases work without configuration.

Monitoring is one query:

```sql
select received_at, event, transaction_ref, error
from webhook_events
where processed_at is null
order by received_at desc;
```

An empty result means nobody paid without receiving access.

### Secrets

Nothing sensitive is committed. `wrangler.jsonc` carries only public values (project
URL, product id); the Hotmart shared secret and the Supabase service role key are
Cloudflare Worker secrets, set with `wrangler secret put`. The Worker redacts any
key matching the secret's name before logging a payload.

## Layout

```
src/                    React app
supabase/migrations/    Versioned SQL — schema, RLS policies, functions
webhook/                Cloudflare Worker handling Hotmart events
public/                 PWA manifest, icons, service worker
docs/                   Design and implementation notes
```

## Running locally

```bash
npm install
cp .env.example .env.local   # add your Supabase project URL and anon key
npm run dev
```

The webhook is a separate deployment:

```bash
cd webhook
npx wrangler secret put HOTMART_HOTTOK
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler deploy
```

Note that deploying the Worker is independent of deploying the site — pushing to the
repository does not publish it.

## Status

In production and in active use. The admin panel lives in a separate private
repository, since it runs with elevated database privileges and is never deployed.
