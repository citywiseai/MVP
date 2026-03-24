import { BaseScraper, FloorPlanMetadata } from '../BaseScraper';
import axios from 'axios';

export class BetterPlaceScraper extends BaseScraper {
  constructor() {
    super('betterplace', 'https://betterplacedesignbuild.com', {
      rateLimit: 3000, // Be respectful - 3 second delay
      maxConcurrent: 2, // Lower concurrency for smaller site
    });
  }

  /**
   * Main scraping logic
   */
  async scrape(maxPlans: number = 50): Promise<void> {
    console.log(`\n🏠 Starting BetterPlace Design+Build scraper (max ${maxPlans} plans)`);
    console.log(`⏱️  Rate limit: ${this.rateLimit}ms, Concurrent: ${this.maxConcurrent}`);
    console.log('');

    await this.init();

    // Scrape the main floor plans listing page
    const listingUrl = `${this.baseUrl}/floor-plans/`;
    console.log(`📄 Fetching floor plans listing: ${listingUrl}`);

    const $ = await this.fetchPageWithBrowser(listingUrl, '.floor-card-gallery__slide');
    if (!$) {
      console.log('❌ Failed to fetch listing page');
      await this.cleanup();
      return;
    }

    // Extract all floor plan links
    const planLinks: string[] = [];

    // Method 1: Links in floor card gallery slides
    $('.floor-card-gallery__slide a').each((_, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('/floor-plans/') && !href.endsWith('/floor-plans/')) {
        planLinks.push(href);
      }
    });

    // Method 2: Plan name headings
    $('h3 a[href*="/floor-plans/"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && !href.endsWith('/floor-plans/')) {
        planLinks.push(href);
      }
    });

    // Deduplicate
    const uniquePlanLinks = [...new Set(planLinks)];
    console.log(`📦 Found ${uniquePlanLinks.length} floor plans on listing page\n`);

    // Scrape each plan
    let scrapedCount = 0;
    for (const planUrl of uniquePlanLinks) {
      if (scrapedCount >= maxPlans) {
        console.log(`\n✅ Reached target of ${maxPlans} plans, stopping`);
        break;
      }

      await this.limit(async () => {
        await this.scrapePlanPage(planUrl);
      });

      scrapedCount++;
    }

    // Cleanup browser
    await this.cleanup();

    const summary = this.getSummary();
    console.log('\n' + '='.repeat(60));
    console.log('📊 SCRAPING SUMMARY');
    console.log('='.repeat(60));
    console.log(`Source:       ${summary.source}`);
    console.log(`Scraped:      ${summary.scraped} plans`);
    console.log(`Failed:       ${summary.failed} plans`);
    console.log(`Total:        ${summary.total} attempts`);
    console.log('='.repeat(60));
  }

  /**
   * Scrape individual floor plan page
   */
  private async scrapePlanPage(url: string): Promise<void> {
    const $ = await this.fetchPageWithBrowser(url, 'a[data-fancybox="floor-gallery"]');
    if (!$) {
      this.failed++;
      return;
    }

    try {
      // Extract plan name from URL
      const planNameMatch = url.match(/\/floor-plans\/([^\/]+)\/?$/);
      if (!planNameMatch) {
        console.log(`  ⚠️  Could not extract plan name from ${url}`);
        this.failed++;
        return;
      }
      const planName = planNameMatch[1];

      // Extract metadata from schema markup
      const schemaScript = $('script[type="application/ld+json"]').first().html();
      let squareFootage: number | undefined;
      let bedrooms: number | undefined;
      let bathrooms: number | undefined;
      let planTitle: string | undefined;

      if (schemaScript) {
        try {
          const schema = JSON.parse(schemaScript);

          if (schema['@type'] === 'Product') {
            planTitle = schema.name;

            // Parse description like "3 Bedrooms, 2 Baths, 1020 SQFT"
            const description = schema.description || '';

            const bedsMatch = description.match(/(\d+)\s+Bedroom/i);
            if (bedsMatch) bedrooms = parseInt(bedsMatch[1]);

            const bathsMatch = description.match(/(\d+(?:\.\d+)?)\s+Bath/i);
            if (bathsMatch) bathrooms = parseFloat(bathsMatch[1]);

            const sqftMatch = description.match(/(\d+)\s+SQ\s?FT/i);
            if (sqftMatch) squareFootage = parseInt(sqftMatch[1]);
          }
        } catch (e) {
          // Schema parsing failed, continue without it
        }
      }

      // Find floor plan image
      let floorPlanImageUrl: string | undefined;

      // Method 1: Look for Fancybox gallery images with "floor" or "plan" in filename
      $('a[data-fancybox="floor-gallery"]').each((_, el) => {
        const imgEl = $(el).find('img');
        const src = imgEl.attr('src') || imgEl.attr('data-src');

        if (src) {
          const srcLower = src.toLowerCase();

          // Prioritize images with "floor" or "plan" in filename
          if (srcLower.includes('floor') || srcLower.includes('plan')) {
            floorPlanImageUrl = src;
            return false; // Break loop
          }

          // Fallback to first image if no floor plan found yet
          if (!floorPlanImageUrl) {
            floorPlanImageUrl = src;
          }
        }
      });

      // Method 2: Hero slider images
      if (!floorPlanImageUrl) {
        const heroImg = $('.floor-hero-slider__slide-img img').first();
        floorPlanImageUrl = heroImg.attr('src') || heroImg.attr('data-src');
      }

      // Method 3: Any large image with relevant keywords
      if (!floorPlanImageUrl) {
        $('img[sizes*="auto"]').each((_, el) => {
          const src = $(el).attr('src') || $(el).attr('data-src');
          if (src && (src.includes('floor') || src.includes('plan'))) {
            floorPlanImageUrl = src;
            return false;
          }
        });
      }

      if (!floorPlanImageUrl) {
        console.log(`  ⚠️  No floor plan image found for ${planName}`);
        this.failed++;
        return;
      }

      // Ensure full URL
      if (!floorPlanImageUrl.startsWith('http')) {
        floorPlanImageUrl = floorPlanImageUrl.startsWith('//')
          ? `https:${floorPlanImageUrl}`
          : `${this.baseUrl}${floorPlanImageUrl}`;
      }

      // Extract metadata from filename if not already found
      // Example: "Sequoia-1020-SQ-FT-3-Bedroom-2-Bath-Floor-Plan-2.jpg"
      if (!squareFootage || !bedrooms || !bathrooms) {
        const filename = floorPlanImageUrl.split('/').pop() || '';

        const sqftMatch = filename.match(/(\d+)-?SQ-?FT/i);
        if (sqftMatch && !squareFootage) squareFootage = parseInt(sqftMatch[1]);

        const bedsMatch = filename.match(/(\d+)-?Bedroom/i);
        if (bedsMatch && !bedrooms) bedrooms = parseInt(bedsMatch[1]);

        const bathsMatch = filename.match(/(\d+)-?Bath/i);
        if (bathsMatch && !bathrooms) bathrooms = parseInt(bathsMatch[1]);
      }

      // Check image size before downloading
      const imageSize = await this.getImageSize(floorPlanImageUrl);
      if (imageSize === null || imageSize < 100 * 1024) { // Less than 100KB
        console.log(`  ⏭️  Skipping ${planName} (image too small: ${imageSize ? Math.round(imageSize / 1024) : '?'}KB)`);
        return;
      }

      console.log(`\n  🏠 Plan ${planTitle || planName}: ${squareFootage || '?'} sqft, ${bedrooms || '?'}bd/${bathrooms || '?'}ba`);
      console.log(`  📏 Image size: ${Math.round(imageSize / 1024)}KB`);

      // Download image
      const localImagePath = await this.downloadImage(floorPlanImageUrl, planName);
      if (!localImagePath) {
        this.failed++;
        return;
      }

      // Create metadata
      const metadata: FloorPlanMetadata = {
        id: planName,
        source: this.sourceName,
        sourceUrl: url,
        imageUrl: floorPlanImageUrl,
        localImagePath,
        squareFootage,
        bedrooms,
        bathrooms,
        stories: 1, // ADUs are typically single story
        style: 'ADU',
        description: planTitle,
        scrapedAt: new Date().toISOString(),
      };

      // Save metadata
      await this.saveMetadata(metadata);

      this.scraped++;
      console.log(`  ✅ Successfully scraped ${planName} (${this.scraped} total)`);
    } catch (error: any) {
      console.error(`  ❌ Error scraping plan:`, error.message);
      this.failed++;
    }
  }

  /**
   * Get image file size without downloading
   */
  private async getImageSize(url: string): Promise<number | null> {
    try {
      const response = await axios.head(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      });

      const contentLength = response.headers['content-length'];
      return contentLength ? parseInt(contentLength) : null;
    } catch (error) {
      // If HEAD request fails, try to infer from partial GET
      try {
        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Range': 'bytes=0-1023', // Just get first 1KB to check size
          },
          responseType: 'arraybuffer',
        });

        const contentRange = response.headers['content-range'];
        if (contentRange) {
          const sizeMatch = contentRange.match(/\/(\d+)/);
          return sizeMatch ? parseInt(sizeMatch[1]) : null;
        }
      } catch (e) {
        // Ignore
      }

      return null;
    }
  }
}
