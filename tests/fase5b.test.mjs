// Fase 5b: arreglos de la revisión de datos y nube (más allá de `revision.test.mjs`, que reproduce H1–H8)
// y las «Otras observaciones» decididas con el tutor: copia automática fallida, alumnos con el mismo nombre, reiniciar todo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cargar } from './cargar.mjs';

const alu = (id, o = {}) => ({ id, n: 'Niño ' + id, mt: 1000, lv: 3, st: 10, s: { a: { b: 2, d: 5 } }, d: {}, er: {}, ...o });
const con = (ps, extra = {}, ls = {}) => cargar({ ls: { ar2: JSON.stringify({ ps, c: ps.length ? 0 : -1, ov: 2, rol: 'doc', pin: 'x1', ...extra }), ...ls } });
const merge = (L, a, b, rz = 0) => L.json(`mergeP(${JSON.stringify(a)},${JSON.stringify(b)},${rz})`);
// IndexedDB que existe pero falla (por ejemplo, almacenamiento lleno)
const idbRoto = L => { L.ctx.indexedDB = { open() { throw new Error('lleno'); } }; };
const espera = () => new Promise(r => setImmediate(r));

test('mergeP · nivel: el mayor, con su «por dónde va»; estrellas: las mayores', () => {
  const L = con([]);
  const nueva = alu('ana12345', { mt: 5000, lv: 4, st: 60, pg: { i: 4, s: 'son' } });
  const vieja = alu('ana12345', { mt: 2000, lv: 7, st: 90, pg: { i: 7, s: 'pal' } });
  for (const o of [merge(L, nueva, vieja), merge(L, vieja, nueva)]) {
    assert.equal(o.lv, 7);
    assert.equal(o.st, 90);
    assert.equal(o.pg.i, 7, 'el «por dónde va» es el del nivel elegido');
  }
});

test('mergeP · si el tutor puso el nivel a mano (lz) después de lo último del otro lado, manda el tutor', () => {
  const L = con([]);
  const tutor = alu('ana12345', { mt: 5000, lz: 5000, lv: 2, st: 60 });
  const atrasada = alu('ana12345', { mt: 3000, lv: 7, st: 90 });
  assert.equal(merge(L, tutor, atrasada).lv, 2);
  assert.equal(merge(L, atrasada, tutor).lv, 2);
  // …pero si el niño siguió practicando en el otro después, el nivel no baja (el mayor)
  const despues = alu('ana12345', { mt: 6000, lv: 7, st: 95 });
  assert.equal(merge(L, tutor, despues).lv, 7);
  // setLv deja la marca
  const T = con([alu('ana12345', { lv: 5 })]);
  T.ctx.document.getElementById = () => ({ value: '2' });
  T.ev('setLv()');
  assert.equal(T.json('P.ps[0].lv'), 2);
  assert.ok(T.json('P.ps[0].lz') > 0, 'lz guardado');
  assert.equal(T.json('cleanP(P.ps[0]).lz'), T.json('P.ps[0].lz'), 'cleanP conserva lz');
});

test('mergeP · cajas y confirmaciones: las de la versión que practicó la letra más tarde', () => {
  const L = con([]);
  const H = 3600e3, D = 864e5, t0 = 1.79e12;
  // INT = [0, 10 min, 1 día, 3 días, 7 días, 14 días]; practicada = d − INT[b]
  const a = alu('ana12345', { mt: 9000, s: { m: { b: 4, d: t0 + 7 * D }, l: { b: 2, d: t0 + D } }, cf: { m: { d: '2026-11-01', c: '2026-11-03' }, l: { d: '2026-11-01' } } });
  const b = alu('ana12345', { mt: 1000, s: { m: { b: 0, d: t0 + 5 * H }, l: { b: 1, d: t0 - 2 * H } } });
  const o = merge(L, a, b);
  assert.deepEqual(o.s.m, { b: 0, d: t0 + 5 * H }, 'm: la practicó más tarde en b (y falló)');
  assert.equal(o.cf.m.c, undefined, 'con el fallo más reciente, la letra deja de estar «dominada»');
  assert.deepEqual(o.s.l, { b: 2, d: t0 + D }, 'l: la practicó más tarde en a');
  assert.deepEqual(o.cf.l, { d: '2026-11-01' });
  // y palabras (ws) igual
  const w = merge(L, alu('ana12345', { mt: 9000, ws: { mano: { b: 1, d: t0 } } }), alu('ana12345', { mt: 1, ws: { mano: { b: 3, d: t0 + 3 * D + H } } }));
  assert.equal(w.ws.mano.b, 3);
});

test('mergeP · reinicio remoto (rz) conserva las notas del tutor; e (tiempo agotado) se conserva', () => {
  const L = con([]);
  const o = merge(L, alu('ana12345', { mt: 3000, rz: 3000, lv: 0, st: 0, s: {} }), alu('ana12345', { mt: 1000, nt: [{ d: '2026-11-01', x: 'Nota' }] }), 1);
  assert.equal(o.lv, 0);
  assert.equal(o.nt.length, 1);
  assert.equal(L.json(`cleanP(${JSON.stringify(alu('x1234567', { e: 1794800000000 }))}).e`), 1794800000000);
});

test('perfil 3.40 completo: cleanP idempotente y juntarlo consigo mismo no cambia nada', () => {
  const L = con([]);
  const p = alu('ana12345', {
    mt: 5000, lv: 12, st: 140, rm: 's', ft: 'l', lim: 20, e: 1794800000000, lz: 4000,
    s: { a: { b: 5, d: 2e12 }, m: { b: 3, d: 1.9e12 } }, ws: { mama: { b: 2, d: 1.8e12 } },
    cf: { a: { d: '2026-10-01', c: '2026-10-03' }, m: { d: '2026-10-10' } },
    cx: { 'b>d': 3, 'w:pato>gato': 1 }, hx: { m: { b: '2026-10-05', d: '2026-10-10', t: { son: 2, pal: 4 }, r: ['pal'] } },
    cn: { l: { a: 8, o: 6 } }, lm: { a: 10, o: 8 }, vl: [{ d: '2026-10-01', n: 1, s: 60, w: 30, e: 2, m: 1 }],
    nt: [{ d: '2026-10-02', x: 'Bien' }], d: { '2026-10-01': { t: 600, s: 5, a: 30, o: 25 } },
  });
  const c = L.json(`cleanP(${JSON.stringify(p)})`);
  assert.deepEqual(L.json(`cleanP(${JSON.stringify(c)})`), c);
  assert.deepEqual(merge(L, c, c), c);
  for (const k of ['lz', 'e', 'cx', 'hx', 'cn', 'lm', 'cf', 'ws']) assert.ok(k in c, k);
});

test('reiniciar progreso: borra todo el progreso y conserva días, velocidad, evaluaciones, lecturas y notas', async () => {
  const L = con([alu('ana12345', {
    lv: 9, st: 120, cf: { a: { d: '2026-10-01' } }, hx: { m: { d: '2026-10-10', t: {} } }, ws: { mama: { b: 2, d: 1 } }, lm: { a: 5, o: 4 },
    cx: { 'b>d': 2 }, cn: { l: { a: 3, o: 2 } }, cq: { x: { a: 3, o: 2 } }, dk: { mama: { a: 2, o: 1, l: 0 } }, hf: { el: 3 }, pa: { a: 4, o: 3 },
    vl: [{ d: '2026-10-01', n: 1, s: 60, w: 30, e: 2 }], ev: [{ d: '2026-10-01', lv: 3, h: 'x' }], nt: [{ d: '2026-10-02', x: 'Nota' }],
    rd: { t1: { n: 2, l: 30, b: 20, d: '2026-10-01' } }, d: { '2026-10-01': { t: 600, s: 5, a: 30, o: 25 } }, rm: 's',
  })]);
  L.ev('resetP()');
  await espera();
  const p = L.json('cleanP(P.ps[0])');
  assert.equal(p.lv, 0); assert.equal(p.st, 0);
  for (const k of ['cf', 'ws', 's', 'er', 'cq', 'dk', 'hf']) assert.deepEqual(p[k], {}, k);
  for (const k of ['hx', 'lm', 'cx', 'cn', 'pa']) assert.equal(p[k], undefined, k);
  assert.equal(p.vl.length, 1); assert.equal(p.ev.length, 1); assert.equal(p.nt.length, 1);
  assert.equal(Object.keys(p.rd).length, 1); assert.equal(Object.keys(p.d).length, 1); assert.equal(p.rm, 's');
  assert.ok(p.rz > 0);
  assert.equal(L.json('BKM').length, 1, 'copia automática previa');
});

test('copia automática fallida: avisa antes de reiniciar, borrar, sustituir o usar lo de la cuenta; «Seguir» continúa', async () => {
  const L = con([alu('ana12345', { lv: 9 }), alu('luis1234')]);
  idbRoto(L);
  L.ev('P.c=0;resetP()');
  await espera();
  assert.equal(L.json('P.ps[0].lv'), 9, 'no reinicia sin avisar');
  assert.equal(L.ev('typeof BKF'), 'function', 'se muestra el aviso');
  L.ev('BKF()');
  assert.equal(L.json('P.ps[0].lv'), 0, '«Seguir» reinicia');

  L.ev('P.c=1;delP()');
  await espera();
  assert.equal(L.json('P.ps.length'), 2, 'no borra sin avisar');
  L.ev('BKF()');
  assert.deepEqual(L.json('P.ps.map(q=>q.id)'), ['ana12345']);

  L.ctx.__copia = JSON.stringify({ v: 1, P: { ps: [alu('rosa1234')] } });
  L.ev("readCopy(__copia,'copia')");
  await L.ev("applyImp('rep')");
  assert.deepEqual(L.json('P.ps.map(q=>q.id)'), ['ana12345'], 'no sustituye sin avisar');
  await L.ev('BKF()');
  assert.deepEqual(L.json('P.ps.map(q=>q.id)'), ['rosa1234']);

  // Sin IndexedDB (no hay dónde guardarla): como antes, se hace en memoria y no se pregunta
  const M = con([alu('ana12345', { lv: 9 })]);
  M.ev('P.c=0;resetP()');
  assert.equal(M.json('P.ps[0].lv'), 0);
});

test('«Usar lo de la cuenta» desde la tarjeta: una sola copia automática', async () => {
  const L = con([alu('ana12345', { lv: 2, nt: [{ d: '2026-10-01', x: 'Nota' }] })], {}, { 'lectori.sync.uid': 'otro' });
  let ok = 0;
  L.ctx.syncNow = async m => { ok = m; };
  L.ev('SYNC.ask={u:"u1",ln:1,rn:1,rt:0};syncPick("down")');
  await espera();
  assert.equal(ok, 'down');
  assert.equal(L.json('SYNC.nobk'), 1, 'syncNow no repetirá la copia');
  assert.equal(L.json('BKM').length, 1);
});

test('alumnos con el mismo nombre: aviso en la zona del tutor, que se puede callar', () => {
  const L = con([alu('ana12345', { n: 'Ana' }), alu('ana67890', { n: 'ana ' }), alu('luis1234', { n: 'Luis' })]);
  assert.deepEqual(L.json('dupList()'), [['Ana', 'ana ']]);
  assert.match(L.ev('dupWarn()'), /mismo nombre/);
  L.ctx.panel = () => {};
  L.ev('dupOk()');
  assert.deepEqual(L.json('dupList()'), []);
  assert.equal(L.ev('dupWarn()'), '');
  const F = con([alu('ana12345', { n: 'Ana' }), alu('ana67890', { n: 'Ana' })], { rol: 'fam' });
  assert.equal(F.ev('dupWarn()'), '', 'en Familias no se avisa');
});

test('datos ilegibles al abrir: se guardan aparte, en copia automática, y hay aviso', async () => {
  const roto = '{"ps":[{"id":"ana12345","n":"Ana","lv":7';
  const L = cargar({ ls: { ar2: roto } });
  assert.equal(L.localStorage.getItem('lectori.ar2.roto'), roto);
  await espera();
  const bk = L.json('BKM');
  assert.equal(bk.length, 1); assert.equal(bk[0].d, roto); assert.equal(bk[0].x, 1);
  assert.match(L.ev('rawWarn()'), /dañados/);
  assert.equal(L.ev('hmWarn()'), true, 'punto rojo en Inicio');
  L.ctx.panel = () => {};
  L.ev('rawDel()');
  assert.equal(L.ev('rawWarn()'), '');
  assert.equal(L.localStorage.getItem('lectori.ar2.roto'), null);
  // Lo normal: datos buenos, sin aviso ni copia
  const B = con([alu('ana12345')]);
  assert.equal(B.ev('rawWarn()'), '');
  assert.equal(B.localStorage.getItem('lectori.ar2.roto'), null);
});
