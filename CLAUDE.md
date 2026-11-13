# Lectori

App web (PWA) para que niños de 5 a 7 años aprendan a leer con el método fonológico: letras, sílabas, palabras, frases y lecturas, con repaso espaciado y una zona del tutor protegida con PIN.

Se publica en GitHub Pages: https://ilinper301-hue.github.io/Lectori/ (lo que se sube a `main` es lo que ven los usuarios).

## Sobre mí y cómo quiero trabajar

- No sé programar. Explícame los cambios en lenguaje sencillo, sin jerga, y dime qué tengo que probar yo.
- Responde siempre en español.
- Antes de un cambio grande, cuéntame el plan en pocas líneas y espera a que diga que sí.
- No cambies nada que yo no haya pedido (diseño, textos, niveles, orden de las letras). Si ves algo mejorable, propónmelo aparte.
- Haz cambios pequeños y guarda cada uno con un commit con un mensaje claro en español, para poder volver atrás.

## Al empezar y al terminar un chat

- **Al empezar**: lee `ESTADO.md` (qué se ha hecho, qué falta, problemas conocidos) y `PLAN-DISENO.md` (las 12 fases, una por chat).
- **Al terminar**: actualiza `ESTADO.md` (sección «Últimos cambios» arriba del todo, y «Pendiente» / «Problemas conocidos» si cambian) y marca la fase en `PLAN-DISENO.md`.

## Estructura del proyecto

- `index.html`: toda la app (HTML, CSS y JavaScript en un solo archivo, unos 430 KB, con líneas muy largas). Edítalo con cuidado y nunca lo reescribas entero.
- `sw.js`: service worker para que funcione sin conexión. Guarda en caché la app y los audios.
- `manifest.json`, `icon-192.png`, `icon-512.png`: datos para instalarla como app.
- `grabadora.html`: herramienta aparte para grabar los audios con el micrófono.
- `tests/`: pruebas automáticas (ver «Cómo probar»). No forman parte de la app: GitHub Pages las publica pero nadie las carga.
- `lista-audios.csv`: lista de todos los audios (tipo, archivo, texto): instrucciones, letras, letras largas, sílabas, palabras, textos y preguntas.
- `audio/letras/`, `audio/silabas/`: audios grabados (todos `.wav`). La app solo pide los que figuran en la lista `AUDL` de `index.html` (junto a `AUDX`, la extensión); lo demás lo dice la voz del navegador (speechSynthesis, es-ES) sin pedir nada a la red. **Al añadir o quitar un audio, actualiza `AUDL`** (`tests/audio.test.mjs` lo comprueba) y sube `lectori-vN` en `sw.js`.
- `fonts/`: licencia de la fuente Playwrite ES (letra ligada). Las fuentes se cargan desde Google Fonts (Fredoka/Inter para letra de imprenta, Playwrite ES para ligada).

## Cómo funciona por dentro

- Orden de las letras (`ORDER`): a e i o u l m s n h d f p t r b v ñ y c z q g j ll ch k w x, seguido de niveles extra (`EXTRA`). Los niveles (`LV`) se construyen a partir de ahí.
- Perfiles: Familias y Docente (este último con aula, velocidad lectora, evaluación, notas e informes). Hay un Modo Docente y una zona del tutor con PIN.
- Datos guardados en el navegador (localStorage): `ar2` (todos los perfiles y su progreso), `arth` (tema claro/oscuro), `arv` (voz elegida), `arbk` (fecha de la última copia), `ari`, `arm`.
- Hay funciones de migración (`migOrd`, `migLv`) para no romper el progreso guardado cuando cambia el orden de niveles. Si cambias la estructura de los datos, añade migración: nunca se puede perder el progreso de un niño.
- Copia de seguridad: exportar/importar un JSON desde la zona del tutor. Al restaurar se elige «Añadir a lo que hay» (junta con `mergeP`, no borra) o «Sustituir todo».
- **Copias automáticas** (desde la fase 2): antes de sustituir, juntar, reiniciar o borrar datos se llama a `bkAuto(motivo)`, que guarda una foto en IndexedDB (base `lectori`, almacén `bk`, las 5 últimas). Se recuperan en Ajustes › Copias automáticas. Cualquier cambio nuevo que sustituya o borre datos debe llamar antes a `bkAuto`.
- Si el guardado falla (almacenamiento lleno), `saveRaw()` devuelve `false` y deja `SVE`: aviso en la zona del tutor y punto rojo en Inicio.
- **Lectura «Sola»** (fase 3, `p.rm='s'`): el subnivel Palabras usa «Lee y toca» (`itemMatch`: palabra → 3 dibujos; `itemMatchW`: dibujo → 3 palabras) y leer en voz alta queda sin puntuar (`rdFree`). Se registra en `p.lm`. Reglas de opciones justas: `EMG` (dibujos que se confunden), `LTX` (palabras fuera), `LTB` (palabras malsonantes que nunca se generan). Para que un nivel use Lee y toca necesita 2 palabras con dibujo.
- **Datos del alumno (fase 5)**: `p.cx` confusiones (`'b>d'`; prefijos `w:` palabras y `d:` al formar palabras; tope `CXN`), `p.hx` historia de niveles por grafema (`LV[i].g`: `b`, `d`, `t` intentos por subnivel, `r` listón rebajado, `k` saltado), `p.cn` comprensión literal/inferencial (sale de `cq` en perfiles antiguos). Pruebas de velocidad de 1 minuto con `m:1` en `vl`. Referencia de velocidad con rango en `VREF`. Todo opcional: `cleanP` lo valida y `mergeP` lo junta. Si añades otro campo al perfil, ponlo también en `cleanP`/`cleanX` y en `mergeP`, o se perderá al restaurar o sincronizar.
- Sincronización opcional con Firebase (inicio de sesión con Google + Firestore, colección `lectori`, subcolección `alu` por alumno). El docente pega su propia configuración de Firebase en la app. Si los dos lados cambiaron, se juntan con `mergeP` (días, repaso, contadores y listas se combinan; nivel y ajustes, del más reciente). La primera vez con datos en los dos lados se pregunta en la tarjeta de la cuenta (`SYNC.ask`). **Las notas del tutor (`nt`) nunca suben** (D4; `upP`).

## Reglas importantes

- Si cambias o añades audios, o cambios que deban llegar a móviles ya instalados, sube la versión de caché en `sw.js` (`const C='lectori-vN'`).
- La app la usan niños pequeños: botones grandes, textos cortos, nada de enlaces externos ni anuncios fuera de la zona del tutor.
- Funciona en móvil y tablet, en tema claro y oscuro. Comprueba ambos.
- Son datos de menores: no envíes datos a ningún servicio nuevo sin preguntarme.

## Cómo probar

- **Pruebas automáticas** (las ejecuta Claude; hace falta Node 20 o superior, sin instalar nada):
  - `node --test tests/*.test.mjs`: homófonas y audio (fase 1: nunca compiten letras/sílabas que suenan igual; la app solo pide audios que existen), contenido (cada palabra, sílaba y texto usa solo letras ya enseñadas; preguntas y pseudopalabras válidas) y datos (migración de perfiles antiguos, `cleanP`, `domS`, racha, velocidad, evaluación, contratos con Calculi y con el service worker). Tarda menos de 1 segundo. Un test marcado `TODO` es un fallo conocido que aún no se ha arreglado: no rompe la ejecución.
  - `python3 tests/humo.py` (Playwright + Chromium): recorre la app como una persona (perfil Docente, PIN, alumno, un ejercicio, zona del tutor) a 390×844 y 768×1024, en claro y oscuro, y falla si hay errores de JavaScript o de consola o si alguna pantalla desborda en horizontal. Con `--rapido`, solo 390×844 claro. Con `HUMO_CAPTURAS=/tmp/c`, guarda una captura por pantalla.
  - `tests/alumno.test.mjs` (fase 5): confusiones, historia de niveles (con un recorrido de nivel simulado), comprensión, velocidad de 1 minuto y referencia, `cleanP`/`mergeP`, perfil 3.34, tamaño, informe y CSV.
  - `tests/leetoca.test.mjs` (fase 3): opciones justas en Lee y toca (dibujos y palabras falsas), niveles con dibujos suficientes, `rm`/`lm` en `cleanP` y `mergeP`.
  - `tests/sync.test.mjs` (nube falsa en memoria: dos dispositivos, primera vez, juntar, borrados, reinicio, notas fuera de la nube, sin conexión) y `tests/copia.test.mjs` (exportar → restaurar, «Añadir»/«Sustituir todo», `mergeP`, almacenamiento lleno, espacio usado). Van dentro de `node --test tests/*.test.mjs`.
  - `tests/cargar.mjs` carga el `<script>` de `index.html` dentro de Node (`node:vm`) con un navegador falso; es lo que usan las pruebas. Con `LECTORI_INDEX=ruta/otro.html` se prueba otra copia (útil para comprobar que las pruebas detectan fallos).
- **Antes de dar por terminada una fase**: las dos pruebas anteriores en verde, y comprobar a mano la app en claro y oscuro a 390×844 y 768×1024.
- **A mano**: sirve la carpeta en local (por ejemplo `python3 -m http.server`) y abre la app en el navegador; no funciona bien abriendo el archivo directamente. La app debe cargar sin errores en la consola, se puede crear un perfil, hacer un ejercicio y entrar en la zona del tutor.

## Ecosistema
Antes de tocar algo que una app lea o deje para otra (alumnado, resultados, enlaces entre apps), lee `ECOSISTEMA.md`: es el contrato común de las seis apps.
