# Revisión de datos y nube (fases 2 y 5)

> **Arreglado en la fase 5b (2026-11-18, versión 3.42).** Las 9 pruebas de `tests/revision.test.mjs` pasan sin haberlas cambiado.
> «Otras observaciones»: ver `ESTADO.md` (decididas con el tutor).

Hecha el 2026-11-16 sobre la versión 3.40 (`lectori-v12`), leyendo el código de guardado, copias, fusión y
sincronización, y **reproduciendo cada hallazgo** con la nube falsa de las pruebas. **No se ha cambiado la app.**

Cada hallazgo tiene una prueba en `tests/revision.test.mjs` que hoy falla (marcada `todo`, no rompe la ejecución).
Lo que **no** se ha podido comprobar: Firebase real y tabletas reales (igual que en las fases 2 y 5).

## Resumen

| | Qué pasa | Gravedad | Prueba |
|---|---|---|---|
| H1 | Una tableta que no se sincronizó hace **retroceder el nivel y las estrellas** de un niño, en todas las tabletas | **Alta** | H1, H1b |
| H3 | La primera vez que se entra con la cuenta, alumnos de ese dispositivo que solo tienen pruebas de velocidad, evaluaciones o notas **desaparecen sin preguntar y sin copia** | **Alta** | H3 |
| H4 | Reiniciar a un alumno en un dispositivo **borra las notas del tutor** escritas en otro | Media | H4 |
| H5 | Un borrado que llega de otro dispositivo se aplica **sin copia automática** aquí | Media | H5 |
| H7 | «Sustituir todo» no sustituye del todo si la cuenta está conectada: al sincronizar vuelve lo de la cuenta | Media | H7 |
| H2 | Si el nivel del niño cambia mientras hace un ejercicio, al terminarlo **se salta un nivel** | Media-baja | H2 |
| H6 | Si los datos guardados no se pueden leer al abrir, la app empieza vacía y **los pisa** al primer guardado | Baja (poco probable, pero total) | H6 |
| H8 | Sincronizar borra la marca de «tiempo de uso agotado» | Baja | H8 |

Lo que está bien y se ha comprobado leyendo y con las pruebas que ya había: las notas no suben a la nube; guardar copia y
restaurarla en «Añadir» no pierde nada; el aviso de almacenamiento lleno; no hay subidas sin fin; las reglas de la nube
(`tabula/firestore.rules`) solo dejan leer y escribir a cada docente lo suyo; el tamaño por alumno queda lejos de los límites.

## H1 · Una tableta atrasada hace retroceder el nivel (Alta)

**Ejemplo.** El lunes Ana llega al nivel 9 en la tableta A, que sincroniza. El martes coge la tableta B, que sigue con
lo de la semana pasada (nivel 6) porque no tenía wifi. Gana una estrella. Cuando B sincroniza, Ana queda en el nivel 6
con 81 estrellas **en la cuenta y en todas las tabletas**. Lo que hizo no se borra (días, fallos, historia), pero
vuelve tres niveles atrás, pierde estrellas y deja de salir como «dominado» lo que ya tenía afianzado.

**Por qué.** Al juntar dos versiones (`mergeP`), el nivel (`lv`), las estrellas (`st`), por dónde va (`pg`) y, en las
letras que están en los dos lados, las cajas de repaso (`s`, `ws`) y las confirmaciones (`cf`) son **de la versión con
la fecha más reciente** (`mt`), aunque sea la atrasada. Y es muy fácil que la atrasada sea la más reciente:

- Cualquier respuesta pone la fecha de ahora; también un minuto de uso sin contestar nada (temporizador de `save()`).
- «Lo mismo para toda la clase» (`rmAll`, `ftAll`, `limAll`) pone la fecha de ahora a **todos** los alumnos de esa
  tableta: si está atrasada, retrocede la clase entera (prueba H1b).
- Si la app se abre sin conexión, **no sincroniza en toda la sesión** aunque vuelva el wifi: `fbInit()` solo se llama
  al arrancar (o al pulsar «Entrar con Google») y no hay nada que escuche que vuelve la conexión. Así las tabletas se atrasan más de lo necesario.
- Todo depende del reloj de cada tableta: una con la fecha adelantada gana siempre.

`ESTADO.md` ya avisaba del caso contrario (el tutor baja el nivel a mano); este no estaba previsto.

**Arreglo propuesto.**
1. Al juntar: nivel = el **mayor** de los dos, y `pg` del lado que tenga ese nivel; estrellas = las mayores.
   Excepciones: el reinicio (`rz`, ya existe) y un campo nuevo y opcional `lz` (fecha en que el tutor puso el nivel a
   mano en `setLv`): si `lz` es posterior al último cambio del otro lado, manda el nivel del tutor.
2. Cajas y confirmaciones, letra a letra: la que se practicó más tarde (se puede calcular sin guardar nada nuevo:
   `s[k].d − INT[s[k].b]`), y con ella su `cf`.
3. Reintentar al volver la conexión (evento `online`) y al volver a la app si `FB` no llegó a iniciarse.
4. `tests/sync.test.mjs`, «el nivel lo pone el más reciente»: sigue pasando (allí el más reciente es también el mayor),
   pero hay que cambiarle el título.

## H3 · Primera vez con la cuenta: desaparecen alumnos «vacíos» que no lo están (Alta)

**Ejemplo.** En septiembre creas la clase en una tableta nueva y haces la prueba de velocidad inicial, o escribes
notas. Luego entras con tu cuenta, que ya tiene datos (de otro dispositivo o del curso pasado). La tableta queda
igual que la cuenta: tus alumnos, sus pruebas y sus notas desaparecen sin pregunta ni copia.

**Por qué.** `isBlank()` solo mira nivel, estrellas y cajas de repaso (`lv`, `st`, `s`). Si «está vacío», `syncNow` usa
el modo `down` sin preguntar, y la copia automática solo se hace `if(!isBlank())`.

**Arreglo propuesto.** Que «vacío» signifique **sin ningún alumno** (o alumnos sin ningún dato: tampoco `vl`, `es`,
`ev`, `nt`, `rd`, `d`). Si hay alumnos, preguntar como ya se hace; y en el modo `down`, copia automática siempre que
haya algún alumno.

## H4 · Un reinicio en otro dispositivo borra las notas de aquí (Media)

**Por qué.** En `mergeP`, si un lado se reinició después del último cambio del otro, se devuelve ese lado entero
(`return N`). Como las notas no suben (D4), la versión de la cuenta no las trae y las de este dispositivo se pierden.
El propio «Reiniciar progreso» no borra notas: solo pasa al sincronizar.

**Arreglo propuesto.** En ese atajo, conservar las notas del otro lado (`uni(N.nt, O.nt, 200)`), como ya hace el modo `down`.

## H5 · Borrados que llegan de otro dispositivo, sin copia (Media)

**Por qué.** `CLAUDE.md` pide `bkAuto` antes de todo lo que borre. `delP` lo hace en el dispositivo donde se borra,
pero cuando el borrado llega por la cuenta (`setLocal(id, null)` en `syncNow`) el otro dispositivo quita al alumno,
con las notas que solo estaban allí, sin copia.

**Arreglo propuesto.** Una copia automática por sincronización, antes de aplicar el primer borrado.

## H7 · «Sustituir todo» con la cuenta conectada (Media)

**Por qué.** `applyImp('rep')` deja a los alumnos de la copia con fecha de ahora. En la siguiente sincronización se
juntan con lo de la cuenta: el nivel es el de la copia, pero vuelven las cajas de repaso, días y fallos que había.
El texto del botón dice «Quedan solo los de la copia, tal como estaban».

**Arreglo propuesto.** Marcar a los restaurados con `rz` = ahora (como un reinicio): así su versión gana entera.
Hacerlo después de arreglar H4, para que no se lleve las notas.

## H2 · Salto de nivel si el nivel cambia a mitad de ejercicio (Media-baja)

**Ejemplo.** Ana hace su nivel en la tableta; mientras, desde tu móvil le subes el nivel. La tableta sincroniza en
una pausa. Cuando Ana termina, la app suma 1 al nivel nuevo: se salta uno sin hacerlo.

**Por qué.** `run()` decide al empezar si el nivel cuenta (`track`) y `end()` hace `p.lv++` sin comprobar que el nivel
del niño sigue siendo el del ejercicio.

**Arreglo propuesto.** En `end()`: sumar solo si `p.lv === i`.

## H6 · Datos ilegibles al abrir (Baja)

**Por qué.** Si `JSON.parse(localStorage.ar2)` falla, la app arranca con un aula vacía y el primer `save()` escribe
encima. Con cuenta conectada se recupera de la nube; sin cuenta, no.

**Arreglo propuesto.** Si `ar2` existe y no se puede leer, guardar el texto tal cual en las copias automáticas
(«Datos que no se pudieron leer») antes de seguir, y avisar en la zona del tutor.

## H8 · El bloqueo por tiempo se borra al sincronizar (Baja)

**Por qué.** `p.e` (hora en que se agotó el tiempo) no está en `cleanP`; cada sincronización que junta lo quita. En la
misma sesión el bloqueo sigue (lo recuerda la memoria), pero al recargar la app el niño puede seguir.

**Arreglo propuesto.** Conservar `e` en `cleanP` (número) y, al juntar, el más reciente.

## Otras observaciones (sin prueba; a decidir)

- **Copia automática que no se pudo guardar.** `bkAuto` devuelve `false` si falla IndexedDB (queda solo en memoria,
  se pierde al cerrar). `slimOld` lo comprueba; «Sustituir todo», «Usar lo de la cuenta», reiniciar y borrar siguen
  adelante sin mirarlo. Propuesta: si devuelve `false`, ofrecer «Guardar copia» antes de continuar.
- **Clases creadas a mano en dos tabletas.** Los alumnos se emparejan por `id`, no por nombre: «Juntar los dos»
  (la opción recomendada) deja a cada niño duplicado y no hay forma de unir dos alumnos. La fase 7c («Traer mi clase
  de Tabula») lo resuelve para quien use Tabula; hasta entonces, avisar si hay nombres repetidos.
- **Minutos del mismo día en dos tabletas**: se queda el mayor, no la suma. No se pierde progreso; el límite diario
  puede superarse. Sumar tendría riesgo de contar doble: mejor dejarlo.
- **«Reiniciar progreso»** pone a cero nivel, estrellas, cajas y fallos, pero deja confirmaciones (`cf`), historia
  (`hx`), palabras (`ws`), Lee y toca (`lm`), confusiones (`cx`) y comprensión (`cn`). Decidir si es lo que se quiere.

## Cómo arreglarlo: fase 5b

Recogida en `PLAN-DISENO.md`. Un chat, *Opus, esfuerzo alto* (datos y nube). Orden: H1, H3, H4, H5, H7, H2, H8, H6.
Cada arreglo: quitar el `todo` de su prueba y verla pasar, sin tocar la prueba.
