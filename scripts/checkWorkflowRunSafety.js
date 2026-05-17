const fs = require('fs');
const path = require('path');

function main() {
  const p = path.join(__dirname, '..', '.github', 'workflows', 'sdd-pipeline.yml');
  if (!fs.existsSync(p)) {
    console.error('Workflow file not found:', p);
    process.exit(2);
  }

  const content = fs.readFileSync(p, 'utf8');
  const lines = content.split(/\r?\n/);

  let foundProblem = false;

  for (let i = 0; i < lines.length; i++) {
    if (/^\s*run:\s*\|/.test(lines[i])) {
      const indent = (lines[i].match(/^(\s*)/) || ['',''])[1].length;
      let j = i + 1;
      let block = '';
      while (j < lines.length) {
        const leading = (lines[j].match(/^(\s*)/) || ['',''])[1].length;
        if (lines[j].trim() === '') { block += '\n'; j++; continue; }
        if (leading <= indent) break;
        block += lines[j].slice(indent) + '\n';
        j++;
      }

      if (/\$\{\{\s*github\./.test(block)) {
        console.error('Unsafe interpolation of github context detected inside a run block near line', i+1);
        foundProblem = true;
      }
    }
  }

  if (foundProblem) {
    console.error('Check failed: unsafe github interpolation found in run blocks.');
    process.exit(3);
  }

  console.log('OK: no github interpolation found in run blocks.');
  process.exit(0);
}

if (require.main === module) main();
