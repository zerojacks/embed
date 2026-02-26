#!/bin/bash

# 设置严格模式：任何命令失败都会导致脚本退出
set -e

# 设置管道失败检测
set -o pipefail

# 构建 WASM 模块
echo "Building WASM module..."
cd crates/embed_core

# 设置详细日志输出
export RUST_LOG=info

# 构建 WASM，如果失败会自动退出
echo "Running wasm-pack build..."
wasm-pack build --target web --out-dir ../../pkg-web --features wasm

# 检查构建是否成功
if [ $? -ne 0 ]; then
    echo "Error: WASM build failed!"
    exit 1
fi

cd ../..

# 删除 wasm-pack 生成的 .gitignore 文件，确保构建产物可以被提交
echo "Removing pkg-web/.gitignore..."
rm -rf pkg-web/.gitignore

echo "WASM build completed successfully!"