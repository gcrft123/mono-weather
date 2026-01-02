const { Redis } = require('@upstash/redis');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',  // Change to your site's URL later for security
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const { user } = context.clientContext;
  if (!user) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const userId = user.sub;
  const key = `settings:${userId}`;

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  try {
    if (event.httpMethod === 'GET') {
      const settings = await redis.get(key);
      return { statusCode: 200, headers, body: JSON.stringify(settings || {}) };
    } else if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body);
      // Basic validation: Ensure it's an object with expected keys (e.g., homeCity)
      if (typeof body !== 'object' || body === null) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid settings' }) };
      }
      await redis.set(key, body);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    } else {
      return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }
  } catch (error) {
    console.error(error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error' }) };
  }
};
