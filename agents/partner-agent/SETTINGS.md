# Agent Settings Guide

How to choose the AI service and model for this agent, without programming.

All settings live in one file in this folder: **`.env.local`**.

## The basics

- **`.env.local` is a plain text file.** Open it in VS Code (or Notepad).
- **Each line is `NAME=value`.** Change only the part after `=`. Do not add spaces or quotes.
- **Lines starting with `#` are notes.** The agent ignores them.
- **Restart after every change.** In the agent's terminal press **Ctrl+C**, then type `npm run dev` and press **Enter**. The agent only reads the file when it starts.
- **Keep it private.** The file contains secret keys. Never share it, paste it into a chat, or upload it. Git ignores it automatically.

## First-time setup

1. In this folder, find **`.env.example`**.
2. Make a copy of it and name the copy **`.env.local`**.
   - In VS Code: right-click `.env.example` > **Copy**, then right-click the folder > **Paste**, then rename the copy to `.env.local`.
   - Or in the terminal (in this folder): `copy .env.example .env.local`
3. Fill in the values for the AI service you want (see below), save, and start the agent with `npm run dev`.

## Choose an AI service

| Service | Setting | Good for | Cost | What you need |
|---|---|---|---|---|
| Azure OpenAI | `MODEL_PROVIDER=azure` | The company's standard setup | Billed to the company Azure account | Azure key, address, and deployment name from your Azure administrator |
| Vercel AI Gateway | `MODEL_PROVIDER=gateway` | Trying many different models (OpenAI, Anthropic, Google, ...) | Paid per use, after free credits | A Vercel AI Gateway key, and a credit card on the Vercel account |
| OmniRoute | `MODEL_PROVIDER=omniroute` | Free testing | Free | OmniRoute running on this computer, and an OmniRoute key |

## Ready-made examples

Copy the lines for the service you want into `.env.local`, replace the parts in `<angle brackets>`, save, and restart. Leave the other lines as they are.

### Example A: Azure OpenAI (gpt-4o-mini)

```env
MODEL_PROVIDER=azure
AZURE_AI_CHATBOT_API_KEY=<your Azure key>
AZURE_AI_CHATBOT_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com/openai/v1
AZURE_AI_CHATBOT_DEPLOYMENT_NAME=gpt-4o-mini
```

### Example B: Vercel AI Gateway

```env
MODEL_PROVIDER=gateway
AI_GATEWAY_API_KEY=<your Vercel AI Gateway key>
GATEWAY_MODEL_ID=openai/gpt-4o-mini
```

To use a different model, change only `GATEWAY_MODEL_ID`, then restart:

| You want | Write |
|---|---|
| OpenAI, small and cheap | `GATEWAY_MODEL_ID=openai/gpt-4o-mini` |
| OpenAI, stronger | `GATEWAY_MODEL_ID=openai/gpt-4.1` |
| Anthropic Claude, fast | `GATEWAY_MODEL_ID=anthropic/claude-haiku-4.5` |
| Google Gemini, fast | `GATEWAY_MODEL_ID=google/gemini-2.5-flash` |
| Google Gemini, strongest | `GATEWAY_MODEL_ID=google/gemini-2.5-pro` |
| Mistral | `GATEWAY_MODEL_ID=mistral/mistral-large-4` |
| DeepSeek | `GATEWAY_MODEL_ID=deepseek/deepseek-v3.2` |

The full list is in the Vercel dashboard under **AI Gateway > Models**. Always write `company/model`. Do not use names ending in `-batch`.

### Example C: OmniRoute (free)

```env
MODEL_PROVIDER=omniroute
OMNIROUTE_API_KEY=<your OmniRoute key>
OMNIROUTE_MODEL_ID=auto/best-free
```

`auto/best-free` lets OmniRoute pick the best free model each time. OmniRoute must be running first: open Docker Desktop, then in a terminal run `docker start omniroute`. Its dashboard is at http://localhost:20128.

## Switching from one service to another

1. Change `MODEL_PROVIDER` to `azure`, `gateway`, or `omniroute`.
2. Make sure that service's section has its key filled in.
3. Save and restart the agent.

Each service keeps its own model setting (`GATEWAY_MODEL_ID`, `OMNIROUTE_MODEL_ID`, `AZURE_AI_CHATBOT_DEPLOYMENT_NAME`), so you never have to change a model line when switching.

## Check that it works

- **Quick check:** start the agent with `npm run dev`, type `hello`, and press Enter. You should get a reply.
- **Full check:** in this folder run `npm run test:live`. It tests all three services with the keys in `.env.local` and should end with `passed`.

## When something goes wrong

| Message you see | What it means | What to do |
|---|---|---|
| `Missing setting: <NAME>` | A required line is empty. | Fill in `<NAME>` in `.env.local`, save, restart. |
| `MODEL_PROVIDER must be 'azure', 'gateway', or 'omniroute'` | `MODEL_PROVIDER` has a typo. | Write exactly `azure`, `gateway`, or `omniroute` (lowercase). |
| `GATEWAY_MODEL_ID must be a provider/model id` | The gateway model name is missing the company part. | Use `company/model`, for example `openai/gpt-4o-mini`. |
| `AZURE_AI_CHATBOT_OPENAI_ENDPOINT must be a valid https URL` | The Azure address is wrong. | It must start with `https://` and end with `/openai/v1`. |
| `Access denied due to invalid key` (Azure) | The Azure key is wrong or expired. | Ask your Azure administrator for the current key. |
| `requires a valid credit card on file` (Gateway) | The Vercel account has no card. | Add a card in the Vercel dashboard under AI. |
| `Invalid API key` (OmniRoute) | The OmniRoute key is wrong. | Create a new key in the OmniRoute dashboard under API Keys. |
| `Cannot connect to API` (OmniRoute) | OmniRoute is not running. | Open Docker Desktop and run `docker start omniroute`. |
| The agent still uses the old service or model | The agent was not restarted. | Press Ctrl+C in its terminal, then run `npm run dev`. |
| `A dev server is already running for this eve agent` | The agent is already open in another terminal. | Use that terminal, or close it first (Ctrl+C). |

## Planner: Gemini key

The planner only runs when `GEMINI_API_KEY=<your key>` is in `.env.local` (key from https://aistudio.google.com/apikey). It can draw your agent's workflow as one Gemini image, which is **not free** (about $0.034 per image), and it always asks before making one. Its plans always include a free Mermaid diagram as well.

## Safety rules

- Never share `.env.local` or paste keys into chats, emails, or tickets. If a key was shared, ask for a new one and replace it.
- `.env.example` is the shared template. Never write real keys into it.
- Each agent folder has its own `.env.local`. Changing one does not change the other.
