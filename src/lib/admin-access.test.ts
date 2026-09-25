import { describe, expect, it } from "vitest";

import { decideAdminAccess, loginPath, safeAdminPath } from "./admin-access";

describe("safeAdminPath", () => {
  it.each([
    ["/admin", "/admin"],
    ["/admin/servicios", "/admin/servicios"],
    ["/admin/servicios?page=2", "/admin/servicios?page=2"],
    ["/admin?tab=leads", "/admin?tab=leads"],
  ])("keeps panel paths: %s", (value, expected) => {
    expect(safeAdminPath(value)).toBe(expected);
  });

  it.each([
    undefined,
    null,
    "",
    "https://evil.example/admin",
    "//evil.example/admin",
    "/\\evil.example",
    "/admin/..%2F..%2Fevil",
    "/admin\\@evil.example",
    "/administrator",
    "/servicios",
    "/admin/login",
    "/admin/../servicios",
  ])("falls back to /admin for %s", (value) => {
    expect(safeAdminPath(value)).toBe("/admin");
  });
});

describe("loginPath", () => {
  it("omits default values", () => {
    expect(loginPath("/admin", false)).toBe("/admin/login");
  });

  it("keeps the destination and the expired flag", () => {
    expect(loginPath("/admin/leads", true)).toBe(
      "/admin/login?next=%2Fadmin%2Fleads&motivo=sesion-caducada",
    );
  });
});

describe("decideAdminAccess", () => {
  const base = {
    pathname: "/admin/leads",
    search: "",
    isSignedIn: false,
    hadSession: false,
    isAdmin: false,
  };

  it("sends visitors without a session to the login", () => {
    expect(decideAdminAccess(base)).toEqual({
      type: "redirect",
      to: "/admin/login?next=%2Fadmin%2Fleads",
    });
  });

  it("tells the login that an existing session expired", () => {
    expect(decideAdminAccess({ ...base, hadSession: true })).toEqual({
      type: "redirect",
      to: "/admin/login?next=%2Fadmin%2Fleads&motivo=sesion-caducada",
    });
  });

  it("forbids signed-in users without the admin role", () => {
    expect(
      decideAdminAccess({ ...base, isSignedIn: true, hadSession: true }),
    ).toEqual({ type: "forbidden" });
  });

  it("allows admins", () => {
    expect(
      decideAdminAccess({
        ...base,
        isSignedIn: true,
        hadSession: true,
        isAdmin: true,
      }),
    ).toEqual({ type: "allow" });
  });

  it("shows the login to visitors and to users without the role", () => {
    const login = { ...base, pathname: "/admin/login" };
    expect(decideAdminAccess(login)).toEqual({ type: "allow" });
    expect(decideAdminAccess({ ...login, isSignedIn: true })).toEqual({
      type: "allow",
    });
  });

  it("sends admins away from the login to their destination", () => {
    const login = {
      ...base,
      pathname: "/admin/login",
      isSignedIn: true,
      isAdmin: true,
    };
    expect(decideAdminAccess(login)).toEqual({
      type: "redirect",
      to: "/admin",
    });
    expect(
      decideAdminAccess({ ...login, search: "?next=%2Fadmin%2Fleads" }),
    ).toEqual({ type: "redirect", to: "/admin/leads" });
    expect(
      decideAdminAccess({ ...login, search: "?next=https://evil.example" }),
    ).toEqual({ type: "redirect", to: "/admin" });
  });
});
