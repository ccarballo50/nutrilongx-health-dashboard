#!/usr/bin/env node
// apps-script/tests/run_all.mjs
//
// Ejecuta todos los tests puros/con-fakes de Apps Script Phase 2A. No
// requiere Google Apps Script ni Supabase reales -- ver cada *.test.mjs
// para el detalle de que capa cubre. Uso:
//
//   node apps-script/tests/run_all.mjs

import { summarize, resetResults } from "./lib/tiny_test.mjs";
import { run as runValidation } from "./validation.test.mjs";
import { run as runResponseErrors } from "./response_errors.test.mjs";
import { run as runRouter } from "./router.test.mjs";
import { run as runClientsService } from "./clients_service.test.mjs";
import { run as runContentService } from "./content_service.test.mjs";
import { run as runEvidenceService } from "./evidence_service.test.mjs";
import { run as runActionsService } from "./actions_service.test.mjs";
import { run as runGamificationService } from "./gamification_service.test.mjs";
import { run as runProgressService } from "./progress_service.test.mjs";
import { run as runMainIntegration } from "./main_integration.test.mjs";

const suites = [
  ["Validation.gs", runValidation],
  ["Response.gs + Errors.gs", runResponseErrors],
  ["Router.gs", runRouter],
  ["ClientsService.gs (fake deps)", runClientsService],
  ["ContentService.gs (fake deps)", runContentService],
  ["EvidenceService.gs (fake deps)", runEvidenceService],
  ["ActionsService.gs (fake deps)", runActionsService],
  ["GamificationService.gs (fake deps)", runGamificationService],
  ["ProgressService.gs (fake deps)", runProgressService],
  ["Main.gs end-to-end (stubbed Google/Supabase)", runMainIntegration],
];

let totalTests = 0;
let totalFailed = 0;

for (const [label, run] of suites) {
  resetResults();
  run();
  const { total, failed } = summarize(label);
  totalTests += total;
  totalFailed += failed;
}

console.log(`\n${"=".repeat(50)}`);
console.log(`TOTAL: ${totalTests - totalFailed}/${totalTests} PASS`);
console.log(`${"=".repeat(50)}`);

process.exit(totalFailed === 0 ? 0 : 1);
