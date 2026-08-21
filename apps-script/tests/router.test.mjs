// apps-script/tests/router.test.mjs
// Tests puros de Router.gs: allowlist explicita, sin eval/dispatch dinamico.

import { loadGsFiles } from "./lib/load_gs.mjs";
import { test, assert } from "./lib/tiny_test.mjs";

const sb = loadGsFiles(["Errors.gs", "Router.gs"]);

export function run() {
  test("buildRoutes exposes exactly the 18 Phase 2A + Phase 2B functions", () => {
    const clientsService = {
      list: () => "list", get: () => "get", create: () => "create",
      update: () => "update", getProfile: () => "getProfile", updateProfile: () => "updateProfile",
    };
    const contentService = {
      listRecipes: () => "listRecipes", getRecipe: () => "getRecipe",
      listExercises: () => "listExercises", getExercise: () => "getExercise",
      listMind: () => "listMind", getMindContent: () => "getMindContent",
      assign: () => "assign", unassign: () => "unassign", listAssignments: () => "listAssignments",
    };
    const evidenceService = {
      register: () => "register", list: () => "list", get: () => "get",
    };
    const routes = sb.buildRoutes(clientsService, contentService, evidenceService);
    const expectedKeys = [
      "clients.list", "clients.get", "clients.create", "clients.update", "clients.getProfile", "clients.updateProfile",
      "content.listRecipes", "content.getRecipe", "content.listExercises", "content.getExercise",
      "content.listMind", "content.getMindContent", "content.assign", "content.unassign", "content.listAssignments",
      "evidence.register", "evidence.list", "evidence.get",
    ];
    assert.deepEqual(Object.keys(routes).sort(), expectedKeys.sort());
  });

  test("routeRequest dispatches to the matching handler", () => {
    const routes = { "clients.get": (payload) => ({ echoed: payload }) };
    const result = sb.routeRequest(routes, "clients.get", { x: 1 }, {});
    assert.deepEqual(result, { echoed: { x: 1 } });
  });

  test("routeRequest rejects an unknown function with NOT_FOUND", () => {
    const routes = { "clients.get": () => ({}) };
    try {
      sb.routeRequest(routes, "clients.deleteEverything", {}, {});
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "NOT_FOUND");
    }
  });

  test("routeRequest rejects prototype-pollution-style function names", () => {
    const routes = { "clients.get": () => ({}) };
    ["__proto__", "constructor", "toString", "hasOwnProperty"].forEach((name) => {
      try {
        sb.routeRequest(routes, name, {}, {});
        assert.fail(`expected throw for ${name}`);
      } catch (e) {
        assert.equal(e.code, "NOT_FOUND", `${name} should be NOT_FOUND, not dispatched`);
      }
    });
  });

  test("routeRequest rejects a non-string function name", () => {
    const routes = { "clients.get": () => ({}) };
    try {
      sb.routeRequest(routes, undefined, {}, {});
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "NOT_FOUND");
    }
  });
}
