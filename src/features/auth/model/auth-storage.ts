import { isAccessTokenExpired } from "./access-token";
import type { AuthCredentials } from "./types";

const AUTH_STORAGE_KEY = "snapgis.auth";

const getBrowserStorage = (): Storage | null =>
  typeof localStorage === "undefined" ? null : localStorage;

export function readStoredCredentials(): AuthCredentials | null {
  const storage = getBrowserStorage();
  if (!storage) return null;

  try {
    const storedValue = storage.getItem(AUTH_STORAGE_KEY);
    if (!storedValue) return null;

    const credentials = JSON.parse(storedValue) as Partial<AuthCredentials>;
    if (
      typeof credentials.accessToken !== "string" ||
      !credentials.user ||
      typeof credentials.user.id !== "string" ||
      typeof credentials.user.name !== "string" ||
      typeof credentials.user.phone !== "string" ||
      !Array.isArray(credentials.user.roles) ||
      !credentials.user.roles.every((role) => typeof role === "string") ||
      isAccessTokenExpired(credentials.accessToken)
    ) {
      storage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return credentials as AuthCredentials;
  } catch {
    storage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function storeCredentials(credentials: AuthCredentials) {
  getBrowserStorage()?.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({ accessToken: credentials.accessToken, user: credentials.user }),
  );
}

export function clearStoredCredentials() {
  getBrowserStorage()?.removeItem(AUTH_STORAGE_KEY);
}
