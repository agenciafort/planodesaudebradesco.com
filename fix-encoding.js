const fs = require('fs');
const path = require('path');

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

// Correct header HTML
const CORRECT_HEADER = `<header>
    <div class="container">
        <a href="/" class="header-brand">
            <img src="/img/logo-fortplanos.webp" alt="FortPlanos \u2014 Corretora de Planos de Sa\u00fade Bradesco" width="140" height="36" fetchpriority="high">
        </a>

        <button class="menu-toggle" aria-label="Abrir menu de navega\u00e7\u00e3o">\u2630</button>

        <nav>
            <a href="/quem-somos/">Sobre</a>
            <a href="/servicos/">Servi\u00e7os</a>
            <a href="/planos/">Planos</a>
            <a href="/cidades/">Cidades</a>
            <a href="/blog/">Blog</a>
            <a href="/contato/">Contato</a>
            <a href="/tabela-de-precos/" class="btn btn-branco nav-cta" style="padding:8px 20px; font-size:.85rem;">Tabela de Pre\u00e7os</a>
            <a href="/simulador-de-precos/" class="btn btn-vermelho nav-cta" style="padding:8px 20px; font-size:.85rem;">Simulador de Pre\u00e7os</a>
        </nav>
    </div>
</header>`;

// Correct footer HTML (standard - for quem-somos, we'll modify the fortplanos link)
const CORRECT_FOOTER = `<footer>
    <div class="container">
        <!-- Coluna 1: FortPlanos -->
        <div>
            <img src="/img/logo-fortplanos.webp" alt="FortPlanos" width="120" height="30" loading="lazy"><br>
            <strong style="color:var(--branco);">FortPlanos</strong><br>
            Corretora autorizada Bradesco Sa\u00fade.<br>
            Planos de sa\u00fade empresariais PME.<br>
            <a href="/quem-somos/">fortplanos.com.br</a>

            <div class="footer-social">
                <a href="https://www.instagram.com/fortplanosdesaude/" target="_blank" rel="noopener" aria-label="Instagram FortPlanos">\uD83D\uDCF7 Instagram</a>
                <a href="https://www.facebook.com/fortplanos/" target="_blank" rel="noopener" aria-label="Facebook FortPlanos">\uD83D\uDC4D Facebook</a>
                <a href="https://www.youtube.com/@fortplanos" target="_blank" rel="noopener" aria-label="YouTube FortPlanos">\u25B6\uFE0F YouTube</a>
            </div>
        </div>

        <!-- Coluna 2: Bradesco Sa\u00fade -->
        <div>
            <strong style="color:var(--branco);">Bradesco Sa\u00fade</strong><br>
            <a href="/planos/">Planos</a><br>
            <a href="/tabela-de-precos/">Tabela de Pre\u00e7os</a><br>
            <a href="/simulador-de-precos/">Simulador de Pre\u00e7os</a><br>
            <a href="/sao-paulo/rede-credenciada.html">Rede Credenciada SP</a><br>
            <a href="/sao-paulo/">Bradesco Sa\u00fade SP</a><br>
            <a href="/blog/">Blog</a>
        </div>

        <!-- Coluna 3: Cidades -->
        <div>
            <strong style="color:var(--branco);">Cidades</strong><br>
            <a href="/sao-paulo/">S\u00e3o Paulo e Grande SP</a><br>
            <a href="/cidades/">Todas as Cidades</a><br>
            <span style="color:#666;">Campinas \u2014 em breve</span><br>
            <span style="color:#666;">Baixada Santista \u2014 em breve</span><br>
            <span style="color:#666;">Vale do Para\u00edba \u2014 em breve</span><br>
            <span style="color:#666;">Rio de Janeiro \u2014 em breve</span><br>
            <span style="color:#666;">Belo Horizonte \u2014 em breve</span>
        </div>

        <!-- Coluna 4: Institucional + Contato -->
        <div>
            <strong style="color:var(--branco);">Institucional</strong><br>
            <a href="/quem-somos/">Quem Somos</a><br>
            <a href="/servicos/">Servi\u00e7os</a><br>
            <a href="/contato/">Contato</a><br>
            <a href="/termos-de-uso/">Termos de Uso</a><br>
            <a href="/politica-de-privacidade/">Pol\u00edtica de Privacidade</a><br>
            <a href="/lgpd/">Canal LGPD</a><br><br>
            <strong style="color:var(--branco);">Contato</strong><br>
            <a href="tel:+551151920609">(11) 5192-0609</a><br>
            contato@fortplanos.com.br
        </div>

        <!-- Legal -->
        <div class="footer-legal">
            <div style="display:flex; gap:16px; justify-content:center; flex-wrap:wrap; margin-bottom:12px;">
                <span class="footer-trust-item">\uD83D\uDD12 Site Seguro SSL</span>
                <span class="footer-trust-item">\uD83D\uDEE1\uFE0F Operadoras registradas ANS</span>
                <span class="footer-trust-item">\u2705 LGPD Compliant</span>
                <span class="footer-trust-item">\uD83D\uDCCB Corretores habilitados SUSEP</span>
            </div>
            <strong>CNPJ: 53.290.346/0001-38</strong> | A Clebio Costa Bispo Publicidade LTDA - ME<br><br>
            Este site \u00e9 um canal independente de informa\u00e7\u00e3o sobre planos Bradesco Sa\u00fade, operado pela FortPlanos.
            N\u00e3o possui v\u00ednculo societ\u00e1rio com a Bradesco Seguros S.A. Todos os dados s\u00e3o extra\u00eddos
            da base FortPlanos (atualizada em 06/02/2026) e podem sofrer altera\u00e7\u00f5es sem aviso pr\u00e9vio.
            Consulte condi\u00e7\u00f5es vigentes antes de contratar.
            Os planos de sa\u00fade citados s\u00e3o regulados pela <strong>ANS \u2014 Ag\u00eancia Nacional de Sa\u00fade Suplementar</strong>.<br>
            \u00A9 2024\u20132026 FortPlanos \u2014 Todos os direitos reservados.
        </div>
    </div>
</footer>`;

const CORRECT_FOOTER_QUEM_SOMOS = CORRECT_FOOTER.replace(
  '<a href="/quem-somos/">fortplanos.com.br</a>',
  '<a href="https://fortplanos.com.br" target="_blank" rel="noopener">fortplanos.com.br</a>'
);

let totalFixed = 0;

for (const file of files) {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // Replace header block
  const headerRegex = /<header>[\s\S]*?<\/header>/;
  const headerMatch = content.match(headerRegex);
  if (headerMatch) {
    content = content.replace(headerRegex, CORRECT_HEADER);
    console.log(`  ${file}: header replaced`);
  }
  
  // Replace footer block
  const footerRegex = /<footer>[\s\S]*?<\/footer>/;
  const footerMatch = content.match(footerRegex);
  if (footerMatch) {
    const correctFooter = file === 'quem-somos/index.html' ? CORRECT_FOOTER_QUEM_SOMOS : CORRECT_FOOTER;
    content = content.replace(footerRegex, correctFooter);
    console.log(`  ${file}: footer replaced`);
  }
  
  if (content !== original) {
    // Remove BOM if present
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.substring(1);
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    totalFixed++;
    console.log(`  ${file}: SAVED ✓`);
  } else {
    console.log(`  ${file}: no changes needed`);
  }
}

console.log(`\nTotal files fixed: ${totalFixed}`);
