<p align="center">
  <img src="images/xilian.jpg" width="160" alt="昔涟" style="border-radius: 50%; box-shadow: 0 4px 20px rgba(232, 146, 165, 0.3);" />
</p>

<h1 align="center">昔涟 · 永恒的一页</h1>

<p align="center">
  一个 AI 角色扮演聊天应用，与「昔涟」对话 —— 哀丽秘榭的黄金裔，掌管三千万世轮回的故事记录者。
</p>

<p align="center">
  <sub>新手尝试，还望海涵</sub>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue-3-4FC08D?logo=vuedotjs" alt="Vue 3" />
  <img src="https://img.shields.io/badge/Express-5-000000?logo=express" alt="Express 5" />
  <img src="https://img.shields.io/badge/DeepSeek-V4-4D6BFE" alt="DeepSeek" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT" />
</p>

---

## 预览

> 打开应用，在输入框中写下你想对昔涟说的话。她会用俏皮甜美的语气回应你，偶尔带上语音♪

## 功能

| 模块 | 说明 |
|------|------|
| 角色扮演对话 | SSE 流式传输，AI 以昔涟的身份和语气实时回应 |
| 语音合成 | Mimo API 语音克隆，支持昔涟原声及多种音色切换，可一键关闭。开启语音后回复加载时间会变长（需等待 TTS 合成） |
| 昔涟的记忆簿 | 自动从对话中提取你的信息并持久化（上限 50 条），下次对话时自动注入上下文 |
| 对话管理 | 多轮对话切换、自动标题、删除，全部存储在浏览器本地 |
| 对话导出 | 一键导出为 Markdown / JSON / TXT，保存到本地 |
| 世界观知识库 | 可配置的 lore 系统，识别关键词自动补充世界观背景 |

## 技术栈

```
Vue 3  ──  Composition API + Pinia + Vite 6
Express 5  ──  SSE 流式代理 + TTS 路由
DeepSeek API  ──  文本生成（stream）
Mimo API  ──  语音克隆 / 合成
markdown-it + highlight.js  ──  消息渲染
```

## 项目结构

```
ai-chat/
├── client/                  Vue 3 前端
│   ├── src/
│   │   ├── components/      12 个 Vue 组件
│   │   ├── services/        API 调用 · 记忆系统 · 知识库引擎
│   │   ├── composables/     音频播放 · 打字机效果
│   │   ├── stores/          Pinia 状态中心
│   │   └── utils/           导出工具
│   └── public/              头像 · lore.json
├── server/                  Express 后端
│   ├── routes/              /api/chat · /api/export · /api/character
│   ├── services/            DeepSeek 流式 · Mimo TTS
│   ├── middleware/           错误处理
│   └── public/
│       ├── audio/           生成的语音文件
│       └── voice-samples/   语音克隆样本
├── character.json           角色配置（核心）
├── images/                  文档用图片
├── .env.example             环境变量模板
└── package.json             Monorepo 启动脚本
```

## 快速开始

### 1. 环境变量

```bash
cp .env.example .env
```

编辑 `.env`，填入 API Key：

| 变量 | 说明 | 必填 |
|------|------|------|
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | 是 |
| `DEEPSEEK_MODEL` | 模型名称，默认 `deepseek-v4-pro` | 否 |
| `MIMO_API_KEY` | Mimo TTS 密钥 | 否（不填则不启用语音） |

### 2. 安装 & 启动

```bash
# 安装所有依赖
npm run install:all

# 启动开发服务器
npm run dev
```

- 前端：`http://localhost:5173`
- 后端：`http://localhost:3001`

### 3. 生产构建

```bash
cd client && npm run build
```

产物在 `client/dist/`。

## 自定义角色

整个应用围绕 `character.json` 驱动，编辑此文件即可切换角色，无需改代码。配置结构：

```json
{
  "name": "角色名",
  "systemPrompt": "系统提示词，定义角色的语气、身份、行为规则",
  "ui": {
    "title": "页面标题",
    "welcomeLine1": "欢迎语第一行",
    "welcomeLine2": "欢迎语第二行（可选）",
    "placeholder": "输入框占位文字",
    "memoryTitle": "记忆簿标题",
    "generatingHint": "生成中的提示文字"
  },
  "voice": {
    "sampleFiles": ["语音样本路径（放在 server/public/ 下）"],
    "directorPrompt": "TTS 导演模式提示词，控制语音风格"
  }
}
```

### 换角色的完整步骤

1. 编辑根目录 `character.json`，填入新角色的设定和文案
2. 替换 `client/public/avatars/ai-avatar.jpg` 为新角色头像
3. 替换 `server/public/voice-samples/` 下的语音样本文件
4. 编辑 `client/public/lore.json` 填入新角色的世界观知识库
5. 重启应用

全部改完即时生效，一滴代码不用碰。

### 自定义头像

替换 `client/public/avatars/` 下的图片即可：

| 文件 | 用途 |
|------|------|
| `ai-avatar.jpg` | AI 角色头像 |
| `user-avatar.jpg` | 用户头像 |

### 自定义世界观知识库

编辑 `client/public/lore.json`，数组格式，每条包含触发关键词和知识条目即可。

## 部署

| 部分 | 推荐平台 | 注意 |
|------|----------|------|
| 前端 SPA | Vercel / Netlify / Cloudflare Pages | 静态托管即可 |
| 后端 | Railway / Render / Fly.io | 需支持 SSE 长连接 |
| 语音样本 | 随项目部署 | `voice-samples/` 约 4MB |

> 整个后端不适合部署到 Vercel Serverless —— SSE 流式响应和 TTS 文件系统在 serverless 环境下均受限制。

## License

MIT
