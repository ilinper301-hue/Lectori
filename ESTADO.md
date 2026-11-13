# Estado de Lectori

Documento vivo. **Cada chat que trabaje en Lectori lo lee al empezar y lo actualiza al terminar**
(sección «Últimos cambios» arriba del todo, y «Pendiente» / «Problemas conocidos» si cambian).

_Última actualización: 2026-11-13 (fase 2)_

## Resumen

App (PWA) para aprender a leer con método fonético-sintético: 45 niveles (29 letras + 16 de inversas, trabadas,
diptongos y diéresis), con sílabas, palabras, frases y lecturas decodificables, repaso espaciado y zona del tutor con PIN.
Un solo `index.html` (versión 3.36), sin compilación. Publicada con GitHub Pages desde `main`:
https://ilinper301-hue.github.io/Lectori/ (el repositorio se llama `Lectori`, con mayúscula).
Datos en el dispositivo (`localStorage`, clave `ar2`) y, con sesión de Google, en Firebase
(proyecto `mis-apps-educativas`, colección `lectori`; reglas en el repositorio de Tabula).
Reglas de trabajo: `CLAUDE.md`. Plan de mejoras por fases: `PLAN-DISENO.md`.

## Últimos cambios

- **2026-11-13 · Fase 2: que no se pierda nada. Versión 3.36, caché `lectori-v8`.** D4 = a aplicada.
  - **Guardado**: `saveRaw()` detecta si el almacenamiento está lleno (`SVE`): aviso rojo en la zona del tutor con «Guardar
    copia» y punto rojo en «Zona del tutor» (Inicio). Ajustes › Sistema › **Espacio usado** (Lectori y total de la dirección, de ~5 MB).
  - **Copias automáticas** (`bkAuto`, IndexedDB `lectori`/`bk`, las 5 últimas): antes de restaurar, de «Usar lo de la cuenta»,
    de «Subir este dispositivo» (copia de lo que había en la cuenta), de reiniciar progreso y de borrar alumno.
    Ajustes › Copias de seguridad › **Copias automáticas** para recuperarlas.
  - **Restaurar copia**: pantalla propia con «Añadir a lo que hay» (recomendado: junta, no borra) o «Sustituir todo» (doble
    toque; dice a quién quitará). Antes solo había «reemplazar» y marcaba borrados en la nube sin avisar.
  - **Nube**: fuera el `confirm()`. La primera vez con datos en los dos lados, la tarjeta de la cuenta pregunta: «Juntar los
    dos» / «Usar lo de la cuenta» / «Subir lo de este dispositivo»; hasta elegir, no se sincroniza nada.
    Si el mismo alumno cambió en dos dispositivos se **juntan** (`mergeP`): días, cajas de repaso, aciertos/fallos, lecturas,
    velocidad, evaluaciones y notas se combinan; nivel, por dónde va y ajustes los pone la versión más reciente. Si un lado
    se reinició (`rz`, nuevo) después de lo del otro, gana el reinicio. Comprobado que no hay subidas sin fin.
  - **Notas del tutor (D4)**: ya no suben; las que ya estaban en la nube se vuelven a subir sin ellas en la siguiente
    sincronización (en el dispositivo se conservan). La tarjeta de la cuenta lo dice.
  - **Tamaño**: medido, una clase de 25 con un curso completo y uso intenso ocupaba hasta ~2,8 MB (de ~5 MB compartidos con
    las otras apps); lo que más pesaba era el detalle de 8 evaluaciones por alumno. Ahora se guarda el detalle de las **4
    últimas**; las anteriores siguen en la lista como «(solo resumen)». Al abrir la app, si hay más de 4, primero se hace
    copia automática y solo después se recortan (si no se puede hacer la copia, no se recorta).
  - Arreglado: `cleanP` ya no falla con entradas vacías (`null`) en notas, evaluaciones o sesiones (antes rechazaba la copia entera).
  - Pruebas nuevas: `tests/sync.test.mjs` (9, Firestore falso en memoria) y `tests/copia.test.mjs` (9). `node --test`: 81 pasan,
    0 `TODO`; `humo.py` en verde (4 pasadas). Se comprobó que las pruebas fallan si se estropea la fusión, el filtro de
    notas, la fecha tras juntar o la pregunta de la primera vez. Revisado a mano en Chromium: copias en IndexedDB, tope de 5,
    recorte con copia previa, y las pantallas nuevas a 390 y 768, claro y oscuro.

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

- **Siguiente: fase 3 de `PLAN-DISENO.md`** («Lee y toca», *Opus, esfuerzo alto*). D3 ya decidida (a). Proponer dibujos para M y W.
- Decisiones pendientes: D5 (fase 4), D6 (fase 7), D1 (fase 10), D7 (fase 11). Ya tomadas: D2 = c, D4 = a, D3 = a.
- Fases 0, 1 y 2 hechas. Fases 3–11 sin empezar.
- De la fase 2 quedó sin hacer: servir Inter y Playwrite ES desde `fonts/` (aquí no se pueden descargar; siguen viniendo de Google Fonts).
- Comprobar en dispositivos reales la sincronización con Firebase (las pruebas usan una nube simulada).

## Problemas conocidos

- Juntar dos versiones de un alumno: si el tutor bajó el nivel a mano en un dispositivo y en otro el niño siguió practicando
  después sin conexión, queda el nivel del más reciente. Las notas borradas pueden volver al «Añadir» una copia antigua.
- Las copias automáticas son solo de este dispositivo (5 últimas); no sustituyen a guardar copias fuera.
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

- `node --test tests/*.test.mjs` (unos segundos): contenido, datos, homófonas, audio, sincronización y copias. 81 pasan.
- `python3 tests/humo.py` (~90 s; `--rapido` para solo 390×844 claro): recorrido completo en el navegador sin ventana.
- Detalle en `CLAUDE.md` («Cómo probar»). A mano: `python3 -m http.server` en la carpeta y abrir en el navegador.
- Al publicar cambios de la app: subir `const C='lectori-vN'` en `sw.js` y `VER` en `index.html`.
