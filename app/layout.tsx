import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vkratim — AI-Powered API Collection Runner & Test Engine | Ved Tripathi",
  description: "Vkratim is a high-concurrency automated Postman Collection runner powered by Next.js 16, Tailwind CSS, and Google Gemini 1.5 Flash. 100% Zero-Trust Local Secret Isolation with CORS Bypass Proxy Engine.",
  keywords: [
    "Vkratim",
    "Vkratim.ai",
    "Vkratim API Runner",
    "API Collection Runner",
    "Postman Collection Automation",
    "AI Test Generator",
    "Gemini AI API Testing",
    "CORS Bypass Proxy",
    "API Telemetry Dashboard",
    "Ved Tripathi",
    "Next.js API Testing",
    "Zero Trust Secret Isolation"
  ],
  authors: [{ name: "Ved Tripathi", url: "https://github.com/ved-agentic-ai/runner" }],
  creator: "Ved Tripathi",
  openGraph: {
    title: "Vkratim — AI-Powered API Collection Runner & Test Engine",
    description: "Vkratim automates API testing with AI-generated test rules and zero secret leakage. CORS-bypass proxy runner with live SLA telemetry.",
    url: "https://vkratim.ai",
    siteName: "Vkratim APIRunner",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vkratim — AI-Powered API Collection Runner",
    description: "Automated Postman Collection testing with Gemini AI & Zero-Trust Secret Isolation.",
    creator: "@vedtripathi",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Vkratim — AI-Powered API Collection Runner & Test Engine",
    "url": "https://vkratim.ai",
    "author": {
      "@type": "Person",
      "name": "Ved Tripathi",
      "email": "vedmtripathi@gmail.com"
    },
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "All",
    "description": "Vkratim is an automated Postman Collection runner powered by Next.js 16, Gemini AI, and zero-trust local secret masking."
  };

  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0b0f19] text-slate-100 min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
