# Hark2API 架构设计文档 (ARCHITECTURE.md)

## 1. 项目定位与目标
**Hark2API** 是一款专为移动端及自托管环境设计的独立高性能 AI 协议网关。
主要负责将 **Hark.com** 背后强大的 **Claude Opus 5.5** 与 **Handoff 自主屏幕操作智能体** 转换为标准的 **OpenAI (/v1/chat/completions)** 与 **Anthropic (/v1/messages)** 双协议接口，支持与市面上所有客户端（NextChat、LobeChat、Cursor、沉浸式翻译等）无缝对接。

项目独立于既有的网关运行，使用独立端口（默认 `8795`）和独立 Android 包名（`com.hark2api.gateway`），实现无冲突并存。

---

## 2. 核心架构设计

```
[外部客户端 (Cursor / NextChat / LobeChat / Python SDK)]
                           │
                           ▼ (标准 OpenAI / Anthropic 协议)
+-------------------------------------------------------------+
|                      Hark2API 网关核心                       |
|  - 默认监听端口: 8795 (与 8790 独立共存，支持多端口调节)      |
|  - Protocol Adapter: OpenAI & Anthropic 双向协议映射器       |
+-------------------------------------------------------------+
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
+-----------------+ +-----------------+ +-----------------+
| System Stripper | | Tagged Tool AST | | Multi-Account   |
| (人设清洗模块)   | | (本地插件解析器)| | (并发轮询池)    |
| - 抹除生活助理  | | - 声明本地工具  | | - 多Cookie聚合  |
| - 还原 Opus 5.5 | | - 拦截 tool_call| | - 800万/天/号   |
|   纯算力代码输出| | - 调度本地脚本  | | - 自动故障转移  |
+-----------------+ +-----------------+ +-----------------+
                           │
                           ▼ (HTTPS / Session 保持)
+-------------------------------------------------------------+
|                   Hark.com 官方云端通信层                   |
|  - /api/messages/send: 智能体消息分发                       |
|  - /api/messages/history: 思考链 (Thinking) 与云电脑截屏     |
|  - /api/billing/summary: 官方真实 Token 额度实时同步        |
+-------------------------------------------------------------+
```

---

## 3. 关键特性与设计原则

### 3.1 人设脱敏与纯净算力提取 (System Prompt Stripping)
- 自动屏蔽 Hark 网页端的新手引导流程 (`/onboarding/seen`)；
- 在请求最前端注入结构化系统指令，消除推销机票酒店等生活助理闲聊干扰，彻底释放 Claude Opus 5.5 的原生顶尖代码与逻辑推理能力。

### 3.2 标签化本地工具调用协议 (Tagged Tool Protocol)
- 借鉴成熟开源项目 `caiwuu/web2api` 的方案；
- 允许客户端传入自定义本地插件工具（如本地数据库、Python 脚本、Shell 指令）；
- 通过 `<think>` 和 `<tool_call>` 标签由模型输出调用决策，网关在本地执行后喂回 `<tool_response>`，实现让远程模型驱动本地工具闭环。

### 3.3 单端口多账号高并发轮询池 (Round-Robin Pooling)
- 允许在控制台录入多个从 CookieBox 提取的 Hark Cookie；
- 单端口下并发分流，各账号会话独立；
- 单账号每日 800 万 Token，多账号自动叠加（如 3 账号即为 2400 万 Token/天）。

### 3.4 永久签名规范与包名隔离
- Android 包名：`com.hark2api.gateway`；
- 内置固化永久签名密钥库 `hark2api.jks`，确保未来全生命周期无感、平滑覆盖升级。
