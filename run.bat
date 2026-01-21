@echo off
REM Annuity Loan Calculator - Run Script for Windows
REM Simple script to start a local server and open the calculator

setlocal

set PORT=8000
set URL=http://localhost:%PORT%

echo 🚀 Starting Annuity Loan Calculator...
echo.

REM Try Python 3
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Using Python (with no-cache headers)
    echo 📡 Server running at %URL%
    echo Press Ctrl+C to stop
    echo.
    start "" "%URL%"
    python server.py
    goto :end
)

REM Try PHP
where php >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Using PHP
    echo 📡 Server running at %URL%
    echo Press Ctrl+C to stop
    echo.
    start "" "%URL%"
    php -S localhost:%PORT%
    goto :end
)

REM Try Node.js
where npx >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Using Node.js
    echo 📡 Server running at %URL%
    echo Press Ctrl+C to stop
    echo.
    start "" "%URL%"
    npx http-server -p %PORT%
    goto :end
)

REM No server found
echo ❌ Error: No suitable server found!
echo.
echo Please install one of the following:
echo   - Python 3: https://www.python.org/downloads/
echo   - Node.js: https://nodejs.org/
echo   - PHP: https://www.php.net/
echo.
echo Or manually open index.html with a local server.
pause
exit /b 1

:end
endlocal
