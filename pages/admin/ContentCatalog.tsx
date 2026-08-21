import React, { useEffect, useState } from "react";
import { contentApi } from "../../src/services/appsScriptContentApi";
import { ContractError } from "../../src/services/appsScriptContract";
import type { ContentItem } from "../../src/services/appsScriptDtos";

/**
 * ContentCatalog — biblioteca mínima de contenido canónico, de solo
 * lectura. Tercer consumidor real de src/services/appsScriptContract.ts
 * (PR-01), usando exclusivamente contentApi (PR-01/appsScriptContentApi.ts).
 *
 * Deliberadamente NO usa services/content.ts legacy, Supabase directo ni
 * localStorage -- cada pestaña llama a una función content.* distinta
 * del contrato a través del proxy. No asigna, no edita, no crea
 * contenido; eso queda para un PR posterior explícito.
 */

type TabKey = "nutrition" | "exercise" | "sleep" | "stress" | "conscious_wellbeing";

interface TabConfig {
  key: TabKey;
  label: string;
  itemsKey: "recipes" | "exercises" | "mind_content";
  load: () => Promise<{ items: ContentItem[]; count: number }>;
}

const TABS: TabConfig[] = [
  {
    key: "nutrition",
    label: "Alimentación",
    itemsKey: "recipes",
    load: async () => {
      const r = await contentApi.listRecipes();
      return { items: r.recipes, count: r.count };
    },
  },
  {
    key: "exercise",
    label: "Ejercicio",
    itemsKey: "exercises",
    load: async () => {
      const r = await contentApi.listExercises();
      return { items: r.exercises, count: r.count };
    },
  },
  {
    key: "sleep",
    label: "Sueño",
    itemsKey: "mind_content",
    load: async () => {
      const r = await contentApi.listMind("sleep");
      return { items: r.mind_content, count: r.count };
    },
  },
  {
    key: "stress",
    label: "Estrés",
    itemsKey: "mind_content",
    load: async () => {
      const r = await contentApi.listMind("stress");
      return { items: r.mind_content, count: r.count };
    },
  },
  {
    key: "conscious_wellbeing",
    label: "Bienestar consciente",
    itemsKey: "mind_content",
    load: async () => {
      const r = await contentApi.listMind("conscious_wellbeing");
      return { items: r.mind_content, count: r.count };
    },
  },
];

function errorInfo(e: unknown): { code: string | null; message: string } {
  if (e instanceof ContractError) return { code: e.code, message: e.message };
  return { code: null, message: e instanceof Error ? e.message : "Error desconocido" };
}

/** Primer valor no vacío entre varias claves candidatas del item (formas provisionales). */
function pick(item: ContentItem, keys: string[]): unknown {
  for (const k of keys) {
    const v = item[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

function asText(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (Array.isArray(value)) return value.length ? value.map(String).join(", ") : "—";
  return String(value);
}

/**
 * Renderiza el contenido de una fila (no un componente propio con `key`
 * -- el tsconfig del repo no activa `strictNullChecks`, y sin él el
 * despojo automático de `key` de las props de un componente hijo tipado
 * no es fiable aquí; el mismo patrón ya afecta a varios ficheros legacy
 * documentados en PR-01/02/03. Se evita inline, dentro del `.map()`).
 */
function renderItemRow(item: ContentItem) {
  const title = pick(item, ["title", "name", "display_name"]);
  const status = pick(item, ["status", "is_published", "review_status"]);
  const tags = pick(item, ["tags", "maturity", "content_maturity"]);
  const description = pick(item, ["description", "short_description", "summary"]);

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="font-medium">{asText(title)}</div>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 whitespace-nowrap">
          {asText(status)}
        </span>
      </div>
      <div className="text-xs text-gray-500 mt-1 font-mono">{asText(item.canonical_id)}</div>
      <div className="text-xs text-gray-500 mt-1">
        {item.pillar !== undefined && <span>Pilar: {asText(item.pillar)} · </span>}
        {item.content_type !== undefined && <span>Tipo: {asText(item.content_type)} · </span>}
        Etiquetas: {asText(tags)}
      </div>
      {description !== undefined && (
        <div className="text-sm text-gray-700 mt-2">{asText(description)}</div>
      )}
    </>
  );
}

export default function ContentCatalog() {
  const [activeTab, setActiveTab] = useState<TabKey>("nutrition");
  const [itemsByTab, setItemsByTab] = useState<Partial<Record<TabKey, ContentItem[]>>>({});
  const [loadingTab, setLoadingTab] = useState<TabKey | null>(null);
  const [errorByTab, setErrorByTab] = useState<Partial<Record<TabKey, { code: string | null; message: string }>>>({});

  async function loadTab(tab: TabConfig, force = false) {
    if (!force && itemsByTab[tab.key] !== undefined) return; // ya cargado, no repetir
    setLoadingTab(tab.key);
    setErrorByTab((prev) => ({ ...prev, [tab.key]: undefined }));
    try {
      const { items } = await tab.load();
      setItemsByTab((prev) => ({ ...prev, [tab.key]: items }));
    } catch (e) {
      setErrorByTab((prev) => ({ ...prev, [tab.key]: errorInfo(e) }));
    } finally {
      setLoadingTab(null);
    }
  }

  useEffect(() => {
    const tab = TABS.find((t) => t.key === activeTab)!;
    loadTab(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const currentTab = TABS.find((t) => t.key === activeTab)!;
  const items = itemsByTab[activeTab];
  const err = errorByTab[activeTab];
  const isLoading = loadingTab === activeTab;

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-semibold">Biblioteca de contenido</h1>
      <p className="text-sm text-gray-600 mb-3">Catálogo canónico desde Apps Script</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`text-xs rounded-full px-3 py-1.5 border transition ${
              activeTab === t.key
                ? "bg-emerald-600 text-white border-transparent"
                : "text-gray-600 border-gray-200 bg-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex justify-end mb-2">
        <button
          className="border rounded px-3 py-1 text-xs"
          onClick={() => loadTab(currentTab, true)}
          disabled={isLoading}
        >
          {isLoading ? "Cargando…" : "Actualizar"}
        </button>
      </div>

      {isLoading && <div className="text-sm text-gray-500">Cargando {currentTab.label.toLowerCase()}…</div>}

      {!isLoading && err && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded p-3">
          {err.code && <div className="text-xs font-mono mb-1">{err.code}</div>}
          Error: {err.message}
        </div>
      )}

      {!isLoading && !err && items && items.length === 0 && (
        <div className="text-sm text-gray-500">Aún no hay contenido publicado en {currentTab.label}.</div>
      )}

      {!isLoading && !err && items && items.length > 0 && (
        <>
          <div className="text-sm text-gray-600 mb-3">Total: {items.length}</div>
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="border rounded-2xl p-4 bg-white shadow">
                {renderItemRow(item)}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
