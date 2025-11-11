@echo off
REM Production Deployment Script for Leave Approval System
REM Usage: deploy.bat

echo 🚀 Starting production deployment...

REM Check if .env.prod exists
if not exist ".env.prod" (
    echo ❌ Error: .env.prod file not found!
    echo Please copy env.prod.template to .env.prod and fill in the values.
    pause
    exit /b 1
)

echo ✅ Environment file found

REM Build and deploy with Docker Compose
echo 🐳 Building and deploying with Docker Compose...

REM Stop existing containers
docker-compose -f docker-compose.prod.yml down

REM Build and start services
docker-compose -f docker-compose.prod.yml up --build -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak > nul

REM Check health
echo 🔍 Checking service health...
curl -f http://localhost:8080/api/health > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is healthy
) else (
    echo ❌ Backend health check failed
    pause
    exit /b 1
)

curl -f http://localhost/health > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is healthy
) else (
    echo ❌ Frontend health check failed
    pause
    exit /b 1
)

echo 🎉 Deployment completed successfully!
echo 📊 Services:
echo   - Frontend: http://localhost
echo   - Backend API: http://localhost:8080/api
echo   - MinIO Console: http://localhost:9001
echo   - Health Check: http://localhost:8080/api/health
pause






