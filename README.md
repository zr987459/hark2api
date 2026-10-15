# 👑 Hark2API - Claude Opus 5.5 / Sonnet 5.5 & Handoff 独立网关

<p align="center">
  <b>将 Hark.com 网页端全自动多智能体转为标准的 OpenAI / Anthropic 兼容协议 API</b><br/>
  独立包名 <code>com.hark2api.gateway</code> · 独立端口 <code>8795</code> · 与 Antigravity 完美并存
</p>

---

## ✨ 核心特性

- 👑 **顶配大模型底座**：
  - `claude-opus-5-5`：Anthropic 官方当世旗舰 Opus 5.5（100万上下文 + 128K输出，深度思考长程推理）；
  - `claude-sonnet-5-5`：Claude 5.5 系列高性价比极速代码模型；
  - `hark-agent`：自主云电脑浏览器操作（Handoff）与全网比价智能体。
- ⚡ **单端口多账号高并发轮询池 (Round-Robin)**：
  - 单个端口（8795）支持并发接入任意多个 Hark 账号，自动分流轮询；
  - 额度自动叠加（单号 800万/天，3号即 2400万/天），额度耗尽自动故障转移 (Failover)！
- 📊 **官方真实实时配额探测**：
  - 自动对接官方 `GET /api/billing/summary`，控制台展示每日已用/剩余 Token（精确到个位数）、每日重置倒计时、月度 4000 万总池进度条。
- 🖥️ **云电脑操作画面流式输出**：
  - 实时捕获并输出云端浏览器操作的高清截屏（WebP）与鼠标点击轨迹 `(x, y)`，支持 Markdown `<think>` 思考链块。
- 🧰 **标签化本地插件调用协议 (Tagged Tool Protocol)**：
  - 遵循开源成熟架构，支持客户端传入自定义本地插件（如 Python 脚本、本地数据库），由 Opus 5.5 自动决策并调用本地工具。
- 🔒 **永久正式数字证书签名**：
  - 固化独立永久正式签名库，支持未来所有版本无损、平滑覆盖安装，绝无签名冲突！

---

## 📱 客户端接入指引

在任意第三方客户端（如 NextChat / LobeChat / Cursor / Cherry Studio / 沉浸式翻译）中配置：

- **API 接口地址**：`http://127.0.0.1:8795/v1`
- **API Key**：任意填写（如 `sk-hark2api`）
- **模型名称**：`claude-opus-5-5` 或 `hark-agent`

---

## 📄 开源许可证

本项目采用 [MIT License](LICENSE) 授权开源。
