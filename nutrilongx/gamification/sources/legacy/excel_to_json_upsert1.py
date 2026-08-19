#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Lee un Excel de gamificación y hace UPSERT directo en Supabase:
# - actions_catalog (una fila por acción)
# - action_refs (una fila por action_id x source_id)
#
# Uso:
#   python excel_to_json_upsert.py --excel NUTRILONGX_creditos_v3.xlsx
#
# Opciones:
#   --supabase-url https://XXXX.supabase.co
#   --service-role-key <KEY>
#   --batch 500               (tamaño de lote para upsert)
#   --dry-run                 (no escribe; solo muestra)
#   --out actions_catalog.json (opcional: salva también el JSON resultante)
#
# Necesita:
#   - PK en actions_catalog(id)
#   - PK en action_refs(action_id, source_id)
#
# Novedades:
#   * Extrae también la columna "Explicación al cliente" (si existe) y la exporta como message_user.
#   * Normaliza y guarda todo en UTF-8 (NFC), evitando mojibake tipo 'PrÃ¡cticas...'.
#   * Los POST a Supabase se envían como application/json; charset=utf-8 y con ensure_ascii=False.

import os
import json
import math
import argparse
from typing import List, Dict, Any, Optional
import pandas as pd
import requests
import unicodedata
from dotenv import load_dotenv

# ------------------------- Configs/Constantes -------------------------

LEVEL_CODE = {"Inicial": "INI", "Bronce": "BRO", "Plata": "PLA", "Oro": "ORO", "Platino": "PTN"}
PILLAR_CODE = {"Retos (Ejercicio)": "RET", "Rutinas": "RUT", "Alimentación": "ALI", "Mente": "MEN"}

NEEDED_COLS = [
    "Nivel", "Actividad", "Subpilar", "Unidad",
    "Vida_ganada_horas", "Vida_ganada_dias",
    "Justificación breve", "FuenteIDs"
]

# Candidatas para el copy al usuario (incluye variantes con y sin acentos):
MESSAGE_COL_CANDIDATES = [
    "Explicación al cliente", "Explicacion al cliente",
    "Explicación", "Explicacion",
    "Mensaje_usuario", "Mensaje Usuario", "Mensaje usuario", "Mensaje", "Copy", "Copy usuario"
]

# ------------------------- Utilidades -------------------------

def split_semicolon(s: str) -> List[str]:
    if s is None:
        return []
    s = str(s).strip()
    if not s:
        return []
    return [x.strip() for x in s.split(";") if x.strip()]

def strip_accents_lower(s: str) -> str:
    # lower + quitar acentos (NFD -> eliminar marcas) para comparaciones robustas
    s = str(s).lower()
    return "".join(ch for ch in unicodedata.normalize("NFD", s) if unicodedata.category(ch) != "Mn")

def detect_col(df: pd.DataFrame, candidates: List[str]) -> Optional[str]:
    """Devuelve el nombre REAL de la columna en df que coincide (insensible a acentos/caso)."""
    norm_map = {strip_accents_lower(c): c for c in df.columns}
    for cand in candidates:
        key = strip_accents_lower(cand)
        if key in norm_map:
            return norm_map[key]
    # fallback: buscar heurísticamente por palabras clave
    for k, real in norm_map.items():
        if any(word in k for word in ["explicacion", "mensaje", "cliente", "copy"]):
            return real
    return None

def demojibake(s: str) -> str:
    """Intenta reparar texto mojibake típico (UTF-8 mal decodificado como Latin-1)."""
    if s is None:
        return s
    if "Ã" in s or "Â" in s:  # patrón común
        try:
            return s.encode("latin1").decode("utf-8")
        except Exception:
            return s
    return s

def normalize_text(val) -> Optional[str]:
    """Convierte a str, limpia NBSP, repara mojibake y normaliza a NFC (UTF-8)."""
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return None
    s = str(val).replace("\u00A0", " ").strip()
    s = demojibake(s)
    s = unicodedata.normalize("NFC", s)
    return s

def build_actions_from_excel(xlsx_path: str) -> Dict[str, Any]:
    xl = pd.read_excel(xlsx_path, sheet_name=None)
    actions: List[Dict[str, Any]] = []

    for sheet_name, df in xl.items():
        if sheet_name not in PILLAR_CODE:
            # Ignora hojas auxiliares
            continue

        # Valida columnas básicas
        if not set(NEEDED_COLS).issubset(df.columns):
            print(f"[WARN] Hoja '{sheet_name}' no contiene columnas requeridas; se ignora.")
            continue

        msg_col = detect_col(df, MESSAGE_COL_CANDIDATES)
        df = df.reset_index(drop=True)

        for idx, row in df.iterrows():
            lvl = normalize_text(row["Nivel"]) or ""
            pillar = sheet_name
            code = f"{PILLAR_CODE[pillar]}-{LEVEL_CODE.get(lvl, 'UNK')}-{idx+1:03d}"

            message_user = normalize_text(row[msg_col]) if msg_col and pd.notna(row.get(msg_col)) else None

            actions.append({
                "id": code,
                "pillar": normalize_text(pillar),
                "level": lvl,
                "title": normalize_text(row["Actividad"]) or "",
                "subpillar": normalize_text(row["Subpilar"]) or "",
                "unit": normalize_text(row["Unidad"]) or "",
                "life_hours": float(row["Vida_ganada_horas"]),
                "life_days": float(row["Vida_ganada_dias"]),
                "rationale": normalize_text(row["Justificación breve"]) or "",
                "message_user": message_user,
                "source_ids": split_semicolon(row["FuenteIDs"]),
            })

    return {"version": "1.0.1", "source_excel": os.path.basename(xlsx_path), "actions": actions}

def chunked(lst: List[Any], size: int) -> List[List[Any]]:
    return [lst[i:i + size] for i in range(0, len(lst), size)]

# ------------------------- Supabase REST -------------------------

class SupabaseRest:
    def __init__(self, url: str, service_role_key: str):
        self.base = url.rstrip("/")
        self.key = service_role_key
        self.headers_json = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json; charset=utf-8",
            # Upsert en PostgREST: merge duplicates sobre PK/unique
            "Prefer": "resolution=merge-duplicates,return=representation"
        }

    def upsert_actions_catalog(self, rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """POST /rest/v1/actions_catalog con upsert por PK(id)."""
        url = f"{self.base}/rest/v1/actions_catalog"
        payload = json.dumps(rows, ensure_ascii=False).encode("utf-8")
        r = requests.post(url, headers=self.headers_json, data=payload, timeout=60)
        if r.status_code not in (200, 201):
            raise RuntimeError(f"Upsert actions_catalog failed: {r.status_code} {r.text}")
        return r.json() if r.text else []

    def upsert_action_refs(self, rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """POST /rest/v1/action_refs con upsert por PK(action_id,source_id)."""
        url = f"{self.base}/rest/v1/action_refs"
        payload = json.dumps(rows, ensure_ascii=False).encode("utf-8")
        r = requests.post(url, headers=self.headers_json, data=payload, timeout=60)
        if r.status_code not in (200, 201):
            raise RuntimeError(f"Upsert action_refs failed: {r.status_code} {r.text}")
        return r.json() if r.text else []

    def count_actions(self) -> int:
        url = f"{self.base}/rest/v1/actions_catalog?select=id"
        headers = self.headers_json.copy()
        headers["Prefer"] = "count=exact"
        r = requests.get(url, headers=headers, timeout=60)
        if r.status_code != 200:
            return -1
        return int(r.headers.get("content-range", "0/0").split("/")[-1])

# ------------------------- Main -------------------------

def main():
    load_dotenv()  # permite usar .env local

    ap = argparse.ArgumentParser()
    ap.add_argument("--excel", required=True, help="Ruta al Excel v3")
    ap.add_argument("--out", default=None, help="Si se indica, guarda el JSON generado")
    ap.add_argument("--supabase-url", default=os.getenv("SUPABASE_URL"))
    ap.add_argument("--service-role-key", default=os.getenv("SUPABASE_SERVICE_ROLE_KEY"))
    ap.add_argument("--batch", type=int, default=500)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if not args.supabase_url or not args.service_role_key:
        raise SystemExit("Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY (usa --supabase-url / --service-role-key o .env).")

    # 1) Construir JSON desde Excel
    catalog = build_actions_from_excel(args.excel)
    actions = catalog["actions"]
    print(f"[INFO] Acciones detectadas: {len(actions)}")

    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(catalog, f, ensure_ascii=False, indent=2)
        print(f"[INFO] Guardado JSON en {args.out} (UTF-8, ensure_ascii=False)")

    if args.dry_run:
        print("[DRY-RUN] No se escribirá en Supabase.")
        return

    # 2) Conectar a Supabase
    sb = SupabaseRest(args.supabase_url, args.service_role_key)

    # 3) Upsert actions_catalog en lotes
    rows_catalog = []
    for a in actions:
        rows_catalog.append({
            "id": a["id"],
            "pillar": a["pillar"],
            "level": a["level"],
            "title": a["title"],
            "subpillar": a["subpillar"],
            "unit": a["unit"],
            "life_hours": a["life_hours"],
            "life_days": a["life_days"],
            "rationale": a["rationale"],
            "message_user": a.get("message_user")  # puede ser None
        })

    total_upserted = 0
    for chunk in chunked(rows_catalog, args.batch):
        res = sb.upsert_actions_catalog(chunk)
        total_upserted += len(res)
    print(f"[OK] Upsert actions_catalog: {total_upserted} filas (sum del return)")

    # 4) Upsert action_refs (explode source_ids)
    rows_refs = []
    for a in actions:
        for sid in a["source_ids"]:
            rows_refs.append({"action_id": a["id"], "source_id": sid})

    total_refs_upserted = 0
    for chunk in chunked(rows_refs, args.batch):
        res = sb.upsert_action_refs(chunk)
        total_refs_upserted += len(res)
    print(f"[OK] Upsert action_refs: {total_refs_upserted} filas")

    # 5) Conteo final
    final_count = sb.count_actions()
    if final_count >= 0:
        print(f"[INFO] Total acciones en actions_catalog: {final_count}")

    print("[DONE] Importación completada.")

if __name__ == "__main__":
    main()
