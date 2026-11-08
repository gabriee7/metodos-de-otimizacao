<#
.SYNOPSIS
  Ferramenta para configurar e ligar o executor local do Playground (servidor + g++ MinGW).

.DESCRIPTION
  Ações:
    diagnosticar  confere Git, Python, g++, porta e se o servidor responde (não altera nada)
    ligar         liga o servidor numa janela própria e abre o Playground no navegador
    parar         encerra o servidor do Playground (só o dele, nenhum outro programa)
    atualizar     baixa as novidades do projeto (git pull --ff-only)
    instalar      oferece instalar o que faltar (Python e g++) com o winget, perguntando antes

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File tools\playground.ps1 diagnosticar
  powershell -ExecutionPolicy Bypass -File tools\playground.ps1 ligar
#>
param(
    [Parameter(Position = 0)]
    [ValidateSet('ajuda', 'diagnosticar', 'ligar', 'parar', 'atualizar', 'instalar')]
    [string]$Acao = 'ajuda',
    [int]$Porta = 8765,
    [switch]$SemNavegador
)

$ErrorActionPreference = 'Stop'
$Raiz = Split-Path -Parent $PSScriptRoot
$UrlPages = 'https://gabriee7.github.io/metodos-de-otimizacao/pages/playground.html'
$UrlLocal = "http://localhost:$Porta/pages/playground.html"

function Ok($t)    { Write-Host "[ OK ] $t" -ForegroundColor Green }
function Aviso($t) { Write-Host "[ !! ] $t" -ForegroundColor Yellow }
function Erro($t)  { Write-Host "[ XX ] $t" -ForegroundColor Red }
function Info($t)  { Write-Host "       $t" -ForegroundColor Gray }

# Python de verdade (ignora o atalho da Microsoft Store, que só abre a loja)
function Obter-Python {
    foreach ($nome in @('python', 'py')) {
        $cmd = Get-Command $nome -ErrorAction SilentlyContinue
        if (-not $cmd) { continue }
        try {
            $saida = & $cmd.Source --version 2>&1 | Out-String
            if ($saida -match 'Python 3\.\d+') { return @{ Exe = $cmd.Source; Versao = $saida.Trim() } }
        } catch { }
    }
    return $null
}

function Obter-Gpp {
    $cmd = Get-Command g++ -ErrorAction SilentlyContinue
    if (-not $cmd) { return $null }
    try {
        $linha = (& $cmd.Source --version 2>&1 | Select-Object -First 1 | Out-String).Trim()
        return @{ Exe = $cmd.Source; Versao = $linha }
    } catch { return $null }
}

# Quem está escutando na porta (com a linha de comando de cada processo)
function Obter-Escutando {
    $lista = @()
    $conexoes = Get-NetTCPConnection -LocalPort $Porta -State Listen -ErrorAction SilentlyContinue
    foreach ($c in $conexoes) {
        $p = Get-CimInstance Win32_Process -Filter "ProcessId=$($c.OwningProcess)" -ErrorAction SilentlyContinue
        $cmdline = ''
        if ($p) { $cmdline = [string]$p.CommandLine }
        $lista += [pscustomobject]@{
            Pid      = $c.OwningProcess
            Comando  = $cmdline
            EhNosso  = ($cmdline -match 'servidor_local\.py')
        }
    }
    return $lista
}

function Testar-Ping {
    try {
        return Invoke-RestMethod -Uri "http://localhost:$Porta/ping" -TimeoutSec 3
    } catch { return $null }
}

function Mostrar-Ajuda {
    Write-Host ''
    Write-Host 'Playground: executor local' -ForegroundColor Cyan
    Write-Host '  Uso:  powershell -ExecutionPolicy Bypass -File tools\playground.ps1 <acao>'
    Write-Host ''
    Write-Host '  diagnosticar  confere Git, Python, g++, porta e servidor (não altera nada)'
    Write-Host '  ligar         liga o servidor e abre o Playground (use -SemNavegador para não abrir)'
    Write-Host '  parar         encerra o servidor do Playground'
    Write-Host '  atualizar     git pull --ff-only na pasta do projeto'
    Write-Host '  instalar      oferece instalar Python e g++ (winget), perguntando antes'
    Write-Host ''
    Write-Host '  Opção:  -Porta 8765   (o GitHub Pages só encontra o servidor na 8765)'
    Write-Host ''
}

function Acao-Diagnosticar {
    Write-Host "`nDiagnóstico do executor local (pasta: $Raiz)`n" -ForegroundColor Cyan
    $falhas = 0

    if (Test-Path (Join-Path $Raiz 'tools\servidor_local.py')) { Ok 'Projeto encontrado (tools\servidor_local.py).' }
    else { Erro 'Não achei tools\servidor_local.py. Rode o script de dentro da pasta do projeto.'; $falhas++ }

    if (Get-Command git -ErrorAction SilentlyContinue) { Ok ('Git: ' + ((git --version) -join ' ')) }
    else { Aviso 'Git não encontrado (só é necessário para "atualizar").' }

    $py = Obter-Python
    if ($py) { Ok "Python: $($py.Versao)" }
    else { Erro 'Python 3 não encontrado. Rode: tools\playground.ps1 instalar'; $falhas++ }

    $gpp = Obter-Gpp
    if ($gpp) {
        Ok "g++: $($gpp.Versao)"
        Info "caminho: $($gpp.Exe)"
        if ($gpp.Versao -notmatch 'MinGW|Rev|GCC|g\+\+') { Aviso 'Não parece ser o g++ do MinGW; confira o PATH.' }
    } else { Erro 'g++ não encontrado no PATH. Rode: tools\playground.ps1 instalar (ou adicione a pasta bin do MinGW ao PATH).'; $falhas++ }

    $esc = @(Obter-Escutando)
    if ($esc.Count -eq 0) {
        Info "Porta ${Porta}: livre (servidor desligado)."
    } else {
        foreach ($e in $esc) {
            if ($e.EhNosso) { Ok "Porta ${Porta}: servidor do Playground ligado (PID $($e.Pid))." }
            else { Erro "Porta ${Porta}: ocupada por outro programa (PID $($e.Pid)): $($e.Comando)"; $falhas++ }
        }
        if ($esc.Count -gt 1) { Aviso 'Há mais de um processo na porta. No Windows o mais antigo continua respondendo: rode "parar" e depois "ligar".' }
        $ping = Testar-Ping
        if ($ping -and $ping.ok) {
            Ok "Servidor responde em /ping (g++ visto pelo servidor: $($ping.gpp))."
            if (-not $ping.gpp) { Erro 'O servidor não achou o g++. Reabra o terminal depois de ajustar o PATH.'; $falhas++ }
        } else { Erro 'Algo escuta na porta, mas não responde em /ping.'; $falhas++ }
    }

    if ($Porta -ne 8765) { Aviso 'Porta diferente de 8765: o site no GitHub Pages só procura o servidor na 8765.' }

    Write-Host ''
    if ($falhas -eq 0) {
        Ok 'Tudo certo. Próximo passo: tools\playground.ps1 ligar'
    } else {
        Erro "$falhas problema(s) acima. Corrija e rode o diagnóstico de novo."
    }
    Write-Host ''
}

function Acao-Ligar {
    $py = Obter-Python
    if (-not $py) { Erro 'Python 3 não encontrado. Rode: tools\playground.ps1 instalar'; return }
    $gpp = Obter-Gpp
    if (-not $gpp) { Erro 'g++ não encontrado no PATH. Rode: tools\playground.ps1 instalar'; return }

    $esc = @(Obter-Escutando)
    if ($esc.Count -gt 0) {
        $outros = @($esc | Where-Object { -not $_.EhNosso })
        if ($outros.Count -gt 0) { Erro "A porta $Porta está ocupada por outro programa (PID $($outros[0].Pid)). Nada foi alterado."; return }
        Ok "O servidor do Playground já está ligado (PID $($esc[0].Pid))."
        Info 'Se você atualizou o projeto, rode "parar" e depois "ligar" para carregar o código novo.'
    } else {
        $env:PORTA = "$Porta"
        $argumentos = 'tools\servidor_local.py'
        if ($py.Exe -match '(^|\\)py(\.exe)?$') { $argumentos = '-3 tools\servidor_local.py' }
        Start-Process -FilePath $py.Exe -ArgumentList $argumentos -WorkingDirectory $Raiz | Out-Null
        $pronto = $false
        for ($i = 0; $i -lt 20; $i++) {
            Start-Sleep -Milliseconds 400
            $r = Testar-Ping
            if ($r -and $r.ok) { $pronto = $true; break }
        }
        if (-not $pronto) { Erro 'O servidor não respondeu a tempo. Veja a janela que abriu (mensagem de erro) ou rode "diagnosticar".'; return }
        Ok "Servidor ligado em http://localhost:$Porta (janela própria: deixe aberta enquanto estuda)."
    }

    if (-not $SemNavegador) {
        if ($Porta -eq 8765) { $url = $UrlPages } else { $url = $UrlLocal; Aviso 'Porta diferente de 8765: abrindo a página servida pelo próprio servidor local.' }
        Start-Process $url
        Ok "Abrindo: $url"
        Info 'Na página deve aparecer a faixa verde "Executor local conectado". Se o navegador perguntar sobre rede local, clique em Permitir.'
    }
}

function Acao-Parar {
    $esc = @(Obter-Escutando)
    if ($esc.Count -eq 0) { Info "Nada escutando na porta $Porta."; return }
    foreach ($e in $esc) {
        if ($e.EhNosso) {
            Stop-Process -Id $e.Pid -Force -ErrorAction SilentlyContinue
            Ok "Servidor do Playground encerrado (PID $($e.Pid))."
        } else {
            Aviso "PID $($e.Pid) usa a porta $Porta mas NÃO é o servidor do Playground; não mexi: $($e.Comando)"
        }
    }
    Start-Sleep -Milliseconds 500
    if (@(Obter-Escutando | Where-Object { $_.EhNosso }).Count -gt 0) {
        Aviso 'Ainda há servidor na porta; rode "parar" mais uma vez.'
    }
}

function Acao-Atualizar {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Erro 'Git não encontrado.'; return }
    Info "git pull --ff-only em $Raiz"
    & git -C $Raiz pull --ff-only
    if ($LASTEXITCODE -eq 0) {
        Ok 'Projeto atualizado.'
        if (@(Obter-Escutando | Where-Object { $_.EhNosso }).Count -gt 0) {
            Aviso 'O servidor está ligado com o código antigo: rode "parar" e depois "ligar".'
        }
    } else {
        Erro 'O git pull não concluiu (você tem alterações locais ou conflito). Resolva com o git antes de continuar.'
    }
}

function Perguntar-Instalar($descricao, $id) {
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        Aviso "winget não disponível. Instale $descricao manualmente."
        return
    }
    Write-Host ''
    Write-Host "Instalar $descricao com: winget install -e --id $id" -ForegroundColor Cyan
    $r = Read-Host 'Executar agora? (s/N)'
    if ($r -match '^[sSyY]') {
        & winget install -e --id $id --accept-package-agreements --accept-source-agreements
        Aviso 'Feche e reabra o terminal para o PATH atualizar e rode "diagnosticar".'
    } else { Info 'Pulado.' }
}

function Acao-Instalar {
    $faltou = $false
    if (-not (Obter-Python)) { $faltou = $true; Perguntar-Instalar 'o Python 3.12' 'Python.Python.3.12' }
    if (-not (Obter-Gpp))    { $faltou = $true; Perguntar-Instalar 'o g++ (MinGW-w64 / WinLibs, UCRT)' 'BrechtSanders.WinLibs.POSIX.UCRT' }
    if (-not $faltou) { Ok 'Python e g++ já estão instalados. Nada a fazer.' }
}

switch ($Acao) {
    'diagnosticar' { Acao-Diagnosticar }
    'ligar'        { Acao-Ligar }
    'parar'        { Acao-Parar }
    'atualizar'    { Acao-Atualizar }
    'instalar'     { Acao-Instalar }
    default        { Mostrar-Ajuda }
}
