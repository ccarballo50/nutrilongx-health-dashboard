# NUTRILONGX — Knowledge Base

## 1. Propósito

Este directorio es la persistencia canónica, versionada en Git, de todo el
conocimiento (fuentes, schemas, mappings, auditorías, evidencia de
investigación y decisiones de gobernanza) de NutriLongX en los dominios
Gamificación, Alimentación y Ejercicio. Es documentación y datos — **no
contiene código de aplicación**, no se despliega, no se ejecuta.

## 2. Arquitectura

```
governance/    → arquitectura, schemas cross-dominio, decisiones, auditorías generales
gamification/  → canonical, sources (legacy), mappings, audits, archive
nutrition/     → canonical, schemas, sources, mappings, reports, supporting, archive
exercise/      → canonical, schemas, library, safety, research, mappings, reports, governance, archive
clinical/      → profiles, thresholds, rules, missing (gaps documentados, no rellenados)
registry/      → registries máquina + humano de todo lo persistido
manifests/     → manifest SHA-256 de integridad
```

## 3. Dónde está la fuente de verdad de cada dominio

Léelo primero en `registry/NUTRILONGX_CANONICAL_REGISTRY_v1.md` — es el
resumen humano de 5 minutos. El registro máquina exhaustivo, artefacto a
artefacto, es `registry/NUTRILONGX_ARTIFACT_REGISTRY_v1.json`, y cada fila
tiene `source_of_truth: true/false`.

Resumen rápido (ver el registry para detalle y matices/discrepancias):
- **Gamification**: `gamification/canonical/NUTRILONGX_ACTIONS_CATALOG_CANONICAL_v1.json` + `NUTRILONGX_GAMIFICATION_ENGINE_CANONICAL_v1.json`.
- **Nutrition**: `nutrition/canonical/NUTRILONGX_ALIMENTACION_MASTER_v1.json`.
- **Exercise**: `exercise/library/NUTRILONGX_EJERCICIO_LIBRARY_PILOT_v1.1.json` (contenido) + el schema recuperado más reciente en `exercise/schemas/` (ver nota: v1.2 está referenciado pero no recuperado como fichero).

## 4. Diferencia entre `canonical/` / `sources/` / `archive/`

- **`canonical/`** (o `library/` en exercise): el artefacto vigente,
  normalmente `FROZEN`. Se lee, no se edita a mano.
- **`sources/`**: material de entrada usado para construir el canónico
  (workbooks, JSON intermedios, legacy). No es la fuente de verdad de cara a
  la app — es la procedencia del canónico.
- **`archive/`**: versiones formalmente `SUPERSEDED`. Se conservan íntegras
  por provenance/reproducibilidad/auditoría — **nunca son fuente de verdad**
  mientras exista un sucesor activo.

## 5. Cómo añadir una nueva versión

1. El nuevo artefacto entra primero por `documentos nuevos/` (staging, en la
   raíz del repo, fuera de `nutrilongx/`).
2. Se audita: hash, versión, fecha, changelog, relación con lo existente.
3. Si sustituye a un canónico actual, el anterior se mueve a `archive/` con
   `status: SUPERSEDED` y `superseded_by` apuntando al nuevo — **nunca se
   sobrescribe ni se borra**.
4. El nuevo se copia a `canonical/` (o la carpeta que corresponda).
5. Se actualizan `ARTIFACT_REGISTRY_v1.json`, `CANONICAL_REGISTRY_v1.md`,
   `PROJECT_STATE_v1.md` y `manifests/NUTRILONGX_REPOSITORY_MANIFEST_v1.json`.
6. Commit propio, en una rama `docs/...`, nunca directo a `main`.

## 6. Obligación de actualizar registry y manifest

Ningún artefacto se considera persistido correctamente si no aparece en
**ambos** — `NUTRILONGX_ARTIFACT_REGISTRY_v1.json` (máquina) y el manifest
SHA-256 (`manifests/NUTRILONGX_REPOSITORY_MANIFEST_v1.json`). Si un futuro
agente copia un fichero a este árbol sin actualizar ambos, esa copia no debe
tratarse como reconocida.

## 7. Prohibición de sobrescribir snapshots FROZEN

Un artefacto con `status: FROZEN` en el registry **no se edita nunca in
situ**. Si necesita cambiar, se construye una versión nueva (`_v2`, `_v1.1`,
etc.), se aplica el flujo de la sección 5, y el `FROZEN` anterior pasa a
`archive/` como `SUPERSEDED`.

## 8. Cómo manejar supersession

Todo artefacto `SUPERSEDED` conserva su `superseded_by` en el registry y
vive en `archive/` (o `exercise/archive/`, etc.). No se borra nunca — puede
ser necesario para reconstruir una decisión, auditar, o para investigación
científica que cite la versión exacta que se usó en su momento.

## 9. Cómo manejar `REFERENCED_NOT_RECOVERED`

Cuando un artefacto se cita desde un canónico o un schema pero no se
localiza como fichero independiente, se registra explícitamente como
`REFERENCED_NOT_RECOVERED` — nunca se reconstruye, nunca se infiere su
contenido, nunca se sustituye por una versión inventada. Ver
`clinical/missing/` para el patrón a seguir. "No recuperado" no equivale a
"no existe" — solo a "no localizado en esta auditoría".

## 10. Separación entre content layer y user/personalization layer

Este knowledge base documenta exclusivamente la **capa de contenido**
(qué recetas, qué ejercicios, qué acciones puntuables existen y su
definición). **No contiene ni debe contener** datos de usuarios reales,
progreso individual, ni estado de personalización — eso vive (o debería
vivir) en Supabase, bajo RLS, nunca en este árbol versionado en Git. Ver
`governance/audits/` para la evidencia (no la certeza) de qué tablas de
usuario existen hoy realmente desplegadas.

---

**Regla para futuros agentes**: ningún agente debe considerar un archivo de
`/archive` o de `documentos nuevos/` como fuente de verdad si existe un
artefacto `source_of_truth: true` activo registrado en
`NUTRILONGX_ARTIFACT_REGISTRY_v1.json`.
