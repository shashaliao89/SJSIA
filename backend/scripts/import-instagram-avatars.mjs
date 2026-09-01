#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const inputPath = process.argv[2];
const outputDirectory = process.argv[3];
const resultPath = process.argv[4];
const delayMs = Number(process.env.INSTAGRAM_DELAY_MS ?? 1500);

if (!inputPath || !outputDirectory || !resultPath) {
  throw new Error("Usage: node import-instagram-avatars.mjs <input.json> <output-dir> <result.json>");
}

function decodeHtml(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function meta(html, property) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    if (!new RegExp(`(?:property|name)=["']${property.replace(":", "\\:")}["']`, "i").test(tag)) continue;
    const content = tag.match(/content=["']([^"']*)["']/i)?.[1];
    if (content) return decodeHtml(content.trim());
  }
  return null;
}

function handleFromUrl(value) {
  const url = new URL(value);
  if (!/(^|\.)instagram\.com$/i.test(url.hostname)) throw new Error("not_instagram_url");
  const handle = url.pathname.split("/").filter(Boolean)[0];
  if (!handle || !/^[A-Za-z0-9._]+$/.test(handle)) throw new Error("invalid_instagram_handle");
  return handle.toLowerCase();
}

async function importAvatar(item) {
  try {
    const handle = handleFromUrl(item.url);
    const profileResponse = await fetch(item.url, {
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; SJSIA-Member-Enrichment/1.0)",
        "accept-language": "en-US,en;q=0.9",
      },
    });
    if (!profileResponse.ok) throw new Error(`profile_http_${profileResponse.status}`);

    const imageUrl = meta(await profileResponse.text(), "og:image");
    if (!imageUrl) throw new Error("avatar_metadata_unavailable");

    const imageResponse = await fetch(imageUrl, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; SJSIA-Member-Enrichment/1.0)" },
    });
    if (!imageResponse.ok) throw new Error(`image_http_${imageResponse.status}`);
    const contentType = imageResponse.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) throw new Error("invalid_image_content_type");

    const bytes = Buffer.from(await imageResponse.arrayBuffer());
    if (bytes.length === 0 || bytes.length > 5_000_000) throw new Error("invalid_image_size");
    const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const filename = `${handle}.${extension}`;
    await fs.writeFile(path.join(outputDirectory, filename), bytes);
    return { ...item, ok: true, handle, filename, bytes: bytes.length };
  } catch (error) {
    return { ...item, ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

const input = JSON.parse(await fs.readFile(inputPath, "utf8"));
if (!Array.isArray(input)) throw new Error("Input must be an array");
await fs.mkdir(outputDirectory, { recursive: true });

const results = [];
for (const item of input) {
  results.push(await importAvatar(item));
  process.stdout.write(`${results.length}/${input.length} ${results.at(-1).ok ? "ok" : "failed"}\n`);
  if (delayMs > 0) await new Promise(resolve => setTimeout(resolve, delayMs));
}

await fs.writeFile(resultPath, `${JSON.stringify(results, null, 2)}\n`);
const successful = results.filter(item => item.ok).length;
process.stdout.write(`Imported ${successful}/${results.length} avatars\n`);
