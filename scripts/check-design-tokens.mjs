import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Read the real tokens rather than maintaining a second copy of the palette.
const css = readFileSync(
  new URL('../apps/frontend/src/styles/global.css', import.meta.url),
  'utf8',
);
function tokens(selector) {
  const block = css.slice(css.indexOf(`${selector} {`)).split('}')[0];
  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[\da-f]{6});/gi)].map((m) => [
      m[1],
      m[2],
    ]),
  );
}
function luminance(hex) {
  const rgb = hex
    .slice(1)
    .match(/../g)
    .map((v) => parseInt(v, 16) / 255);
  const linear = rgb.map((v) =>
    v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
  );
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}
function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
const light = tokens(':root');
const dark = { ...light, ...tokens('.dark') };
for (const [mode, palette] of Object.entries({ light, dark })) {
  const pairs = [];
  for (const surface of [
    'background',
    'card',
    'popover',
    'secondary',
    'muted',
    'accent',
  ]) {
    pairs.push(
      ['foreground', surface, 4.5],
      ['muted-foreground', surface, 4.5],
      ['ring', surface, 3],
    );
  }
  for (const surface of [
    'primary',
    'secondary',
    'card',
    'popover',
    'accent',
    'destructive',
    'success',
    'warning',
    'info',
    'hero',
    'danger',
  ]) {
    pairs.push([
      `${surface}-foreground`,
      surface === 'danger' ? 'danger-surface' : surface,
      4.5,
    ]);
  }
  pairs.push(
    ['hero-muted', 'hero', 4.5],
    ['hero-foreground', 'hero-accent', 4.5],
    ['hero-muted', 'hero-accent', 4.5],
    ['hero-positive', 'hero', 4.5],
  );
  for (let index = 1; index <= 6; index++)
    pairs.push(['dog-foreground', `dog-${index}`, 4.5]);
  const results = pairs.map(([fg, bg, minimum]) => {
    assert.ok(palette[fg] && palette[bg], `Missing token: ${fg}/${bg}`);
    const ratio = contrast(palette[fg], palette[bg]);
    assert.ok(
      ratio >= minimum,
      `${mode} ${fg}/${bg}: ${ratio.toFixed(2)} < ${minimum}`,
    );
    return { fg, bg, ratio };
  });
  const text = results
    .filter((r) => r.fg !== 'ring')
    .sort((a, b) => a.ratio - b.ratio)[0];
  const focus = results
    .filter((r) => r.fg === 'ring')
    .sort((a, b) => a.ratio - b.ratio)[0];
  console.log(
    `${mode}: ${results.length} pairs pass; minimum text ${text.ratio.toFixed(2)} (${text.fg}/${text.bg}), focus ${focus.ratio.toFixed(2)} (${focus.bg})`,
  );
}

// The mockup's small visual labels must not shrink actual hit targets.
for (const [name, minimum] of [
  ['control-min', 44],
  ['control-field', 44],
  ['control-action', 56],
]) {
  const match = css.match(new RegExp(`--${name}:\\s*([\\d.]+)rem;`));
  assert.ok(match, `Missing rem dimension: ${name}`);
  assert.ok(
    Number(match[1]) * 16 >= minimum,
    `${name} must be at least ${minimum}px`,
  );
}
console.log(
  'Control dimensions pass: touch >=44px, field >=44px, action >=56px',
);
