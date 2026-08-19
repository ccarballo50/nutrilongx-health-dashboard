# NUTRILONGX — Paquete de implementación
Archivos que debes usar en tu otro chat/proyecto:
- engine_config.json → reglas del motor (niveles, rachas, boosters, combos, multiplicadores, caps).
- engine_reference.ts → funciones computeDay / hoursToDays.
- (opcional) actions_catalog.json → genera con el script excel_to_actions_catalog.py a partir de tu Excel.

Pasos:
1) Subir `engine_config.json` (y tu Excel `NUTRILONGX_creditos_v2.xlsx`).
2) Generar `actions_catalog.json` con el script y cargarlo en BD o memoria.
3) Usar `computeDay()` con los logs del usuario; convertir a días: horas/24.
4) Aplicar multiplicadores semanales y caps según engine_config.
