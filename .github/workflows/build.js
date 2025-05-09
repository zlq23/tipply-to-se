const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('style.css', 'utf8');
const js = fs.readFileSync('script.js', 'utf8');

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
