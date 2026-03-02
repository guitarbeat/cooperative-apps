#!/usr/bin/env node

/**
 * Version Update Script
 * Automates version bumping and tagging for the Stack Master Tool
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packagePath = path.join(__dirname, '..', 'package.json');

function getCurrentVersion() {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return packageJson.version;
}

function updateVersion(newVersion) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    packageJson.version = newVersion;

    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`✅ Updated package.json to version ${newVersion}`);
}

function createGitTag(version) {
    try {
        execSync(`git add package.json`, { stdio: 'inherit' });
        execSync(`git commit -m "chore: bump version to ${version}"`, { stdio: 'inherit' });
        execSync(`git tag -a v${version} -m "Release version ${version}"`, { stdio: 'inherit' });
        console.log(`✅ Created git tag v${version}`);
    } catch (error) {
        console.error('❌ Failed to create git tag:', error.message);
        process.exit(1);
    }
}

function showUsage() {
    console.log(`
🚀 Speaking Queue - Version Update Script

Usage:
  node scripts/update-version.js [version]

Arguments:
  version    New version number (e.g., 1.1.0, 2.0.0-beta.1)
             If not provided, shows current version

Examples:
  node scripts/update-version.js 1.1.0     # Bump to 1.1.0
  node scripts/update-version.js 2.0.0     # Major version bump
  node scripts/update-version.js           # Show current version

The script will:
- Update package.json
- Create a git commit
- Create an annotated git tag

Powered by Aaron's Love ❤️
  `);
}

function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        // Show current version
        const currentVersion = getCurrentVersion();
        console.log(`📦 Current version: ${currentVersion}`);
        console.log(`🔗 Git commit: ${execSync('git rev-parse --short HEAD').toString().trim()}`);
        console.log(`🌿 Git branch: ${execSync('git rev-parse --abbrev-ref HEAD').toString().trim()}`);
        return;
    }

    if (args[0] === '--help' || args[0] === '-h') {
        showUsage();
        return;
    }

    const newVersion = args[0];

    // Basic version validation
    const versionRegex = /^\d+\.\d+\.\d+(-[\w\.\-]+)?$/;
    if (!versionRegex.test(newVersion)) {
        console.error('❌ Invalid version format. Use semantic versioning (e.g., 1.2.3 or 1.2.3-beta.1)');
        process.exit(1);
    }

    const currentVersion = getCurrentVersion();
    console.log(`📦 Updating from ${currentVersion} to ${newVersion}`);

    // Update package.json
    updateVersion(newVersion);

    // Create git tag
    createGitTag(newVersion);

    console.log(`
🎉 Version update complete!
📦 New version: ${newVersion}
🏷️  Git tag: v${newVersion}

Next steps:
1. Push the changes: git push origin main
2. Push the tag: git push origin v${newVersion}
3. Deploy to production

Powered by Aaron's Love ❤️
  `);
}

// Run main function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
