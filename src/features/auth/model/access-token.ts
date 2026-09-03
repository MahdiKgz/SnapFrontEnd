interface AccessTokenPayload {
  exp?: unknown;
}

const decodePayload = (token: string): AccessTokenPayload | null => {
  const encodedPayload = token.split(".")[1];
  if (!encodedPayload) return null;

  try {
    const normalized = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as AccessTokenPayload;
  } catch {
    return null;
  }
};

export const getAccessTokenExpiration = (token: string): number | null => {
  const expiration = decodePayload(token)?.exp;
  return typeof expiration === "number" && Number.isFinite(expiration) ? expiration * 1000 : null;
};

export const isAccessTokenExpired = (
  token: string,
  now = Date.now(),
  clockSkewSeconds = 0,
): boolean => {
  const expiration = getAccessTokenExpiration(token);
  return expiration === null || expiration <= now + clockSkewSeconds * 1000;
};
