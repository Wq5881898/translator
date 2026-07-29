param(
    [string]$ExtensionId = "djbkcmlpogpnafgifiocehmkkghnhjjb"
)

$ErrorActionPreference = "Stop"
$bridgeDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$hostPath = [IO.Path]::GetFullPath(
    (Join-Path $bridgeDirectory "..\bridge-host\Translator.BridgeHost.exe"))
if (-not (Test-Path -LiteralPath $hostPath)) {
    throw "Bridge Host was not found at: $hostPath"
}
if ($ExtensionId -notmatch '^[a-p]{32}$') {
    throw "The Chrome extension ID is invalid: $ExtensionId"
}

$manifestPath = Join-Path $bridgeDirectory "com.wq5881898.translator.stage2.json"
$manifest = [ordered]@{
    name = "com.wq5881898.translator.stage2"
    description = "Translator Stage 2 browser bridge"
    path = $hostPath
    type = "stdio"
    allowed_origins = @("chrome-extension://$ExtensionId/")
}
$manifestJson = $manifest | ConvertTo-Json -Depth 4
[IO.File]::WriteAllText(
    $manifestPath,
    $manifestJson,
    (New-Object Text.UTF8Encoding($false)))

$registryPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.wq5881898.translator.stage2"
New-Item -Path $registryPath -Force | Out-Null
Set-Item -Path $registryPath -Value $manifestPath

$registeredManifest = (Get-Item -LiteralPath $registryPath).GetValue("")
if ($registeredManifest -ne $manifestPath) {
    throw "Chrome Native Messaging registration verification failed."
}

Write-Host "Translator bridge installed for extension $ExtensionId."
Write-Host "Verified Chrome manifest: $registeredManifest"
Write-Host "Restart Chrome before testing."
