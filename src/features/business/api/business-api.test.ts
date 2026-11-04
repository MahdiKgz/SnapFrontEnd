import authReducer from "@/features/auth/model/auth-slice";
import { configureStore } from "@reduxjs/toolkit";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AuthState } from "@features/auth";

import { businessApi } from "./business-api";

const token = () =>
  `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))}.signature`;
const makeStore = () =>
  configureStore({
    reducer: { auth: authReducer, [businessApi.reducerPath]: businessApi.reducer },
    preloadedState: {
      auth: {
        status: "authenticated",
        user: { id: "admin", name: "مدیر", phone: "09120000001", roles: ["user", "admin"] },
        accessToken: token(),
      } as AuthState,
    },
    middleware: (defaults) => defaults().concat(businessApi.middleware),
  });
afterEach(() => vi.unstubAllGlobals());

describe("admin API contracts", () => {
  it("sends role, plan, search and pagination and authenticates queries", async () => {
    let sent!: Request;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (request: Request) => {
        sent = request;
        return Response.json({
          success: true,
          data: { items: [], pagination: { skip: 20, limit: 10, total: 21 } },
        });
      }),
    );
    const store = makeStore();
    const request = store.dispatch(
      businessApi.endpoints.getAdminUsers.initiate({
        search: "مدیر",
        role: "admin",
        plan: "pro",
        skip: 20,
        limit: 10,
      }),
    );
    try {
      await request.unwrap();
      expect(new URL(sent.url).pathname).toBe("/api/business/admin/users");
      expect(Object.fromEntries(new URL(sent.url).searchParams)).toEqual({
        search: "مدیر",
        role: "admin",
        plan: "pro",
        skip: "20",
        limit: "10",
      });
      expect(sent.credentials).toBe("include");
      expect(sent.headers.get("authorization")).toMatch(/^Bearer /);
    } finally {
      request.unsubscribe();
      store.dispatch(businessApi.util.resetApiState());
    }
  });
  it("sends report dates and profile edits to the admin endpoints and updates only the current profile", async () => {
    const seen: { path: string; body: unknown }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (request: Request) => {
        const path = new URL(request.url).pathname;
        seen.push({ path, body: request.method === "PATCH" ? await request.json() : null });
        if (path.endsWith("reports"))
          return Response.json({
            success: true,
            data: { range: Object.fromEntries(new URL(request.url).searchParams) },
          });
        return Response.json({
          success: true,
          data: {
            id: path.split("/").at(-1),
            name: "نام تازه",
            phone: "09120000009",
            roles: ["user"],
          },
        });
      }),
    );
    const store = makeStore();
    const report = store.dispatch(
      businessApi.endpoints.getSystemReports.initiate({ from: "2026-11-01", to: "2026-11-04" }),
    );
    try {
      expect((await report.unwrap()).data.range).toEqual({ from: "2026-11-01", to: "2026-11-04" });
      await store
        .dispatch(
          businessApi.endpoints.updateAdminUser.initiate({
            userId: "other",
            name: "نام تازه",
            phone: "09120000009",
          }),
        )
        .unwrap();
      expect(store.getState().auth.user?.name).toBe("مدیر");
      await store
        .dispatch(
          businessApi.endpoints.updateAdminUser.initiate({
            userId: "admin",
            name: "نام تازه",
            phone: "09120000009",
          }),
        )
        .unwrap();
      await vi.waitFor(() => expect(store.getState().auth.user?.name).toBe("نام تازه"));
      expect(store.getState().auth.user?.roles).toEqual(["user", "admin"]);
      expect(seen[1]).toEqual({
        path: "/api/business/admin/users/other",
        body: { name: "نام تازه", phone: "09120000009" },
      });
    } finally {
      report.unsubscribe();
      store.dispatch(businessApi.util.resetApiState());
    }
  });
  it("syncs own writer access after success and preserves it after a failed request", async () => {
    const store = makeStore();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          success: true,
          data: { userId: "admin", roles: ["user", "admin", "writer"] },
        }),
      ),
    );
    try {
      await store
        .dispatch(
          businessApi.endpoints.assignWriterRole.initiate({ userId: "admin", enabled: true }),
        )
        .unwrap();
      await vi.waitFor(() => expect(store.getState().auth.user?.roles).toContain("writer"));
      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          Response.json({ success: false, message: "عدم دسترسی" }, { status: 403 }),
        ),
      );
      await expect(
        store
          .dispatch(
            businessApi.endpoints.assignWriterRole.initiate({ userId: "admin", enabled: false }),
          )
          .unwrap(),
      ).rejects.toMatchObject({ status: 403 });
      expect(store.getState().auth.user?.roles).toContain("writer");
    } finally {
      store.dispatch(businessApi.util.resetApiState());
    }
  });
});
