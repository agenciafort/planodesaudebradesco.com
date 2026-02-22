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

let fixed = 0;

for (const f of files) {
  let c = fs.readFileSync(f, 'utf8');
  const original = c;

  // 1. Remove "Bradesco Saúde SP" link from Coluna 2 (duplicated in Coluna 3 as "São Paulo e Grande SP")
  c = c.replace(
    '            <a href="/sao-paulo/">Bradesco Sa\u00fade SP</a><br>\n            <a href="/blog/">Blog</a>',
    '            <a href="/blog/">Blog</a>'
  );

  // 2. For all pages except quem-somos: remove <a> from "fortplanos.com.br" (keep as plain text)
  //    since /quem-somos/ is already linked in Institucional as "Quem Somos"
  if (f !== 'quem-somos/index.html') {
    c = c.replace(
      '<a href="/quem-somos/">fortplanos.com.br</a>',
      'fortplanos.com.br'
    );
  }
  // For quem-somos: the external link to fortplanos.com.br is fine (different destination)

  if (c !== original) {
    fs.writeFileSync(f, c, 'utf8');
    fixed++;
    console.log(f + ': CORRIGIDO');
  } else {
    console.log(f + ': sem alteracao');
  }
}

console.log('\nTotal corrigidos: ' + fixed);
