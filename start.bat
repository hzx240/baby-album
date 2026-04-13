@echo off
title 宝宝相册 - 启动中...
echo.
echo ========================================
echo   宝宝相册项目启动脚本
echo ========================================
echo.

echo [1/2] 启动后端 (端口 3003)...
start "后端 NestJS :3003" cmd /k "cd /d d:\BILIN\aa\backend && npm run start:dev"

echo 等待后端初始化 (3秒)...
timeout /t 3 /nobreak >nul

echo [2/2] 启动前端 (Vite)...
start "前端 Vite :5175" cmd /k "cd /d d:\BILIN\aa\frontend && npm run dev"

echo.
echo ✅ 两个窗口已打开！
echo.
echo 后端: http://localhost:3003
echo 前端: 看 Vite 窗口里的 Local 地址 (通常是 http://localhost:5175)
echo.
pause
