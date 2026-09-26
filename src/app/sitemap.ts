import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return ["", "/how-it-works", "/framework", "/features", "/pricing", "/about", "/contact", "/privacy", "/terms", "/demo", "/get-started"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: "monthly",
    priority: p === "" ? 1 : 0.7,
  }));
}
