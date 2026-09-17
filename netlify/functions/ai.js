// Proxy serverless verso l'API Anthropic.
// La chiave API resta lato server (variabile d'ambiente Netlify), mai esposta al browser.
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: { message: 'Metodo non consentito' } }) };
  }
  try {
    const { prompt, webSearch } = JSON.parse(event.body || '{}');
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: { message: 'ANTHROPIC_API_KEY non configurata nelle variabili d\'ambiente del sito Netlify.' } }) };
    }
    if (!prompt || typeof prompt !== 'string') {
      return { statusCode: 400, body: JSON.stringify({ error: { message: 'Prompt mancante o non valido.' } }) };
    }

    const body = {
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    };
    if (webSearch) {
      body.tools = [{ type: 'web_search_20250305', name: 'web_search' }];
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return {
      statusCode: res.ok ? 200 : res.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: { message: e.message } }) };
  }
};
