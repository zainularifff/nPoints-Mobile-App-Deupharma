# OPS-Mobile — context handoff from the EMA backend work

This mobile app is a **separate project** that will consume the same shared
backend as the EMA web app (repo: `C:\Users\user\Desktop\Backup Server 67`).
The section below summarizes the multi-tenant login architecture built into
that backend on 2026-08-03, so a fresh session here has the context without
the user re-explaining it.

> **Update 2026-08-04**: the mobile-facing login IS now built and verified
> working (see "STATUS UPDATE" note inside the next section — the original
> "NOT built yet" callout below is outdated, kept only for the historical
> problem description above it). Two new sections were added at the bottom
> of this file today: **data-consistency fixes** (mobile numbers vs. the web
> Dashboard) and **iOS build readiness** — read the iOS section before
> running `eas build --platform ios`.

## The problem being solved

- **Web app**: one deployment per client (TM, BSN, CIMB, ...), each with its
  own `.env` pointing at its own single SQL Server DB. Unchanged, still works
  exactly as before.
- **Mobile app (this repo)**: ONE shared backend serves ALL clients. On
  login, the backend must figure out *which client* the user belongs to and
  dynamically connect to *that client's* database — the mobile app itself
  never knows or chooses which DB it's talking to.

## Master DB: `EMA_CONTROL` (on 192.168.140.90, same SQL Server instance as
the client test DB `TCO`)

Four tables:
- `EMA_Tenants` (TenantId PK identity, TenantCode, TenantName, **IsActive** bit)
  — TenantCode is the natural/business key (e.g. `"WSSB"`, `"TM"`). A
  **filtered unique index** (`UQ_EMA_Tenants_TenantCode_Active`) enforces only
  one *active* row per TenantCode at a time — but old/inactive rows for the
  same code are kept for history (not deleted), so TenantId doesn't get
  reused and existing mappings never silently break.
- `EMA_TenantDatabases` (TenantId PK/FK, ServerName, DatabaseName, DbUsername,
  `DbPasswordEncrypted`) — the actual connection info per tenant. Password is
  AES-256-GCM encrypted at rest (see `backend/utils/tenantCrypto.js`,
  key = `MASTER_DB_ENCRYPTION_KEY` env var, must be identical across every
  deployment that reads/writes this table).
- `EMA_MasterUsers` (MasterUserId PK identity, Email **UNIQUE**, PasswordHash)
  — global login identity, keyed by email so the same person *could* span
  multiple tenants (not currently used that way, but the schema allows it).
- `EMA_MasterUserTenants` (MasterUserId + TenantId + ClientUserId, unique on
  MasterUserId+TenantId) — maps a global login to a specific tenant's local
  user record (`ClientUserId` = the `UserID` in that tenant's own `EMA_Users`
  table).

## How EMA_CONTROL gets populated (self-registration, not a manual admin UI)

- Each web deployment's own **Settings → Notification Channels → System
  License Information** page now has a **Tenant Code** field (added next to
  License Name). Saving it (`POST /api/settings/system-license` in
  `backend/server.js`) pushes an upsert into `EMA_Tenants` +
  `EMA_TenantDatabases` using *that deployment's own* `.env` connection info
  (`backend/services/tenantRegistration.js`). This is how a tenant "registers
  itself" into the shared master DB — no separate admin screen needed.
- Creating a user (`POST /api/settings/users`) similarly pushes into
  `EMA_MasterUsers` + `EMA_MasterUserTenants`
  (`backend/services/masterUserRegistration.js`), resolving this
  deployment's active TenantId via its own TenantCode.
- Deleting a user (`DELETE /api/settings/users/:id`) removes the mapping and,
  if no other tenant references that MasterUserId, deletes the
  `EMA_MasterUsers` row too (explicit product decision — no orphaned
  identities left behind).
- All three pushes are best-effort: wrapped in try/catch so the **local**
  operation (save license / create user / delete user) always succeeds even
  if the master DB is unreachable; failure just logs a warning and sets
  `masterDbRegistered: false` / `masterDbDeregistered: false` in the response.

## What's built in the backend

> **STATUS UPDATE 2026-08-04**: everything below is now built AND wired up
> — the mobile login endpoint exists and was verified working end-to-end
> (tenant "WSSB" → DB `TCO`, confirmed via direct DB connection tests).
> ⚠️ **These backend changes are still uncommitted** in
> `C:\Users\user\Desktop\Backup Server 67` (`git status` shows `server.js`
> modified, not committed) — commit them once stable so this work isn't at
> risk of being lost.

Built and proven (via direct curl tests against the running server, plus a
fresh verification pass on 2026-08-04):
- `backend/dbConn/masterDbConn.js` — dedicated pool to `EMA_CONTROL`.
- `backend/dbConn/tenantDbConn.js` — dynamic **per-tenant** pool cache, keyed
  by TenantId, credentials resolved from `EMA_TenantDatabases` + decrypted.
  **Now wired in**: `getDbPool(req)` (`backend/server.js:478`) checks
  `req.user.tenantId` (set on mobile logins only) and calls
  `getTenantDbPool(tenantId)` when present, otherwise falls through to the
  single-tenant web behavior unchanged.
- `backend/utils/tenantCrypto.js` — AES-256-GCM encrypt/decrypt.
- `backend/services/tenantRegistration.js`, `masterUserRegistration.js`.
- **`POST /api/mobile/auth/login`** (`backend/server.js:2117`) — validates
  email+password against `EMA_MasterUsers`, resolves TenantId via
  `EMA_MasterUserTenants`, issues a JWT via `generateAccessToken()`
  (`backend/server.js:876`) with a `tenantId` claim mobile logins carry (web
  logins never set it, so `getDbPool` falls through unchanged for them).
  Multi-tenant-per-user (one login belonging to >1 tenant) is still an open
  design question — not resolved either way, but not blocking today's
  single-tenant-per-user flow.
- SQL migrations already applied live to `EMA_CONTROL`:
  `backend/sql/ema-control-schema-fixes.sql`,
  `backend/sql/ema-tenants-versioning.sql`.
- `backend/sql/ema-systemlicense-tenantcode.sql` — applied to the client DB
  (adds `TenantCode` to `EMA_SystemLicense`).
- `backend/sql/tco-missing-tables-append.sql` — 5 tables missing from the
  client-provisioning script `TCO_CREATE_Scripts.sql` (`EMA_SystemLicense`,
  `EMA_UserNotifications`, `EMA_ManagementDashboard_Snapshots`,
  `EMA_ManagementDecisions`, `EMA_EndpointPolicyWallpapers`) — verified
  present in the `TCO` test DB; still not merged into the original
  provisioning script (its file path on disk is still unknown).

## A critical gotcha already hit and fixed (don't reintroduce it)

`node-mssql`'s `sql.connect(config)` (the bare module-level function) shares
**one global connection pool per process** — calling it a second time with a
different config silently reuses whatever connected first, ignoring the new
config. This caused hours of "phantom" bugs (writes silently landing in the
wrong database). Fix: always use `new sql.ConnectionPool(config).connect()`
for any additional distinct DB connection in the same Node process. Both
`masterDbConn.js` and `tenantDbConn.js` already do this correctly — if you
add another DB connection anywhere in this mobile backend, use the same
pattern, never the bare `sql.connect()` shorthand.

## Practical stuff

- Backend repo: `C:\Users\user\Desktop\Backup Server 67\backend`, run via
  `npm run dev:backend` (nodemon + server-runner.js → server.js, ~60k lines).
  **Only ever run ONE instance** — port 3001 EADDRINUSE from stale/duplicate
  nodemon processes ate an enormous amount of time earlier; check
  `netstat -ano | grep 3001` before starting if in doubt.
- Test/dev SQL Server: `192.168.140.90`, client DB `TCO`, master DB
  `EMA_CONTROL`, both accessible with the same `sa` credential from
  `backend/.env`.
- This mobile app's own `.env` (`API_URL`) must point at the backend's LAN
  IP while testing locally on a real device via Expo Go — **not**
  `localhost`, which on a physical phone resolves to the phone itself, not
  the dev PC. As of 2026-08-04 it's set to the local backend's LAN IP for
  local testing; plan is to switch it to the real shared server
  (`192.168.140.100:3001`) once local testing is done. After changing it,
  restart with `npx expo start -c` (cache clear) so the new value is read.
- User's working style: concise, mixed Malay/English, wants direct fixes not
  long explanations, gets (rightly) frustrated by debugging churn — verify
  things empirically before claiming they work.

## Data-consistency fixes made 2026-08-04 (mobile numbers vs. the web Dashboard)

The mobile app and the web app's IT Operations Dashboard both read from
`/api/dashboard/it-operations`, but the mobile app had its own client-side
logic layered on top in `src/services/opsMobileService.ts` that computed a
few numbers differently from the web app — causing the same metric to show
different values on each. Ground truth for "what's the correct definition"
was traced to the actual backend SQL (`getItOpsGeoSummary` /
`getItOpsPatchSummary` in `backend/server.js`), not to either frontend's
code comments — a web-app code comment about `trackedDevices` turned out to
be wrong, only caught by cross-checking against a *different* web view of
the same field.

**Geolocation "Detected" / "Not Detected"** (`GeolocationSummaryScreen.tsx`,
Overview screen's "Geo Detected" KPI):

- Backend truth: `getItOpsGeoSummary` buckets every device with a GPS record
  into exactly one of `trackedDevices` (fresh, ≤7 days), `staleLocations`
  (has a record, but >7 days old), or neither (no record at all) — tracked
  and stale are **separate, non-overlapping** buckets, not one containing
  the other.
- "Detected" = `trackedDevices` (fresh only). "Not Detected" = everything
  else (`totalDevices - trackedDevices`), i.e. stale-or-never, matching the
  web Dashboard's "Not Detected (7+ days)" framing.
- Mobile was previously computing this by fuzzy-matching device
  ID/name strings between two separately-fetched lists (endpoint inventory
  vs. geolocation rows) — unreliable, undercounted "Detected" badly (was
  showing single digits where the true count was ~50). Fixed to source the
  aggregate counts from the backend's own `trackedDevices`/`staleLocations`
  fields instead (`fetchGeolocationSummary` in `opsMobileService.ts`), and
  fixed the same freshness definition in the per-device `hasLocation` flag
  so the summary cards and the device table never disagree.

**Patch "Missing Patches" → "Need Patching"** (`PatchComplianceScreen.tsx`):

- The web Dashboard's "NEED PATCHING" KPI counts **distinct devices** with
  ≥1 missing applicable patch, using a stricter "installed" rule
  (`IsDownloaded` does NOT count as installed — see `aggregatePatch` in the
  web's `Dashboard.tsx`).
- The mobile-facing `getItOpsPatchSummary` backend function only returned a
  **per-patch-record** missing count (and treated `IsDownloaded` as
  installed), which is a different, smaller/inflated number than the web's
  device-level figure — not a bug in either query individually, just two
  different questions being asked.
- Fixed by adding a new `MissingPatchDevices` column to
  `getItOpsPatchSummary`'s SQL (`COUNT(DISTINCT ... Object_Root_Idn)`,
  matching the web's stricter installed rule) and threading it through to
  the `/api/dashboard/it-operations` response's `patchSummary` object.
  Mobile now reads `missingPatchDevices` for this card instead of the old
  `missingPatches` record count.

**Still open / not investigated further**: a SQL syntax error
(`"Incorrect syntax near the keyword 'ORDER'"`) was seen once in the
backend's console log for `/api/dashboard/it-operations`, surfaced via the
generic `"Failed to load IT operations dashboard"` error banner on mobile
(the real error is in `err.message`/backend console, not sent to the
client). Root cause (which dynamic query) was not identified — it didn't
reproduce on subsequent requests. If this error banner reappears, check the
backend terminal output first; the actual SQL error is only logged there,
never sent to the mobile client body.

## iOS build readiness (2026-08-04)

The app code itself is already cross-platform — plain Expo/React Native,
no Android-only native modules in the JS layer, and existing
`Platform.OS === "ios"` branches (`LoginScreen.tsx`, `LiveReportScreen.tsx`,
`mobileReportPdf.ts`, `secureStorage.ts`) show iOS was already accounted
for in the app logic. Two **native config gaps** were found and fixed in
`app.config.js` — without these, an iOS build either fails outright or
builds but can't reach the backend:

1. **Missing `ios.bundleIdentifier`** — required for any EAS iOS build,
   wasn't set at all (only `android.package` existed). Added
   `bundleIdentifier: "com.zainul1595.opsmobile"` (mirrors the Android
   package name). **If a different Bundle ID is already reserved in the
   Apple Developer account, change this value before building** — it must
   match whatever's registered there.

2. **Missing iOS ATS (App Transport Security) exception** — the backend
   serves plain HTTP (`http://...`, no TLS), which iOS blocks by default.
   Android already had a scoped fix for this
   (`plugins/withAndroidNetworkSecurity.js` — a custom config plugin that
   allowlists cleartext traffic *only* for the configured API host, not
   globally). iOS had no equivalent, so **every network call to the
   backend would have failed silently on a real iOS build** even though
   the app itself would launch fine. Fixed by adding a matching scoped
   `NSAppTransportSecurity` / `NSExceptionDomains` entry to
   `ios.infoPlist` in `app.config.js`, computed dynamically from whichever
   API host is active at build time (same `EXPO_PUBLIC_API_BASE_URL` /
   `API_URL` precedence `src/config/api.ts` uses) — so it always tracks
   the current `.env`/EAS secret without manual edits. Verified with
   `npx expo config --json` that both the bundle ID and the ATS exception
   resolve correctly.
   - **This is a per-build-time snapshot**: if `API_URL` changes (e.g.
     switching from the local LAN IP to the real `192.168.140.100:3001`
     server, or eventually a real HTTPS domain), a **new build** is
     needed for the ATS exception to cover the new host — it's baked in
     at build time, not read at runtime.
   - **Once the backend has real HTTPS**, this whole ATS exception block
     becomes unnecessary and should be removed — cleartext exceptions are
     a workaround for HTTP-only backends, not something to keep long-term.

**To actually build for iOS**:

- Needs an Apple Developer account (paid, ~USD99/year) for code signing —
  no way around this for a real device build or TestFlight.
- **No Mac required** — EAS Build runs in the cloud:
  `eas build --platform ios`
- First run will prompt to generate iOS credentials (distribution
  certificate + provisioning profile); choosing "Let EAS handle it" is the
  simplest path and matches how this project's Android credentials are
  already managed.
- For local device testing before a full TestFlight submission, use the
  `development` profile in `eas.json`
  (`eas build --profile development --platform ios`) to get an installable
  dev client.
- `eas.json` currently has no iOS-specific overrides in any build
  profile — Expo's defaults apply. Add an `"ios": {...}` block per profile
  (mirroring the existing `"android": {...}` blocks) only if a specific
  need comes up (e.g. `"simulator": true` on the `development` profile for
  Simulator-only builds that skip signing entirely).

## Mobile-only dashboard APIs split out (2026-08-10)

Every dashboard-driven screen used to read from the same endpoint as the
web app, `GET /api/dashboard/it-operations` — one call that fans out to 8
backend summary queries (hardware, software, network, geolocation, tasks,
incidents, patch, department rows) and returns all of it in one big
payload, because that's what the web Dashboard needs. Mobile only ever
read a slice of that per screen, but paid for the full fan-out on every
call — this was the actual cause of "loads everything at once" sluggishness
on app open (`OverviewHomeScreen` alone fired the full snapshot + aging +
worklist + geolocation all on mount).

Fixed by adding **new, mobile-only endpoints** in their own file (originally
`backend/routes/mobileDashboard.js`, since folded into
`backend/routes/mobiles_server.js` on 2026-08-13 — see that dated section
below) — a factory function, same pattern as the existing
`backend/routes/aiAssist.js`. It receives references to the existing
`getItOps*Summary` functions and `getDbPool` as injected `services` (no SQL
duplicated, no direct coupling to server.js internals) and each route calls
only the summary helper(s) it actually needs. `server.js` itself only
gained a `require` + `app.use(...)` mount — the route bodies live in the
routes file, not inline in the 60k-line server.js.
`/api/dashboard/it-operations` itself and the web app are untouched — this
was additive only.

| Mobile endpoint | Backend queries | Replaces |
|---|---|---|
| `GET /api/mobile/dashboard/overview` | hardware + incidents + patch (3) | snapshot's endpoint/ticket/patch numbers |
| `GET /api/mobile/dashboard/tickets` | incidents (1) | ticket alert list |
| `GET /api/mobile/dashboard/patch` | patch (+ dept rows fallback) | patch compliance breakdown |
| `GET /api/mobile/dashboard/risk` | hardware + geo (2) | device risk summary |
| `GET /api/mobile/dashboard/software` | software (1) | software inventory summary |
| `GET /api/mobile/dashboard/geo-summary` | hardware + geo (2) | geolocation "Detected" totals |

Note: `getItOpsRiskSummary` takes `{ hardware, patchSummary, network,
geolocation, tasks }` but only actually reads `hardware`/`geolocation`
internally — `patchSummary`/`network`/`tasks` are unused dead params, so
the risk endpoint passes `{}` for those three and stays a 2-query call.

`src/services/opsMobileService.ts` was repointed at these — every
`fetchXxxSummary`/`fetchXxx` function now hits its own lean endpoint
instead of sharing the old `requestOperationsDashboard()` call into
`/api/dashboard/it-operations`. Existing per-function caching
(`fetchWithCache`, same TTLs) and all screen-facing type shapes are
unchanged, so no screen component needed edits.

Already-separate endpoints (`/api/task-list`, `/api/hardware-inventory/assets`,
`/api/geolocation/all-live`, `/api/reports/catalog`,
`/api/dashboard/device-aging`, `/api/dashboard/it-operations/patch-devices`)
were untouched — they were already lean and dedicated, not part of the
mega-endpoint problem.

**Still true, not addressed by this change**: `OverviewHomeScreen` still
fires 4 concurrent calls on mount (overview + aging + worklist +
geolocation) — each is now cheap individually, but if further smoothing is
wanted, the next step is lazy/staggered loading on that screen rather than
more backend splitting.

⚠️ Same as the rest of this file's backend notes: these route additions
are sitting in `backend/server.js` **uncommitted** alongside the other
already-uncommitted changes there — commit backend work once verified
against a live server.

## Mobile API consolidated into one file: `backend/routes/mobiles_server.js` (2026-08-13)

The mobile-only dashboard routes (previous section) had ended up in
`backend/routes/mobileDashboard.js`, while the mobile login/2FA routes
(`POST /api/mobile/auth/login`, `/api/mobile/auth/2fa/setup`,
`/api/mobile/auth/2fa/verify`) were still inline in `server.js` from when
they were first built — so the mobile app's whole API surface was split
across two places. Consolidated on request into a single file:
**`backend/routes/mobiles_server.js`**, replacing `mobileDashboard.js`
(deleted) and the three inline auth handlers (removed from `server.js`).

- Same factory-function pattern as `routes/aiAssist.js`: one
  `createMobileApiRouter(services)` export, receiving every helper it needs
  (pool resolvers, `getItOps*Summary` functions, auth helpers,
  `speakeasy`/`qrcode`, `sql`, `bcrypt`, `authenticateToken`) as injected
  `services` — no direct reach into `server.js` internals, no SQL
  duplicated.
- One router, two zones: `/auth/*` sub-routes are **public** (no
  `authenticateToken` — login/2FA run before any JWT exists), `/dashboard/*`
  sub-routes carry `authenticateToken` **per-route** instead of at the
  `app.use()` level, since both zones now share one mount point.
- `server.js` mounts it once: `app.use('/api/mobile', createMobileApiRouter({...}))`
  (search `MOBILE API — /api/mobile/*`) — right where the old inline auth
  routes used to start. All 9 URLs are byte-identical to before
  (`/api/mobile/auth/login`, `/api/mobile/auth/2fa/setup`,
  `/api/mobile/auth/2fa/verify`, `/api/mobile/dashboard/{overview,tickets,
  patch,risk,software,geo-summary}`), so **no change was needed on the
  mobile app side** — `opsMobileService.ts`/`authService.ts` call the same
  paths as before.
- Verified with `node --check` on both `server.js` and the new routes file.

### ⚠️ Live-server finding from testing this (still unresolved)

While screenshotting the app for the user manual with real login
(`wani@worldtech.com.my`, tenant "EMA CLIENT A"), found that the app's
`.env` `API_URL` points at `http://103.191.75.232:3001` — a server that
**does not have** the `/api/mobile/dashboard/*` routes deployed yet (they
only exist in this local, uncommitted `backend/server.js`). Hitting a
missing route there falls through to Express's static-file handler, which
fails to find `dist/index.html` on that box and returns a raw HTML ENOENT
error — which the app then renders inline instead of data. Confirmed
broken **right now** on that live server: Overview home, Ticket Workload,
Patch Compliance, Reports (all of which read `/api/mobile/dashboard/overview`
or `/tickets` or `/patch`). Unaffected: Managed Endpoints, Geolocation
(degrades gracefully), Aging Devices, Settings, Task List — none of those
depend on the new routes. **Needs backend deployment to `103.191.75.232`
before those four screens work for real users**, not just a local fix.

### Other loose end noticed during the same testing pass

**Device Risk** and **Software Overview** screens (`DeviceRiskScreen.tsx`,
`SoftwareOverviewScreen.tsx`) are fully built and registered in
`OverviewStack`, but — like `AlertsScreen` before them — have **no button
anywhere in the app that navigates to them**. Not touched; just documented
(and flagged in the user manual) so it doesn't look like an oversight if
noticed later. Add a Quick Action tile or KPI card for each if they're
meant to be reachable.
