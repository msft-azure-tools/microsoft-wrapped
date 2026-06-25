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
    try {
      await instance.loginPopup({ scopes: graphScopes });
    } catch (signInError) {
      const message = signInError instanceof Error ? signInError.message : String(signInError);
      if (message.includes("AADSTS65001") || message.toLowerCase().includes("admin")) {
        setError(
          "Microsoft Wrapped behöver admin-godkännande för Graph-behörigheterna i tenant. Be en Entra-admin öppna app registration och ge admin consent för User.Read, Calendars.Read, Mail.ReadBasic, People.Read och Chat.ReadBasic.",
        );
        return;
      }
      setError(message || "Kunde inte logga in.");
    }
  }

  async function loadWrapped() {
    setError("");
    setStatus("Vi mixar årets signaler...");
    try {
      const token = await getGraphToken(instance);
      const payload = await buildWrappedFromGraph(token);
      setStats(payload);
      setStatus("Din Wrapped är klar.");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Något kom emellan. Testa igen om en stund.");
      setStatus("");
    }
  }

  return (
    <main className="appShell">
      <header className="hero">
        <div>
          <div className="brandLine">
            <span className="msMark" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </span>
            <span>Microsoft 365 Wrapped</span>
          </div>
          <div className="eyebrow">Microsoft 365 Wrapped</div>
          <h1>Året du jobbade. Remastrat.</h1>
          <p>
            Möten, mail och Teams-signaler blir en snabb, snygg story om hur ditt år faktiskt såg ut.
          </p>
        </div>
        <div className="privacyCard">
          <strong>Byggd för dig</strong>
          <span>Bara din profil</span>
          <span>Inget innehåll läses</span>
          <span>Inga ämnesrader visas</span>
          <span>Din story, din skärm</span>
        </div>
      </header>

      <UnauthenticatedTemplate>
        <section className="loginCard">
          <h2>Klart? Då kör vi.</h2>
          <p>Logga in och låt årets signaler bli en Wrapped-story på några sekunder.</p>
          <button className="primary" onClick={signIn} disabled={inProgress !== InteractionStatus.None}>
            Starta med Microsoft
          </button>
        </section>
      </UnauthenticatedTemplate>

      <AuthenticatedTemplate>
        <section className="loginCard">
          <div>
            <h2>{accounts[0]?.name || "Du är inloggad"}</h2>
            <p>Din data är redo. Nu gör vi den snygg.</p>
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

