# Lectori

App web (PWA) para que niños de 5 a 7 años aprendan a leer con el método fonológico: letras, sílabas, palabras, frases y lecturas, con repaso espaciado y una zona del tutor protegida con PIN.

Se publica en GitHub Pages: https://ilinper301-hue.github.io/Lectori/ (lo que se sube a `main` es lo que ven los usuarios).

## Sobre mí y cómo quiero trabajar

- No sé programar. Explícame los cambios en lenguaje sencillo, sin jerga, y dime qué tengo que probar yo.
- Responde siempre en español.
- Antes de un cambio grande, cuéntame el plan en pocas líneas y espera a que diga que sí.
- No cambies nada que yo no haya pedido (diseño, textos, niveles, orden de las letras). Si ves algo mejorable, propónmelo aparte.
- Haz cambios pequeños y guarda cada uno con un commit con un mensaje claro en español, para poder volver atrás.

## Estructura del proyecto

- `index.html`: toda la app (HTML, CSS y JavaScript en un solo archivo, unos 430 KB, con líneas muy largas). Edítalo con cuidado y nunca lo reescribas entero.
- `sw.js`: service worker para que funcione sin conexión. Guarda en caché la app y los audios.
- `manifest.json`, `icon-192.png`, `icon-512.png`: datos para instalarla como app.
- `grabadora.html`: herramienta aparte para grabar los audios con el micrófono.
- `lista-audios.csv`: lista de todos los audios (tipo, archivo, texto): instrucciones, letras, letras largas, sílabas, palabras, textos y preguntas.
- `audio/letras/`, `audio/silabas/`: audios grabados. La app prueba primero `.mp3` y luego `.wav`; si un audio no existe, usa la voz del navegador (speechSynthesis, es-ES).
- `fonts/`: licencia de la fuente Playwrite ES (letra ligada). Las fuentes se cargan desde Google Fonts (Fredoka/Inter para letra de imprenta, Playwrite ES para ligada).

## Cómo funciona por dentro

- Orden de las letras (`ORDER`): a e i o u l m s n h d f p t r b v ñ y c z q g j ll ch k w x, seguido de niveles extra (`EXTRA`). Los niveles (`LV`) se construyen a partir de ahí.
- Perfiles: Familias y Docente (este último con aula, velocidad lectora, evaluación, notas e informes). Hay un Modo Docente y una zona del tutor con PIN.
- Datos guardados en el navegador (localStorage): `ar2` (todos los perfiles y su progreso), `arth` (tema claro/oscuro), `arv` (voz elegida), `arbk` (fecha de la última copia), `ari`, `arm`.
- Hay funciones de migración (`migOrd`, `migLv`) para no romper el progreso guardado cuando cambia el orden de niveles. Si cambias la estructura de los datos, añade migración: nunca se puede perder el progreso de un niño.
- Copia de seguridad: exportar/importar un JSON desde la zona del tutor.
- Sincronización opcional con Firebase (inicio de sesión con Google + Firestore, colección `lectori`, subcolección `alu` por alumno). El docente pega su propia configuración de Firebase en la app.

## Reglas importantes

- Si cambias o añades audios, o cambios que deban llegar a móviles ya instalados, sube la versión de caché en `sw.js` (`const C='lectori-vN'`).
- La app la usan niños pequeños: botones grandes, textos cortos, nada de enlaces externos ni anuncios fuera de la zona del tutor.
- Funciona en móvil y tablet, en tema claro y oscuro. Comprueba ambos.
- Son datos de menores: no envíes datos a ningún servicio nuevo sin preguntarme.

## Cómo probar

- Sirve la carpeta en local (por ejemplo `python3 -m http.server`) y abre la app en el navegador; no funciona bien abriendo el archivo directamente.
- Antes de dar un cambio por terminado: la app carga sin errores en la consola, se puede crear un perfil, hacer un ejercicio y entrar en la zona del tutor.
