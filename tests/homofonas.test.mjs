// Fase 1: opciones justas. Lo que suena igual nunca compite de oído; en construir y dictado sí puede salir.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cargar } from './cargar.mjs';

const TIRADAS = 2000;
const PERFIL = (lv, s = {}) => JSON.stringify({ ps: [{ id: 'abc123', n: 'Ana', av: 0, lv, s, er: {} }], c: 0, ov: 2, rol: 'doc' });
const app = (sz, lv = 44) => {
  const L = cargar({ ls: { ar2: PERFIL(lv), ...(sz == null ? {} : { 'lectori.sz': String(sz) }) } });
  return L;
};

test('hk/hom: parejas que suenan igual', () => {
  const L = app();
  const si = [['b', 'v'], ['c', 'q'], ['c', 'k'], ['q', 'k'], ['ll', 'y'], ['va', 'ba'], ['ge', 'je'], ['gi', 'ji'], ['que', 'ke'], ['ca', 'ka'],
    ['qui', 'ki'], ['lla', 'ya'], ['ha', 'a'], ['ce', 'ze'], ['ce', 'se'], ['z', 's'], ['zo', 'so'], ['ci', 'si']];
  for (const [a, b] of si) assert.ok(L.ev(`hom(${JSON.stringify(a)},${JSON.stringify(b)})`), `${a} y ${b} suenan igual`);
});

test('hk/hom: parejas que NO suenan igual', () => {
  const L = app();
  const no = [['b', 'd'], ['p', 'q'], ['m', 'n'], ['g', 'j'], ['ga', 'ja'], ['gue', 'ge'], ['güe', 'gue'], ['r', 'rr'], ['ca', 'sa'], ['ce', 'ke'],
    ['ba', 'bo'], ['ch', 'll'], ['i', 'y'], ['c', 'z'], ['l', 'r'], ['ma', 'am']];
  for (const [a, b] of no) assert.ok(!L.ev(`hom(${JSON.stringify(a)},${JSON.stringify(b)})`), `${a} y ${b} no suenan igual`);
});

test('sin seseo ni ceceo (lectori.sz=0): s/z/ce/ci se distinguen, ce/ze/ci/zi siguen iguales', () => {
  const L = app(0);
  for (const [a, b] of [['s', 'z'], ['sa', 'za'], ['se', 'ce'], ['si', 'ci'], ['so', 'zo']]) assert.ok(!L.ev(`hom(${JSON.stringify(a)},${JSON.stringify(b)})`), `${a} y ${b} distintas`);
  for (const [a, b] of [['ce', 'ze'], ['ci', 'zi'], ['b', 'v'], ['ge', 'je']]) assert.ok(L.ev(`hom(${JSON.stringify(a)},${JSON.stringify(b)})`), `${a} y ${b} iguales`);
});

for (const sz of [1, 0]) {
  test(`«¿Qué letra suena?» (dstr): 200 tiradas por letra, cada 4 niveles, sin pareja homófona (sz=${sz})`, () => {
    const L = app(sz);
    const r = L.json(`(()=>{const mal=[];let sinOpc=0;for(let i=0;i<LV.length;i+=4){const pool=ORDER.slice(0,Math.min(i,ORDER.length-1)+1);for(const t of pool){for(let n=0;n<${TIRADAS}/10;n++){const d=dstr(t,pool,2);
      if(d.length<2&&pool.length>=4)sinOpc++;for(const x of d)if(hom(x,t)||x==t)mal.push(t+'>'+x)}}}return{mal:[...new Set(mal)],sinOpc}})()`);
    assert.deepEqual(r.mal, []);
    assert.equal(r.sinOpc, 0, 'siempre hay 2 distractores cuando hay 4 o más letras');
  });
  test(`«¿Qué sílaba suena?» (dstrS): 200 tiradas por sílaba, cada 3 niveles, sin pareja homófona (sz=${sz})`, () => {
    const L = app(sz);
    const r = L.json(`(()=>{const mal=[];let corto=0;for(let i=0;i<LV.length;i+=3){const all=sylsTo(i);for(const t of LV[i].s){for(let n=0;n<${TIRADAS}/10;n++){const d=dstrS(t,all,2);
      if(d.length<2)corto++;for(const x of d)if(hom(x,t)||x==t)mal.push(t+'>'+x)}}}return{mal:[...new Set(mal)],corto}})()`);
    assert.deepEqual(r.mal, []);
    assert.equal(r.corto, 0, 'siempre hay 2 distractores');
  });
}

test('casos del plan: v nunca con b; ll nunca con y; z nunca con s; va nunca con ba; ge nunca con je; ce nunca con ze/se', () => {
  const L = app(1);
  const casos = [['dstr', 'v', 'b'], ['dstr', 'k', 'c'], ['dstr', 'k', 'q'], ['dstr', 'll', 'y'], ['dstr', 'y', 'll'], ['dstr', 'z', 's'], ['dstr', 'z', 'c'],
    ['dstrS', 'va', 'ba'], ['dstrS', 'ge', 'je'], ['dstrS', 'ce', 'ze'], ['dstrS', 'ce', 'se']];
  for (const [f, t, malo] of casos) {
    const r = L.ev(`(()=>{const k=${f=='dstr'?`ORDER`:`sylsTo(LV.length-1)`};let c=0;for(let n=0;n<${TIRADAS};n++)if(${f}(${JSON.stringify(t)},k,2).includes(${JSON.stringify(malo)}))c++;return c})()`);
    // «c» como opción para z no es homófona (c suena /k/): solo se exige para los pares que suenan igual
    if (t === 'z' && malo === 'c') continue;
    assert.equal(r, 0, `${t} con ${malo} (${f})`);
  }
});

test('construir y dictado (bank) y construir sílabas SÍ pueden mantener homófonas (ortografía)', () => {
  const L = app(1);
  const sale = L.ev(`(()=>{const k=ORDER;let c=0;for(let n=0;n<${TIRADAS};n++)if(bank(['v','a'],k,3).includes('b'))c++;return c})()`);
  assert.ok(sale > 0, 'en construir, «b» puede salir junto a «v»');
  const sale2 = L.ev(`(()=>{const k=sylsTo(LV.length-1);let c=0;for(let n=0;n<${TIRADAS};n++)if(dstrS('va',k,2,[],1).includes('ba'))c++;return c})()`);
  assert.ok(sale2 > 0, 'en construir sílabas, «ba» puede salir junto a «va»');
});

test('«¿Con qué sílaba empieza?» (itemSylFind) y itemChoose: las opciones pintadas no incluyen homófonas', () => {
  // Se captura lo que se pinta: draw() se sustituye por una función que guarda el HTML.
  const L = app(1);
  const r = L.json(`(()=>{const mal=[];let html='';const get=()=>String(app.innerHTML);
    for(const [t,m] of [['v','b'],['ll','y'],['k','c'],['k','q'],['z','s']]){for(let n=0;n<300;n++){itemChoose(LV.length-1,()=>{},t);html=get();const o=[...html.matchAll(/id="o\\d">([^<]+)</g)].map(x=>x[1]);if(!o.includes(t)||o.includes(m))mal.push(t+'/'+o.join(','))}}
    for(let n=0;n<300;n++){itemSylFind(['vaca','',['va','ca']],()=>{});html=get();const o=[...html.matchAll(/id="o\\d"[^>]*>([^<]+)</g)].map(x=>x[1]);if(o.includes('ba'))mal.push('va/'+o.join(','))}
    return [...new Set(mal)]})()`);
  assert.deepEqual(r, []);
});

test('rec(): cada fallo suma también en el contador nuevo n; «Le cuesta» ignora fallos antiguos solo de homófonas', () => {
  const L = app(1);
  const r = L.json(`(()=>{const p=pr();p.s={v:{b:0,d:0},m:{b:0,d:0}};p.er={v:{a:5,e:5},m:{a:5,e:5}};
    const antes=[['v',fe(p,'v')],['m',fe(p,'m')]];rec('v',false);rec('m',false);
    return{antes,despues:[fe(p,'v'),fe(p,'m')],v:p.er.v,m:p.er.m}})()`);
  assert.deepEqual(r.antes, [['v', false], ['m', true]], 'v (homófona de b) con solo fallos antiguos no se pinta; m sí');
  assert.equal(r.despues[0], true, 'tras un fallo nuevo de v, ya cuenta');
  assert.equal(r.v.e, 6); assert.equal(r.v.n, 1);
  assert.equal(r.m.e, 6);
});

test('cleanP conserva el contador nuevo n y un perfil sin n sigue funcionando', () => {
  const L = app(1);
  const r = L.json(`(()=>{const a=cleanP({n:'Ana',er:{v:{a:3,e:2,n:1},m:{a:2,e:1}}});const b=cleanP(JSON.parse(JSON.stringify(a)));return{a:a.er,b:b.er}})()`);
  assert.deepEqual(r.a, { v: { a: 3, e: 2, n: 1 }, m: { a: 2, e: 1 } });
  assert.deepEqual(r.b, r.a, 'idempotente');
});
