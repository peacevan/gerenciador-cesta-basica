const fs = require('fs');
const path = require('path');

test('GitHub Actions run blocks must not interpolate github context directly', () => {
  const p = path.join(__dirname, '..', '.github', 'workflows', 'sdd-pipeline.yml');
  const content = fs.readFileSync(p, 'utf8');
  const lines = content.split(/\r?\n/);

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

      expect(block).not.toMatch(/\$\{\{\s*github\./);
    }
  }
});
