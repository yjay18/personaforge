$ErrorActionPreference = "Stop"

Write-Host "Setting up Python env"
if (-not (Test-Path ".venv")) {
  python -m venv .venv
}
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
pip install pyinstaller

Write-Host "Building backend executable"
pyinstaller build\pyinstaller\personaforge_backend.spec --distpath dist\backend --workpath build\pyinstaller\build --clean -y

Write-Host "Installing Node dependencies"
npm install
npm --prefix frontend install

Write-Host "Building frontend"
npm --prefix frontend run build

Write-Host "Packaging Electron app"
npm run dist

Write-Host "Build complete. Check dist/ for the installer."
