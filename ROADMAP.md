# Hark2API 功能路线图 (ROADMAP.md)

## 阶段一：核心骨架与双协议基础 (v1.0.0)
- [x] 系统架构设计 (ARCHITECTURE.md) 与路线图 (ROADMAP.md)
- [x] 固化永久正式签名密钥库 (`hark2api.jks`)，规范包名 (`com.hark2api.gateway`)
- [ ] 核心服务引擎与端口配置 (默认独立端口 `8795`)
- [ ] 标准 OpenAI (/v1/chat/completions) 与 Anthropic (/v1/messages) 双协议支持
- [ ] 官方真实模型代号支持：
  - `claude-opus-5-5` (当世旗舰 Claude 5.5)
  - `claude-sonnet-5-5` (高性价比极速代码模型)
  - `hark-agent` / `hark-pro` (原生云电脑浏览器智能体)
- [ ] 官方真实 Token 配额自动探测 (`/api/billing/summary`，单号 800万/天)
- [ ] 多账号并发轮询池 (Round-Robin) 与自动故障转移
- [ ] 人设清洗机制：屏蔽新手引导，还原纯粹 Opus 5.5 编程算力
- [ ] 独立的 Web 管理控制台与 Token 解析录入界面
- [ ] Android 原生客户端壳与前台保活服务
- [ ] GitHub Actions 云端打包流水线，自动发布 Release APK

---

## 阶段二：增强特性与本地工具生态 (v1.1.0)
- [ ] Tagged Tool Protocol 深度支持：支持客户端通过标准 tools 参数让 Hark 调度本地插件
- [ ] 云电脑浏览器操作截屏 (WebP) 与鼠标轨迹流式呈现
- [ ] 支持自定义地理位置 (`geo`) 与时区 (`timezone`) 模拟
- [ ] 微信/飞书/企业微信机器人 Webhook 联动
