exports.handler = async (event) => {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'ASAAS_API_KEY não configurada nas variáveis de ambiente do Netlify.' }),
    };
  }

  const { startDate, finishDate, offset = '0', limit = '100' } = event.queryStringParameters || {};

  if (!startDate || !finishDate) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: 'Parâmetros startDate e finishDate são obrigatórios.' }),
    };
  }

  const url = new URL('https://api.asaas.com/v3/financialTransactions');
  url.searchParams.set('startDate', startDate);
  url.searchParams.set('finishDate', finishDate);
  url.searchParams.set('offset', offset);
  url.searchParams.set('limit', limit);

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'PrumaFinanceiro/1.0',
      },
    });

    const data = await res.json();

    return {
      statusCode: res.status,
      headers: CORS,
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ error: `Erro ao chamar Asaas: ${err.message}` }),
    };
  }
};
