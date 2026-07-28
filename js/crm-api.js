/**
 * Ligação com o Tabelas (CRM Saúde) — tomada viva /api/v1/vivo
 *
 * A VERDADE ABSOLUTA é o cotador (Tabelas): o site mostra o que existe
 * lá, nem mais nem menos. Nada de ids fixos — produtos, tabelas e planos
 * são descobertos pelo que a tomada devolve; se o banco mudar por dentro,
 * o site não sente.
 *
 * Contrato preservado com as páginas (home, tabela-de-precos, simulador):
 *   FP_CRM.loadAllPrices() → { D, D2, slugToId, updatedAt } | null
 *     D  [vidas][adesao][slugDoSite] = [10 preços, faixas 0-18 … 59+]
 *     D2 = idem, com coparticipação
 *   FP_CRM.hydrateLinhasProduto({gridId, notaId}) — cards da home
 *   FP_CRM.buildSimuladorTabela(D) — inalterada
 *
 * Se a tomada falhar: devolve null e o HTML estático permanece (com a
 * data antiga visível no rodapé). Nunca inventamos preço.
 */
(function (w) {
    'use strict';

    var VIVO_BASE = 'https://crmsaude.agenciafort.com.br/api/v1/vivo';
    // chave pública travada NESTE domínio (planodesaudebradesco.com)
    var VIVO_KEY = 'fpk_live_bd28b61b354de068c3b5754a416b2e7cfefce2d82623addb';
    var OPERADORA_PREFIXO = 'bradesco';  // slug da operadora no Tabelas
    var REGIAO_DO_SITE = 'sao paulo';    // este site vende SP; produto de outra região não entra

    var FAIXAS_ORDEM = ['00a18', '19a23', '24a28', '29a33', '34a38', '39a43', '44a48', '49a53', '54a58', '59mais'];

    // Só as linhas que o cotador ainda vende. Saúde + e Efetivo saíram do
    // portfólio (continuam na rede credenciada, mas sem tabela de preço).
    var LINHAS_RESUMO = [
        { tag: 'Nacional', tagClass: 'tag-nacional', titulo: 'Nacional', planoSlug: 'nacional-iii-quarto', acomod: '(apto.)', desc: 'Rede ampliada, apartamento. Várias faixas de reembolso.' },
        { tag: 'Premium', tagClass: 'tag-premium', titulo: 'Nacional Plus', planoSlug: 'nacional-plus-4-quarto', acomod: '', desc: 'Rede premium, reembolso amplo. Hospitais de referência nacional.' },
        { tag: 'Ultra Premium', tagClass: 'tag-premium', titulo: 'Premium', planoSlug: 'premium-6-quarto', acomod: '', desc: 'O melhor plano: Einstein, Sírio-Libanês. Reembolso completo.' }
    ];

    // ── tomada ───────────────────────────────────────────────────────────────
    function vivoGet(resource, params) {
        var qs = 'resource=' + encodeURIComponent(resource);
        Object.keys(params || {}).forEach(function (k) {
            qs += '&' + encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
        });
        var url = VIVO_BASE + '?' + qs;
        function tentar() {
            return fetch(url, { headers: { 'X-API-Key': VIVO_KEY, 'Accept': 'application/json' } })
                .then(function (r) {
                    if (!r.ok) throw new Error('HTTP ' + r.status);
                    return r.json();
                });
        }
        // falha passageira ganha uma segunda chance antes de desistir
        return tentar().catch(function () {
            return new Promise(function (res) { setTimeout(res, 800); }).then(tentar);
        });
    }

    // ── tradução Tabelas → chaves históricas do site ─────────────────────────
    function normalizar(s) {
        return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    }

    // "Saúde +" [Enfermaria] → 'saude-mais-enf' (mesmos slugs que as páginas conhecem)
    function slugDoSite(planoNome, acomodacao) {
        var base = normalizar(planoNome)
            .replace(/\+/g, ' mais ')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        var suf = normalizar(acomodacao).indexOf('enf') === 0 ? 'enf' : 'quarto';
        return base + '-' + suf;
    }

    function chaveVidas(min, max) { return min + '-a-' + max; }          // 3,29 → '3-a-29'
    function chaveAdesao(tipo) { return normalizar(tipo).indexOf('comp') === 0 ? 'comp' : 'livre'; }
    function temCopart(cop) { var c = normalizar(cop); return c !== '' && c !== 'sem'; }

    function escapeHtml(str) {
        if (!str) return '';
        var d = w.document.createElement('div');
        d.textContent = String(str);
        return d.innerHTML;
    }

    function formatPreco(valor) {
        return 'R$ ' + Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    function formatData(isoStr) {
        if (!isoStr) return '';
        var d = new Date(isoStr);
        var meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
            'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
        return meses[d.getMonth()] + '/' + d.getFullYear();
    }

    function hoje() {
        var d = new Date();
        return String(d.getDate()).padStart(2, '0') + '/' +
            String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
    }

    // ── carga única: tudo o que o cotador tem para este site ────────────────
    var _promessa = null;

    function loadAllPrices() {
        if (_promessa) return _promessa;
        _promessa = carregar().catch(function (err) {
            console.error('[FP_CRM] Tomada do Tabelas indisponível:', err);
            _promessa = null; // próxima chamada tenta de novo
            return null;
        });
        return _promessa;
    }

    async function carregar() {
        var produtos = await vivoGet('produtos');

        // só os produtos DESTA operadora, DESTA região, fora de manutenção
        var meus = (produtos || []).filter(function (p) {
            if (normalizar(p.operadora_slug).indexOf(OPERADORA_PREFIXO) !== 0) return false;
            if (p.precos_manutencao === true) return false; // preço não confiável não se mostra
            var regioes = p.regioes || [];
            return regioes.some(function (r) {
                return normalizar(r && r.nome ? r.nome : r).indexOf(REGIAO_DO_SITE) !== -1;
            });
        });
        if (!meus.length) return null;

        var D = {};
        var D2 = {};
        var slugToId = {};
        var updatedAt = null;
        var totalPrecos = 0;

        for (var i = 0; i < meus.length; i++) {
            var p = meus[i];
            if (p.updated_at && (!updatedAt || p.updated_at > updatedAt)) updatedAt = p.updated_at;

            var rows = await vivoGet('precos', { produto: String(p.produto_id) });
            (rows || []).forEach(function (r) {
                if (normalizar(r.tipo_empresa) === 'mei') return; // site não vende MEI
                var idx = FAIXAS_ORDEM.indexOf(r.faixa_codigo);
                if (idx < 0) return;

                var alvo = temCopart(r.coparticipacao) ? D2 : D;
                var vidas = chaveVidas(r.vidas_min, r.vidas_max);
                var adesao = chaveAdesao(r.tipo_adesao);
                var slug = slugDoSite(r.plano_nome, r.acomodacao);

                if (!alvo[vidas]) alvo[vidas] = {};
                if (!alvo[vidas][adesao]) alvo[vidas][adesao] = {};
                if (!alvo[vidas][adesao][slug]) alvo[vidas][adesao][slug] = [];

                var cel = alvo[vidas][adesao][slug];
                if (cel[idx] != null && cel[idx] !== r.preco) {
                    // dois produtos disputando a mesma célula: fica o primeiro, e avisa
                    console.warn('[FP_CRM] Conflito de preço ignorado:', slug, vidas, adesao, r.faixa_codigo, cel[idx], '≠', r.preco);
                    return;
                }
                cel[idx] = r.preco;
                if (slugToId[slug] == null) slugToId[slug] = r.plano_id;
                totalPrecos++;
            });
        }

        if (!totalPrecos) return null;
        console.log('[FP_CRM] Tomada viva: ' + totalPrecos + ' preços de ' + meus.length + ' produto(s) do cotador.');
        return { D: D, D2: D2, slugToId: slugToId, updatedAt: updatedAt };
    }

    // ── cards da home: só o que existe no cotador vira card ─────────────────
    async function hydrateLinhasProduto(opts) {
        var o = opts && typeof opts === 'object' ? opts : {};
        var gridId = o.gridId || 'planos-linhas-grid';
        var notaId = Object.prototype.hasOwnProperty.call(o, 'notaId') ? o.notaId : 'planos-data-nota';
        var grid = w.document.getElementById(gridId);
        var notaEl = notaId ? w.document.getElementById(notaId) : null;
        if (!grid) return;

        try {
            var dados = await loadAllPrices();
            if (!dados) return; // tomada falhou: HTML estático fica (data antiga visível na nota)

            var bloco = (dados.D['3-a-29'] || {}).comp || {};
            var html = LINHAS_RESUMO.map(function (L) {
                var precos = bloco[L.planoSlug];
                var valor = precos ? precos[0] : null;
                if (valor == null) return ''; // não está no cotador → não existe card
                return '<div class="card">' +
                    '<span class="tag ' + escapeHtml(L.tagClass) + '">' + escapeHtml(L.tag) + '</span>' +
                    '<h3>' + escapeHtml(L.titulo) + '</h3>' +
                    '<p>' + escapeHtml(L.desc) + '</p>' +
                    '<div class="preco">' + formatPreco(valor) + '</div>' +
                    '<div class="preco-detalhe">a partir de / mês ' + escapeHtml(L.acomod) + '</div>' +
                    '</div>';
            }).join('');

            if (html) grid.innerHTML = html;

            if (notaEl && dados.updatedAt) {
                notaEl.textContent =
                    'Preços referentes à faixa etária 0–18 anos, contratação compulsória, 3 a 29 vidas. Tabela atualizada em ' +
                    formatData(dados.updatedAt) + '. Conferido ao vivo em ' + hoje() +
                    '. Fonte: cotador Tabelas (CRM Saúde). Preços são mutáveis sem aviso prévio — confirme com um corretor autorizado.';
            }
        } catch (err) {
            console.error('[FP_CRM] Erro ao carregar linhas:', err);
        }
    }

    /**
     * Monta o objeto TABELA do simulador a partir de D['3-a-29'] (comp + livre).
     * (inalterada — peça pura sobre o formato D)
     */
    function buildSimuladorTabela(Dblock) {
        if (!Dblock || !Dblock['3-a-29']) return null;
        var FAIXAS_KEYS = ['0-18', '19-23', '24-28', '29-33', '34-38', '39-43', '44-48', '49-53', '54-58', '59+'];
        var SLUG_SIM = {
            'saude_mais': ['saude-mais-enf', 'saude-mais-quarto'],
            'efetivo': ['efetivo-enf', 'efetivo-quarto'],
            'nacional': ['nacional-iii-quarto', null],
            'nacional_plus': ['nacional-plus-4-quarto', null],
            'premium': ['premium-6-quarto', null]
        };
        function buildFaixaObj(arr) {
            if (!arr || arr.length < 10) return null;
            var obj = {};
            for (var i = 0; i < 10; i++) {
                if (arr[i] == null) return null;
                obj[FAIXAS_KEYS[i]] = arr[i];
            }
            return obj;
        }
        var vidas = '3-a-29';
        var newTab = { compulsoria: { enfermaria: {}, apartamento: {} }, livre: { enfermaria: {}, apartamento: {} } };
        ['comp', 'livre'].forEach(function (adesao) {
            var adesaoSim = adesao === 'comp' ? 'compulsoria' : 'livre';
            var slice = Dblock[vidas][adesao];
            if (!slice) return;
            Object.keys(SLUG_SIM).forEach(function (simKey) {
                var pair = SLUG_SIM[simKey];
                var slugEnf = pair[0];
                var slugApt = pair[1];
                var enfArr = slugEnf ? slice[slugEnf] : null;
                var aptArr = slugApt ? slice[slugApt] : null;
                var isEnfOnly = slugEnf && slugEnf.indexOf('-enf') !== -1;
                var isAptOnly = !slugApt;
                if (isEnfOnly && enfArr) {
                    newTab[adesaoSim].enfermaria[simKey] = buildFaixaObj(enfArr);
                } else {
                    newTab[adesaoSim].enfermaria[simKey] = null;
                }
                if (slugApt && aptArr) {
                    newTab[adesaoSim].apartamento[simKey] = buildFaixaObj(aptArr);
                } else if (!isAptOnly && slugEnf && enfArr && slugEnf.indexOf('-quarto') !== -1) {
                    newTab[adesaoSim].apartamento[simKey] = buildFaixaObj(enfArr);
                } else if (isAptOnly && enfArr && slugEnf && slugEnf.indexOf('-quarto') !== -1) {
                    newTab[adesaoSim].apartamento[simKey] = buildFaixaObj(enfArr);
                } else {
                    newTab[adesaoSim].apartamento[simKey] = null;
                }
            });
        });
        return newTab;
    }

    // ── selinho do rodapé: mostra se o site está LIGADO no cotador ─────────
    // Verde aceso = a tomada respondeu AGORA (dados ao vivo, em dia).
    // Cinza = tomada não respondeu; a página segue com a última publicação.
    function selinhoRodape(dados) {
        try {
            var alvo = w.document.querySelector('footer .footer-bottom') || w.document.querySelector('footer');
            if (!alvo || w.document.getElementById('fp-selinho')) return;
            var on = !!dados;
            var pill = w.document.createElement('div');
            pill.id = 'fp-selinho';
            pill.setAttribute('title', on
                ? 'Preços conferidos ao vivo na fonte oficial agora'
                : 'Mostrando a última publicação — nova conferência ao recarregar');
            pill.style.cssText = 'display:inline-flex;align-items:center;gap:7px;margin:14px auto 0;' +
                'padding:5px 14px;border-radius:99px;font-size:12px;line-height:1;' +
                'border:1px solid rgba(128,128,128,.35);opacity:.9;';
            var dot = '<span style="width:8px;height:8px;border-radius:50%;display:inline-block;' +
                'background:' + (on ? '#22c55e;box-shadow:0 0 6px #22c55e' : '#9ca3af') + ';"></span>';
            var texto = on
                ? 'Tabelas e dados em dia — ao vivo' + (dados.updatedAt ? ' · preços de ' + formatData(dados.updatedAt) : '')
                : 'Tabelas e dados da última publicação';
            pill.innerHTML = dot + '<span>' + texto + '</span>';
            var wrap = w.document.createElement('div');
            wrap.style.textAlign = 'center';
            wrap.appendChild(pill);
            alvo.appendChild(wrap);
        } catch (_) { /* selinho nunca pode quebrar a página */ }
    }

    // acende sozinho em qualquer página que carregue este script
    function acenderSelinho() {
        loadAllPrices().then(selinhoRodape, function () { selinhoRodape(null); });
    }
    if (w.document && w.document.readyState !== 'loading') acenderSelinho();
    else if (w.document) w.document.addEventListener('DOMContentLoaded', acenderSelinho);

    w.FP_CRM = {
        VIVO_BASE: VIVO_BASE,
        vivoGet: vivoGet,
        hydrateLinhasProduto: hydrateLinhasProduto,
        loadAllPrices: loadAllPrices,
        buildSimuladorTabela: buildSimuladorTabela,
        formatData: formatData,
        hoje: hoje
    };
})(typeof window !== 'undefined' ? window : globalThis);
