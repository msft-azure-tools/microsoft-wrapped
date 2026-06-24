# Rollout guide for colleagues

## Recommended setup

Use one internal Entra app registration and one GitHub Pages URL.

1. Enable GitHub Pages using GitHub Actions.
2. Add the Pages URL as a SPA redirect URI in the Entra app registration.
3. Set repository variables:
   - `VITE_ENTRA_CLIENT_ID=<app registration client id>`
   - `VITE_ENTRA_TENANT_ID=<your tenant id>`
4. Share the GitHub Pages URL in Teams.

## What colleagues see

- They sign in with their own Microsoft account.
- The SPA requests delegated Graph scopes.
- The browser calls Microsoft Graph `/me` using their token.
- They only receive their own aggregate Wrapped stats.
- They download the final PNG and manually share it.

## What colleagues cannot do

- Search aliases.
- View another user.
- Use admin mode.
- Trigger application-permission queries.
- See mail subjects/content, chat messages, transcripts, recordings or meeting subject text.

## Scaling notes

- There is no backend or server cache in the GitHub Pages version.
- Data never leaves the user's browser except calls to Microsoft Graph.
- If many users launch at once, Graph throttling is possible but usually acceptable for a fun internal MVP.
- Azure Static Web Apps + Functions can be reintroduced later if persistent cache becomes necessary.

