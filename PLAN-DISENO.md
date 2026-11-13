# Plan de Lectori: análisis y fases

Análisis hecho el 2026-11-13 sobre la versión 3.34 (`index.html`, commit `b51365e`): lectura del código, capturas reales
con Chrome sin cabeza a 390 × 844 y 768 × 1024 px (claro y oscuro, clase de demostración de 20 alumnos) y contraste con
el currículo andaluz y la investigación sobre enseñanza de la lectura.
Cada fase es un chat independiente. Al terminar una fase: márcala aquí como hecha y resume en `ESTADO.md`.

En este análisis **no se ha cambiado código**: solo se añaden este plan y `ESTADO.md`.

## 1. Diagnóstico

### A. Sistema y código

**Cómo está hecha.** Un solo `index.html` de 439 KB (HTML + CSS + unas 1.500 líneas de JavaScript, con las imágenes y la
fuente Fredoka incrustadas). Sin compilación ni dependencias. Cada pantalla es una función que pinta `#app` con `draw()`;
no hay rutas ni direcciones por pantalla.

- **Contenido** (constantes al principio del script): `ORDER` (29 letras) + `EXTRA` (16 niveles de inversas, trabadas,
  diptongos, diéresis) = **45 niveles** (`LV`); 309 palabras, 248 sílabas, 315 textos decodificables (`TX0`: 219 frases
  sueltas y 96 lecturas; solo 12 pasan de 40 palabras), preguntas de comprensión (`CQ`), pseudopalabras (`PSW`).
- **Motor** (`run`): cada nivel tiene subniveles obligatorios Sonido → Sílabas → Palabras → Frase, con criterio de
  aciertos a la primera (`PASS` 75 %, sonido 80 %), repaso espaciado de 6 cajas (`INT`) y reanudación (`p.pg`).
- **Datos**: todo en `localStorage`, clave **`ar2`** (un único JSON con todos los perfiles, que se reescribe entero en
  cada respuesta). Otras claves: `arth`, `arv`, `arbk`, `ari`, `arm`, `lectori.*`.
- **Nube (opcional)**: Firebase `mis-apps-educativas`, inicio con Google. `lectori/{uid}` (campo `meta`: rol, huella
  débil del PIN, borrados) y `lectori/{uid}/alu/{id}` (un documento por alumno: todo su perfil como texto,
  **con nombre y notas del tutor**). Reglas (están en el repositorio de Tabula, `firestore.rules`): solo el propio
  docente lee y escribe; no validan forma ni tamaño. Fusión: gana el perfil con fecha `mt` más reciente, entero.
- **Sin conexión**: `sw.js` (`lectori-v6`) guarda la app, los audios y las fuentes; solo borra cachés `lectori-*`.
  Comprobado: recarga y ejercicios funcionan sin red. Firebase no se guarda en caché (correcto).
- **Pruebas**: **no hay ninguna**. Tampoco `tests/` ni comprobación automática antes de publicar.

**Riesgos encontrados (de mayor a menor):**

1. **Opciones imposibles en «¿Qué letra suena?»** (ver B.2): es un fallo de lógica, no de diseño.
2. **Pérdida de datos silenciosa.** `saveRaw()` ignora el error si el almacenamiento se llena. `ar2` crece con el uso
   (hasta 8 evaluaciones de 200 elementos, errores por palabra, días…): una clase de 20–25 puede acercarse a 1–2 MB, y
   el límite del navegador (unos 5 MB) **se comparte con Tabula, Charta, Barri, Calculi y Fori** por estar en el mismo
   dominio. Si se llena, el progreso deja de guardarse sin avisar.
3. **Primera sincronización con `confirm()`**: «Aceptar» sustituye los datos del dispositivo y «Cancelar» sustituye los
   de la cuenta. Un toque equivocado borra un lado. **Restaurar una copia** reemplaza todos los perfiles y marca como
   borrados (también en la nube) los alumnos que no estén en la copia.
4. **Dos dispositivos con el mismo alumno sin conexión**: gana el último entero; lo hecho en el otro se pierde.
5. **Privacidad**: a la nube suben nombre y notas libres del tutor de cada menor; el modo «Con micrófono» envía la voz a
   Google (la app ya lo avisa); Inter y Playwrite ES se piden a Google Fonts. El PIN (4 cifras) va en `meta` y se
   recupera con una multiplicación: suficiente para 6 años, no para mayores.
6. **Audio lento**: `lista-audios.csv` prevé 1.893 audios además de las 29 letras; existen las 29 letras y 5 sílabas
   (todos `.wav`); el resto lo dice la voz del dispositivo.
   La app prueba `.mp3`, `.m4a`, `.ogg` y `.wav` por ese orden y no recuerda lo que falta entre sesiones. Medido: al
   arrancar, 29 peticiones fallidas; al leer una palabra y escucharla, **15 de 20 peticiones fallan** antes de sonar.
   En una wifi de centro eso es retraso en cada sonido.
7. **Mantenimiento**: un archivo con líneas de hasta 78.000 caracteres, sin pruebas; cualquier cambio es a ciegas.

**Enlaces con las otras apps (contratos que no se pueden romper):**

| Quién | Qué usa de Lectori | Cuidado |
|---|---|---|
| Tabula (`js/nav-model.js`) y Fori (`src/index.template.html`) | La dirección `https://ilinper301-hue.github.io/Lectori/` | El repositorio se llama `Lectori` (con mayúscula): no renombrar ni mover `index.html` |
| **Calculi** (`src/js/10-datos.js`) | **Lee `localStorage['ar2']`** → `ps[].n`, `ps[].av`, `ps[].id` para importar alumnos | Si cambia dónde o cómo se guarda, hay que dejar `ar2` con esos campos |
| Todas | Mismo dominio: comparten `localStorage` y cachés | Claves nuevas con prefijo `lectori.`; no escribir claves ajenas; cachés solo `lectori-*` |
| Firebase | Colección `lectori`, reglas en `tabula/firestore.rules` | No cambiar rutas sin tocar las reglas (se publican a mano desde Tabula) |
| Tabula (Cuaderno) | **Nada todavía**. Calculi ya publica un resumen en `calc.tabula` que Tabula lee (`js/calculi.js`) | Ese es el modelo para la fase 7 |

### B. Pedagogía

**B.1 Método.** Fonético-sintético y sistemático, bien resuelto: una correspondencia letra-sonido por nivel, de vocales a
consonantes continuas (l, m, s, n) y luego el resto; fusión de sonidos con alargamiento («mmmeee»), sílabas, palabras,
frases y **textos decodificables** (solo usan lo ya enseñado); modelo «yo lo digo → juntos → tú solo»; pseudopalabras;
dictado con letras móviles; repaso espaciado; relectura (escucha → a coro → solo); palabras frecuentes. Coincide con lo
que respalda la investigación [1][2][3]: enseñanza explícita y ordenada del código, conciencia fonémica trabajada **con
letras**, práctica acumulativa y fluidez con modelo y relectura [5].

**B.2 Fallo principal: letras que suenan igual como opciones rivales.** En «¿Qué letra suena?» y «¿Qué sílaba suena?»
los distractores «parecidos en sonido» (`SIMF`) incluyen letras que suenan **idéntico**. Simulado con el código real
(2.000 tiradas por caso):

| Suena | Aparece como opción | Frecuencia |
|---|---|---|
| v | b | 100 % |
| k | c o q | 100 % |
| ll | y | 100 % |
| z | s o c | 100 % |
| sílaba «va» | «ba» | 69 % |
| sílaba «ge» | «je» | 66 % |
| sílaba «ce» | «ze» o «se» | 47 % |

El niño no puede acertar de oído. Cada fallo cuenta como error a la primera, alimenta «Le cuesta» y el repaso, y puede
bloquear el subnivel Sonido (pide 80 %). b/v, c/q/k, ll/y y ge/je suenan igual en todo el español; s/z/ce/ci, además,
donde se sesea o cecea (el currículo andaluz pide valorar la modalidad lingüística andaluza, no penalizarla).

**B.3 Lectura en voz alta sin adulto.** «Lee palabras» y «Lee sílabas» se validan con dos botones del tutor («La leyó
bien» / «Necesita ayuda») o con el micrófono de Chrome. En clase, con 20 niños y un maestro, **el botón lo pulsa el
propio niño**: el subnivel Palabras se supera sin comprobar nada, y el micrófono no es opción (ruido, voz de menores a
Google). No existe una actividad autónoma de «lee la palabra y toca su dibujo».

**B.4 Alcance real: Infantil 5 años – 1.º (y refuerzo en 2.º), no de 1.º a 6.º.** Los 45 niveles cubren el código
completo. De ahí en adelante faltaría casi todo: hay 9 textos de más de 80 palabras, todos narrativos, con comprensión
casi solo literal (la inferencial solo está en la evaluación del tutor), sin vocabulario ni textos informativos. Para
2.º–6.º haría falta otro producto (fluidez, vocabulario, comprensión), y la evidencia dice que ahí lo que más pesa es
el lenguaje oral y el conocimiento, no más fonética [2]. Decisión D1.

**B.5 Secuencia y contenido (detalles a revisar contigo, no se toca sin tu permiso).**
- La «r» mezcla en un nivel el sonido suave y el fuerte (pera / rana / pared); «rr» llega 24 niveles después (nivel 15 frente al 39).
- El nivel «z» enseña «ze, zi» como sílabas y pseudopalabras («zefe», «yuze»), contra la norma (ce, ci).
- Vocabulario poco frecuente o no peninsular para 6 años: aloe, alelí, halo, heno, himno, foso, elfo, dona, mico,
  carro y auto (coche), crayón, güiro, ungüento, lingüista.
- Las sílabas inversas (al, el…) ya aparecen en el primer nivel con consonante (L): exigente al principio.

**B.6 Error y retroalimentación.** Bien: primer fallo se registra, a los dos fallos se ilumina la respuesta, pistas
para b/d/p/q y m/n, «Necesita ayuda» modela los sonidos y luego comprueba con otra palabra, y al tercer intento fallido
del subnivel avisa al tutor («Atascado»). Problema: tras tres fallos **el listón baja al 50–60 %** y, al pasar, se borra
el aviso (`delete p.al`). El maestro pierde justo la señal que más le interesa.

**B.7 Diversidad.** Hay: letra de imprenta o ligada, trazo en mayúsculas/minúsculas, palabras tocables con audio,
instrucciones habladas, límite de tiempo diario, ritmo individual, respeto a «reducir movimiento». Falta: ajustar tamaño
y **espaciado** de letra por alumno (lo único tipográfico con respaldo para la dislexia es el espaciado, no las fuentes
«para dislexia» [6][7]), leer en MAYÚSCULAS al principio, velocidad de la voz, y aplicar un ajuste a toda la clase.
Conciencia fonológica oral previa (sonido inicial con dibujos, contar sílabas) casi no hay: solo «sílaba inicial».

**B.8 Datos por alumno.** Se guarda mucho y bien: nivel, cajas de repaso por letra/sílaba/palabra, intentos y fallos a
la primera, minutos y aciertos por día, velocidad (palabras correctas por minuto), evaluaciones con tipos de error y
vía de lectura, comprensión por tipo de pregunta, dictado, relecturas, notas. Informe y fichas imprimibles, CSV de aula.
Falta para decidir en clase:
- **Qué confunde con qué** (solo se cuenta el fallo, no la letra elegida).
- **Historia**: fecha en que superó cada nivel, intentos por subnivel, si pasó con el listón rebajado.
- **Vista de grupo**: quién está atascado, quién no ha practicado, reparto por niveles. Hoy la vista de aula está a
  tres toques (PIN → Ajustes → Vista de aula) y es una lista sin ordenar.
- Velocidad: textos de 24–51 palabras (medidas inestables) y referencia «PROLEC-R 45 / 78» sin rango; un metaanálisis
  español de 2020 da 48 ppm (25–72) en 1.º y 72 (45–101) en 2.º [4].
- **Conexión con el Cuaderno de Tabula** y con los criterios de Lengua de 1.º (comprensión lectora LCL.1.4.1 y 4.2,
  escritura 5.1; códigos de Séneca, compruébalos con tu programación [8]). El tiempo de Lectori encaja en los 30
  minutos diarios de lectura planificada que exige Andalucía [9], que piden también fluidez y comprensión.

### C. Interfaz

Capturas: 35 pantallas en móvil claro y oscuro y en tableta. **Ninguna desborda en horizontal y no hay errores de
JavaScript.** La zona infantil está muy cuidada: **ningún botón de niño mide menos de 44 px**.

| Pantalla | Controles visibles (total) | Problema principal |
|---|---|---|
| ¿Quién va a leer? | 9 (55) | Con 20 alumnos mide 2.771 px; al final cualquier niño puede crear perfiles; nada impide entrar en el de otro |
| Inicio del niño | 11 | Bien. Sobran para el niño el botón de tema y el cambio de perfil |
| Ejercicios (letra, sílaba, construir, dictado, trazo) | 4–12 | El altavoz (repetir sonido) es un icono pequeño sin borde; «← Inicio» siempre a mano |
| Lee palabra / sílaba | 4 | Botones del tutor en pantalla del niño (B.3) |
| Texto y pregunta | 3–6 | Pista «Toca una palabra para oírla» casi invisible (contraste 2,4) |
| Practicar | 17 (21) | 1.319 px de alto; candados con texto gris (contraste 2,4) |
| Zona del tutor (3 pestañas) | 16–18 (19–22) | Tres formas de salir; pestañas de 41 px y enlace de 19 px; todo gira en torno a un alumno |
| Vista de aula | 13 (25) | Escondida y sin orden por necesidad; en tableta sigue siendo una columna estrecha |
| Velocidad, evaluación, informe, fichas | 5–11 | Correctas en claro. **En oscuro, informe y evaluación tienen texto ilegible** (contraste 1,2 sobre la hoja blanca) |
| Modo Docente | 14 | 1.809 px en móvil; bien en tableta (dos columnas) |

Problemas comunes:
1. **La app está pensada para un niño con un adulto al lado**, no para 20 con tabletas: validación por el tutor, selector
   de perfil abierto, ajustes alumno a alumno.
2. **Textos de ayuda con poco contraste** (2,2–3,5): «Letra nueva», pistas, opciones bloqueadas, «Cambiar de alumno».
3. **Lector de pantalla y teclado**: los mensajes de acierto/error (`#fb`) no se anuncian (solo hay 2 `aria-live`), al
   cambiar de pantalla el foco se pierde, y el único `h1` es la marca.
4. **Tableta en vertical (768 px)**: se ve el diseño de móvil en una columna de 560 px. En horizontal (≥ 900 px) sí crece.
5. **Coherencia con Tabula/Charta/Fori**: la zona infantil tiene estilo propio (correcto). La zona del tutor ya usa Inter
   y filas tipo ajustes, pero sin la cabecera única ni las hojas inferiores de Tabula.

## 2. Principios (valen para todas las fases)

- **Nunca se pierde el progreso de un niño.** Cambio en los datos = migración + prueba + copia previa.
- **Lo que se le pregunta al niño tiene que poder acertarse** con lo que oye y ve.
- **El niño trabaja solo; el maestro decide con datos.** Nada en la zona infantil debe necesitar a un adulto.
- **Zona infantil**: botones ≥ 56 px, una acción principal por pantalla, instrucción hablada, sin enlaces externos.
- **Zona del tutor**: primero la clase, luego el alumno. Una acción principal, lo secundario en «⋯».
- **Datos de menores**: nada nuevo a la nube sin tu permiso; a la nube, lo mínimo.
- **No romper contratos**: `ar2` (Calculi), dirección `/Lectori/`, colección `lectori`, cachés `lectori-*`.
- Contenido (letras, palabras, textos, orden): solo se cambia con tu visto bueno, palabra por palabra.
- Cada fase: `node --test tests/*.test.mjs`, subir `sw.js` (`lectori-vN`) y la versión (`VER`), claro y oscuro, 390 y 768.

## 3. Decisiones que te tocan

| | Pregunta | Opciones (★ = recomendada) | Bloquea |
|---|---|---|---|
| **D1** | ¿Hasta dónde llega Lectori? | ★ a) Aprender a leer (Infantil 5 – 2.º) y pulirla · b) Ampliar a fluidez y comprensión 3.º–6.º (plan aparte, otro contenido) | Fase 10 |
| **D2** ✅ **c** | ¿Tu alumnado sesea o cecea? | a) Sí: s/z/ce/ci nunca compiten de oído · b) No: solo b/v, c/q/k, ll/y, ge/je · ★ c) Que se elija en Ajustes (por defecto, a) | Fase 1 |
| **D3** ✅ **a** | Leer palabras en clase sin adulto | ★ a) Nueva actividad «lee y toca el dibujo»; con ella se supera Palabras en «modo aula», y la lectura validada queda para cuando tú estés con el niño · b) Dejarlo como está | Fase 3 |
| **D4** ✅ **a** | ¿Qué sube a la nube de cada niño? | ★ a) Todo menos las notas del tutor (se quedan en el dispositivo y en la copia) · b) Todo, como ahora · c) Tampoco el nombre: solo animal e inicial | Fase 2 |
| **D5** | ¿Cómo son las tabletas en clase? | a) Cada niño siempre la suya → se queda fijada a su perfil · b) Compartidas → rejilla de animales y cambio de perfil solo al terminar · ★ c) Elegible en Ajustes | Fase 4 |
| **D6** | ¿Qué pasa al Cuaderno de Tabula? | ★ a) Indicadores con semáforo y dato (nivel, velocidad, comprensión), sin nota · b) Además, nota 0–10 calculada (como Calculi) | Fase 7 |
| **D7** | ¿Partir `index.html` en archivos como Calculi? | ★ a) No por ahora: pruebas sobre el archivo único · b) Sí, tras la fase 2 (`src/` + `tools/build.py`, lo ejecuta Claude) | Fase 11 |

## 4. Fases

Orden por impacto y riesgo. Dependencias: 0 → todas · 2 → 5 → 6 y 7 · 3 → 4.

Decidido el 2026-11-13: **D2 = c** (Ajustes «Sonidos iguales en mi zona», por defecto con seseo/ceceo), **D4 = a** (las
notas del tutor no suben a la nube), **D3 = a** (fase 3 «Lee y toca»; 224 de 309 palabras tienen dibujo y todos los niveles
con consonante tienen al menos 3, salvo M (1) y W (2): en la fase 3 se proponen dibujos nuevos para esos dos, con tu visto
bueno, y mientras tanto esos niveles siguen con la lectura validada; las vocales no tienen palabras).

### Fase 0 · Red de seguridad: pruebas — *Sonnet, esfuerzo alto* — ✅ **hecha el 2026-11-13** (resumen en `ESTADO.md`)

**Objetivo**: poder cambiar sin miedo. No cambia nada de lo que ve el usuario.
- `tests/cargar.mjs`: extrae el `<script>` de `index.html` y lo ejecuta en Node (`node:vm`) con sustitutos mínimos de
  `document`, `localStorage`, `speechSynthesis`, `Audio`. Modelo: `Calculi/tests/`.
- `tests/contenido.test.mjs`: cada palabra y sílaba de un nivel usa solo letras ya enseñadas; cada texto es decodificable
  en el nivel que se le calcula; índices de `CQ` válidos; ninguna pseudopalabra es palabra real; 45 niveles.
- `tests/datos.test.mjs`: `migLv`/`migOrd` (perfil antiguo → nuevo sin perder nivel), `cleanP` (copia vieja, campos
  raros, nombres con símbolos), `domS`, `streak`, `cwpm`, `evStats`/`evRec`.
- `tests/humo.py` (Playwright, lo ejecuta Claude): crear perfil, un ejercicio, zona del tutor; sin errores; 390 y 768.
- `CLAUDE.md`: añadir «lee `ESTADO.md` al empezar y actualízalo al terminar» y cómo lanzar las pruebas.

**Archivos**: `tests/*` (nuevos), `CLAUDE.md`, `ESTADO.md`. **Hecho cuando**: `node --test tests/*.test.mjs` pasa y
`index.html` no ha cambiado ni un carácter. **Tú pruebas**: nada (la app es idéntica).

### Fase 1 · Opciones justas y audio sin esperas — *Sonnet, esfuerzo medio* · D2 — ✅ **hecha el 2026-11-13** (resumen en `ESTADO.md`)

**Objetivo**: que toda pregunta de oído se pueda acertar y que el sonido salga al instante.
- Grupos de letras que suenan igual (`HOMOF`: b/v, c/q/k, ll/y, g/j ante e-i, y s/z/c ante e-i según D2): nunca como
  opción rival en `itemChoose`, `itemSylChoose`, `dstr`, `dstrS` ni en el repaso. En **dictado y construir** sí se
  mantienen (ahí se trabaja la ortografía con la palabra delante).
- Audio: lista de los audios que existen (generada, `AUDOK`), probar primero la extensión que hay y no pedir lo que
  falta; quitar la precarga de `.mp3` inexistentes. Recordar en la sesión lo que falta sin 4 intentos.
- Los errores antiguos en letras homófonas no se borran, pero dejan de pintarse como «Le cuesta» si solo vienen de ahí.

**Archivos**: `index.html` (`SIMF`, `dstr`, `dstrS`, `itemChoose`, `say`, `sndL`, arranque), `sw.js`.
**Pruebas**: 2.000 tiradas por letra y sílaba sin pareja homófona; ninguna ruta de audio pedida que no exista.
**Hecho cuando**: 0 peticiones 404 en arranque y en un nivel completo. **Tú pruebas**: nivel de la V y de la LL (que no
salgan b ni y como opción) y que los sonidos no tarden.

### Fase 2 · Que no se pierda nada — *Opus, esfuerzo alto (delicado: datos y nube)* · D4 — ✅ **hecha el 2026-11-13** (resumen en `ESTADO.md`; las fuentes en `fonts/` quedan pendientes)

**Objetivo**: cerrar las vías de pérdida de datos.
- `saveRaw()` detecta el fallo de guardado y avisa en la zona del tutor (y punto rojo en Inicio); medidor «espacio usado».
- Adelgazar `ar2`: tope a evaluaciones y errores por palabra antiguos (con migración probada).
- Primera sincronización: fuera `confirm()`. Pantalla propia con dos botones claros («Usar lo de la cuenta» / «Subir lo
  de este dispositivo»), resumen de qué hay en cada lado y **copia automática previa** del lado que se va a sustituir.
- Restaurar copia: elegir «Añadir a lo que hay» (por defecto) o «Sustituir todo»; nunca marcar borrados sin confirmarlo.
- Fusión por alumno menos destructiva: si los dos lados cambiaron, combinar días (`d`), cajas (`s`, `ws`) y contadores
  en vez de quedarse con uno entero.
- D4: las notas del tutor (`nt`) no suben a la nube (si eliges a). Fuentes Inter y Playwrite servidas desde `fonts/`.
- No tocar: clave `ar2` y campos `ps[].n/av/id` (Calculi), colección `lectori`.

**Archivos**: `index.html` (`save`, `saveRaw`, `syncNow`, `impo`, `applyImp`, `cleanP`, `accSec0`), `fonts/`, `sw.js`.
**Pruebas**: `tests/sync.test.mjs` con Firestore simulado (modelo `Calculi/tests/test_sync.js`): dos dispositivos,
borrados, primera vez, sin conexión; `tests/copia.test.mjs`: exportar → restaurar deja lo mismo; almacenamiento lleno.
**Tú pruebas**: guardar copia, restaurarla en «Añadir», entrar con Google en un segundo dispositivo y ver el aula igual.

### Fase 3 · Leer palabras sin un adulto: «Lee y toca» — *Opus, esfuerzo alto (función nueva)* · D3 = a — ✅ **hecha el 2026-11-13** (resumen en `ESTADO.md`; dibujos de la M pendientes de visto bueno)

**Objetivo**: comprobar la lectura de palabras cuando el niño trabaja solo.
- Actividad nueva `itemMatch`: se muestra la palabra escrita (sin audio) y 3 dibujos; el niño toca el que corresponde.
  Distractores de palabras ya conocidas que empiecen igual o se parezcan. Solo palabras con dibujo (224 de las 309
  lo tienen; las 85 sin dibujo siguen en construir, dictado y lectura validada).
- Variante inversa: un dibujo y 3 palabras escritas parecidas (una letra de diferencia cuando se pueda).
- Ajuste por alumno o para toda la clase «Lectura en voz alta»: *Validada por el tutor* (como ahora) / **Sola** (el
  subnivel Palabras usa `itemMatch` + construir; «Lee palabras» queda como práctica de decir en voz alta sin puntuar).
- Se registra como lectura con comprensión (`p.lm`), aparte de la validada por el tutor.

**Archivos**: `index.html` (`run` → `mk0('pal')`, `practice`, `pl`, `panel`, `docHome`), `lista-audios.csv` (instrucción).
**Pruebas**: toda opción correcta tiene dibujo único en el trío; nunca dos dibujos iguales; progreso se guarda y migra.
**Tú pruebas**: un nivel entero en modo «Sola» sin ayudar al niño.

### Fase 4 · La tableta en clase — *Sonnet, esfuerzo medio* · D5 · depende de 3

- «¿Quién va a leer?» como **rejilla de animales con nombre** (20 caben en una pantalla); crear perfil y elegir animal
  pasan a la zona del tutor.
- Modo «tableta fijada» (D5): al abrir entra directa en el perfil; cambiar de perfil pide PIN.
- Al terminar la sesión: pantalla de despedida que vuelve a la rejilla (o se queda, según D5).
- El botón de tema sale de las pantallas del niño (queda en Ajustes).
- Ajustes «para toda la clase»: tiempo diario, tipo de letra, modo de lectura, de una vez.

**Archivos**: `index.html` (`profiles`, `addP`, `hdr`, `endScreen`, `panel`). **Pruebas**: humo con 25 perfiles a 390 px
sin desplazamiento. **Tú pruebas**: que un niño encuentre su animal y no pueda entrar en ajustes ni crear perfiles.

### Fase 5 · Más y mejores datos del alumno — *Opus, esfuerzo alto (estructura de datos)* · depende de 2

- Confusiones: guardar qué opción eligió al fallar (`p.cx['b>d']`), con tope.
- Historia de niveles (`p.hx`): fecha de superación, intentos por subnivel, si pasó con el criterio rebajado. El aviso
  «Atascado» no se borra: pasa a «superado con ayuda».
- Velocidad: textos de 60–100 palabras o prueba de 1 minuto; referencia por curso con rango (48 [25–72] en 1.º,
  72 [45–101] en 2.º [4]) en lugar de un solo número; guardar también palabras por minuto en las lecturas normales.
- Comprensión: separar literal e inferencial en el registro (`p.cq`).
- Informe del alumno y CSV de aula con lo nuevo. Migración: perfiles sin estos campos siguen funcionando.

**Archivos**: `index.html` (`rec`, `run` → `done`/`end`, `cleanP`, `vel*`, `VREF`, `progreso`, `informe`, `aulaCSV`).
**Pruebas**: migración de perfil 3.34; topes de tamaño; `cleanP` conserva lo nuevo. **Tú pruebas**: fallar adrede b/d
y ver «confunde b con d» en Progreso.

### Fase 6 · La clase primero — *Sonnet, esfuerzo alto* · depende de 5

- En Perfil Docente, la zona del tutor abre en **Clase**: resumen (reparto por niveles, quién está atascado, quién no ha
  practicado esta semana, quién repasa hoy), lista ordenable por necesidad, y de ahí al alumno.
- Cabecera única como en Tabula (título + acción principal + «⋯»); una sola forma de salir; exportar e informes en «⋯».
- En tableta, la clase a todo el ancho (tabla), no una columna de 560 px.

**Archivos**: `index.html` (`adults`, `panel`, `aula`, CSS de `.au`, `.tzh`, `.tabs`). **Pruebas**: humo a 390/768/1280.
**Tú pruebas**: desde Inicio, llegar a «quién necesita ayuda hoy» en dos toques.

### Fase 7 · Puente con el Cuaderno de Tabula — dos chats · D6 · depende de 5

- **7a · Lectori** — *Sonnet, esfuerzo medio*: publicar un resumen en `localStorage['lectori.tabula']` (2 s después de
  cada cambio; solo lectura para Tabula) y documentarlo en `docs/tabula.md`. Propuesta de forma:
  `{ app:'lectori', v:1, ts, alumnos:[{ id, n, curso, nivel, niveles:45, grafema, dominadas, enProceso, atascado,
  pcm, pcmFecha, comprension:{literal, inferencial}, dictado, minutosSemana, ultimoDia, semaforo }] }`.
  Sin notas del tutor ni detalle de errores.
- **7b · Tabula** (chat en el proyecto de Tabula) — *Opus, esfuerzo alto (toca evaluación)*: `js/lectori.js` a imagen de
  `js/calculi.js` (leer, emparejar por nombre sin adivinar, traer al Cuaderno como columnas `origen:'lectori'` ligadas a
  los criterios de lectura que tú elijas), botón en Cuaderno › «⋯» › Importar.

**Pruebas**: forma del resumen (7a); lectura, emparejado y actualización de columnas (7b, como `tests/` de Calculi).
**Tú pruebas**: abrir Lectori, luego Tabula en el mismo dispositivo, y traer la clase al Cuaderno.

### Fase 8 · Lectura cómoda y apoyos — *Sonnet, esfuerzo medio*

- Por alumno (y para la clase): tamaño de letra, **espaciado entre letras y palabras**, interlineado, MAYÚSCULAS para
  leer, velocidad de la voz. Sin fuentes «para dislexia» (no hay evidencia de que ayuden [6][7]).
- Altavoz de «escuchar otra vez» más grande y con borde en todos los ejercicios.
- Opcional (chat aparte, *Opus*): actividad oral «¿Qué dibujo empieza por /m/?» para los primeros niveles e Infantil.

**Archivos**: `index.html` (`applyFt`, CSS `[data-ft]`, `panel`, `cleanX`). **Pruebas**: `cleanP` guarda los ajustes;
ninguna pantalla desborda con el tamaño máximo. **Tú pruebas**: activar «cómoda» en un alumno y leer un texto.

### Fase 9 · Accesibilidad y repaso visual — *Sonnet, esfuerzo medio*

- Contraste ≥ 4,5 en pistas, etiquetas y opciones bloqueadas; informe, evaluación y fichas legibles en oscuro.
- `#fb` con `aria-live`; al cambiar de pantalla el foco va al título; un `h1`/`h2` real por pantalla; nombres accesibles
  en los botones de letra («letra eme») y de animal.
- Botones del tutor a 44 px; tableta en vertical con más ancho; borrar CSS sin uso.

**Pruebas**: `tests/humo.py` mide contraste y tamaños (las métricas de este análisis) y falla si empeoran.
**Tú pruebas**: modo oscuro en informe y evaluación; TalkBack en un ejercicio.

### Fase 10 · Contenido — *Opus, esfuerzo alto, con tu visto bueno palabra a palabra* · D1

Lista de cambios propuestos para que apruebes: r suave/fuerte, «ze-zi», vocabulario (B.5), más lecturas de 40–100
palabras y preguntas inferenciales al final del recorrido. Las pruebas de la fase 0 garantizan que todo siga siendo
decodificable. Subir `lectori-vN` y revisar `lista-audios.csv`.

### Fase 11 (opcional) · Partir el archivo — *Opus, esfuerzo alto* · D7

`src/` (datos, motor, actividades, tutor, nube, estilos) + `tools/build.py` que genera el mismo `index.html`. Solo si lo
decides; exige que cada chat ejecute la construcción antes de publicar.

## 5. Cómo pedir cada fase

Abrir chat nuevo en el proyecto y escribir: «Ejecuta la fase N de `PLAN-DISENO.md` de Lectori». Antes de la 1, 2, 3, 4 y
7 responde a su decisión (D2, D4, D3, D5, D6). Publicar al terminar cada fase, no a medias, y pedir capturas de antes y
después a 390 px.

## 6. Fuentes

1. Defior, S. (2008). *¿Cómo facilitar el aprendizaje inicial de la lectoescritura? Papel de las habilidades fonológicas.* Infancia y Aprendizaje. https://www.caligrafix.cl/static_assets/PDF/Educadores/Investigaciones%20JCS/Como-facilitar-el-aprendizaje-inicial-de-la-lectoescritura-Papel-de-las-habilidades-fonologicas-Sylvia-Defior.pdf
2. Castles, A., Rastle, K. y Nation, K. (2018). *Ending the Reading Wars: Reading Acquisition From Novice to Expert.* Psychological Science in the Public Interest, 19(1). https://doi.org/10.1177/1529100618772271
3. Gutiérrez-Fresneda, R. y Díez-Mediavilla, A. (2017). *Efectos de un programa de conciencia fonológica en el aprendizaje de la lectura y la escritura.* REOP, 28(2). https://revistas.uned.es/index.php/reop/article/download/20117/16666/39807
4. Ripoll, J. C., Tapia, M. M. y Aguado, G. (2020). *Velocidad lectora en alumnado hispanohablante: un metaanálisis.* Revista de Psicodidáctica, 25. https://www.elsevier.es/en-revista-revista-psicodidactica-243-articulo-reading-rate-in-spanish-speaking-students-S2530380520300046 · Cifras por curso tomadas de un material del Ministerio de Educación que las atribuye a ese trabajo: https://www.educacionfpydeportes.gob.es/dam/jcr:2bb6bed6-8a68-4736-aa29-edaef86eaa0c/congreso-nacional-pct-creaci-n-del-mapa-lector.pdf (conviene contrastarlas con el artículo completo en la fase 5).
5. Ripoll, J. C. y Zevallos, D. S. (2024). *Intervenciones para la mejora de la velocidad y fluidez lectora en hispanohablantes de Educación Infantil y Primaria: un metaanálisis.* Revista de Investigación en Logopedia, 14(1). https://dx.doi.org/10.5209/rlog.90521
6. Galliussi, J. et al. (2020). *Inter-letter spacing, inter-word spacing, and font with dyslexia-friendly features.* Annals of Dyslexia, 70. https://pmc.ncbi.nlm.nih.gov/articles/PMC7188700
7. Shanahan, T. *What about special fonts for kids with dyslexia or other reading problems?* (resumen de Kuster et al., 2018; Wery y Diliberto, 2017; Zorzi et al., 2012). https://www.shanahanonliteracy.com/blog/what-about-special-fonts-for-kids-with-dyslexia-or-other-reading-problems
8. Orden de 30 de mayo de 2023 (currículo de Primaria en Andalucía), BOJA n.º 104: https://www.juntadeandalucia.es/eboja/2023/104/BOJA23-104-00208-9731-01_00284747.pdf · Criterios de 1.º tal como salen de Séneca en una programación de centro: https://blogsaverroes.juntadeandalucia.es/bpmoya/files/2024/11/LCL-1o.pdf
9. Instrucciones de 21 de junio de 2023 sobre el tratamiento de la lectura (Viceconsejería de Desarrollo Educativo y FP): https://blogsaverroes.juntadeandalucia.es/macade/files/2023/07/Instrucciones21junio2023LecturaPrimariayESO.pdf

Lo que este análisis **no** ha podido comprobar: cómo suenan los audios grabados (no se pueden escuchar aquí), el
comportamiento en tabletas reales del centro, y la sincronización contra Firebase real (solo se ha leído el código).
