import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const robotsParser = require('robots-parser');
import { lookup } from 'dns/promises';
import { URL } from 'url';

// --- Security Configuration ---

const BLOCKED_IPS = [
    '127.0.0.1', 'localhost',
    '0.0.0.0', '::1',
    '10.', '172.16.', '192.168.',  // Private ranges
    '169.254.169.254'               // AWS/Cloud metadata
];

const INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?previous\s+instructions?/i,
    /system\s+prompt:?/i,
    /you\s+are\s+now\s+(a|an|in)/i,
    /disregard\s+(all\s+)?prior/i,
    /new\s+instructions?:/i,
    /override\s+previous/i
];

const MAX_CONTENT_LENGTH = 50000;
const MIN_CONTENT_LENGTH = 100;
const REQUEST_TIMEOUT = 30000; // 30 seconds

// --- Helper Functions ---

const isPrivateIP = (ip: string): boolean => {
    // Basic check for private IP ranges
    // In a real production env, use a library like 'ipaddr.js' for robust checking
    if (ip === 'localhost' || ip === '::1') return true;

    const parts = ip.split('.');
    if (parts.length !== 4) return false; // Not IPv4 (simplified)

    const first = parseInt(parts[0], 10);
    const second = parseInt(parts[1], 10);

    if (first === 10) return true;
    if (first === 172 && second >= 16 && second <= 31) return true;
    if (first === 192 && second === 168) return true;
    if (first === 127) return true;
    if (first === 169 && second === 254) return true;
    if (first === 0) return true;

    return false;
};

const validateUrlSecurity = async (url: string): Promise<void> => {
    const urlObj = new URL(url);

    // 1. Scheme Check
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Only HTTP and HTTPS URLs are supported');
    }

    // 2. DNS Resolution & IP Check (SSRF Protection)
    try {
        const lookupResult = await lookup(urlObj.hostname);
        if (isPrivateIP(lookupResult.address)) {
            throw new Error('Access to private or local network resources is blocked');
        }
    } catch (error: any) {
        if (error.message.includes('Access to private')) throw error;
        // If DNS fails, we can't fetch anyway, but let fetch handle it or throw
        // throw new Error(`DNS resolution failed: ${error.message}`);
    }
};

const checkRobotsTxt = async (url: string): Promise<void> => {
    try {
        const urlObj = new URL(url);
        const robotsUrl = `${urlObj.origin}/robots.txt`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout for robots.txt

        const response = await fetch(robotsUrl, {
            signal: controller.signal,
            headers: { 'User-Agent': 'ChatArbor-Bot/1.0' }
        });
        clearTimeout(timeout);

        if (response.ok) {
            const robotsTxt = await response.text();
            const robots = robotsParser(robotsUrl, robotsTxt);
            if (!robots.isAllowed(url, 'ChatArbor-Bot')) {
                throw new Error('Access denied by robots.txt');
            }
        }
    } catch (error) {
        // If robots.txt fails or doesn't exist, we usually proceed (fail open) 
        // or fail closed depending on strictness. Here we proceed but log warning.
        console.warn(`Robots.txt check failed for ${url}, proceeding...`);
    }
};

const containsSuspiciousInstructions = (text: string): boolean => {
    return INJECTION_PATTERNS.some(pattern => pattern.test(text));
};

// --- Main Scraper Function ---

export const scrapeUrl = async (url: string): Promise<{
    success: boolean;
    message?: string;
    content?: string;
}> => {
    try {
        // 1. Security Validation
        await validateUrlSecurity(url);

        // 2. Robots.txt Check
        await checkRobotsTxt(url);

        // 3. Fetch Content
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'ChatArbor-Bot/1.0 (+https://chatarbor.com/bot)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });
        clearTimeout(timeout);

        if (!response.ok) {
            return {
                success: false,
                message: `Failed to fetch URL: ${response.status} ${response.statusText}`
            };
        }

        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('text/html')) {
            return {
                success: false,
                message: 'URL must point to an HTML page'
            };
        }

        const html = await response.text();

        // 4. Parse & Extract Content (Readability)
        const dom = new JSDOM(html, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        if (!article || !article.textContent) {
            return {
                success: false,
                message: 'Could not extract readable content from this page'
            };
        }

        // 5. Sanitize & Filter
        // Readability already strips most hidden content. 
        // We grab textContent to strip HTML tags.
        let cleanText = article.textContent
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();

        // Length Validation
        if (cleanText.length < MIN_CONTENT_LENGTH) {
            return { success: false, message: 'Content too short to be useful' };
        }
        if (cleanText.length > MAX_CONTENT_LENGTH) {
            return { success: false, message: 'Content too large (exceeds limit)' };
        }

        // Injection Detection
        if (containsSuspiciousInstructions(cleanText)) {
            console.warn(`[SECURITY] Blocked prompt injection attempt from ${url}`);
            return {
                success: false,
                message: 'Content flagged by security filter (suspicious instructions detected)'
            };
        }

        return {
            success: true,
            content: cleanText
        };

    } catch (error: any) {
        if (error.name === 'AbortError') {
            return { success: false, message: 'Request timed out' };
        }
        return {
            success: false,
            message: error.message || 'Failed to scrape URL'
        };
    }
};
