# LinguiSnap

> **Snap your languages to their core.** | **拆积木一样学语言。**

LinguiSnap是一款基于大语言模型（LLM）驱动的外语骨架解析工具。它不采用传统的外语学习模式，通过基于语言学的形态语法拆解，将复杂的句子还原为最基础的词素积木。

可通过vercel托管访问网页版：

https://linguisnap.vercel.app/

---

## 理念

### 语言是一堆积木 (Language as Lego)
传统的学习方式往往让人迷失在海量的单词和语法规则中。LinguiSnap 提倡自上而下的学习路径：
- **不背单词表**：直接从真实语料开始。
- **物理拆分**：将词汇拆解为词素，揭示每个词素的用途和含义。
- **语法透视**：通过简化的莱比锡标注法，标出每个词块的语法身份。

---

## 运行模式 (App Modes)

### 1. 学习模式 (Basic Mode)
- **零配置**：开箱即用，默认调用DeepSeek引擎。
- **每日限额**：滑动窗口限流（每日 20 次），确保公共服务稳定。

### 2. 专业模式 (Pro Mode)
- **BYOK**：支持填入私有 API Key。
- **旗舰模型**：可自由切换至 Gemini, GPT 或 Claude 等模型。
- **隐私安全**：Key仅加密存储于用户本地浏览器缓存，LinguiSnap对此一无所知。

---

## 技术栈 (Tech Stack)

- Framework: Next.js 15 (App Router)
- Styling: Tailwind CSS
- Database/Security: Upstash Redis (Serverless Rate Limiting)
- Components: Radix UI & Lucide Icons
- Deployment: Vercel

---

## 开发者指南 (Getting Started)

### 1. 克隆项目
git clone https://github.com/ShunanH/linguisnap.git
cd linguisnap

### 2. 配置环境变量
在根目录创建 .env.local 文件，并填入以下参数：
DEEPSEEK_DEFAULT_KEY=Key
KV_REST_API_URL=URL
KV_REST_API_TOKEN=Token

### 3. 安装并启动
npm install
npm run dev

---

## 开源协议 (License)

本项目采用 AGPL-3.0 协议开源。
- 个人/教育用途：完全自由。
- 商业用途：根据 AGPL 协议，如果您使用本项目代码提供网络服务（SaaS），您必须公开您的源代码。

---

## 免责声明 (Disclaimer)

本工具由 AI 驱动，解析结果可能存在误差，仅供学习参考。请勿在此输入任何个人敏感或隐私数据。

---

Crafted with ❤️ by Shunan, with help of Gemini.
