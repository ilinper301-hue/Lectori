// Carga el <script> de index.html en Node (node:vm) con sustitutos mínimos del navegador,
// para poder probar las funciones de datos y el contenido sin abrir un navegador.
// Uso:  import { cargar } from './cargar.mjs';  const L = cargar();  L.ev('LV.length')  → 45
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
// LECTORI_INDEX permite probar otra copia de index.html (por ejemplo, para comprobar que las pruebas detectan fallos).
export const INDEX = process.env.LECTORI_INDEX || path.join(AQUI, '..', 'index.html');

// Devuelve el código del <script> principal (el único sin atributo src).
export function scriptDeIndex(html = fs.readFileSync(INDEX, 'utf8')) {
  const m = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('No se encontró el <script> en index.html');
  return m[1];
}

// Objeto «comodín»: acepta cualquier propiedad y cualquier llamada (como un document vacío).
function comodin() {
  const f = function () {};
  const p = new Proxy(f, {
    get(t, k) {
      if (k === Symbol.toPrimitive) return () => '';
      if (k === 'length') return 0;
      if (k === 'then') return undefined; // para que no parezca una promesa
      if (k in t && k !== 'name') return t[k];
      return p;
    },
    set(t, k, v) { t[k] = v; return true; },
    apply() { return p; },
    construct() { return p; },
  });
  return p;
}

// localStorage en memoria. `inicial` = { clave: valor-texto }.
export function memoria(inicial = {}) {
  const d = new Map(Object.entries(inicial));
  return {
    getItem: k => (d.has(String(k)) ? d.get(String(k)) : null),
    setItem: (k, v) => { d.set(String(k), String(v)); },
    removeItem: k => { d.delete(String(k)); },
    clear: () => d.clear(),
    key: i => [...d.keys()][i] ?? null,
    get length() { return d.size; },
    _datos: d,
  };
}

// cargar({ ls: {ar2: '{"ps":[]}'} }) → { ctx, ev, localStorage }
export function cargar({ ls = {}, ahora } = {}) {
  const localStorage = memoria(ls);
  const doc = comodin();
  const base = {
    document: doc,
    localStorage,
    navigator: { onLine: false, userAgent: 'node', language: 'es-ES', serviceWorker: undefined, mediaDevices: undefined },
    speechSynthesis: { cancel() {}, speak() {}, getVoices: () => [], onvoiceschanged: null, addEventListener() {} },
    SpeechSynthesisUtterance: function () {},
    Audio: function () { return comodin(); },
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
    addEventListener() {}, removeEventListener() {},
    fetch: () => Promise.reject(new Error('sin red en las pruebas')),
    setInterval: () => 0, clearInterval() {},
    setTimeout: () => 0, clearTimeout() {},
    requestAnimationFrame: () => 0,
    getComputedStyle: () => comodin(),
    FileReader: function () {},
    Blob: function () {}, URL: { createObjectURL: () => '', revokeObjectURL() {} },
    console: { log() {}, warn() {}, error() {} },
    location: { href: 'http://localhost/', search: '', hash: '', reload() {} },
    history: { pushState() {}, replaceState() {} },
    crypto: globalThis.crypto,
    TextEncoder, TextDecoder,
  };
  const ctx = vm.createContext(base);
  ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx;
  if (ahora != null) {
    // Fecha fija (para probar rachas): Date() sin argumentos devuelve `ahora`.
    const RealDate = Date;
    class FakeDate extends RealDate {
      constructor(...a) { if (a.length) super(...a); else super(ahora); }
      static now() { return ahora; }
    }
    ctx.Date = FakeDate;
  }
  vm.runInContext(scriptDeIndex(), ctx, { filename: 'index.html' });
  return {
    ctx,
    localStorage,
    // Evalúa código dentro de la app y devuelve el resultado tal cual (objetos de otro «mundo» de vm).
    ev: codigo => vm.runInContext(codigo, ctx),
    // Igual, pero pasa el resultado por JSON: sirve para comparar con assert.deepStrictEqual.
    json: codigo => JSON.parse(vm.runInContext(`JSON.stringify(${codigo})`, ctx) ?? 'null'),
  };
}
