'use client';

import React, { useState } from 'react';
import { 
  Code2, 
  Layers, 
  Cloud, 
  Rocket, 
  Server, 
  Cpu, 
  Terminal, 
  Zap, 
  GitBranch, 
  Activity,
  Database,
  Lock,
  Globe,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ArrowRight,
  Presentation,
  Copy,
  Check,
  Bot,
  Brain,
  Sparkles
} from 'lucide-react';

export const AppDocumentationSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'aws_architecture' | 'ai_ml_deepdive' | 'ai_prompts_deck' | 'techstack' | 'futurescope'>('aws_architecture');
  const [isCloudFormationOpen, setIsCloudFormationOpen] = useState(false);
  const [copiedNapkin, setCopiedNapkin] = useState(false);
  const [copiedGamma, setCopiedGamma] = useState(false);

  const napkinPromptText = `Draw a clean, modern software architecture diagram for an "AI-Powered API Collection Runner & Test Engine":

1. User Device (Web Browser UI): Uploads Postman Collection & Environment files locally.
2. Local Memory Store & Secret Sanitizer Engine: Masks secret keys (passwords, tokens) to {{REDACTED_SECRET_LOCAL_ONLY}} locally.
3. Route A (AI Prompt Flow): Sends ONLY sanitized structural metadata over HTTPS to Google Gemini AI / AWS Bedrock AI to generate automated test scripts.
4. Route B (Target Execution Proxy): Substitutes actual secret keys locally and forwards raw HTTP requests (GET, POST, PUT, DELETE) to AWS Lambda Proxy / Next.js Server Proxy.
5. Target API Servers & Mainframe Endpoints: Returns HTTP responses (JSON or text/plain).
6. Live Telemetry Dashboard: Displays real-time pass/fail assertions, SLA latency charts, and secret isolation status.`;

  const gammaPromptText = `Create a 10-slide executive presentation for an enterprise "AI-Powered API Collection Runner & Test Engine".

Slide 1: Title & Executive Summary (Next.js 14, Local Secret Isolation, Gemini AI Test Generation)
Slide 2: The Enterprise Testing Bottleneck (Manual Postman script writing, CORS browser limits, secret key leakage risks)
Slide 3: Our Solution - AI-Powered Automated Test Runner & Live Telemetry
Slide 4: Zero-Trust Security Architecture (Local Secret Masking & Isolation Guarantee)
Slide 5: Automated & Natural Language Test Script Generation (HTTP Status Codes, Latency SLAs, Mainframe text/plain handling)
Slide 6: Dual Key Mode & Token Quota Management (User Key vs App Demo Key 3 Max)
Slide 7: Comprehensive Architecture & AWS Enterprise Production Cloud Mapping (Amplify, API Gateway, Lambda, Secrets Manager, Bedrock AI)
Slide 8: Real-Time Live Request Telemetry & Interactive Custom Rules Vault
Slide 9: ROI & Business Value Impact (85% reduction in test setup time, zero secret leaks)
Slide 10: Product Roadmap & Future Scope (GitHub Actions CI/CD, OpenAPI 3.0, Webhook Alerts, k6 Load Stress Testing)`;

  const copyToClipboard = (text: string, type: 'napkin' | 'gamma') => {
    navigator.clipboard.writeText(text);
    if (type === 'napkin') {
      setCopiedNapkin(true);
      setTimeout(() => setCopiedNapkin(false), 2000);
    } else {
      setCopiedGamma(true);
      setTimeout(() => setCopiedGamma(false), 2000);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-md shadow-xl flex flex-col space-y-6 overflow-hidden">
      
      {/* 1. Header Title & Subtitle Span Full 100% Width Above Tabs */}
      <div className="w-full border-b border-slate-800 pb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="h-5 w-5 text-indigo-400 shrink-0" />
          System Architecture, AI/ML Deep Dive & Cloud Deployment Guide
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Deep dive technical design, AI/Agentic AI architecture, AWS enterprise cloud deployment spec, visual prompts, and stakeholder presentation deck.
        </p>
      </div>

      {/* 2. Full-Width Sub-Navigation Tab Bar Below Header */}
      <div className="w-full flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-slate-950 border border-slate-800">
        {[
          { id: 'aws_architecture', label: '☁️ Architecture & AWS Cloud', icon: Cloud },
          { id: 'ai_ml_deepdive', label: '🧠 AI, Agentic AI & ML Deep Dive', icon: Brain },
          { id: 'ai_prompts_deck', label: '🎨 Visual Prompts & PPT Deck', icon: Presentation },
          { id: 'techstack', label: '</> Tech Stack & Decision Matrix', icon: Code2 },
          { id: 'futurescope', label: '🚀 Future Scope & Roadmap', icon: Rocket },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: SYSTEM ARCHITECTURE & AWS CLOUD DEPLOYMENT */}
      {activeTab === 'aws_architecture' && (
        <div className="space-y-6 text-xs text-slate-300">
          
          {/* Graphical AWS Infrastructure Diagram */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Cloud className="h-5 w-5 text-amber-400" /> Graphical AWS Cloud Production Architecture Diagram
              </h3>
              <span className="rounded bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                Zero-Trust VPC Isolated
              </span>
            </div>

            {/* Visual Node Flow */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center py-2">
              <div className="rounded-xl border border-indigo-900/60 bg-indigo-950/20 p-3.5 text-center space-y-1">
                <Globe className="h-6 w-6 text-indigo-400 mx-auto" />
                <div className="font-bold text-slate-200 text-xs">CloudFront CDN</div>
                <div className="text-[10px] text-slate-400">Global TLS Edge & DDoS WAF Shield</div>
              </div>

              <div className="hidden md:flex justify-center text-slate-600 font-bold">&rarr;</div>

              <div className="rounded-xl border border-purple-900/60 bg-purple-950/20 p-3.5 text-center space-y-1">
                <Server className="h-6 w-6 text-purple-400 mx-auto" />
                <div className="font-bold text-slate-200 text-xs">Amplify / ECS</div>
                <div className="text-[10px] text-slate-400">Next.js App Server (Auto-Scaling)</div>
              </div>

              <div className="hidden md:flex justify-center text-slate-600 font-bold">&rarr;</div>

              <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-3.5 text-center space-y-1">
                <Zap className="h-6 w-6 text-emerald-400 mx-auto" />
                <div className="font-bold text-slate-200 text-xs">API Gateway + Lambda</div>
                <div className="text-[10px] text-slate-400">Private VPC Proxy Runner</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-900">
              <div className="rounded-xl border border-amber-900/60 bg-amber-950/20 p-3 flex items-center space-x-3">
                <Lock className="h-6 w-6 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-slate-200 text-xs">AWS Secrets Manager</div>
                  <p className="text-[11px] text-slate-400">Encrypted store for environment credentials with KMS envelope encryption.</p>
                </div>
              </div>

              <div className="rounded-xl border border-purple-900/60 bg-purple-950/20 p-3 flex items-center space-x-3">
                <Cpu className="h-6 w-6 text-purple-400 shrink-0" />
                <div>
                  <div className="font-bold text-slate-200 text-xs">AWS Bedrock AI (Claude 3.5)</div>
                  <p className="text-[11px] text-slate-400">Private LLM foundation model endpoint inside private VPC subnet.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Collapsible CloudFormation IaC Block */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
            <button
              onClick={() => setIsCloudFormationOpen(!isCloudFormationOpen)}
              className="w-full flex items-center justify-between p-4 bg-slate-900/60 hover:bg-slate-900 transition-colors"
            >
              <span className="font-bold text-xs text-slate-200 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-indigo-400" /> 
                AWS CloudFormation Infrastructure-as-Code Spec (YAML)
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-indigo-400 font-semibold">
                {isCloudFormationOpen ? <>Collapse IaC Spec <ChevronUp className="h-4 w-4" /></> : <>Expand CloudFormation IaC Spec <ChevronDown className="h-4 w-4" /></>}
              </span>
            </button>

            {isCloudFormationOpen && (
              <div className="p-4 border-t border-slate-800">
                <pre className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-[11px] font-mono text-indigo-300 overflow-x-auto leading-relaxed max-h-72 custom-scrollbar">
{`AWSTemplateFormatVersion: '2010-09-09'
Description: 'AWS Infrastructure for Enterprise API Collection Runner'

Resources:
  RunnerAmplifyApp:
    Type: AWS::Amplify::App
    Properties:
      Name: api-collection-runner
      Repository: https://github.com/ved-agentic-ai/runner
      BuildSpec: |
        version: 1
        frontend:
          phases:
            build:
              commands: ['npm run build']
          artifacts:
            baseDirectory: .next
            files: ['**/*']

  SecretsVault:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: api-runner/environment-secrets
      Description: Encrypted store for API collection environment variables`}
                </pre>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: AI, AGENTIC AI & MACHINE LEARNING DEEP DIVE */}
      {activeTab === 'ai_ml_deepdive' && (
        <div className="space-y-6 text-xs text-slate-300">
          
          <div className="rounded-xl border border-indigo-800/80 bg-slate-950 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Brain className="h-5 w-5 text-indigo-400" /> Three Pillars of Artificial Intelligence in This Application
              </h3>
              <span className="rounded bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 text-[10px] font-bold">
                GenAI + Agentic Loop + ML Heuristics
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Pillar 1: Generative AI */}
              <div className="rounded-xl border border-purple-900/60 bg-purple-950/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-purple-400" /> 1. Generative AI (LLMs)
                  </span>
                  <span className="text-[10px] font-mono text-purple-400">Gemini 2.5</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Analyzes endpoint schemas (HTTP method, headers, URL paths, body payload structures) to generate 3–5 automated test rules in structured JSON mode (Status codes, SLAs, Header presence, JSON schema rules).
                </p>
                <div className="pt-2 border-t border-purple-900/40 text-[10px] text-purple-200">
                  <strong>Key Innovation:</strong> Pre-sanitizes secrets before LLM prompt dispatch.
                </div>
              </div>

              {/* Pillar 2: Agentic AI */}
              <div className="rounded-xl border border-indigo-900/60 bg-indigo-950/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-indigo-300 flex items-center gap-1.5">
                    <Bot className="h-4 w-4 text-indigo-400" /> 2. Agentic AI Execution Loop
                  </span>
                  <span className="text-[10px] font-mono text-indigo-400">Autonomous Agent</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  An autonomous execution agent that sequentially runs endpoint queues, inspects responses, automatically extracts dynamic auth tokens (e.g. <code className="text-indigo-300">accessToken</code> &rarr; <code className="text-indigo-300">&#123;&#123;authToken&#125;&#125;</code>), and cascades variable substitutions across dependent subtrees.
                </p>
                <div className="pt-2 border-t border-indigo-900/40 text-[10px] text-indigo-200">
                  <strong>Key Innovation:</strong> Self-healing execution queue with dynamic token extraction.
                </div>
              </div>

              {/* Pillar 3: Machine Learning & Heuristics */}
              <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-emerald-300 flex items-center gap-1.5">
                    <Cpu className="h-4 w-4 text-emerald-400" /> 3. ML & Smart Heuristics
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">Pattern Engine</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Natural language pattern matching engine that parses plain English criteria (e.g. <em>"Check rate limit 429 and latency under 300ms"</em>) into precise <code className="text-emerald-300">TestCaseRule</code> objects, alongside legacy Mainframe <code className="text-emerald-300">text/plain</code> schema validation.
                </p>
                <div className="pt-2 border-t border-emerald-900/40 text-[10px] text-emerald-200">
                  <strong>Key Innovation:</strong> Mainframe string parsing + 100% offline fallback reliability.
                </div>
              </div>

            </div>
          </div>

          {/* AI Workflow Process Diagram */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
            <h4 className="font-bold text-xs text-slate-200">Autonomous Agentic Execution Flow:</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-center text-xs">
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-2.5 space-y-1">
                <div className="font-bold text-indigo-400">Step 1: Sanitize</div>
                <div className="text-[10px] text-slate-400">Mask keys to &#123;&#123;REDACTED&#125;&#125;</div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-2.5 space-y-1">
                <div className="font-bold text-purple-400">Step 2: Generate</div>
                <div className="text-[10px] text-slate-400">LLM creates JSON test contract</div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-2.5 space-y-1">
                <div className="font-bold text-emerald-400">Step 3: Execute</div>
                <div className="text-[10px] text-slate-400">Server proxy executes HTTP requests</div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-2.5 space-y-1">
                <div className="font-bold text-amber-400">Step 4: Extract & Cascade</div>
                <div className="text-[10px] text-slate-400">Extracts tokens for next requests</div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: NAPKIN AI & GAMMA AI PROMPTS + STAKEHOLDER PPT DECK */}
      {activeTab === 'ai_prompts_deck' && (
        <div className="space-y-6 text-xs text-slate-300">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Napkin.ai Prompt Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-xs text-indigo-300 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-indigo-400" /> Napkin.ai Architecture Diagram Prompt
                </span>
                <button
                  onClick={() => copyToClipboard(napkinPromptText, 'napkin')}
                  className="inline-flex items-center space-x-1 rounded bg-indigo-950 border border-indigo-800 px-2 py-1 text-[10px] font-semibold text-indigo-300 hover:bg-indigo-900"
                >
                  {copiedNapkin ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedNapkin ? 'Copied!' : 'Copy Prompt'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Copy and paste this structured prompt into <strong>Napkin.ai</strong> to generate high-resolution visual network diagram graphics:
              </p>
              <pre className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-[10px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                {napkinPromptText}
              </pre>
            </div>

            {/* Gamma.app Prompt Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-xs text-purple-300 flex items-center gap-2">
                  <Presentation className="h-4 w-4 text-purple-400" /> Gamma.app Presentation Deck Prompt
                </span>
                <button
                  onClick={() => copyToClipboard(gammaPromptText, 'gamma')}
                  className="inline-flex items-center space-x-1 rounded bg-purple-950 border border-purple-800 px-2 py-1 text-[10px] font-semibold text-purple-300 hover:bg-purple-900"
                >
                  {copiedGamma ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedGamma ? 'Copied!' : 'Copy Prompt'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Copy and paste this structured prompt into <strong>Gamma.app</strong> to generate a complete slide presentation deck:
              </p>
              <pre className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-[10px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                {gammaPromptText}
              </pre>
            </div>

          </div>

          {/* Full 10-Slide Stakeholder Presentation Spec */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Presentation className="h-5 w-5 text-indigo-400" /> Executive Stakeholder Presentation Deck Structure (10 Slides)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-1">
                <span className="font-bold text-indigo-400 text-xs">Slide 1: Executive Title</span>
                <p className="text-slate-400 text-[11px]">AI-Powered API Collection Runner & Test Engine — Next-gen automated API testing with zero-trust local secret isolation.</p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-1">
                <span className="font-bold text-purple-400 text-xs">Slide 2: Enterprise Pain Points</span>
                <p className="text-slate-400 text-[11px]">Manual Postman test script writing overhead, browser CORS fetch restrictions, and high risk of secret key leakage over external LLM APIs.</p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-1">
                <span className="font-bold text-emerald-400 text-xs">Slide 3: Core Solution Overview</span>
                <p className="text-slate-400 text-[11px]">Next.js 14 serverless proxy runner paired with Gemini AI automated test assertion generator and live telemetry stream.</p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-1">
                <span className="font-bold text-amber-400 text-xs">Slide 4: Zero-Trust Security Model</span>
                <p className="text-slate-400 text-[11px]">Local client memory secret sanitizer guarantees secret keys never hit external LLM APIs over the wire.</p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-1">
                <span className="font-bold text-pink-400 text-xs">Slide 5: Automated & Mainframe Parsing</span>
                <p className="text-slate-400 text-[11px]">Handles Postman v2.0/v2.1 schemas, multi-level folder trees, JSON payloads, and legacy Mainframe text/plain responses cleanly.</p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-1">
                <span className="font-bold text-cyan-400 text-xs">Slide 6: Dual Key & Quota Telemetry</span>
                <p className="text-slate-400 text-[11px]">User Gemini API Key (Unlimited) vs App Demo Key (3 Max) with real-time token tracking and automatic local fallback on rate limits (429).</p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-1">
                <span className="font-bold text-indigo-400 text-xs">Slide 7: AWS Production Architecture</span>
                <p className="text-slate-400 text-[11px]">AWS Amplify, API Gateway + Lambda proxy inside private VPC, AWS Secrets Manager, and private AWS Bedrock AI foundation models.</p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-1">
                <span className="font-bold text-purple-400 text-xs">Slide 8: Custom Rules Vault</span>
                <p className="text-slate-400 text-[11px]">Natural language custom rule generator with Global, Folder, or Endpoint scope targeting and full inline CRUD editing control.</p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-1">
                <span className="font-bold text-emerald-400 text-xs">Slide 9: ROI & Business Value</span>
                <p className="text-slate-400 text-[11px]">85% reduction in manual API test script creation time, 100% compliance with corporate secret privacy standards.</p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-1">
                <span className="font-bold text-amber-400 text-xs">Slide 10: Product Roadmap</span>
                <p className="text-slate-400 text-[11px]">GitHub Actions CI/CD headless runner, OpenAPI 3.0 / Swagger importer, automated Slack webhooks, and AI-driven k6 stress testing.</p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 4: TECH STACK & COMPARATIVE DECISION MATRIX */}
      {activeTab === 'techstack' && (
        <div className="space-y-6 text-xs text-slate-300">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white flex items-center gap-2">
                  <Zap className="h-4 w-4 text-indigo-400" /> Next.js 14 (App Router)
                </span>
                <span className="rounded bg-indigo-950 text-indigo-400 border border-indigo-800 px-2 py-0.5 text-[10px] font-bold">
                  Chosen Framework
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Unifies React Server Components with serverless API proxy routes (<code className="text-indigo-300">/api/proxy-request</code>) to completely bypass browser CORS limitations while rendering high-speed UI.
              </p>
              <div className="pt-2 border-t border-slate-900 space-y-1 text-[11px]">
                <p><strong className="text-indigo-300">Why Chosen:</strong> Built-in serverless proxying, SSR/SSG optimization, zero separate backend deployment required.</p>
                <p><strong className="text-slate-400">Considered Alternatives:</strong> React SPA + Express.js backend (Requires 2 separate repos), Vite (Lacks built-in serverless proxy routes).</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-purple-400" /> Tailwind CSS & Framer Motion
                </span>
                <span className="rounded bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 text-[10px] font-bold">
                  Design System
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Delivers modern glassmorphism aesthetic (<code className="text-purple-300">#0b0f19</code> dark palette) with micro-interactions, responsive flex/grid layouts, and smooth modal overlays.
              </p>
              <div className="pt-2 border-t border-slate-900 space-y-1 text-[11px]">
                <p><strong className="text-purple-300">Why Chosen:</strong> Utility-first styling speed, zero runtime CSS-in-JS overhead, hardware-accelerated animations.</p>
                <p><strong className="text-slate-400">Considered Alternatives:</strong> Bootstrap (Outdated UI), Styled-Components (High runtime JS cost).</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white flex items-center gap-2">
                  <Database className="h-4 w-4 text-emerald-400" /> Zustand Global State Engine
                </span>
                <span className="rounded bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                  State Engine
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Manages collection hierarchy tree states, cascading checkbox selections, environment key-value maps, live execution queues, and telemetry stats.
              </p>
              <div className="pt-2 border-t border-slate-900 space-y-1 text-[11px]">
                <p><strong className="text-emerald-300">Why Chosen:</strong> Minimal 1KB footprint, unopinionated hook API, zero provider re-render penalties.</p>
                <p><strong className="text-slate-400">Considered Alternatives:</strong> Redux Toolkit (Boilerplate overhead), React Context API (Triggers global re-renders).</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-amber-400" /> Google Gemini API + Smart Fallback
                </span>
                <span className="rounded bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 text-[10px] font-bold">
                  AI Generator
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Analyzes endpoint schemas to generate automated assertion rules. Paired with a smart local heuristic engine for 100% offline fallback.
              </p>
              <div className="pt-2 border-t border-slate-900 space-y-1 text-[11px]">
                <p><strong className="text-amber-300">Why Chosen:</strong> Sub-second latency, structured JSON mode output, free tier accessibility.</p>
                <p><strong className="text-slate-400">Considered Alternatives:</strong> OpenAI GPT-4 (Higher cost per token), Manual JavaScript script writing (Time intensive).</p>
              </div>
            </div>

          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
            <h3 className="font-bold text-sm text-white">Comparative Architecture Decision Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="border-b border-slate-800 text-slate-400 text-[11px] uppercase font-bold">
                  <tr>
                    <th className="py-2 px-3">Architecture Layer</th>
                    <th className="py-2 px-3">Selected Technology</th>
                    <th className="py-2 px-3">Rejected Alternative</th>
                    <th className="py-2 px-3">Key Technical Justification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  <tr>
                    <td className="py-2 px-3 text-slate-300">CORS Bypass Proxy</td>
                    <td className="py-2 px-3 text-indigo-400">Next.js API Route Server Proxy</td>
                    <td className="py-2 px-3 text-slate-500">Browser Client Fetch / CORS AnyWhere</td>
                    <td className="py-2 px-3 text-slate-400 font-sans">Browser fetch fails on CORS restrictions; server proxy handles custom headers securely.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-slate-300">API Test Runner Engine</td>
                    <td className="py-2 px-3 text-emerald-400">Custom High-Speed Async Engine</td>
                    <td className="py-2 px-3 text-slate-500">Postman Newman CLI / Cypress</td>
                    <td className="py-2 px-3 text-slate-400 font-sans">Newman CLI requires Node child_process spawning; custom engine runs seamlessly in web/edge runtime.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-slate-300">Secret Isolation</td>
                    <td className="py-2 px-3 text-purple-400">Local Sanitizer + Placeholder Substitution</td>
                    <td className="py-2 px-3 text-slate-500">Raw Secret Prompting to LLM</td>
                    <td className="py-2 px-3 text-slate-400 font-sans">Guarantees secret keys and tokens never leave client memory or hit LLM API over the wire.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 5: FUTURE SCOPE & ROADMAP */}
      {activeTab === 'futurescope' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
            <span className="font-bold text-sm text-white flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-indigo-400" /> 1. GitHub Actions & GitLab CI/CD Pipeline
            </span>
            <p className="text-slate-400">Headless automated test runner for CI/CD pull request status gates.</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
            <span className="font-bold text-sm text-white flex items-center gap-2">
              <Globe className="h-4 w-4 text-purple-400" /> 2. OpenAPI 3.0, Swagger & GraphQL Importer
            </span>
            <p className="text-slate-400">Drag-and-drop import for OpenAPI 3.0 / Swagger YAML specs and GraphQL Introspection.</p>
          </div>
        </div>
      )}

    </div>
  );
};
