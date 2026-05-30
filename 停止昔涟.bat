@echo off
chcp 65001 >nul
title 停止昔涟

echo 正在送昔涟去休息...

:: 杀死后端 (端口3001的node进程)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001.*LISTENING') do (
    taskkill /f /pid %%a 2>nul
)

:: 杀死前端 (端口5173的node进程)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173.*LISTENING') do (
    taskkill /f /pid %%a 2>nul
)

echo 昔涟已入睡，晚安♪
timeout /t 2 /nobreak >nul
