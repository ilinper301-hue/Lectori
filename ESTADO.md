# Estado de Lectori

Documento vivo. **Cada chat que trabaje en Lectori lo lee al empezar y lo actualiza al terminar**
(sección «Últimos cambios» arriba del todo, y «Pendiente» / «Problemas conocidos» si cambian).

_Última actualización: 2026-11-13 (fase 0)_

## Resumen

App (PWA) para aprender a leer con método fonético-sintético: 45 niveles (29 letras + 16 de inversas, trabadas,
diptongos y diéresis), con sílabas, palabras, frases y lecturas decodificables, repaso espaciado y zona del tutor con PIN.
Un solo `index.html` (versión 3.34), sin compilación. Publicada con GitHub Pages desde `main`:
https://ilinper301-hue.github.io/Lectori/ (el repositorio se llama `Lectori`, con mayúscula).
Datos en el dispositivo (`localStorage`, clave `ar2`) y, con sesión de Google, en Firebase
(proyecto `mis-apps-educativas`, colección `lectori`; reglas en el repositorio de Tabula).
Reglas de trabajo: `CLAUDE.md`. Plan de mejoras por fases: `PLAN-DISENO.md`.

## Últimos cambios

- **2026-11-13 · Fase 0: red de seguridad (pruebas). `index.html` y `sw.js` NO han cambiado** (misma versión 3.34,
  caché `lectori-v6`; se comprobó con huella del archivo antes y después).
  - `tests/cargar.mjs`: carga el `<script>` de `index.html` en Node (`node:vm`) con un navegador falso.
  - `tests/contenido.test.mjs` (12 pruebas): 45 niveles; palabras, sílabas, textos, preguntas `CQ` y pseudopalabras usan
    solo letras ya enseñadas (`rr` y `ü` cuentan como enseñadas desde sus niveles); opciones y estructura válidas;
    ninguna pseudopalabra es palabra real (también la que genera `pseudo()` al azar). El contenido actual cumple todo.
  - `tests/datos.test.mjs` (35 pruebas): `migLv`/`migOrd` (perfil antiguo → nuevo, sin marcar letras no aprendidas),
    arranque con datos antiguos o rotos, `cleanP` (defaults, nombres, rangos, copia vieja, campos raros, idempotente),
    `domS`, `streak`, `cwpm`, `evStats`/`evRec`, y contratos: Calculi lee `ar2` (`ps[].n/av/id`), no se escriben claves
    ajenas, caché `lectori-*`, manifiesto.
  - `tests/humo.py` (Playwright): perfil Docente → PIN → alumno → ejercicio → zona del tutor y sus pantallas, a 390×844 y
    768×1024, claro y oscuro: 26 pantallas por pasada, sin errores de JavaScript ni de consola ni desbordes. Tarda ~90 s.
  - Comprobado que las pruebas detectan fallos (copias de `index.html` estropeadas a propósito: palabra con letra no
    enseñada, migración errónea, racha, velocidad, avatar, error de JavaScript en una pantalla: todas fallaron como debían).
  - `CLAUDE.md`: «lee `ESTADO.md` al empezar y actualízalo al terminar» y cómo lanzar las pruebas.

- **2026-11-13 · Decisiones**: D2 = c (sonidos iguales elegibles en Ajustes), D4 = a (notas del tutor fuera de la
  nube), D3 = a (fase 3 «Lee y toca»; primero se eligió b y se cambió a a).

- **2026-11-13 · Análisis y plan (sin cambios de código)**
  - Análisis completo (sistema, pedagogía, interfaz) con capturas reales a 390 y 768 px, claro y oscuro, y clase de
    demostración de 20 alumnos. Resultado en `PLAN-DISENO.md`: diagnóstico, principios, 7 decisiones (D1–D7) y 12 fases
    (0–11), una por chat, con modelo y esfuerzo recomendados.
  - No se ha tocado `index.html` ni `sw.js` (sigue `lectori-v6`, versión 3.34).

## Pendiente

- **Siguiente: fase 1 de `PLAN-DISENO.md`** (opciones justas y audio sin esperas; *Sonnet, esfuerzo medio*). D2 ya decidida.
  Línea base de la fase 1: `humo.py` cuenta **36 peticiones de audio que fallan** en un recorrido corto (objetivo: 0).
- Decisiones pendientes: D5 (fase 4), D6 (fase 7), D1 (fase 10), D7 (fase 11). Ya tomadas: D2 = c, D4 = a, D3 = a.
- Fase 0 hecha. Fases 1–11 sin empezar.

## Problemas conocidos

- **«¿Qué letra suena?» ofrece como opciones letras que suenan igual** (b/v, c/q/k, ll/y, s/z; sílabas va/ba, ge/je):
  el niño no puede acertar de oído y cuenta como fallo. Fase 1.
- `cleanP` lanza un error si dentro de `nt`, `ev` o `es` hay una entrada vacía (`null`): al restaurar una copia con eso se
  rechaza la copia entera («no es una copia válida») y en la nube se salta ese alumno. Solo ocurre con datos dañados.
  Hay una prueba marcada `TODO` en `tests/datos.test.mjs`; arreglarlo en la fase 2 y quitar el `todo`.
- El guardado no avisa si el almacenamiento del navegador se llena (compartido con Tabula, Charta, Barri, Calculi y
  Fori). La primera sincronización usa un `confirm()` en el que un toque equivocado sustituye un lado. Restaurar una
  copia reemplaza todos los perfiles. Fase 2.
- «Lee palabras» depende de que un adulto valide; en clase lo pulsa el propio niño. Fase 3 (D3 = a).
- Audio: 15 de cada 20 peticiones al leer una palabra fallan antes de sonar (se prueban extensiones que no existen).
  Fase 1.
- En oscuro, el informe y la evaluación tienen texto ilegible; pistas con poco contraste. Fase 9.

## No romper (otras apps dependen de esto)

- **Calculi lee `localStorage['ar2']`** (`ps[].n`, `ps[].av`, `ps[].id`) para importar alumnos.
- Tabula y Fori enlazan a `https://ilinper301-hue.github.io/Lectori/`.
- Mismo dominio que las demás apps: claves nuevas con prefijo `lectori.`, cachés solo `lectori-*`, nunca escribir claves
  de otra app. Firebase: colección `lectori` (las reglas se publican desde `tabula/firestore.rules`).

## Cómo probar

- `node --test tests/*.test.mjs` (menos de 1 s): contenido y datos. 46 pasan y 1 es `TODO` (fallo conocido de `cleanP`).
- `python3 tests/humo.py` (~90 s; `--rapido` para solo 390×844 claro): recorrido completo en el navegador sin ventana.
- Detalle en `CLAUDE.md` («Cómo probar»). A mano: `python3 -m http.server` en la carpeta y abrir en el navegador.
- Al publicar cambios de la app: subir `const C='lectori-vN'` en `sw.js` y `VER` en `index.html`.
