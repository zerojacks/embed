# EmbedTool - WASM 数据处理工具

基于 React + TypeScript + Vite 7 + TailwindCSS 4.2 构建的现代化 Web 应用，使用 WebAssembly 进行高性能数据处理。

## 🚀 技术栈

- **前端框架**: React 19.2 + TypeScript 5.9
- **构建工具**: Vite 7.3
- **样式框架**: TailwindCSS 4.2 + DaisyUI 5.5
- **后端处理**: WebAssembly (Rust)
- **包管理器**: npm (统一使用)

## 📦 包管理器说明

**重要**: 本项目已统一使用 npm 作为包管理器，请勿混用其他包管理器。

### 验证包管理器状态
```bash
node package-manager-check.js
```

### 推荐命令
```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建项目
npm run build

# 代码检查
npm run lint

# 预览构建结果
npm run preview
```

## 🛠️ 开发环境设置

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd embedtool
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **构建 WASM 模块** (需要 Rust 和 wasm-pack)
   ```bash
   # Windows
   .\build.ps1
   
   # Linux/macOS
   ./build.sh
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

## 🏗️ 项目结构

```
embedtool/
├── crates/              # Rust WASM 源码
│   └── embed_core/      # 核心处理模块
├── pkg-web/             # 编译后的 WASM 包
├── src/                 # React 源码
│   ├── components/      # 组件
│   ├── hooks/          # 自定义 Hooks
│   ├── stores/         # 状态管理
│   ├── types/          # TypeScript 类型定义
│   └── utils/          # 工具函数
├── public/             # 静态资源
└── dist/               # 构建输出
```

## 🔧 构建说明

项目使用混合构建方式：
1. 首先使用 `wasm-pack` 构建 Rust 代码为 WebAssembly
2. 然后使用 Vite 构建前端 React 应用
3. 最终输出到 `dist/` 目录

## 📋 开发注意事项

- 确保只使用 npm 安装和管理依赖
- WASM 模块更新后需要重新构建
- 开发时建议使用 TypeScript 严格模式
- 遵循 ESLint 配置的代码规范

## ⚡ React Compiler

项目启用了 React Compiler 以提升性能。详细信息请参考 [React Compiler 文档](https://react.dev/learn/react-compiler)。

注意：这可能会影响 Vite 的开发和构建性能。
