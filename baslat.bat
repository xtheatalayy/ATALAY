@echo off
setlocal
set NODE_DIR=C:\Users\datal\dev\node-v22.23.5-win-x64
set PG_DIR=C:\Users\datal\dev\pgsql\bin
set PG_DATA=C:\Users\datal\dev\pgdata
set PATH=%NODE_DIR%;%PG_DIR%;%PATH%

cd /d "%~dp0"

"%PG_DIR%\pg_ctl.exe" -D "%PG_DATA%" status >nul 2>&1
if errorlevel 1 (
  echo PostgreSQL baslatiliyor...
  "%PG_DIR%\pg_ctl.exe" -D "%PG_DATA%" -l "C:\Users\datal\dev\pg.log" -o "-p 5432" start
)

if not exist node_modules (
  echo Bagimliliklar kuruluyor...
  call yarn install
)

set PORT=80
start "" http://plannedlife.localhost
call yarn dev
