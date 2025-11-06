#!/usr/bin/env node

/**
 * Build script for NotifyX Backend
 * Handles TypeScript compilation and copying of static assets
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, 'dist');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Created directory: ${dir}`, 'blue');
  }
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  
  if (stat.isDirectory()) {
    ensureDir(dest);
    const files = fs.readdirSync(src);
    files.forEach(file => {
      copyRecursive(
        path.join(src, file),
        path.join(dest, file)
      );
    });
  } else {
    const destDir = path.dirname(dest);
    ensureDir(destDir);
    fs.copyFileSync(src, dest);
  }
}

function cleanDist() {
  log('Cleaning dist directory...', 'yellow');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
    log('Dist directory cleaned', 'green');
  }
}

function compileTypeScript() {
  log('Compiling TypeScript...', 'yellow');
  try {
    execSync('tsc', { 
      stdio: 'inherit',
      cwd: rootDir 
    });
    log('TypeScript compilation successful', 'green');
    return true;
  } catch (error) {
    log('TypeScript compilation failed', 'red');
    process.exit(1);
  }
}

function copyStaticAssets() {
  log('Copying static assets...', 'yellow');
  
  const assetsToCopy = [
    { src: 'templates', dest: 'templates' },
    // Add other static assets here if needed
  ];

  assetsToCopy.forEach(({ src, dest }) => {
    const srcPath = path.join(srcDir, src);
    const destPath = path.join(distDir, dest);
    
    if (fs.existsSync(srcPath)) {
      copyRecursive(srcPath, destPath);
      log(`Copied ${src} to ${dest}`, 'green');
    } else {
      log(`Warning: ${srcPath} does not exist, skipping...`, 'yellow');
    }
  });
}

function verifyBuild() {
  log('Verifying build...', 'yellow');
  
  const indexFile = path.join(distDir, 'index.js');
  if (!fs.existsSync(indexFile)) {
    log('Error: dist/index.js not found. Build may have failed.', 'red');
    process.exit(1);
  }
  
  // Check if templates directory exists
  const templatesDir = path.join(distDir, 'templates');
  if (!fs.existsSync(templatesDir)) {
    log('Warning: templates directory not found in dist', 'yellow');
  }
  
  log('Build verification successful', 'green');
}

function main() {
  log('Starting build process...', 'blue');
  log('================================', 'blue');
  
  // Step 1: Clean dist directory
  cleanDist();
  
  // Step 2: Compile TypeScript
  if (!compileTypeScript()) {
    process.exit(1);
  }
  
  // Step 3: Copy static assets
  copyStaticAssets();
  
  // Step 4: Verify build
  verifyBuild();
  
  log('================================', 'blue');
  log('Build completed successfully!', 'green');
  log(`Output directory: ${distDir}`, 'blue');
}

// Run the build
main();

