import { fetchJson, fetchJsonAllow404 } from "./index";

export interface User {
  id: number;
  username: string;
}

export async function findUser(username: string): Promise<User | null> {
  if (!username) {
    return null;
  }
  const result = await fetchJsonAllow404(`/users?username=${encodeURIComponent(username)}`);
  return result as User | null;
}

export async function createUser(username: string): Promise<User> {
  const payload = await fetchJson("/users", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
  return payload as User;
}
