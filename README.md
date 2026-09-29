# vue.ts.todo.pet

## Accounts and cloud storage

The app uses Supabase Auth (email/password) and PostgreSQL for tasks and categories.
Each account owns its records; database row-level security enforces this ownership.
Open the same website and sign in to the same account on another device to load the
same data. Click **Refresh** or reload the page to fetch changes made on another
device. Returning focus to the window does not refresh data. This version does not
use live Realtime subscriptions.

### Create the Supabase project

1. Create a project at [Supabase](https://supabase.com/dashboard).
2. In **SQL Editor**, run `supabase/migrations/202609290001_accounts_and_todos.sql`
   once against the new project. It creates both tables, owner-only access policies,
   and the atomic browser-data import function.
   Then run `supabase/migrations/202609290002_category_deletion.sql` to preserve
   tasks when a category is deleted.
3. Enable email/password signups and email confirmation in the Auth configuration.
   Configure the password minimum to at least 8 characters. For reliable public
   registration, [configure your own SMTP provider](https://supabase.com/docs/guides/auth/auth-smtp); the default email service is
   intended for testing and restricts recipients and sending rates.
4. In **Authentication → URL Configuration**, set Site URL to
   `https://maximzp83.github.io/myTodoApp/`. Add that URL and
   `http://localhost:5173/` to the allowed redirect URLs. Email confirmation links
   return users to the app at its configured base path.
5. From the **Connect** panel, copy the Project URL and **Publishable key**.
   Use these public client values only. Never use a secret key, `service_role` key,
   or a database password in a Vite environment variable or frontend source.

See the official [Vue quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/vue),
[Auth documentation](https://supabase.com/docs/guides/auth), and
[row-level security guide](https://supabase.com/docs/guides/database/postgres/row-level-security).

### Run locally

Create `.env.local` using the variable names in `.env.example`, with your project
URL and publishable key, then run `npm ci` and `npm run dev` (Node 24).
The `.env.local` file is ignored by Git. Without cloud configuration, the app shows
an unavailable-services message and disables sign-in; it does not fall back to
shared browser-only tasks.

Register, confirm the email, and sign in. Passwords are handled by Supabase Auth.
Only the SDK's session and the theme preference are persisted in the browser for
new accounts. Existing local Todo data is preserved. If your cloud account is
empty, an **Import browser tasks** button uploads the previous tasks and categories
from this browser after explicit confirmation by clicking it. The import is
transactional and does not delete local originals.

### Category editing and deletion

Hover over a custom category tab and click its pencil button to reveal **Edit category**
and **Delete category**. The pencil also appears on keyboard focus and stays visible on
touchscreens. Clicking it again or pressing Escape closes the actions; switching tabs
also closes them.
Renaming keeps its tasks and rejects duplicate names. Deletion requires confirmation;
tasks retain their completion, priority, and owner and move to **Uncategorized**.

For an existing Supabase project, run only the contents of
`supabase/migrations/202609290002_category_deletion.sql` in **SQL Editor → New query → Run**
before deploying this update. Do not rerun the initial table-creation migration.
The new migration changes the foreign key without deleting existing data.

### Deploy to GitHub Pages

1. In the repository, open **Settings → Secrets and variables → Actions → Variables**.
   Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
2. Open **Settings → Pages** and select **GitHub Actions** as the publishing source.
3. Push to `main` or manually run **Deploy Todo app to GitHub Pages** in Actions.
   The workflow installs dependencies, runs `npm run verify`, and publishes `dist`.
   It supplies `VITE_BASE_PATH=/myTodoApp/` automatically from the repository name.
4. Open `https://maximzp83.github.io/myTodoApp/`.

Changing either cloud variable requires a new deployment because Vite embeds these
public values in the build. A custom domain needs `VITE_BASE_PATH=/` in the workflow
and matching Supabase Auth URLs.

### Verification

`npm run verify` checks TypeScript, lint, formatting, unit tests, and the build.
`npm run verify:e2e` runs Chrome tests using an intercepted test-only Supabase API.
These tests cover registration, login/logout, account isolation in the UI,
failed writes, and shared server data across separate browser contexts. They do not
prove that a remote project's schema or RLS policies have been applied.
Run `supabase/tests/ownership.sql` in the project's SQL Editor to check database
ownership policies; it uses disposable records in a transaction and rolls them back.
It also checks category rename/delete isolation and task preservation. Both migrations
must be applied first. `supabase/tests/local.sql` is a separate test runner for an empty,
disposable PostgreSQL 15+ database; do not run that bootstrap in your Supabase project.
Finally check real email confirmation and the same account in two devices against
the configured project before treating deployment as complete.

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
npm run build

# Runs the end-to-end tests
npm run test:e2e
# Runs the tests only on Chromium
npm run test:e2e -- --project=chromium
# Runs the tests of a specific file
npm run test:e2e -- tests/example.spec.ts
# Runs the tests in debug mode
npm run test:e2e -- --debug
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
