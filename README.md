# LinguiSnap

LinguiSnap helps language learners read unfamiliar sentences in a different language by breaking them into words, morphemes, and grammatical tags. Each word comes with a direct translation (you can choose English or Chinese translation) and explanations of its structure, alongside a translation of the full sentence.

Please note that the LLM will translate the word directly. You may meet slangs that LLM cannot give the exact correct translation.

[Open LinguiSnap ](https://linguisnap.vercel.app/) · [中文使用教程 / Tutorial](https://linguisnap.vercel.app/tutorial)

## Using LinguiSnap

1. Open settings and choose your output language: Chinese, English, or Chinese explanations with English translations.
2. Choose a mode:
   - **Basic Mode / 学习模式** uses the site's default DeepSeek account, with up to 20 requests per IP address in a rolling 24-hour window. Availability depends on the site's shared quota configuration.
   - **Pro Mode / 专业模式** uses your own API key. Select DeepSeek, OpenAI, Google Gemini, or Anthropic, then choose a model from the dropdown.
3. Enter a sentence and click **Analyze / 解析**.
4. Hover over the morphemes and grammar tags to read their explanations.

Your API key will not be saved or memorized. Every refresh will clean it.

## How it works

The Next.js app handles the interface, analysis prompts, and shared request quotas. Its `/api/analyze` route sends requests to a FastAPI service, which calls the selected model provider and validates the response against a Pydantic schema. The frontend renders the resulting word analyses and sentence translation.

| Component | Stack | Hosting |
| --- | --- | --- |
| Web app and API gateway | Next.js 16, React, TypeScript, Tailwind CSS, Radix UI | Vercel |
| Analysis service | Python 3.12, FastAPI, Pydantic, HTTPX | Docker on AWS ECS Fargate |
| Shared quotas | Upstash Redis | Upstash |
| Container images | Docker | Amazon ECR |
| Service credentials and logs | AWS Secrets Manager, CloudWatch | AWS |

The gateway authenticates to FastAPI using a shared internal token. Provider requests use bounded retries for transient errors, with a default 50-second deadline for the complete analysis operation.

## Run locally

Use Node.js 22, Python 3.12, and npm. The commands below use a Bash-compatible shell.

```bash
git clone --branch main --single-branch https://github.com/ShunanH/linguisnap.git
cd linguisnap
npm ci
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r services/api/requirements.txt
```

Create `.env.local` in the repository root:

```dotenv
FASTAPI_BASE_URL=http://127.0.0.1:8000
INTERNAL_API_TOKEN=local-development-token
```

Start FastAPI from the repository root:

```bash
source .venv/bin/activate
export INTERNAL_API_TOKEN=local-development-token
python -m uvicorn app.main:app --app-dir services/api --reload --port 8000
```

In a second terminal, start Next.js:

```bash
npm run dev
```
