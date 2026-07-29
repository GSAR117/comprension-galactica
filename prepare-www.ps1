# Copia solo los archivos de la app web a www/ (lo que va dentro del APK)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$www = Join-Path $root "www"

if (Test-Path $www) {
    Remove-Item -Recurse -Force $www
}
New-Item -ItemType Directory -Path $www | Out-Null

$items = @(
    "index.html",
    "manifest.json",
    "sw.js",
    "badwords.json",
    "css",
    "js",
    "assets"
)

foreach ($item in $items) {
    $src = Join-Path $root $item
    if (-not (Test-Path $src)) { continue }
    $dest = Join-Path $www $item
    if ((Get-Item $src).PSIsContainer) {
        Copy-Item -Path $src -Destination $dest -Recurse -Force
    } else {
        Copy-Item -Path $src -Destination $dest -Force
    }
}

# Copia de archivos .mp3 que se encuentren en la raíz (ej: grillito.mp3, letras.mp3, raton.mp3)
Get-ChildItem -Path $root -Filter "*.mp3" -ErrorAction SilentlyContinue | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination (Join-Path $www $_.Name) -Force
}

# Video de 5° (opcional): raíz o assets/quinto/
$videoNames = @("5to año.mp4", "5to ano.mp4")
foreach ($name in $videoNames) {
    $src = Join-Path $root $name
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination (Join-Path $www $name) -Force
        break
    }
}
$quintoDir = Join-Path $root "assets\quinto"
if (Test-Path $quintoDir) {
    $destQuinto = Join-Path $www "assets\quinto"
    New-Item -ItemType Directory -Path (Split-Path $destQuinto) -Force | Out-Null
    Copy-Item -Path $quintoDir -Destination $destQuinto -Recurse -Force
}

Write-Host "OK: www/ actualizado desde los archivos de la app." -ForegroundColor Green
