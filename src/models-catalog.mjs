/**
 * Hark2API Models Catalog
 * 官方真实型号：Claude Opus 5.5, Claude Sonnet 5.5 & Hark Handoff Agent
 */

export const MODEL_LIST = [
  {
    id: 'claude-opus-5-5',
    name: 'Claude Opus 5.5 (Anthropic 官方当世旗舰 / 100万上下文 + 128K输出)',
    object: 'model',
    created: Math.floor(Date.now() / 1000),
    owned_by: 'anthropic',
    context_window: 1000000,
    max_tokens: 128000,
    reasoning: true,
  },
  {
    id: 'claude-sonnet-5-5',
    name: 'Claude Sonnet 5.5 (Claude 5.5 系列高性价比极速代码模型)',
    object: 'model',
    created: Math.floor(Date.now() / 1000),
    owned_by: 'anthropic',
    context_window: 1000000,
    max_tokens: 128000,
    reasoning: true,
  },
  {
    id: 'hark-agent',
    name: 'Hark Autonomous Agent (Opus 5.5 大脑 + Handoff 云电脑浏览器操作/全网比价)',
    object: 'model',
    created: Math.floor(Date.now() / 1000),
    owned_by: 'hark',
    context_window: 1000000,
    max_tokens: 128000,
    reasoning: true,
  },
  {
    id: 'hark-pro',
    name: 'Hark Pro (全自主多智能体旗舰版)',
    object: 'model',
    created: Math.floor(Date.now() / 1000),
    owned_by: 'hark',
    context_window: 1000000,
    max_tokens: 128000,
    reasoning: true,
  },
  // 常见别名兼容
  {
    id: 'claude-opus-5.5',
    name: 'Claude Opus 5.5 (别名兼容)',
    object: 'model',
    created: Math.floor(Date.now() / 1000),
    owned_by: 'anthropic',
    context_window: 1000000,
    max_tokens: 128000,
    reasoning: true,
  },
  {
    id: 'claude-3-opus-hark',
    name: 'Claude 3 Opus Hark (旧客户端兼容别名)',
    object: 'model',
    created: Math.floor(Date.now() / 1000),
    owned_by: 'hark',
    context_window: 200000,
    max_tokens: 8192,
    reasoning: true,
  }
];

export function getModelsResponse() {
  return {
    object: 'list',
    data: MODEL_LIST,
    models: MODEL_LIST,
  };
}
