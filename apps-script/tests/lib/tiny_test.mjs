// apps-script/tests/lib/tiny_test.mjs
//
// Runner de tests minimo, sin dependencias nuevas (el repo no tiene
// jest/vitest/mocha instalado y no se añade uno solo para Apps Script,
// que no se ejecuta como parte del build de la app -- encargo seccion 5:
// "no introducir frameworks complejos").

// Se usa node:assert (legacy/loose) en vez de node:assert/strict a
// proposito: el codigo bajo test se ejecuta en un vm.createContext
// separado (realm distinto, ver load_gs.mjs), y los objetos que devuelve
// (p.ej. `{}`) no comparten prototipo con los literales creados en este
// fichero. assert/strict compara prototipos y falla en falsos negativos
// por esa frontera de realm; node:assert compara solo estructura.
import assert from "node:assert";

const results = [];

export function test(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (e) {
    results.push({ name, ok: false, error: e });
  }
}

export { assert };

export function summarize(label) {
  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== ${label}: ${results.length - failed.length}/${results.length} PASS ===`);
  for (const r of results) {
    console.log(`  ${r.ok ? "✓" : "✗"} ${r.name}`);
    if (!r.ok) console.log(`      ${r.error && r.error.message}`);
  }
  return { total: results.length, failed: failed.length };
}

export function resetResults() {
  results.length = 0;
}

export function getResults() {
  return results;
}
