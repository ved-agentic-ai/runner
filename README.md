# 🚀 AI-Powered API Collection Runner & Dashboard

> **Intelligent, Automated Postman Collection Runner** powered by Next.js 14, Tailwind CSS, Framer Motion, and Google Gemini API with 100% Local Secret Isolation Guarantee & Live Traffic Telemetry. Built by **Ved Tripathi**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fved-agentic-ai%2Frunner)

---

## 🔒 100% Zero-Secret Git & Vercel Security Guarantee

- **Zero Hardcoded Keys**: No API keys, credentials, or secrets are hardcoded or committed to GitHub.
- **Client-Side Key Configuration**: Users enter their Gemini API key directly via the UI modal (`Configure AI API Key`) on the page.
- **Local Secret Masking**: Environment variable secrets are masked locally (`{{REDACTED_SECRET_LOCAL_ONLY}}`) before any AI test script prompt generation.

---

## ⚡ 1-Click Vercel Deployment

1. Click the **Deploy to Vercel** button above or import repository `https://github.com/ved-agentic-ai/runner.git` in [Vercel Dashboard](https://vercel.com/new).
2. Framework Preset: **Next.js**
3. Build Command: `npm run build`
4. Output Directory: `.next`
5. Click **Deploy**! No environment variables need to be set on Vercel.

---

## 🌟 Core Features & Capabilities

- **📁 File Upload & Postman Schema Parser**: Drag-and-drop Postman Collection JSON (v2.0 & v2.1) and Environment JSON. Preserves exact multi-level folder hierarchy (`Folders -> Subfolders -> Endpoints`).
- **🔐 Postman-Style Environment Variable Manager**: Interactive modal to view, edit, add, and mask sensitive secret keys (`apiKey`, `authToken`, `password`) locally.
- **🛡️ Legal Disclaimer & Creator Statement**: Standard developer portfolio statement on page load.
- **🤖 Automated AI Test Script Generation**: Uses Google Gemini API (`gemini-2.5-flash`) or built-in offline smart heuristic engine to generate validation rules (HTTP status codes, latency SLAs `<2000ms`, JSON schemas, content-type headers, and token extraction).
- **🌲 Hierarchical Tree View Selector**: Interactive multi-level checkbox selection with 1-click **Collapse All** and **Expand All** controls.
- **⚡ CORS-Bypass Proxy Engine & Real-Time Dashboard**: Next.js server route `/api/proxy-request` executes endpoints server-side to bypass browser CORS restrictions while recording real-time SLA metrics.
- **📡 Live Request Traffic & Routing Simulator**: Real-time traffic stream visualizer highlighting **Route A (Sanitized LLM Payload Path)** vs **Route B (Local Host Target API Proxy Path)**.
- **🪄 Custom AI Test Rules Vault**: Natural language custom rule generator with Global, Folder, or Endpoint scope targeting and full inline CRUD editing control.
- **📊 Native Microsoft PowerPoint (.pptx) Downloader**: 1-click native PowerPoint deck export for executive stakeholder presentations.
- **👤 Lead Developer**: **Ved Tripathi** ([vedmtripathi@gmail.com](mailto:vedmtripathi@gmail.com)).

---

## 🛠️ Tech Stack & Technical Justifications

| Architecture Layer | Selected Technology | Rejected Alternative | Key Technical Justification |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js 14 (App Router) | Express + React SPA | Next.js unifies SSR frontend with serverless API proxy routes (`/api/proxy-request`) in 1 project. |
| **CORS Bypass** | Server-Side Next.js API Route | Browser Client Fetch | Direct browser fetch fails on target API CORS restrictions; server proxy handles custom headers securely. |
| **Styling & UI** | Tailwind CSS + Framer Motion | Bootstrap / Styled-Components | Utility-first styling speed with zero CSS-in-JS runtime overhead and hardware-accelerated animations. |
| **State Engine** | Zustand | Redux Toolkit / Context API | Minimal 1KB footprint, unopinionated hook API, zero provider wrapper re-render penalties. |
| **AI Generator** | Google Gemini API + Offline Fallback | OpenAI GPT-4 / Newman CLI | Sub-second latency, structured JSON mode output, free tier availability, and 100% offline fallback reliability. |

---

## ☁️ AWS Cloud Production Architecture & Deployment

For enterprise production scaling on AWS, the architecture maps to serverless cloud infrastructure:

- **Frontend & App Hosting**: AWS Amplify / AWS ECS Fargate with CloudFront CDN distribution.
- **CORS Runner Proxy**: AWS API Gateway + AWS Lambda inside private VPC subnets.
- **Encrypted Secrets Vault**: AWS Secrets Manager with KMS envelope encryption (`aws/secretsmanager`).
- **Private LLM Test Generation**: AWS Bedrock (Claude 3.5 Sonnet / Titan) inside private VPC endpoint.
- **Observability**: AWS CloudWatch metrics & AWS X-Ray distributed trace timelines.

---

## 🚀 Getting Started Locally

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Open browser
http://localhost:3000
```

---

## 📜 License
MIT License - Built with ❤️ by **Ved Tripathi** ([vedmtripathi@gmail.com](mailto:vedmtripathi@gmail.com)).
