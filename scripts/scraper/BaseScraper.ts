import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import pLimit from 'p-limit';
import puppeteer, { Browser, Page } from 'puppeteer';

export interface FloorPlanMetadata {
  id: string;
  source: string;
  sourceUrl: string;
  imageUrl: string;
  localImagePath?: string;
  squareFootage?: number;
  bedrooms?: number;
  bathrooms?: number;
  stories?: number;
  width?: number;
  depth?: number;
  style?: string;
  description?: string;
  scrapedAt: string;
}

export abstract class BaseScraper {
  protected sourceName: string;
  protected baseUrl: string;
  protected outputDir: string;
  protected metadataDir: string;
  protected rateLimit: number; // milliseconds between requests
  protected maxConcurrent: number;
  protected limit: ReturnType<typeof pLimit>;
  protected scraped: number = 0;
  protected failed: number = 0;
  protected browser: Browser | null = null;

  constructor(sourceName: string, baseUrl: string, options?: {
    rateLimit?: number;
    maxConcurrent?: number;
  }) {
    this.sourceName = sourceName;
    this.baseUrl = baseUrl;
    this.outputDir = path.join(process.cwd(), 'data/floor-plans/images', sourceName);
    this.metadataDir = path.join(process.cwd(), 'data/floor-plans/metadata', sourceName);
    this.rateLimit = options?.rateLimit || 2000; // 2 seconds default
    this.maxConcurrent = options?.maxConcurrent || 3;
    this.limit = pLimit(this.maxConcurrent);
  }

  /**
   * Initialize directories and browser
   */
  async init() {
    await fs.mkdir(this.outputDir, { recursive: true });
    await fs.mkdir(this.metadataDir, { recursive: true });

    // Launch Puppeteer browser for JavaScript rendering
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    console.log(`✅ Initialized ${this.sourceName} scraper`);
    console.log(`📁 Images: ${this.outputDir}`);
    console.log(`📄 Metadata: ${this.metadataDir}`);
    console.log(`🌐 Browser: Puppeteer launched`);
  }

  /**
   * Close browser
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🌐 Browser closed');
    }
  }

  /**
   * Fetch a page with proper headers and rate limiting
   */
  protected async fetchPage(url: string): Promise<cheerio.CheerioAPI | null> {
    try {
      await this.delay(this.rateLimit);

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 30000,
      });

      return cheerio.load(response.data);
    } catch (error: any) {
      console.error(`❌ Failed to fetch ${url}:`, error.message);
      return null;
    }
  }

  /**
   * Fetch a page using Puppeteer (for JavaScript-rendered content)
   */
  protected async fetchPageWithBrowser(url: string, waitForSelector?: string): Promise<cheerio.CheerioAPI | null> {
    if (!this.browser) {
      console.error('❌ Browser not initialized. Call init() first.');
      return null;
    }

    let page: Page | null = null;
    try {
      await this.delay(this.rateLimit);

      page = await this.browser.newPage();

      // Set viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      // Navigate to page
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait for specific selector if provided
      if (waitForSelector) {
        await page.waitForSelector(waitForSelector, { timeout: 10000 });
      }

      // Get the rendered HTML
      const html = await page.content();

      return cheerio.load(html);
    } catch (error: any) {
      console.error(`❌ Failed to fetch ${url} with browser:`, error.message);
      return null;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  /**
   * Download and process an image
   */
  protected async downloadImage(
    imageUrl: string,
    planId: string
  ): Promise<string | null> {
    try {
      await this.delay(this.rateLimit / 2); // Half rate limit for images

      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Referer': this.baseUrl,
        },
        timeout: 30000,
      });

      // Determine file extension
      const contentType = response.headers['content-type'];
      let ext = '.jpg';
      if (contentType?.includes('png')) ext = '.png';
      if (contentType?.includes('webp')) ext = '.webp';

      const filename = `${planId}${ext}`;
      const filepath = path.join(this.outputDir, filename);

      // Process and resize image to max 2048px width/height
      await sharp(response.data)
        .resize(2048, 2048, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 90 })
        .toFile(filepath);

      console.log(`  📸 Downloaded: ${filename}`);
      return filename;
    } catch (error: any) {
      console.error(`  ❌ Failed to download image ${imageUrl}:`, error.message);
      return null;
    }
  }

  /**
   * Save metadata as JSON
   */
  protected async saveMetadata(metadata: FloorPlanMetadata): Promise<void> {
    try {
      const filename = `${metadata.id}.json`;
      const filepath = path.join(this.metadataDir, filename);
      await fs.writeFile(filepath, JSON.stringify(metadata, null, 2));
    } catch (error: any) {
      console.error(`❌ Failed to save metadata for ${metadata.id}:`, error.message);
    }
  }

  /**
   * Rate limiting delay
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Parse numeric value from string
   */
  protected parseNumber(value: string | undefined): number | undefined {
    if (!value) return undefined;
    const num = parseFloat(value.replace(/[^\d.]/g, ''));
    return isNaN(num) ? undefined : num;
  }

  /**
   * Get summary stats
   */
  getSummary() {
    return {
      source: this.sourceName,
      scraped: this.scraped,
      failed: this.failed,
      total: this.scraped + this.failed,
    };
  }

  /**
   * Abstract method to be implemented by each scraper
   */
  abstract scrape(maxPlans?: number): Promise<void>;
}
