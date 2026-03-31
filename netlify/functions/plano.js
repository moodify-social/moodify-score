const https = require('https');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = 'sk-ant-api03-...' ;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch(e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { vals: v, catScores: cs, total } = body;
  const nivel = total <= 4 ? 'Iniciante travado' : total <= 6.5 ? 'Operacional instável' : 'Creator escalável';

  const prompt = `Você é uma especialista em UGC e criação de conteúdo para marcas no Brasil.

Uma creator fez o Creator Score da Moodify. Resultado:
- Dinheiro: ${cs[0].toFixed(1)}/10 (Freq. jobs: ${v.v1a}, Ticket: ${v.v1b}, Previsibilidade: ${v.v1c})
- Execução: ${cs[1].toFixed(1)}/10 (Produtividade: ${v.v2a}, Qualidade: ${v.v2b}, Consistência: ${v.v2c})
- Resultado: ${cs[2].toFixed(1)}/10 (Retenção: ${v.v3a}, Engajamento: ${v.v3b}, Gerar ação: ${v.v3c})
- Mercado: ${cs[3].toFixed(1)}/10 (Fechamento: ${v.v4a}, Posicionamento: ${v.v4b}, Reputação: ${v.v4c})
- Score geral: ${total}/10 — Nível: ${nivel}
- Ticket por vídeo: R$250

Gere um plano de ação personalizado com essa estrutura:

1. **Diagnóstico geral** — 2-3 frases diretas sobre o momento atual, citando os números

2. **Principais gargalos** — os 2-3 subtemas mais baixos e o que isso significa na prática para o bolso dela

3. **Roteiro de 30 dias** — 3 semanas com 2-3 ações concretas cada. Direto ao ponto, sem enrolação

4. **Meta de renda** — quanto ela poderia ganhar por mês melhorando os pontos fracos, e em 3 meses seguindo o plano (use o ticket de R$250)

5. **Uma coisa para fazer hoje** — a ação mais impactante nas próximas 24h

Linguagem direta, prática, sem jargões. Como uma mentora falando de verdade. Seja específica nos números.`;

  const payload = JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1200,
    messages: [{ role: 'user', content: prompt }]
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: data
        });
      });
    });
    req.on('error', (e) => {
      resolve({ statusCode: 500, body: JSON.stringify({ error: e.message }) });
    });
    req.write(payload);
    req.end();
  });
};
