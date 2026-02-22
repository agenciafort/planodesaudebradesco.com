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

let issues = 0;
for (const f of files) {
  const c = fs.readFileSync(f, 'utf8');
  
  // Check for corrupted chars (double-encoded UTF-8)
  const bad = ['\u00C3\u00A7', '\u00C3\u00A3', '\u00C3\u00BA', '\u00C3\u00A9', '\u00C3\u00AD', '\u00C3\u00B5', '\u00C3\u00A1', '\u00C3\u00AA'];
  const badReadable = ['Ã§(ç)', 'Ã£(ã)', 'Ãº(ú)', 'Ã©(é)', 'Ã­(í)', 'Ãµ(õ)', 'Ã¡(á)', 'Ãª(ê)'];
  
  const found = [];
  for (let i = 0; i < bad.length; i++) {
    if (c.includes(bad[i])) found.push(badReadable[i]);
  }
  
  if (found.length > 0) {
    console.log('STILL BROKEN: ' + f + ' -> ' + found.join(', '));
    issues++;
  }
  
  // Check correct chars exist in header/footer
  const hasPrecos = c.includes('Pre\u00E7os');
  const hasSaude = c.includes('Sa\u00FAde');
  const hasServicos = c.includes('Servi\u00E7os');
  const hasNavegacao = c.includes('navega\u00E7\u00E3o');
  const hasSaoPaulo = c.includes('S\u00E3o Paulo');
  
  const status = (hasPrecos && hasSaude && hasServicos && hasNavegacao && hasSaoPaulo) ? '\u2713 OK' : '\u2717 MISSING';
  console.log(f + ': ' + status + ' (Preços:' + hasPrecos + ' Saúde:' + hasSaude + ' Serviços:' + hasServicos + ' navegação:' + hasNavegacao + ' São Paulo:' + hasSaoPaulo + ')');
}

console.log('\nTotal issues: ' + issues);
