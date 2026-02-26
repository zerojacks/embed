#!/bin/bash

# 构建 WASM 模块
echo "Building WASM module..."
cd crates/embed_core
wasm-pack build --target web --out-dir ../../pkg-web --features wasm
cd ../..

# 删除 wasm-pack 生成的 .gitignore 文件，确保构建产物可以被提交
echo "Removing pkg-web/.gitignore..."
rm -f pkg-web/.gitignore

echo "WASM build completed!"