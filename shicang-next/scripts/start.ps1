$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$url='http://127.0.0.1:4180/'
try {$r=Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 2} catch {$r=$null}
if($r -and $r.StatusCode -eq 200 -and $r.Content -match '拾藏'){Start-Process $url;exit 0}
$node=(Get-Command node -ErrorAction Stop).Source
if([version](& $node -p 'process.versions.node') -lt [version]'24.5.0'){throw '需要Node.js 24.5以上版本。'}
Set-Location -LiteralPath $projectRoot
if(!(Test-Path -LiteralPath 'node_modules/next/package.json')){throw '请先在仓库根目录运行 npm ci --prefix shicang-next，或在shicang-next目录运行npm ci。'}
if(!(Test-Path -LiteralPath '.next/BUILD_ID')){& npm.cmd run build;if($LASTEXITCODE -ne 0){throw '构建失败。'}}
New-Item -ItemType Directory -Force -Path '.local' | Out-Null
$nextBin=Join-Path $projectRoot 'node_modules\next\dist\bin\next'
Start-Process $node -ArgumentList '--use-env-proxy',('"'+$nextBin+'"'),'start','--hostname','127.0.0.1','--port','4180' -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $projectRoot '.local\server.log') -RedirectStandardError (Join-Path $projectRoot '.local\server-error.log')
for($i=0;$i -lt 30;$i++){try{$r=Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 2;if($r.StatusCode -eq 200){Start-Process $url;exit 0}}catch{};Start-Sleep -Milliseconds 300}
throw '未能启动，请检查.local/server-error.log。'
