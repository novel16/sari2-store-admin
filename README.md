# Sarisari Admin

Platform administration SPA built with React, strict TypeScript, Vite, and Tailwind CSS. The store-owner app is a separate repository at `../frontend`.

## Local setup

```powershell
npm.cmd ci
Copy-Item .env.example .env
npm.cmd run dev
```

Open `http://localhost:3001`. The development and preview servers require port **3001**; they fail if that port is occupied. The store app uses **3000**, and the API origin must match its published port (**80** in this workstation's Sail setup; **8000** is the non-Docker fallback). Keep the same hostname (`localhost`) for all three.

Environment variables are public build configuration:

| Variable          | Default                 | Purpose               |
| ----------------- | ----------------------- | --------------------- |
| `VITE_API_URL`    | `http://localhost:8000` | Laravel API origin    |
| `VITE_CLIENT_URL` | `http://localhost:3000` | Link to the store app |

Create the first administrator through the API's existing interactive command:

```powershell
cd ../api
php artisan app:create-platform-admin
```

The command asks for a hidden password and confirmation. There are no default credentials and no public admin signup. See [API setup](../api/ADMIN_SETUP.md) for access rules and endpoint details.

After signing in, use **Administrators** to create additional independent administrators. **My profile** edits your own identity/password. See [administrator management](../api/ADMIN_USERS_SETUP.md).

## Current features

- Cookie/session login, remember-me, session restoration, protected routes, explicit logout, and access-denied recovery.
- Forgot/Reset Password: public recovery pages, matching password validation, generic responses, and browser sign-out completion before login. The API chooses the email destination from the saved role. See [recovery setup](../api/ADMIN_PASSWORD_RECOVERY_SETUP.md).
- Live platform overview: account/store/user/administrator totals and statuses, daily account registrations for 30 Philippine calendar days, and recent accounts/stores.
- Accounts and stores: server search, status filters, pagination, linked details, and stores scoped to an account.
- Account/store availability: suspend/reactivate with a required reason, server review and explicit confirmation, paginated immutable status history, and same-request recovery. Parent account restrictions preserve individual store statuses. See [status management](../api/ADMIN_STATUS_SETUP.md).
- Administrators: searchable directory, independent account creation, reviewed suspend/reactivate, immutable history, and self/last-active protections. Passwords remain transient inputs and are excluded from recovery storage.
- My profile: identity/email and password changes with current-password proof for credential changes and revocation of other sessions.
- Plans: database-backed pricing, create/edit/retire, publication validation, immutable term versions, change notes, and stale-edit protection. See [plan setup](../api/PLANS_SETUP.md).
- Account subscriptions: manual Basic activation/renewal, verified payments or complimentary grants, server review/confirmation, scheduled periods, immutable history, and safe confirmation retries. See [subscription setup](../api/SUBSCRIPTIONS_SETUP.md).
- Subscription monitoring: cross-account search, state/account-status filters, summary cards, 7/30-day expiry windows, continuous prepaid coverage, scheduled renewals, and management shortcuts. See [monitoring setup](../api/SUBSCRIPTION_MONITORING_SETUP.md).
- Activity log: read-only combined administrator, account/store status, plan-version, and subscription history; saved actor/target names, search, module/action/administrator/date filters, cursor navigation, and internal detail links. See [activity setup](../api/ADMIN_ACTIVITY_SETUP.md).
- Website & SEO: structured public content, page metadata, image uploads, section order/visibility, saved draft preview, version-checked publication, and revision restore as draft. Public pricing comes from Plans. See [website setup](../api/WEBSITE_SETUP.md).
- Responsive navigation with keyboard dismissal/focus handling, plus loading, empty, error, retry, and missing-record views.

Account/store profile fields remain read-only, with separate status controls and a Manage subscription action in account details. Automatic billing, GCash, and private store operations remain future work. Plus/Pro activation stays unavailable.

## Source organization

```text
src/
  App.tsx                # Provider/router composition only
  routes/                # Lazy-loaded route definitions
  auth/                  # Session context, API calls, guards, role checks
  api/                   # Credentialed HTTP client, CSRF, error normalization
  layouts/               # Admin shell, sidebar, header, mobile drawer
  pages/
    auth/                # Login and public password recovery pages/components
    dashboard/           # Overview, metrics, chart, recent records
    accounts/            # Account directory, table, details
    stores/              # Store directory, table, details
    plans/               # Catalog list, editor, form, version history
    subscriptions/       # Account periods, settlement form, review, history
    activity/            # Centralized platform activity page
    website/             # Website editor and revision history
  components/            # Shared presentation and query states
  hooks/                 # Abortable query and debounce behavior
  platform/              # Platform types, URL filters, date/count formatting
  plans/                 # Plan API, types, exact price parsing and labels
  subscriptions/         # Account subscription API and types
  subscriptionMonitoring/ # Cross-account filters, summary cards and coverage table
  statusManagement/      # Account/store review, confirmation, recovery and history
  administrators/        # Admin directory, creation/status APIs and recovery
  settings/              # Current administrator profile/password API
  activity/              # Audit filters, searchable actor picker, timeline and types
  website/               # Content/SEO types and admin API
  testing/               # Node tests against actual TypeScript sources
```

Keep page-specific UI beside its page. Extract components when reused or when a page has a distinct responsibility that deserves its own file. API authorization and validation remain on the server. Do not put application flows into `App.tsx`.

All API calls go through `api/http.ts`. Mutating authentication requests acquire a CSRF cookie and retry only one explicit HTTP 419 response. No credentials or auth tokens are stored in browser storage. The query hook cancels abandoned reads, avoids showing another query's stale records, and restores auth on 401/403. Search/status/page/account filters are kept in the URL.

The two local SPAs share the API session cookie. An existing store-owner session shows an access-denied screen with an explicit sign-out action; opening the admin app does not silently sign out the store user.

Recovery pages remain accessible with an existing session. A confirmed password reset removes its token query and finishes browser logout/verification before returning to login; completion failures retry only that final step. Credentials and reset tokens remain outside browser storage. Local mail uses the API's log mailer; configure deployment SMTP and the API's `ADMIN_URL` for actual inbox delivery and the correct admin reset destination.

Activity defaults to the last 30 Philippine days, accepts up to 366 inclusive days, and keeps filters/cursors in the URL. Refresh returns to the newest records while preserving filters. It is a live feed; older late-committed events may appear while navigating. Legacy plan versions without a saved actor name show a missing-name label rather than today's name. All displayed activity times are PHT.

## Checks

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

On an 8 GB development machine, use `node --test --test-concurrency=1` and run each app's tests, lint, and build sequentially.

`npm test` discovers every `*.test.mjs` suite. Tests cover administrator eligibility, safe return URLs, credentialed authentication endpoints, bounded CSRF retries, network failures, error normalization, directory inputs, and Philippine date formatting. Browser checks also cover real API login, filtering/pagination, details, access revocation, and mobile navigation. Strict TypeScript and the React hooks lint rules remain enabled. Lazy pages have a recovery screen with page reload and dashboard actions if loading or rendering fails.

The Prettier configuration defines source formatting. For deployment, configure the host to serve `index.html` for SPA routes, and configure Laravel's exact allowed origin, stateful domain, cookies, and HTTPS settings for the deployed hosts.
