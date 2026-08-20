// apps-script/tests/response_errors.test.mjs
// Tests puros de Response.gs + Errors.gs: envelopes de exito/error.

import { loadGsFiles } from "./lib/load_gs.mjs";
import { test, assert } from "./lib/tiny_test.mjs";

const sb = loadGsFiles(["Errors.gs", "Response.gs"]);

export function run() {
  test("buildSuccessEnvelope has ok:true and schema_version", () => {
    const env = sb.buildSuccessEnvelope({ x: 1 }, "req-1", "2026-08-20T00:00:00.000Z");
    assert.equal(env.ok, true);
    assert.deepEqual(env.data, { x: 1 });
    assert.equal(env.meta.request_id, "req-1");
    assert.equal(env.meta.schema_version, "NUTRILONGX_APPS_SCRIPT_FUNCTION_CONTRACT_v1");
  });

  test("buildErrorEnvelope has ok:false and structured error", () => {
    const env = sb.buildErrorEnvelope("VALIDATION_ERROR", "bad input", { field: "x" }, "req-2", "2026-08-20T00:00:00.000Z");
    assert.equal(env.ok, false);
    assert.equal(env.error.code, "VALIDATION_ERROR");
    assert.equal(env.error.message, "bad input");
    assert.deepEqual(env.error.details, { field: "x" });
  });

  test("all 9 contract error codes are declared", () => {
    const expected = [
      "VALIDATION_ERROR", "NOT_FOUND", "CONFLICT", "DUPLICATE_REQUEST",
      "UNAUTHORIZED", "FORBIDDEN", "CANONICAL_REFERENCE_NOT_FOUND",
      "DATA_INTEGRITY_ERROR", "INTERNAL_ERROR",
    ];
    expected.forEach((code) => assert.equal(sb.NLX_ERROR_CODES[code], code));
  });

  test("NlxValidationError produces a normalizable error", () => {
    const err = sb.NlxValidationError("bad", { f: 1 });
    const norm = sb.normalizeError(err);
    assert.equal(norm.code, "VALIDATION_ERROR");
    assert.equal(norm.message, "bad");
    assert.deepEqual(norm.details, { f: 1 });
  });

  test("normalizeError collapses unexpected errors to INTERNAL_ERROR without leaking details", () => {
    const norm = sb.normalizeError(new Error("some internal stack trace detail"));
    assert.equal(norm.code, "INTERNAL_ERROR");
    assert.equal(norm.message, "Unexpected internal error");
    assert.deepEqual(norm.details, {});
  });

  test("NlxCanonicalReferenceNotFoundError maps to CANONICAL_REFERENCE_NOT_FOUND", () => {
    const err = sb.NlxCanonicalReferenceNotFoundError("nope", { canonical_id: "X" });
    assert.equal(sb.normalizeError(err).code, "CANONICAL_REFERENCE_NOT_FOUND");
  });
}
