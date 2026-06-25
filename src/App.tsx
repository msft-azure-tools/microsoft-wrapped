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
          "Microsoft Wrapped needs admin approval for the Graph permissions in your tenant. Ask an Entra admin to grant admin consent for User.Read, Calendars.Read, Mail.ReadBasic, People.Read, and Chat.ReadBasic.",
        );
        return;
      }
      setError(message || "Sign-in could not be completed.");
    }
  }

  async function loadWrapped() {
    setError("");
    setStatus("Mixing your year of signals...");
    try {
      const token = await getGraphToken(instance);
      const payload = await buildWrappedFromGraph(token);
      setStats(payload);
      setStatus("Your Wrapped is ready.");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Something got in the way. Try again in a moment.");
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
          <h1>Your work year. Remastered.</h1>
          <p>
            Meetings, mail, and Teams signals turned into a fast, polished story of how your year really played out.
          </p>
        </div>
        <div className="privacyCard">
          <strong>Built for you</strong>
          <span>Your profile only</span>
          <span>No content read</span>
          <span>No subject lines shown</span>
          <span>Your story, your screen</span>
        </div>
      </header>

      <UnauthenticatedTemplate>
        <section className="loginCard">
          <h2>Ready? Let’s go.</h2>
          <p>Sign in and turn a year of work signals into a Wrapped story in seconds.</p>
          <button className="primary" onClick={signIn} disabled={inProgress !== InteractionStatus.None}>
            Start with Microsoft
          </button>
        </section>
      </UnauthenticatedTemplate>

      <AuthenticatedTemplate>
        <section className="loginCard">
          <div>
            <h2>{accounts[0]?.name || "You’re signed in"}</h2>
            <p>Your data is ready. Now let’s make it look good.</p>
          </div>
          <button className="primary" onClick={loadWrapped}>Create my Wrapped</button>
        </section>
      </AuthenticatedTemplate>

      {status ? <p className="status">{status}</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {stats ? <StoryDeck stats={stats} /> : null}
    </main>
  );
}

