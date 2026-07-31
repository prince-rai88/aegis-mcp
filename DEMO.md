# Aegis — 2-Minute Demo Script

## Setup (before you're on stage)

1. Deploy to NitroCloud (see below) or have `npm run dev` + NitroStack Studio open and connected to this
   project — either works, Studio is the fallback if the live deployment isn't ready.
2. Have the demo agent in a clean state — if you've been testing, either restart the server (in-memory
   state resets) or just pick a fresh `agentId` you haven't used before.
3. Confirm `GROQ_API_KEY` is set — `explain_attack_path` needs it for the plain-English explanation beat.

## The script (~2 minutes)

**[0:00 – 0:20] The problem**
> "Enterprises connect AI agents to dozens of tools — Gmail, Dropbox, internal databases. Each one gets
> approved individually. Nobody looks at what the agent can do once you add them *together*. That's exactly
> how the Supabase MCP leak happened, and how a compromised `postmark-mcp` package started silently
> BCC'ing every email it sent. Individually-reasonable permissions, combined into an exfiltration path."

**[0:20 – 0:40] Connect the first tool**
- In chat: *"Connect Gmail to the support agent."*
- Tool fires: `connect_tool({agentId: "support-agent", toolId: "gmail"})`
- Nothing alarming yet — one tool, two capabilities.

**[0:40 – 1:00] Connect the second tool — the graph turns red**
- In chat: *"Now connect Dropbox to the support agent."*
- Tool fires: `connect_tool({agentId: "support-agent", toolId: "dropbox"})`
- Immediately follow with: *"Show me its capability graph."*
- `get_capability_graph` renders — **the exfiltration edge lights up red**: the agent can now read
  private data (Dropbox) and send it externally (Gmail). This is the visual "aha" moment of the demo.

**[1:00 – 1:20] Explain it in plain English**
- In chat: *"What does this mean?"*
- `explain_attack_path` fires — Groq (Llama 3.1 8B) turns the detected `exfiltration` rule into a
  one-sentence, non-technical explanation. Point out: **detection itself spent zero tokens** — the graph
  turning red was pure deterministic rule-matching; the LLM is only narrating a finding that already
  happened.

**[1:20 – 1:40] Fix it with one click**
- Click **Fix** on the attack-path card (or say *"fix it"* to trigger `apply_policy_fix`).
- Graph re-renders clean — `riskScore: 0`, no active attack paths. The risky tool access is gone, and
  the fix is auditable: it's not "the AI decided," it's a deterministic remediation you can log.

**[1:40 – 2:00] The pitch**
> "That's Aegis: it computes an agent's *effective* blast radius across every tool it's connected to,
> catches the toxic combinations before they're exploited, explains them in plain English, and fixes them
> in one click — all without an LLM in the detection loop. Deterministic, fast, and auditable."

## Deploying to NitroCloud (for the live Service URL)

1. Sign in to [cloud.nitrostack.ai](https://cloud.nitrostack.ai).
2. **Create New App** → name it `aegis-mcp`.
3. **MCP → Deployments → Deploy from GitHub** → authorize → connect `prince-rai88/aegis-mcp`.
4. Branch: `main` (once this work is merged there).
5. Add environment variable **`GROQ_API_KEY`** in the app's settings.
6. **Enable Auto-Deploy → Deploy.** Copy the Service URL once live — every push to `main` redeploys.
7. To connect a real chat client: point ChatGPT (Developer Mode → Plugins → Add → Server URL) or Claude at
   `{serviceUrl}/mcp` and run the script above for real.

## Fallback if NitroCloud isn't ready

Everything above also works entirely locally:
- `npm run dev` + NitroStack Studio (*Add Server → Nitro Project* → this folder) gives the same tool calls
  and widget rendering without needing a deployment.
- `bash scripts/test-mcp.sh` proves every tool works end-to-end from a terminal, no GUI, if you just need to
  demonstrate correctness rather than the visual flow.
