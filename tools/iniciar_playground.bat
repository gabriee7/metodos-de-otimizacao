@echo off
rem Liga o servidor local do Playground (compila com o g++ MinGW do seu PATH) e abre a pagina no navegador.
rem Deixe esta janela aberta enquanto estuda; feche-a (ou Ctrl+C) para parar.
cd /d "%~dp0.."
where g++ >nul 2>nul || echo AVISO: g++ nao encontrado no PATH. Instale/adicione o MinGW ao PATH.
start "" "http://localhost:8765/pages/playground.html"
python tools\servidor_local.py
pause
