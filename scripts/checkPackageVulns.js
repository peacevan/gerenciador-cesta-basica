const fs = require('fs');
const path = require('path');

function readJson(p) {
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return null; }
}

function findMaterializeVersions(packageJson, lockJson) {
  const versions = new Set();
  if (packageJson && packageJson.dependencies && packageJson.dependencies['materialize-css']) {
    versions.add(packageJson.dependencies['materialize-css']);
  }
  if (lockJson) {
    // package-lock v1 or v2 layout
    const pkgs = lockJson.dependencies || lockJson.packages || {};
    // v2 uses packages with paths, fallback to dependencies
    Object.keys(pkgs).forEach(k => {
      const entry = pkgs[k];
      if (!entry) return;
      if (k.endsWith('materialize-css') || k === 'materialize-css' || (entry.name === 'materialize-css')) {
        if (entry.version) versions.add(entry.version);
      }
    });
    if (lockJson.dependencies && lockJson.dependencies['materialize-css'] && lockJson.dependencies['materialize-css'].version) {
      versions.add(lockJson.dependencies['materialize-css'].version);
    }
  }
  return Array.from(versions);
}

function isVulnerableVersion(v) {
  if (!v) return false;
  // Normalize: remove ranges like ^ ~ >= <= etc.
  const clean = v.replace(/^[\^~><=\s]*/,'').split(' ')[0];
  // Vulnerable series: 1.0.x or any version that starts with 1.0
  return /^1\.0(\.|$)/.test(clean);
}

function main() {
  const root = path.join(__dirname, '..');
  const pkg = readJson(path.join(root, 'package.json')) || {};
  const lock = readJson(path.join(root, 'package-lock.json')) || {};

  const versions = findMaterializeVersions(pkg, lock);
  if (versions.length === 0) {
    console.log('OK: materialize-css not found in package.json or package-lock.json');
    process.exit(0);
  }

  const vulnerable = versions.filter(isVulnerableVersion);
  if (vulnerable.length > 0) {
    console.error('VULNERABLE dependency found: materialize-css versions =>', versions.join(', '));
    console.error('This project reports Trivy CVEs (CVE-2019-11002, CVE-2019-11003, CVE-2019-11004, CVE-2022-25349) affecting materialize-css@1.0.x');
    console.error('Recommended actions: update/remove materialize-css, or audit and remove usage of Autocomplete/Tooltip/Toast components. See .codeguard/MITIGATIONS.md');
    process.exit(4);
  }

  console.log('OK: materialize-css versions look non-vulnerable:', versions.join(', '));
  process.exit(0);
}

if (require.main === module) main();
