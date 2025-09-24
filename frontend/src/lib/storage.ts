export interface StoredUser {
  id: number;
  username: string;
}

const KEY = "cours-trous-user";

export function loadUser(): StoredUser | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as StoredUser;
    if (typeof parsed.id === "number" && typeof parsed.username === "string") {
      return parsed;
    }
  } catch (err) {
    console.warn("Impossible de parser l'utilisateur localStorage", err);
  }
  return null;
}

export function saveUser(user: StoredUser): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(KEY, JSON.stringify(user));
}

export function clearUser(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(KEY);
}
