import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { publicAppUrl } from "@/lib/env";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const serif = Source_Serif_4({ variable: "--font-serif-display", subsets: ["latin"], display: "swap", weight: ["400", "600", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL(publicAppUrl()),
  title: {
    default: "ROHA — Rodrik Organizational Health Assessment",
    template: "%s · ROHA",
  },
  description:
    "ROHA transforms employee perspectives into organizational intelligence—helping leaders understand their people, identify opportunities, and make more informed decisions. A Rodrik Consulting LLC product.",
  applicationName: "ROHA",
  authors: [{ name: "Rodrik Consulting LLC", url: "https://rodrikconsulting.com" }],
  openGraph: {
    title: "ROHA — Rodrik Organizational Health Assessment",
    description: "Organizational Intelligence. Human-Centered Leadership.",
    siteName: "ROHA",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a1a36",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white text-ink">{children}</body>
    </html>
  );
}
