#!/usr/bin/env node

import { HousePlansScraper } from './sources/HousePlansScraper';
import { BetterPlaceScraper } from './sources/BetterPlaceScraper';

const AVAILABLE_SCRAPERS = {
  houseplans: HousePlansScraper,
  betterplace: BetterPlaceScraper,
};

type ScraperName = keyof typeof AVAILABLE_SCRAPERS;

async function main() {
  const args = process.argv.slice(2);

  // Parse command line arguments
  const scraperName = args[0] as ScraperName;
  const maxPlans = args[1] ? parseInt(args[1]) : 50;

  // Validate scraper name
  if (!scraperName || !AVAILABLE_SCRAPERS[scraperName]) {
    console.error('❌ Invalid or missing scraper name');
    console.log('\nUsage: npx tsx scripts/scraper/run-scraper.ts <scraper> [maxPlans]');
    console.log('\nAvailable scrapers:');
    Object.keys(AVAILABLE_SCRAPERS).forEach(name => {
      console.log(`  - ${name}`);
    });
    console.log('\nExample:');
    console.log('  npx tsx scripts/scraper/run-scraper.ts houseplans 50');
    process.exit(1);
  }

  // Validate maxPlans
  if (isNaN(maxPlans) || maxPlans < 1) {
    console.error('❌ Invalid maxPlans value. Must be a positive number.');
    process.exit(1);
  }

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          🏗️  FLOOR PLAN SCRAPER                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Source:       ${scraperName}`);
  console.log(`Max Plans:    ${maxPlans}`);
  console.log(`Started:      ${new Date().toLocaleString()}`);
  console.log('');

  const startTime = Date.now();

  try {
    // Instantiate and run the scraper
    const ScraperClass = AVAILABLE_SCRAPERS[scraperName];
    const scraper = new ScraperClass();
    await scraper.scrape(maxPlans);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const summary = scraper.getSummary();

    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║          ✅ SCRAPING COMPLETED                             ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`Duration:     ${duration}s`);
    console.log(`Success Rate: ${summary.total > 0 ? Math.round((summary.scraped / summary.total) * 100) : 0}%`);
    console.log('');
    console.log('Next steps:');
    console.log('  1. Review scraped images in data/floor-plans/images/');
    console.log('  2. Check metadata files in data/floor-plans/metadata/');
    console.log('  3. Use Claude Vision to analyze patterns');
    console.log('');
  } catch (error: any) {
    console.error('\n❌ Scraping failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the scraper
main();
