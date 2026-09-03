import { describe, expect, it } from "vitest";

import { getAccessTokenExpiration, isAccessTokenExpired } from "./access-token";

const tokenWithExpiration = (expiration: number) =>
  `header.${btoa(JSON.stringify({ exp: expiration }))}.signature`;

describe("access token expiry", () => {
  it("reads a JWT expiration in milliseconds", () => {
    const token = tokenWithExpiration(2_000_000_000);
    expect(getAccessTokenExpiration(token)).toBe(2_000_000_000_000);
  });

  it("distinguishes valid, expired, and malformed tokens", () => {
    const now = 2_000_000_000_000;
    expect(isAccessTokenExpired(tokenWithExpiration(2_000_000_100), now)).toBe(false);
    expect(isAccessTokenExpired(tokenWithExpiration(1_999_999_999), now)).toBe(true);
    expect(isAccessTokenExpired("not-a-jwt", now)).toBe(true);
  });
});
