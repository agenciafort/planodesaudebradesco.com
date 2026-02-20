// ============================================================
// FortPlanos — Cloudflare Worker: API Bradesco Saúde
// ============================================================
// Endpoints disponíveis:
//   GET /api/v1/operadora   → Informações da operadora
//   GET /api/v1/planos      → Lista de planos
//   GET /api/v1/tabelas     → Tabelas de preços por faixa etária
//   GET /api/v1/hospitais   → Rede credenciada de hospitais
//   GET /api/v1/contato     → Informações de contato
//
// CONFIGURAÇÃO NO CLOUDFLARE:
// 1. Workers & Pages → Criar/Editar Worker
// 2. Cole este código no editor
// 3. Em Settings > Variables, adicione:
//    - API_KEY = fp_live_7kX9mR2pQ4wB8nF3jL6vC5dT1yH0
//    - ALLOWED_DOMAINS = planodesaudebradesco.com,fortplanos.com.br
// 4. Clique "Save and Deploy"
// ============================================================

// ── DADOS DA API ──

const OPERADORA = {
  nome: "Bradesco Saúde",
  razao_social: "Bradesco Saúde S.A.",
  cnpj: "92.693.118/0001-60",
  registro_ans: "005711",
  tipo: "Operadora de Plano de Saúde",
  segmento: "Seguradora Especializada em Saúde",
  abrangencia: "Nacional",
  fundacao: "1984",
  site_oficial: "https://www.bradescosaude.com.br",
  central_atendimento: "0800 727 9966",
  sac: "0800 727 7788",
  ouvidoria: "0800 727 9955",
  descricao: "A Bradesco Saúde é uma das maiores operadoras de planos de saúde do Brasil, pertencente ao Grupo Bradesco Seguros. Oferece planos individuais, familiares e empresariais com ampla rede credenciada em todo o território nacional."
};

const PLANOS = [
  {
    id: 1,
    nome: "Bradesco Saúde Nacional Flex",
    tipo: "Ambulatorial + Hospitalar com Obstetrícia",
    segmentacao: "Individual/Familiar",
    abrangencia: "Nacional",
    acomodacao: "Enfermaria",
    coparticipacao: true,
    registro_ans: "480.938/18-1",
    carencias: {
      urgencia_emergencia: "24 horas",
      consultas_exames: "180 dias",
      internacoes: "180 dias",
      parto: "300 dias",
      doencas_preexistentes: "24 meses"
    },
    coberturas: [
      "Consultas médicas em todas as especialidades",
      "Exames laboratoriais e de imagem",
      "Internações hospitalares",
      "Cirurgias",
      "Atendimento obstétrico",
      "Urgência e emergência 24h",
      "Fisioterapia",
      "Psicologia",
      "Nutrição"
    ],
    diferenciais: [
      "Rede nacional de hospitais",
      "Aplicativo Bradesco Saúde",
      "Telemedicina 24h",
      "Programa de Saúde Preventiva"
    ]
  },
  {
    id: 2,
    nome: "Bradesco Saúde Nacional Flex",
    tipo: "Ambulatorial + Hospitalar com Obstetrícia",
    segmentacao: "Individual/Familiar",
    abrangencia: "Nacional",
    acomodacao: "Apartamento",
    coparticipacao: true,
    registro_ans: "480.939/18-9",
    carencias: {
      urgencia_emergencia: "24 horas",
      consultas_exames: "180 dias",
      internacoes: "180 dias",
      parto: "300 dias",
      doencas_preexistentes: "24 meses"
    },
    coberturas: [
      "Consultas médicas em todas as especialidades",
      "Exames laboratoriais e de imagem",
      "Internações em apartamento individual",
      "Cirurgias",
      "Atendimento obstétrico",
      "Urgência e emergência 24h",
      "Fisioterapia",
      "Psicologia",
      "Nutrição",
      "Acompanhante em internações"
    ],
    diferenciais: [
      "Internação em apartamento individual",
      "Rede nacional premium de hospitais",
      "Aplicativo Bradesco Saúde",
      "Telemedicina 24h",
      "Programa de Saúde Preventiva"
    ]
  },
  {
    id: 3,
    nome: "Bradesco Saúde Empresarial",
    tipo: "Ambulatorial + Hospitalar com Obstetrícia",
    segmentacao: "Empresarial (PME)",
    abrangencia: "Nacional",
    acomodacao: "Enfermaria",
    coparticipacao: false,
    registro_ans: "480.940/18-2",
    carencias: {
      urgencia_emergencia: "24 horas",
      consultas_exames: "Isento (a partir de 30 vidas)",
      internacoes: "Isento (a partir de 30 vidas)",
      parto: "300 dias",
      doencas_preexistentes: "24 meses"
    },
    coberturas: [
      "Consultas médicas em todas as especialidades",
      "Exames laboratoriais e de imagem",
      "Internações hospitalares",
      "Cirurgias",
      "Atendimento obstétrico",
      "Urgência e emergência 24h",
      "Fisioterapia",
      "Psicologia",
      "Nutrição"
    ],
    diferenciais: [
      "Sem coparticipação",
      "Carências reduzidas para grupos",
      "Gestão de saúde empresarial",
      "Aplicativo Bradesco Saúde",
      "Telemedicina 24h"
    ]
  },
  {
    id: 4,
    nome: "Bradesco Saúde Empresarial",
    tipo: "Ambulatorial + Hospitalar com Obstetrícia",
    segmentacao: "Empresarial (PME)",
    abrangencia: "Nacional",
    acomodacao: "Apartamento",
    coparticipacao: false,
    registro_ans: "480.941/18-0",
    carencias: {
      urgencia_emergencia: "24 horas",
      consultas_exames: "Isento (a partir de 30 vidas)",
      internacoes: "Isento (a partir de 30 vidas)",
      parto: "300 dias",
      doencas_preexistentes: "24 meses"
    },
    coberturas: [
      "Consultas médicas em todas as especialidades",
      "Exames laboratoriais e de imagem",
      "Internações em apartamento individual",
      "Cirurgias",
      "Atendimento obstétrico",
      "Urgência e emergência 24h",
      "Fisioterapia",
      "Psicologia",
      "Nutrição",
      "Acompanhante em internações"
    ],
    diferenciais: [
      "Internação em apartamento individual",
      "Sem coparticipação",
      "Carências reduzidas para grupos",
      "Gestão de saúde empresarial",
      "Aplicativo Bradesco Saúde",
      "Telemedicina 24h"
    ]
  },
  {
    id: 5,
    nome: "Bradesco Saúde Top Nacional",
    tipo: "Ambulatorial + Hospitalar com Obstetrícia",
    segmentacao: "Individual/Familiar",
    abrangencia: "Nacional",
    acomodacao: "Apartamento",
    coparticipacao: false,
    registro_ans: "480.942/18-8",
    carencias: {
      urgencia_emergencia: "24 horas",
      consultas_exames: "180 dias",
      internacoes: "180 dias",
      parto: "300 dias",
      doencas_preexistentes: "24 meses"
    },
    coberturas: [
      "Consultas médicas em todas as especialidades",
      "Exames laboratoriais e de imagem",
      "Internações em apartamento individual",
      "Cirurgias com equipe médica inclusa",
      "Atendimento obstétrico",
      "Urgência e emergência 24h",
      "Fisioterapia",
      "Psicologia",
      "Nutrição",
      "Fonoaudiologia",
      "Terapia ocupacional",
      "Acompanhante em internações",
      "Reembolso de despesas médicas"
    ],
    diferenciais: [
      "Plano premium sem coparticipação",
      "Rede Top de hospitais",
      "Reembolso de consultas e exames",
      "Cobertura internacional (emergência)",
      "Concierge de saúde",
      "Aplicativo Bradesco Saúde",
      "Telemedicina 24h"
    ]
  }
];

const TABELAS_PRECOS = [
  {
    plano_id: 1,
    plano_nome: "Bradesco Saúde Nacional Flex - Enfermaria",
    vigencia: "2025/2026",
    faixas: [
      { faixa_etaria: "0 a 18 anos", valor: 389.90 },
      { faixa_etaria: "19 a 23 anos", valor: 489.90 },
      { faixa_etaria: "24 a 28 anos", valor: 548.90 },
      { faixa_etaria: "29 a 33 anos", valor: 619.90 },
      { faixa_etaria: "34 a 38 anos", valor: 698.90 },
      { faixa_etaria: "39 a 43 anos", valor: 789.90 },
      { faixa_etaria: "44 a 48 anos", valor: 948.90 },
      { faixa_etaria: "49 a 53 anos", valor: 1189.90 },
      { faixa_etaria: "54 a 58 anos", valor: 1489.90 },
      { faixa_etaria: "59+ anos", valor: 1989.90 }
    ]
  },
  {
    plano_id: 2,
    plano_nome: "Bradesco Saúde Nacional Flex - Apartamento",
    vigencia: "2025/2026",
    faixas: [
      { faixa_etaria: "0 a 18 anos", valor: 489.90 },
      { faixa_etaria: "19 a 23 anos", valor: 598.90 },
      { faixa_etaria: "24 a 28 anos", valor: 689.90 },
      { faixa_etaria: "29 a 33 anos", valor: 789.90 },
      { faixa_etaria: "34 a 38 anos", valor: 889.90 },
      { faixa_etaria: "39 a 43 anos", valor: 998.90 },
      { faixa_etaria: "44 a 48 anos", valor: 1198.90 },
      { faixa_etaria: "49 a 53 anos", valor: 1498.90 },
      { faixa_etaria: "54 a 58 anos", valor: 1898.90 },
      { faixa_etaria: "59+ anos", valor: 2498.90 }
    ]
  },
  {
    plano_id: 3,
    plano_nome: "Bradesco Saúde Empresarial - Enfermaria",
    vigencia: "2025/2026",
    faixas: [
      { faixa_etaria: "0 a 18 anos", valor: 298.90 },
      { faixa_etaria: "19 a 23 anos", valor: 378.90 },
      { faixa_etaria: "24 a 28 anos", valor: 428.90 },
      { faixa_etaria: "29 a 33 anos", valor: 498.90 },
      { faixa_etaria: "34 a 38 anos", valor: 568.90 },
      { faixa_etaria: "39 a 43 anos", valor: 648.90 },
      { faixa_etaria: "44 a 48 anos", valor: 778.90 },
      { faixa_etaria: "49 a 53 anos", valor: 978.90 },
      { faixa_etaria: "54 a 58 anos", valor: 1248.90 },
      { faixa_etaria: "59+ anos", valor: 1648.90 }
    ]
  },
  {
    plano_id: 4,
    plano_nome: "Bradesco Saúde Empresarial - Apartamento",
    vigencia: "2025/2026",
    faixas: [
      { faixa_etaria: "0 a 18 anos", valor: 398.90 },
      { faixa_etaria: "19 a 23 anos", valor: 498.90 },
      { faixa_etaria: "24 a 28 anos", valor: 568.90 },
      { faixa_etaria: "29 a 33 anos", valor: 648.90 },
      { faixa_etaria: "34 a 38 anos", valor: 748.90 },
      { faixa_etaria: "39 a 43 anos", valor: 848.90 },
      { faixa_etaria: "44 a 48 anos", valor: 998.90 },
      { faixa_etaria: "49 a 53 anos", valor: 1248.90 },
      { faixa_etaria: "54 a 58 anos", valor: 1598.90 },
      { faixa_etaria: "59+ anos", valor: 2098.90 }
    ]
  },
  {
    plano_id: 5,
    plano_nome: "Bradesco Saúde Top Nacional - Apartamento",
    vigencia: "2025/2026",
    faixas: [
      { faixa_etaria: "0 a 18 anos", valor: 798.90 },
      { faixa_etaria: "19 a 23 anos", valor: 998.90 },
      { faixa_etaria: "24 a 28 anos", valor: 1148.90 },
      { faixa_etaria: "29 a 33 anos", valor: 1298.90 },
      { faixa_etaria: "34 a 38 anos", valor: 1498.90 },
      { faixa_etaria: "39 a 43 anos", valor: 1748.90 },
      { faixa_etaria: "44 a 48 anos", valor: 2098.90 },
      { faixa_etaria: "49 a 53 anos", valor: 2598.90 },
      { faixa_etaria: "54 a 58 anos", valor: 3298.90 },
      { faixa_etaria: "59+ anos", valor: 4398.90 }
    ]
  }
];

const HOSPITAIS = {
  total: 45,
  ultima_atualizacao: "2025-12-01",
  regioes: [
    {
      regiao: "São Paulo - Capital",
      hospitais: [
        { nome: "Hospital Albert Einstein", endereco: "Av. Albert Einstein, 627 - Morumbi", tipo: "Hospital Geral", telefone: "(11) 2151-1233", planos_aceitos: [1,2,3,4,5] },
        { nome: "Hospital Sírio-Libanês", endereco: "R. Dona Adma Jafet, 91 - Bela Vista", tipo: "Hospital Geral", telefone: "(11) 3155-0200", planos_aceitos: [5] },
        { nome: "Hospital Nove de Julho", endereco: "R. Peixoto Gomide, 625 - Cerqueira César", tipo: "Hospital Geral", telefone: "(11) 3147-9999", planos_aceitos: [1,2,3,4,5] },
        { nome: "Hospital São Luiz - Morumbi", endereco: "R. Prof. Lúcio Martins Rodrigues, 270", tipo: "Hospital Geral", telefone: "(11) 3093-1100", planos_aceitos: [1,2,3,4,5] },
        { nome: "Hospital Samaritano", endereco: "R. Conselheiro Brotero, 1486 - Higienópolis", tipo: "Hospital Geral", telefone: "(11) 3821-5300", planos_aceitos: [2,4,5] },
        { nome: "Hospital Oswaldo Cruz", endereco: "R. João Julião, 331 - Bela Vista", tipo: "Hospital Geral", telefone: "(11) 3549-0000", planos_aceitos: [1,2,3,4,5] },
        { nome: "Hospital Santa Catarina", endereco: "Av. Paulista, 200 - Bela Vista", tipo: "Hospital Geral", telefone: "(11) 3016-4133", planos_aceitos: [1,2,3,4,5] },
        { nome: "Hospital Leforte", endereco: "Av. Brasil, 899 - Jardim América", tipo: "Hospital Geral", telefone: "(11) 3345-2000", planos_aceitos: [1,2,3,4,5] }
      ]
    },
    {
      regiao: "Rio de Janeiro - Capital",
      hospitais: [
        { nome: "Hospital Copa D'Or", endereco: "R. Figueiredo Magalhães, 875 - Copacabana", tipo: "Hospital Geral", telefone: "(21) 2545-3600", planos_aceitos: [2,4,5] },
        { nome: "Hospital Barra D'Or", endereco: "Av. Ayrton Senna, 2541 - Barra da Tijuca", tipo: "Hospital Geral", telefone: "(21) 3385-6000", planos_aceitos: [1,2,3,4,5] },
        { nome: "Hospital Samaritano Botafogo", endereco: "R. Bambina, 98 - Botafogo", tipo: "Hospital Geral", telefone: "(21) 2535-4000", planos_aceitos: [1,2,3,4,5] },
        { nome: "Hospital São Lucas Copacabana", endereco: "R. Xavier da Silveira, 115 - Copacabana", tipo: "Hospital Geral", telefone: "(21) 2235-2121", planos_aceitos: [1,2,3,4,5] },
        { nome: "Hospital Rios D'Or", endereco: "R. Mariz e Barros, 775 - Tijuca", tipo: "Hospital Geral", telefone: "(21) 2178-6000", planos_aceitos: [1,2,3,4,5] }
      ]
    },
    {
      regiao: "Minas Gerais",
      hospitais: [
        { nome: "Hospital Mater Dei", endereco: "R. Gonçalves Dias, 2700 - Santo Agostinho, BH", tipo: "Hospital Geral", telefone: "(31) 3339-9000", planos_aceitos: [1,2,3,4,5] },
        { nome: "Hospital Vila da Serra", endereco: "R. Alfredo Balena, 190 - Nova Lima", tipo: "Hospital Geral", telefone: "(31) 3228-8100", planos_aceitos: [1,2,3,4,5] },
        { nome: "Hospital Biocor", endereco: "R. da Paisagem, 220 - Nova Lima", tipo: "Hospital Geral", telefone: "(31) 3289-5200", planos_aceitos: [2,4,5] }
      ]
    },
    {
      regiao: "Paraná",
      hospitais: [
        { nome: "Hospital Nossa Senhora das Graças", endereco: "R. Alcides Munhoz, 433 - Curitiba", tipo: "Hospital Geral", telefone: "(41) 3240-6000", planos_aceitos: [1,2,3,4,5] },
        { nome: "Hospital Marcelino Champagnat", endereco: "Av. Pres. Affonso Camargo, 1399 - Curitiba", tipo: "Hospital Geral", telefone: "(41) 3092-5000", planos_aceitos: [1,2,3,4,5] }
      ]
    },
    {
      regiao: "Bahia",
      hospitais: [
        { nome: "Hospital da Bahia", endereco: "Av. Prof. Magalhães Neto, 1541 - Salvador", tipo: "Hospital Geral", telefone: "(71) 3276-8000", planos_aceitos: [1,2,3,4,5] },
        { nome: "Hospital Aliança", endereco: "Av. Juracy Magalhães Jr, 2096 - Salvador", tipo: "Hospital Geral", telefone: "(71) 2108-5600", planos_aceitos: [1,2,3,4,5] }
      ]
    },
    {
      regiao: "Rio Grande do Sul",
      hospitais: [
        { nome: "Hospital Moinhos de Vento", endereco: "R. Ramiro Barcelos, 910 - Porto Alegre", tipo: "Hospital Geral", telefone: "(51) 3314-3434", planos_aceitos: [2,4,5] },
        { nome: "Hospital Mãe de Deus", endereco: "R. José de Alencar, 286 - Porto Alegre", tipo: "Hospital Geral", telefone: "(51) 3230-2110", planos_aceitos: [1,2,3,4,5] }
      ]
    },
    {
      regiao: "Distrito Federal",
      hospitais: [
        { nome: "Hospital Santa Lúcia", endereco: "SHLS 716 - Asa Sul, Brasília", tipo: "Hospital Geral", telefone: "(61) 3445-0000", planos_aceitos: [1,2,3,4,5] },
        { nome: "Hospital Santa Helena", endereco: "SHL Norte 516 - Asa Norte, Brasília", tipo: "Hospital Geral", telefone: "(61) 3213-6000", planos_aceitos: [1,2,3,4,5] }
      ]
    }
  ]
};

const CONTATO = {
  empresa: "FortPlanos - Consultoria em Planos de Saúde",
  telefone: "(15) 99999-0000",
  whatsapp: "https://wa.me/5515999990000",
  email: "contato@fortplanos.com.br",
  site: "https://planodesaudebradesco.com",
  horario_atendimento: "Segunda a Sexta, das 8h às 18h",
  endereco: "Sorocaba - SP",
  mensagem_cotacao: "Solicite sua cotação gratuita e sem compromisso! Nossos consultores especializados encontram o melhor plano Bradesco Saúde para você, sua família ou sua empresa."
};

// ── WORKER ──

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ── CORS preflight ──
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request, env)
      });
    }

    // ── Só aceitar GET ──
    if (request.method !== 'GET') {
      return jsonResponse({ error: true, message: 'Método não permitido.' }, 405, request, env);
    }

    // ── Rota raiz ──
    if (path === '/' || path === '') {
      return jsonResponse({
        api: "FortPlanos API - Bradesco Saúde",
        versao: "1.0.0",
        endpoints: [
          "GET /api/v1/operadora",
          "GET /api/v1/planos",
          "GET /api/v1/planos/:id",
          "GET /api/v1/tabelas",
          "GET /api/v1/tabelas/:plano_id",
          "GET /api/v1/hospitais",
          "GET /api/v1/hospitais?regiao=São Paulo",
          "GET /api/v1/contato"
        ],
        autenticacao: "Header X-API-Key obrigatório"
      }, 200, request, env);
    }

    // ── Verificar autenticação para /api/v1/* ──
    if (path.startsWith('/api/v1/')) {
      const apiKey = request.headers.get('X-API-Key');
      const referer = request.headers.get('Referer') || '';
      const origin = request.headers.get('Origin') || '';
      const allowedDomains = (env.ALLOWED_DOMAINS || 'planodesaudebradesco.com,fortplanos.com.br')
        .split(',').map(d => d.trim().toLowerCase());

      const isValidKey = apiKey && env.API_KEY && apiKey === env.API_KEY;
      const isAllowedDomain = allowedDomains.some(d =>
        referer.toLowerCase().includes(d) || origin.toLowerCase().includes(d)
      );

      if (!isValidKey && !isAllowedDomain) {
        return jsonResponse({
          error: true,
          message: 'Acesso negado. Chave de API inválida ou domínio não autorizado.'
        }, 403, request, env);
      }

      // ── Rotas da API ──
      if (path === '/api/v1/operadora') {
        return jsonResponse({ success: true, data: OPERADORA }, 200, request, env);
      }

      if (path === '/api/v1/planos') {
        return jsonResponse({ success: true, total: PLANOS.length, data: PLANOS }, 200, request, env);
      }

      const planoMatch = path.match(/^\/api\/v1\/planos\/(\d+)$/);
      if (planoMatch) {
        const plano = PLANOS.find(p => p.id === parseInt(planoMatch[1]));
        if (!plano) return jsonResponse({ error: true, message: 'Plano não encontrado.' }, 404, request, env);
        return jsonResponse({ success: true, data: plano }, 200, request, env);
      }

      if (path === '/api/v1/tabelas') {
        return jsonResponse({ success: true, total: TABELAS_PRECOS.length, data: TABELAS_PRECOS }, 200, request, env);
      }

      const tabelaMatch = path.match(/^\/api\/v1\/tabelas\/(\d+)$/);
      if (tabelaMatch) {
        const tabela = TABELAS_PRECOS.find(t => t.plano_id === parseInt(tabelaMatch[1]));
        if (!tabela) return jsonResponse({ error: true, message: 'Tabela não encontrada para este plano.' }, 404, request, env);
        return jsonResponse({ success: true, data: tabela }, 200, request, env);
      }

      if (path === '/api/v1/hospitais') {
        const regiao = url.searchParams.get('regiao');
        if (regiao) {
          const regiaoFiltrada = HOSPITAIS.regioes.filter(r =>
            r.regiao.toLowerCase().includes(regiao.toLowerCase())
          );
          const total = regiaoFiltrada.reduce((acc, r) => acc + r.hospitais.length, 0);
          return jsonResponse({ success: true, total, data: regiaoFiltrada }, 200, request, env);
        }
        return jsonResponse({ success: true, total: HOSPITAIS.total, ultima_atualizacao: HOSPITAIS.ultima_atualizacao, data: HOSPITAIS.regioes }, 200, request, env);
      }

      if (path === '/api/v1/contato') {
        return jsonResponse({ success: true, data: CONTATO }, 200, request, env);
      }

      return jsonResponse({ error: true, message: 'Endpoint não encontrado.' }, 404, request, env);
    }

    return jsonResponse({ error: true, message: 'Rota não encontrada.' }, 404, request, env);
  }
};

// ── Helpers ──

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowedDomains = (env.ALLOWED_DOMAINS || 'planodesaudebradesco.com,fortplanos.com.br')
    .split(',').map(d => d.trim().toLowerCase());
  const allowedOrigin = allowedDomains.some(d => origin.toLowerCase().includes(d)) ? origin : '*';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'X-API-Key, Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}

function jsonResponse(data, status, request, env) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'public, max-age=300',
    ...corsHeaders(request, env)
  };

  return new Response(JSON.stringify(data, null, 2), { status, headers });
}
