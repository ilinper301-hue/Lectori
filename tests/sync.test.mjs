// Sincronización con la nube (fase 2), con un Firestore falso en memoria: nunca se conecta a nada real.
// Cada «dispositivo» es una carga independiente de la app; todos comparten la misma nube falsa.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cargar } from './cargar.mjs';

// Firestore mínimo: lectori/{uid} (meta) y lectori/{uid}/alu/{id}, con lecturas y escrituras por lotes.
function nubeFalsa() {
  const n = { meta: null, alu: new Map(), commits: 0, subidas: 0 };
  const mref = {
    _meta: true,
    get: async () => ({ exists: !!n.meta, data: () => n.meta }),
    collection: () => ({
      get: async () => ({ forEach: f => [...n.alu].forEach(([id, v]) => f({ id, data: () => v })) }),
      doc: id => ({ _id: id }),
    }),
  };
  n.db = {
    collection: () => ({ doc: () => mref }),
    batch: () => {
      const ops = [];
      return {
        set: (ref, v) => ops.push(['set', ref, JSON.parse(JSON.stringify(v))]),
        delete: ref => ops.push(['del', ref]),
        commit: async () => {
          n.commits++;
          for (const [op, ref, v] of ops) {
            if (ref._meta) n.meta = v;
            else if (op === 'set') { n.alu.set(ref._id, v); n.subidas++; }
            else n.alu.delete(ref._id);
          }
        },
      };
    },
  };
  n.alumno = id => (n.alu.has(id) ? JSON.parse(n.alu.get(id).d) : null);
  return n;
}

// Un dispositivo con sesión iniciada (uid u1) en la nube `n`, con los perfiles `ps`.
function dispositivo(n, ps = [], extra = {}) {
  const ar2 = JSON.stringify({ ps, c: ps.length ? 0 : -1, ov: 2, rol: 'doc', ...extra });
  const L = cargar({ ls: { ar2 } });
  L.nube = n;
  L.ev('FBU={uid:"u1"}');
  L.ctx.__db = n.db;
  L.ev('FB={db:__db,auth:{}}');
  L.sync = async m => { await L.ev(m ? `syncNow(${JSON.stringify(m)})` : 'syncNow()'); };
  L.alumno = id => L.json(`P.ps.find(q=>q.id===${JSON.stringify(id)})`);
  return L;
}

const alu = (id, o = {}) => ({ id, n: 'Niño ' + id, mt: 1000, lv: 3, st: 10, s: { a: { b: 2, d: 5 } }, d: {}, er: {}, ...o });

test('primera vez con la cuenta vacía: sube todo, pero no las notas del tutor (D4)', async () => {
  const n = nubeFalsa();
  const A = dispositivo(n, [alu('ana12345', { nt: [{ d: '2026-11-01', x: 'Confunde b y d' }] })]);
  await A.sync();
  const sub = n.alumno('ana12345');
  assert.ok(sub, 'el alumno está en la nube');
  assert.equal(sub.lv, 3);
  assert.equal('nt' in sub, false, 'las notas no suben');
  assert.equal(A.alumno('ana12345').nt.length, 1, 'las notas siguen en el dispositivo');
  assert.equal(A.ev('SYNC.err'), '');
});

test('primera vez con datos en los dos lados: no toca nada hasta elegir (sin confirm)', async () => {
  const n = nubeFalsa();
  const A = dispositivo(n, [alu('ana12345')]);
  await A.sync();
  const B = dispositivo(n, [alu('luis1234', { lv: 7 })]);
  await B.sync();
  assert.ok(B.json('SYNC.ask'), 'pregunta qué hacer');
  assert.equal(B.json('SYNC.ask.ln'), 1);
  assert.equal(B.json('SYNC.ask.rn'), 1);
  assert.equal(n.alumno('luis1234'), null, 'no ha subido nada');
  assert.deepEqual(B.json('P.ps.map(q=>q.id)'), ['luis1234'], 'no ha cambiado nada aquí');
  assert.equal(B.localStorage.getItem('lectori.sync.uid'), null);
  // Juntar los dos: quedan ambos alumnos en los dos lados y no se borra nada
  await B.sync('merge');
  assert.equal(B.json('SYNC.ask'), null);
  assert.deepEqual(B.json('P.ps.map(q=>q.id).sort()'), ['ana12345', 'luis1234']);
  assert.ok(n.alumno('luis1234') && n.alumno('ana12345'));
  await A.sync();
  assert.deepEqual(A.json('P.ps.map(q=>q.id).sort()'), ['ana12345', 'luis1234']);
});

test('«Usar lo de la cuenta»: copia automática previa y se conservan las notas de aquí', async () => {
  const n = nubeFalsa();
  await dispositivo(n, [alu('ana12345', { lv: 9 })]).sync();
  const B = dispositivo(n, [alu('ana12345', { lv: 2, mt: 500, nt: [{ d: '2026-10-01', x: 'Nota local' }] }), alu('pepe1234')]);
  await B.sync();
  assert.ok(B.json('SYNC.ask'));
  await B.sync('down');
  assert.deepEqual(B.json('P.ps.map(q=>q.id)'), ['ana12345']);
  assert.equal(B.alumno('ana12345').lv, 9);
  assert.equal(B.alumno('ana12345').nt[0].x, 'Nota local', 'la nota local no se pierde');
  const bk = B.json('BKM');
  assert.equal(bk.length, 1, 'se guardó una copia automática');
  assert.match(bk[0].w, /cuenta/);
  assert.deepEqual(JSON.parse(bk[0].d).ps.map(q => q.id), ['ana12345', 'pepe1234'], 'la copia tiene lo que había');
  assert.equal('nt' in n.alumno('ana12345'), false, 'en la nube sigue sin notas');
});

test('«Subir lo de este dispositivo»: copia automática de lo que había en la cuenta', async () => {
  const n = nubeFalsa();
  await dispositivo(n, [alu('ana12345'), alu('otro1234')]).sync();
  const B = dispositivo(n, [alu('pepe1234')]);
  await B.sync();
  await B.sync('up');
  assert.deepEqual([...n.alu.keys()], ['pepe1234'], 'la cuenta queda como este dispositivo');
  const bk = B.json('BKM');
  assert.equal(bk.length, 1);
  assert.deepEqual(JSON.parse(bk[0].d).ps.map(q => q.id).sort(), ['ana12345', 'otro1234']);
});

test('mismo alumno en dos dispositivos sin conexión: se juntan días, repaso y fallos; el nivel lo pone el más reciente', async () => {
  const n = nubeFalsa();
  const base = alu('ana12345', { d: { '2026-11-01': { t: 300, s: 5, a: 20, o: 15 } } });
  const A = dispositivo(n, [base]);
  await A.sync();
  const B = dispositivo(n, []);
  await B.sync();
  assert.equal(B.alumno('ana12345').lv, 3);
  // Cada uno practica por su cuenta
  A.ev(`(()=>{const q=P.ps[0];q.d['2026-11-02']={t:600,s:9,a:30,o:25};q.er.b={a:5,e:2};q.s.ma={b:1,d:9};q.lv=4;q.mt=2000;saveRaw()})()`);
  B.ev(`(()=>{const q=P.ps.find(x=>x.id==='ana12345');q.d['2026-11-03']={t:200,s:3,a:10,o:9};q.er.b={a:3,e:1};q.er.d={a:4,e:0};q.s.pa={b:2,d:9};q.lv=5;q.mt=3000;saveRaw()})()`);
  await A.sync(); // A sube primero (su versión es más nueva que la de la nube)
  await B.sync(); // B junta con lo de A
  await A.sync(); // A recibe lo juntado
  for (const [nom, D] of [['A', A], ['B', B]]) {
    const q = D.alumno('ana12345');
    assert.deepEqual(Object.keys(q.d).sort(), ['2026-11-01', '2026-11-02', '2026-11-03'], nom + ': todos los días');
    assert.deepEqual(q.er.b, { a: 5, e: 2 }, nom + ': fallos (máximo)');
    assert.deepEqual(q.er.d, { a: 4, e: 0 }, nom);
    assert.ok(q.s.ma && q.s.pa && q.s.a, nom + ': repaso de los dos lados');
    assert.equal(q.lv, 5, nom + ': nivel del más reciente');
  }
  // Ya están iguales: otra ronda no sube nada (no hay ida y vuelta sin fin)
  const antes = n.subidas;
  await A.sync(); await B.sync(); await A.sync();
  assert.equal(n.subidas, antes, 'sin subidas nuevas');
  assert.equal(A.alumno('ana12345').mt, B.alumno('ana12345').mt);
});

test('borrar un alumno en un dispositivo lo borra en el otro', async () => {
  const n = nubeFalsa();
  const A = dispositivo(n, [alu('ana12345'), alu('luis1234')]);
  await A.sync();
  const B = dispositivo(n, []);
  await B.sync();
  A.ev(`P.c=P.ps.findIndex(q=>q.id==='luis1234');delP()`);
  await A.sync();
  assert.equal(n.alumno('luis1234'), null);
  await B.sync();
  assert.deepEqual(B.json('P.ps.map(q=>q.id)'), ['ana12345']);
  assert.equal(A.json('BKM').length, 1, 'antes de borrar se guarda una copia automática');
});

test('reiniciar el progreso en un dispositivo no lo deshace la versión vieja del otro', async () => {
  const n = nubeFalsa();
  const A = dispositivo(n, [alu('ana12345', { lv: 10, er: { a: { a: 9, e: 3 } } })]);
  await A.sync();
  const B = dispositivo(n, []);
  await B.sync();
  B.ev(`P.c=0;resetP()`);
  assert.ok(B.alumno('ana12345').rz > 0);
  await B.sync();
  await A.sync();
  const q = A.alumno('ana12345');
  assert.equal(q.lv, 0);
  assert.deepEqual(q.s, {});
  assert.deepEqual(q.er, {});
});

test('alumnos que en la nube aún tienen notas (versión anterior) se vuelven a subir sin ellas', async () => {
  const n = nubeFalsa();
  const viejo = { ...alu('ana12345'), nt: [{ d: '2026-09-01', x: 'Nota antigua' }] };
  n.alu.set('ana12345', { d: JSON.stringify(viejo), mt: 1000 });
  n.meta = { meta: JSON.stringify({ rol: 'doc', del: {} }) };
  const B = dispositivo(n, []);
  await B.sync(); // dispositivo vacío: baja todo sin preguntar
  assert.equal(B.json('SYNC.ask'), null);
  assert.equal(B.alumno('ana12345').nt[0].x, 'Nota antigua', 'la nota se queda en el dispositivo');
  assert.equal('nt' in n.alumno('ana12345'), false, 'y desaparece de la nube');
});

test('sin conexión: un error no cambia nada y se muestra', async () => {
  const n = nubeFalsa();
  const A = dispositivo(n, [alu('ana12345')]);
  n.db.collection = () => ({ doc: () => ({ get: async () => { throw Object.assign(new Error('offline'), { code: 'unavailable' }); }, collection: () => ({ get: async () => { throw new Error('offline'); } }) }) });
  await A.sync();
  assert.notEqual(A.ev('SYNC.err'), '');
  assert.equal(A.ev('SYNC.busy'), false);
  assert.deepEqual(A.json('P.ps.map(q=>q.lv)'), [3]);
  assert.equal(A.localStorage.getItem('lectori.sync.uid'), null);
});
