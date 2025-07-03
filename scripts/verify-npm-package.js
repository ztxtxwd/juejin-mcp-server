#!/usr/bin/env node

/**
 * NPM包内容验证脚本
 * 验证哪些文件会被包含在npm包中
 */

const fs = require('fs');
const path = require('path');

function readPackageJson() {
  const packagePath = path.join(process.cwd(), 'package.json');
  return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
}

function readNpmIgnore() {
  const npmIgnorePath = path.join(process.cwd(), '.npmignore');
  if (fs.existsSync(npmIgnorePath)) {
    return fs.readFileSync(npmIgnorePath, 'utf8')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
  }
  return [];
}

function readGitIgnore() {
  const gitIgnorePath = path.join(process.cwd(), '.gitignore');
  if (fs.existsSync(gitIgnorePath)) {
    return fs.readFileSync(gitIgnorePath, 'utf8')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
  }
  return [];
}

function getAllFiles(dir, baseDir = dir) {
  const files = [];
  
  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const relativePath = path.relative(baseDir, fullPath);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!item.startsWith('.') && item !== 'node_modules') {
          walk(fullPath);
        }
      } else if (stat.isFile()) {
        files.push(relativePath);
      }
    }
  }
  
  walk(dir);
  return files;
}

function isIgnored(filePath, ignorePatterns) {
  return ignorePatterns.some(pattern => {
    // 简单的glob匹配
    if (pattern.endsWith('/')) {
      return filePath.startsWith(pattern) || filePath.startsWith(pattern.slice(0, -1));
    }
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filePath);
    }
    return filePath === pattern || filePath.startsWith(pattern + '/');
  });
}

function main() {
  console.log('📦 NPM包内容验证');
  console.log('==================');
  
  const pkg = readPackageJson();
  const npmIgnore = readNpmIgnore();
  const gitIgnore = readGitIgnore();
  
  console.log('\n📋 Package.json files字段:');
  if (pkg.files) {
    pkg.files.forEach(file => console.log(`  ✅ ${file}`));
  } else {
    console.log('  ⚠️  未定义files字段，将使用默认规则');
  }
  
  console.log('\n🚫 .npmignore规则:');
  npmIgnore.forEach(pattern => console.log(`  ❌ ${pattern}`));
  
  console.log('\n📁 当前项目文件:');
  const allFiles = getAllFiles(process.cwd());
  
  // 如果定义了files字段，只包含指定的文件
  let includedFiles = [];
  let excludedFiles = [];
  
  if (pkg.files && pkg.files.length > 0) {
    // 使用files字段
    for (const file of allFiles) {
      let included = false;
      
      for (const pattern of pkg.files) {
        if (pattern.includes('*')) {
          const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\//g, '\\/'));
          if (regex.test(file)) {
            included = true;
            break;
          }
        } else if (file === pattern || file.startsWith(pattern + '/')) {
          included = true;
          break;
        }
      }
      
      // 检查是否被.npmignore排除
      if (included && !isIgnored(file, npmIgnore)) {
        includedFiles.push(file);
      } else {
        excludedFiles.push(file);
      }
    }
  } else {
    // 使用默认规则 + .npmignore
    const defaultIgnore = [
      'node_modules/',
      '.git/',
      '*.log',
      '.DS_Store',
      'Thumbs.db'
    ];
    
    const allIgnorePatterns = [...defaultIgnore, ...gitIgnore, ...npmIgnore];
    
    for (const file of allFiles) {
      if (!isIgnored(file, allIgnorePatterns)) {
        includedFiles.push(file);
      } else {
        excludedFiles.push(file);
      }
    }
  }
  
  console.log('\n✅ 将被包含的文件:');
  includedFiles.sort().forEach(file => {
    const size = fs.statSync(file).size;
    const sizeStr = size > 1024 ? `${(size/1024).toFixed(1)}KB` : `${size}B`;
    console.log(`  📄 ${file} (${sizeStr})`);
  });
  
  console.log('\n❌ 将被排除的文件:');
  excludedFiles.sort().forEach(file => {
    console.log(`  🚫 ${file}`);
  });
  
  console.log('\n📊 统计信息:');
  console.log(`  - 包含文件: ${includedFiles.length}`);
  console.log(`  - 排除文件: ${excludedFiles.length}`);
  console.log(`  - 总文件数: ${allFiles.length}`);
  
  // 检查重要文件
  const importantFiles = ['README.md', 'package.json', 'dist/index.js'];
  console.log('\n🔍 重要文件检查:');
  importantFiles.forEach(file => {
    if (includedFiles.includes(file)) {
      console.log(`  ✅ ${file} - 已包含`);
    } else {
      console.log(`  ❌ ${file} - 未包含`);
    }
  });
  
  // 检查docs目录
  const docsFiles = includedFiles.filter(file => file.startsWith('docs/'));
  if (docsFiles.length > 0) {
    console.log('\n⚠️  警告: docs目录文件仍会被包含:');
    docsFiles.forEach(file => console.log(`  📚 ${file}`));
  } else {
    console.log('\n✅ docs目录已正确排除');
  }
}

if (require.main === module) {
  main();
}

module.exports = { readPackageJson, readNpmIgnore, getAllFiles, isIgnored };
