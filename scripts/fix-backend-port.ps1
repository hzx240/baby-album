# ========================================
# 宝贝成长相册 - 修复后端端口占用
# ========================================
# 此脚本需要以管理员权限运行
# 用于终止占用端口3001的进程并重启后端服务

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "修复后端服务端口 (3001)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查管理员权限
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[错误] 此脚本需要管理员权限运行" -ForegroundColor Red
    Write-Host "请右键点击 PowerShell，选择'以管理员身份运行'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "或使用以下命令：" -ForegroundColor Yellow
    Write-Host "  powershell -ExecutionPolicy Bypass -File fix-backend-port.ps1" -ForegroundColor Gray
    exit 1
}

# 查找占用端口3001的进程
Write-Host "[1/4] 检查端口 3001 占用情况..." -ForegroundColor Cyan
$port = 3001
$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
    Where-Object { $_.State -eq 'Listen' } |
    Select-Object -ExpandProperty OwningProcess |
    Get-Process -ErrorAction SilentlyContinue

if ($process) {
    Write-Host "发现占用端口的进程:" -ForegroundColor Yellow
    Write-Host "  进程名: $($process.ProcessName)" -ForegroundColor White
    Write-Host "  PID: $($process.Id)" -ForegroundColor White
    Write-Host "  路径: $($process.Path)" -ForegroundColor White
    Write-Host ""

    # 终止进程
    Write-Host "[2/4] 终止进程..." -ForegroundColor Cyan
    try {
        Stop-Process -Id $process.Id -Force
        Write-Host "进程已终止" -ForegroundColor Green
    }
    catch {
        Write-Host "[错误] 无法终止进程: $_" -ForegroundColor Red
        Write-Host "请手动终止 PID $($process.Id)" -ForegroundColor Yellow
        exit 1
    }
}
else {
    Write-Host "端口 $port 未被占用" -ForegroundColor Green
}

# 等待端口释放
Write-Host "[3/4] 等待端口释放..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

# 验证端口已释放
$portCheck = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
    Where-Object { $_.State -eq 'Listen' }

if ($portCheck) {
    Write-Host "[错误] 端口 $port 仍被占用" -ForegroundColor Red
    exit 1
}
Write-Host "端口 $port 已释放" -ForegroundColor Green

# 重启后端服务
Write-Host "[4/4] 重启后端服务..." -ForegroundColor Cyan
$backendDir = Join-Path $PSScriptRoot "..\backend"

if (Test-Path $backendDir) {
    Set-Location $backendDir
    Write-Host "启动后端服务..." -ForegroundColor Yellow
    Start-Process npm -ArgumentList "run", "start:dev" -NoNewWindow
    Write-Host "后端服务已启动" -ForegroundColor Green
}
else {
    Write-Host "[错误] 找不到后端目录: $backendDir" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "修复完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "后端服务地址: http://localhost:3001" -ForegroundColor White
Write-Host "健康检查: http://localhost:3001/api/health" -ForegroundColor White
Write-Host ""
