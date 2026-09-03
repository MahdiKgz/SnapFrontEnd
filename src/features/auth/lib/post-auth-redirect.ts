const AUTH_PATHS = new Set(["/login", "/register", "/auth/login", "/auth/register"]);

export const getPostAuthRedirect = (state: unknown): string => {
  if (!state || typeof state !== "object" || !("from" in state)) return "/dashboard";

  const from = (state as { from?: unknown }).from;
  if (
    typeof from !== "string" ||
    !from.startsWith("/") ||
    from.startsWith("//") ||
    AUTH_PATHS.has(from)
  ) {
    return "/dashboard";
  }

  return from;
};
