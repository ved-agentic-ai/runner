'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Presentation, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Sparkles,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import pptxgen from 'pptxgenjs';

export const PresentationDeckModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const slides = [
    {
      id: 1,
      title: 'Slide 1: Title & Executive Summary',
      subtitle: 'AI-Powered API Collection Runner & Test Engine',
      points: [
        'Automated Postman Collection runner built with Next.js 14, Tailwind CSS, and Google Gemini API.',
        'Features 100% Local Secret Isolation Guarantee — secrets are masked locally before AI script generation.',
        'Eliminates manual Postman assertion coding while bypassing browser CORS fetch restrictions.'
      ]
    },
    {
      id: 2,
      title: 'Slide 2: Enterprise Testing Pain Points',
      subtitle: 'Current Operational & Security Challenges',
      points: [
        'Manual Script Writing: Writing post-response JavaScript test assertions for hundreds of endpoints takes weeks.',
        'CORS Browser Limitations: Standard web apps cannot make cross-origin HTTP calls with custom headers directly.',
        'Secret Key Leakage Risk: Sending raw Postman environment variables (API tokens, passwords) to public LLM APIs violates corporate compliance.'
      ]
    },
    {
      id: 3,
      title: 'Slide 3: Core Solution & Platform Architecture',
      subtitle: 'Next-Gen Automated API Execution Platform',
      points: [
        'Next.js 14 Serverless Proxy Routes: /api/proxy-request executes requests server-side to bypass CORS securely.',
        'Gemini AI Test Engine: Automatically generates HTTP status, SLA latency, header, and JSON schema assertions.',
        'Live Telemetry Dashboard: Real-time latency charts, pass/fail assertions, and cURL export generation.'
      ]
    },
    {
      id: 4,
      title: 'Slide 4: Zero-Trust Security & Secret Isolation',
      subtitle: 'Corporate Privacy Guarantee',
      points: [
        'Local Client Sanitizer: Replaces all password, token, and authorization headers with {{REDACTED_SECRET_LOCAL_ONLY}} before sending prompts.',
        'Local Substitution: Environment secrets are substituted strictly in client memory during local proxy execution.',
        'Zero Secret Transmit: Guarantees secrets never leave client memory or hit external LLM APIs.'
      ]
    },
    {
      id: 5,
      title: 'Slide 5: Multi-Schema & Mainframe Text Support',
      subtitle: 'Legacy & Modern Microservices Compatibility',
      points: [
        'Postman Schemas: Complete v2.0 and v2.1 collection and environment JSON parsing preserving folder hierarchies.',
        'Mainframe Text Support: Legacy text/plain and HTML APIs validate text string payloads without false-positive JSON parse failures.',
        'HTTP 20x Flexibility: Flexible status assertions for POST requests returning 200 OK or 201 Created.'
      ]
    },
    {
      id: 6,
      title: 'Slide 6: Dual Key Mode & Rate Limit Quota Engine',
      subtitle: 'Cost & Usage Management',
      points: [
        'User Key Mode: User-provided Gemini API key grants unlimited dynamic AI generations.',
        'App Demo Key Mode: Default demo mode allows 3 API calls max before switching to local offline fallback.',
        'Live Token Monitor: Real-time progress bar tracking requests used, token usage estimates, and rate limit status.'
      ]
    },
    {
      id: 7,
      title: 'Slide 7: Enterprise AWS Cloud Production Architecture',
      subtitle: 'Production Infrastructure Mapping',
      points: [
        'Hosting: AWS Amplify / ECS Fargate with CloudFront CDN edge distribution.',
        'Proxy Execution: AWS API Gateway + AWS Lambda running inside private VPC subnets.',
        'Secrets & AI: AWS Secrets Manager with KMS encryption + Private AWS Bedrock AI foundation models.'
      ]
    },
    {
      id: 8,
      title: 'Slide 8: Interactive Custom AI Rules Vault',
      subtitle: 'Natural Language Rule Customization',
      points: [
        'Natural Language Generation: Type rules in plain English (e.g. "Check rate limit 429 and latency < 300ms").',
        'Target Scope Control: Apply custom rules Globally, per Folder, or to a specific Endpoint.',
        'Full CRUD Editing: Edit description, expected status codes, or delete rules inline.'
      ]
    },
    {
      id: 9,
      title: 'Slide 9: ROI & Business Value Impact',
      subtitle: 'Measurable Value Proposition',
      points: [
        '85% Time Savings: Reduces API test creation time from 40 hours per sprint to under 5 minutes.',
        '100% Security Compliance: Guarantees zero secret leaks across external AI endpoints.',
        'Improved API Reliability: Catches SLA regressions and contract breaks before deployment.'
      ]
    },
    {
      id: 10,
      title: 'Slide 10: Product Roadmap & Future Scope',
      subtitle: 'Strategic Milestones',
      points: [
        'Q3 2026: GitHub Actions & GitLab CI/CD Headless Pipeline Runner.',
        'Q4 2026: OpenAPI 3.0, Swagger YAML, and GraphQL Introspection Importer.',
        'Q1 2027: AI-Driven k6 & Locust Load Stress Testing.'
      ]
    }
  ];

  // Native Microsoft PowerPoint (.pptx) Generator
  const handleDownloadNativePptx = async () => {
    try {
      setIsExporting(true);
      const pres = new pptxgen();

      pres.layout = 'LAYOUT_16x9';
      pres.title = 'AI-Powered API Collection Runner & Test Engine';
      pres.subject = 'Executive Stakeholder Presentation';
      pres.author = 'Ved Tripathi';

      // Define Slide Theme Colors
      const bgColor = '0B0F19';
      const titleColor = '818CF8';
      const subtitleColor = 'CBD5E1';
      const textColor = '94A3B8';

      slides.forEach((s) => {
        const slide = pres.addSlide();
        
        // Background
        slide.background = { color: bgColor };

        // Header Title
        slide.addText(s.title, {
          x: 0.8,
          y: 0.6,
          w: 8.4,
          h: 0.6,
          fontSize: 22,
          bold: true,
          color: titleColor,
          fontFace: 'Arial'
        });

        // Subtitle
        slide.addText(s.subtitle, {
          x: 0.8,
          y: 1.2,
          w: 8.4,
          h: 0.4,
          fontSize: 14,
          italic: true,
          color: subtitleColor,
          fontFace: 'Arial'
        });

        // Bullet points
        const textItems = s.points.map((pt) => ({
          text: pt,
          options: { fontSize: 13, color: textColor, bullet: true, breakLine: true }
        }));

        slide.addText(textItems, {
          x: 0.8,
          y: 1.8,
          w: 8.4,
          h: 4.5,
          fontFace: 'Arial',
          lineSpacing: 24
        });

        // Footer Brand Note
        slide.addText('API Collection Runner | Prepared by Ved Tripathi (vedmtripathi@gmail.com)', {
          x: 0.8,
          y: 6.8,
          w: 8.4,
          h: 0.3,
          fontSize: 9,
          color: '64748B',
          fontFace: 'Arial'
        });
      });

      await pres.writeFile({ fileName: 'API_Collection_Runner_Presentation.pptx' });
      setIsExporting(false);
    } catch (err) {
      console.error('PPTX Export error:', err);
      setIsExporting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl flex flex-col space-y-5 max-h-[88vh] overflow-y-auto custom-scrollbar my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Presentation className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Executive Presentation Deck ({slides.length} Interactive Slides)
              </h2>
              <p className="text-xs text-slate-400">
                Executable stakeholder presentation deck created by Ved Tripathi.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadNativePptx}
              disabled={isExporting}
              className="inline-flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-amber-600/30 hover:from-amber-500 hover:to-red-500 active:scale-95 transition-all disabled:opacity-50"
            >
              <Download className={`h-3.5 w-3.5 ${isExporting ? 'animate-spin' : ''}`} />
              <span>{isExporting ? 'Exporting PPTX...' : 'Download Microsoft PPT (.pptx)'}</span>
            </button>

            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Slide Display Area */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-4 min-h-[300px]">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="font-bold text-base text-indigo-300">
                {slides[currentSlide - 1].title}
              </h3>
              <p className="text-xs text-slate-400">
                {slides[currentSlide - 1].subtitle}
              </p>
            </div>
            <span className="rounded bg-indigo-950 text-indigo-400 border border-indigo-800 px-2.5 py-1 text-xs font-bold font-mono">
              Slide {currentSlide} / {slides.length}
            </span>
          </div>

          <ul className="space-y-3 pt-2 text-xs text-slate-300">
            {slides[currentSlide - 1].points.map((pt, idx) => (
              <li key={idx} className="flex items-start space-x-2 leading-relaxed">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Slide Navigation Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={() => setCurrentSlide(Math.max(1, currentSlide - 1))}
            disabled={currentSlide === 1}
            className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <div className="flex space-x-1">
            {slides.map((s) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlide(s.id)}
                className={`h-2 rounded-full transition-all ${
                  currentSlide === s.id ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-800 hover:bg-slate-700'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentSlide(Math.min(slides.length, currentSlide + 1))}
            disabled={currentSlide === slides.length}
            className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-40"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-indigo-950 to-purple-950 border border-indigo-700/60 px-3 py-1.5 text-xs font-semibold text-indigo-200 hover:from-indigo-900 hover:to-purple-900 transition-all shadow-md whitespace-nowrap"
      >
        <Presentation className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
        <span>Launch Stakeholder PPT</span>
      </button>

      {isOpen && mounted && createPortal(modalContent, document.body)}
    </>
  );
};
