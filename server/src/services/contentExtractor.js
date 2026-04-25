import axios from "axios";
import { JSDOM } from "jsdom";
import ogs from "open-graph-scraper";
import { Readability } from "@mozilla/readability";


async function extractContent(url) {
    try {
        // 1. Fetch HTML with proper headers
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: 10000
        })
        const html = response.data;

        // 2. Parse HTML using JSDOM
        const dom = new JSDOM(html, { url });

        // 3. Extract content using Readability
        const reader = new Readability(dom.window.document);
        const article = reader.parse();


        const { result } = await ogs({ url });

        return {
            title: article?.title || result.ogTitle || "",
            content: article?.textContent || "",
            metadata: {
                description: result.ogDescription || "",
                image: result.ogImage?.url || "",
                siteName: result.ogSiteName || ""
            }
        }

    } catch (error) {
        const errorMessage = error.response?.status 
            ? `HTTP ${error.response.status}: ${error.message}`
            : error.message;
        console.error(`Content extraction error for ${url}:`, errorMessage);

        return {
            title: "",
            content: "",
            metadata: {}
        };

    }

}

export default extractContent;