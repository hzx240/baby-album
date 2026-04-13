@echo off
REM 宝贝成长相册 - Docker 部署脚本 (Windows)
REM 使用方法：
REM   scripts\docker-deploy.bat dev     # 开发环境
REM   scripts\docker-deploy.bat prod    # 生产环境
REM   scripts\docker-deploy.bat stop    # 停止服务

setlocal enabledelayedexpansion

if "%1"=="" goto usage
if "%1"=="dev" goto dev
if "%1"=="prod" goto prod
if "%1"=="stop" goto stop
if "%1"=="logs" goto logs
if "%1"=="restart" goto restart
goto usage

:dev
echo [INFO] 启动开发环境...
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
echo.
echo ========================================
echo 开发环境启动成功！
echo 前端地址: http://localhost:5173
echo 后端地址: http://localhost:3010
echo MinIO 控制台: http://localhost:9001
echo ========================================
goto end

:prod
echo [INFO] 启动生产环境...

if not exist .env (
    echo [ERROR] 生产环境需要 .env 文件！
    echo 请创建 .env 文件并设置以下环境变量：
    echo   - POSTGRES_USER
    echo   - POSTGRES_PASSWORD
    echo   - POSTGRES_DB
    echo   - JWT_SECRET
    echo   - MINIO_ROOT_USER
    echo   - MINIO_ROOT_PASSWORD
    exit /b 1
)

docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
echo.
echo ========================================
echo 生产环境启动成功！
echo 前端地址: http://localhost
echo 后端地址: http://localhost:3010
echo MinIO 控制台: http://localhost:9001
echo ========================================
goto end

:stop
echo [INFO] 停止所有服务...
docker-compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.prod.yml down
echo [INFO] 服务已停止
goto end

:logs
docker-compose -f docker-compose.yml logs -f
goto end

:restart
echo [INFO] 重启服务...
docker-compose -f docker-compose.yml restart
echo [INFO] 服务已重启
goto end

:usage
echo 宝贝成长相册 - Docker 部署脚本 (Windows)
echo.
echo 使用方法：
echo   %0 dev     启动开发环境
echo   %0 prod    启动生产环境
echo   %0 stop    停止服务
echo   %0 logs    查看日志
echo   %0 restart 重启服务
exit /b 1

:end
