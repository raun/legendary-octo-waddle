'use strict';

// ---------------------------------------------------------------------------
// Mock next/server before importing the route so NextResponse is available.
// ---------------------------------------------------------------------------

// We need to mock NextResponse because next/server isn't available in a bare
// Node test environment outside the Next.js runtime.
jest.mock('next/server', () => {
  const NextResponse = {
    json: jest.fn((body, init) => ({
      _body: body,
      _status: (init && init.status) || 200,
      json: async () => body,
      status: (init && init.status) || 200,
    })),
  };
  return { NextResponse };
});

// ---------------------------------------------------------------------------
// We also need to mock the global fetch so the route never hits the real
// Anthropic API during tests.
// ---------------------------------------------------------------------------

const { NextResponse } = require('next/server');

// Helper to create a minimal mock Request object
function makeRequest(body) {
  return {
    json: async () => body,
  };
}

// Helper to build a successful Anthropic API-like response
function mockAnthropicSuccess(data) {
  return {
    ok: true,
    json: async () => data,
    text: async () => JSON.stringify(data),
    status: 200,
  };
}

// Helper to build a failed Anthropic API-like response
function mockAnthropicError(status, text) {
  return {
    ok: false,
    json: async () => ({ error: text }),
    text: async () => text,
    status,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/chat — ANTHROPIC_API_KEY missing', () => {
  let POST;

  beforeAll(() => {
    // Ensure key is absent
    delete process.env.ANTHROPIC_API_KEY;
    // Import fresh so the module picks up the env state
    jest.resetModules();
    POST = require('../../app/api/chat/route').POST;
  });

  afterAll(() => {
    jest.resetModules();
  });

  it('should return status 500 when ANTHROPIC_API_KEY is not set', async () => {
    const req = makeRequest({ messages: [], model: 'claude-opus-4-6' });
    const response = await POST(req);
    expect(response._status).toBe(500);
  });

  it('should return a JSON body with an error field when API key is missing', async () => {
    const req = makeRequest({ messages: [], model: 'claude-opus-4-6' });
    const response = await POST(req);
    expect(response._body).toHaveProperty('error');
    expect(response._body.error).toMatch(/ANTHROPIC_API_KEY/i);
  });
});

describe('POST /api/chat — Anthropic API returns an error response', () => {
  let POST;
  const originalFetch = global.fetch;

  beforeAll(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key-123';
    jest.resetModules();

    global.fetch = jest.fn().mockResolvedValue(mockAnthropicError(429, 'rate limited'));

    POST = require('../../app/api/chat/route').POST;
  });

  afterAll(() => {
    global.fetch = originalFetch;
    delete process.env.ANTHROPIC_API_KEY;
    jest.resetModules();
  });

  it('should return the same HTTP status code that Anthropic returned', async () => {
    const req = makeRequest({ messages: [{ role: 'user', content: 'hello' }] });
    const response = await POST(req);
    expect(response._status).toBe(429);
  });

  it('should return a JSON body with an error property on Anthropic error', async () => {
    const req = makeRequest({ messages: [{ role: 'user', content: 'hello' }] });
    const response = await POST(req);
    expect(response._body).toHaveProperty('error');
  });

  it('should include the Anthropic status code in the error message', async () => {
    const req = makeRequest({ messages: [{ role: 'user', content: 'hello' }] });
    const response = await POST(req);
    expect(response._body.error).toContain('429');
  });
});

describe('POST /api/chat — Anthropic API returns a 401 Unauthorized', () => {
  let POST;
  const originalFetch = global.fetch;

  beforeAll(() => {
    process.env.ANTHROPIC_API_KEY = 'bad-key';
    jest.resetModules();
    global.fetch = jest.fn().mockResolvedValue(mockAnthropicError(401, 'unauthorized'));
    POST = require('../../app/api/chat/route').POST;
  });

  afterAll(() => {
    global.fetch = originalFetch;
    delete process.env.ANTHROPIC_API_KEY;
    jest.resetModules();
  });

  it('should pass through a 401 status from Anthropic', async () => {
    const req = makeRequest({ messages: [] });
    const response = await POST(req);
    expect(response._status).toBe(401);
  });
});

describe('POST /api/chat — Anthropic API succeeds', () => {
  let POST;
  const originalFetch = global.fetch;

  const anthropicResponseBody = {
    id: 'msg_123',
    type: 'message',
    role: 'assistant',
    content: [{ type: 'text', text: 'Hello from Claude' }],
    model: 'claude-opus-4-6',
    stop_reason: 'end_turn',
    usage: { input_tokens: 10, output_tokens: 5 },
  };

  beforeAll(() => {
    process.env.ANTHROPIC_API_KEY = 'valid-key-abc';
    jest.resetModules();
    global.fetch = jest.fn().mockResolvedValue(mockAnthropicSuccess(anthropicResponseBody));
    POST = require('../../app/api/chat/route').POST;
  });

  afterAll(() => {
    global.fetch = originalFetch;
    delete process.env.ANTHROPIC_API_KEY;
    jest.resetModules();
  });

  it('should return status 200 on a successful Anthropic response', async () => {
    const req = makeRequest({
      model: 'claude-opus-4-6',
      messages: [{ role: 'user', content: 'Hi' }],
      system: 'You are a tutor.',
    });
    const response = await POST(req);
    expect(response._status).toBe(200);
  });

  it('should pass through the Anthropic response body as JSON', async () => {
    const req = makeRequest({
      model: 'claude-opus-4-6',
      messages: [{ role: 'user', content: 'Hi' }],
    });
    const response = await POST(req);
    expect(response._body).toEqual(anthropicResponseBody);
  });

  it('should call fetch once with the Anthropic endpoint URL', async () => {
    const req = makeRequest({ messages: [{ role: 'user', content: 'Hi' }] });
    await POST(req);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.any(Object),
    );
  });

  it('should include the API key in the x-api-key header sent to Anthropic', async () => {
    const req = makeRequest({ messages: [] });
    await POST(req);
    const [, fetchOptions] = global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
    expect(fetchOptions.headers['x-api-key']).toBe('valid-key-abc');
  });

  it('should use the anthropic-version header in the request to Anthropic', async () => {
    const req = makeRequest({ messages: [] });
    await POST(req);
    const [, fetchOptions] = global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
    expect(fetchOptions.headers['anthropic-version']).toBeDefined();
  });
});

describe('POST /api/chat — model fallback behaviour', () => {
  let POST;
  const originalFetch = global.fetch;

  const successResponse = {
    id: 'msg_456',
    content: [{ type: 'text', text: 'response' }],
  };

  beforeAll(() => {
    process.env.ANTHROPIC_API_KEY = 'key-for-model-test';
    jest.resetModules();
    global.fetch = jest.fn().mockResolvedValue(mockAnthropicSuccess(successResponse));
    POST = require('../../app/api/chat/route').POST;
  });

  afterAll(() => {
    global.fetch = originalFetch;
    delete process.env.ANTHROPIC_API_KEY;
    jest.resetModules();
  });

  it('should use "claude-opus-4-6" as the model when no model is specified in the request body', async () => {
    // Send a body with no model field
    const req = makeRequest({ messages: [{ role: 'user', content: 'hi' }] });
    await POST(req);
    const [, fetchOptions] = global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
    const sentBody = JSON.parse(fetchOptions.body);
    expect(sentBody.model).toBe('claude-opus-4-6');
  });

  it('should use the model specified in the request body when provided', async () => {
    const req = makeRequest({
      model: 'claude-haiku-3-5',
      messages: [{ role: 'user', content: 'hi' }],
    });
    await POST(req);
    const [, fetchOptions] = global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
    const sentBody = JSON.parse(fetchOptions.body);
    expect(sentBody.model).toBe('claude-haiku-3-5');
  });

  it('should use 400 as default max_tokens when max_tokens is not specified', async () => {
    const req = makeRequest({ messages: [] });
    await POST(req);
    const [, fetchOptions] = global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
    const sentBody = JSON.parse(fetchOptions.body);
    expect(sentBody.max_tokens).toBe(400);
  });

  it('should use the max_tokens value from the request body when provided', async () => {
    const req = makeRequest({ messages: [], max_tokens: 1024 });
    await POST(req);
    const [, fetchOptions] = global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
    const sentBody = JSON.parse(fetchOptions.body);
    expect(sentBody.max_tokens).toBe(1024);
  });
});

describe('POST /api/chat — fetch throws a network error', () => {
  let POST;
  const originalFetch = global.fetch;

  beforeAll(() => {
    process.env.ANTHROPIC_API_KEY = 'key-network-error';
    jest.resetModules();
    global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    POST = require('../../app/api/chat/route').POST;
  });

  afterAll(() => {
    global.fetch = originalFetch;
    delete process.env.ANTHROPIC_API_KEY;
    jest.resetModules();
  });

  it('should return status 502 when fetch throws a network error', async () => {
    const req = makeRequest({ messages: [] });
    const response = await POST(req);
    expect(response._status).toBe(502);
  });

  it('should return a JSON body with an error field on network failure', async () => {
    const req = makeRequest({ messages: [] });
    const response = await POST(req);
    expect(response._body).toHaveProperty('error');
  });
});
