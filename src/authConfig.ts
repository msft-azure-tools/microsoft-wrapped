import type { Configuration } from "@azure/msal-browser";

const defaultClientId = "c9eb6ddd-3c43-4a14-8d7f-d1f8f7ebd6de";
const defaultTenantId = "72f988bf-86f1-41af-91ab-2d7cd011db47";
const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID || defaultTenantId;

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_ENTRA_CLIENT_ID || defaultClientId,
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

