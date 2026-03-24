import { BaseScraper, FloorPlanMetadata } from '../BaseScraper';

interface HousePlansSearchConfig {
  collection: string;
  label: string;
}

export class HousePlansScraper extends BaseScraper {
  private collections: HousePlansSearchConfig[] = [
    { collection: 'small-house-plans', label: 'Small House Plans' },
    { collection: 'tiny-house-plans', label: 'Tiny House Plans' },
    { collection: '1-bedroom', label: '1 Bedroom Plans' },
    { collection: '2-bedroom-house-plans', label: '2 Bedroom Plans' },
  ];

  constructor() {
    super('houseplans', 'https://www.houseplans.com', {
      rateLimit: 2000,
      maxConcurrent: 3,
    });
  }

  /**
   * Main scraping logic
   */
  async scrape(maxPlans: number = 50): Promise<void> {
    console.log(`\n🏠 Starting HousePlans.com scraper (max ${maxPlans} plans)`);
    console.log(`⏱️  Rate limit: ${this.rateLimit}ms, Concurrent: ${this.maxConcurrent}`);
    console.log('');

    await this.init();

    const plansPerCollection = Math.ceil(maxPlans / this.collections.length);

    for (const config of this.collections) {
      console.log(`\n📚 Scraping collection: ${config.label}`);
      await this.scrapeCollection(config, plansPerCollection);

      if (this.scraped >= maxPlans) {
        console.log(`\n✅ Reached target of ${maxPlans} plans, stopping`);
        break;
      }
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
   * Scrape a single collection
   */
  private async scrapeCollection(
    config: HousePlansSearchConfig,
    maxPlans: number
  ): Promise<void> {
    let page = 1;
    let plansScraped = 0;

    while (plansScraped < maxPlans) {
      const url = `${this.baseUrl}/collection/${config.collection}?page=${page}`;
      console.log(`\n  📄 Fetching page ${page}: ${url}`);

      // Use browser-based fetching for JavaScript-rendered content
      const $ = await this.fetchPageWithBrowser(url, 'a[href*="/plan/"]');
      if (!$) {
        console.log('  ⚠️  Failed to fetch page, moving to next collection');
        break;
      }

      // Find all plan cards on the page
      const planCards = $('.plan-card, .product-card, [data-plan-id]').toArray();

      if (planCards.length === 0) {
        console.log('  ℹ️  No plans found on this page, trying alternative selectors');

        // Try alternative selectors
        const altCards = $('a[href*="/plan/"]').toArray();
        if (altCards.length === 0) {
          console.log('  ⚠️  No plans found with alternative selectors, moving to next collection');
          break;
        }

        // Process alternative cards
        for (let i = 0; i < Math.min(altCards.length, maxPlans - plansScraped); i++) {
          const card = altCards[i];
          const planUrl = $(card).attr('href');

          if (planUrl) {
            const fullUrl = planUrl.startsWith('http')
              ? planUrl
              : `${this.baseUrl}${planUrl}`;

            await this.limit(async () => {
              await this.scrapePlanPage(fullUrl, config.collection);
            });

            plansScraped++;
            if (this.scraped >= maxPlans) break;
          }
        }
      } else {
        console.log(`  📦 Found ${planCards.length} plans on page ${page}`);

        // Process each plan card
        for (let i = 0; i < Math.min(planCards.length, maxPlans - plansScraped); i++) {
          const card = planCards[i];
          const planLink = $(card).find('a[href*="/plan/"]').first().attr('href') ||
                          $(card).attr('href');

          if (planLink) {
            const fullUrl = planLink.startsWith('http')
              ? planLink
              : `${this.baseUrl}${planLink}`;

            await this.limit(async () => {
              await this.scrapePlanPage(fullUrl, config.collection);
            });

            plansScraped++;
            if (this.scraped >= maxPlans) break;
          }
        }
      }

      if (this.scraped >= maxPlans || plansScraped >= maxPlans) {
        break;
      }

      page++;

      // Safety: don't scrape more than 10 pages per collection
      if (page > 10) {
        console.log('  ⚠️  Reached page limit (10), moving to next collection');
        break;
      }
    }

    console.log(`  ✅ Completed collection: ${config.label} (${plansScraped} plans)`);
  }

  /**
   * Scrape individual plan page
   */
  private async scrapePlanPage(url: string, collection: string): Promise<void> {
    const $ = await this.fetchPageWithBrowser(url, '.plan-images, .image-gallery, img[alt*="Floor Plan"]');
    if (!$) {
      this.failed++;
      return;
    }

    try {
      // Extract plan ID from URL
      const planIdMatch = url.match(/plan\/([A-Z0-9-]+)/i);
      if (!planIdMatch) {
        console.log(`  ⚠️  Could not extract plan ID from ${url}`);
        this.failed++;
        return;
      }
      const planId = planIdMatch[1];

      // Look for floor plan image
      // Try multiple selectors
      let floorPlanImageUrl: string | undefined;

      // Method 1: Look for specific floor plan image in gallery
      floorPlanImageUrl = $('.floor-plan-image img').attr('src') ||
                          $('img[alt*="Floor Plan"]').attr('src') ||
                          $('img[alt*="floor plan"]').attr('src');

      // Method 2: Look in image gallery for floor plan
      if (!floorPlanImageUrl) {
        const galleryImages = $('.plan-images img, .image-gallery img, .product-images img').toArray();
        for (const img of galleryImages) {
          const alt = $(img).attr('alt')?.toLowerCase() || '';
          const src = $(img).attr('src') || '';

          if (alt.includes('floor plan') || src.includes('floor') || src.includes('fp')) {
            floorPlanImageUrl = $(img).attr('src');
            break;
          }
        }
      }

      // Method 3: Get first main image as fallback
      if (!floorPlanImageUrl) {
        floorPlanImageUrl = $('.main-image img').first().attr('src') ||
                           $('.product-image img').first().attr('src') ||
                           $('img[itemprop="image"]').first().attr('src');
      }

      if (!floorPlanImageUrl) {
        console.log(`  ⚠️  No floor plan image found for ${planId}`);
        this.failed++;
        return;
      }

      // Ensure full URL
      if (!floorPlanImageUrl.startsWith('http')) {
        floorPlanImageUrl = floorPlanImageUrl.startsWith('//')
          ? `https:${floorPlanImageUrl}`
          : `${this.baseUrl}${floorPlanImageUrl}`;
      }

      // Extract metadata
      const squareFootage = this.parseNumber(
        $('.sqft, [data-sqft], .square-feet').first().text() ||
        $('span:contains("Sq. Ft.")').first().parent().text() ||
        $('*:contains("Square Feet")').first().text()
      );

      const bedrooms = this.parseNumber(
        $('.beds, [data-beds], .bedrooms').first().text() ||
        $('span:contains("Bed")').first().parent().text()
      );

      const bathrooms = this.parseNumber(
        $('.baths, [data-baths], .bathrooms').first().text() ||
        $('span:contains("Bath")').first().parent().text()
      );

      const stories = this.parseNumber(
        $('.stories, [data-stories]').first().text() ||
        $('span:contains("Stor")').first().parent().text()
      );

      // Only scrape plans under 1500 sqft
      if (squareFootage && squareFootage > 1500) {
        console.log(`  ⏭️  Skipping ${planId} (${squareFootage} sqft > 1500 sqft limit)`);
        return;
      }

      console.log(`\n  🏠 Plan ${planId}: ${squareFootage || '?'} sqft, ${bedrooms || '?'}bd/${bathrooms || '?'}ba`);

      // Download image
      const localImagePath = await this.downloadImage(floorPlanImageUrl, planId);
      if (!localImagePath) {
        this.failed++;
        return;
      }

      // Create metadata
      const metadata: FloorPlanMetadata = {
        id: planId,
        source: this.sourceName,
        sourceUrl: url,
        imageUrl: floorPlanImageUrl,
        localImagePath,
        squareFootage,
        bedrooms,
        bathrooms,
        stories,
        scrapedAt: new Date().toISOString(),
      };

      // Save metadata
      await this.saveMetadata(metadata);

      this.scraped++;
      console.log(`  ✅ Successfully scraped ${planId} (${this.scraped} total)`);
    } catch (error: any) {
      console.error(`  ❌ Error scraping plan:`, error.message);
      this.failed++;
    }
  }
}
