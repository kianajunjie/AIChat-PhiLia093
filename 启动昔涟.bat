@echo off
title Xilian
echo Starting XiLian...
cd /d "%~dp0"
start "xilian-server" cmd /c "cd /d %~dp0server && node index.js"
timeout /t 2 /nobreak >nul
start "xilian-client" cmd /c "cd /d %~dp0client && npx vite --open"
echo Backend  http://localhost:3001
echo Frontend http://localhost:5173
timeout /t 3 /nobreak >nul
