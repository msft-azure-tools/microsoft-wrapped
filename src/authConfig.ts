import type { Configuration } from "@azure/msal-browser";

const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID || "organizations";

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_ENTRA_CLIENT_ID || "",
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: `${window.location.origin}${window.location.pathname}`,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const graphScopes = [
  "User.Read",
  "Calendars.Read",
  "Mail.ReadBasic",
  "People.Read",
  "Chat.ReadBasic",
];

