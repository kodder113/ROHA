import type { MetadataRoute } from "next";
import { publicAppUrl } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = publicAppUrl();
  return ["", "/how-it-works", "/framework", "/features", "/pricing", "/about", "/contact", "/privacy", "/terms", "/demo", "/get-started"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: "monthly",
    priority: p === "" ? 1 : 0.7,
  }));
}
