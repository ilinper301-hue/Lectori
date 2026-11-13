// Fase 1: la app solo pide audios que existen (0 peticiones 404) y la lista AUDL coincide con la carpeta audio/.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cargar } from './cargar.mjs';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const enDisco = () => {
  const r = [];
  for (const d of fs.readdirSync(path.join(RAIZ, 'audio'))) {
    const dir = path.join(RAIZ, 'audio', d);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) if (/\.(mp3|m4a|ogg|wav)$/i.test(f)) r.push(`${d}/${f}`);
  }
  return r.sort();
};

test('AUDL (audios que la app cree que existen) coincide con los archivos de audio/', () => {
  const L = cargar();
  const ext = L.ev('AUDX');
  const lista = L.json('[...AUDL]').map(x => `${x}.${ext}`).sort();
  assert.deepEqual(lista, enDisco());
});

test('say(): pide a la red solo audios de AUDL; lo demás lo dice la voz sin petición', async () => {
  const L = cargar();
  const pedidos = [], hablado = [];
  L.ctx.Audio = function (src) { pedidos.push(src); const a = { src, pause() {}, play() { setTimeout(() => a.onplaying && a.onplaying(), 0); setTimeout(() => a.onended && a.onended(), 1); return Promise.resolve(); } }; return a; };
  L.ctx.SpeechSynthesisUtterance = function (t) { this.text = t; };
  L.ctx.speechSynthesis = { cancel() {}, getVoices: () => [], speak(u) { hablado.push(u.text); setTimeout(() => u.onend && u.onend(), 0); } };
  L.ctx.setTimeout = setTimeout;
  // Letra con audio, sílaba con audio, y los que no lo tienen.
  await L.ev(`say('l:m','mmm',.6)`);
  await L.ev(`say('s:ha','ha',.7)`);
  await L.ev(`say('s:ma','ma',.7)`);
  await L.ev(`say('w:mesa','mesa',.65)`);
  await L.ev(`say('l:rr','rrrr',.6)`);
  await L.ev(`say('i:c','Toca la letra',.9)`);
  assert.deepEqual(pedidos, ['audio/letras/m.wav', 'audio/silabas/ha.wav']);
  assert.deepEqual(hablado, ['ma', 'mesa', 'rrrr', 'Toca la letra']);
  // Repetir una sílaba sin audio no vuelve a intentar nada.
  await L.ev(`say('s:ma','ma',.7)`);
  assert.equal(pedidos.length, 2);
});

test('sndL: no pide nunca «<letra>-largo» (no existe ninguno)', async () => {
  const L = cargar();
  const pedidos = [];
  L.ctx.Audio = function (src) { pedidos.push(src); const a = { src, pause() {}, play() { setTimeout(() => a.onplaying && a.onplaying(), 0); setTimeout(() => a.onended && a.onended(), 1); return Promise.resolve(); } }; return a; };
  L.ctx.setTimeout = setTimeout;
  L.ctx.SpeechSynthesisUtterance = function (t) { this.text = t; };
  L.ctx.speechSynthesis = { cancel() {}, getVoices: () => [], speak(u) { setTimeout(() => u.onend && u.onend(), 0); } };
  for (const u of ['m', 's', 'l', 'a', 'll']) await L.ev(`sndL(${JSON.stringify(u)})`);
  assert.ok(pedidos.every(x => !/-largo/.test(x)), pedidos.join(', '));
});

test('el arranque solo precarga archivos de AUDL (sin .mp3 inexistentes)', () => {
  const src = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
  assert.ok(src.includes("[...AUDL].forEach(id=>fetch('audio/'+id+'.'+AUDX)"));
  assert.ok(!src.includes("['mp3','wav'].forEach"));
});
