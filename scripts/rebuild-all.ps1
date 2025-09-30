param(
    [switch]$NoCache
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $root "..")

Write-Host "Stopping existing containers..." -ForegroundColor Cyan
docker compose down

$buildArgs = @('compose', 'build')
if ($NoCache.IsPresent) {
    $buildArgs += '--no-cache'
}

Write-Host "Rebuilding images..." -ForegroundColor Cyan
& docker @buildArgs

Write-Host "Starting stack..." -ForegroundColor Cyan
docker compose up -d

Write-Host "All services are up to date." -ForegroundColor Green
