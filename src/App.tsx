import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { useState } from "react";
import { graphScopes } from "./authConfig";
import { buildWrappedFromGraph, getGraphToken } from "./lib/api";
import type { WrappedStats } from "./types";
import { StoryDeck } from "./components/StoryDeck";

export default function App() {
  const { instance, inProgress, accounts } = useMsal();
  const [stats, setStats] = useState<WrappedStats | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const canUseMsal = Boolean(import.meta.env.VITE_ENTRA_CLIENT_ID);

  async function signIn() {
    setError("");
    await instance.loginPopup({ scopes: graphScopes });
  }

  async function loadWrapped() {
    setError("");
    setStatus("Hämtar metadata från Graph och bygger Wrapped...");
    try {
      const token = await getGraphToken(instance);
      const payload = await buildWrappedFromGraph(token);
      setStats(payload);
      setStatus("Wrapped klar.");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Kunde inte hämta Wrapped-data.");
      setStatus("");
    }
  }

  return (
    <main className="appShell">
      <header className="hero">
        <div>
          <div className="eyebrow">Internal preview</div>
          <h1>Teams & Outlook Wrapped</h1>
          <p>
            Spotify Wrapped-känsla för jobbet: ett klickbart kort per stat, roliga badges och bara aggregerad metadata.
          </p>
        </div>
        <div className="privacyCard">
          <strong>Privacy guardrails</strong>
          <span>Endast Graph <code>/me</code></span>
          <span>Ingen mailtext</span>
          <span>Ingen chatttext</span>
          <span>Inga mötesämnen i UI</span>
        </div>
      </header>

      {!canUseMsal ? (
        <section className="setupCard">
          <h2>Konfiguration saknas</h2>
          <p>Skapa <code>.env</code> från <code>.env.example</code> och sätt <code>VITE_ENTRA_CLIENT_ID</code>.</p>
        </section>
      ) : null}

      <UnauthenticatedTemplate>
        <section className="loginCard">
          <h2>Logga in med Microsoft Entra ID</h2>
          <p>Appen hämtar endast data för inloggad användare via Graph /me direkt i din browser.</p>
          <button className="primary" onClick={signIn} disabled={inProgress !== InteractionStatus.None || !canUseMsal}>
            Logga in
          </button>
        </section>
      </UnauthenticatedTemplate>

      <AuthenticatedTemplate>
        <section className="loginCard">
          <div>
            <h2>{accounts[0]?.name || "Du är inloggad"}</h2>
            <p>Senaste 12 månaderna analyseras från kalender-, mail- och Teams-metadata.</p>
          </div>
          <button className="primary" onClick={loadWrapped}>Skapa min Wrapped</button>
        </section>
      </AuthenticatedTemplate>

      {status ? <p className="status">{status}</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {stats ? <StoryDeck stats={stats} /> : null}
    </main>
  );
}

