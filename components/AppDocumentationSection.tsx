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
  Globe
} from 'lucide-react';

export const AppDocumentationSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'techstack' | 'aws_architecture' | 'futurescope'>('techstack');

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-md shadow-xl flex flex-col space-y-6">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-400" />
            System Architecture, Tech Stack & AWS Cloud Deployment Guide
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Deep dive technical design, framework comparison, AWS IaC deployment spec, and product roadmap.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs shrink-0">
          {[
            { id: 'techstack', label: 'Tech Stack & Alternatives', icon: Code2 },
            { id: 'aws_architecture', label: 'Architecture & AWS Cloud', icon: Cloud },
            { id: 'futurescope', label: 'Future Scope & Roadmap', icon: Rocket },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: TECH STACK & ALTERNATIVES */}
      {activeTab === 'techstack' && (
        <div className="space-y-6 text-xs text-slate-300">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Core Tech Item: Next.js 14 */}
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
                Used for full-stack unification. Next.js App Router provides server-side API proxy routes (`/api/proxy-request`) to completely bypass browser CORS limitations while rendering high-speed React Server Components.
              </p>
              <div className="pt-2 border-t border-slate-900 space-y-1 text-[11px]">
                <p><strong className="text-indigo-300">Why Chosen:</strong> Built-in serverless proxying, SSR/SSG optimization, and zero separate backend deployment required.</p>
                <p><strong className="text-slate-400">Considered Alternatives:</strong> React SPA + Express.js backend (Requires maintaining 2 separate repositories and deployments), Vite (Lacks serverless API proxy routes out of the box).</p>
              </div>
            </div>

            {/* Core Tech Item: Tailwind CSS & Framer Motion */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-purple-400" /> Tailwind CSS & Framer Motion
                </span>
                <span className="rounded bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 text-[10px] font-bold">
                  Design & Animation
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Delivers modern glassmorphism aesthetic (`#0b0f19` dark palette, glowing neon status badges) with micro-interactions, responsive flex/grid layouts, and smooth modal overlays.
              </p>
              <div className="pt-2 border-t border-slate-900 space-y-1 text-[11px]">
                <p><strong className="text-purple-300">Why Chosen:</strong> Utility-first styling speed, zero runtime CSS-in-JS overhead, hardware-accelerated animations.</p>
                <p><strong className="text-slate-400">Considered Alternatives:</strong> Bootstrap (Outdated aesthetics), Styled-Components (High runtime JS cost), Material-UI (Heavy bundle size).</p>
              </div>
            </div>

            {/* Core Tech Item: Zustand State Engine */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white flex items-center gap-2">
                  <Database className="h-4 w-4 text-emerald-400" /> Zustand Global State Engine
                </span>
                <span className="rounded bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                  State Management
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Manages collection hierarchy tree states, cascading checkbox selections, environment key-value maps, live execution queues, and telemetry stats.
              </p>
              <div className="pt-2 border-t border-slate-900 space-y-1 text-[11px]">
                <p><strong className="text-emerald-300">Why Chosen:</strong> Minimal 1KB footprint, unopinionated hook API, zero provider boilerplate wrapping.</p>
                <p><strong className="text-slate-400">Considered Alternatives:</strong> Redux Toolkit (Excessive boilerplate and action dispatch overhead), React Context API (Triggers unnecessary re-renders across entire tree).</p>
              </div>
            </div>

            {/* Core Tech Item: Google Gemini LLM API */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-amber-400" /> Google Gemini API + Smart Fallback
                </span>
                <span className="rounded bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 text-[10px] font-bold">
                  AI Test Generator
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Analyzes endpoint schemas to generate automated assertion rules (status code, latency SLA, JSON schema, headers). Paired with a smart local heuristic engine for 100% offline fallback.
              </p>
              <div className="pt-2 border-t border-slate-900 space-y-1 text-[11px]">
                <p><strong className="text-amber-300">Why Chosen:</strong> Sub-second latency, structured JSON mode output, free tier accessibility.</p>
                <p><strong className="text-slate-400">Considered Alternatives:</strong> OpenAI GPT-4 (Higher cost per token), Manual JavaScript script writing (Requires heavy developer time).</p>
              </div>
            </div>

          </div>

          {/* Comparative Tech Matrix Table */}
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

      {/* TAB 2: SYSTEM ARCHITECTURE & AWS CLOUD DEPLOYMENT */}
      {activeTab === 'aws_architecture' && (
        <div className="space-y-6 text-xs text-slate-300">
          
          {/* Architecture Overview */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Server className="h-4 w-4 text-indigo-400" /> End-to-End System Architecture Breakdown
            </h3>
            <p className="text-slate-400 leading-relaxed">
              The application separates <strong>AI Test Script Generation</strong> (Sanitized Structural Metadata &rarr; LLM API) from <strong>Endpoint Execution Proxying</strong> (Secrets substituted locally &rarr; Target Remote Server), achieving enterprise zero-trust security.
            </p>
          </div>

          {/* AWS Cloud Architecture Mapping */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Cloud className="h-5 w-5 text-amber-400" /> AWS Enterprise Cloud Production Architecture & Services
              </h3>
              <span className="rounded bg-amber-950 text-amber-300 border border-amber-800 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                Production Ready
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1.5">
                <span className="font-bold text-indigo-300 flex items-center gap-1.5 text-xs">
                  <Globe className="h-4 w-4 text-indigo-400" /> 1. Hosting: AWS Amplify / ECS Fargate
                </span>
                <p className="text-[11px] text-slate-400">
                  Deploys Next.js containerized app with global CloudFront CDN edge distribution, auto-scaling, and SSL/TLS termination.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1.5">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5 text-xs">
                  <Server className="h-4 w-4 text-emerald-400" /> 2. Proxy Engine: AWS API Gateway + Lambda
                </span>
                <p className="text-[11px] text-slate-400">
                  Serverless runner proxy endpoint `/api/proxy-request` running inside AWS Lambda inside private VPC subnet for high-concurrency CORS bypass.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1.5">
                <span className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                  <Lock className="h-4 w-4 text-amber-400" /> 3. Secrets Vault: AWS Secrets Manager / SSM
                </span>
                <p className="text-[11px] text-slate-400">
                  Stores team environment variable credentials with KMS envelope encryption (`aws/secretsmanager`) and IAM role RBAC control.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1.5">
                <span className="font-bold text-purple-300 flex items-center gap-1.5 text-xs">
                  <Cpu className="h-4 w-4 text-purple-400" /> 4. Private AI: AWS Bedrock (Claude 3.5 / Titan)
                </span>
                <p className="text-[11px] text-slate-400">
                  Replaces external public LLM APIs with private AWS Bedrock foundation models running inside dedicated VPC endpoint for zero data leakage.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1.5">
                <span className="font-bold text-pink-300 flex items-center gap-1.5 text-xs">
                  <Activity className="h-4 w-4 text-pink-400" /> 5. Observability: AWS CloudWatch & X-Ray
                </span>
                <p className="text-[11px] text-slate-400">
                  Real-time SLA latency metrics, HTTP status code distribution dashboards, and distributed X-Ray trace timelines for each endpoint execution.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1.5">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5 text-xs">
                  <GitBranch className="h-4 w-4 text-cyan-400" /> 6. IaC Deployment: AWS CloudFormation / CDK
                </span>
                <p className="text-[11px] text-slate-400">
                  Automated Infrastructure-as-Code templates defining VPC subnets, IAM roles, Lambda proxy functions, and CloudFront distributions in 1 command.
                </p>
              </div>

            </div>
          </div>

          {/* AWS CloudFormation IaC Template Snippet */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
            <h4 className="font-bold text-xs text-slate-200 flex items-center gap-2">
              <Terminal className="h-4 w-4 text-indigo-400" /> AWS CloudFormation Infrastructure-as-Code (YAML) Spec
            </h4>
            <pre className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-[11px] font-mono text-indigo-300 overflow-x-auto leading-relaxed">
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
      Description: Encrypted store for API collection environment variables

  BedrockAccessRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: lambda.amazonaws.com }
            Action: sts:AssumeRole`}
            </pre>
          </div>

        </div>
      )}

      {/* TAB 3: FUTURE SCOPE & ROADMAP */}
      {activeTab === 'futurescope' && (
        <div className="space-y-6 text-xs text-slate-300">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Feature 1 */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-indigo-400" /> 1. GitHub Actions & GitLab CI/CD Pipeline Integration
                </span>
                <span className="rounded bg-indigo-950 text-indigo-400 border border-indigo-800 px-2 py-0.5 text-[10px] font-bold">
                  Q3 2026
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Run automated Postman collection test suites headlessly inside GitHub Actions (`.github/workflows/api-test.yml`) or GitLab CI pipelines on every pull request with pass/fail status gates.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white flex items-center gap-2">
                  <Globe className="h-4 w-4 text-purple-400" /> 2. OpenAPI 3.0, Swagger & GraphQL Importer
                </span>
                <span className="rounded bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 text-[10px] font-bold">
                  Q4 2026
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Expand beyond Postman schemas by supporting direct drag-and-drop import of OpenAPI 3.0 / Swagger YAML specs and GraphQL Introspection JSONs to automatically build test suites.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400" /> 3. Automated Webhook Alerts (Slack, Discord, MS Teams)
                </span>
                <span className="rounded bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 text-[10px] font-bold">
                  Q4 2026
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Instant real-time webhook notifications to developer team channels when SLA latency targets fail or critical endpoints return 5xx errors.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" /> 4. AI-Driven k6 & Locust Load Stress Testing
                </span>
                <span className="rounded bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                  Q1 2027
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Convert Postman collection runs into high-concurrency load stress tests generating thousands of virtual users (VUs) to benchmark API breaking points.
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
