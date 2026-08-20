// apps-script/tests/validation.test.mjs
// Tests puros de Validation.gs + Errors.gs (sin Apps Script, sin Supabase).

import { loadGsFiles } from "./lib/load_gs.mjs";
import { test, assert } from "./lib/tiny_test.mjs";

const sb = loadGsFiles(["Errors.gs", "Validation.gs"]);

export function run() {
  test("requireString accepts non-empty string", () => {
    assert.equal(sb.requireString("hola", "f"), "hola");
  });

  test("requireString rejects empty string", () => {
    assert.throws(() => sb.requireString("", "f"), /f/);
  });

  test("requireString rejects non-string", () => {
    assert.throws(() => sb.requireString(42, "f"));
  });

  test("requireUuid accepts a valid UUID", () => {
    sb.requireUuid("11111111-2222-3333-4444-555555555555", "id");
  });

  test("requireUuid rejects a malformed UUID", () => {
    assert.throws(() => sb.requireUuid("not-a-uuid", "id"));
  });

  test("optionalEmail accepts null/undefined", () => {
    assert.equal(sb.optionalEmail(null, "email"), null);
    assert.equal(sb.optionalEmail(undefined, "email"), null);
  });

  test("optionalEmail rejects malformed email", () => {
    assert.throws(() => sb.optionalEmail("not-an-email", "email"));
  });

  test("requirePillar accepts the 5 canonical pillars", () => {
    ["nutrition", "exercise", "sleep", "stress", "conscious_wellbeing"].forEach((p) => {
      assert.equal(sb.requirePillar(p, "pillar"), p);
    });
  });

  test("requirePillar rejects 'mind' as persisted pillar", () => {
    assert.throws(() => sb.requirePillar("mind", "pillar"), /pillar/);
  });

  test("requireMindPillar rejects legacy Spanish aliases", () => {
    ["Sueño", "Estrés", "Bienestar emocional", "MENTE", "MEN"].forEach((alias) => {
      assert.throws(() => sb.requireMindPillar(alias, "pillar"), new RegExp(""), `should reject ${alias}`);
    });
  });

  test("requireMindPillar accepts sleep/stress/conscious_wellbeing only", () => {
    ["sleep", "stress", "conscious_wellbeing"].forEach((p) => assert.equal(sb.requireMindPillar(p, "pillar"), p));
    assert.throws(() => sb.requireMindPillar("nutrition", "pillar"));
  });

  test("requireContentType accepts recipe/exercise/exercise_variant/mind_content", () => {
    ["recipe", "exercise", "exercise_variant", "mind_content"].forEach((t) => assert.equal(sb.requireContentType(t, "content_type"), t));
  });

  test("requireContentType rejects a pillar value used as content_type", () => {
    assert.throws(() => sb.requireContentType("nutrition", "content_type"));
    assert.throws(() => sb.requireContentType("mind", "content_type"));
  });

  test("rejectUnknownKeys passes when all keys are allowed", () => {
    sb.rejectUnknownKeys({ a: 1, b: 2 }, ["a", "b", "c"], "ctx");
  });

  test("rejectUnknownKeys throws VALIDATION_ERROR listing extra keys", () => {
    try {
      sb.rejectUnknownKeys({ a: 1, z: 9 }, ["a"], "ctx");
      assert.fail("expected throw");
    } catch (e) {
      assert.equal(e.code, "VALIDATION_ERROR");
      assert.deepEqual(e.details.unexpected_fields, ["z"]);
    }
  });

  test("normalizePagination defaults to limit=50", () => {
    const p = sb.normalizePagination({});
    assert.equal(p.limit, 50);
    assert.equal(p.cursor, null);
  });

  test("normalizePagination caps limit at 100", () => {
    const p = sb.normalizePagination({ limit: 9999 });
    assert.equal(p.limit, 100);
  });

  test("normalizePagination rejects non-positive limit", () => {
    assert.throws(() => sb.normalizePagination({ limit: 0 }));
    assert.throws(() => sb.normalizePagination({ limit: -5 }));
  });

  test("optionalMindContentType accepts the 6 declared types", () => {
    ["pillar_card", "subpillar_card", "challenge", "video", "infographic", "other"].forEach((t) =>
      assert.equal(sb.optionalMindContentType(t, "content_type"), t)
    );
  });
}
