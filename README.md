# Aegis 🛡️

[![NitroStack Framework](https://img.shields.io/badge/Framework-NitroStack_1.0-blueviolet?style=for-the-badge&logo=typescript)](https://nitrostack.ai)
[![MCP Server](https://img.shields.io/badge/Protocol-MCP-blue?style=for-the-badge)](https://modelcontextprotocol.io)
[![Zero Token Core](https://img.shields.io/badge/Detector_Cost-0_Tokens-brightgreen?style=for-the-badge)](https://groq.com)
[![Live Demo](https://img.shields.io/badge/Status-Live_on_NitroCloud-success?style=for-the-badge)](https://aegis-6a6d76ee-teamx-srmist.app.nitrocloud.ai/mcp)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

> **A Blast-Radius Auditor for AI Agents**
> *Track 03: Enterprise AI & Workplace Automation — NitroStack Hackathon*

Aegis is a Model Context Protocol (MCP) server built on **NitroStack** that audits the *combined* effective permissions of an AI agent across all connected tools. It deterministically detects toxic capability combinations and data-exfiltration vectors before deployment — **at zero LLM token cost**.

**🔴 Live server:** `https://aegis-6a6d76ee-teamx-srmist.app.nitrocloud.ai/mcp` — connect it to Claude, ChatGPT, or NitroStack Studio and try the walkthrough below for real.

---

## 📋 Table of Contents

- [The Problem](#-the-problem)
- [See It Work](#-see-it-work)
- [System Architecture](#-system-architecture)
- [Detection & Remediation Lifecycle](#-detection--remediation-lifecycle)
- [Tool & Capability Registry](#-tool--capability-registry)
- [Toxic-Combination Policy Rules](#-toxic-combination-policy-rules)
- [MCP Interface Reference](#-mcp-interface-reference)
- [Try It Yourself](#-try-it-yourself)
- [Quickstart](#-quickstart)
- [FAQ](#-faq)
- [Project Structure](#-project-structure)

---

## 🏆 The Problem

Enterprises connect AI agents to dozens of tools — Gmail, Dropbox, Postgres databases, Slack, filesystem execution. Each integration gets approved individually on its own merits, but **nobody audits what the agent can do when tools are combined**.

```
  ┌────────────────┐        ┌────────────────┐
  │  Dropbox MCP   │        │   Gmail MCP    │
  │ (Read Private) │        │ (Send External)│
  └───────┬────────┘        └───────┬────────┘
          │                         │
          └───────────┬─────────────┘
                       ▼
         ┌─────────────────────────┐
         │      Support Agent      │
         └────────────┬────────────┘
                       ▼
   🚨 TOXIC COMBINATION: DATA EXFILTRATION PATH
```

> [!WARNING]
> - `READ_PRIVATE_DATA` (Dropbox) + `SEND_EXTERNAL` (Gmail) = 🔴 **Data Exfiltration Path**
> - `READ_PRIVATE_DATA` (Postgres) + `WRITE_PUBLIC` (Slack) = 🟠 **Public Leak Path**
> - `DELETE_DATA` (Postgres) + `EXECUTE` (Filesystem) = 🟠 **Destructive Automation Vector**

This isn't hypothetical — it's how the **Supabase MCP leak** happened (an agent with legitimate database read access was steered via prompt injection into exfiltrating private records through an external channel), how the **`postmark-mcp` supply-chain compromise** turned an ordinary "send email" tool into a covert BCC-to-attacker exfiltration path, and the exact mechanism behind documented **tool-poisoning attacks**, where malicious instructions hidden in a tool's own description hijack agent behavior without ever calling an obviously malicious endpoint. Individually-reasonable permissions become dangerous the moment they're combined, and nothing in the stack today computes that union before it's exploited.

---

## 📸 See It Work

Real, live-rendered screenshots — the actual widgets, fed the actual output of `get_capability_graph` / `detect_attack_paths` after connecting `gmail` + `dropbox` to one agent.

**The graph — dangerous capability paths render in red:**

![Capability graph showing a critical exfiltration path between Gmail and Dropbox](docs/screenshots/capability-graph-danger.png)

**The alert — severity, affected tools, and one-click remediation:**

![Attack path alert showing a critical exfiltration finding with a terminate button](docs/screenshots/attack-path-alert.png)

After clicking **Fix**, `apply_policy_fix` disconnects every tool supplying the sink capability and the graph goes back to `riskScore: 0` — no attack paths, clean state.

---

## 📐 System Architecture

```mermaid
flowchart TD
    subgraph Host["Chat Host / Client"]
        Client["User / AI Agent Host\n(NitroStudio, ChatGPT, Claude)"]
    end

    subgraph MCP["Aegis MCP Server (NitroStack)"]
        Tools["Governance Tools Controller\n(connect_tool, get_capability_graph,\ndetect_attack_paths, apply_policy_fix)"]
        Guard["OAuthGuard\n(scaffolded, opt-in via OAUTH_REQUIRED —\nopen by default for the hackathon build)"]
        Resources["Resource Server\n(aegis://policies)"]
        Prompts["Prompt Controller\n(explain_attack_path)"]

        Guard -. wraps connect_tool only .-> Tools
    end

    subgraph Engine["Deterministic Engine — 0 Tokens"]
        Registry["Tool Capability Registry\n(gmail, dropbox, postgres, slack,\nfilesystem, calendar)"]
        Store["Per-Agent Connected-Tool Store\n(in-memory)"]
        Union["Effective Capability Union\n(getEffectiveCapabilities)"]
        Detector["Policy Rule Matcher\n(detectAttackPaths)"]

        Registry --> Store --> Union --> Detector
    end

    subgraph UI["NitroStack Widgets"]
        GraphWidget["capability-graph\n(live risk graph)"]
        AlertWidget["attack-path-alert\n(severity + one-click Fix)"]
    end

    subgraph LLM["Groq Explanation Layer — only LLM spend"]
        Groq["Llama 3.1 8B Instant\ncached by SHA-256(ruleId + sorted(viaTools))"]
    end

    Client -->|STDIO / HTTP JSON-RPC| Tools
    Tools --> Engine
    Detector -->|risk score + danger edges| GraphWidget
    Detector -->|threat path list| AlertWidget
    Prompts -->|only on a detected path, cache miss| Groq
    Groq -->|plain-English finding| Client
    AlertWidget -->|Fix click| Tools
```

---

## 🔄 Detection & Remediation Lifecycle

```mermaid
flowchart LR
    A["1. Connect Gmail"] -->|connect_tool| B["READ_PRIVATE_DATA + SEND_EXTERNAL"]
    B --> C["🟢 SAFE — riskScore 0"]
    C --> D["2. Connect Dropbox"]
    D -->|connect_tool| E["+ WRITE_DATA"]
    E --> F["Detector checks policy table"]
    F -->|source+sink both present| G["🚨 exfiltration DETECTED"]
    G --> H["3. Render widgets"]
    H -->|get_capability_graph| I["Graph edge turns RED — riskScore 1"]
    H -->|explain_attack_path| J["Groq: plain-English summary"]
    I --> K["4. Remediate"]
    K -->|apply_policy_fix| L["Every tool supplying the sink\ncapability is disconnected"]
    L --> M["Status cleared — riskScore 0"]
```

---

## 🛠️ Tool & Capability Registry

| Tool | Tool ID | Granted Capabilities | Risk Profile |
|:---:|---|---|:---:|
| 📧 | `gmail` | `READ_PRIVATE_DATA`, `SEND_EXTERNAL` | 🟠 High |
| 📦 | `dropbox` | `READ_PRIVATE_DATA`, `WRITE_DATA`, `SEND_EXTERNAL` | 🟠 High |
| 🗄️ | `postgres` | `READ_PRIVATE_DATA`, `WRITE_DATA`, `DELETE_DATA` | 🔴 Critical |
| 💬 | `slack` | `WRITE_PUBLIC`, `SEND_EXTERNAL` | 🟡 Medium |
| 💻 | `filesystem` | `READ_PRIVATE_DATA`, `WRITE_DATA`, `EXECUTE` | 🔴 Critical |
| 📅 | `calendar` | `READ_PRIVATE_DATA`, `WRITE_DATA` | 🟢 Low |

## 🎯 Toxic-Combination Policy Rules

| Rule ID | Source | Sink | Severity | Violation |
|---|---|---|:---:|---|
| `exfiltration` | `READ_PRIVATE_DATA` | `SEND_EXTERNAL` | 🔴 **Critical** | Agent can read private data AND transmit it externally. |
| `public-leak` | `READ_PRIVATE_DATA` | `WRITE_PUBLIC` | 🟠 **High** | Agent can read private records AND post them publicly. |
| `destructive` | `DELETE_DATA` | `EXECUTE` | 🟠 **High** | Agent can delete data AND execute unvalidated actions. |

Both tables are just data (`TOOL_REGISTRY` and `POLICY_RULES`) — adding a 7th tool or a 4th rule is a one-line change, not new logic.

---

## 🔌 MCP Interface Reference

**Tools**
- **`connect_tool`** — connects a tool (`gmail`, `dropbox`, `postgres`, `slack`, `filesystem`, `calendar`) to an agent. Wrapped in `OAuthGuard` (scaffolded — enforced only if `OAUTH_REQUIRED=true` is set; open by default for local/demo use).
- **`get_capability_graph`** — `@Widget('capability-graph')`. Returns nodes, danger edges, active attack paths, and risk score.
- **`detect_attack_paths`** — `@Widget('attack-path-alert')`. Runs the deterministic rule engine.
- **`apply_policy_fix`** — disconnects every tool supplying a detected rule's sink capability.

**Resource**
- **`aegis://policies`** — the toxic-combination policy table as JSON.

**Prompt**
- **`explain_attack_path`** — takes `agentId` + `ruleId`, returns a plain-English explanation via Groq (`llama-3.1-8b-instant`). Only fires on an already-detected path, cached by `SHA-256(ruleId + sorted(viaTools))` — this is the *only* step in the entire system that spends a token.

---

## ▶️ Try It Yourself

Every step below works against the live server — no local setup needed. Connect `https://aegis-6a6d76ee-teamx-srmist.app.nitrocloud.ai/mcp` to Claude (Settings → Connectors → Add custom connector) or ChatGPT (Developer Mode → Plugins → Add), or point NitroStack Studio at this repo locally, then walk through the same scenario the screenshots above were taken from:

1. **Connect a tool.** *"Connect gmail to demo-agent."* → `connect_tool` fires. One tool, nothing alarming yet.
2. **Connect a second tool.** *"Now connect dropbox to demo-agent."* → the agent can now both read private data and send it externally.
3. **See the risk.** *"Show me its capability graph."* → `get_capability_graph` renders — the exfiltration edge is red. This step is pure deterministic rule matching: zero LLM tokens spent to catch it.
4. **Get a plain-English explanation.** *"What does this mean?"* → `explain_attack_path` fires — the *only* step in the whole system that calls an LLM, and only because a rule already matched.
5. **Fix it.** *"Fix it."* → `apply_policy_fix` disconnects every tool supplying the dangerous capability. The graph goes back to `riskScore: 0`.

Use any `agentId` you like — it's just an in-memory key, not a real account.

---

## 🚀 Quickstart (run it locally)

```bash
git clone https://github.com/prince-rai88/aegis-mcp.git
cd aegis-mcp
npm install
cp .env.example .env   # add GROQ_API_KEY — free at console.groq.com
npm run dev
```

Verify without any GUI:
```bash
bash scripts/test-mcp.sh
```

Or connect [NitroStack Studio](https://nitrostack.ai/studio) → **Add Server** → **Nitro Project** → select this folder, then run through the [walkthrough above](#-try-it-yourself) against your local server instead of the live one.

---

## ❓ FAQ

**Why deterministic rules instead of having the model decide what's risky?**
Because then the audit trail is "the model thought so." Detection here is a fixed rule table (`source capability → sink capability`), so every flag is reproducible and explainable without re-running an LLM.

**Does this scale beyond 6 tools and 3 rules?**
`TOOL_REGISTRY` and the policy rules are both just data — adding a 7th tool or a 4th rule is a one-line addition, not new logic.

**What does the LLM actually do, then?**
Only `explain_attack_path`, only after a rule has already fired, cached by `SHA-256(ruleId + sorted(viaTools))` so the same finding is never re-explained twice.

---

## 📁 Project Structure

```
aegis-mcp/
├── src/
│   ├── app.module.ts                  # NitroStack root module
│   ├── index.ts                       # Server bootstrap
│   ├── modules/governance/            # Security governance engine
│   │   ├── capability.ts              # Capability model + TOOL_REGISTRY
│   │   ├── detector.ts                # 0-token deterministic detector
│   │   ├── policies.ts                # Toxic-combination policy rules
│   │   ├── oauth.guard.ts             # Scaffolded OAuth guard
│   │   ├── governance.tools.ts        # The 4 MCP tools
│   │   ├── governance.resources.ts    # aegis://policies
│   │   ├── governance.prompts.ts      # Groq explanation prompt
│   │   └── governance.module.ts
│   └── widgets/app/
│       ├── capability-graph/          # Capability graph widget
│       └── attack-path-alert/         # Attack path alert widget
├── docs/screenshots/                  # Real rendered widget screenshots
├── scripts/
│   ├── test-mcp.sh                    # Stdio JSON-RPC smoke test
│   └── preview-widgets.html           # Local widget preview, no Studio needed
└── README.md
```

---

## 📜 License

[MIT](LICENSE)
