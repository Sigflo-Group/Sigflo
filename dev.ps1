# Sigflo Windows dev helper — adds Node/Git to PATH when missing, then runs npm scripts.
# Usage:
#   .\dev.ps1              # frontend (Vite :5173)
#   .\dev.ps1 backend      # API (:8787)
#   .\dev.ps1 all          # frontend + backend (two windows)
#   .\dev.ps1 test
#   .\dev.ps1 build

param(
    [Parameter(Position = 0)]
    [ValidateSet('dev', 'backend', 'all', 'test', 'build')]
    [string]$Command = 'dev'
)

$ErrorActionPreference = 'Stop'
$RepoRoot = $PSScriptRoot

function Ensure-ToolPath {
    $paths = @(
        'C:\Program Files\nodejs',
        'C:\Program Files\Git\bin'
    )
    foreach ($p in $paths) {
        if ((Test-Path $p) -and ($env:Path -split ';' -notcontains $p)) {
            $env:Path = "$p;$env:Path"
        }
    }
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Error "Node.js not found. Install from https://nodejs.org or add it to PATH."
    }
}

function Invoke-Npm {
    param([string[]]$NpmArgs)
    Push-Location $RepoRoot
    try {
        & npm @NpmArgs
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    } finally {
        Pop-Location
    }
}

Ensure-ToolPath

switch ($Command) {
    'dev' { Invoke-Npm @('run', 'dev') }
    'backend' {
        Write-Host "Tip: restart backend after editing backend/.env (tsx does not reload env files)."
        Invoke-Npm @('run', 'dev:backend')
    }
    'test' { Invoke-Npm @('test') }
    'build' { Invoke-Npm @('run', 'build') }
    'all' {
        Start-Process powershell -ArgumentList @(
            '-NoExit',
            '-ExecutionPolicy', 'Bypass',
            '-File', (Join-Path $RepoRoot 'dev.ps1'),
            'backend'
        ) | Out-Null
        Write-Host "Started backend in a new window. Starting frontend here..."
        Invoke-Npm @('run', 'dev')
    }
}
