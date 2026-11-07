# -*- coding: utf-8 -*-
"""Gera assets/js/playground-data.js a partir de playground_def.py.
Uso: python tools/playground_build.py   (rode playground_testar.py antes para validar certos e errados)
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import playground_def as D  # noqa: E402

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

dados = {'etapas': [{'id': e['id'], 'titulo': e['titulo'], 'assinatura': e['assinatura']} for e in D.ETAPAS], 'problemas': []}
for pid, p in D.PROBLEMAS.items():
    prob = {'id': pid, 'nome': p['nome'], 'sinal': p['sinal'], 'resumo': p['resumo'], 'etapas': {}}
    for e in D.ETAPAS:
        c = p['etapas'][e['id']]
        prob['etapas'][e['id']] = {
            'enunciado': c['enunciado'],
            'pistas': c['pistas'],
            'esqueleto': c['esqueleto'],
            'visivel': D.visivel(pid, e['id']),
            'prefixo': D.prefixo(pid, e['id']),
            'sufixo': D.sufixo(pid, e['id']),
            'certo': c['certo'],
            'erros': [{'titulo': x['titulo'], 'codigo': x['codigo'], 'explica': x['explica'], 'pega': x['pega']} for x in c['erros']],
        }
    dados['problemas'].append(prob)

saida = os.path.join(RAIZ, 'assets', 'js', 'playground-data.js')
with open(saida, 'w', encoding='utf-8', newline='\n') as f:
    f.write('// GERADO por tools/playground_build.py a partir de tools/playground_def.py. Não edite à mão.\n')
    f.write('window.PLAYGROUND = ')
    json.dump(dados, f, ensure_ascii=False, indent=1)
    f.write(';\n')
print('gerado', saida, os.path.getsize(saida), 'bytes')
