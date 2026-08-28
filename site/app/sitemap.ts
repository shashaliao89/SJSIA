import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/about", "/events", "/team", "/plans"];
  return pages.map((path, index) => ({
    url: `https://sjsia.org${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/events" ? "weekly" : "monthly",
    priority: index === 0 ? 1 : path === "/events" ? 0.9 : 0.8,
  }));
}
