# -*- coding: utf-8 -*-
"""Servidor local do site + executor de C++ para o Playground.

Uso (na raiz do repositório):   python tools/servidor_local.py
Depois abra:                    http://localhost:8765/pages/playground.html

O que faz:
 - serve os arquivos do site (HTML/CSS/JS);
 - recebe o código do Playground em POST /executar, compila com o SEU g++ e roda o programa de testes.
Tudo acontece na sua máquina: o código não vai para nenhum serviço externo.

Segurança: escuta só em 127.0.0.1 e recusa pedidos cujo Host ou Origin não sejam localhost:PORTA
(isso impede que outra página aberta no navegador mande código para este servidor executar).
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORTA = int(os.environ.get('PORTA', '8765'))
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GPP = shutil.which('g++')
LIMITE_COMPILAR = 20
LIMITE_EXECUTAR = 5
MAX_CODIGO = 60000
MAX_SAIDA = 20000
PERMITIDOS = {'localhost:%d' % PORTA, '127.0.0.1:%d' % PORTA}


def executar(codigo):
    if GPP is None:
        return {'estado': 'erro', 'mensagem': 'g++ não encontrado no PATH deste computador.'}
    pasta = tempfile.mkdtemp(prefix='pg_')
    try:
        with open(os.path.join(pasta, 'prog.cpp'), 'w', encoding='utf-8', newline='\n') as f:
            f.write(codigo)
        try:
            c = subprocess.run([GPP, '-std=c++17', '-Wall', '-Wno-unused-function', '-o', 'prog.exe', 'prog.cpp'], cwd=pasta,
                               capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=LIMITE_COMPILAR)
        except subprocess.TimeoutExpired:
            return {'estado': 'erro', 'mensagem': 'A compilação demorou demais.'}
        if c.returncode != 0:
            return {'estado': 'compilacao', 'compilacao': c.stderr[:MAX_SAIDA]}
        try:
            r = subprocess.run([os.path.join(pasta, 'prog.exe')], cwd=pasta, capture_output=True, text=True,
                               encoding='utf-8', errors='replace', timeout=LIMITE_EXECUTAR)
        except subprocess.TimeoutExpired:
            return {'estado': 'tempo', 'compilacao': c.stderr[:MAX_SAIDA]}
        return {'estado': 'ok', 'compilacao': c.stderr[:MAX_SAIDA], 'saida': r.stdout[:MAX_SAIDA], 'codigo_saida': r.returncode}
    finally:
        shutil.rmtree(pasta, ignore_errors=True)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=RAIZ, **k)

    def _host_ok(self):
        return self.headers.get('Host', '') in PERMITIDOS

    def _json(self, codigo, obj):
        corpo = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(codigo)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(corpo)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(corpo)

    def do_GET(self):
        if not self._host_ok():
            self.send_error(403)
            return
        if self.path == '/ping':
            self._json(200, {'ok': True, 'gpp': GPP is not None})
            return
        super().do_GET()

    def do_POST(self):
        if self.path != '/executar':
            self.send_error(404)
            return
        origem = self.headers.get('Origin')
        if not self._host_ok() or (origem is not None and origem.replace('http://', '') not in PERMITIDOS):
            self.send_error(403)
            return
        n = int(self.headers.get('Content-Length', '0'))
        if n <= 0 or n > MAX_CODIGO * 2:
            self._json(413, {'estado': 'erro', 'mensagem': 'Código grande demais.'})
            return
        try:
            codigo = json.loads(self.rfile.read(n).decode('utf-8'))['codigo']
        except Exception:
            self._json(400, {'estado': 'erro', 'mensagem': 'Pedido inválido.'})
            return
        if not isinstance(codigo, str) or len(codigo) > MAX_CODIGO:
            self._json(413, {'estado': 'erro', 'mensagem': 'Código grande demais.'})
            return
        self._json(200, executar(codigo))

    def log_message(self, fmt, *args):
        if '/executar' in (args[0] if args else ''):
            sys.stderr.write('[executar] %s\n' % args[0])


if __name__ == '__main__':
    print('g++:', GPP or 'NÃO ENCONTRADO (instale o MinGW/g++ e coloque no PATH)')
    print('Servidor em http://localhost:%d/pages/playground.html   (Ctrl+C para parar)' % PORTA)
    ThreadingHTTPServer(('127.0.0.1', PORTA), Handler).serve_forever()
