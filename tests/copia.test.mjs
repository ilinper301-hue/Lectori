// Copias de seguridad, restaurar («Añadir» / «Sustituir todo»), juntar alumnos, almacenamiento lleno (fase 2).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cargar } from './cargar.mjs';

const alu = (id, o = {}) => ({ id, n: 'Niño ' + id, mt: 1000, lv: 3, st: 10, s: { a: { b: 2, d: 5 } }, d: {}, er: {}, ...o });
const conPerfiles = (ps, extra = {}) => cargar({ ls: { ar2: JSON.stringify({ ps, c: ps.length ? 0 : -1, ov: 2, rol: 'doc', pin: 'x1', ...extra }) } });

// Ejecuta expo() y devuelve el texto del archivo que se descargaría.
function exportar(L) {
  L.ctx.Blob = function (partes) { L.ctx.__copia = partes[0]; };
  L.ev('expo()');
  return L.ctx.__copia;
}

const sinFecha = ps => ps.map(q => { const c = { ...q }; delete c.mt; return c; });

test('exportar → restaurar «Sustituir todo» deja exactamente lo mismo', async () => {
  const ps = [
    alu('ana12345', { d: { '2026-11-01': { t: 300, s: 5, a: 20, o: 15 } }, nt: [{ d: '2026-11-01', x: 'Lee despacio' }], vl: [{ d: '2026-11-02', n: 1, s: 40, w: 30, e: 1 }] }),
    alu('luis1234', { lv: 8, er: { b: { a: 4, e: 1 } } }),
  ];
  const A = conPerfiles(ps);
  const antes = A.json('P.ps.map(cleanP)');
  const txt = exportar(A);
  assert.equal(JSON.parse(txt).P.pin, undefined, 'la copia no lleva el PIN');
  const B = conPerfiles([]);
  B.ev(`readCopy(${JSON.stringify(txt)},'prueba')`);
  assert.equal(B.json('pend.length'), 2);
  await B.ev(`applyImp('rep')`);
  assert.deepEqual(sinFecha(B.json('P.ps.map(cleanP)')), sinFecha(antes));
});

test('restaurar «Añadir a lo que hay»: junta, no borra a nadie ni deja borrados', async () => {
  const A = conPerfiles([
    alu('ana12345', { mt: 5000, lv: 9, d: { '2026-11-10': { t: 100, s: 1, a: 5, o: 5 } }, nt: [{ d: '2026-11-10', x: 'Nueva' }] }),
    alu('pepe1234'),
  ]);
  const copia = { v: 1, P: { ps: [
    alu('ana12345', { mt: 1000, lv: 4, d: { '2026-10-01': { t: 200, s: 2, a: 9, o: 7 } }, nt: [{ d: '2026-10-01', x: 'Antigua' }] }),
    alu('rosa1234'),
  ] } };
  A.ev(`readCopy(${JSON.stringify(JSON.stringify(copia))})`);
  await A.ev(`applyImp('add')`);
  assert.deepEqual(A.json('P.ps.map(q=>q.id).sort()'), ['ana12345', 'pepe1234', 'rosa1234'], 'nadie desaparece');
  assert.deepEqual(A.json('P.del||{}'), {}, 'no se marca ningún borrado');
  const ana = A.json(`P.ps.find(q=>q.id==='ana12345')`);
  assert.equal(ana.lv, 9, 'una copia vieja no hace retroceder al niño');
  assert.deepEqual(Object.keys(ana.d).sort(), ['2026-10-01', '2026-11-10'], 'se juntan los días');
  assert.deepEqual(ana.nt.map(x => x.x), ['Antigua', 'Nueva'], 'se juntan las notas');
  assert.equal(A.json('BKM').length, 1, 'antes se guarda una copia automática');
});

test('restaurar «Sustituir todo»: copia automática previa y quita (también en la nube) a los que no están', async () => {
  const A = conPerfiles([alu('ana12345'), alu('pepe1234')]);
  A.ev(`readCopy(${JSON.stringify(JSON.stringify({ P: { ps: [alu('ana12345', { lv: 1 })] } }))})`);
  await A.ev(`applyImp('rep')`);
  assert.deepEqual(A.json('P.ps.map(q=>q.id)'), ['ana12345']);
  assert.ok(A.json('P.del').pepe1234 > 0, 'el que no está queda marcado como borrado');
  assert.equal(A.json('P.pin'), 'x1', 'se conserva el PIN');
  const bk = A.json('BKM');
  assert.equal(bk.length, 1);
  assert.deepEqual(JSON.parse(bk[0].d).ps.map(q => q.id), ['ana12345', 'pepe1234'], 'la copia automática tiene lo de antes');
});

test('una copia dañada se rechaza sin tocar nada; con alguna entrada vacía se acepta', () => {
  const A = conPerfiles([alu('ana12345')]);
  A.ev(`readCopy('esto no es json')`);
  assert.equal(A.ev('pend'), null);
  A.ev(`readCopy(${JSON.stringify(JSON.stringify({ P: { ps: [] } }))})`);
  assert.equal(A.ev('pend'), null);
  A.ev(`readCopy(${JSON.stringify(JSON.stringify({ P: { ps: [null, alu('x1234567', { nt: [null], es: [null] })] } }))})`);
  assert.equal(A.json('pend.length'), 1);
  assert.deepEqual(A.json('P.ps.map(q=>q.id)'), ['ana12345'], 'leer no cambia nada hasta elegir');
});

test('mergeP: el resultado no depende del orden y juntar otra vez no cambia nada', () => {
  const L = conPerfiles([]);
  const a = alu('ana12345', { mt: 2000, lv: 6, d: { x1: {} }, er: { b: { a: 5, e: 1 } }, ws: { mesa: { b: 2, d: 3 } }, rd: { 4: { n: 1, l: 2, b: 3, d: 'a' } },
    vl: [{ d: '2026-01-02', n: 1, s: 50, w: 20, e: 1 }], es: [1, 2, 3].map(i => ({ d: '2026-0' + i + '-01', N: 3, rec: i, r: [['l', 'a', 1, 0, 0, 0, 0]] })) });
  const b = alu('ana12345', { mt: 1000, lv: 4, d: { '2026-01-01': { t: 5, s: 1, a: 1, o: 1 } }, er: { b: { a: 2, e: 2 }, d: { a: 1, e: 0 } }, ws: { sol: { b: 1, d: 3 } }, rd: { 4: { n: 3, l: 1, b: 1, d: 'b' } },
    vl: [{ d: '2026-01-01', n: 1, s: 40, w: 20, e: 2 }], es: [3, 4, 5].map(i => ({ d: '2026-0' + i + '-01', N: 3, rec: i, r: [] })) });
  L.ctx.__a = a; L.ctx.__b = b;
  const ab = L.ev('stab(mergeP(__a,__b))'), ba = L.ev('stab(mergeP(__b,__a))');
  assert.equal(ab, ba, 'mismo resultado en cualquier orden');
  assert.equal(L.ev('stab(mergeP(mergeP(__a,__b),__b))'), ab, 'idempotente');
  const m = JSON.parse(ab);
  assert.equal(m.lv, 6);
  assert.deepEqual(m.er.b, { a: 5, e: 2 });
  assert.ok(m.ws.mesa && m.ws.sol);
  assert.equal(m.rd[4].n, 3);
  assert.equal(m.vl.length, 2);
  assert.equal(m.es.length, 4, 'como mucho 4 evaluaciones con detalle');
  assert.equal(m.es.find(e => e.rec === 3).r.length, 1, 'de dos iguales se queda la que tiene el detalle');
});

test('almacenamiento lleno: avisa (SVE) y el aviso se quita al volver a guardar', () => {
  const L = conPerfiles([alu('ana12345')]);
  const ls = L.localStorage, orig = ls.setItem;
  ls.setItem = (k, v) => { if (k === 'ar2') throw new Error('QuotaExceededError'); orig(k, v); };
  L.ev('save()');
  assert.ok(L.ev('SVE') > 0, 'se detecta el fallo');
  assert.equal(L.ev('hmWarn()'), true, 'punto en Inicio');
  assert.match(L.ev('svWarn()'), /No se ha podido guardar/);
  ls.setItem = orig;
  assert.equal(L.ev('saveRaw()'), true);
  assert.equal(L.ev('SVE'), 0);
  assert.equal(L.ev('svWarn()'), '');
});

test('espacio usado: cuenta lo de Lectori aparte de lo de las otras apps', () => {
  const L = cargar({ ls: { ar2: '{"ps":[]}', 'lectori.sz': '1', 'tabula.datos': 'x'.repeat(1000) } });
  const u = L.json('lsUse()');
  assert.ok(u.me >= 'ar2'.length + 'lectori.sz'.length + 1);
  assert.equal(u.all - u.me, 'tabula.datos'.length + 1000, 'lo de otras apps se cuenta aparte');
  assert.match(L.ev('lsRow()'), /Espacio usado/);
});

test('evaluaciones antiguas: sin un sitio donde guardar antes la copia, no se recorta nada', async () => {
  const es = [1, 2, 3, 4, 5, 6].map(i => ({ d: '2026-0' + i + '-01', N: 3, rec: i, r: [['l', 'a', 1, 0, 0, 0, 0]] }));
  const L = conPerfiles([alu('ana12345', { es })]);
  L.ev('slimOld()');
  await new Promise(r => setImmediate(r));
  await new Promise(r => setImmediate(r));
  assert.equal(L.json('P.ps[0].es.length'), 6, 'en las pruebas no hay IndexedDB: la copia queda en memoria y no se recorta');
  assert.equal(L.json('cleanP(P.ps[0]).es.length'), 4, 'cleanP guarda como mucho 4 con detalle');
});

test('contrato con Calculi: tras restaurar y juntar, ar2 sigue teniendo ps[].n, av e id', async () => {
  const A = conPerfiles([alu('ana12345', { av: 2 })]);
  A.ev(`readCopy(${JSON.stringify(JSON.stringify({ P: { ps: [alu('rosa1234', { av: 4 })] } }))})`);
  await A.ev(`applyImp('add')`);
  const ar2 = JSON.parse(A.localStorage.getItem('ar2'));
  for (const q of ar2.ps) { assert.equal(typeof q.n, 'string'); assert.equal(typeof q.id, 'string'); assert.equal(typeof q.av, 'number'); }
});
