@echo off
REM MathBlitz Setup Script for Windows
REM This script automates the entire setup process

echo 🚀 Setting up MathBlitz...

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js v18+ from https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js found: %NODE_VERSION%

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm (comes with Node.js)
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo ✅ npm found: %NPM_VERSION%

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed

REM Set up database
echo 🗄️  Setting up database...
call npx prisma migrate dev --name init
if %errorlevel% neq 0 (
    echo ❌ Failed to set up database
    pause
    exit /b 1
)
echo ✅ Database set up

REM Generate Prisma client
echo ⚙️  Generating Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ Failed to generate Prisma client
    pause
    exit /b 1
)
echo ✅ Prisma client generated

echo.
echo 🎉 Setup complete!
echo.
echo To start the app, run:
echo   npm run dev
echo.
echo Then open http://localhost:3000 in your browser
pause
