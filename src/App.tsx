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
          <div className="eyebrow">Microsoft 365 Wrapped</div>
          <h1>Din jobbvardag som en story.</h1>
          <p>
            Klicka dig igenom möten, mail, Teams och badges i ett enkelt, kul och privacy-safe Wrapped-flöde.
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

      <UnauthenticatedTemplate>
        <section className="loginCard">
          <h2>Logga in med ditt Microsoft-konto</h2>
          <p>Din data räknas lokalt i browsern via Graph /me. Ingen annan kan se din Wrapped.</p>
          <button className="primary" onClick={signIn} disabled={inProgress !== InteractionStatus.None}>
            Logga in
          </button>
        </section>
      </UnauthenticatedTemplate>

      <AuthenticatedTemplate>
        <section className="loginCard">
          <div>
            <h2>{accounts[0]?.name || "Du är inloggad"}</h2>
            <p>Redo att skapa årets story från kalender-, mail- och Teams-metadata.</p>
          </div>
          <button className="primary" onClick={loadWrapped}>Starta min Wrapped</button>
        </section>
      </AuthenticatedTemplate>

      {status ? <p className="status">{status}</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {stats ? <StoryDeck stats={stats} /> : null}
    </main>
  );
}

