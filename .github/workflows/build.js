const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('index.html', 'utf8');
let css = fs.readFileSync('style.css', 'utf8');
let js = fs.readFileSync('script.js', 'utf8');

const unknownAvatarSvg = fs.readFileSync('assets/unknown-avatar.svg', 'utf8');
const settingsIconSvg = fs.readFileSync('assets/settings-icon.svg', 'utf8');

const encodeSVG = svg =>
  'data:image/svg+xml;utf8,' + encodeURIComponent(svg.trim().replace(/\s+/g, ' '));

js = js.replace(
  /let unknownAvatar\s*=\s*['"]assets\/unknown-avatar\.svg['"]/,
  `let unknownAvatar = "${encodeSVG(unknownAvatarSvg)}"`
);

css = css.replace(
  /url\(['"]?assets\/settings-icon\.svg['"]?\)/,
  `url("${encodeSVG(settingsIconSvg)}")`
);

const final = html
  .replace(
    /<link rel="stylesheet" href="style.css">/,
    `<style>\n${css}\n</style>`
  )
  .replace(
    /<script src="script.js"><\/script>/,
    `<script>\n${js}\n</script>`
  );

fs.writeFileSync('tipply-to-se.html', final);
