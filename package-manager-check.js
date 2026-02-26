#!/usr/bin/env node

import fs from 'fs';

console.log('🔍 检查包管理器状态...\n');

// 检查锁文件
const lockFiles = [
    { name: 'package-lock.json', manager: 'npm', exists: fs.existsSync('package-lock.json') },
    { name: 'yarn.lock', manager: 'yarn', exists: fs.existsSync('yarn.lock') },
    { name: 'pnpm-lock.yaml', manager: 'pnpm', exists: fs.existsSync('pnpm-lock.yaml') }
];

console.log('📦 锁文件状态:');
lockFiles.forEach(file => {
    const status = file.exists ? '✅ 存在' : '❌ 不存在';
    console.log(`  ${file.name} (${file.manager}): ${status}`);
});

// 检查node_modules
const nodeModulesExists = fs.existsSync('node_modules');
console.log(`\n📁 node_modules: ${nodeModulesExists ? '✅ 存在' : '❌ 不存在'}`);

// 检查package.json
if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log('\n📋 package.json 信息:');
    console.log(`  项目名称: ${packageJson.name}`);
    console.log(`  版本: ${packageJson.version}`);
    console.log(`  依赖数量: ${Object.keys(packageJson.dependencies || {}).length}`);
    console.log(`  开发依赖数量: ${Object.keys(packageJson.devDependencies || {}).length}`);
}

// 推荐的包管理器
const activeLockFiles = lockFiles.filter(f => f.exists);
console.log('\n🎯 包管理器建议:');

if (activeLockFiles.length === 1 && activeLockFiles[0].manager === 'npm') {
    console.log('✅ 项目已正确配置为使用 npm');
} else if (activeLockFiles.length > 1) {
    console.log('⚠️  检测到多个锁文件，建议清理:');
    activeLockFiles.forEach(f => {
        if (f.manager !== 'npm') {
            console.log(`  - 删除 ${f.name}`);
        }
    });
} else if (activeLockFiles.length === 0) {
    console.log('⚠️  未找到锁文件，建议运行 npm install');
}

console.log('\n🚀 推荐命令:');
console.log('  开发: npm run dev');
console.log('  构建: npm run build');
console.log('  检查: npm run lint');
console.log('  安装依赖: npm install');