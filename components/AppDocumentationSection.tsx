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
  ArrowRight
} from 'lucide-react';

export const AppDocumentationSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'techstack' | 'aws_architecture' | 'futurescope'>('aws_architecture');
  const [isCloudFormationOpen, setIsCloudFormationOpen] = useState(false);

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
            { id: 'aws_architecture', label: 'Architecture & AWS Cloud', icon: Cloud },
            { id: 'techstack', label: 'Tech Stack & Alternatives', icon: Code2 },
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
              
              {/* Node 1 */}
              <div className="rounded-xl border border-indigo-900/60 bg-indigo-950/20 p-3.5 text-center space-y-1">
                <Globe className="h-6 w-6 text-indigo-400 mx-auto" />
                <div className="font-bold text-slate-200 text-xs">CloudFront CDN</div>
                <div className="text-[10px] text-slate-400">Global TLS Edge & DDoS WAF Shield</div>
              </div>

              <div className="hidden md:flex justify-center text-slate-600 font-bold">
                &rarr;
              </div>

              {/* Node 2 */}
              <div className="rounded-xl border border-purple-900/60 bg-purple-950/20 p-3.5 text-center space-y-1">
                <Server className="h-6 w-6 text-purple-400 mx-auto" />
                <div className="font-bold text-slate-200 text-xs">Amplify / ECS</div>
                <div className="text-[10px] text-slate-400">Next.js App Server (Auto-Scaling)</div>
              </div>

              <div className="hidden md:flex justify-center text-slate-600 font-bold">
                &rarr;
              </div>

              {/* Node 3 */}
              <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-3.5 text-center space-y-1">
                <Zap className="h-6 w-6 text-emerald-400 mx-auto" />
                <div className="font-bold text-slate-200 text-xs">API Gateway + Lambda</div>
                <div className="text-[10px] text-slate-400">Private VPC Proxy Runner</div>
              </div>

            </div>

            {/* Sub-Node Row: Secrets & Bedrock AI */}
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

          {/* AWS Cloud Service Mapping Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1">
              <span className="font-bold text-indigo-300 flex items-center gap-1.5 text-xs">
                <Globe className="h-4 w-4 text-indigo-400" /> 1. App Hosting
              </span>
              <p className="text-[11px] text-slate-400">AWS Amplify / ECS Fargate container auto-scaling with CloudFront CDN distribution.</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1">
              <span className="font-bold text-emerald-300 flex items-center gap-1.5 text-xs">
                <Server className="h-4 w-4 text-emerald-400" /> 2. Proxy Engine
              </span>
              <p className="text-[11px] text-slate-400">AWS API Gateway + Lambda serverless runner proxy inside private VPC subnet.</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1">
              <span className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                <Lock className="h-4 w-4 text-amber-400" /> 3. Secrets Vault
              </span>
              <p className="text-[11px] text-slate-400">AWS Secrets Manager storing encrypted environment variables with KMS envelope encryption.</p>
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
                {isCloudFormationOpen ? (
                  <>Collapse IaC Spec <ChevronUp className="h-4 w-4" /></>
                ) : (
                  <>Expand CloudFormation IaC Spec <ChevronDown className="h-4 w-4" /></>
                )}
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
            )}
          </div>

        </div>
      )}

      {/* TAB 2: TECH STACK & ALTERNATIVES */}
      {activeTab === 'techstack' && (
        <div className="space-y-6 text-xs text-slate-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Zap className="h-4 w-4 text-indigo-400" /> Next.js 14 (App Router)
              </span>
              <p className="text-slate-400 leading-relaxed">
                Unifies React Server Components with serverless API proxy routes (`/api/proxy-request`) to completely bypass browser CORS limitations.
              </p>
              <div className="pt-2 border-t border-slate-900 text-[11px]">
                <p><strong className="text-indigo-300">Why Chosen:</strong> Built-in serverless proxying, SSR/SSG optimization, zero separate backend deployment.</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-400" /> Tailwind CSS & Framer Motion
              </span>
              <p className="text-slate-400 leading-relaxed">
                Delivers modern glassmorphism aesthetic (`#0b0f19` dark palette) with micro-interactions and smooth modal overlays.
              </p>
              <div className="pt-2 border-t border-slate-900 text-[11px]">
                <p><strong className="text-purple-300">Why Chosen:</strong> Utility-first styling speed, zero CSS-in-JS runtime overhead.</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Database className="h-4 w-4 text-emerald-400" /> Zustand Global State Engine
              </span>
              <p className="text-slate-400 leading-relaxed">
                Manages collection hierarchy tree states, cascading checkbox selections, environment variables, and live telemetry stats.
              </p>
              <div className="pt-2 border-t border-slate-900 text-[11px]">
                <p><strong className="text-emerald-300">Why Chosen:</strong> Minimal 1KB footprint, unopinionated hook API, zero provider wrapper re-render penalties.</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Cpu className="h-4 w-4 text-amber-400" /> Google Gemini API + Smart Fallback
              </span>
              <p className="text-slate-400 leading-relaxed">
                Generates automated assertion rules. Paired with a smart local heuristic engine for 100% offline fallback.
              </p>
              <div className="pt-2 border-t border-slate-900 text-[11px]">
                <p><strong className="text-amber-300">Why Chosen:</strong> Sub-second latency, structured JSON mode output, free tier accessibility.</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: FUTURE SCOPE & ROADMAP */}
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
