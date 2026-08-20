// apps-script/tests/lib/load_gs.mjs
//
// Carga ficheros .gs (JavaScript plano, sin modulos) en un contexto vm de
// Node para poder testear la logica pura de Apps Script sin el runtime de
// Google. Ver apps-script/src/*.gs para que ficheros son PUROS (testeables
// asi) y cuales dependen de servicios reales de Apps Script
// (PropertiesService/UrlFetchApp), que no se cargan aqui.

import vm from "node:vm";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, "..", "..", "src");

export function loadGsFiles(filenames, extraGlobals = {}) {
  const sandbox = {
    console,
    Object,
    Array,
    Date,
    JSON,
    Math,
    Number,
    String,
    Boolean,
    Error,
    RegExp,
    encodeURIComponent,
    decodeURIComponent,
    ...extraGlobals,
  };
  vm.createContext(sandbox);
  for (const filename of filenames) {
    const filePath = path.join(SRC_DIR, filename);
    const code = fs.readFileSync(filePath, "utf-8");
    vm.runInContext(code, sandbox, { filename: filePath });
  }
  return sandbox;
}
