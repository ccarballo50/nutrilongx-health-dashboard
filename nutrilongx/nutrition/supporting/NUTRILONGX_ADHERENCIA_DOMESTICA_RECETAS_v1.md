# NUTRILONGX — Adherencia Doméstica de Recetas v1.1

**Documento de uso interno. Solo para el GPT NUTRILONGX Recipe Validator.**
Versión: 1.1 | Fecha: 2026-06-26
Cambios respecto a v1.0: decisión operativa sobre NIVEL_COMPRA_SEMANAL = MEDIA — la alternativa básica debe estar integrada en campos visibles al cliente para alcanzar ADHERENCIA_DOMESTICA = OK · tabla de canales ampliada con columna NIVEL_COMPRA y fila de piloto inicial · regla de piloto añadida en §1.4.

---

## PROPÓSITO

Una receta nutricionalmente correcta y clínicamente segura puede fracasar si el cliente no la prepara. La adherencia doméstica mide si una receta puede ejecutarse de forma realista en una cocina española estándar, con la lista de la compra habitual y sin conocimientos culinarios avanzados.

Este documento define los criterios, el lenguaje, las correcciones y los campos del CHECK 11 — ADHERENCIA DOMÉSTICA, que es el undécimo check del proceso de validación NUTRILONGX.

La adherencia doméstica **no es un filtro de calidad culinaria**. Una receta elaborada puede tener adherencia BAJA sin ser incorrecta desde el punto de vista nutricional. La diferencia es que una receta con adherencia BAJA necesita una alternativa simplificada antes de poder asignarse a clientes del plan estándar o del canal Online/Lifestyle.

---

## PARTE 1 — DEFINICIONES

### 1.1 Adherencia doméstica

Capacidad de una receta de ser preparada por un cliente medio de NUTRILONGX en su hogar, sin equipamiento especializado, con ingredientes disponibles en un supermercado convencional español (Mercadona, Lidl, Alcampo, Carrefour), y en el tiempo razonable que el tipo de comida implica.

El cliente medio de referencia para este check es una persona adulta con conocimientos culinarios básicos-medios, equipamiento estándar (horno, vitrocerámica o gas, sartén antiadherente, batidora de mano), y capacidad de compra en supermercado convencional.

### 1.2 Cuándo una receta tiene adherencia BAJA

Una receta tiene `ADHERENCIA_DOMESTICA = BAJA` cuando cumple al menos una de las siguientes condiciones:

- Contiene ≥ 1 ingrediente de compra especial sin alternativa básica documentada.
- Requiere ≥ 2 técnicas culinarias que no son de uso doméstico habitual.
- Usa lenguaje gourmet en `INGREDIENTES_NLX` o `PREPARACION_NLX` que el cliente no puede interpretar (sin definición en el mismo texto).
- El tiempo de preparación supera en > 30 min el esperado para el tipo de comida.

### 1.3 Cuándo una receta tiene adherencia REVISAR

`ADHERENCIA_DOMESTICA = REVISAR` cuando:

- Contiene 1 ingrediente de compra especial con alternativa básica documentada en `SUSTITUCIONES`, pero esa alternativa no está reflejada en el texto de cliente (`VERSION_CLIENTE`).
- Usa 1 técnica no habitual que puede explicarse con una instrucción adicional de 1 línea.
- El lenguaje tiene 1–2 términos gourmet que pueden eliminarse o sustituirse sin pérdida de información.

### 1.4 Cuándo una receta tiene adherencia OK

`ADHERENCIA_DOMESTICA = OK` en dos escenarios:

**Escenario A — NIVEL_COMPRA_SEMANAL = BASICA**:
- Todos los ingredientes disponibles en supermercado convencional sin búsqueda especial.
- Técnicas de nivel doméstico habitual (saltear, hervir, hornear, triturar, batir).
- Lenguaje claro y directo, sin términos que requieran conocimiento culinario previo.
- Tiempo de preparación coherente con el tipo de comida.

**Escenario B — NIVEL_COMPRA_SEMANAL = MEDIA** (condición adicional obligatoria):
- Cumple todas las condiciones del Escenario A, Y
- La alternativa básica para cada ingrediente MEDIA está integrada en **los tres campos visibles al cliente**: `INGREDIENTES_NLX`, `PREPARACION_NLX` (cuando aplica) y `VERSION_CLIENTE`.
- Si la alternativa solo existe en `SUSTITUCIONES` o en `NOTA_INTERNA_PROFESIONAL` → `ADHERENCIA_DOMESTICA = REVISAR`, no OK.

> **Regla de piloto inicial**: Durante el piloto, solo se asignan a clientes recetas con `APTA_PILOTO = SI`. Las recetas con `APTA_PILOTO = SI_TRAS_REVALIDACION` son prioritarias para revalidación rápida pero no se envían hasta completar el ciclo formal. Las recetas con `APTA_PILOTO = PENDIENTE_REVALIDACION` o `NO` no se asignan.

---

## PARTE 2 — CAMPOS DE ADHERENCIA DOMÉSTICA

### 2.1 ADHERENCIA_DOMESTICA

| Valor | Descripción | Efecto en CHECK 11 |
|---|---|---|
| `OK` | La receta puede prepararse sin obstáculos en una cocina doméstica estándar | CHECK 11 → OK |
| `REVISAR` | Hay 1–2 elementos que dificultan la preparación pero tienen solución sencilla | CHECK 11 → REVISAR |
| `BAJA` | La receta no puede ejecutarse razonablemente en una cocina doméstica sin ayuda adicional | CHECK 11 → BLOQUEAR para canal Online/Lifestyle |

### 2.2 NIVEL_COMPRA_SEMANAL

| Valor | Descripción | Ejemplos |
|---|---|---|
| `BASICA` | Todos los ingredientes en cualquier supermercado convencional | Huevos, pollo, verduras, legumbres de bote, aceite de oliva, especias básicas |
| `MEDIA` | Mayoría en supermercado convencional; 1–2 ingredientes requieren sección especializada o tienda de alimentación | Kéfir, tahini, miso blanco, edamame congelado, tempeh de supermercado |
| `ESPECIAL` | ≥ 1 ingrediente requiere tienda especializada, herbolario, pedido online o mercado | Shiitake fresco, tahini de sésamo negro, aceite de trufa, sal del Himalaya, spirulina |

### 2.3 SUSTITUCION_SIMPLE_REQUERIDA

| Valor | Descripción |
|---|---|
| `SI` | La receta solo es viable domésticante si se aplica al menos una sustitución de la lista SUSTITUCIONES |
| `NO` | La receta es viable tal como está sin necesidad de sustitución |

### 2.4 USO_DIETA_SEMANAL

Este campo indica si la receta puede usarse directamente en un plan semanal de dieta para el canal estándar o si requiere ajuste previo.

| Valor | Descripción |
|---|---|
| `OK` | Lista para asignación directa en dieta semanal del canal estándar |
| `REVISAR` | Puede usarse con aviso al cliente de que aplique la sustitución indicada |
| `NO_RECOMENDADA` | No asignar en dieta semanal estándar hasta simplificar. Puede usarse en canal Premium o para clientes con perfil culinario alto. |

---

## PARTE 3 — CRITERIOS DE EVALUACIÓN

### 3.1 Lista de ingredientes de compra especial (NIVEL_COMPRA_SEMANAL = ESPECIAL)

Ingredientes que activan `NIVEL_COMPRA_SEMANAL = ESPECIAL` si no existe alternativa básica documentada:

| Ingrediente | Razón | Alternativa básica |
|---|---|---|
| Shiitake fresco | No está en todos los supermercados convencionales | Champiñón portobello o champiñón común |
| Tahini de sésamo negro | Difícil de encontrar fuera de tiendas especializadas | Tahini convencional blanco |
| Aceite de trufa | Alto coste, disponibilidad limitada | AOVE extra virgen (prescindible en la mayoría de recetas) |
| Sal del Himalaya rosa | Coste superior sin ventaja nutricional documentada | Sal marina fina |
| Spirulina / clorela | Solo en herbolarios y tiendas bio | Espinacas frescas (función nutricional diferente pero accesible) |
| Maca en polvo | Solo en herbolarios | Prescindir del ingrediente |
| Aceite de argán alimentario | Difícil acceso y coste elevado | AOVE extra virgen |
| Quinoa negra o roja | Disponible solo en tiendas especializadas | Quinoa blanca (mismo perfil nutricional) |
| Ghee artesanal | El ghee industrial está en algunos grandes supermercados; el artesanal no | AOVE (siempre) o mantequilla clarificada casera |
| Kombucha casera o kéfir de agua casero (requiere fermentación propia) | Proceso de elaboración, no disponible ya hecha | Kombucha comercial sin azúcar (supermercado medio) |
| Tempeh artesanal | El tempeh industrial está en grandes superficies | Tempeh de supermercado o tofu firme |
| Edamame fresco (no congelado) | Difícil de encontrar en temporada fuera de grandes ciudades | Edamame congelado (equivalente nutricional) |

### 3.2 Lista de ingredientes de compra media (NIVEL_COMPRA_SEMANAL = MEDIA)

Ingredientes disponibles en supermercados medios-grandes pero no en todos:

| Ingrediente | Dónde encontrarlo | Alternativa si no disponible |
|---|---|---|
| Kéfir natural | Mercadona, Carrefour, Lidl (sección lácteos) | Yogur natural sin azúcar |
| Tahini blanco convencional | Mercadona (Hacendado), Carrefour, herbolarios | AOVE + zumo de limón + sésamo tostado (2 cdas AOVE + 1 cdta sésamo + ½ limón) |
| Miso blanco | Supermercados asiáticos, Carrefour, Amazon | Pasta de umeboshi o prescindir del miso y añadir 1 cdta de salsa de soja baja en sodio |
| Edamame congelado | Lidl (temporada), Carrefour, Mercadona | Guisantes congelados (menor proteína, mayor IG) |
| Tempeh (industrial) | Carrefour, herbolarios, grandes Alcampo | Tofu firme |
| Aminos de coco | Amazon, herbolarios, Carrefour sección bio | Salsa de soja baja en sodio en mitad de cantidad |
| Pasta de umeboshi | Supermercados japoneses, Amazon, herbolarios | Prescindir o sustituir por miso ½ cdta + zumo limón |

### 3.3 Técnicas que requieren nota de simplificación

Técnicas que tienen nivel doméstico REVISAR (se pueden simplificar con 1 instrucción adicional):

| Técnica original | Lenguaje simplificado | Nota de simplificación |
|---|---|---|
| "Crear una nube de coliflor" | "Hacer un puré de coliflor" | Cocer y triturar. Sin batidora de vaso: usar tenedor o pasapurés. |
| "Obtener una textura sedosa" | Eliminar el descriptor | La instrucción de cocción es suficiente; el resultado se consigue siguiendo los pasos. |
| "Dorar el fondo de Maillard" | "Saltear a fuego alto sin remover" | Equivalente doméstico: calentar bien la sartén antes de añadir el ingrediente. |
| "Emulsionar la vinagreta" | "Batir con tenedor hasta que espese" | Agitar con fuerza en un tarro cerrado también funciona. |
| "Confitar los ajos" | "Pochar los ajos a fuego muy bajo" | Fuego mínimo durante 8–10 min hasta que estén blandos y dorados. |
| "Sellar la proteína" | "Dorar por todos los lados a fuego alto" | 1–2 min por lado en sartén caliente con muy poco aceite. |
| "Desglasar con vino" | "Añadir el vino y rascar el fondo de la sartén" | O sustituir el vino por caldo de verduras. |
| "Montar la salsa en frío" | "Mezclar todos los ingredientes de la salsa en un bol pequeño" | Sin técnica especial necesaria. |

### 3.4 Lenguaje gourmet → lenguaje doméstico

| Lenguaje gourmet (eliminar) | Lenguaje doméstico (usar) |
|---|---|
| "nube de coliflor" | "puré de coliflor" |
| "textura sedosa" | (eliminar — es un resultado, no una instrucción) |
| "crema dorada de boniato" | "crema de boniato" |
| "emulsión de tahini" | "salsa de tahini" |
| "brunoise de cebolla" | "cebolla picada muy fina" |
| "juliana de pimiento" | "pimiento en tiras finas" |
| "chiffonade de albahaca" | "albahaca picada en tiras finas" |
| "ghee clarificado artesanal" | "aceite de oliva" (sustitución directa) |
| "flor de sal" | "sal de escamas" o simplemente "sal" |
| "reducción de balsámico" | "vinagre balsámico (opcional)" |
| "coulis de tomate" | "salsa de tomate casera" o "tomate triturado natural" |
| "infusionar el aceite" | "calentar el aceite con el ajo a fuego bajo" |
| "blanquear las verduras" | "cocer las verduras 2 min en agua hirviendo y enfriar en agua con hielo" |

---

## PARTE 4 — CORRECCIONES DE ADHERENCIA DOMÉSTICA

### 4.1 Tabla de correcciones: problema → solución

| Problema | Condición que activa | Corrección obligatoria |
|---|---|---|
| Lenguaje gourmet en INGREDIENTES_NLX o PREPARACION_NLX | ≥ 1 término de la lista §3.4 | Sustituir por el equivalente doméstico. No requiere cambio de VERSION_RECETA si es solo texto. |
| Ingrediente de compra ESPECIAL sin alternativa en SUSTITUCIONES | NIVEL_COMPRA_SEMANAL = ESPECIAL + SUSTITUCION_SIMPLE_REQUERIDA = SI + SUSTITUCIONES vacío o sin alternativa básica | Añadir alternativa básica en SUSTITUCIONES. Cambiar VERSION_RECETA si el ingrediente principal se modifica. |
| Ingrediente de compra ESPECIAL con alternativa en SUSTITUCIONES pero no visible en VERSION_CLIENTE | NIVEL_COMPRA_SEMANAL = ESPECIAL + alternativa existe pero VERSION_CLIENTE no la menciona | Añadir mención de la alternativa en VERSION_CLIENTE. Ej: "también funciona genial con champiñón portobello si no encuentras shiitake". |
| Técnica compleja sin simplificación en PREPARACION | ≥ 1 técnica de la lista §3.3 sin explicación doméstica | Añadir nota de simplificación en el paso correspondiente de PREPARACION_NLX. |
| Receta demasiado elaborada (≥ 3 técnicas no domésticas o > 45 min de preparación activa) | DIFICULTAD = AVANZADA + NIVEL_COMPRA_SEMANAL ≠ BASICA | Crear chunk VERSION_SIMPLIFICADA con la versión reducida a técnicas básicas, o reclasificar DIFICULTAD y ajustar receta. |
| Compra especial sin alternativa básica en ningún campo | NIVEL_COMPRA_SEMANAL = ESPECIAL + SUSTITUCION_SIMPLE_REQUERIDA = SI + sin alternativa en ningún campo | CHECK 11 → BLOQUEAR para canal estándar. Marcar USO_DIETA_SEMANAL = NO_RECOMENDADA hasta corrección. |
| Proteína baja en receta ligera (ENTRANTE, PRIMER_PLATO) usada como plato único en dieta semanal | TIPO_COMIDA = ENTRANTE/PRIMER_PLATO + proteína < 8g + USO_DIETA_SEMANAL = OK | Cambiar USO_DIETA_SEMANAL = REVISAR. Añadir en VERSION_CLIENTE la recomendación de acompañar. |

### 4.2 Correcciones específicas para recetas del lote NLX-001–008

Estas correcciones se aplican como referencia de los criterios del CHECK 11 y son vinculantes para todas las recetas del sistema:

| Receta | Problema de adherencia | Corrección aplicada |
|---|---|---|
| NLX-006 | "nube de coliflor" en título y preparación | Cambiar a "puré de coliflor". Mantener en TITULO_NUTRILONGX como "sobre puré de coliflor". |
| NLX-006 | "textura sedosa" en PREPARACION_NLX | Eliminar el descriptor. La instrucción de triturar es suficiente. |
| NLX-008 | "shiitake fresco" como ingrediente único (ESPECIAL) | Añadir entre paréntesis en INGREDIENTES_NLX: "(o champiñón portobello)". Reflejar en VERSION_CLIENTE. |
| NLX-003 | "ghee clarificado" como ingrediente | Cambiar a "AOVE o ghee (si se tiene)". El AOVE es la opción por defecto. |
| NLX-004 | "tahini" sin alternativa visible en INGREDIENTES | Añadir entre paréntesis: "(o 2 cdas AOVE + zumo de limón + 1 cdta sésamo tostado)". |
| NLX-007 | Título "crema dorada de boniato" | Simplificar a "crema de boniato con jengibre". El adjetivo "dorada" no añade información al cliente. |

---

## PARTE 5 — INTERACCIÓN CON OTROS CHECKS

### 5.1 Relación con CHECK 9 (baja adherencia de ingrediente)

El CHECK 9 de v1.1 detecta ingredientes de baja adherencia sin alternativa documentada. El CHECK 11 amplía ese enfoque:

- **CHECK 9** detecta si el ingrediente tiene alternativa en el campo SUSTITUCIONES.
- **CHECK 11** verifica si esa alternativa es realmente de compra básica, si el lenguaje de toda la receta es doméstico, si las técnicas son accesibles, y si el USO_DIETA_SEMANAL es correcto.

Pueden coexistir CHECK 9 → OK y CHECK 11 → REVISAR cuando el ingrediente tiene alternativa en SUSTITUCIONES pero el lenguaje o las técnicas siguen siendo gourmet.

### 5.2 Relación con la etiqueta DIFICULTAD

| DIFICULTAD | ADHERENCIA_DOMESTICA esperada | Si no coincide |
|---|---|---|
| `FACIL` | `OK` | Si FACIL pero ADHERENCIA = BAJA → CHECK 11 activa REVISAR sobre la coherencia de la etiqueta |
| `MEDIA` | `OK` o `REVISAR` | Si MEDIA pero ADHERENCIA = BAJA → REVISAR; si MEDIA con NIVEL_COMPRA = MEDIA y alternativa no visible → REVISAR |
| `AVANZADA` | `REVISAR` o `BAJA` | Aceptable. Pero si USO_DIETA_SEMANAL = OK → incoherencia → REVISAR |

### 5.3 Relación con canales de distribución

| Canal NUTRILONGX | ADHERENCIA_DOMESTICA mínima | NIVEL_COMPRA máximo para asignar sin aviso | USO_DIETA_SEMANAL mínimo |
|---|---|---|---|
| Online / Lifestyle (cliente estándar) | `OK` | `BASICA` o `MEDIA` (con alternativa integrada en campos visibles) | `OK` |
| Piloto inicial | `OK` | `BASICA` o `MEDIA` (con alternativa integrada en campos visibles) | `OK` |
| Premium (cliente con experiencia culinaria) | `OK` o `REVISAR` | `MEDIA` o `ESPECIAL` (con alternativa en SUSTITUCIONES) | `OK` o `REVISAR` |
| Método 365 — correo semanal | `OK` | `BASICA` o `MEDIA` (con alternativa integrada) | `OK` |
| Biblioteca interna / Inspiración | `BAJA` aceptable | Sin restricción | `NO_RECOMENDADA` aceptable |

**Regla de canal para NIVEL_COMPRA = MEDIA**:
- Canal estándar / Piloto / Método 365: la alternativa básica debe estar en `INGREDIENTES_NLX`, `PREPARACION_NLX` y `VERSION_CLIENTE`. Si solo está en `SUSTITUCIONES` o `NOTA_INTERNA_PROFESIONAL` → `APTA_PILOTO = SI_TRAS_REVALIDACION` (si es la única incidencia y ya está corregida) o `PENDIENTE_REVALIDACION` (si hay más incidencias). No asignable en ningún caso hasta revalidación.
- Canal Premium: basta con que la alternativa esté en `SUSTITUCIONES`.

Una receta con `ADHERENCIA_DOMESTICA = BAJA` o `USO_DIETA_SEMANAL = NO_RECOMENDADA` puede existir en la biblioteca interna como inspiración para versiones simplificadas, pero no puede asignarse en ningún plan de dieta del canal estándar o piloto.

---

## PARTE 6 — LENGUAJE DE CLIENTE Y ADHERENCIA

### 6.1 Principio de lenguaje doméstico

El texto visible al cliente (VERSION_CLIENTE, VERSION_EMAIL, TITULO_NUTRILONGX) debe usar el lenguaje que un cliente medio usaría para describir lo que va a cocinar, no el lenguaje de un chef profesional describiendo su plato.

**Prueba de lenguaje doméstico**: Si el cliente tiene que buscar en Google qué significa una palabra de la receta para poder prepararla, esa palabra debe sustituirse o explicarse.

### 6.2 Excepciones al principio de lenguaje doméstico

Los siguientes términos pueden usarse sin sustitución porque son ampliamente conocidos en el contexto culinario español cotidiano:

- Sofreír, saltear, hervir, hornear, triturar, batir, rallar, picar
- AOVE, tahini (con alternativa en SUSTITUCIONES), kéfir, miso (con nota de dónde comprarlo)
- Curcuma, comino, jengibre (especias cada vez más comunes)
- Quinoa, edamame (ya presentes en supermercados convencionales)
- Batch cook / meal prep (en comunidades de nutrición)

### 6.3 Ejemplos de corrección de lenguaje en texto de cliente

**ANTES** (lenguaje gourmet):
```
"Tritura hasta obtener una nube de coliflor con textura sedosa y cremosa."
```
**DESPUÉS** (lenguaje doméstico):
```
"Tritura la coliflor cocida hasta hacer un puré liso. Si queda espeso, añade una cucharada 
del agua de cocción."
```

**ANTES** (ingrediente gourmet sin alternativa visible):
```
"Saltear las setas shiitake en ghee clarificado a fuego alto."
```
**DESPUÉS** (alternativa integrada):
```
"Saltear las setas (shiitake o champiñón portobello) en aceite de oliva a fuego alto."
```

**ANTES** (título gourmet):
```
"Crema dorada de boniato y jengibre"
```
**DESPUÉS** (título doméstico):
```
"Crema de boniato con jengibre"
```

---

## PARTE 7 — CASOS ESPECIALES

### 7.1 Tahini: mantener con alternativa siempre visible

El tahini es un ingrediente de compra media que ya está disponible en Mercadona (Hacendado). Su presencia en una receta no activa NIVEL_COMPRA_SEMANAL = ESPECIAL. Sin embargo, dado que no todos los supermercados lo tienen y no todos los clientes lo conocen, **siempre debe acompañarse de su alternativa básica en el texto de ingredientes** (no solo en SUSTITUCIONES):

```
"1 cda tahini (o 2 cdas AOVE + zumo de ½ limón + 1 cdta sésamo tostado)"
```

Esta alternativa de AOVE + limón + sésamo no es nutricionalmente equivalente al tahini (menos proteína, diferente perfil de ácidos grasos), pero es funcionalmente equivalente para la receta: aporta cremosidad, acidez y sabor de sésamo. Documentar la diferencia nutricional en NOTAS_PROFESIONAL si es relevante para el objetivo.

### 7.2 Ghee: AOVE por defecto

En todas las recetas de NUTRILONGX, el AOVE es la opción por defecto para rehogar, saltear y terminar platos. El ghee puede aparecer como opción opcional con paréntesis pero nunca como ingrediente principal obligatorio:

```
"1 cdta AOVE (o ghee si se tiene)"
```

Nunca al revés: "1 cdta ghee clarificado (o AOVE)". El AOVE es el estándar; el ghee es la opción especial.

### 7.3 Recetas con DIFICULTAD = AVANZADA

Una receta con DIFICULTAD = AVANZADA puede tener ADHERENCIA_DOMESTICA = REVISAR o BAJA. Esto no es una contradicción: simplemente indica que esa receta no está optimizada para el canal estándar. La corrección puede ser:

1. Crear un chunk `VERSION_SIMPLIFICADA` con técnicas básicas equivalentes.
2. Mantener la receta avanzada en la biblioteca para el canal Premium.
3. Reclasificar DIFICULTAD a MEDIA si las técnicas se pueden simplificar sin pérdida nutricional o de concepto.

---

*Fin del documento de Adherencia Doméstica v1.1*
*Este documento se integra en el cuerpo doctrinal NUTRILONGX como parte de la versión v1.2.*
