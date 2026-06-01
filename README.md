<p align="center">
  <img src="images/xilian.jpg" width="160" alt="昔涟" style="border-radius: 50%; box-shadow: 0 4px 20px rgba(232, 146, 165, 0.3);" />
</p>

<h1 align="center">昔涟 · 永恒的一页</h1>

<p align="center">
  AI 角色扮演聊天应用。与「昔涟」对话——哀丽秘榭的黄金裔，三千万世轮回的故事记录者。
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue-3-4FC08D?logo=vuedotjs" alt="Vue 3" />
  <img src="https://img.shields.io/badge/Express-5-000000?logo=express" alt="Express 5" />
  <img src="https://img.shields.io/badge/DeepSeek-V4-4D6BFE" alt="DeepSeek" />
  <img src="https://img.shields.io/badge/TTS-GPT--SoVITS--v2-FF6B6B" alt="GPT-SoVITS" />
  <img src="https://img.shields.io/badge/语音-本地离线-green" alt="离线TTS" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT" />
</p>

---

## 预览

打开应用，在输入框中写下你想对昔涟说的话。她会用俏皮甜美的语气回应你，并自动配上本地生成的语音♪

## 功能

| 模块 | 说明 |
|------|------|
| 角色扮演对话 | SSE 流式传输，AI 以昔涟的身份和语气实时回应 |
| 本地语音合成 | GPT-SoVITS v2 微调模型，**完全离线**，3 秒生成一句 |
| 昔涟的记忆簿 | 自动从对话中提取你的信息并持久化（上限 50 条），下次对话时自动注入上下文 |
| 对话管理 | 多轮对话切换、自动标题、删除，全部存储在浏览器本地 |
| 对话导出 | 一键导出为 Markdown / JSON / TXT，保存到本地 |
| 世界观知识库 | 可配置的 lore 系统，识别关键词自动补充世界观背景 |

## 技术栈

### 聊天应用

```
Vue 3  ──  Composition API + Pinia + Vite 6
Express 5  ──  SSE 流式代理 + 本地 TTS 路由
DeepSeek API  ──  文本生成（stream）
markdown-it + highlight.js  ──  消息渲染
```

### 语音合成

```
GPT-SoVITS v2  ──  LoRA 微调，12 分钟训练数据
SoVITS 模型  ──  声学模型（85MB）
GPT 模型  ──  文本→语音映射（155MB）
CPU 推理  ──  ~3 秒/句，完全离线
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
│   ├── services/            DeepSeek 流式 · 本地 TTS
│   ├── middleware/          错误处理
│   └── public/
│       ├── audio/           生成的语音文件
│       └── voice-samples/   语音克隆样本
├── character.json           角色配置（核心）
├── images/                  文档用图片
├── .env.example             环境变量模板
└── package.json             Monorepo 启动脚本
```

GPT-SoVITS 模型部署在独立目录 `D:\GPT-SoVITS\`，与项目分离。

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
| `LOCAL_TTS` | `true`=本地昔涟语音，`false`=Mimo API | 否 |

### 2. 安装 & 启动

```bash
# 安装所有依赖
npm run install:all
```

#### 一键启动（推荐）

双击 `启动昔涟.bat`，自动启动后端 + 前端，浏览器打开。

#### 手动启动

```bash
npm run dev
```

- 前端：`http://localhost:5173`
- 后端：`http://localhost:3001`

> 如果聊天记录消失了，检查浏览器地址栏是 `localhost` 还是 `127.0.0.1`，两者 localStorage 不互通，保持一致即可。

### 3. 生产构建

```bash
cd client && npm run build
```

产物在 `client/dist/`。

## 语音合成

### 用命令行生成语音

```cmd
cd D:\GPT-SoVITS\GPT-SoVITS-v3lora-20250228
echo 你想说的话 | runtime\python.exe xilian_infer.py
```

输出：`output/xilian_output.wav`

### 模型训练流程

1. **素材准备**：12 分钟昔涟语音 → UVR5 去 BGM → 语音切分 → ASR 转写 → 文本校对 → 74 条训练数据
2. **SoVITS 训练**：7 epoch，CPU，输出 `xilian_e8_s320.pth`（85MB）
3. **GPT 训练**：14 epoch，GPU，输出 `xilian-e10.ckpt`（155MB）
4. **推理**：CPU 推理，~3 秒生成一句

### 切换 TTS 模式

`.env` 中设置：

```env
LOCAL_TTS=true   # 本地昔涟模型（离线，推荐）
LOCAL_TTS=false  # Mimo API（需联网）
```

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
4. 训练新角色的 GPT-SoVITS 模型 → 更新 `.env` 中的模型路径
5. 编辑 `client/public/lore.json` 填入新角色的世界观知识库
6. 重启应用

全部改完即时生效，一滴代码不用碰。

### 自定义头像

替换 `client/public/avatars/` 下的图片即可：

| 文件 | 用途 |
|------|------|
| `ai-avatar.jpg` | AI 角色头像 |
| `user-avatar.jpg` | 用户头像 |

### 自定义世界观知识库

编辑 `client/public/lore.json`，数组格式，每条包含触发关键词和知识条目即可。

## License

MIT
