// Fase 3: «Lee y toca». Opciones justas (dibujos y palabras falsas), datos (cleanP/mergeP) y registro (ltRec).
import test from 'node:test';
import assert from 'node:assert/strict';
import { cargar } from './cargar.mjs';

const TIRADAS = 20;
const PENDIENTES = []; // niveles (letra LV[i].g) a la espera de dibujos nuevos; quitar de aquí al llegar
const PERFIL = (extra = {}) => JSON.stringify({ ps: [{ id: 'abc123x', n: 'Ana', lv: 44, ...extra }], c: 0, rol: 'doc' });
const app = (extra) => cargar({ ls: { ar2: PERFIL(extra) } });

// Ejecuta `cuerpo` dentro de la app; debe devolver una lista de fallos (texto). Se comprueba que esté vacía.
const fallos = (L, cuerpo) => JSON.parse(L.ev(`JSON.stringify((()=>{const F=[];${cuerpo};return F.slice(0,15)})())`));

test('ltDis: 2 dibujos distintos, de grupos distintos, sin palabras excluidas', () => {
  const L = app();
  const F = fallos(L, `for(let i=0;i<LV.length;i++)for(const q of ltLv(i)){const[w,e]=LV[i].w[q];
    for(let t=0;t<${TIRADAS};t++){const d=ltDis(w,e,i),ms=[e,...d.map(x=>x[1])];
      if(d.length!=2){F.push(i+' '+w+' len '+d.length);continue}
      if(new Set(ms).size!=3)F.push(i+' '+w+' emojis repetidos '+ms);
      if(new Set(ms.map(emg)).size!=3)F.push(i+' '+w+' grupos repetidos '+ms);
      if(d.some(x=>LTX.has(x[0])))F.push(i+' '+w+' excluida '+d.map(x=>x[0]))}}`);
  assert.deepEqual(F, []);
});

test('ltWDis: 2 palabras falsas justas y con letras ya conocidas', () => {
  const L = app();
  const F = fallos(L, `for(let i=0;i<LV.length;i++)for(const q of ltLv(i)){const[w,e]=LV[i].w[q],K=new Set(ORDER.slice(0,i+1)),UW=units(w);
    for(let t=0;t<${TIRADAS};t++){const d=ltWDis(w,e,i),id=i+' '+w+' ';
      if(d.length!=2||d[0]===d[1]){F.push(id+'len/iguales '+d);continue}
      for(const x of d){
        if(x===w)F.push(id+'igual');
        if(hk(x)===hk(w))F.push(id+'suena igual '+x);
        if(LTB.has(unacc(x)))F.push(id+'prohibida '+x);
        if(LTX.has(x))F.push(id+'excluida '+x);
        if(ltGen(w,x)||(x.length==w.length&&x.slice(0,-1)==w.slice(0,-1)&&'oa'.includes(x.slice(-1))&&'oa'.includes(w.slice(-1))))F.push(id+'género '+x);
        const p=wordPic(x);if(p&&emg(p)===emg(e))F.push(id+'dibujo confundible '+x);
        for(const u0 of units(x)){const u=unacc(u0);if(!K.has(u)&&!UW.map(unacc).includes(u))F.push(id+'letra no enseñada '+u+' en '+x)}}}}`);
  assert.deepEqual(F, []);
});

test('ltVar: variantes de una sola letra, sin tocar el final o/a ni ñ inicial', () => {
  const L = app();
  const F = fallos(L, `for(let i=0;i<LV.length;i++)for(const q of ltLv(i)){const w=LV[i].w[q][0],U=units(w),f=w.slice(-1);
    for(const v of ltVar(w,i)){const V=units(v),id=i+' '+w+'→'+v;
      if(v[0]=='ñ')F.push(id+' empieza por ñ');
      if('oa'.includes(f)&&v.slice(-1)!==f)F.push(id+' cambia el final');
      if(V.length!=U.length)F.push(id+' otra longitud');
      else if(V.filter((u,k)=>u!==U[k]).length!=1)F.push(id+' no difiere en una unidad')}}`);
  assert.deepEqual(F, []);
});

test('niveles con palabras tienen al menos 2 usables en Lee y toca (salvo pendientes)', () => {
  const L = app();
  const r = L.json('LV.map((l,i)=>[i,l.g,l.w.length,ltLv(i).length])');
  for (const [i, g, n, u] of r) {
    if (!n) continue;
    if (PENDIENTES.includes(g)) assert.ok(u < 2, `nivel ${i} («${g}») ya tiene ${u}: quítalo de PENDIENTES`);
    else assert.ok(u >= 2, `nivel ${i} («${g}») solo tiene ${u} palabras usables`);
  }
});

test('cleanP: conserva rm, lm, pg.mw y pg.m; es idempotente', () => {
  const L = app();
  const pg = { i: 12, s: 'pal', k: 1, o: 0, n: 1, h: 1, f: 0, rw: [0, 1], bs: [], rs: [], wx: [], wu: [], pw: '', mw: [0, 2, 3], m: 1 };
  L.ev(`var __p=${JSON.stringify({ id: 'abc123x', n: 'Ana', lv: 5, rm: 's', lm: { a: 5, o: 3 }, pg })}`);
  const c = L.json('cleanP(__p)');
  assert.equal(c.rm, 's');
  assert.deepEqual(c.lm, { a: 5, o: 3 });
  assert.deepEqual(c.pg.mw, [0, 2, 3]);
  assert.equal(c.pg.m, 1);
  assert.deepEqual(L.json('cleanP(cleanP(__p))'), c);
});

test('cleanP: rm desconocido pasa a t; sin rm/lm no aparece lm', () => {
  const L = app();
  assert.equal(L.json(`cleanP({id:'abc123x',n:'A',rm:'x'}).rm`), 't');
  const v = L.json(`cleanP({id:'abc123x',n:'A',lv:3})`);
  assert.equal(v.rm, 't');
  assert.ok(!('lm' in v));
});

test('mergeP: gana el lm con más intentos, sea cual sea el orden', () => {
  const L = app();
  const A = { id: 'abc123x', n: 'Ana', lv: 3, mt: 100, lm: { a: 9, o: 5 } }, B = { id: 'abc123x', n: 'Ana', lv: 3, mt: 200, lm: { a: 4, o: 2 } };
  // el más nuevo tiene menos intentos
  assert.equal(L.json(`mergeP(${JSON.stringify(A)},${JSON.stringify(B)}).lm.a`), 9);
  assert.equal(L.json(`mergeP(${JSON.stringify(B)},${JSON.stringify(A)}).lm.a`), 9);
  // el más nuevo tiene más intentos
  const A2 = { ...A, mt: 300 };
  assert.equal(L.json(`mergeP(${JSON.stringify(A2)},${JSON.stringify(B)}).lm.a`), 9);
  assert.equal(L.json(`mergeP(${JSON.stringify(B)},${JSON.stringify(A2)}).lm.a`), 9);
  // solo un lado tiene lm (el viejo o el nuevo)
  const S = { id: 'abc123x', n: 'Ana', lv: 3, mt: 50 }, T = { ...S, mt: 500 };
  for (const [x, y] of [[{ ...S, lm: { a: 2, o: 1 } }, T], [S, { ...T, lm: { a: 2, o: 1 } }]]) {
    assert.deepEqual(L.json(`mergeP(${JSON.stringify(x)},${JSON.stringify(y)}).lm`), { a: 2, o: 1 });
    assert.deepEqual(L.json(`mergeP(${JSON.stringify(y)},${JSON.stringify(x)}).lm`), { a: 2, o: 1 });
  }
});

test('ltRec y SOLA: cuenta intentos y aciertos, deja la palabra en nivel 0 tras fallar', () => {
  const L = app();
  assert.equal(L.ev('SOLA()'), false);
  L.ev(`ltRec('pato',true);ltRec('pato',true);ltRec('pato',false)`);
  assert.deepEqual(L.json('pr().lm'), { a: 3, o: 2 });
  assert.equal(L.ev('pr().ws.pato.b'), 0);
  L.ev(`pr().rm='s'`);
  assert.equal(L.ev('SOLA()'), true);
});
