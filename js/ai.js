const requestsByIp = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 15;
const MAX_MESSAGES = 12;
const MAX_INPUT_CHARS = 12_000;
const QUICK_MODEL = 'gemini-3.5-flash-lite';
const DEFAULT_MODEL = 'gemini-3.8-flash';

function reply(res, status, body) {
  res.setHeader('cache-control', 'no-store');
  return res.status(status).json(body);
}

function rateLimited(ip) {
  const now = Date.now();
  let entry = requestsByIp.get(ip);
  if (!entry || now - entry.start >= WINDOW_MS) {
    entry = { start: now, count: 0 };
    requestsByIp.set(ip, entry);
  }
  entry.count++;
  if (requestsByIp.size > 2_000) {
    for (const [key, value] of requestsByIp) {
      if (now - value.start >= WINDOW_MS) requestsByIp.delete(key);
    }
  }
  return entry.count > MAX_REQUESTS_PER_WINDOW;
}

function normalizeMessages(input) {
  const messages = typeof input === 'string' ? [{ role: 'user', content: input }] : input;
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > MAX_MESSAGES) return null;
  let totalChars = 0;
  for (const message of messages) {
    if (!message || !['user', 'assistant'].includes(message.role) || typeof message.content !== 'string') return null;
    totalChars += message.content.length;
    if (totalChars > MAX_INPUT_CHARS) return null;
  }
  return messages;
}

async function requestGemini(messages, model, apiKey) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify({
      contents: messages.map(message => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }]
      }))
    }),
    signal: AbortSignal.timeout(45_000)
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('allow', 'POST');
    return reply(res, 405, { error: { code: 'method_not_allowed', message: 'Use POST.' } });
  }

  const origin = req.headers.origin;
  if (origin) {
    try {
      if (new URL(origin).host !== req.headers.host) {
        return reply(res, 403, { error: { code: 'origin_denied', message: 'Request origin not allowed.' } });
      }
    } catch {
      return reply(res, 403, { error: { code: 'origin_denied', message: 'Request origin not allowed.' } });
    }
  }

  const ip = req.ip || req.headers['x-real-ip'] || req.headers['x-forwarded-for']?.split(',').pop()?.trim() || 'unknown';
  if (rateLimited(ip)) {
    return reply(res, 429, { error: { code: 'rate_limited', message: 'Too many requests. Try again in a minute.' } });
  }

  const messages = normalizeMessages(req.body?.input);
  if (!messages) {
    return reply(res, 400, { error: { code: 'invalid_request', message: 'The prompt is empty or too large.' } });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return reply(res, 503, { error: { code: 'not_configured', message: 'The app AI service is not configured yet.' } });
  }

  const model = req.body.modelTier === 'quick'
    ? QUICK_MODEL
    : process.env.GEMINI_MODEL || DEFAULT_MODEL;

  try {
    let result = await requestGemini(messages, model, apiKey);
    let fallbackUsed = false;
    if (model !== QUICK_MODEL && result.response.status === 503 && /high demand|overload|temporarily unavailable/i.test(result.data?.error?.message || '')) {
      result = await requestGemini(messages, QUICK_MODEL, apiKey);
      fallbackUsed = true;
    }

    if (!result.response.ok) {
      const status = result.response.status === 401 || result.response.status === 403
        ? 502
        : result.response.status === 429
          ? 429
          : 502;
      const code = result.response.status === 429 ? 'rate_limited' : 'upstream_error';
      const detail = String(result.data?.error?.message || 'Gemini request failed.').slice(0, 240);
      return reply(res, status, { error: { code, message: detail } });
    }

    const text = result.data?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || '';
    if (!text) {
      return reply(res, 502, { error: { code: 'empty_response', message: 'Gemini returned an empty response.' } });
    }
    return reply(res, 200, { text, fallbackUsed });
  } catch (error) {
    const timedOut = error?.name === 'TimeoutError';
    return reply(res, timedOut ? 504 : 502, {
      error: {
        code: timedOut ? 'timeout' : 'upstream_error',
        message: timedOut ? 'The AI request took too long. Try again.' : 'Could not reach Gemini.'
      }
    });
  }
};
