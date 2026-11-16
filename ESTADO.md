# Estado de Lectori

Documento vivo. **Cada chat que trabaje en Lectori lo lee al empezar y lo actualiza al terminar**
(sección «Últimos cambios» arriba del todo, y «Pendiente» / «Problemas conocidos» si cambian).

_Última actualización: 2026-11-16 (revisión de datos y nube, y diseño de la fase 7; la app no cambia)_

## Resumen

App (PWA) para aprender a leer con método fonético-sintético: 45 niveles (29 letras + 16 de inversas, trabadas,
diptongos y diéresis), con sílabas, palabras, frases y lecturas decodificables, repaso espaciado y zona del tutor con PIN.
Un solo `index.html` (versión 3.40), sin compilación. Publicada con GitHub Pages desde `main`:
https://ilinper301-hue.github.io/Lectori/ (el repositorio se llama `Lectori`, con mayúscula).
Datos en el dispositivo (`localStorage`, clave `ar2`) y, con sesión de Google, en Firebase
(proyecto `mis-apps-educativas`, colección `lectori`; reglas en el repositorio de Tabula).
Reglas de trabajo: `CLAUDE.md`. Plan de mejoras por fases: `PLAN-DISENO.md`.

## Últimos cambios

- **2026-11-16 · Revisión independiente de datos y nube (fases 2 y 5). Sin cambios en la app (3.40, `lectori-v12`).**
  - **`docs/revision-datos.md`**: ocho hallazgos (H1–H8), todos reproducidos. Los dos graves: una tableta que no se
    sincronizó hace retroceder el nivel y las estrellas de un niño en todas las tabletas (H1), y la primera vez con la
    cuenta desaparecen sin copia alumnos que solo tienen pruebas de velocidad, evaluaciones o notas (H3).
  - **`tests/revision.test.mjs`** (nuevo): 9 pruebas que afirman lo que debería pasar y hoy fallan; van marcadas `todo`
    y no rompen la ejecución. `node --test`: 120 pasan, 9 `todo`.
  - **Fase 5b** añadida a `PLAN-DISENO.md` para arreglarlo (*Opus, esfuerzo alto*), antes de la 6.

- **2026-11-16 · Diseño de la fase 7 y decisión D1 (sin cambios en la app: sigue la 3.40, caché `lectori-v12`).**
  - **D1 = a**: Lectori llega hasta 2.º de Primaria (aprender a leer). Ampliar a fluidez y comprensión de 3.º–6.º no es su objetivo.
  - **Fase 7 rehecha** en `PLAN-DISENO.md` para seguir `ECOSISTEMA.md` (el plan original proponía otro formato y no incluía
    «Traer mi clase de Tabula»). Ahora son tres chats: **7a** (Lectori publica `lectori.tabula`; Sonnet, se puede hacer ya),
    **7b** (Tabula lo importa; en su chat, con D6) y **7c** (Lectori trae la clase de Tabula; cuando Tabula publique la lista).
  - **`docs/tabula.md`** (nuevo): especificación del resumen. Un item por nivel superado, `id` = grafema (`LV[i].g`);
    dominio con el criterio que ya usa la app (`cf` y cajas de repaso), sin guardar nada nuevo en el perfil; velocidad,
    comprensión, dictado y «atascado» en `extra`; recorte si pasa de 150 KB; casos límite y lista de pruebas.
  - Comprobado con un prototipo fuera de la app sobre el código real: 20 alumnos en el nivel 13 ocupan 34 KB; 30 alumnos con
    todo superado, 173 KB (91 KB con el recorte). `node --test`: 120 pasan (nada tocado).
  - **D6 reformulada**: `ECOSISTEMA.md` dice «nota = dominio ÷ 10» y el plan recomendaba «sin nota». Solo afecta a la 7b.

- **2026-11-13 · Fase 5: más y mejores datos del alumno. Versión 3.40, caché `lectori-v12`.** Solo se añaden campos nuevos y opcionales:
  los perfiles anteriores siguen igual (sin migración que reescriba nada; probado con un perfil 3.34).
  - **Confusiones** (`p.cx`, p. ej. `'b>d'`: oyó «b» y tocó «d»): en «¿Qué letra/sílaba suena?», «¿Con qué sílaba empieza?», Lee y toca
    (prefijo `w:`, palabras) y construir/dictado/ordenar sílabas (prefijo `d:`, «al formar palabras»). Cada opción cuenta una vez por ejercicio.
    Tope: 60 claves (sale la de menos veces) y 999 por clave. Progreso › Para reforzar: «Confunde: b con d (3)» (las dos direcciones juntas,
    solo con 2 veces o más), «Palabras que confunde», «Al formar palabras: v en vez de b».
  - **Historia de niveles** (`p.hx`, clave = grafema del nivel `LV[i].g`, que no cambia si cambia el orden): día en que empezó (`b`) y superó (`d`)
    cada nivel, intentos por subnivel (`t`; 4 o más = estuvo atascado), subniveles superados con el listón rebajado (`r`) y saltados por el tutor (`k`).
    El aviso «Atascado» se quita al superar, pero queda «Superado con ayuda» en Progreso (últimos 30 días), en la vista de aula (14 días),
    en el informe y en la hoja del aula. Pantalla nueva: Progreso › Seguimiento › **Historia de niveles** (`hxScr`). Solo cuenta el recorrido del
    alumno (no practicar niveles pasados ni el Modo Docente). Los niveles superados antes de 3.40 no tienen historia.
  - **Velocidad**: **prueba de 1 minuto** (`velRun`): se ponen seguidos los textos de velocidad del nivel (73, 108 y 151 palabras; sin cambiar
    ninguno), empezando cada vez por uno distinto; a los 60 s suena un aviso y el tutor toca la última palabra leída. Si termina antes,
    «Ha terminado» (cuenta por tiempo, como antes). Se guarda `m:1` en esas pruebas. Botones y resultado van encima del texto.
    **Referencia con rango** (`VREF`): 1.º 25–72 (media 49), 2.º 45–101 (media 73), lectura en voz alta; media ± desviación típica mediana de
    la tabla 5 de Ripoll, Tapia y Aguado (2020), comprobada en el artículo. Dice si el alumno está dentro, por debajo o por encima.
    **Ritmo en las lecturas de la app** (`rdPpm`): mediana de palabras por minuto de los textos de 12 palabras o más leídos en 30 días
    (sale de `rd`, que ya guardaba los segundos; orientativo, hacen falta 3 textos).
  - **Comprensión** (`p.cn` = {l literal, i inferencial}): las preguntas de la app son literales; «Ordenar la frase» no cuenta. Los perfiles
    antiguos la sacan de `cq`. Inferencial: de la última evaluación del tutor (microtextos, `evInf`); `CQINF` está preparado para preguntas
    inferenciales de la app (fase 10). Indicadores nuevos en Progreso.
  - **Informe**: «Qué confunde», «Últimos niveles superados», comprensión literal/inferencial y ritmo en la app. **Hoja del aula** (CSV):
    8 columnas nuevas y la referencia del curso como rango.
  - `cleanP` conserva y valida lo nuevo (idempotente); `mergeP` junta confusiones (máximo), historia (fechas más antiguas, intentos máximos,
    marcas unidas) y comprensión. Sube a la nube con el resto (las notas siguen sin subir). Peor caso medido: menos de 8 KB por alumno.
  - Pruebas nuevas: `tests/alumno.test.mjs` (19, incluido un recorrido de nivel simulado con atasco y listón rebajado) y 5 pantallas nuevas en
    `humo.py`. `node --test`: 120 pasan; `humo.py` en verde (38 pantallas por pasada, 4 pasadas). Se comprobó que las pruebas fallan si se
    estropea la historia, el registro de confusiones, la fusión o la referencia. Prueba de 1 minuto recorrida en Chromium con reloj simulado.

- **2026-11-13 · Fase 4: la tableta en clase (D5 = c). Versión 3.39, caché `lectori-v11`.**
  - **«¿Quién va a leer?»** es ahora una **rejilla de animales con nombre** (4 columnas; 5 si hay más de 20; 25 alumnos caben en
    390×844 sin desplazarse). Ya no tiene el formulario de crear perfiles: abajo hay «Añadir alumno» (pide PIN) y «Modo Docente».
    Sin ningún alumno (primera vez) sigue saliendo el formulario para crear el primero.
  - **Crear alumno** pasa a la zona del tutor: Ajustes › Alumnos › «Añadir alumno» (pantalla `addScr`). Al crearlo desde ahí
    te quedas en el alumno que estabas (aviso «Alumno añadido»); desde la rejilla vacía abre el inicio del nuevo, como antes.
  - **Ajustes › «Este dispositivo» › «Tabletas en clase»** (clave `lectori.tb`; de este dispositivo, no sube a la nube):
    **Libre** (por defecto, como siempre) · **Compartida** (al abrir y al terminar sale la rejilla; no se reanuda el último niño) ·
    **Fijada a un alumno** (`lectori.tbf` = id; al abrir entra directa en su perfil; elegir otro alumno en la rejilla la vuelve a fijar).
    En Compartida y Fijada, **cambiar de perfil pide el PIN**. Despedida: en Libre y Compartida «Terminar» vuelve a la rejilla;
    en Fijada se queda en el inicio del alumno.
  - **Botón de tema** fuera de las pantallas (cabecera); ahora está en Ajustes › Este dispositivo › **Tema** (Claro/Oscuro).
  - **«Lo mismo para toda la clase»** también para **tipo de letra** y **tiempo de uso al día** (además de la lectura en voz alta).
  - Emoji de **mama** cambiado de 👩‍👧 a 👩‍🍼 (aprobado).
  - Sin cambios en los datos de los alumnos (solo claves nuevas `lectori.tb`/`lectori.tbf`): no hace falta migración.
  - Pruebas nuevas: `tests/tableta.test.mjs` (12) y un paso nuevo en `humo.py` (rejilla de 25: sin desplazamiento a 390 px, botones ≥ 56 px,
    sin formulario). `node --test`: 101 pasan; `humo.py` en verde (33 pantallas por pasada, 4 pasadas). Revisadas las capturas de
    la rejilla y de Ajustes a 390 y 768, claro y oscuro.

- **2026-11-13 · Dibujos de la M (aprobados). Versión 3.38, caché `lectori-v10`.** mama 👩‍👧, mula 🫏, malo 😠. La M ya usa
  Lee y toca en modo Sola (4 palabras con dibujo). `PENDIENTES` vacío en `tests/leetoca.test.mjs`. 89 pruebas pasan; humo en verde.

- **2026-11-13 · Fase 3: «Lee y toca» (D3 = a). Versión 3.37, caché `lectori-v9`.**
  - **Ajustes › Lectura › Lectura en voz alta**: nueva opción **«Sola»** (además de «Validada por el tutor» y «Con micrófono»;
    por defecto sigue «Validada»). Fila **«Lo mismo para toda la clase»** (doble toque) si hay más de un alumno. Se guarda en `p.rm='s'`.
  - **Modo Sola**: el subnivel Palabras son 4 «Lee y toca» (3 de palabra → 3 dibujos y 1 de dibujo → 3 palabras; con 2–3 palabras
    con dibujo se repiten en la otra dirección) + el dictado. Se supera igual que antes (3 de 4 a la primera). Sin palabra inventada.
    «Lee palabras», «Lee sílabas» y «Palabras frecuentes» quedan como práctica de decir en voz alta **sin puntuar**.
    Repaso y calentamiento de palabras: Lee y toca (o construir si la palabra no tiene dibujo).
  - Si el nivel tiene menos de 2 palabras con dibujo (ahora solo la **M**), ese subnivel sigue con la lectura validada.
  - **Opciones justas**: dibujos falsos de palabras conocidas que empiezan igual o se parecen; nunca dos dibujos iguales ni del mismo grupo
    (`EMG`: personas, caras, coches, flores, árboles…). Palabras falsas: de una letra de diferencia (inventadas pronunciables o reales),
    nunca que suenen igual (b/v…), ni gato/gata, ni de una lista de palabras malsonantes (`LTB`). Fuera de Lee y toca: lola, lalo,
    humano, fruta, ave, insecto, tío (`LTX`).
  - **Datos**: `p.lm` {a, o} (intentos y aciertos a la primera), aparte de la lectura validada; actualiza el repaso de la palabra (`ws`).
    `cleanP` y `mergeP` lo conservan; `pg.mw`/`pg.m` guardan por dónde va. Sin migración (campos nuevos opcionales).
  - «Lee y toca» también en **Practicar** y en el **Modo Docente**. Indicador «Lee y toca · aciertos a la primera» en Progreso.
  - `lista-audios.csv`: instrucciones `lt`, `lw`, `pm`.
  - Pruebas: `tests/leetoca.test.mjs` (8) y 5 pantallas nuevas en `humo.py`. `node --test`: 89 pasan; `humo.py` en verde (31 pantallas por pasada).
    Recorrido completo del subnivel en Chromium a 390 y 768, claro y oscuro: supera, guarda `lm` y pasa a Frase.

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

- **Siguiente: fase 5b de `PLAN-DISENO.md`** (arreglos de `docs/revision-datos.md`, *Opus, esfuerzo alto*). Mientras no se haga,
  con varias tabletas conviene abrir cada una con wifi y esperar a que sincronice antes de dársela a un niño.
- Después: fase 6 («La clase primero», *Sonnet, esfuerzo alto*). Puede usar `hxHelp`, `cxTxt`, `evInf`, `rdPpm` y `p.al`.
  También se puede hacer ya la **7a** (*Sonnet, esfuerzo medio*): está especificada en `docs/tabula.md` y no depende de la 6 ni de Tabula.
- Decisiones pendientes: D6 (fase 7b), D7 (fase 11). Ya tomadas: D2 = c, D4 = a, D3 = a, D5 = c, D1 = a.
- Fases 0–5 hechas. Fase 5b (nueva) y 7 diseñadas, sin programar. Fases 6 y 8–11 sin empezar.
- 7b va en el chat de Tabula; 7c espera a que Tabula publique `tabula:eco:lista` (fase 2 de `ECOSISTEMA.md`).
- De la fase 2 quedó sin hacer: servir Inter y Playwrite ES desde `fonts/` (aquí no se pueden descargar; siguen viniendo de Google Fonts).
- Comprobar en dispositivos reales la sincronización con Firebase (las pruebas usan una nube simulada).

## Problemas conocidos

- **Revisión del 2026-11-16 (`docs/revision-datos.md`), sin arreglar hasta la fase 5b**: una tableta atrasada puede bajar
  el nivel y las estrellas (H1); primera vez con la cuenta y alumnos sin niveles (H3); notas y reinicio remoto (H4);
  borrado remoto sin copia (H5); «Sustituir todo» con cuenta (H7); salto de nivel (H2); datos ilegibles (H6); bloqueo
  por tiempo (H8).
- Datos de la fase 5 con una versión anterior de la app en otro dispositivo: esa versión no conoce `cx`/`hx`/`cn` y los quita al guardar;
  al juntar con la nube se recuperan (`mergeP` une los dos lados), salvo que se use «Sustituir todo». Se arregla solo al actualizarse.
- El ritmo en las lecturas de la app es orientativo: cuenta desde que sale el texto hasta «Ya lo leí» (incluye mirar y pedir ayuda).
- Juntar dos versiones de un alumno: si el tutor bajó el nivel a mano en un dispositivo y en otro el niño siguió practicando
  después sin conexión, queda el nivel del más reciente. Las notas borradas pueden volver al «Añadir» una copia antigua.
- Las copias automáticas son solo de este dispositivo (5 últimas); no sustituyen a guardar copias fuera.
- Modo Sola: los emojis se ven distintos según el dispositivo (👩‍🍼 necesita Android 11 o superior; en uno más antiguo puede salir como dos dibujos).
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

- `node --test tests/*.test.mjs` (~25 s): contenido, datos, homófonas, audio, sincronización, copias, Lee y toca, tableta y datos del alumno. 120 pasan;
  9 `todo` (`revision.test.mjs`: fallos conocidos de la revisión, hasta la fase 5b).
- `python3 tests/humo.py` (~90 s; `--rapido` para solo 390×844 claro): recorrido completo en el navegador sin ventana.
- Detalle en `CLAUDE.md` («Cómo probar»). A mano: `python3 -m http.server` en la carpeta y abrir en el navegador.
- Al publicar cambios de la app: subir `const C='lectori-vN'` en `sw.js` y `VER` en `index.html`.
