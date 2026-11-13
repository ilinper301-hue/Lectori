// Fase 5 · más y mejores datos del alumno: confusiones (cx), historia de niveles (hx), comprensión literal/inferencial (cn),
// velocidad con prueba de 1 minuto y referencia con rango. Los perfiles anteriores (3.34–3.39) siguen funcionando igual.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cargar } from './cargar.mjs';

const J = x => JSON.parse(JSON.stringify(x));
const alu = (o = {}) => ({ id: 'alu00001', n: 'Ana', mt: 1000, lv: 6, st: 3, s: {}, d: {}, er: {}, ...o });
const con = (p, extra = {}) => cargar({ ls: { ar2: JSON.stringify({ ps: [p], c: 0, ov: 2, rol: 'doc', pin: 'x1', ...extra }) } });
const html = L => String(L.ev('app.innerHTML'));

/* ================= confusiones ================= */

test('cxRec guarda qué eligió al fallar (b>d), sin contar dos veces la misma opción en el mismo ejercicio', () => {
  const L = con(alu());
  L.ev("const S=new Set();cxRec('b','d','',S);cxRec('b','d','',S);cxRec('b','p','',S);cxRec('b','d');cxRec('a','a');cxRec('gato','pato','w:');cxRec('b','v','d:')");
  assert.deepEqual(L.json('P.ps[0].cx'), { 'b>d': 2, 'b>p': 1, 'w:gato>pato': 1, 'd:b>v': 1 });
});

test('cxRec: como mucho CXN claves (sale la de menos veces) y 999 por clave', () => {
  const L = con(alu());
  const N = L.ev('CXN');
  L.ev(`for(let i=0;i<${N};i++){cxRec('x'+i,'y');cxRec('x'+i,'y')}cxRec('x0','y');cxRec('nuevo','z')`);
  const cx = L.json('P.ps[0].cx');
  assert.equal(Object.keys(cx).length, N);
  assert.equal(cx['nuevo>z'], 1);
  assert.equal(cx['x0>y'], 3, 'la más repetida se queda');
  L.ev("P.ps[0].cx['b>d']=999;cxRec('b','d')");
  assert.equal(L.ev("P.ps[0].cx['b>d']"), 999);
});

test('«Confunde b con d» junta las dos direcciones y solo sale con 2 veces o más; palabras y escritura van aparte', () => {
  const L = con(alu({ cx: { 'b>d': 1, 'd>b': 1, 'm>n': 1, 'w:gato>pato': 2, 'd:b>v': 3 } }));
  assert.deepEqual(L.json('cxTxt(P.ps[0])'), ['b con d (2)']);
  assert.deepEqual(L.json("cxTxt(P.ps[0],'w:')"), ['gato / pato (2)']);
  assert.deepEqual(L.json("cxTxt(P.ps[0],'d:')"), ['v en vez de b (3)']);
  L.ev('panel(0)');
  assert.match(html(L), /Confunde:<\/b> b con d \(2\)/);
  assert.match(html(L), /Al formar palabras:<\/b> v en vez de b \(3\)/);
});

test('al fallar en «¿Qué letra suena?» se guarda la letra elegida', () => {
  const L = con(alu({ lv: 15 }));
  // todas las opciones comparten el mismo botón falso: su onclick es el de la última opción (o2)
  let o;
  for (let n = 0; n < 30; n++) { L.ev("itemChoose(15,()=>{},'b')"); o = L.json("(app.innerHTML.match(/id=\"o\\d\">[^<]+/g)||[]).map(x=>x.replace(/^id=\"o\\d\">/,''))"); if (o[2] !== 'b') break; }
  assert.equal(o.length, 3);
  assert.ok(o.includes('b'));
  L.ev("$('#o2').onclick()");
  assert.deepEqual(L.json('pr().cx'), { ['b>' + o[2]]: 1 });
});

/* ================= historia de niveles ================= */

// Recorre el nivel `i` con actividades simuladas: `res(sub, n)` dice si el n.º intento de ese subnivel sale bien.
function recorre(L, i, res) {
  L.ev(`(()=>{let C={};globalThis.__R=(s)=>{C[s]=(C[s]||0)+1;return (${res})(s,C[s])};
    const ok=s=>d=>d(__R(s));
    itemChoose=(i,d)=>ok('son')(d);itemTrace=(u,d)=>d();itemSylIntro=(i,d)=>d();itemSylChoose=(a,b,d)=>ok('sil')(d);
    itemBuild=(w,p,d,o)=>o&&o.dict?d():ok(SUBACT||'sil')(d);itemSylWord=(c,d)=>ok('sil')(d);itemSylFind=(c,d)=>ok('sil')(d);itemSylRead=(s,d)=>d();
    itemRead=(w,p,d)=>ok('pal')(d);itemMatch=(w,e,d)=>ok('pal')(d);itemMatchW=(w,e,d)=>ok('pal')(d);itemOrder=(t,d)=>d();itemText=(t,d)=>ok('fra')(d);warm=(q,d)=>d()})()`);
  L.ev('var SUBACT=null');
  L.ev(`run(${i})`);
  // pulsa «Continuar» / «Repetir» hasta terminar el nivel (todas las pantallas comparten el mismo botón falso)
  for (let n = 0; n < 40 && L.ev(`pr().lv==${i}`); n++) L.ev("$('#x').onclick&&$('#x').onclick()");
}

test('historia: al superar un nivel guarda cuándo empezó, cuándo lo superó y los intentos de cada parte', () => {
  const L = con(alu({ lv: 6 }));
  recorre(L, 6, '(s,n)=>true');
  assert.equal(L.ev('pr().lv'), 7);
  const x = L.json('pr().hx.m');
  assert.equal(x.d, L.ev('key()'));
  assert.equal(x.b, L.ev('key()'));
  assert.deepEqual(Object.keys(x.t).sort(), ['fra', 'pal', 'sil', 'son']);
  Object.values(x.t).forEach(v => assert.equal(v, 1));
  assert.equal(x.r, undefined);
});

test('historia: atascado (4.º intento) y listón rebajado quedan como «superado con ayuda»; el aviso actual se quita', () => {
  const L = con(alu({ lv: 6 }));
  // Sílabas: los 3 primeros intentos todo mal; en el 4.º, 5 de 8 bien (pasa solo con el listón rebajado al 60 %)
  recorre(L, 6, `(s,n)=>{if(s!='sil')return true;const g=pr().pg||{};if((g.f|0)<3)return false;return !g.n||g.o/g.n<.7}`);
  const x = L.json('pr().hx.m');
  assert.ok(x.t.sil >= 4, 'intentos de sílabas: ' + x.t.sil);
  assert.deepEqual(x.r, ['sil']);
  assert.equal(L.ev('pr().al'), undefined, 'el aviso «Atascado» ya no está activo');
  assert.equal(L.json('hxHelp(pr(),30)').length, 1);
  L.ev('panel(0)');
  assert.match(html(L), /Superado con ayuda: <b>m<\/b> \(Sílabas \(\d+ intentos\), listón rebajado\)/);
  L.ev('hxScr()');
  assert.match(html(L), /Con ayuda/);
  assert.match(html(L), /Listón rebajado: Síl/);
});

test('historia: lo que salta el tutor queda apuntado; practicar un nivel ya superado no la toca', () => {
  const L = con(alu({ lv: 6, pg: { i: 6, s: 'sil', k: 0, o: 0, n: 0, h: 0, f: 3 }, al: { i: 6, s: 'sil', f: 3, t: 1 } }));
  L.ev('skipSub()');
  assert.deepEqual(L.json('pr().hx.m.k'), ['sil']);
  assert.equal(L.ev('pr().hx.m.d'), undefined, 'aún no ha superado el nivel');
  const M = con(alu({ lv: 9 }));
  recorre(M, 3, '(s,n)=>true');
  assert.equal(M.ev('pr().hx'), undefined);
});

/* ================= comprensión ================= */

test('comprensión: literal (app) separada; los perfiles antiguos la sacan de cq sin contar «Ordenar la frase»', () => {
  const L = con(alu({ cq: { pic: { a: 5, o: 4 }, w: { a: 2, o: 1 }, fo: { a: 9, o: 9 } } }));
  assert.deepEqual(L.json('cleanP(pr()).cn'), { l: { a: 7, o: 5 } });
  L.ev("cqRec('vf',true);cqRec('fo',false);cqRec('pic',false,1)");
  assert.deepEqual(L.json('pr().cn'), { l: { a: 8, o: 6 }, i: { a: 1, o: 0 } });
  assert.deepEqual(L.json('pr().cq.vf'), { a: 1, o: 1 });
});

test('comprensión inferencial de la evaluación del tutor (microtextos, 2.ª pregunta)', () => {
  const r = [['fm', 'texto', 1, 0, 3, 1, 0], ['fm', 'q1', 1, 0, 3, 2, 0], ['fm', 'q2', 0, 0, 3, 3, 0], ['fm', 'q2b', 1, 0, 3, 3, 0]];
  const L = con(alu({ es: [{ d: '2026-11-01', N: 3, rec: 3, r }] }));
  assert.deepEqual(L.json('evInf(pr())'), { d: '2026-11-01', a: 2, o: 1 });
  L.ev('panel(0)');
  assert.match(html(L), /Comprensión inferencial/);
});

/* ================= velocidad ================= */

test('referencia de velocidad con rango por curso (1.º 25–72, 2.º 45–101) y posición del alumno', () => {
  const L = con(alu({ cu: '1' }));
  assert.deepEqual(L.json('VREF'), { 1: { m: 49, lo: 25, hi: 72 }, 2: { m: 73, lo: 45, hi: 101 } });
  assert.match(L.ev('velRef(pr(),20)'), /entre <b>25 y 72 palabras por minuto<\/b>.*por debajo de lo habitual/);
  assert.match(L.ev('velRef(pr(),50)'), /dentro de lo habitual/);
  assert.match(L.ev("velRef({cu:'2'},120)"), /45 y 101.*por encima/);
  assert.match(L.ev("velRef({cu:'i5'},20)"), /Infantil/);
  assert.equal(L.ev("vrTxt('1')"), '25–72 (media 49)');
});

test('prueba de 1 minuto: los textos del nivel van seguidos, sin cambiar ninguno, empezando cada vez por otro', () => {
  const L = con(alu({ vl: [] }));
  const t0 = L.json('velText(1)'), todos = L.json('[VT[0].x,...VTX.filter(a=>a.n==1).map(a=>a.x)]');
  assert.deepEqual([...t0.ps].sort(), [...todos].sort());
  assert.equal(t0.ps[0], todos[0]);
  L.ev("pr().vl=[{d:'2026-11-01',n:1,s:60,w:40,e:1,m:1}]");
  assert.equal(L.json('velText(1)').ps[0], todos[1]);
  L.ev('velRun(1)');
  assert.match(html(L), /prueba de 1 minuto/);
  assert.equal((html(L).match(/class="vw"/g) || []).length, todos.join(' ').split(/\s+/).length);
});

test('la marca de prueba de 1 minuto (m) se conserva al limpiar y al juntar; las antiguas siguen igual', () => {
  const L = con(alu({ vl: [{ d: '2026-10-01', n: 1, s: 30, w: 25, e: 0 }, { d: '2026-11-01', n: 1, s: 60, w: 40, e: 2, m: 1 }] }));
  const vl = L.json('cleanP(pr()).vl');
  assert.equal(vl[0].m, undefined);
  assert.equal(vl[1].m, 1);
  assert.equal(L.ev('cwpm(cleanP(pr()).vl[1])'), 38);
});

test('ritmo en las lecturas normales: mediana de palabras por minuto (necesita 3 textos recientes)', () => {
  const hoy = cargar().ev('key()');
  const tx = n => Array.from({ length: n }, (_, i) => 'pal' + i).join(' ');
  const rd = { [tx(12)]: { n: 1, l: 24, b: 24, d: hoy }, [tx(20)]: { n: 1, l: 30, b: 30, d: hoy }, [tx(30)]: { n: 2, l: 60, b: 50, d: hoy }, [tx(5)]: { n: 1, l: 1, b: 1, d: hoy } };
  const L = con(alu({ rd }));
  assert.deepEqual(L.json('rdPpm(pr())'), { v: 30, n: 3 });
  const M = con(alu({ rd: { [tx(20)]: { n: 1, l: 30, b: 30, d: hoy } } }));
  assert.equal(M.ev('rdPpm(pr())'), null);
});

/* ================= limpieza, copia, nube ================= */

test('perfil de la versión 3.34 (sin datos nuevos): se limpia igual, sin campos inventados, y las pantallas abren', () => {
  const v334 = { id: 'k1x2c3v4', n: 'Tito', lv: 12, st: 40, s: { l: { b: 3, d: 1 } }, d: { '2026-10-01': { t: 300, s: 4 } }, er: { l: { a: 5, e: 1 } }, vl: [{ d: '2026-10-02', n: 1, s: 40, w: 25, e: 1 }], cu: '1' };
  const L = con(v334);
  const c = L.json('cleanP(pr())');
  ['cx', 'hx', 'cn'].forEach(k => assert.equal(c[k], undefined, k));
  assert.equal(c.lv, 12);
  assert.deepEqual(c.vl, [{ d: '2026-10-02', n: 1, s: 40, w: 25, e: 1 }]);
  for (const f of ['panel(0)', 'hxScr()', 'informe()', 'aula()', 'velHist(1)', 'vel()']) { L.ev(f); assert.ok(html(L).length > 100, f); }
  L.ev('hxScr()');
  assert.match(html(L), /Aún no hay historia/);
});

test('cleanP conserva lo nuevo, descarta lo que no vale y es idempotente', () => {
  const L = con(alu({
    cx: { 'b>d': 3, 'malo': 2, 'x>y>z': 1, 'm>n': -1, 'w:gato>pato': 2.7 },
    hx: { m: { b: '2026-11-01', d: '2026-11-03', t: { son: 1, sil: 5, raro: 3 }, r: ['sil', 'zz'], k: [] }, nonivel: { d: '2026-11-01' }, l: { b: 'ayer', t: {} } },
    cn: { l: { a: 4, o: 9 }, i: { a: 0, o: 0 } },
  }));
  const c = L.json('cleanP(pr())');
  assert.deepEqual(c.cx, { 'b>d': 3, 'w:gato>pato': 2 });
  assert.deepEqual(c.hx, { m: { b: '2026-11-01', d: '2026-11-03', t: { son: 1, sil: 5 }, r: ['sil'] }, l: { t: {} } });
  assert.deepEqual(c.cn, { l: { a: 4, o: 4 } });
  assert.deepEqual(L.json('cleanP(cleanP(pr()))'), c);
});

test('juntar dos versiones del alumno combina confusiones, historia y comprensión sin perder nada', () => {
  const L = con(alu());
  const m = L.json(`mergeP(
    {id:'alu00001',n:'Ana',mt:20,lv:8,cx:{'b>d':2,'m>n':1},hx:{m:{b:'2026-11-02',d:'2026-11-05',t:{son:1,sil:4},r:['sil']}},cn:{l:{a:10,o:8}}},
    {id:'alu00001',n:'Ana',mt:10,lv:7,cx:{'b>d':5,'p>q':1},hx:{m:{b:'2026-11-01',t:{son:2,pal:1},k:['pal']},l:{b:'2026-10-20',d:'2026-10-21',t:{son:1}}},cn:{l:{a:6,o:6},i:{a:1,o:1}}})`);
  assert.deepEqual(m.cx, { 'b>d': 5, 'm>n': 1, 'p>q': 1 });
  assert.deepEqual(m.hx.m, { b: '2026-11-01', d: '2026-11-05', t: { son: 2, sil: 4, pal: 1 }, r: ['sil'], k: ['pal'] });
  assert.deepEqual(m.hx.l, { b: '2026-10-20', d: '2026-10-21', t: { son: 1 } });
  assert.deepEqual(m.cn, { l: { a: 10, o: 8 }, i: { a: 1, o: 1 } });
  assert.equal(m.lv, 8);
});

test('copia de seguridad: exportar → restaurar deja confusiones, historia y comprensión iguales; a la nube van, sin las notas', () => {
  const p = alu({ cx: { 'b>d': 2 }, hx: { m: { b: '2026-11-01', d: '2026-11-02', t: { son: 1 } } }, cn: { l: { a: 3, o: 2 } }, nt: [{ d: '2026-11-01', x: 'nota' }] });
  const L = con(p);
  const c = L.json('cleanP(JSON.parse(JSON.stringify(pr())))');
  assert.deepEqual(c.cx, p.cx); assert.deepEqual(c.hx, p.hx); assert.deepEqual(c.cn, p.cn);
  const up = L.json('upP(cleanP(pr()))');
  assert.deepEqual(up.cx, p.cx); assert.equal(up.nt, undefined);
});

test('tamaño: con 60 confusiones y la historia de los 45 niveles, lo nuevo de un alumno ocupa menos de 8 KB (25 alumnos: < 200 KB de unos 5 MB)', () => {
  const L = con(alu());
  L.ev("for(let i=0;i<80;i++)cxRec('palabra'+i,'otrapalab'+i,'w:');LV.forEach((l,i)=>{const x=hxGet(pr(),i);x.d=key();x.t={son:9,sil:9,pal:9,fra:9};x.r=['sil','pal'];x.k=['fra']})");
  const c = L.json('cleanP(pr())');
  assert.equal(Object.keys(c.cx).length, L.ev('CXN'));
  const n = JSON.stringify({ cx: c.cx, hx: c.hx }).length;
  assert.ok(n < 8000, n + ' bytes');
});

test('informe y hoja del aula muestran lo nuevo', () => {
  const L = con(alu({ cu: '1', cx: { 'b>d': 2, 'w:gato>pato': 2 }, hx: { m: { b: '2026-11-01', d: '2026-11-04', t: { son: 1, sil: 4 } } }, cq: { pic: { a: 4, o: 3 } },
    vl: [{ d: '2026-11-05', n: 1, s: 60, w: 40, e: 2, m: 1 }] }));
  L.ev('informe()');
  const h = html(L);
  assert.match(h, /Qué confunde/); assert.match(h, /b con d \(2\)/); assert.match(h, /gato \/ pato/);
  assert.match(h, /Últimos niveles superados/); assert.match(h, /con ayuda en Sílabas \(4 intentos\)/);
  assert.match(h, /Literal \(preguntas de la app, a la primera\): <b>3 de 4<\/b>/);
  assert.match(h, /entre <b>25 y 72/);
  // CSV: se intercepta el texto antes de compartirlo
  L.ev("globalThis.__CSV='';Blob=function(a){__CSV=a[0]};File=function(a){__CSV=a[0];throw 0}");
  L.ev('aulaCSV()');
  const csv = L.ev('__CSV');
  assert.match(csv, /Confunde;Palabras que confunde;Al formar palabras;Superado con ayuda/);
  assert.match(csv, /25–72 \(media 49\)/);
  assert.match(csv, /b con d \(2\);gato \/ pato \(2\)/);
  assert.match(csv, /;sí\r?$/m);
});
