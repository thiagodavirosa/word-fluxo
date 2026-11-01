# Instala o suplemento Fluxos no Word para Windows (catálogo de pasta compartilhada).
# Execute em um PowerShell COMO ADMINISTRADOR (só o compartilhamento da pasta precisa disso).
#   powershell -ExecutionPolicy Bypass -File tools\instalar_no_word.ps1
$ErrorActionPreference = "Stop"

$manifesto = "https://thiagodavirosa.github.io/word-fluxo/manifest.xml"
$nome      = "FluxosSuplemento"
$pasta     = Join-Path $env:USERPROFILE $nome
$unc       = "\\$env:COMPUTERNAME\$nome"
$catalogo  = "{6d7a1f0e-3c52-4b8e-9a41-5f0c2e7b9d11}"

New-Item -ItemType Directory -Force $pasta | Out-Null
Invoke-WebRequest $manifesto -OutFile (Join-Path $pasta "manifest.xml")
Write-Host "Manifesto baixado em $pasta"

if (-not (Get-SmbShare -Name $nome -ErrorAction SilentlyContinue)) {
    New-SmbShare -Name $nome -Path $pasta -ReadAccess $env:USERNAME | Out-Null
}
Write-Host "Pasta compartilhada em $unc"

$chave = "HKCU:\Software\Microsoft\Office\16.0\WEF\TrustedCatalogs\$catalogo"
New-Item -Path $chave -Force | Out-Null
New-ItemProperty -Path $chave -Name "Id"    -Value $catalogo -PropertyType String -Force | Out-Null
New-ItemProperty -Path $chave -Name "Url"   -Value $unc      -PropertyType String -Force | Out-Null
New-ItemProperty -Path $chave -Name "Flags" -Value 1         -PropertyType DWord  -Force | Out-Null
Write-Host "Catálogo confiável registrado."

Write-Host ""
Write-Host "Pronto. Feche TODAS as janelas do Word e abra de novo."
Write-Host "Depois: Inserir > Suplementos > Meus Suplementos > aba PASTA COMPARTILHADA > Fluxos > Adicionar."
