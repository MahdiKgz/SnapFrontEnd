import type { AuthCredentials } from "./types";

const AUTH_STORAGE_KEY = "snapgis.auth";

export function readStoredCredentials(): AuthCredentials | null {
  try {
    const storedValue = localStorage.getItem(AUTH_STORAGE_KEY);
    return storedValue ? (JSON.parse(storedValue) as AuthCredentials) : null;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function storeCredentials(credentials: AuthCredentials) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(credentials));
}

export function clearStoredCredentials() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
