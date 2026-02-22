const fs = require('fs');
const files = [
  'index.html',
  'sao-paulo/index.html',
  'sao-paulo/rede-credenciada.html',
  'planos/index.html',
  'servicos/index.html',
  'quem-somos/index.html',
  'contato/index.html',
  'cidades/index.html',
  'tabela-de-precos/index.html',
  'simulador-de-precos/index.html'
];

for (const f of files) {
  const c = fs.readFileSync(f, 'utf8');
  const footerMatch = c.match(/<footer>[\s\S]*?<\/footer>/);
  if (!footerMatch) { console.log(f + ': NO FOOTER'); continue; }
  const footer = footerMatch[0];
  
  // Extract all href links with their text context
  const linkMatches = [...footer.matchAll(/href="([^"]*)"[^>]*>([^<]*)</g)];
  const links = linkMatches.map(m => ({ href: m[1], text: m[2].trim() }));
  
  const seen = {};
  const dupes = [];
  for (const link of links) {
    const key = link.href;
    if (seen[key]) {
      dupes.push(key + ' ("' + seen[key] + '" e "' + link.text + '")');
    } else {
      seen[key] = link.text;
    }
  }
  
  if (dupes.length > 0) {
    console.log('\n' + f + ': DUPLICADOS:');
    dupes.forEach(d => console.log('  -> ' + d));
  } else {
    console.log(f + ': OK');
  }
}
