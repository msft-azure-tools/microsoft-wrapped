# Graph permissions

This app is intentionally self-service only.

## Required delegated permissions

| Permission | Type | Purpose |
|---|---|---|
| `User.Read` | Delegated | Read the signed-in user's profile from `/me`. |
| `Calendars.Read` | Delegated | Read calendar metadata from `/me/calendarView`. |
| `Mail.ReadBasic` | Delegated | Count sent/received mail and basic recipient/sender metadata. |
| `People.Read` | Delegated | Optional enrichment for people/collaboration context. |
| `Chat.ReadBasic` | Delegated | Read Teams chat metadata from `/me/chats`. |

## Explicitly not used

- Application permissions
- Admin mode
- Alias search
- Cross-user queries
- Mail body, mail subject, chat message body, meeting recordings, transcripts

All API calls are scoped to Microsoft Graph `/me` endpoints and use the signed-in user's delegated access token.

