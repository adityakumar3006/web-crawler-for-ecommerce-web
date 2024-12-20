# web-crawler-for-ecommerce-web
# Web Crawler Script

This script is a Node.js application designed to crawl specified domains, extract product links, and save the results to a JSON file. It uses the `axios` library for HTTP requests, `cheerio` for parsing and manipulating HTML, and `fs` for file system operations.

## Features

- Extracts product links based on predefined URL patterns.
- Identifies category links for further crawling within the same domain.
- Supports configurable depth and concurrency for efficient crawling.
- Filters out irrelevant links using exclusion patterns.
- Saves the extracted product URLs in a structured JSON file.

## Prerequisites

- Node.js installed on your machine.
- A `domains.txt` file in the root directory, containing one domain per line to crawl.

## Installation

1. Clone the repository or copy the script into a directory.
2. Navigate to the directory in your terminal.
3. Install the required dependencies by running:

   ```bash
   npm install axios cheerio
   ```

## Usage

1. Create a `domains.txt` file in the root directory. List the domains to crawl, one per line. For example:

   ```
   https://example.com
   https://anotherexample.com
   ```

2. Run the script using the following command:

   ```bash
   node script.js
   ```

   Replace `script.js` with the actual file name of the script (e.g., `webcrawler.js`).

3. The script will extract product links from the specified domains and save the results to `output.json` in the same directory.

## Configuration

- **Crawling Depth**: Adjust the `maxDepth` parameter in the `crawlDomain` function to control how deep the script should crawl.
- **Concurrency**: Modify the `concurrency` parameter in the `crawlDomain` function to change the number of concurrent requests allowed.
- **URL Patterns**: Update the `productPatterns` array in the `extractProductLinks` function to customize which links are identified as product URLs.
- **Exclusion Patterns**: Add or modify patterns in the `exclusionPatterns` array in the `extractCategoryLinks` function to filter out irrelevant links.

## Output

The script generates an `output.json` file containing the extracted product links. The structure of the file is as follows:

```json
{
  "https://example.com": [
    "https://example.com/product/123",
    "https://example.com/item/456"
  ],
  "https://anotherexample.com": [
    "https://anotherexample.com/p/789"
  ]
}
```
