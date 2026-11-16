# Lectori → Tabula: el resumen `lectori.tabula`

**Estado: diseño (2026-11-16). Todavía no está programado.** Es la especificación de la fase 7a de `PLAN-DISENO.md`.
Sigue el formato común **v2** de `ECOSISTEMA.md` (apartado 4). Si este documento y `ECOSISTEMA.md` se contradicen,
manda `ECOSISTEMA.md`.

El diseño se comprobó con un prototipo fuera de la app (misma lógica que se describe aquí, ejecutada sobre el código
real de la versión 3.40 con clases simuladas): las cifras de «Tamaño» y los «Casos límite» salen de ahí.

## 1. Qué es

Lectori deja en `localStorage`, clave **`lectori.tabula`**, un resumen de lo que ha aprendido cada alumno.
Tabula lo **lee** (nunca lo escribe) para llevarlo al Cuaderno. No sale del dispositivo: no sube a ninguna nube.

Reglas que cumple (de `ECOSISTEMA.md`):

- **Regla 0**: Lectori funciona igual sin Tabula. El resumen es un dato derivado: si no se puede escribir, no pasa
  nada y no se avisa al niño ni se marca error de guardado.
- **Regla 1**: solo escribe su clave (`lectori.tabula`). No toca claves de otras apps.
- **Regla 4, datos mínimos**: id, nombre que se ve en clase y resultados de aprendizaje. **Nunca**: notas del tutor
  (`nt`), detalle de confusiones (`cx`), evaluaciones (`es`, `ev`), días de uso uno a uno, ni PIN.
- **Solo en el perfil Docente** (`DOC()`). En el perfil Familias no se escribe, y si existía la clave se borra.
- El «Modo Docente» (`P.md`) no es un alumno: no sale.

## 2. Forma

```json
{
  "app": "lectori", "tipo": "resumen", "v": 2, "ts": 1794800000000,
  "alumnos": [
    { "id": "mh3k2a9x1b2c", "tb": null, "n": "Lucía", "curso": 1,
      "diasPractica": 40, "ultimoDia": "2026-11-13",
      "items": [
        { "id": "a", "nombre": "Letra a", "bloque": "Vocales",
          "dominio": 100, "semaforo": "v", "intentos": 12, "superado": "2026-10-27" },
        { "id": "m", "nombre": "Letra m", "bloque": "Consonantes",
          "dominio": 82, "semaforo": "v", "intentos": 132, "superado": "2026-11-03", "ayuda": 1 },
        { "id": "f", "nombre": "Letra f", "bloque": "Consonantes",
          "dominio": 50, "semaforo": "a", "intentos": 60, "superado": "2026-11-12" }
      ],
      "extra": {
        "nivel": 13, "niveles": 45, "grafema": "p",
        "atascado": { "item": "p", "parte": "Sílabas" },
        "pcm": 49, "pcmFecha": "2026-11-13", "pcmMinuto": 1, "pcmRef": [25, 72],
        "comprension": { "literal": 75, "inferencial": [3, 4] },
        "dictado": [14, 20], "minutosSemana": 35
      } }
  ]
}
```

### Por alumno

| Campo | De dónde sale |
|---|---|
| `id` | `p.id` (el del perfil en Lectori; no cambia) |
| `tb` | `p.tb` → `{a, g}` si el perfil está enlazado con Tabula; si no, `null`. Hasta la fase 7c siempre es `null` y Tabula empareja por nombre |
| `n` | `p.n` |
| `curso` | `p.cu`: `'1'`→1, `'2'`→2, `'3'`→3, `'i5'`→**0** (Infantil 5 años), sin curso→`null` |
| `diasPractica` | número de días con uso (`Object.keys(p.d).length`) |
| `ultimoDia` | último día de `p.d` (`AAAA-MM-DD`) o `null` |
| `items` | apartado 3 |
| `extra` | apartado 4 |

## 3. Items: un item por nivel

- **Un item = un nivel de Lectori** (hoy 45: 29 letras y 16 de inversas, trabadas, diptongos…).
- **`id` = `LV[i].g`**, el grafema del nivel (`a`, `l`, `ll`, `ch`, `bl`, `rr`, `ua`, `gü`, `ío`…). Es la misma clave que
  usa la historia de niveles (`p.hx`): no cambia aunque cambie el orden de las letras.
  **Contrato: un `g` ya publicado no se renombra nunca.** Lista congelada a 2026-11-16 (la prueba la lleva escrita):
  `a e i o u l m s n h d f p t r b v ñ y c z q g j ll ch k w x al as am bl cl fl gl dr pl rr ia ua ai gü ab ío`
- **`nombre`**: «Letra » + la letra en los 29 primeros niveles; en los demás, el título del nivel (`LV[i].u`).
- **`bloque`** (propuesta, para agrupar columnas en el Cuaderno): «Vocales» (5), «Consonantes» (24), «Sílabas inversas»
  (`al`, `as`, `am`, `ab`), «Sílabas trabadas» (`bl`, `cl`, `fl`, `gl`, `dr`, `pl`), «Diptongos y otros» (`rr`, `ia`, `ua`,
  `ai`, `gü`, `ío`).
- **Qué niveles salen**: solo los **superados** (índice menor que `p.lv`). El último nivel cuenta como superado si
  `p.hx[g].d` existe (al terminarlo `p.lv` no sube de 44). El nivel en curso **no** sale como item: va en `extra`
  (`grafema`, `atascado`), porque estar aprendiendo una letra no es «rojo».

### `dominio` (0–100) y `semaforo`

Usa el **criterio único de dominio** que ya tiene la app (el de Progreso y el informe: `cf` y cajas de repaso), para que
Tabula y Lectori digan lo mismo. No hace falta guardar nada nuevo en el perfil.

Para cada letra y sílaba del nivel (las mismas que usa `domS`: `l.x ? l.s : [l.u, ...l.s]`):

| Situación | Puntos |
|---|---|
| **Dominada**: `cf[k].c` (acertada otro día tras superar el nivel); en perfiles antiguos sin `cf`, caja `s[k].b` ≥ 2 | 1 |
| **Superada, sin afianzar**: `cf[k]` sin `c` y caja ≥ 1 (o sin caja); sin `cf`, caja = 1 | 0,5 |
| **Fallada en el repaso**: caja = 0 | 0 |
| Sin ningún dato (ni `cf` ni caja) | no cuenta |

- `dominio` = media de los puntos × 100, redondeada. Si ninguna tiene datos (nivel saltado por el tutor): `null`.
- Nivel sin letras ni sílabas propias (hoy solo «Más palabras», `ío`): lo mismo con sus palabras y `p.ws`
  (caja ≥ 2 → 1; 1 → 0,5; 0 → 0).
- `semaforo`: `v` (80 o más), `a` (50 o más), `r` (menos de 50), `g` (`null`). Igual que en las otras apps.

Cómo se lee: **verde** = lo domina; **ámbar** = lo superó pero aún no está afianzado (recién superado da 50);
**rojo** = lo está fallando al repasarlo: necesita refuerzo.

### Campos opcionales del item

- `intentos`: suma de `p.er[k].a` de sus letras y sílabas.
- `superado`: `p.hx[g].d`, día en que superó el nivel (solo niveles superados desde la versión 3.40).
- `ayuda`: `1` si lo superó con ayuda (listón rebajado, `hx.r`, o 4 intentos o más en algún subnivel, `hx.t`).
- No se envían `curso`, `trimestre` ni `ultimo` (Lectori no guarda la fecha del último intento por letra).

## 4. `extra` (propio de Lectori; Tabula lo usa solo si lo conoce)

| Campo | Qué es | De dónde |
|---|---|---|
| `nivel`, `niveles` | nivel actual (1–45) y total | `p.lv + 1`, `LV.length` |
| `grafema` | id del nivel en curso | `LV[p.lv].g` |
| `atascado` | `{item, parte}` o `null` | `p.al` (`LV[al.i].g`, `SUBC[al.s]`) |
| `pcm`, `pcmFecha` | última velocidad (palabras correctas por minuto) y su fecha | `cwpm` del último `p.vl` |
| `pcmMinuto` | `1` si fue la prueba de 1 minuto | `vl.m` |
| `pcmRef` | `[mínimo, máximo]` de referencia del curso, o `null` | `VREF[p.cu]` |
| `comprension.literal` | % de aciertos a la primera en preguntas literales, o `null` | `p.cn.l` (o `cnDer`) |
| `comprension.inferencial` | `[aciertos, preguntas]` de la última evaluación del tutor, o `null` | `evInf` |
| `dictado` | `[palabras bien escritas, practicadas]` o `null` | `p.dk` |
| `minutosSemana` | minutos de uso esta semana | `wkDays` |

## 5. Cuándo se escribe

- Unos **2 segundos después de cada guardado** (`save()`), con un temporizador que se reinicia; y **una vez al abrir**.
- Solo si el guardado de `ar2` fue bien (`saveRaw()` devolvió `true`).
- Solo si el contenido cambió (se compara sin `ts`): así no se reescriben 100 KB en cada respuesta.
- `try/catch`: si no cabe, se deja el resumen anterior (su `ts` dice de cuándo es). **No** toca `SVE` ni el aviso rojo.

## 6. Tamaño (límite del contrato: 150 KB)

Medido con el prototipo, todos los alumnos con los 44 niveles superados (el peor caso):

| Clase | Completo | Sin campos opcionales |
|---|---|---|
| 20 alumnos en el nivel 13 (un 1.º en noviembre) | 34 KB | 20 KB |
| 25 alumnos al final | 144 KB | 76 KB |
| 30 alumnos al final | **173 KB** | 91 KB |

Regla: si el texto pasa de **150 000 caracteres**, se quitan de todos los items `intentos`, `superado` y `ayuda`;
si aún pasa, también `bloque`. Con eso, 30 alumnos caben siempre.
En Ajustes › Sistema › «Espacio usado», esta clave ya cuenta dentro de Lectori (`LSK` incluye todo lo que empieza por
`lectori.`): no hay que tocar nada.

## 7. Casos límite (comprobados con el prototipo)

| Caso | Resultado |
|---|---|
| Alumno recién creado | `items: []`, `extra.nivel: 1`, todo lo demás `null` o 0 |
| Nivel superado hoy (aún sin confirmar otro día) | `dominio: 50`, ámbar |
| Perfil antiguo sin `cf`: caja 3 / caja 0 | 100 verde / 0 rojo |
| Niveles saltados por el tutor, sin práctica | `dominio: null`, gris |
| Clase mixta simulada (70 % dominado, 20 % sin afianzar, 10 % fallado) | 160 verdes, 70 ámbar, 10 rojos de 240 items |

## 8. Qué se ve en Lectori (fase 7a)

Solo en la zona del tutor del perfil Docente: una fila informativa en Ajustes › Sistema, «Resumen para Tabula»
(«Actualizado hoy · 20 alumnos»). Nada en la zona infantil ni en el perfil Familias.

## 9. Pruebas que debe traer la fase 7a (`tests/tabula.test.mjs`)

1. Forma v2: `app`, `tipo`, `v`, `ts`, y los campos de cada alumno e item.
2. Los 45 `id` coinciden con la **lista congelada** del apartado 3 (falla si alguien renombra un `g`).
3. `dominio` y `semaforo` en los casos del apartado 7, y los umbrales 80 / 50.
4. El nivel en curso no sale como item; el último nivel sale si `hx[g].d` existe.
5. No aparecen `nt`, `cx`, `es`, `ev` ni `pin` en el texto del resumen.
6. 30 alumnos al final: no pasa de 150 000 caracteres (aplica el recorte).
7. Perfil Familias: no escribe y borra la clave. Modo Docente: no sale.
8. Almacenamiento lleno: no lanza error ni marca `SVE`.
9. Instalación limpia (sin datos de otras apps): todo pasa. No se escribe ninguna clave que no empiece por `lectori.`
   (además de `ar2`), y `ar2` sigue igual para Calculi (`ps[].n`, `ps[].av`, `ps[].id`).
10. `humo.py`: la fila nueva de Ajustes sin desbordes, en claro y oscuro, a 390 y 768.

## 10. Lo que NO decide este documento

- **Qué hace Tabula con el resumen** (columnas, si hay nota): decisión D6 y fase 7b, en el chat de Tabula.
- **El enlace `tb`** («Traer mi clase de Tabula»): fase 7c; depende de que Tabula publique `tabula:eco:lista`.
- **Nube**: reservado (fase 4 de `ECOSISTEMA.md`). No se sube nada sin preguntar antes.
