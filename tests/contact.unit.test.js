const httpMocks = require('node-mocks-http');
const contactHandler = require('../api/contact');

function runHandler(req, res) {
  return new Promise((resolve) => {
    res.on('end', () => resolve(res));
    contactHandler(req, res);
  });
}

describe('Contact API', () => {
  test('returns 400 for missing fields', async () => {
    const req = httpMocks.createRequest({ method: 'POST', body: {} });
    const res = httpMocks.createResponse({ eventEmitter: require('events').EventEmitter });
    await runHandler(req, res);
    expect(res.statusCode).toBe(400);
    const data = res._getJSONData();
    expect(data.ok).toBe(false);
  });

  test('dev-mode: logs and returns ok when SENDGRID_API_KEY not set', async () => {
    // ensure env no sendgrid key
    delete process.env.SENDGRID_API_KEY;

    const payload = { name: 'Test', email: 'test@example.com', message: 'hello' };
    const req = httpMocks.createRequest({ method: 'POST', body: payload });
    const res = httpMocks.createResponse({ eventEmitter: require('events').EventEmitter });
    await runHandler(req, res);
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.ok).toBe(true);
  });

  test('rate limit: returns 429 when limit exceeded (memory fallback)', async () => {
    // set low limits for test via env
    process.env.RATE_WINDOW = '1';
    process.env.RATE_MAX = '1';

    const payload = { name: 'A', email: 'a@example.com', message: '1' };
    const req1 = httpMocks.createRequest({ method: 'POST', body: payload, headers: { 'x-forwarded-for': '1.2.3.4' } });
    const res1 = httpMocks.createResponse({ eventEmitter: require('events').EventEmitter });
    await runHandler(req1, res1);
    expect(res1.statusCode).toBe(200);

    const req2 = httpMocks.createRequest({ method: 'POST', body: payload, headers: { 'x-forwarded-for': '1.2.3.4' } });
    const res2 = httpMocks.createResponse({ eventEmitter: require('events').EventEmitter });
    await runHandler(req2, res2);
    expect(res2.statusCode).toBe(429);
  });
});
