@echo off
setlocal
echo === Shashlyk Mashlyk: Start Dev ===

REM Ensure env exists
if not exist backend\.env (
  echo Creating backend\.env from example...
  copy /Y backend\.env.example backend\.env >nul
)

REM Ensure Docker DB is running
docker info >nul 2>&1
if errorlevel 1 (
  echo Docker Desktop is not running. Please start Docker Desktop and rerun this script.
  exit /b 1
)
echo Starting database...
docker compose up -d db
if errorlevel 1 (
  echo Failed to start database container.
  exit /b 1
)

echo Applying Prisma schema and seeding data...
pushd backend
call npx prisma db push
call npx prisma db seed
popd

echo Launching backend and frontend in separate terminals...
start cmd /k "cd /d %CD%\backend && npm run dev"
start cmd /k "cd /d %CD%\web-app && npm run dev"

echo Dev environment started. Frontend: http://localhost:5173  Backend: http://localhost:8080

