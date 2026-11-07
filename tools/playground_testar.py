# -*- coding: utf-8 -*-
"""Verifica o Playground com o g++ local:
 - cada solução 'certa' passa em TODOS os testes;
 - cada 'erro comum' falha exatamente no teste indicado em `pega` (ou estoura o tempo, ou passa se for NAO_PEGA);
 - cada esqueleto compila e é reprovado pelos testes (sem travar).
Uso: python tools/playground_testar.py
"""
import os
import shutil
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import playground_def as D  # noqa: E402

GPP = shutil.which('g++')
TMP = tempfile.mkdtemp(prefix='pg_')


def rodar(fonte, limite=5):
    """Compila e executa; devolve (estado, saida). estado: ok | compilacao | tempo."""
    src = os.path.join(TMP, 'prog.cpp')
    exe = os.path.join(TMP, 'prog.exe')
    with open(src, 'w', encoding='utf-8', newline='\n') as f:
        f.write(fonte)
    if os.path.exists(exe):
        os.remove(exe)
    c = subprocess.run([GPP, '-std=c++17', '-Wall', '-Wno-unused-function', '-o', exe, 'prog.cpp'], cwd=TMP,
                       capture_output=True, text=True, encoding='utf-8')
    if c.returncode != 0:
        return 'compilacao', c.stderr
    try:
        r = subprocess.run([exe], capture_output=True, text=True, encoding='utf-8', timeout=limite)
    except subprocess.TimeoutExpired:
        return 'tempo', ''
    return 'ok', r.stdout


def resumo(saida):
    falhas = [l.split('|')[1] for l in saida.splitlines() if l.startswith('FAIL|')]
    res = [l for l in saida.splitlines() if l.startswith('RESULT|')]
    return falhas, res


problemas = 0
for pid, p in D.PROBLEMAS.items():
    for e in D.ETAPAS:
        eid = e['id']
        c = p['etapas'][eid]
        rotulo = '%s/%s' % (pid, eid)

        # 1) esqueleto: compila e é reprovado
        est, saida = rodar(D.programa(pid, eid, c['esqueleto']))
        falhas, res = resumo(saida)
        if est != 'ok' or not falhas:
            if est == 'tempo':
                print('  esqueleto %s: estourou tempo (aceitável, mas confira)' % rotulo)
            else:
                print('ERRO esqueleto %s: estado=%s falhas=%d\n%s' % (rotulo, est, len(falhas), saida[:300]))
                problemas += 1

        # 2) certo: passa em tudo
        est, saida = rodar(D.programa(pid, eid, c['certo']))
        falhas, res = resumo(saida)
        ok = est == 'ok' and not falhas and res and res[0].split('|')[1] == res[0].split('|')[2]
        print('%-6s certo  : %s %s' % (rotulo, 'OK' if ok else 'PROBLEMA', res[0] if res else est))
        if not ok:
            problemas += 1
            print(saida[:600])

        # 3) erros comuns
        for er in c['erros']:
            est, saida = rodar(D.programa(pid, eid, er['codigo']))
            falhas, res = resumo(saida)
            pega = er['pega']
            if pega == 'TIMEOUT':
                bom = est == 'tempo'
            elif pega == 'NAO_PEGA':
                bom = est == 'ok' and not falhas
            else:
                bom = est == 'ok' and any(pega in f for f in falhas)
            print('%-6s erro   : %-45s %s  (%s)' % (rotulo, er['titulo'][:45], 'OK' if bom else 'PROBLEMA',
                                                     est if est != 'ok' else ', '.join(falhas) or 'passou tudo'))
            if not bom:
                problemas += 1
                if est == 'compilacao':
                    print(saida[:500])

shutil.rmtree(TMP, ignore_errors=True)
print('\nPROBLEMAS:', problemas)
sys.exit(1 if problemas else 0)
