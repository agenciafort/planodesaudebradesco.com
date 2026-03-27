/**
 * Integração com Supabase — tabelas de preços Bradesco Saúde
 *
 * Lê operadoras, planos e preços direto do Supabase (projeto crmsaude).
 * Funções: hydrateLinhasProduto (home), loadAllPrices (tabela/simulador).
 * Se a API falhar, o HTML estático permanece (fallback).
 */
(function (w) {
    'use strict';

    var SUPABASE_URL = 'https://flkyyghkhjcfzmpnkpbg.supabase.co';
    var SUPABASE_ANON_KEY =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsa3l5Z2hraGpjZnptcG5rcGJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1OTA5OTIsImV4cCI6MjA4ODE2Njk5Mn0.OyJkR9Qp5R31qT8IovZjcr3-o7Rtd3BjErRDv53Q-DI';

    var BRADESCO_OPERADORA_ID = 7;

    var LINHAS_RESUMO = [
        { tag: 'Regional', tagClass: 'tag-regional', titulo: 'Saúde +', planoSlug: 'saude-mais-enf', acomod: '(enf.)', desc: 'Capital, Grande São Paulo e Baixada Santista.' },
        { tag: 'Nacional', tagClass: 'tag-nacional', titulo: 'Efetivo', planoSlug: 'efetivo-enf', acomod: '(enf.)', desc: 'Cobertura nacional. Enfermaria e apartamento. Linha mais acessível.' },
        { tag: 'Nacional', tagClass: 'tag-nacional', titulo: 'Nacional', planoSlug: 'nacional-iii-quarto', acomod: '(apto.)', desc: 'Rede ampliada, apartamento. Várias faixas de reembolso.' },
        { tag: 'Premium', tagClass: 'tag-premium', titulo: 'Nacional Plus', planoSlug: 'nacional-plus-4-quarto', acomod: '', desc: 'Rede premium, reembolso amplo. Hospitais de referência nacional.' },
        { tag: 'Ultra Premium', tagClass: 'tag-premium', titulo: 'Premium', planoSlug: 'premium-6-quarto', acomod: '', desc: 'O melhor plano: Einstein, Sírio-Libanês. Reembolso completo.' }
    ];

    // tabela_id → { vidas, adesao, copart }
    // Grupo A (planos 50/414-422: efetivo, saude+, nacional II/III)
    // Grupo B (planos 408-413: nac plus, premium) — tabela_ids diferentes
    var TABELA_MAP = {
        // Grupo A — sem copart
        77: { vidas: '3-a-29', adesao: 'comp', copart: 'sem' },
        76: { vidas: '3-a-29', adesao: 'livre', copart: 'sem' },
        81: { vidas: '4-a-6', adesao: 'comp', copart: 'sem' },
        80: { vidas: '4-a-6', adesao: 'livre', copart: 'sem' },
        85: { vidas: '7-a-29', adesao: 'comp', copart: 'sem' },
        84: { vidas: '7-a-29', adesao: 'livre', copart: 'sem' },
        89: { vidas: '30-a-99', adesao: 'comp', copart: 'sem' },
        88: { vidas: '30-a-99', adesao: 'livre', copart: 'sem' },
        // Grupo A — copart 30%
        79: { vidas: '3-a-29', adesao: 'comp', copart: 'completa30' },
        78: { vidas: '3-a-29', adesao: 'livre', copart: 'completa30' },
        83: { vidas: '4-a-6', adesao: 'comp', copart: 'completa30' },
        82: { vidas: '4-a-6', adesao: 'livre', copart: 'completa30' },
        87: { vidas: '7-a-29', adesao: 'comp', copart: 'completa30' },
        86: { vidas: '7-a-29', adesao: 'livre', copart: 'completa30' },
        91: { vidas: '30-a-99', adesao: 'comp', copart: 'completa30' },
        90: { vidas: '30-a-99', adesao: 'livre', copart: 'completa30' },
        // Grupo B (nac plus / premium) — sem copart
        60: { vidas: '3-a-29', adesao: 'comp', copart: 'sem' },
        62: { vidas: '3-a-29', adesao: 'livre', copart: 'sem' },
        64: { vidas: '4-a-6', adesao: 'comp', copart: 'sem' },
        66: { vidas: '4-a-6', adesao: 'livre', copart: 'sem' },
        68: { vidas: '7-a-29', adesao: 'comp', copart: 'sem' },
        70: { vidas: '7-a-29', adesao: 'livre', copart: 'sem' },
        72: { vidas: '30-a-99', adesao: 'comp', copart: 'sem' },
        74: { vidas: '30-a-99', adesao: 'livre', copart: 'sem' },
        // Grupo B — copart 30% (ordem invertida: livre primeiro)
        92: { vidas: '3-a-29', adesao: 'livre', copart: 'completa30' },
        93: { vidas: '3-a-29', adesao: 'comp', copart: 'completa30' },
        94: { vidas: '4-a-6', adesao: 'livre', copart: 'completa30' },
        95: { vidas: '4-a-6', adesao: 'comp', copart: 'completa30' },
        96: { vidas: '7-a-29', adesao: 'livre', copart: 'completa30' },
        97: { vidas: '7-a-29', adesao: 'comp', copart: 'completa30' },
        98: { vidas: '30-a-99', adesao: 'livre', copart: 'completa30' },
        99: { vidas: '30-a-99', adesao: 'comp', copart: 'completa30' }
    };

    var TABELA_IDS = Object.keys(TABELA_MAP).map(Number);

    // slug do site → slug do Supabase
    // IDs 408-422 usam slugs iguais ao site; ID 50 (efetivo-enf) também
    var SLUG_MAP = {
        'efetivo-enf': 'efetivo-enf',
        'efetivo-quarto': 'efetivo-quarto',
        'efetivo-plus-enf': 'efetivo-plus-enf',
        'efetivo-plus-quarto': 'efetivo-plus-quarto',
        'saude-mais-enf': 'saude-mais-enf',
        'saude-mais-quarto': 'saude-mais-quarto',
        'nacional-ii-enf': 'nacional-ii-enf',
        'nacional-iii-quarto': 'nacional-iii-quarto',
        'nacional-iii-2-quarto': 'nacional-iii-2-quarto',
        'nacional-iii-3-quarto': 'nacional-iii-3-quarto',
        'nacional-plus-4-quarto': 'nacional-plus-4-quarto',
        'nacional-plus-6-quarto': 'nacional-plus-6-quarto',
        'nacional-plus-8-quarto': 'nacional-plus-8-quarto',
        'premium-6-quarto': 'premium-6-quarto',
        'premium-8-quarto': 'premium-8-quarto',
        'premium-10-quarto': 'premium-10-quarto'
    };

    function restGet(table, params) {
        var qs = Object.keys(params || {}).map(function (k) {
            return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
        }).join('&');
        var url = SUPABASE_URL + '/rest/v1/' + table + (qs ? '?' + qs : '');
        return fetch(url, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Accept': 'application/json' }
        }).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        });
    }

    function restGetAll(table, params) {
        var PAGE = 1000;
        var all = [];
        function fetchPage(offset) {
            var p = {};
            Object.keys(params || {}).forEach(function (k) { p[k] = params[k]; });
            p.limit = String(PAGE);
            p.offset = String(offset);
            return restGet(table, p)
                .then(function (rows) {
                    if (!rows || !rows.length) return all;
                    all = all.concat(rows);
                    if (rows.length < PAGE) return all;
                    return fetchPage(offset + PAGE);
                });
        }
        return fetchPage(0);
    }

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

    async function hydrateLinhasProduto(opts) {
        var o = opts && typeof opts === 'object' ? opts : {};
        var gridId = o.gridId || 'planos-linhas-grid';
        var notaId = Object.prototype.hasOwnProperty.call(o, 'notaId') ? o.notaId : 'planos-data-nota';
        var grid = w.document.getElementById(gridId);
        var notaEl = notaId ? w.document.getElementById(notaId) : null;
        if (!grid) return;

        try {
            var planos = await restGet('planos', {
                select: 'id,slug,nome',
                operadora_id: 'eq.' + BRADESCO_OPERADORA_ID
            });
            if (!planos || !planos.length) return;

            var slugToId = {};
            planos.forEach(function (p) {
                if (SLUG_MAP[p.slug]) slugToId[p.slug] = p.id;
            });

            var planoIds = LINHAS_RESUMO.map(function (L) { return slugToId[L.planoSlug]; }).filter(Boolean);
            if (!planoIds.length) return;

            // Buscar preço faixa 1 comp sem-copart para cada plano
            // Grupo A usa tabela 77, Grupo B usa tabela 60
            var precosA = await restGet('precos', {
                select: 'plano_id,preco',
                faixa_id: 'eq.1',
                tabela_id: 'eq.77',
                plano_id: 'in.(' + planoIds.join(',') + ')'
            });
            var precosB = await restGet('precos', {
                select: 'plano_id,preco',
                faixa_id: 'eq.1',
                tabela_id: 'eq.60',
                plano_id: 'in.(' + planoIds.join(',') + ')'
            });

            var allPrecos = (precosA || []).concat(precosB || []);
            if (!allPrecos.length) return;

            var precoMap = {};
            allPrecos.forEach(function (p) { precoMap[p.plano_id] = p.preco; });

            var operadora = await restGet('operadoras', {
                select: 'updated_at',
                id: 'eq.' + BRADESCO_OPERADORA_ID
            });

            var html = LINHAS_RESUMO.map(function (L) {
                var pid = slugToId[L.planoSlug];
                var valor = precoMap[pid];
                if (valor == null) return '';
                return '<div class="card">' +
                    '<span class="tag ' + escapeHtml(L.tagClass) + '">' + escapeHtml(L.tag) + '</span>' +
                    '<h3>' + escapeHtml(L.titulo) + '</h3>' +
                    '<p>' + escapeHtml(L.desc) + '</p>' +
                    '<div class="preco">' + formatPreco(valor) + '</div>' +
                    '<div class="preco-detalhe">a partir de / mês ' + escapeHtml(L.acomod) + '</div>' +
                    '</div>';
            }).join('');

            if (html) grid.innerHTML = html;

            if (notaEl && operadora && operadora[0] && operadora[0].updated_at) {
                var dataAtual = formatData(operadora[0].updated_at);
                notaEl.textContent =
                    'Preços referentes à faixa etária 0–18 anos, contratação compulsória, 3 a 29 vidas. Tabela atualizada em ' + dataAtual + '. Conferido em ' + hoje() + '. Fonte: CRM Saúde. Preços são mutáveis sem aviso prévio — confirme com um corretor autorizado.';
            }
        } catch (err) {
            console.error('[FP_CRM] Erro ao carregar linhas:', err);
        }
    }

    /**
     * Monta o objeto TABELA do simulador a partir de D['3-a-29'] (comp + livre).
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

    /**
     * Carrega TODOS os preços do Supabase e monta as estruturas D e D2
     * no mesmo formato usado pelas páginas tabela-de-precos e simulador.
     * Retorna { D, D2, slugToId, updatedAt } ou null em caso de erro.
     */
    async function loadAllPrices() {
        try {
            var planos = await restGet('planos', {
                select: 'id,slug,nome',
                operadora_id: 'eq.' + BRADESCO_OPERADORA_ID
            });
            if (!planos || !planos.length) return null;

            planos.sort(function (a, b) { return b.id - a.id; });

            var slugToId = {};
            var idToSlug = {};
            planos.forEach(function (p) {
                if (!SLUG_MAP[p.slug]) return;
                if (slugToId[p.slug] != null) return;
                slugToId[p.slug] = p.id;
                idToSlug[p.id] = p.slug;
            });

            var planoIds = Object.values(slugToId);
            if (!planoIds.length) return null;

            var allPrecos = await restGetAll('precos', {
                select: 'tabela_id,plano_id,faixa_id,preco',
                tabela_id: 'in.(' + TABELA_IDS.join(',') + ')',
                plano_id: 'in.(' + planoIds.join(',') + ')',
                order: 'tabela_id.asc,plano_id.asc,faixa_id.asc'
            });
            if (!allPrecos || !allPrecos.length) return null;

            var D = {};
            var D2 = {};

            allPrecos.forEach(function (row) {
                var meta = TABELA_MAP[row.tabela_id];
                if (!meta) return;
                var slug = idToSlug[row.plano_id];
                if (!slug) return;

                var target = meta.copart === 'completa30' ? D2 : D;
                if (!target[meta.vidas]) target[meta.vidas] = {};
                if (!target[meta.vidas][meta.adesao]) target[meta.vidas][meta.adesao] = {};
                if (!target[meta.vidas][meta.adesao][slug]) target[meta.vidas][meta.adesao][slug] = [];

                target[meta.vidas][meta.adesao][slug][row.faixa_id - 1] = row.preco;
            });

            var operadora = await restGet('operadoras', {
                select: 'updated_at',
                id: 'eq.' + BRADESCO_OPERADORA_ID
            });

            var updatedAt = (operadora && operadora[0]) ? operadora[0].updated_at : null;

            return { D: D, D2: D2, slugToId: slugToId, updatedAt: updatedAt };
        } catch (err) {
            console.error('[FP_CRM] Erro ao carregar preços completos:', err);
            return null;
        }
    }

    w.FP_CRM = {
        SUPABASE_URL: SUPABASE_URL,
        restGet: restGet,
        hydrateLinhasProduto: hydrateLinhasProduto,
        loadAllPrices: loadAllPrices,
        buildSimuladorTabela: buildSimuladorTabela,
        formatData: formatData,
        hoje: hoje,
        TABELA_MAP: TABELA_MAP
    };
})(typeof window !== 'undefined' ? window : globalThis);
