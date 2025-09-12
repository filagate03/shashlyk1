@echo off
setlocal
echo Checking Docker...
docker info >nul 2>&1
if errorlevel 1 (
  echo Docker Desktop is not running. Please start Docker Desktop and rerun this script.
  exit /b 1
)
echo Starting Postgres container via Docker Compose...
docker compose up -d db
if errorlevel 1 (
  echo Failed to start database container.
  exit /b 1
)
echo Database is starting. You can run start-dev.bat next.

