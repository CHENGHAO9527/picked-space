@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 需要先安装 Node.js 24.5 或以上版本：https://nodejs.org/
  pause
  exit /b 1
)
echo 正在启动拾藏，请打开 http://127.0.0.1:4173
node --use-env-proxy server.mjs
pause
