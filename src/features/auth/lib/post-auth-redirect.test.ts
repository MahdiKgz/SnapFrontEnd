import { describe, expect, it } from "vitest";

import { getPostAuthRedirect } from "./post-auth-redirect";

describe("post-authentication redirects", () => {
  it("returns a protected route requested before login", () => {
    expect(getPostAuthRedirect({ from: "/map?layer=parcels#selected" })).toBe(
      "/map?layer=parcels#selected",
    );
  });

  it("falls back to dashboard for missing, external, or auth destinations", () => {
    expect(getPostAuthRedirect(null)).toBe("/dashboard");
    expect(getPostAuthRedirect({ from: "//malicious.example" })).toBe("/dashboard");
    expect(getPostAuthRedirect({ from: "/login" })).toBe("/dashboard");
  });
});
