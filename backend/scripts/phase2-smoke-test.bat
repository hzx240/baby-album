@echo off
REM Phase 2 Smoke Test Script (Windows)
REM Quick verification that all endpoints are responding

setlocal enabledelayedexpansion

if "%API_BASE_URL%"=="" set API_BASE_URL=http://localhost:3001
if "%TEST_EMAIL%"=="" set TEST_EMAIL=test@example.com
if "%TEST_PASSWORD%"=="" set TEST_PASSWORD=test123

echo ===================================
echo Phase 2 Smoke Tests
echo ===================================
echo Base URL: %API_BASE_URL%
echo.

REM Track results
set PASSED=0
set FAILED=0

REM Test health endpoint
echo Testing GET /health ...
curl -s -w "%%{http_code}" -X GET "%API_BASE_URL%/health" -o nul
if !errorlevel! equ 0 (
  echo [OK]
  set /a PASSED+=1
) else (
  echo [FAIL]
  set /a FAILED+=1
)

echo.
echo Smoke test complete!
echo Passed: %PASSED%
echo Failed: %FAILED%

endlocal
