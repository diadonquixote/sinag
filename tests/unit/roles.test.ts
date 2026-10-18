/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
import { describe, expect, it } from "vitest";
import { ACCOUNT_STATUS, ASSIGNABLE_ROLES, isOfficial, OFFICIAL_ROLES, ROLE_HOME, ROLE_LABEL, TEAM_LIMITS, TEAM_ROLES } from "@/lib/roles";

describe("roles", () => {
  it("never lists the site admin as an elected official", () => {
    expect(OFFICIAL_ROLES).not.toContain("admin");
    expect(isOfficial("admin")).toBe(false);
    expect(isOfficial("kagawad")).toBe(true);
  });
  it("gives every assignable role a label and a desk", () => {
    for (const role of ASSIGNABLE_ROLES) {
      expect(ROLE_LABEL[role]).toBeTruthy();
      expect(ROLE_HOME[role]).toMatch(/^\//);
    }
  });
  it("labels every account status the database allows", () => {
    for (const status of ["pending", "active", "disabled", "former", "removed"]) {
      expect(ACCOUNT_STATUS[status]?.label).toBeTruthy();
    }
  });
  it("lets a Chairperson add only the rest of the council, never another Chairperson or an admin", () => {
    expect([...TEAM_ROLES].sort()).toEqual(["kagawad", "secretary", "treasurer"]);
    expect(TEAM_ROLES).not.toContain("chairperson");
    expect(TEAM_ROLES).not.toContain("admin");
    expect(TEAM_LIMITS).toEqual({ secretary: 1, treasurer: 1, kagawad: 7 });
  });
});
