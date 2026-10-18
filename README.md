# Sarisari Admin

Platform administration SPA built with React, strict TypeScript, Vite, and Tailwind CSS. The store-owner app is a separate repository at `../frontend`.

## Local setup

```powershell
npm.cmd ci
Copy-Item .env.example .env
npm.cmd run dev
```

Open `http://localhost:3001`. The development and preview servers require port **3001**; they fail if that port is occupied. The store app uses **3000**, and the API defaults to **8000**. Keep the same hostname (`localhost`) for all three.

Environment variables are public build configuration:

| Variable          | Default                 | Purpose               |
| ----------------- | ----------------------- | --------------------- |
| `VITE_API_URL`    | `http://localhost:8000` | Laravel API origin    |
| `VITE_CLIENT_URL` | `http://localhost:3000` | Link to the store app |

Create an administrator through the API's existing interactive command:

```powershell
cd ../api
php artisan app:create-platform-admin
```

The command asks for a hidden password and confirmation. There are no default credentials and no public admin signup. See [API setup](../api/ADMIN_SETUP.md) for access rules and endpoint details.

## Current features

- Cookie/session login, remember-me, session restoration, protected routes, explicit logout, and access-denied recovery.
- Live platform overview: account/store/user/administrator totals and statuses, daily account registrations for 30 Philippine calendar days, and recent accounts/stores.
- Accounts and stores: server search, status filters, pagination, linked details, and stores scoped to an account.
- Account/store availability: suspend/reactivate with a required reason, server review and explicit confirmation, paginated immutable status history, and same-request recovery. Parent account restrictions preserve individual store statuses. See [status management](../api/ADMIN_STATUS_SETUP.md).
- Plans: database-backed pricing, create/edit/retire, publication validation, immutable term versions, change notes, and stale-edit protection. See [plan setup](../api/PLANS_SETUP.md).
- Account subscriptions: manual Basic activation/renewal, verified payments or complimentary grants, server review/confirmation, scheduled periods, immutable history, and safe confirmation retries. See [subscription setup](../api/SUBSCRIPTIONS_SETUP.md).
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
    auth/                # Login page and form
    dashboard/           # Overview, metrics, chart, recent records
    accounts/            # Account directory, table, details
    stores/              # Store directory, table, details
    plans/               # Catalog list, editor, form, version history
    subscriptions/       # Account periods, settlement form, review, history
  components/            # Shared presentation and query states
  hooks/                 # Abortable query and debounce behavior
  platform/              # Platform types, URL filters, date/count formatting
  plans/                 # Plan API, types, exact price parsing and labels
  subscriptions/         # Account subscription API and types
  statusManagement/      # Account/store review, confirmation, recovery and history
  testing/               # Node tests against actual TypeScript sources
```

Keep page-specific UI beside its page. Extract components when reused or when a page has a distinct responsibility that deserves its own file. API authorization and validation remain on the server. Do not put application flows into `App.tsx`.

All API calls go through `api/http.ts`. Mutating authentication requests acquire a CSRF cookie and retry only one explicit HTTP 419 response. No credentials or auth tokens are stored in browser storage. The query hook cancels abandoned reads, avoids showing another query's stale records, and restores auth on 401/403. Search/status/page/account filters are kept in the URL.

The two local SPAs share the API session cookie. An existing store-owner session shows an access-denied screen with an explicit sign-out action; opening the admin app does not silently sign out the store user.

## Checks

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

`npm test` discovers every `*.test.mjs` suite. Tests cover administrator eligibility, safe return URLs, credentialed authentication endpoints, bounded CSRF retries, network failures, error normalization, directory inputs, and Philippine date formatting. Browser checks also cover real API login, filtering/pagination, details, access revocation, and mobile navigation. Strict TypeScript and the React hooks lint rules remain enabled. Lazy pages have a recovery screen with page reload and dashboard actions if loading or rendering fails.

The Prettier configuration defines source formatting. For deployment, configure the host to serve `index.html` for SPA routes, and configure Laravel's exact allowed origin, stateful domain, cookies, and HTTPS settings for the deployed hosts.
