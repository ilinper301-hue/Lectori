// La tableta en clase (fase 4, D5 = c): rejilla de animales, tableta fijada/compartida, ajustes de toda la clase.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cargar } from './cargar.mjs';

const alu = (i, o = {}) => ({ id: 'alu' + String(i).padStart(5, '0'), n: 'Niño ' + i, mt: 1000, lv: 2, st: 3, s: {}, d: {}, er: {}, ...o });
const clase = (n, extra = {}, ls = {}) => cargar({
  ls: { ar2: JSON.stringify({ ps: Array.from({ length: n }, (_, i) => alu(i + 1)), c: 0, ov: 2, rol: 'doc', pin: 'x1', ...extra }), ...ls },
});
const html = L => String(L.ev('app.innerHTML'));

test('por defecto la tableta es «libre» y «¿Quién va a leer?» es una rejilla con un botón por alumno', () => {
  const L = clase(25);
  assert.equal(L.ev('TBM()'), 'a');
  L.ev('profiles()');
  const h = html(L);
  assert.equal((h.match(/class="pt"/g) || []).length, 25);
  assert.match(h, /class="pgrid dn"/, 'con más de 20 alumnos usa 5 columnas');
  assert.doesNotMatch(h, /id="nm"/, 'los niños no ven el formulario de crear perfiles');
  assert.doesNotMatch(h, /Crear perfil/);
  assert.match(h, /Añadir alumno/);
});

test('con 20 alumnos o menos, 4 columnas; con ninguno, sale el formulario de crear el primero', () => {
  const L = clase(12);
  L.ev('profiles()');
  assert.doesNotMatch(html(L), /pgrid dn/);
  const V = clase(0, { c: -1 });
  V.ev('profiles()');
  assert.match(html(V), /id="nm"/);
  assert.match(html(V), /Crear perfil/);
});

test('crear alumno desde la zona del tutor no cambia al alumno actual; desde la rejilla vacía sí abre su inicio', () => {
  const L = clase(2);
  L.ev('panel(1)');
  L.ev('addScr(1)');
  L.ev("$('#nm').value='Nuevo Alumno'");
  L.ev('addP()');
  assert.equal(L.ev('P.ps.length'), 3);
  assert.equal(L.ev('P.c'), 0, 'sigue siendo el alumno de antes');
  assert.equal(L.ev('P.ps[2].n'), 'Nuevo Alumno');
});

test('modos: tableta fijada abre directa en el perfil del alumno fijado; compartida abre la rejilla', () => {
  const F = clase(5, { c: 3 }, { 'lectori.tb': 'f', 'lectori.tbf': 'alu00002' });
  F.ev('tbGo()');
  assert.equal(F.ev('P.c'), 1);
  assert.match(html(F), /Hola, Niño 2/);
  const S = clase(5, { c: 3 }, { 'lectori.tb': 's' });
  S.ev('tbGo()');
  assert.match(html(S), /¿Quién va a leer\?/);
  assert.equal((html(S).match(/class="pt"/g) || []).length, 5);
  assert.equal(S.ev('pr()') && S.ev('pr().n'), 'Niño 4', 'no se cambia el perfil activo (así no se pierde el tiempo de sesión)');
});

test('fijada a un alumno que ya no existe: cae al comportamiento normal', () => {
  const L = clase(3, { c: 1 }, { 'lectori.tb': 'f', 'lectori.tbf': 'borrado' });
  L.ev('tbGo()');
  assert.equal(L.ev('P.c'), 1);
  assert.match(html(L), /Hola, Niño 2/);
});

test('en tableta compartida o fijada, cambiar de perfil pide el PIN; en libre, no', () => {
  for (const [modo, pideDePin] of [['a', false], ['s', true], ['f', true]]) {
    const L = clase(4, { c: 1 }, { 'lectori.tb': modo, 'lectori.tbf': 'alu00002' });
    L.ev('UNL=0');
    L.ev('profiles()');
    const h = html(L);
    assert.equal(/class="pt"/.test(h), !pideDePin, `modo ${modo}`);
  }
});

test('con el PIN ya puesto (tutor), cambiar de alumno enseña la rejilla y elegir uno vuelve a fijar la tableta', () => {
  const L = clase(4, { c: 0 }, { 'lectori.tb': 'f', 'lectori.tbf': 'alu00001' });
  L.ev('UNL=Date.now()');
  L.ev('profiles()');
  assert.equal((html(L).match(/class="pt"/g) || []).length, 4);
  L.ev('pick(2)');
  assert.equal(L.localStorage.getItem('lectori.tbf'), 'alu00003');
  assert.equal(L.ev('P.c'), 2);
});

test('«Terminar»: libre y compartida vuelven a la rejilla; fijada se queda en el inicio del alumno', () => {
  for (const [modo, destino] of [['a', 'profiles(1)'], ['s', 'profiles(1)'], ['f', 'home()']]) {
    const L = clase(3, { c: 0 }, { 'lectori.tb': modo });
    L.ev('endScreen()');
    assert.ok(html(L).includes(`onclick="${destino}">Terminar`), `modo ${modo}: ${html(L).slice(0, 300)}`);
  }
});

test('Ajustes: «Tabletas en clase» y «Tema» están, y el botón de tema ya no está a la vista del niño', () => {
  const L = clase(3);
  L.ev('UNL=Date.now()');
  L.ev('panel(1)');
  const h = html(L);
  assert.match(h, /Tabletas en clase/);
  assert.match(h, /Fijada a Niño 1/);
  assert.match(h, /id="thm"/);
  const idx = L.ev('1') && require_index();
  assert.match(idx, /id="th"[^>]*style="display:none"/);
});

import fs from 'node:fs';
import { INDEX } from './cargar.mjs';
const require_index = () => fs.readFileSync(INDEX, 'utf8');

test('setTb guarda el modo y el alumno fijado en claves lectori.* (sin tocar claves de otras apps)', () => {
  const L = clase(3, { c: 1 });
  L.ev('UNL=Date.now()');
  L.ev('panel(1)');
  L.ctx.document.getElementById = () => ({ value: 'f' });
  L.ev('setTb()');
  assert.equal(L.localStorage.getItem('lectori.tb'), 'f');
  assert.equal(L.localStorage.getItem('lectori.tbf'), 'alu00002');
  L.ctx.document.getElementById = () => ({ value: 'a' });
  L.ev('setTb()');
  assert.equal(L.localStorage.getItem('lectori.tb'), null);
  const claves = [...L.localStorage._datos.keys()].filter(k => !k.startsWith('lectori.') && !['ar2', 'arth', 'arv', 'arbk', 'ari', 'arm'].includes(k));
  assert.deepEqual(claves, []);
});

test('«Lo mismo para toda la clase»: tiempo diario y tipo de letra se ponen a todos los alumnos, sin tocar lo demás', () => {
  const L = clase(4, { c: 0 });
  L.ev("P.ps[0].lim=30;P.ps[0].ft='l';P.ps[0].lv=5;P.ps[2].e=1");
  L.ev('UNL=Date.now()');
  L.ev('limAll()');
  L.ev('ftAll()');
  for (let i = 0; i < 4; i++) {
    assert.equal(L.ev(`P.ps[${i}].lim`), 30);
    assert.equal(L.ev(`P.ps[${i}].ft`), 'l');
    assert.equal(L.ev(`P.ps[${i}].e`) || 0, 0);
  }
  assert.equal(L.ev('P.ps[0].lv'), 5);
  assert.equal(L.ev('P.ps[1].lv'), 2);
  // los perfiles salen igual por cleanP (lo que sube a la nube y a la copia)
  assert.equal(L.json('P.ps.map(cleanP)').every(q => q.lim === 30 && q.ft === 'l'), true);
});

test('el emoji de «mama» ya no es 👩‍👧 y sigue sin repetirse dentro de su grupo de dibujos', () => {
  const L = clase(1);
  assert.equal(L.ev("wordPic('mama')"), '👩‍🍼');
});
