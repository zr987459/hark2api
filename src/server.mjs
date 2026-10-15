/**
 * Hark2API Server - 专为 Claude Opus 5.5 / Sonnet 5.5 与 Handoff 智能体打造的高性能 API 网关
 * 默认运行端口: 8795 (独立于 8790，绝不冲突)
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { HarkAccountManager, handleHarkRequest, isHarkModel } from './hark-provider.mjs';
import { getModelsResponse } from './models-catalog.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8795;
const HOST = '0.0.0.0';

const harkAccounts = new HarkAccountManager(
  path.join(__dirname, '..', 'data', 'hark_accounts.json')
);

const dashboardPath = path.join(__dirname, 'dashboard.html');

function sendJson(res, status, obj) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': '*',
  });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 25 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS 预检
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': '*',
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // 1. 健康检查
  if (url.pathname === '/health') {
    sendJson(res, 200, {
      ok: true,
      service: 'hark2api',
      version: '1.0.0',
      port: PORT,
      accounts_count: harkAccounts.accounts.length,
      primary_model: 'claude-opus-5-5',
    });
    return;
  }

  // 2. 模型列表 (/v1/models & /models)
  if (url.pathname === '/v1/models' || url.pathname === '/models') {
    sendJson(res, 200, getModelsResponse());
    return;
  }

  // 3. Web 控制台
  if (url.pathname === '/' || url.pathname === '/dashboard') {
    if (fs.existsSync(dashboardPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(dashboardPath).pipe(res);
    } else {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Hark2API Gateway is running on port ' + PORT);
    }
    return;
  }

  // 4. 管理 API
  if (url.pathname === '/api/hark/status' && req.method === 'GET') {
    const active = harkAccounts.getAvailableAccount();
    sendJson(res, 200, {
      ok: true,
      active_account: active ? { id: active.id, name: active.name, email: active.email } : null,
      accounts: harkAccounts.list(),
      count: harkAccounts.accounts.length,
    });
    return;
  }

  if (url.pathname === '/api/hark/accounts' && req.method === 'GET') {
    sendJson(res, 200, { ok: true, accounts: harkAccounts.list() });
    return;
  }

  if (url.pathname === '/api/hark/accounts' && req.method === 'POST') {
    const body = await readBody(req);
    if (!body.cookie) {
      sendJson(res, 400, { ok: false, error: '请提供 Hark Cookie' });
      return;
    }
    const acc = harkAccounts.addAccount({
      name: body.name,
      cookie: body.cookie,
      userAgent: body.userAgent,
    });
    sendJson(res, 200, { ok: true, account: acc });
    return;
  }

  if (url.pathname === '/api/hark/accounts/switch' && req.method === 'POST') {
    const body = await readBody(req);
    const acc = harkAccounts.switchAccount(body.id);
    if (acc) {
      sendJson(res, 200, { ok: true, account: acc });
    } else {
      sendJson(res, 404, { ok: false, error: '账号不存在' });
    }
    return;
  }

  if (
    (url.pathname === '/api/hark/accounts/remove' && req.method === 'POST') ||
    (url.pathname.startsWith('/api/hark/accounts/') && req.method === 'DELETE')
  ) {
    let id = '';
    if (url.pathname.startsWith('/api/hark/accounts/')) {
      id = url.pathname.replace('/api/hark/accounts/', '');
    } else {
      const body = await readBody(req);
      id = body.id;
    }
    harkAccounts.removeAccount(id);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (url.pathname === '/api/hark/accounts/test' && req.method === 'POST') {
    const body = await readBody(req);
    const targetId = body.id || harkAccounts.getAvailableAccount()?.id;
    if (!targetId) {
      sendJson(res, 400, { ok: false, error: '无可测试的账号' });
      return;
    }
    const result = await harkAccounts.testAccount(targetId);
    sendJson(res, 200, result);
    return;
  }

  if (url.pathname === '/api/hark/quota' && req.method === 'GET') {
    const quotaData = await harkAccounts.getQuota();
    sendJson(res, 200, quotaData);
    return;
  }

  // 5. 对话接口：Anthropic 协议 (/v1/messages)
  if (url.pathname === '/v1/messages' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      await handleHarkRequest(req, res, body, harkAccounts, 'anthropic');
    } catch (e) {
      sendJson(res, 500, { type: 'error', error: { message: e.message } });
    }
    return;
  }

  // 6. 对话接口：OpenAI 协议 (/v1/chat/completions)
  if (url.pathname === '/v1/chat/completions' && req.method === 'POST') {
    try {
      const oaiReq = await readBody(req);
      await handleHarkRequest(req, res, oaiReq, harkAccounts, 'openai');
    } catch (e) {
      sendJson(res, 500, { error: { message: e.message } });
    }
    return;
  }

  sendJson(res, 404, { error: { message: 'Not Found', path: url.pathname } });
});

server.listen(PORT, HOST, () => {
  console.log(`🚀 Hark2API Gateway 运行在 http://${HOST}:${PORT}`);
  console.log(`📡 支持标准 OpenAI (/v1/chat/completions) 与 Anthropic (/v1/messages) 双协议`);
  console.log(`👑 核心模型: Claude Opus 5.5 (claude-opus-5-5), Sonnet 5.5, Hark Agent`);
});
