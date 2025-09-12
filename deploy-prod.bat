@echo off
setlocal
echo Building and starting full stack with Docker Compose...
docker info >nul 2>&1
if errorlevel 1 (
  echo Docker Desktop is not running. Please start Docker Desktop and rerun this script.
  exit /b 1
)
docker compose up -d --build
if errorlevel 1 (
  echo Deployment failed.
  exit /b 1
)
echo Deployed. Open http://localhost:3000

