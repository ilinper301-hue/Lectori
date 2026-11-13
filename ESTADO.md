# Estado de Lectori

Documento vivo. **Cada chat que trabaje en Lectori lo lee al empezar y lo actualiza al terminar**
(sección «Últimos cambios» arriba del todo, y «Pendiente» / «Problemas conocidos» si cambian).

_Última actualización: 2026-11-13_

## Resumen

App (PWA) para aprender a leer con método fonético-sintético: 45 niveles (29 letras + 16 de inversas, trabadas,
diptongos y diéresis), con sílabas, palabras, frases y lecturas decodificables, repaso espaciado y zona del tutor con PIN.
Un solo `index.html` (versión 3.34), sin compilación. Publicada con GitHub Pages desde `main`:
https://ilinper301-hue.github.io/Lectori/ (el repositorio se llama `Lectori`, con mayúscula).
Datos en el dispositivo (`localStorage`, clave `ar2`) y, con sesión de Google, en Firebase
(proyecto `mis-apps-educativas`, colección `lectori`; reglas en el repositorio de Tabula).
Reglas de trabajo: `CLAUDE.md`. Plan de mejoras por fases: `PLAN-DISENO.md`.

## Últimos cambios

- **2026-11-13 · Decisiones**: D2 = c (sonidos iguales elegibles en Ajustes), D4 = a (notas del tutor fuera de la
  nube), D3 = a (fase 3 «Lee y toca»; primero se eligió b y se cambió a a).

- **2026-11-13 · Análisis y plan (sin cambios de código)**
  - Análisis completo (sistema, pedagogía, interfaz) con capturas reales a 390 y 768 px, claro y oscuro, y clase de
    demostración de 20 alumnos. Resultado en `PLAN-DISENO.md`: diagnóstico, principios, 7 decisiones (D1–D7) y 12 fases
    (0–11), una por chat, con modelo y esfuerzo recomendados.
  - No se ha tocado `index.html` ni `sw.js` (sigue `lectori-v6`, versión 3.34).

## Pendiente

- **Siguiente: fase 0 de `PLAN-DISENO.md`** (pruebas automáticas; *Sonnet, esfuerzo alto*). Después, fase 1.
- Decisiones pendientes: D5 (fase 4), D6 (fase 7), D1 (fase 10), D7 (fase 11). Ya tomadas: D2 = c, D4 = a, D3 = a.
- Fases 1–11 sin empezar.

## Problemas conocidos

- **«¿Qué letra suena?» ofrece como opciones letras que suenan igual** (b/v, c/q/k, ll/y, s/z; sílabas va/ba, ge/je):
  el niño no puede acertar de oído y cuenta como fallo. Fase 1.
- **Sin pruebas automáticas.** Fase 0.
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

- Hoy: `python3 -m http.server` en la carpeta y abrir en el navegador (ver `CLAUDE.md`). Aún no hay
  `node --test tests/*.test.mjs`; llegará con la fase 0.
- Al publicar cambios de la app: subir `const C='lectori-vN'` en `sw.js` y `VER` en `index.html`.
