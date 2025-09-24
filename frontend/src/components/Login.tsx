import { useState, type ChangeEvent, type FormEvent } from "react";
import { createUser, findUser, type User } from "../api/users";

interface LoginProps {
  onLogged: (user: User) => void;
}

export default function Login({ onLogged }: LoginProps) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUsername(event.target.value);
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      setError("Merci d'indiquer un pseudo.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const existing = await findUser(trimmed);
      if (existing) {
        onLogged(existing);
        return;
      }
      const created = await createUser(trimmed);
      onLogged(created);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || "Connexion impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card login-card">
      <h1>Cours à trous – Apprends et révise efficacement</h1>
      <p className="login-description">
        Écris tes cours, transforme-les en texte à trous et révise-les grâce à un
        système intelligent d'itérations.
      </p>
      <form className="login-form" onSubmit={handleSubmit}>
        <label htmlFor="username">Ton pseudo</label>
        <input
          id="username"
          value={username}
          onChange={handleUsernameChange}
          placeholder="Entre ton pseudo"
          autoComplete="off"
          autoFocus
        />
        <div className="login-actions">
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Connexion..." : "Entrer"}
          </button>
        </div>
        {error && (
          <div
            className="status-bar alert-error login-error"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}
      </form>
      <p className="login-helper">
        Pas besoin de mot de passe – tout est basé sur ton pseudo.
      </p>
    </section>
  );
}
