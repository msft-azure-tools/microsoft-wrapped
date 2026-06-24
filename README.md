# Teams & Outlook Wrapped

Internal Spotify Wrapped-style app for Microsoft 365 work metadata. This version is frontend-only and can be hosted on GitHub Pages.

## What it does

- React + TypeScript frontend for GitHub Pages.
- Microsoft Entra ID login with MSAL.
- Uses Microsoft Graph `/me` directly from the signed-in user's browser.
- Users only see their own data.
- Aggregates the last 12 months of calendar, mail and Teams metadata.
- Never returns mail subject/body, chat message text or calendar subject text to the UI.
- Exports the current Wrapped story card as PNG.
- Does not require Azure hosting, Azure Functions or a resource group.

## Architecture

```text
React SPA
  -> MSAL delegated login
  -> Microsoft Graph /me endpoints only
  -> local browser aggregation
  -> privacy-safe Wrapped story cards
```

## Entra app registration

Create a SPA app registration and add redirect URIs:

- Local: `http://localhost:5173`
- GitHub Pages: `https://<org-or-user>.github.io/<repo>/`

Set supported account types to your organization/tenant only for an internal rollout.

Delegated Graph scopes:

- `User.Read`
- `Calendars.Read`
- `Mail.ReadBasic`
- `People.Read`
- `Chat.ReadBasic`

No application permissions are used. There is no admin mode, alias search or cross-user lookup.

Copy `.env.example` to `.env` and set `VITE_ENTRA_CLIENT_ID`.

For production, set `VITE_ENTRA_TENANT_ID` to your tenant ID instead of `organizations`.

## Local run

```powershell
npm run install:all
npm run dev
```

Open `http://localhost:5173`.

For local Entra redirect URI, add `http://localhost:5173` to the app registration as a SPA redirect URI.

## Privacy contract

The app does not request or display these fields:

- Email subject
- Email body/content
- Chat message content
- Meeting recordings
- Meeting transcripts
- Meeting subject text in UI

The UI only receives aggregate counts, durations, weekday/month buckets, badges and collaborator metadata.

## Deploy to GitHub Pages

1. Push `teams-wrapped-app` to your GitHub repo.
2. In GitHub repo settings, enable Pages with GitHub Actions.
3. Add repository variables:
   - `VITE_ENTRA_CLIENT_ID`
   - `VITE_ENTRA_TENANT_ID`
4. Add the GitHub Pages URL as a SPA redirect URI in the Entra app registration.
5. Push to `main` or run the `Deploy GitHub Pages` workflow manually.

The deployed link will look like:

```text
https://<org-or-user>.github.io/<repo>/
```

- `.github/workflows/github-pages.yml` for CI/CD.
- `docs/graph-permissions.md` for permission review.
- `docs/rollout.md` for sharing with colleagues.

## Share with colleagues

Deploy once, then share the GitHub Pages URL in Teams. Every colleague signs in and receives only their own `/me` data. See `docs/rollout.md`.

