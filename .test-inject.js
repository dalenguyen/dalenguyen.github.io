// Functional smoke test: take a real learn page, run the same dedupe + inject
// logic against it, and assert the share row appears in the right place.
const fs = require('fs');

const src = fs.readFileSync(
  '/tmp/run-b420c2ab-864d-4545-ab46-e4b07d810134/repo/apps/blog-app/src/plugins/learn-manifest.plugin.ts',
  'utf-8',
);

// Greedy-ish extraction between the const line and the closing backtick on
// its own line. Since the constants don't contain backticks (template literals
// use single quotes inside), this works.
function extractAfter(name) {
  const startMarker = 'const ' + name + ' = `';
  const start = src.indexOf(startMarker);
  if (start === -1) throw new Error('missing ' + name);
  const open = start + startMarker.length;
  // closing ` is on its own line followed by ;
  const close = src.indexOf('`;\n', open);
  if (close === -1) throw new Error('cannot find end of ' + name);
  return src.slice(open, close);
}

const SHARE = extractAfter('SHARE_HTML');
const NAV = extractAfter('NAV_HTML');
const A11Y = extractAfter('A11Y_ADDON');

function injectNav(html) {
  const cleaned = html
    .replace(/<link[^>]+Material\+Icons[^>]*>\s*<style>\s*#learn-app-nav[\s\S]*?<\/nav>/m, '')
    .replace(/<!-- learn-a11y-start -->[\s\S]*?<!-- learn-a11y-end -->/m, '')
    .replace(/<!-- learn-share-start -->[\s\S]*?<!-- learn-share-end -->/m, '');
  return cleaned
    .replace('<body>', '<body>\n' + NAV + '\n' + A11Y)
    .replace('</body>', SHARE + '\n</body>');
}

// Test on every learn page
const dir = '/tmp/run-b420c2ab-864d-4545-ab46-e4b07d810134/repo/libs/portfolio/shared/learn';
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.html'));

let allOk = true;
for (const f of files) {
  const original = fs.readFileSync(dir + '/' + f, 'utf-8');
  // Inject once
  let out = injectNav(original);
  // Inject twice — re-injection case
  out = injectNav(out);

  const navAfterBody = out.indexOf('<body>') < out.indexOf('learn-app-nav');
  const shareBeforeBodyEnd = out.indexOf('learn-share-start') < out.indexOf('</body>');
  const navCount = (out.match(/learn-app-nav/g) || []).length;
  const a11yCount = (out.match(/learn-a11y-start/g) || []).length;
  const shareCount = (out.match(/learn-share-start/g) || []).length;
  const stillHasBody = out.includes('</body>') && out.includes('</html>');

  const ok =
    navAfterBody &&
    shareBeforeBodyEnd &&
    navCount === 1 &&
    a11yCount === 1 &&
    shareCount === 1 &&
    stillHasBody;

  console.log(
    (ok ? 'OK  ' : 'FAIL') + ' ' + f + ' (nav=' + navCount + ', a11y=' + a11yCount + ', share=' + shareCount + ')',
  );
  if (!ok) {
    allOk = false;
    console.log('  body-after-nav=' + navAfterBody);
    console.log('  share-before-/body=' + shareBeforeBodyEnd);
    console.log('  still has </body></html>=' + stillHasBody);
  }
}

if (!allOk) {
  console.error('SOME FILES FAILED');
  process.exit(1);
}
console.log('---');
console.log('All ' + files.length + ' learn pages pass injection + dedupe');