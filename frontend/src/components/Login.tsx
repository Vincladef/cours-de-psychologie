import { useState } from "react";
import { createUser, findUser, type User } from "../api/users";

interface LoginProps {
  onLogged: (user: User) => void;
}

export default function Login({ onLogged }: LoginProps) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
    <div className="card">
      <h2>Entrer dans l'application</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="username">Pseudo</label>
        <input
          id="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Votre pseudo"
        />
        <div style={{ marginTop: "16px" }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Connexion..." : "Entrer"}
          </button>
        </div>
        {error && <div className="status-bar alert-error">{error}</div>}
      </form>
    </div>
  );
}
