# PowerShell WASM 构建脚本

Write-Host "Building WASM module..." -ForegroundColor Green
Set-Location crates/embed_core
wasm-pack build --target web --out-dir ../../pkg-web --features wasm
Set-Location ../..

Write-Host "Removing pkg-web/.gitignore..." -ForegroundColor Green
Remove-Item "pkg-web/.gitignore" -Force -ErrorAction SilentlyContinue

Write-Host "WASM build completed!" -ForegroundColor Green