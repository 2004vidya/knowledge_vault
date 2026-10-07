import axios from "axios";
import { JSDOM } from "jsdom";
import ogs from "open-graph-scraper";
import { Readability } from "@mozilla/readability";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Check if a URL is a YouTube link
function isYouTubeUrl(url) {
  return /youtube\.com|youtu\.be/i.test(url);
}

// Extract YouTube video ID from any YouTube URL format
function getYouTubeVideoId(url) {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
    return u.searchParams.get("v") || null;
  } catch {
    return null;
  }
}

// Dedicated YouTube extractor using oEmbed (free, no API key needed)
async function extractYouTubeContent(url) {
  try {
    const videoId = getYouTubeVideoId(url);
    const canonicalUrl = videoId
      ? `https://www.youtube.com/watch?v=${videoId}`
      : url;

    console.log(`📺 Extracting YouTube content for: ${canonicalUrl}`);

    // 1. oEmbed API — gives title + author, no key needed
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`;
    const { data: oembed } = await axios.get(oembedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
      timeout: 8000,
    });

    const title = oembed.title || "";
    const author = oembed.author_name || "";

    // 2. Build a rich content string from what we have
    const content = [
      title,
      author ? `Channel: ${author}` : "",
      `YouTube video — ${canonicalUrl}`,
    ]
      .filter(Boolean)
      .join("\n");

    console.log(`✅ YouTube extraction successful: "${title}" by ${author}`);

    return {
      title,
      content,
      url: canonicalUrl,
      metadata: {
        description: `${title} — by ${author}`,
        image: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "",
        siteName: "YouTube",
        author,
      },
    };
  } catch (error) {
    console.warn(`⚠️ YouTube oEmbed failed for ${url}:`, error.message);
    const videoId = getYouTubeVideoId(url);
    const fallbackTitle = videoId ? `YouTube Video (${videoId})` : "YouTube Video";
    const fallbackContent = `YouTube video: ${url}. ${fallbackTitle}`;
    return {
      title: fallbackTitle,
      content: fallbackContent,
      url,
      metadata: {
        description: `YouTube video link (${url})`,
        image: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "",
        siteName: "YouTube",
      },
    };
  }
}

async function extractContent(url) {
  // Route YouTube URLs to dedicated extractor (avoids 429 block)
  if (isYouTubeUrl(url)) {
    return extractYouTubeContent(url);
  }

  try {
    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.get(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate",
            DNT: "1",
            Connection: "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            Referer: "https://www.google.com/",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
          timeout: 10000,
          maxRedirects: 5,
        });

        if (response.status === 403) {
          lastError = new Error("HTTP 403: Access Denied");
          if (attempt < maxRetries) {
            console.log(
              `Retry ${attempt}/${maxRetries} for ${url} after 2s delay...`
            );
            await sleep(2000 * attempt);
            continue;
          }
        }

        const html = response.data;

        // Parse HTML using JSDOM
        const dom = new JSDOM(html, { url });

        // Extract content using Readability
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        // Try to extract OG metadata
        let ogMetadata = {};
        try {
          const { result } = await ogs({ url, timeout: 5000 });
          ogMetadata = result || {};
        } catch (ogError) {
          console.log(`OG metadata extraction failed for ${url}:`, ogError.message);
        }

        return {
          title: article?.title || ogMetadata.ogTitle || "",
          content: article?.textContent || "",
          url,
          metadata: {
            description: ogMetadata.ogDescription || "",
            image: ogMetadata.ogImage?.url || "",
            siteName: ogMetadata.ogSiteName || "",
          },
        };
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          const backoff = 2000 * attempt;
          console.log(
            `Attempt ${attempt}/${maxRetries} failed for ${url}, retrying in ${backoff}ms...`
          );
          await sleep(backoff);
        }
      }
    }

    // If all retries fail, return a minimal fallback
    console.warn(
      `Content extraction failed after ${maxRetries} attempts for ${url}:`,
      lastError?.message
    );
    return {
      title: "",
      content: "",
      url,
      metadata: {},
    };
  } catch (error) {
    console.error(`Unexpected error extracting content from ${url}:`, error.message);
    return {
      title: "",
      content: "",
      url,
      metadata: {},
    };
  }
}

export default extractContent;