#!/usr/bin/env python3
"""Prueba de humo de Lectori (Playwright + Chromium, sin ventana).

Recorre lo esencial como lo haría una persona: arranque sin cuenta, perfil Docente con PIN,
crear un alumno, hacer un ejercicio, entrar en la zona del tutor y abrir sus pantallas.
Comprueba que no hay errores de JavaScript ni de consola y que ninguna pantalla desborda en
horizontal. Se repite a 390×844 y 768×1024, en tema claro y oscuro.

Uso (desde la carpeta del proyecto):
    python3 tests/humo.py                 # las 4 combinaciones
    python3 tests/humo.py --rapido        # solo 390×844 claro
    HUMO_CAPTURAS=/tmp/capturas python3 tests/humo.py   # además guarda una captura por pantalla

Termina con código 0 si todo va bien y 1 si algo falla. No cambia ningún archivo del proyecto.
"""
import os
import socket
import subprocess
import sys
import time
from pathlib import Path

if Path('/opt/pw-browsers').exists():
    os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', '/opt/pw-browsers')
from playwright.sync_api import sync_playwright  # noqa: E402

# HUMO_RAIZ permite probar otra carpeta con la app (por ejemplo, una copia estropeada a propósito).
RAIZ = Path(os.environ.get('HUMO_RAIZ') or Path(__file__).resolve().parent.parent)
PIN = '1234'
VISTAS = [(390, 844), (768, 1024)]
TEMAS = ['light', 'dark']
CAPTURAS = os.environ.get('HUMO_CAPTURAS')


def puerto_libre():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


class Corrida:
    """Una pasada completa con una vista y un tema; acumula los fallos."""

    def __init__(self, browser, url, ancho, alto, tema):
        self.etiqueta = f'{ancho}×{alto} {"claro" if tema == "light" else "oscuro"}'
        self.fallos = []
        self.audio404 = set()
        self.pasos = 0
        # Sin service worker (no ensucia la caché) y sin red externa (Google Fonts, Firebase…).
        self.ctx = browser.new_context(viewport={'width': ancho, 'height': alto}, service_workers='block')
        self.ctx.add_init_script(f"try{{localStorage.setItem('arth','{tema}')}}catch(e){{}}")
        self.ctx.route(lambda u: 'localhost' not in u and '127.0.0.1' not in u, lambda r: r.abort())
        self.pg = self.ctx.new_page()
        self.pg.set_default_timeout(8000)
        self.pg.on('pageerror', lambda e: self.falla(f'error de JavaScript: {e}'))
        self.pg.on('console', self._consola)
        self.pg.on('response', self._respuesta)
        self.url = url

    # --- registro de problemas ---
    def falla(self, msg):
        if msg not in self.fallos:
            self.fallos.append(msg)

    def _consola(self, m):
        # Los «Failed to load resource» son peticiones fallidas (fuentes externas bloqueadas, audios que
        # faltan): no son errores del código. Los audios se cuentan aparte (arregla la fase 1).
        if m.type == 'error' and not m.text.startswith('Failed to load resource'):
            self.falla(f'error en consola: {m.text[:160]}')

    def _respuesta(self, r):
        if r.status >= 400 and '/audio/' in r.url:
            self.audio404.add(r.url)
        elif r.status >= 400 and ('localhost' in r.url or '127.0.0.1' in r.url):
            self.falla(f'{r.status} en {r.url}')

    # --- ayudas ---
    def revisa(self, nombre, texto=None):
        """Comprueba que la pantalla tiene contenido, no desborda en horizontal y (opcional) contiene `texto`."""
        pg = self.pg
        pg.wait_for_timeout(350)
        self.pasos += 1
        info = pg.evaluate("""()=>({vacio:!(document.querySelector('#app')||{}).innerText||!document.querySelector('#app').innerText.trim(),
            ancho:document.documentElement.scrollWidth,vp:window.innerWidth,
            texto:(document.querySelector('#app')||{innerText:''}).innerText})""")
        if info['vacio']:
            self.falla(f'«{nombre}»: pantalla vacía')
        if info['ancho'] > info['vp'] + 1:
            self.falla(f'«{nombre}»: desborda en horizontal ({info["ancho"]} px > {info["vp"]} px)')
        if texto and texto.lower() not in info['texto'].lower():
            self.falla(f'«{nombre}»: no aparece «{texto}»')
        if CAPTURAS:
            Path(CAPTURAS).mkdir(parents=True, exist_ok=True)
            seguro = ''.join(c if c.isalnum() else '_' for c in nombre)
            pg.screenshot(path=str(Path(CAPTURAS) / f'{self.etiqueta.replace(" ", "_")}_{self.pasos:02d}_{seguro}.png'))

    def boton(self, nombre, exacto=True):
        self.pg.get_by_role('button', name=nombre, exact=exacto).first.click()
        self.pg.wait_for_timeout(400)

    def pin(self):
        for d in PIN:
            self.boton(d)

    def ir(self, js, nombre, texto=None):
        """Abre una pantalla llamando a su función (como hace su botón) y la revisa."""
        self.pg.evaluate(js)
        self.revisa(nombre, texto)

    # --- el recorrido ---
    def recorre(self):
        pg = self.pg
        pg.goto(self.url)
        pg.wait_for_timeout(600)
        self.revisa('bienvenida', 'Bienvenido')
        self.boton('Empezar sin cuenta', exacto=False)
        self.revisa('perfil de uso', 'Perfil Docente')
        self.boton('Perfil Docente', exacto=False)
        self.revisa('crear PIN', 'PIN')
        self.pin()
        self.revisa('repetir PIN', 'Repita')
        self.pin()
        self.revisa('primer alumno', 'Primer alumno')
        pg.get_by_placeholder('Nombre').fill('Prueba')
        self.boton('Continuar')
        self.revisa('cómo se valida', 'valida')
        self.boton('Empezar')
        self.revisa('inicio del niño', 'Hola, Prueba')

        # Un ejercicio: nivel 0 (la «a»): se escucha y se elige la letra correcta.
        pg.locator('button[onclick^="level("]').first.click()
        self.revisa('nivel 0: presentación')
        self.boton('Empezar')
        self.revisa('ejercicio ¿qué letra suena?')
        self.boton('a')
        pg.wait_for_timeout(1000)
        er = pg.evaluate("()=>{const p=(JSON.parse(localStorage.getItem('ar2'))||{}).ps||[];return p[0]&&p[0].er&&p[0].er.a}")
        if not er or er.get('a') != 1 or er.get('e') != 0:
            self.falla(f'el acierto no se guardó en ar2 (er.a = {er})')
        self.revisa('tras acertar')

        # Otras pantallas del niño.
        for js, nombre in [('practice()', 'practicar'), ('album()', 'mi álbum'), ('map()', 'mapa de letras')]:
            self.ir(js, nombre)
        pg.evaluate('home()')
        self.revisa('inicio del niño (2)', 'Hola, Prueba')

        # Zona del tutor: PIN y pestañas.
        self.boton('Zona del tutor', exacto=False)
        self.revisa('PIN del tutor', 'PIN del tutor')
        self.pin()
        self.revisa('zona del tutor: Progreso', 'Prueba')
        for tab, i in [('Alumno', 1), ('Ajustes', 2), ('Progreso', 0)]:
            self.boton(tab)
            self.revisa(f'zona del tutor: {tab}')
        # Pantallas del tutor (se abren como sus botones).
        for js, nombre in [('aula()', 'vista de aula'), ('vel()', 'velocidad lectora'), ('evl()', 'evaluación de nivel'),
                           ('notas()', 'notas del tutor'), ('informe()', 'informe imprimible'), ('fichas()', 'fichas para imprimir')]:
            self.ir(js, nombre)
            pg.evaluate('panel(0)')
        # Fase 3 · «Lee y toca»: lectura «Sola» en Ajustes y sus pantallas.
        self.ir("panel(1);document.getElementById('rm').value='s';setRm()", 'ajustes: lectura Sola', 'Lee y toca')
        for js, nombre, texto in [("itemMatch('pato','🦆',()=>{},13)", 'Lee y toca: palabra → dibujos', 'Lee y toca su dibujo'),
                                  ("itemMatchW('pato','🦆',()=>{},13)", 'Lee y toca: dibujo → palabras', 'Toca la palabra del dibujo'),
                                  ("rdFree('pato',()=>{})", 'leer en voz alta sin puntuar', 'Siguiente'),
                                  ("practice()", 'practicar (modo Sola)', 'Lee y toca')]:
            self.ir(js, nombre, texto)
        pg.evaluate('panel(0)')
        # Fase 4 · la tableta en clase: Ajustes, y la rejilla con 25 alumnos (cabe sin desplazarse).
        self.ir("panel(1)", 'ajustes: tabletas en clase', 'Tabletas en clase')
        pg.evaluate("for(let i=0;i<24;i++)P.ps.push({id:nid(),n:'Alumno '+(i+2),lv:0,st:0,av:i%AVS.length});localStorage.setItem('lectori.tb','s');UNL=0;tbGo()")
        self.revisa('rejilla de 25 alumnos', 'Quién va a leer')
        info = pg.evaluate("()=>({n:document.querySelectorAll('.pt').length,alto:document.documentElement.scrollHeight,vp:window.innerHeight,"
                           "min:Math.min(...[...document.querySelectorAll('.pt')].map(b=>b.getBoundingClientRect().height)),crear:!!document.getElementById('nm')})")
        if info['n'] != 25:
            self.falla(f'rejilla: {info["n"]} botones en vez de 25')
        if info['alto'] > info['vp'] + 1 and self.etiqueta.startswith('390'):
            self.falla(f'rejilla de 25 alumnos: hay que desplazarse ({info["alto"]} px > {info["vp"]} px)')
        if info['min'] < 56:
            self.falla(f'rejilla: un botón mide {info["min"]} px (mínimo 56)')
        if info['crear']:
            self.falla('rejilla: el niño ve el formulario de crear perfiles')
        pg.evaluate("P.ps.length=1;localStorage.removeItem('lectori.tb');UNL=Date.now();panel(0)")
        # Modo oscuro/claro desde la propia app.
        pg.evaluate("setTheme(document.documentElement.dataset.theme=='dark'?'light':'dark')")
        self.revisa('cambio de tema')

    def cierra(self):
        self.ctx.close()


def main():
    rapido = '--rapido' in sys.argv
    vistas = [VISTAS[0]] if rapido else VISTAS
    temas = ['light'] if rapido else TEMAS
    puerto = puerto_libre()
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(puerto), '--bind', '127.0.0.1', '--directory', str(RAIZ)],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        url = f'http://127.0.0.1:{puerto}/index.html'
        for _ in range(50):
            try:
                socket.create_connection(('127.0.0.1', puerto), timeout=0.2).close()
                break
            except OSError:
                time.sleep(0.1)
        total_fallos = 0
        with sync_playwright() as p:
            browser = p.chromium.launch()
            for ancho, alto in vistas:
                for tema in temas:
                    c = Corrida(browser, url, ancho, alto, tema)
                    try:
                        c.recorre()
                    except Exception as e:  # un paso no pudo hacerse (botón que no está, tiempo agotado…)
                        c.falla(f'el recorrido se interrumpió: {str(e).splitlines()[0][:200]}')
                    c.cierra()
                    estado = 'OK' if not c.fallos else 'FALLA'
                    print(f'[{estado}] {c.etiqueta}: {c.pasos} pantallas revisadas · audios que faltan pedidos: {len(c.audio404)}')
                    for f in c.fallos:
                        print(f'    - {f}')
                    total_fallos += len(c.fallos)
            browser.close()
        print('Prueba de humo: ' + ('todo correcto' if total_fallos == 0 else f'{total_fallos} fallo(s)'))
        return 0 if total_fallos == 0 else 1
    finally:
        srv.terminate()


if __name__ == '__main__':
    sys.exit(main())
