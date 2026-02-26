# PowerShell WASM 构建脚本

# 设置严格模式：任何错误都会导致脚本停止
$ErrorActionPreference = "Stop"

try {
    Write-Host "Building WASM module..." -ForegroundColor Green
    Set-Location crates/embed_core

    # 设置详细日志输出
    $env:RUST_LOG = "info"
    
    Write-Host "Running wasm-pack build..." -ForegroundColor Yellow
    wasm-pack build --target web --out-dir ../../pkg-web --features wasm
    
    # 检查上一个命令的退出码
    if ($LASTEXITCODE -ne 0) {
        throw "WASM build failed with exit code $LASTEXITCODE"
    }

    Set-Location ../..

    Write-Host "Removing pkg-web/.gitignore..." -ForegroundColor Green
    Remove-Item "pkg-web/.gitignore" -Force -ErrorAction SilentlyContinue

    Write-Host "WASM build completed successfully!" -ForegroundColor Green
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "WASM build failed!" -ForegroundColor Red
    exit 1
}