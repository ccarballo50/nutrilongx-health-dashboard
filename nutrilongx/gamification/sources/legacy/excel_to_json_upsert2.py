#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Lee un Excel de gamificación y hace UPSERT directo en Supabase:
# - actions_catalog (una fila por acción)
# - action_refs (una fila por action_id x source_id)
#
# Uso rápido:
#   python excel_to_json_upsert.py --excel NUTRILONGX_creditos_v3.xlsx --out actions_catalog.json --dry-run
#
# Opciones:
#   --supabase-url https://XXXX.supabase.co
#   --service-role-key <KEY>
#   --batch 500                (tamaño de lote para upsert)
#   --dry-run                  (no escribe; solo muestra)
#   --out actions_catalog.json (opcional: guarda el JSON generado)
#   --out-encoding utf-8-sig   (utf-8-sig añade BOM útil en Windows/Excel/Notepad; por defecto utf-8-sig)
#   --print-sample 5           (muestra n filas para inspección visual de tildes/puntuación)
#
# Novedades:
#   * Extrae "Explicación al cliente" -> message_user.
#   * Corrige mojibake (latin1/cp1252->utf-8), normaliza Unicode (NFC) y repara comillas/guiones “inteligentes” mal decodificados.
#   * Escritura de JSON en UTF-8 **con BOM** por defecto (utf-8-sig) para viewers Windows.
#   * Detección robusta de nombres de columna (ignora acentos y signos).
import os, json, math, argparse, re, unicodedata
from typing import List, Dict, Any, Optional
import pandas as pd
import requests
from dotenv import load_dotenv

LEVEL_CODE = {"Inicial":"INI","Bronce":"BRO","Plata":"PLA","Oro":"ORO","Platino":"PTN"}
PILLAR_CODE = {"Retos (Ejercicio)":"RET","Rutinas":"RUT","Alimentación":"ALI","Mente":"MEN"}

NEEDED_COLS = ["Nivel","Actividad","Subpilar","Unidad","Vida_ganada_horas","Vida_ganada_dias","Justificación breve","FuenteIDs"]
MESSAGE_COL_CANDIDATES = [
    "Explicación al cliente","Explicacion al cliente","Explicación","Explicacion",
    "Mensaje_usuario","Mensaje Usuario","Mensaje usuario","Mensaje","Copy","Copy usuario",
    "Explicación al cliente:","Explicacion al cliente:","Explicación (cliente)","Copy (usuario)"
]

def normalize_key(s: str) -> str:
    s = str(s).strip().lower()
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    s = re.sub(r"[^a-z0-9]+", "", s)  # quita espacios y puntuación para comparar
    return s

def split_semicolon(s: str) -> List[str]:
    if s is None: return []
    s = str(s).strip()
    if not s: return []
    return [x.strip() for x in s.split(";") if x.strip()]

def detect_col(df: pd.DataFrame, candidates: List[str]) -> Optional[str]:
    norm_map = {normalize_key(c): c for c in df.columns}
    for cand in candidates:
        key = normalize_key(cand)
        if key in norm_map: return norm_map[key]
    for k, real in norm_map.items():
        if any(word in k for word in ["explicacionalcliente","explicacion","mensaje","cliente","copy","mensajeusuario"]):
            return real
    return None

# Mapa de “smart punctuation” cp1252 mal interpretada a Unicode correcto
SMART_PUNCT_FIX = {
    "â€˜": "‘", "â€™": "’", "â€œ": "“", "â€�": "”",
    "â€“": "–", "â€”": "—", "â€¦": "…", "â€¢": "•",
    "Â·": "·", "Â«": "«", "Â»": "»"
}

def fix_smart_punct(s: str) -> str:
    for bad, good in SMART_PUNCT_FIX.items():
        s = s.replace(bad, good)
    return s

def demojibake(s: str) -> str:
    # Repara secuencias típicas de mojibake si existen símbolos anómalos
    if s is None: return s
    if any(ch in s for ch in ("Ã", "Â", "â")):
        for enc in ("latin1", "cp1252"):
            try:
                candidate = s.encode(enc).decode("utf-8")
                if all(bad not in candidate for bad in ("Ã", "Â")):
                    return candidate
            except Exception:
                pass
    return s

def normalize_text(val) -> Optional[str]:
    if val is None or (isinstance(val, float) and math.isnan(val)): return None
    s = str(val).replace("\u00A0", " ").strip()
    # Aplicar reparaciones sólo si detectamos mojibake
    s = demojibake(s)
    s = fix_smart_punct(s)
    s = unicodedata.normalize("NFC", s)
    return s

def build_actions_from_excel(xlsx_path: str) -> Dict[str, Any]:
    xl = pd.read_excel(xlsx_path, sheet_name=None)
    actions: List[Dict[str, Any]] = []
    for sheet_name, df in xl.items():
        if sheet_name not in PILLAR_CODE: continue
        # Validación robusta de columnas
        norm_cols = {normalize_key(c): c for c in df.columns}
        needed_real = []
        for col in NEEDED_COLS:
            key = normalize_key(col)
            if key in norm_cols: needed_real.append(norm_cols[key])
            else:
                print(f"[WARN] Hoja '{sheet_name}' NO tiene columna requerida: {col}")
                break
        if len(needed_real) != len(NEEDED_COLS):
            print(f"[WARN] Hoja '{sheet_name}' no contiene columnas requeridas; se ignora.")
            continue
        msg_col = detect_col(df, MESSAGE_COL_CANDIDATES)
        df = df.reset_index(drop=True)

        col_nivel = norm_cols[normalize_key("Nivel")]
        col_act   = norm_cols[normalize_key("Actividad")]
        col_sub   = norm_cols[normalize_key("Subpilar")]
        col_unid  = norm_cols[normalize_key("Unidad")]
        col_h     = norm_cols[normalize_key("Vida_ganada_horas")]
        col_d     = norm_cols[normalize_key("Vida_ganada_dias")]
        col_j     = norm_cols[normalize_key("Justificación breve")]
        col_src   = norm_cols[normalize_key("FuenteIDs")]

        for idx, row in df.iterrows():
            lvl = normalize_text(row[col_nivel]) or ""
            pillar = sheet_name
            code = f"{PILLAR_CODE[pillar]}-{LEVEL_CODE.get(lvl, 'UNK')}-{idx+1:03d}"
            message_user = normalize_text(row[msg_col]) if msg_col and pd.notna(row.get(msg_col)) else None
            actions.append({
                "id": code,
                "pillar": normalize_text(pillar),
                "level": lvl,
                "title": normalize_text(row[col_act]) or "",
                "subpillar": normalize_text(row[col_sub]) or "",
                "unit": normalize_text(row[col_unid]) or "",
                "life_hours": float(row[col_h]),
                "life_days": float(row[col_d]),
                "rationale": normalize_text(row[col_j]) or "",
                "message_user": message_user,
                "source_ids": split_semicolon(row[col_src]),
            })
    return {"version": "1.0.3", "source_excel": os.path.basename(xlsx_path), "actions": actions}

def chunked(lst, size): return [lst[i:i+size] for i in range(0, len(lst), size)]

class SupabaseRest:
    def __init__(self, url: str, service_role_key: str):
        self.base = url.rstrip("/"); self.key = service_role_key
        self.headers_json = {
            "apikey": self.key, "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json; charset=utf-8",
            "Accept-Charset": "utf-8",
            "Prefer": "resolution=merge-duplicates,return=representation"
        }
    def upsert(self, table: str, rows: list): 
        import requests, json
        url = f"{self.base}/rest/v1/{table}"
        payload = json.dumps(rows, ensure_ascii=False).encode("utf-8")
        r = requests.post(url, headers=self.headers_json, data=payload, timeout=60)
        if r.status_code not in (200,201): raise RuntimeError(f"Upsert {table} failed: {r.status_code} {r.text}")
        return r.json() if r.text else []
    def count_actions(self) -> int:
        import requests
        url = f"{self.base}/rest/v1/actions_catalog?select=id"
        headers = self.headers_json.copy(); headers["Prefer"] = "count=exact"
        r = requests.get(url, headers=headers, timeout=60)
        if r.status_code != 200: return -1
        return int(r.headers.get("content-range", "0/0").split("/")[-1])

def main():
    load_dotenv()
    ap = argparse.ArgumentParser()
    ap.add_argument("--excel", required=True)
    ap.add_argument("--out", default=None)
    ap.add_argument("--out-encoding", default="utf-8-sig", choices=["utf-8","utf-8-sig"])  # BOM por defecto
    ap.add_argument("--supabase-url", default=os.getenv("SUPABASE_URL"))
    ap.add_argument("--service-role-key", default=os.getenv("SUPABASE_SERVICE_ROLE_KEY"))
    ap.add_argument("--batch", type=int, default=500)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--print-sample", type=int, default=0)
    args = ap.parse_args()

    # Construir JSON desde Excel
    catalog = build_actions_from_excel(args.excel)
    actions = catalog["actions"]
    print(f"[INFO] Acciones detectadas: {len(actions)}")

    # Guardar local
    if args.out:
        with open(args.out, "w", encoding=args.out_encoding) as f:
            json.dump(catalog, f, ensure_ascii=False, indent=2)
        print(f"[INFO] Guardado JSON en {args.out} ({args.out_encoding})")

    # Muestra de verificación visual
    if args.print_sample and actions:
        print("[SAMPLE] Primeras filas normalizadas:")
        for a in actions[:args.print_sample]:
            print(f" • {a['id']} | {a['title'][:60]} | {a['rationale'][:60]} | msg: {(a.get('message_user') or '')[:60]}")

    # Dry-run: parar aquí
    if args.dry_run:
        print("[DRY-RUN] No se escribirá en Supabase.")
        return

    # Subida a Supabase
    if not args.supabase_url or not args.service_role_key:
        raise SystemExit("Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. Use --dry-run para probar sin subir.")
    sb = SupabaseRest(args.supabase_url, args.service_role_key)

    rows_catalog = [{
        "id": a["id"], "pillar": a["pillar"], "level": a["level"],
        "title": a["title"], "subpillar": a["subpillar"], "unit": a["unit"],
        "life_hours": a["life_hours"], "life_days": a["life_days"],
        "rationale": a["rationale"], "message_user": a.get("message_user")
    } for a in actions]

    total = 0
    for chunk in chunked(rows_catalog, args.batch):
        res = sb.upsert("actions_catalog", chunk); total += len(res)
    print(f"[OK] Upsert actions_catalog: {total} filas")

    # action_refs
    rows_refs = [{"action_id": a["id"], "source_id": sid} for a in actions for sid in a["source_ids"]]
    total_refs = 0
    for chunk in chunked(rows_refs, args.batch):
        res = sb.upsert("action_refs", chunk); total_refs += len(res)
    print(f"[OK] Upsert action_refs: {total_refs} filas")

    final_count = sb.count_actions()
    if final_count >= 0: print(f"[INFO] Total acciones en actions_catalog: {final_count}")
    print("[DONE] Importación completada.")

if __name__ == "__main__":
    main()
