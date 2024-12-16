const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');

// Function to extract product links
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

// Function to extract category links
function extractCategoryLinks(htmlContent, baseUrl, originalDomain) {
    const $ = cheerio.load(htmlContent);
    const categoryLinks = new Set();

    const exclusionPatterns = [/\/about/, /\/contact/, /\/privacy/, /\/blog/, /mailto:/, /\.(zip|pdf|docx?)$/i];

    $('a').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
            const fullUrl = new URL(href, baseUrl).href;

            // Only include links within the original domain and exclude irrelevant paths
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

// Function to crawl a domain with enhanced filtering
async function crawlDomain(domain, maxDepth = 2, concurrency = 5) {
    console.log(`Starting crawl for domain: ${domain}`);
    const visited = new Set();
    const productUrls = new Set();
    let toVisit = [domain];

    for (let depth = 0; depth < maxDepth; depth++) {
        const nextToVisit = [];
        const promises = [];

        for (const url of toVisit) {
            if (visited.has(url)) continue;
            visited.add(url);

            promises.push(
                axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(response => {
                    if (response.status === 200) {
                        const htmlContent = response.data;

                        // Extract product links
                        const productLinks = extractProductLinks(htmlContent, url);
                        productLinks.forEach(link => productUrls.add(link));

                        // Extract category links for further crawling
                        if (depth < maxDepth - 1) {
                            const categoryLinks = extractCategoryLinks(htmlContent, url, domain);
                            nextToVisit.push(...categoryLinks);
                        }
                    }
                }).catch(error => {
                    console.error(`Error fetching ${url}: ${error.message}`);
                })
            );

            // Limit concurrency
            if (promises.length >= concurrency) {
                await Promise.all(promises);
                promises.length = 0;
            }
        }

        // Wait for remaining promises to resolve
        await Promise.all(promises);
        toVisit = [...new Set(nextToVisit)];
    }

    return Array.from(productUrls);
}

// Main function
async function main() {
    const domains = fs.readFileSync('domains.txt', 'utf-8').split('\n').map(domain => domain.trim());
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

main();


