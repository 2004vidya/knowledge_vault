import axios from "axios";
import { JSDOM } from "jsdom";
import ogs from "open-graph-scraper";
import { Readability } from "@mozilla/readability";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function extractContent(url) {
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