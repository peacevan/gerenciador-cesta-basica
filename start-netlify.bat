@echo off
REM Start Netlify Dev for this project
SETLOCAL
cd /d "%~dp0"
echo Starting Netlify Dev (reads netlify.toml)...
where netlify >nul 2>&1
if %ERRORLEVEL%==0 (
  echo Found global Netlify CLI, running `netlify dev`...
  netlify dev
) else (
  echo Global Netlify CLI not found, running `npx netlify-cli dev`...
  npx netlify-cli dev
)
ENDLOCAL
