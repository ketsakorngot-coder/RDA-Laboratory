@echo off
cd /d "%~dp0"
echo Starting RDA local server...
where py >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:8765/index.html
  py -m http.server 8765
  exit /b
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:8765/index.html
  python -m http.server 8765
  exit /b
)
echo Python was not found. Opening index.html directly.
echo NOTE: For reliable mission progress sharing, run the folder through a local/web server.
start "" "%~dp0index.html"
