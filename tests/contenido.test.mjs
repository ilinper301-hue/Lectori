// Pruebas del contenido: niveles, palabras, sílabas, textos, preguntas y pseudopalabras.
// Garantizan que todo lo que lee el niño usa solo letras ya enseñadas en ese nivel.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cargar } from './cargar.mjs';

const L = cargar();
const ORDER = L.json('ORDER');
const EXTRA = L.json('EXTRA.map(e=>({g:e.g,t:e.t}))');
const NIV = L.json('LV.map(l=>({u:l.u,g:l.g,x:!!l.x,w:l.w,s:l.s}))');
const TX = L.json('TX.map(t=>({i:t.i,x:t.x,q:t.q,o:t.o,l:t.l,n:t.n}))');
const CQ = L.json('CQ');
const PSW = L.json('PSW');
const TOTAL = ORDER.length + EXTRA.length;

// ---- Utilidades (copian la regla de la app, no la llaman, para detectar cambios por error) ----
const quitaTilde = u => ('áéíóú'.includes(u) ? 'aeiou'['áéíóú'.indexOf(u)] : u);
const unidades = w => w.match(/ll|ch|rr|[a-zñüáéíóú]/g) || [];
const palabras = t => t.toLowerCase().match(/[a-záéíóúñü]+/g) || [];
const idxExtra = g => ORDER.length + EXTRA.findIndex(e => e.g === g);

// Letras enseñadas al llegar al nivel `i`: las 29 del orden hasta ahí; desde los niveles
// extra, todas, más «rr» (nivel rr) y «ü» (nivel gü), que no están en ORDER.
function ensenadas(i) {
  const s = new Set(ORDER.slice(0, Math.min(i, ORDER.length - 1) + 1));
  if (i >= ORDER.length) ORDER.forEach(u => s.add(u));
  if (i >= idxExtra('rr')) s.add('rr');
  if (i >= idxExtra('gü')) s.add('ü');
  return s;
}
const noDecodificables = (txt, i) => {
  const ok = ensenadas(i);
  return palabras(txt).filter(w => unidades(w).map(quitaTilde).some(u => !ok.has(u)));
};
const real = new Set(L.ev('[...real()]'));

test('hay 45 niveles: 29 letras + 16 extra', () => {
  assert.equal(ORDER.length, 29);
  assert.equal(EXTRA.length, 16);
  assert.equal(NIV.length, 45);
  assert.equal(new Set(ORDER).size, ORDER.length, 'letras repetidas en ORDER');
  assert.equal(new Set(EXTRA.map(e => e.g)).size, EXTRA.length, 'etiquetas repetidas en EXTRA');
});

test('cada nivel de letra enseña la letra que dice ORDER; los extra están marcados', () => {
  NIV.forEach((l, i) => {
    if (i < ORDER.length) { assert.equal(l.u, ORDER[i]); assert.equal(l.x, false); }
    else assert.equal(l.x, true, `nivel ${i} debería ser extra`);
  });
});

test('las palabras de cada nivel usan solo letras ya enseñadas', () => {
  const fallos = [];
  NIV.forEach((l, i) => l.w.forEach(([w]) => {
    assert.ok(w && /^[a-záéíóúñü]+$/.test(w), `palabra rara «${w}» en el nivel ${i}`);
    if (noDecodificables(w, i).length) fallos.push(`${w} (nivel ${i} ${l.g})`);
  }));
  assert.deepEqual(fallos, []);
});

test('las sílabas de cada nivel usan solo letras ya enseñadas', () => {
  const fallos = [];
  NIV.forEach((l, i) => l.s.forEach(s => {
    if (noDecodificables(s, i).length) fallos.push(`${s} (nivel ${i} ${l.g})`);
  }));
  assert.deepEqual(fallos, []);
});

test('cada texto es decodificable en el nivel que se le calcula', () => {
  const fallos = [];
  TX.forEach(t => {
    assert.ok(Number.isInteger(t.l) && t.l >= 0 && t.l < TOTAL, `texto ${t.i}: nivel ${t.l} fuera de rango`);
    const m = noDecodificables(t.x, t.l);
    if (m.length) fallos.push(`texto ${t.i} (nivel ${t.l}): ${m.join(', ')}`);
  });
  assert.deepEqual(fallos, []);
});

test('el nivel de un texto nunca es menor que el de sus letras más difíciles', () => {
  // Si alguien rebaja t.l por error, el texto aparecería antes de enseñar sus letras.
  TX.forEach(t => {
    const mayor = Math.max(...palabras(t.x).flatMap(w => unidades(w).map(quitaTilde))
      .map(u => ORDER.indexOf(u)).filter(k => k >= 0));
    assert.ok(t.l >= mayor, `texto ${t.i}: nivel ${t.l} < ${mayor}`);
  });
});

test('los textos tienen pregunta y opciones distintas (la primera es la correcta)', () => {
  TX.forEach(t => {
    assert.ok(t.x.trim().length > 0, `texto ${t.i} vacío`);
    assert.ok(typeof t.q === 'string' && t.q.trim().length > 0, `texto ${t.i} sin pregunta`);
    assert.ok(Array.isArray(t.o) && t.o.length >= 2 && t.o.length <= 4, `texto ${t.i}: opciones`);
    assert.equal(new Set(t.o).size, t.o.length, `texto ${t.i}: opciones repetidas`);
  });
});

test('hay lecturas y frases sueltas, y solo unas pocas pasan de 40 palabras', () => {
  const largos = TX.filter(t => t.x.split(/\s+/).length > 40).length;
  assert.ok(largos <= 20, `demasiados textos largos: ${largos}`);
  assert.ok(TX.some(t => t.n === 1) && TX.some(t => t.n > 1));
});

test('CQ: los índices existen y la estructura es válida', () => {
  Object.entries(CQ).forEach(([k, c]) => {
    const t = TX[+k];
    assert.ok(Number.isInteger(+k) && t, `CQ[${k}] apunta a un texto que no existe`);
    assert.ok(c.w || c.vf, `CQ[${k}] vacío`);
    if (c.w) {
      assert.ok(Array.isArray(c.w) && c.w.length >= 2, `CQ[${k}].w`);
      assert.equal(new Set(c.w).size, c.w.length, `CQ[${k}].w repetidas`);
      c.w.forEach(x => assert.ok(typeof x === 'string' && x.length, `CQ[${k}].w vacía`));
    }
    if (c.vf) {
      assert.ok(Array.isArray(c.vf) && c.vf.length >= 2, `CQ[${k}].vf`);
      c.vf.forEach(([f, v]) => {
        assert.ok(typeof f === 'string' && f.length, `CQ[${k}].vf frase`);
        assert.ok(v === 0 || v === 1, `CQ[${k}].vf valor`);
      });
      assert.ok(c.vf.some(x => x[1] === 1) && c.vf.some(x => x[1] === 0),
        `CQ[${k}].vf debe tener una verdadera y una falsa`);
    }
  });
});

test('CQ: lo que lee el niño en las preguntas también es decodificable', () => {
  const fallos = [];
  Object.entries(CQ).forEach(([k, c]) => {
    const l = TX[+k].l;
    [...(c.w || []), ...(c.vf || []).map(x => x[0])].forEach(f => {
      const m = noDecodificables(f, l);
      if (m.length) fallos.push(`CQ[${k}] (nivel ${l}): ${m.join(', ')}`);
    });
  });
  assert.deepEqual(fallos, []);
});

test('pseudopalabras: ninguna es una palabra real y son decodificables en su nivel', () => {
  Object.entries(PSW).forEach(([k, lista]) => {
    const i = +k;
    assert.ok(Number.isInteger(i) && i >= 0 && i < TOTAL, `PSW[${k}]: nivel inexistente`);
    assert.ok(lista.length > 0, `PSW[${k}] vacío`);
    lista.forEach(w => {
      assert.ok(!real.has(w), `«${w}» (nivel ${i}) es una palabra real`);
      assert.deepEqual(noDecodificables(w, i), [], `«${w}» usa letras no enseñadas en el nivel ${i}`);
      assert.ok(w.length >= 3 && w.length <= 8, `«${w}» longitud rara`);
      assert.ok(!L.ev(`BADW.test(${JSON.stringify(w)})`), `«${w}» contiene un trozo no apto`);
    });
  });
});

test('pseudo(i) (con y sin banco fijo) nunca devuelve una palabra real', () => {
  for (let i = 0; i < TOTAL; i++) {
    for (let n = 0; n < 60; n++) {
      const w = L.ev(`pseudo(${i})`);
      if (!w) continue; // niveles sin sílabas ni banco: vacío, la app lo gestiona
      assert.ok(!real.has(w), `pseudo(${i}) dio la palabra real «${w}»`);
      assert.deepEqual(noDecodificables(w, i), [], `pseudo(${i}) dio «${w}», no decodificable`);
    }
  }
});
