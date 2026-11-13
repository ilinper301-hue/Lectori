# Estado de Lectori

Documento vivo. **Cada chat que trabaje en Lectori lo lee al empezar y lo actualiza al terminar**
(sección «Últimos cambios» arriba del todo, y «Pendiente» / «Problemas conocidos» si cambian).

_Última actualización: 2026-11-13 (fase 1)_

## Resumen

App (PWA) para aprender a leer con método fonético-sintético: 45 niveles (29 letras + 16 de inversas, trabadas,
diptongos y diéresis), con sílabas, palabras, frases y lecturas decodificables, repaso espaciado y zona del tutor con PIN.
Un solo `index.html` (versión 3.35), sin compilación. Publicada con GitHub Pages desde `main`:
https://ilinper301-hue.github.io/Lectori/ (el repositorio se llama `Lectori`, con mayúscula).
Datos en el dispositivo (`localStorage`, clave `ar2`) y, con sesión de Google, en Firebase
(proyecto `mis-apps-educativas`, colección `lectori`; reglas en el repositorio de Tabula).
Reglas de trabajo: `CLAUDE.md`. Plan de mejoras por fases: `PLAN-DISENO.md`.

## Últimos cambios

- **2026-11-13 · Fase 1: opciones justas y audio sin esperas. Versión 3.35, caché `lectori-v7`.**
  - **Opciones justas**: nuevas `hk()`/`hom()` (qué suena igual: b/v, c/q/k, ll/y, ge/je, que/ke, ha/a, ce/ze…; con seseo/ceceo
    también s/z/ce/ci). `dstr` y `dstrS` ya no ofrecen letras/sílabas que suenan igual que la correcta en «¿Qué letra suena?»,
    «¿Qué sílaba suena?», el repaso y «Le cuesta» (practicar una). También en «¿Con qué sílaba empieza?» (`itemSylFind`), que
    tenía el mismo fallo. En **construir y dictado** (letras y sílabas) se mantienen a propósito (ortografía con la palabra delante).
  - **Ajustes › Sonidos › «Sonidos iguales en mi zona»** (D2 = c): «Con seseo/ceceo» (por defecto) o «Sin seseo ni ceceo».
    Se guarda en `localStorage['lectori.sz']` (de todo el dispositivo; no sube a la nube).
  - **Audio**: lista `AUDL` de audios que existen (29 letras + 5 sílabas `ha–hu`, `.wav`); `say()` solo pide esos y el resto lo dice
    la voz sin petición; `sndL` ya no pide `*-largo.mp3` (no hay ninguno); el arranque precarga solo `AUDL` en vez de 29 `.mp3`
    inexistentes. Medido con `humo.py`: **0 peticiones de audio fallidas** (antes 36).
  - **«Le cuesta»**: `rec()` guarda además `er[k].n` (fallos nuevos, desde 3.35; `cleanP` lo conserva y los perfiles sin `n` siguen
    funcionando). En letras y sílabas con pareja homófona, «Le cuesta» (Progreso, aula, informe) solo las muestra si tienen fallos
    nuevos: los antiguos no se borran, pero ya no las pintan. El número pequeño junto a cada una sigue siendo el total antiguo.
  - Pruebas nuevas: `tests/homofonas.test.mjs` (12) y `tests/audio.test.mjs` (4). `node --test`: 62 pasan + 1 `TODO`; `humo.py` en verde.
    Se comprobó que las pruebas fallan si se rompe `hom()`.

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

- **Siguiente: fase 2 de `PLAN-DISENO.md`** (que no se pierda nada; *Opus, esfuerzo alto*). D4 ya decidida (a).
- Decisiones pendientes: D5 (fase 4), D6 (fase 7), D1 (fase 10), D7 (fase 11). Ya tomadas: D2 = c, D4 = a, D3 = a.
- Fases 0 y 1 hechas. Fases 2–11 sin empezar.

## Problemas conocidos

- `cleanP` lanza un error si dentro de `nt`, `ev` o `es` hay una entrada vacía (`null`): al restaurar una copia con eso se
  rechaza la copia entera («no es una copia válida») y en la nube se salta ese alumno. Solo ocurre con datos dañados.
  Hay una prueba marcada `TODO` en `tests/datos.test.mjs`; arreglarlo en la fase 2 y quitar el `todo`.
- El guardado no avisa si el almacenamiento del navegador se llena (compartido con Tabula, Charta, Barri, Calculi y
  Fori). La primera sincronización usa un `confirm()` en el que un toque equivocado sustituye un lado. Restaurar una
  copia reemplaza todos los perfiles. Fase 2.
- «Lee palabras» depende de que un adulto valide; en clase lo pulsa el propio niño. Fase 3 (D3 = a).
- Audio: solo hay grabadas las 29 letras y 5 sílabas (`ha–hu`); el resto lo dice la voz del dispositivo (`lista-audios.csv`
  prevé 1.893 más).
- «Le cuesta»: junto a cada letra/sílaba el número pequeño es el total de fallos (incluye los antiguos de homófonas).
- En oscuro, el informe y la evaluación tienen texto ilegible; pistas con poco contraste. Fase 9.

## No romper (otras apps dependen de esto)

- **Calculi lee `localStorage['ar2']`** (`ps[].n`, `ps[].av`, `ps[].id`) para importar alumnos.
- Tabula y Fori enlazan a `https://ilinper301-hue.github.io/Lectori/`.
- Mismo dominio que las demás apps: claves nuevas con prefijo `lectori.`, cachés solo `lectori-*`, nunca escribir claves
  de otra app. Firebase: colección `lectori` (las reglas se publican desde `tabula/firestore.rules`).

## Cómo probar

- `node --test tests/*.test.mjs` (menos de 1 s): contenido y datos. 62 pasan y 1 es `TODO` (fallo conocido de `cleanP`).
- `python3 tests/humo.py` (~90 s; `--rapido` para solo 390×844 claro): recorrido completo en el navegador sin ventana.
- Detalle en `CLAUDE.md` («Cómo probar»). A mano: `python3 -m http.server` en la carpeta y abrir en el navegador.
- Al publicar cambios de la app: subir `const C='lectori-vN'` en `sw.js` y `VER` en `index.html`.
