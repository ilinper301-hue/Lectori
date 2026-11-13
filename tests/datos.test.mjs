// Pruebas de datos: migración de perfiles antiguos, limpieza de copias, dominio de letras,
// racha, velocidad lectora y evaluación. Nunca se puede perder el progreso de un niño.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cargar } from './cargar.mjs';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORDER = cargar().json('ORDER');
const ORD0 = cargar().json('ORD0');
const J = x => JSON.parse(JSON.stringify(x));
const dia = (d, off = 0) => { // «YYYY-MM-DD» local, `off` días antes de `d`
  const x = new Date(d); x.setDate(x.getDate() - off);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

/* ================= migLv / migOrd (orden antiguo de letras → nuevo) ================= */

test('migLv: tabla de equivalencias del orden antiguo al nuevo', () => {
  const L = cargar();
  const esperado = { 0: 0, 5: 5, 17: 17, 18: 18, 19: 19, 20: 19, 21: 20, 22: 21, 23: 22, 24: 23, 25: 24, 26: 24, 27: 24, 28: 25 };
  for (const [antes, despues] of Object.entries(esperado)) assert.equal(L.ev(`migLv(${antes})`), despues, `nivel antiguo ${antes}`);
});

test('migLv: nunca marca como aprendida una letra que el niño no había aprendido', () => {
  const L = cargar();
  let previo = -1;
  for (let a = 0; a < ORD0.length; a++) {
    const n = L.ev(`migLv(${a})`);
    const sabidas = new Set(ORD0.slice(0, a));
    ORDER.slice(0, n).forEach(u => assert.ok(sabidas.has(u), `nivel ${a}: la «${u}» queda como aprendida sin estarlo`));
    assert.ok(n <= a, `nivel ${a} no debe avanzar (da ${n})`);
    assert.ok(n >= previo, 'debe ser no decreciente');
    previo = n;
  }
});

test('migLv: valores fuera de rango o que no son número se devuelven igual', () => {
  const L = cargar();
  assert.equal(L.ev('migLv(-1)'), -1);
  assert.equal(L.ev('migLv(29)'), 29);
  assert.equal(L.ev('migLv(30)'), 30);
  assert.equal(L.ev('migLv("x")'), 'x');
  assert.equal(L.ev('migLv(undefined)'), undefined);
});

test('migOrd: perfil antiguo → nuevo sin perder datos (nivel, evaluaciones, ajustes)', () => {
  const L = cargar();
  const viejo = {
    ps: [
      { id: 'a1b2c3d4', n: 'Ana', lv: 20, st: 12, pg: { s: 'pal' }, al: { s: 'pal' }, ev: [{ lv: 20, d: '2026-01-01' }, { lv: 3 }, null], s: { a: { b: 3, d: 1 } } },
      { id: 'e5f6g7h8', n: 'Leo', lv: 5, st: 3, pg: { s: 'son' }, al: { s: 'son' } },
      { id: 'i9j0k1l2', n: 'Eva', lv: 29, st: 99 },
    ],
    md: { lv: 25, pg: { s: 'son' } },
  };
  L.ev(`var __o=${JSON.stringify(viejo)};migOrd(__o)`);
  const o = L.json('__o');
  assert.equal(o.ov, 2);
  // Ana estaba en la «c» (antigua 20) → ahora en la «c» (19); se borra el progreso a medias de ese nivel.
  assert.equal(o.ps[0].lv, 19);
  assert.equal(o.ps[0].pg, undefined);
  assert.equal(o.ps[0].al, undefined);
  assert.equal(o.ps[0].st, 12);
  assert.deepEqual(o.ps[0].s, { a: { b: 3, d: 1 } });
  assert.deepEqual(o.ps[0].ev, [{ lv: 19, d: '2026-01-01' }, { lv: 3 }, null]);
  // Leo no cambia de nivel: conserva incluso el subnivel en que iba.
  assert.equal(o.ps[1].lv, 5);
  assert.deepEqual(o.ps[1].pg, { s: 'son' });
  assert.deepEqual(o.ps[1].al, { s: 'son' });
  // Quien ya terminó las letras (29) no se toca.
  assert.equal(o.ps[2].lv, 29);
  // Modo docente: la antigua «w» (25) es ahora el 27.
  assert.equal(o.md.lv, 27);
  assert.equal(o.md.pg, undefined);
});

test('migOrd: no toca copias ya migradas (ov ≥ 2), es idempotente y tolera basura', () => {
  const L = cargar();
  const nuevo = { ov: 2, ps: [{ id: 'zzzzzzzz', n: 'Pía', lv: 20, pg: { s: 'son' } }] };
  L.ev(`var __n=${JSON.stringify(nuevo)};migOrd(__n)`);
  assert.deepEqual(L.json('__n'), nuevo);
  const viejo = { ps: [{ id: 'yyyyyyyy', n: 'Tito', lv: 22 }] };
  L.ev(`var __v=${JSON.stringify(viejo)};migOrd(__v);migOrd(__v)`);
  assert.equal(L.json('__v.ps[0].lv'), 21);
  for (const x of ['null', 'undefined', '{}', '{ps:null}', '{ps:[{}]}', '{ps:[{lv:"x"}]}']) assert.doesNotThrow(() => L.ev(`migOrd(${x})`), x);
});

test('al arrancar con datos guardados antiguos se migran y cada niño recibe un id', () => {
  const guardado = { ps: [{ n: 'Sin id', lv: 21 }, { id: 'abc12345', n: 'Con id', lv: 4 }], c: 0 };
  const L = cargar({ ls: { ar2: JSON.stringify(guardado) } });
  const P = L.json('P');
  assert.equal(P.ov, 2);
  assert.equal(P.ps[0].lv, 20);
  assert.ok(/^[a-z0-9]{6,20}$/.test(P.ps[0].id), 'id generado');
  assert.equal(P.ps[1].id, 'abc12345');
  assert.equal(P.ps[1].lv, 4);
});

test('al arrancar con datos guardados rotos, empieza vacío sin fallar', () => {
  for (const malo of ['{{no es json', 'null', '"texto"', '{"sinps":1}']) {
    const L = cargar({ ls: { ar2: malo } });
    assert.deepEqual(L.json('({ps:P.ps,c:P.c})'), { ps: [], c: -1 }, malo);
  }
});

/* ================= cleanP (limpieza de copias de seguridad y de la nube) ================= */

test('cleanP: un perfil vacío recibe valores por defecto válidos', () => {
  const L = cargar();
  const p = L.json('cleanP({})');
  assert.match(p.id, /^[a-z0-9]{6,20}$/);
  assert.equal(p.n, 'Niño');
  assert.equal(p.lv, 0);
  assert.equal(p.st, 0);
  assert.equal(p.lim, 15);
  assert.equal(p.tz, '2');
  assert.equal(p.rm, 't');
  assert.equal(p.mt, 0);
  for (const k of ['vl', 'ev', 'es', 'nt', 'rr']) assert.deepEqual(p[k], [], k);
  for (const k of ['s', 'd', 'er', 'cf', 'dk', 'rd', 'cq', 'hf', 'ws']) assert.deepEqual(p[k], {}, k);
});

test('cleanP: nombres con símbolos o demasiado largos', () => {
  const L = cargar();
  const n = x => L.ev(`cleanP({n:${JSON.stringify(x)}}).n`);
  assert.equal(n('<b>Ana</b>'), 'bAna/b');
  assert.equal(n('Pe"pe\'`&'), 'Pepe');
  assert.equal(n('<>&'), 'Niño');
  assert.equal(n(''), 'Niño');
  assert.equal(n(null), 'Niño');
  assert.equal(n('A'.repeat(50)), 'A'.repeat(20));
  assert.equal(n('Ñandú Ünico'), 'Ñandú Ünico');
  assert.equal(L.ev('cleanP({n:12345}).n'), '12345');
});

test('cleanP: el nivel, el límite diario y el tamaño de letra se mantienen dentro de lo permitido', () => {
  const L = cargar();
  const c = o => L.json(`cleanP(${JSON.stringify(o)})`);
  assert.equal(c({ lv: 999 }).lv, 44);
  assert.equal(c({ lv: -5 }).lv, 0);
  assert.equal(c({ lv: 'x' }).lv, 0);
  assert.equal(c({ lv: 17 }).lv, 17);
  assert.equal(c({ lim: 7 }).lim, 15);
  assert.equal(c({ lim: 0 }).lim, 0);
  assert.equal(c({ lim: 30 }).lim, 30);
  assert.equal(c({ tz: 'M' }).tz, 'M');
  assert.equal(c({ tz: 'zz' }).tz, '2');
  assert.equal(c({ rm: 'm' }).rm, 'm');
  assert.equal(c({ rm: 'otro' }).rm, 't');
  assert.equal(c({ st: -4 }).st, 0);
  assert.equal(c({ av: 3 }).av, 3);
  assert.equal('av' in c({ av: 9999 }), false);
  assert.equal('av' in c({ av: 'x' }), false);
  assert.equal(c({ id: 'abc12345' }).id, 'abc12345');
  assert.notEqual(c({ id: '<script>' }).id, '<script>');
});

test('cleanP: copia vieja con pocos campos conserva lo importante', () => {
  const L = cargar();
  const vieja = { id: 'viejo123', n: 'Mar', lv: 8, st: 40, s: { a: { b: 5, d: 123 }, m: { b: 2, d: 456 } }, er: { a: { a: 10, e: 3 } } };
  const p = L.json(`cleanP(${JSON.stringify(vieja)})`);
  assert.equal(p.id, 'viejo123');
  assert.equal(p.lv, 8);
  assert.equal(p.st, 40);
  assert.deepEqual(p.s, vieja.s);
  assert.deepEqual(p.er, vieja.er);
});

test('cleanP: campos raros o mal formados no rompen nada y se descartan o se corrigen', () => {
  const L = cargar();
  const raro = {
    n: 'Raro', lv: '7', evil: '<img onerror=x>', __proto__x: 1,
    s: { a: { b: 99, d: 5 }, e: { b: -3, d: 6 }, i: 'no', o: null, u: { d: 'x' } },
    d: { '2026-05-01': { t: -10, s: 'x', a: 3, o: 2 }, 'hoy': { t: 5 }, '2026-05-02': null },
    er: { a: { a: 2.7, e: '1' }, b: 'x', c: null },
    vl: [{ s: 'x' }, null, { d: '2026-01-01', s: 30, w: 20, e: 2, n: 9.5 }],
    nt: [{ d: '2026-01-01', x: 'x'.repeat(2000) }, { x: 5 }],
    es: 'no es lista', ev: { no: 1 }, rr: 'x', cf: { a: { d: 'x'.repeat(40), c: 'y'.repeat(40) }, b: { c: 'solo' } },
    pg: 'raro', al: { s: 'inexistente' },
  };
  let p;
  assert.doesNotThrow(() => { p = L.json(`cleanP(${JSON.stringify(raro)})`); });
  assert.equal(p.lv, 7);
  assert.equal('evil' in p, false);
  assert.deepEqual(p.s, { a: { b: 5, d: 5 }, e: { b: 0, d: 6 } });   // caja limitada a 0–5
  assert.deepEqual(p.d, { '2026-05-01': { t: 0, s: 0, a: 3, o: 2 } }); // solo fechas válidas, sin negativos
  assert.deepEqual(p.er, { a: { a: 2, e: 1 } });
  assert.deepEqual(p.vl, [{ d: '2026-01-01', n: 9, s: 30, w: 20, e: 2 }]);
  assert.equal(p.nt.length, 2);
  assert.equal(p.nt[0].x.length, 600);
  assert.deepEqual(p.nt[1], { d: '', x: '5' });
  assert.deepEqual(p.es, []); assert.deepEqual(p.ev, []); assert.deepEqual(p.rr, []);
  assert.deepEqual(p.cf, { a: { d: 'x'.repeat(10), c: 'y'.repeat(10) } });
  assert.equal('pg' in p, false);
  assert.equal('al' in p, false);
});

// Fallo conocido (se anota en ESTADO.md, aún sin arreglar): una entrada vacía (null) dentro de nt, ev o es
// hace que cleanP lance un error; al restaurar una copia con eso, se rechaza la copia entera («no es una copia
// válida»), y en la nube se salta ese alumno. Es `todo`: se ejecuta, se ve el fallo, pero no rompe `node --test`.
// Cuando se arregle (fase 2), quitar `todo`.
test('cleanP: tolera entradas vacías (null) en notas, evaluaciones y sesiones', { todo: 'conocido: lanza TypeError' }, () => {
  const L = cargar();
  for (const campo of ['nt', 'ev', 'es'])
    assert.doesNotThrow(() => L.ev(`cleanP({${campo}:[null,{d:'2026-01-01'}]})`), campo);
});

test('cleanP: aplicarla dos veces da lo mismo (no se pierde nada al sincronizar)', () => {
  const L = cargar();
  const rico = {
    id: 'rico1234', mt: 1700000000000, n: 'Rico', av: 5, lv: 12, st: 80, lim: 20, tz: 'M', rm: 'm', ft: 'l', cu: '1',
    s: { a: { b: 4, d: 10 }, la: { b: 1, d: 20 } }, ws: { mesa: { b: 2, d: 30 } },
    er: { a: { a: 9, e: 2 } }, hf: { el: 3 }, cq: { 5: { a: 4, o: 3 } }, cqn: 7, dk: { sol: { a: 2, o: 1, l: 1 } },
    cf: { a: { d: '2026-05-01', c: '2026-05-03' }, la: { d: '2026-05-02' } }, rd: { 4: { n: 2, l: 3, b: 5, d: '2026-05-01' } },
    d: { '2026-05-01': { t: 300, s: 12, a: 40, o: 31 } },
    vl: [{ d: '2026-05-01', n: 1, s: 60, w: 30, e: 2 }],
    ev: [{ d: '2026-05-01', lv: 5, h: 'x' }],
    es: [{ d: '2026-05-01', N: 1, rec: 5, r: [['lb', 'm', 1, 0, 3, 0, 0]] }],
    nt: [{ d: '2026-05-01', x: 'Va bien' }],
    rr: [{ d: '2026-05-01', t: 60, w: 30, r: [1, 2] }],
    pg: { i: 12, s: 'sil', k: 1, o: 2, n: 3, h: 0, f: 1, rw: [1, 2], bs: [], rs: [], wx: [], wu: ['a'], pw: 'xy' },
    al: { i: 12, s: 'pal', f: 3, t: 99 },
    pa: { a: 5, o: 4 },
  };
  const una = L.json(`cleanP(${JSON.stringify(rico)})`);
  const dos = L.json(`cleanP(${JSON.stringify(una)})`);
  assert.deepEqual(dos, una);
  // y lo importante se ha conservado
  for (const k of ['id', 'mt', 'n', 'av', 'lv', 'st', 'lim', 'tz', 'rm', 's', 'ws', 'er', 'hf', 'cq', 'dk', 'cf', 'rd', 'd', 'vl', 'es', 'nt', 'rr', 'pg', 'al', 'pa', 'ft', 'cu'])
    assert.deepEqual(una[k], rico[k], `se perdió «${k}»`);
});

/* ================= domS (letras y sílabas dominadas / en proceso) ================= */

test('domS: sin progreso no hay nada dominado', () => {
  const L = cargar();
  assert.deepEqual(L.json('domS({lv:0})'), { ok: [], pd: [] });
  assert.deepEqual(L.json('domS({lv:2})'), { ok: [], pd: ['a', 'e'] });
});

test('domS: sin confirmaciones (copias viejas) manda la caja de repaso ≥ 2', () => {
  const L = cargar();
  const r = L.json('domS({lv:3,s:{a:{b:2},e:{b:1},i:{b:5}}})');
  assert.deepEqual(r, { ok: ['a', 'i'], pd: ['e'] });
});

test('domS: con confirmaciones (cf) manda cf[k].c', () => {
  const L = cargar();
  const r = L.json("domS({lv:3,s:{a:{b:5},e:{b:5},i:{b:0}},cf:{a:{d:'x'},e:{d:'x',c:'y'}}})");
  assert.deepEqual(r, { ok: ['e'], pd: ['a', 'i'] });
});

test('domS: la letra del nivel actual cuenta como «en proceso» si ya se ha practicado', () => {
  const L = cargar();
  assert.deepEqual(L.json('domS({lv:2,s:{i:{b:1}}})').pd, ['a', 'e', 'i']);
  assert.deepEqual(L.json('domS({lv:2,s:{i:{b:0}}})').pd, ['a', 'e']);
});

test('domS: niveles extra usan sus sílabas (no el título) y no repite claves', () => {
  const L = cargar();
  const r = L.json('domS({lv:30,s:{}})');
  const todas = [...r.ok, ...r.pd];
  assert.ok(todas.includes('al') && todas.includes('el'));
  assert.equal(todas.length, new Set(todas).size, 'claves repetidas');
  assert.ok(!todas.some(k => k.includes(' ')), 'se coló un título de nivel extra');
  assert.doesNotThrow(() => L.ev('domS({lv:100})'));
});

/* ================= streak (racha de días) ================= */

const HOY = new Date(2026, 10, 13, 10, 0, 0).getTime(); // 13-nov-2026 10:00 (hora local)
const racha = dias => {
  const L = cargar({ ahora: HOY });
  const d = {};
  for (const [off, t] of Object.entries(dias)) d[dia(HOY, +off)] = { t };
  return L.ev(`streak(${JSON.stringify({ d })})`);
};

test('streak: sin días no hay racha', () => {
  const L = cargar({ ahora: HOY });
  assert.equal(L.ev('streak({})'), 0);
  assert.equal(L.ev('streak({d:{}})'), 0);
});

test('streak: cuenta días seguidos con al menos 60 s, incluyendo hoy', () => {
  assert.equal(racha({ 0: 60, 1: 120, 2: 90 }), 3);
});

test('streak: si hoy aún no llega a 60 s, la racha cuenta desde ayer', () => {
  assert.equal(racha({ 0: 59, 1: 60, 2: 60 }), 2);
  assert.equal(racha({ 1: 60, 2: 60 }), 2);
});

test('streak: un día sin practicar corta la racha', () => {
  assert.equal(racha({ 0: 100, 2: 100, 3: 100 }), 1);
  assert.equal(racha({ 2: 100, 3: 100 }), 0);
});

test('streak: cruza el cambio de mes y de año sin fallar', () => {
  const L = cargar({ ahora: new Date(2027, 0, 2, 9, 0, 0).getTime() });
  const d = {};
  for (let i = 0; i < 5; i++) d[dia(new Date(2027, 0, 2).getTime(), i)] = { t: 70 };
  assert.equal(L.ev(`streak(${JSON.stringify({ d })})`), 5); // 2 ene, 1 ene, 31 dic, 30 dic, 29 dic
});

/* ================= cwpm (palabras correctas por minuto) ================= */

test('cwpm: palabras leídas menos errores, por minuto', () => {
  const L = cargar();
  const c = (w, e, s) => L.ev(`cwpm({w:${w},e:${e},s:${s}})`);
  assert.equal(c(30, 0, 60), 30);
  assert.equal(c(30, 5, 60), 25);
  assert.equal(c(45, 0, 30), 90);
  assert.equal(c(10, 0, 40), 15);
  assert.equal(c(1, 0, 40), 2);      // 1,5 → redondea a 2
  assert.equal(c(10, 20, 60), 0);    // más errores que palabras: nunca negativo
  assert.equal(c(0, 0, 60), 0);
});

/* ================= evStats / evRec (evaluación lectora) ================= */
// Cada respuesta: [sección, dato, acierto(1/0), tipo de error, nivel, fase, techo]

const FILAS = [
  ['lb', 'm', 1, 0, 5, 0, 0],
  ['lb', 's', 0, 1, 6, 0, 0],
  ['pw', 'mesa', 0, 2, 10, 0, 1],
  ['pw', 'sol', 1, 0, 8, 1, 0],
];

test('evStats: cuenta intentos, aciertos, errores por tipo y techo', () => {
  const L = cargar();
  const S = L.json(`evStats(${JSON.stringify(FILAS)})`);
  assert.equal(S.secs.lb.a, 2); assert.equal(S.secs.lb.o, 1);
  assert.deepEqual(S.secs.lb.bad, [['s', 6, 1]]);
  assert.equal(S.secs.pw.a, 2); assert.equal(S.secs.pw.o, 1);
  assert.deepEqual(S.secs.pw.bad, [['mesa', 10, 2]]);
  assert.deepEqual(S.secs.pw.k['1'], [1, 1]);
  assert.deepEqual(S.err, [0, 1, 1, 0, 0, 0]);
  const cat = n => S.cats.find(c => c.n === n);
  assert.equal(cat('Letras y grafemas').a, 2);
  assert.equal(cat('Palabras').o, 1);
  assert.equal(cat('Palabras').stp, true);
  assert.equal(cat('Sílabas').a, 0);
});

test('evStats: una evaluación vacía no falla y no cuenta nada', () => {
  const L = cargar();
  const S = L.json('evStats([])');
  assert.deepEqual(S.err, [0, 0, 0, 0, 0, 0]);
  assert.ok(Object.values(S.secs).every(s => s.a === 0 && s.o === 0));
  assert.ok(S.cats.every(c => c.a === 0 && c.stp === false));
});

test('evRec: recomienda el nivel más bajo donde falló en una sección no consolidada', () => {
  const L = cargar();
  assert.equal(L.ev(`evRec(${JSON.stringify(FILAS)})`), 6);
});

test('evRec: si todo está consolidado, recomienda el nivel siguiente al más alto evaluado', () => {
  const L = cargar();
  const ok = [['lb', 'm', 1, 0, 5, 0, 0], ['lb', 's', 1, 0, 8, 0, 0], ['sd', 'ma', 1, 0, 8, 0, 0]];
  assert.equal(L.ev(`evRec(${JSON.stringify(ok)})`), 9);
  assert.equal(L.ev(`evRec([['lb','x',1,0,44,0,0]])`), 44, 'no pasa del último nivel');
  assert.equal(L.ev('evRec([])'), 1);
});

test('evRec: las respuestas de las fases 2 y 3 no cuentan para el techo', () => {
  const L = cargar();
  const filas = [['sd', 'ma', 0, 1, 20, 2, 0]]; // fallo en fase 2: se cuenta como intento pero no como techo
  assert.equal(L.ev(`evRec(${JSON.stringify(filas)})`), 1);
  assert.deepEqual(L.json(`evStats(${JSON.stringify(filas)})`).err, [0, 0, 0, 0, 0, 0]);
});

/* ================= Contratos con otras apps (no se pueden romper) ================= */

test('contrato con Calculi: ar2 guarda ps[].n, ps[].av y ps[].id', () => {
  const L = cargar();
  L.ev("P.ps=[{id:'abc12345',n:'Ana',lv:3,st:0,av:4},{id:'def67890',n:'Leo',lv:0,st:0}];P.c=0;save()");
  const guardado = JSON.parse(L.localStorage.getItem('ar2'));
  assert.ok(Array.isArray(guardado.ps) && guardado.ps.length === 2);
  assert.equal(guardado.ps[0].n, 'Ana');
  assert.equal(guardado.ps[0].av, 4);
  assert.equal(guardado.ps[0].id, 'abc12345');
  assert.equal(guardado.ps[1].n, 'Leo');
  assert.ok(guardado.ps[0].mt > 0, 'save() marca la fecha de cambio del perfil activo');
  assert.ok(guardado.gmt > 0);
});

test('contrato: la app no escribe en el almacenamiento claves de otras apps', () => {
  const L = cargar({ ls: { 'calc.tabula': 'x', 'tabula.algo': 'y' } });
  L.ev("P.ps=[{id:'abc12345',n:'Ana',lv:0,st:0}];P.c=0;save();setTheme('dark')");
  const claves = [...L.localStorage._datos.keys()];
  const ajenas = claves.filter(k => !(k === 'ar2' || k === 'arth' || k === 'arv' || k === 'arbk' || k === 'ari' || k === 'arm' || k.startsWith('lectori.')) && k !== 'calc.tabula' && k !== 'tabula.algo');
  assert.deepEqual(ajenas, []);
  assert.equal(L.localStorage.getItem('calc.tabula'), 'x');
  assert.equal(L.localStorage.getItem('tabula.algo'), 'y');
});

test('contrato: la caché del service worker se llama lectori-vN y solo borra cachés lectori-*', () => {
  const sw = fs.readFileSync(path.join(RAIZ, 'sw.js'), 'utf8');
  const m = sw.match(/const C='(lectori-v\d+)'/);
  assert.ok(m, 'sw.js debe tener const C=\'lectori-vN\'');
  assert.ok(sw.includes("x.startsWith('lectori-')&&x!==C"), 'solo debe borrar cachés lectori-* antiguas');
});

test('contrato: el manifiesto se queda en la carpeta de la app y el repositorio mantiene index.html en la raíz', () => {
  const man = JSON.parse(fs.readFileSync(path.join(RAIZ, 'manifest.json'), 'utf8'));
  assert.equal(man.start_url, './');
  assert.equal(man.scope, './');
  assert.ok(fs.existsSync(path.join(RAIZ, 'index.html')));
});

test('la versión visible (VER) existe en index.html', () => {
  const L = cargar();
  assert.match(L.ev('VER'), /^\d+\.\d+ · /);
});
