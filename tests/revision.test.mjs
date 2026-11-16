// Revisión de datos y nube (2026-11-16): `docs/revision-datos.md`.
// Cada prueba afirma el comportamiento DESEADO y hoy FALLA: reproduce un hallazgo (H1–H8) con una nube falsa en memoria.
// Están marcadas `todo` para que no rompan la ejecución. Al arreglar cada hallazgo (fase 5b), quita su `todo`:
// la prueba debe pasar sin cambiarla.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cargar } from './cargar.mjs';

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
// yaUnido: el dispositivo ya había sincronizado antes con esta cuenta (no es «la primera vez»)
function dispositivo(n, ps = [], { yaUnido = true, extra = {}, ls = {} } = {}) {
  const ar2 = JSON.stringify({ ps, c: ps.length ? 0 : -1, ov: 2, rol: 'doc', ...extra });
  const L = cargar({ ls: { ar2, ...(yaUnido ? { 'lectori.sync.uid': 'u1' } : {}), ...ls } });
  L.ev('FBU={uid:"u1"}');
  L.ctx.__db = n.db;
  L.ev('FB={db:__db,auth:{}}');
  L.sync = async m => { await L.ev(m ? `syncNow(${JSON.stringify(m)})` : 'syncNow()'); };
  L.alumno = id => L.json(`P.ps.find(q=>q.id===${JSON.stringify(id)})||null`);
  return L;
}
const alu = (id, o = {}) => ({ id, n: 'Niño ' + id, mt: 1000, lv: 3, st: 10, s: { a: { b: 2, d: 5 } }, d: {}, er: {}, ...o });
const sube = (n, p) => n.alu.set(p.id, { d: JSON.stringify(p), mt: p.mt });

test('H1 · una tableta atrasada no hace retroceder el nivel ni las estrellas', { todo: 'pendiente: fase 5b' }, async () => {
  const n = nubeFalsa();
  // Tableta A: Ana llegó ayer al nivel 9 (lv 8) con 120 estrellas, y está en la cuenta
  const A = dispositivo(n, [alu('ana12345', { lv: 8, st: 120, mt: 2000 })]);
  await A.sync();
  assert.equal(n.alumno('ana12345').lv, 8);
  // Tableta B: no se sincronizó (sin wifi). Sigue con lo de la semana pasada: nivel 6 (lv 5), 80 estrellas
  const B = dispositivo(n, [alu('ana12345', { lv: 5, st: 80, mt: 1000 })]);
  B.ev('star()');                       // Ana gana UNA estrella en B (cualquier uso vale)
  assert.equal(B.alumno('ana12345').st, 81);
  await B.sync();                       // vuelve el wifi
  await A.sync();
  const enB = B.alumno('ana12345'), enA = A.alumno('ana12345'), nube = n.alumno('ana12345');
  assert.equal(nube.lv, 8, `nivel en la cuenta: ${nube.lv} (era 8)`);
  assert.equal(enA.lv, 8, `nivel en la tableta A: ${enA.lv} (era 8)`);
  assert.equal(enB.lv, 8, `nivel en la tableta B: ${enB.lv}`);
  assert.ok(nube.st >= 120, `estrellas en la cuenta: ${nube.st} (eran 120)`);
});

test('H1b · «Lo mismo para toda la clase» en una tableta atrasada no hace retroceder a la clase', { todo: 'pendiente: fase 5b' }, async () => {
  const n = nubeFalsa();
  const A = dispositivo(n, [alu('ana12345', { lv: 8, st: 120, mt: 2000 }), alu('luis1234', { lv: 9, st: 150, mt: 2000 })]);
  await A.sync();
  const B = dispositivo(n, [alu('ana12345', { lv: 5, st: 80, mt: 1000 }), alu('luis1234', { lv: 4, st: 60, mt: 1000 })]);
  B.ev('rmAll()');                      // el docente pone «Sola» a toda la clase en B
  await B.sync(); await A.sync();
  assert.deepEqual([n.alumno('ana12345').lv, n.alumno('luis1234').lv], [8, 9]);
});

test('H2 · si la sincronización cambia el nivel a mitad de un ejercicio, al terminarlo no se salta otro nivel', { todo: 'pendiente: fase 5b' }, async () => {
  const n = nubeFalsa();
  const B = dispositivo(n, [alu('ana12345', { lv: 5, st: 80, mt: 1000 })]);
  B.ev(`(()=>{globalThis.__pend=null;const ok=d=>{if(globalThis.__esp){globalThis.__esp=0;globalThis.__pend=()=>d(true)}else d(true)};
    itemChoose=(i,d)=>ok(d);itemTrace=(u,d)=>d();itemSylIntro=(i,d)=>d();itemSylChoose=(a,b,d)=>ok(d);
    itemBuild=(w,p,d,o)=>o&&o.dict?d():ok(d);itemSylWord=(c,d)=>ok(d);itemSylFind=(c,d)=>ok(d);itemSylRead=(s,d)=>d();
    itemRead=(w,p,d)=>ok(d);itemMatch=(w,e,d)=>ok(d);itemMatchW=(w,e,d)=>ok(d);itemOrder=(t,d)=>d();itemText=(t,d)=>ok(d);warm=(q,d)=>d()})()`);
  B.ev('globalThis.__esp=1;run(5)');    // Ana está haciendo su nivel (lv 5) en la tableta B…
  // …y mientras, el docente, desde su móvil, le da por superado ese nivel y el siguiente (lv 7). Llega a la cuenta:
  sube(n, alu('ana12345', { lv: 7, st: 80, mt: B.alumno('ana12345').mt + 60000 }));
  await B.sync();                        // la tableta sincroniza durante una pausa de Ana
  assert.equal(B.alumno('ana12345').lv, 7, 'B recibe el nivel que puso el docente');
  B.ev('__pend&&__pend()');             // Ana sigue con el ejercicio que tenía delante y termina el nivel
  for (let k = 0; k < 60 && B.alumno('ana12345').lv === 7; k++) B.ev("$('#x').onclick&&$('#x').onclick()");
  const lv = B.alumno('ana12345').lv;
  assert.equal(lv, 7, `terminó el lv 5 (que ya no era su nivel) y ahora va por lv ${lv}: se ha saltado el lv 7 sin hacerlo`);
});

test('H3 · primera vez con la cuenta: alumnos de aquí con pruebas de velocidad o notas (sin niveles) no se pierden sin copia', { todo: 'pendiente: fase 5b' }, async () => {
  const n = nubeFalsa();
  sube(n, alu('otro1234', { n: 'Del curso pasado' }));
  n.meta = { meta: JSON.stringify({ rol: 'doc', gmt: 1, del: {} }) };
  const B = dispositivo(n, [
    { id: 'ana12345', n: 'Ana', mt: 1000, lv: 0, st: 0, s: {}, d: {}, vl: [{ d: '2026-09-15', n: 73, s: 60, w: 21, e: 2, m: 1 }], nt: [{ d: '2026-09-15', x: 'Evaluación inicial: conoce las vocales' }] },
    { id: 'luis1234', n: 'Luis', mt: 1000, lv: 0, st: 0, s: {}, d: {}, vl: [{ d: '2026-09-15', n: 73, s: 60, w: 9, e: 4, m: 1 }] },
  ], { yaUnido: false });
  assert.equal(B.ev('isBlank()'), true, 'la app considera «vacío» este dispositivo');
  await B.sync();
  const sigue = !!B.alumno('ana12345'), pregunta = !!B.ev('SYNC.ask'), copia = B.json('BKM').length;
  assert.ok(sigue || pregunta || copia, `Ana y Luis han desaparecido (velocidad y notas incluidas), sin preguntar y sin copia automática`);
});

test('H4 · reiniciar a un alumno en un dispositivo no borra las notas del tutor escritas en otro', { todo: 'pendiente: fase 5b' }, async () => {
  const n = nubeFalsa();
  // En la cuenta: Ana reiniciada desde la tableta A (rz) después de lo último de B
  sube(n, alu('ana12345', { lv: 0, st: 0, s: {}, rz: 3000, mt: 3000 }));
  const B = dispositivo(n, [alu('ana12345', { mt: 1500, nt: [{ d: '2026-11-10', x: 'Hablar con la familia' }] })]);
  await B.sync();
  assert.equal(B.alumno('ana12345').lv, 0, 'el reinicio llega a B');
  assert.equal((B.alumno('ana12345').nt || []).length, 1, 'la nota del tutor (que solo está en B) se ha perdido');
});

test('H5 · un borrado que llega de otro dispositivo guarda antes una copia automática aquí', { todo: 'pendiente: fase 5b' }, async () => {
  const n = nubeFalsa();
  n.meta = { meta: JSON.stringify({ rol: 'doc', gmt: 1, del: { ana12345: 5000 } }) };
  const B = dispositivo(n, [alu('ana12345', { mt: 1500, nt: [{ d: '2026-11-10', x: 'Nota que solo está aquí' }] }), alu('luis1234')]);
  await B.sync();
  assert.equal(B.alumno('ana12345'), null, 'el borrado llega a B');
  assert.ok(B.json('BKM').length >= 1, 'Ana se ha borrado de B (con sus notas) sin copia automática previa');
});

test('H6 · si los datos guardados no se pueden leer al abrir, no se pisan sin guardar antes lo que había', { todo: 'pendiente: fase 5b' }, () => {
  const roto = '{"ps":[{"id":"ana12345","n":"Ana","lv":7,"st":90,"s":{"a":{"b":3';   // texto cortado
  const L = cargar({ ls: { ar2: roto } });
  assert.equal(L.ev('P.ps.length'), 0);
  L.ev('save()');                        // cualquier guardado (crear un alumno, cambiar un ajuste…)
  const queda = [...L.localStorage._datos].some(([k, v]) => k !== 'ar2' && String(v).includes('ana12345'));
  assert.ok(L.localStorage.getItem('ar2').includes('ana12345') || queda, 'el texto antiguo se ha sustituido por un aula vacía y no queda en ningún sitio');
});

test('H7 · «Sustituir todo» con la cuenta conectada deja solo lo de la copia', { todo: 'pendiente: fase 5b' }, async () => {
  const n = nubeFalsa();
  const hoy = alu('ana12345', { lv: 8, mt: 2000, s: { a: { b: 2, d: 5 }, l: { b: 3, d: 5 }, m: { b: 3, d: 5 } }, d: { '2026-11-10': { t: 600, s: 5, a: 30, o: 20 } } });
  const A = dispositivo(n, [hoy]);
  await A.sync();
  A.ctx.__copia = JSON.stringify({ v: 1, P: { ps: [alu('ana12345', { lv: 3, mt: 500 })], c: 0, ov: 2 } });
  A.ev("readCopy(__copia,'copia')");
  await A.ev("applyImp('rep')");
  assert.deepEqual(Object.keys(A.alumno('ana12345').s), ['a'], 'nada más restaurar queda solo lo de la copia');
  await A.sync();
  assert.deepEqual(Object.keys(A.alumno('ana12345').s).sort(), ['a'], 'tras sincronizar, vuelve lo que había en la cuenta');
});

test('H8 · el bloqueo por tiempo de uso no desaparece al sincronizar', { todo: 'pendiente: fase 5b' }, async () => {
  const n = nubeFalsa();
  sube(n, alu('ana12345', { mt: 900 }));
  const B = dispositivo(n, [alu('ana12345', { mt: 1000, e: 1794800000000 })]);
  await B.sync();
  assert.ok(B.alumno('ana12345').e, 'la marca de «tiempo agotado» se ha borrado');
});
