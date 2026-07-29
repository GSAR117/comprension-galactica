# Genera APK debug con los cambios actuales de la app web
$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Write-Step($msg) {
    Write-Host ""
    Write-Host ">> $msg" -ForegroundColor Cyan
}

function Test-Command($name) {
    $null -ne (Get-Command $name -ErrorAction SilentlyContinue)
}

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  Generador APK - Comprension Galactica" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

if (-not (Test-Command "node")) {
    Write-Host "ERROR: Node.js no esta instalado. Descargalo de https://nodejs.org" -ForegroundColor Red
    exit 1
}

$javaOk = $false
if (Test-Command "java") {
    $javaOk = $true
} elseif ($env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME "bin\java.exe"))) {
    $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
    $javaOk = $true
} else {
    $studioJbr = @(
        "${env:ProgramFiles}\Android\Android Studio\jbr\bin\java.exe",
        "${env:LOCALAPPDATA}\Programs\Android\Android Studio\jbr\bin\java.exe"
    )
    foreach ($j in $studioJbr) {
        if (Test-Path $j) {
            $env:JAVA_HOME = Split-Path (Split-Path $j)
            $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
            $javaOk = $true
            Write-Host "Usando Java de Android Studio: $env:JAVA_HOME" -ForegroundColor DarkGray
            break
        }
    }
}

if (-not $javaOk) {
    Write-Host "ERROR: Java (JDK) no encontrado." -ForegroundColor Red
    Write-Host "Instala Android Studio: https://developer.android.com/studio" -ForegroundColor Yellow
    Write-Host "Luego vuelve a ejecutar este script." -ForegroundColor Yellow
    exit 1
}

if (-not $env:ANDROID_HOME) {
    $sdkCandidates = @(
        "$env:LOCALAPPDATA\Android\Sdk",
        "$env:USERPROFILE\AppData\Local\Android\Sdk"
    )
    foreach ($sdk in $sdkCandidates) {
        if (Test-Path $sdk) {
            $env:ANDROID_HOME = $sdk
            $env:ANDROID_SDK_ROOT = $sdk
            $env:PATH = "$sdk\platform-tools;$sdk\cmdline-tools\latest\bin;$env:PATH"
            break
        }
    }
}

if (-not $env:ANDROID_HOME -or -not (Test-Path $env:ANDROID_HOME)) {
    Write-Host "ADVERTENCIA: ANDROID_HOME no configurado. Gradle puede fallar si no tienes el SDK." -ForegroundColor Yellow
}

Write-Step "Instalando dependencias (solo la primera vez tarda mas)..."
if (-not (Test-Path "node_modules")) {
    npm install
} else {
    npm install --prefer-offline 2>$null
    if ($LASTEXITCODE -ne 0) { npm install }
}

if (-not (Test-Path "android")) {
    Write-Step "Creando proyecto Android (solo una vez)..."
    npx cap add android
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR al crear android/. Revisa Android Studio y el SDK." -ForegroundColor Red
        exit 1
    }
}

Write-Step "Copiando archivos web actualizados..."
& "$PSScriptRoot\prepare-www.ps1"

Write-Step "Sincronizando con Capacitor..."
npx cap sync android
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Step "Compilando APK (debug)..."
Push-Location android
try {
    if ($IsWindows -or $env:OS -match "Windows") {
        .\gradlew.bat assembleDebug --no-daemon
    } else {
        ./gradlew assembleDebug --no-daemon
    }
    if ($LASTEXITCODE -ne 0) { exit 1 }
} finally {
    Pop-Location
}

$apkSource = Join-Path $root "android\app\build\outputs\apk\debug\app-debug.apk"
if (-not (Test-Path $apkSource)) {
    Write-Host "ERROR: No se encontro el APK generado." -ForegroundColor Red
    exit 1
}

$outDir = Join-Path $root "apk-salida"
New-Item -ItemType Directory -Path $outDir -Force | Out-Null
$stamp = Get-Date -Format "yyyy-MM-dd_HH-mm"
$apkDest = Join-Path $outDir "ComprensionGalactica_$stamp.apk"
Copy-Item -Path $apkSource -Destination $apkDest -Force

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  APK LISTO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Archivo: $apkDest" -ForegroundColor White
Write-Host ""
Write-Host "Copialo al celular e instalalo (permite origenes desconocidos si pregunta)." -ForegroundColor DarkGray

# Abrir carpeta de salida en el Explorador
Start-Process explorer.exe $outDir
