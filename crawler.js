const fs = require('fs');
const { chromium } = require('playwright'); // Playwright for browser automation
const cheerio = require('cheerio');
const { URL } = require('url');

function extractProductLinks(htmlContent, baseUrl) {
    const $ = cheerio.load(htmlContent);
    const productLinks = new Set();

    const productPatterns = [/\/product\//, /\/item\//, /\/p\//, /\/details\//, /\/prod\//];

    $('a').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
            const fullUrl = new URL(href, baseUrl).href;
            if (productPatterns.some(pattern => pattern.test(fullUrl))) {
                productLinks.add(fullUrl);
            }
        }
    });

    return productLinks;
}

function extractCategoryLinks(htmlContent, baseUrl, originalDomain) {
    const $ = cheerio.load(htmlContent);
    const categoryLinks = new Set();

    const exclusionPatterns = [/\/about/, /\/contact/, /\/privacy/, /\/blog/, /mailto:/, /\.(zip|pdf|docx?)$/i];

    $('a').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
            const fullUrl = new URL(href, baseUrl).href;
            if (
                fullUrl.startsWith(originalDomain) &&
                !exclusionPatterns.some(pattern => pattern.test(fullUrl))
            ) {
                categoryLinks.add(fullUrl);
            }
        }
    });

    return categoryLinks;
}

async function loadPageContent(url, browser) {
    const page = await browser.newPage();
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const content = await page.content();
        return content;
    } catch (error) {
        console.error(`Error loading page ${url}: ${error.message}`);
        return null;
    } finally {
        await page.close();
    }
}


async function crawlDomain(domain, maxDepth = 2, maxConcurrency = 10) {
    console.log(`Starting crawl for domain: ${domain}`);
    const visited = new Set();
    const productUrls = new Set();
    let toVisit = [domain];

    const browser = await chromium.launch({ headless: true });

    for (let depth = 0; depth < maxDepth; depth++) {
        const nextToVisit = new Set();

        await Promise.all(
            toVisit.slice(0, maxConcurrency).map(async (url) => {
                if (visited.has(url)) return;
                visited.add(url);

                const htmlContent = await loadPageContent(url, browser);
                if (!htmlContent) return;

                const productLinks = extractProductLinks(htmlContent, url);
                productLinks.forEach(link => productUrls.add(link));

                if (depth < maxDepth - 1) {
                    const categoryLinks = extractCategoryLinks(htmlContent, url, domain);
                    categoryLinks.forEach(link => nextToVisit.add(link));
                }
            })
        );

        toVisit = Array.from(nextToVisit);
    }

    await browser.close();
    return Array.from(productUrls);
}


async function main() {
    const domains = fs.readFileSync('domains.txt', 'utf-8')
        .split('\n')
        .map(domain => domain.trim())
        .filter(Boolean);

    const results = {};

    for (const domain of domains) {
        try {
            const productLinks = await crawlDomain(domain, 2, 10);
            results[domain] = productLinks;
            console.log(`Found ${productLinks.length} product URLs for ${domain}`);
        } catch (error) {
            console.error(`Error crawling ${domain}: ${error.message}`);
        }
    }

    fs.writeFileSync('output.json', JSON.stringify(results, null, 2));
    console.log('Crawl complete. Results saved to output.json.');
}

main().catch(error => console.error(`Fatal error: ${error.message}`));