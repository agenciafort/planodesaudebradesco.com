const fs = require('fs');

// Check line endings in index.html
let c = fs.readFileSync('index.html', 'utf8');
const hasCRLF = c.includes('\r\n');
console.log('index.html line endings: ' + (hasCRLF ? 'CRLF' : 'LF'));

// Find the exact text around the duplicate
const idx1 = c.indexOf('Bradesco Sa\u00fade SP');
if (idx1 > -1) {
  console.log('Found "Bradesco Saúde SP" at pos ' + idx1);
  console.log('Context: [' + c.substring(idx1 - 50, idx1 + 50) + ']');
}

// Check contato
let cc = fs.readFileSync('contato/index.html', 'utf8');
const idx2 = cc.indexOf('fortplanos.com.br</a>');
if (idx2 > -1) {
  console.log('\ncontato - Found "fortplanos.com.br</a>" at pos ' + idx2);
  console.log('Context: [' + cc.substring(idx2 - 80, idx2 + 30) + ']');
}
const idx3 = cc.indexOf('fortplanos.com.br\r\n');
if (idx3 > -1) {
  console.log('contato - Found plain "fortplanos.com.br" at pos ' + idx3);
}

// Now fix - handle both LF and CRLF
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

let fixed = 0;
for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  const original = content;
  
  // Fix 1: Remove "Bradesco Saúde SP" duplicate (using regex for flexible whitespace/line endings)
  content = content.replace(
    /\s*<a href="\/sao-paulo\/">Bradesco Sa\u00fade SP<\/a><br>\r?\n\s*(<a href="\/blog\/">Blog<\/a>)/,
    '\n            $1'
  );
  
  // Fix 2: Remove link from "fortplanos.com.br" in Coluna 1 (except quem-somos)
  if (f !== 'quem-somos/index.html') {
    content = content.replace(
      /<a href="\/quem-somos\/">fortplanos\.com\.br<\/a>/,
      'fortplanos.com.br'
    );
  }
  
  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    fixed++;
    console.log('\n' + f + ': CORRIGIDO');
  }
}
console.log('\nTotal corrigidos: ' + fixed);
