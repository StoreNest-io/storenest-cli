#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');
const { execSync } = require('child_process');
const os = require('os');

const USAGE = `
Storenest Plugin CLI

Usage:
  storenest-plugin <command> [options]

Commands:
  init [dir]         Scaffold a new plugin in [dir] (default: current directory)
  validate [dir]     Validate plugin manifest and run security checks
  package [dir]      Package plugin as a zip for upload
  info [dir]         Show plugin manifest and security summary
  help               Show this help message

Examples:
  storenest-plugin init my-plugin
  storenest-plugin validate
  storenest-plugin package
  storenest-plugin info
`;

function printHelp() {
  console.log(USAGE);
}

function findPluginFile(dir) {
  const main = path.join(dir, 'plugin.js');
  if (fs.existsSync(main)) return main;
  throw new Error('plugin.js not found in ' + dir);
}

function readManifest(pluginFile) {
  const content = fs.readFileSync(pluginFile, 'utf8');
  const manifestMatch = content.match(/@manifest\s*(\{[\s\S]*?\})/);
  if (!manifestMatch) throw new Error('No @manifest found in plugin.js');
  try {
    return JSON.parse(manifestMatch[1]);
  } catch (e) {
    throw new Error('Invalid JSON in manifest: ' + e.message);
  }
}

function validateManifest(manifest) {
  const required = ['name', 'description', 'version', 'author', 'pluginCode', 'category'];
  for (const key of required) {
    if (!manifest[key]) throw new Error(`Manifest missing required field: ${key}`);
  }
  if (manifest.permissions) {
    const allowed = [
      'database.read', 'database.write', 'api.read', 'api.write',
      'files.read', 'files.write', 'network.request'
    ];
    for (const perm of manifest.permissions) {
      if (!allowed.includes(perm)) throw new Error(`Permission not allowed: ${perm}`);
    }
  }
  if (manifest.allowedTables) {
    if (!Array.isArray(manifest.allowedTables)) throw new Error('allowedTables must be an array');
  }
  if (manifest.allowedDomains) {
    if (!Array.isArray(manifest.allowedDomains)) throw new Error('allowedDomains must be an array');
  }
  return true;
}

function staticSecurityCheck(pluginFile) {
  const content = fs.readFileSync(pluginFile, 'utf8');
  const patterns = [
    /eval\s*\(/i,
    /Function\s*\(/i,
    /setTimeout\s*\(/i,
    /setInterval\s*\(/i,
    /process\./i,
    /require\s*\(/i,
    /module\./i,
    /global\./i,
    /__dirname/i,
    /__filename/i,
    /fs\./i,
    /child_process/i,
    /exec\s*\(/i,
    /spawn\s*\(/i
  ];
  for (const pattern of patterns) {
    if (pattern.test(content)) {
      throw new Error(`Security check failed: forbidden pattern detected (${pattern})`);
    }
  }
}

function hashFile(file) {
  const content = fs.readFileSync(file);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function scaffoldPlugin(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const pluginJs = path.join(dir, 'plugin.js');
  if (fs.existsSync(pluginJs)) throw new Error('plugin.js already exists');
  const manifest = `/*
@manifest {
  "name": "My Plugin",
  "description": "Describe your plugin",
  "version": "1.0.0",
  "author": "Your Name",
  "pluginCode": "my-plugin",
  "category": "Utilities",
  "permissions": ["database.read"],
  "allowedTables": ["products"],
  "allowedDomains": [],
  "rateLimit": 100,
  "maxExecutionTime": 30000
}
*/

const settings = {
  example_setting: {
    type: 'string',
    label: 'Example Setting',
    required: false
  }
};

const hooks = {
  afterOrderCreate: async (data) => {
    storenest.api.log.info('Order created:', data.order.id);
  }
};

// Export for testing
module.exports = { settings, hooks };
`;
  fs.writeFileSync(pluginJs, manifest);
  fs.writeFileSync(path.join(dir, 'README.md'), '# My Plugin\n\nDescribe your plugin here.');
  fs.writeFileSync(path.join(dir, '.gitignore'), 'node_modules\n.DS_Store\n*.log\n');
  console.log('Scaffolded new plugin in', dir);
}

function packagePlugin(dir) {
  const name = path.basename(path.resolve(dir));
  const zipName = `${name}.zip`;
  const exclude = ['node_modules', '.git', '.DS_Store', '*.log', '*.tmp'];
  const excludeArgs = exclude.map(e => `-x "${e}"`).join(' ');
  const cmd = `cd "${dir}" && zip -r "../${zipName}" . ${excludeArgs}`;
  execSync(cmd, { stdio: 'inherit' });
  console.log('Packaged plugin as', zipName);
}

function showInfo(dir) {
  const pluginFile = findPluginFile(dir);
  const manifest = readManifest(pluginFile);
  console.log('Manifest:', JSON.stringify(manifest, null, 2));
  console.log('SHA256:', hashFile(pluginFile));
}

function main() {
  const [,, cmd, argDir] = process.argv;
  const dir = path.resolve(argDir || process.cwd());
  try {
    if (!cmd || cmd === 'help') return printHelp();
    if (cmd === 'init') return scaffoldPlugin(dir);
    if (cmd === 'validate') {
      const pluginFile = findPluginFile(dir);
      const manifest = readManifest(pluginFile);
      validateManifest(manifest);
      staticSecurityCheck(pluginFile);
      console.log('✅ Plugin is valid and passed security checks.');
      return;
    }
    if (cmd === 'package') return packagePlugin(dir);
    if (cmd === 'info') return showInfo(dir);
    printHelp();
  } catch (e) {
    console.error('❌', e.message);
    process.exit(1);
  }
}

main(); 