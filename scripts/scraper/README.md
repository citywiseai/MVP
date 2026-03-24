# Floor Plan Scraper

A reference database scraper for collecting floor plan images with metadata for pattern extraction and AI training.

## Overview

This scraper collects floor plan images (under 1500 sqft) from various sources to build a reference database. The images and metadata will be used for:

1. **Pattern Extraction** - Analyze common room layouts, dimensions, and configurations
2. **AI Training** - Improve floor plan generation prompts based on real-world examples
3. **Design Reference** - Build a library of small home layouts for builders and designers

## Architecture

### Base Scraper (`BaseScraper.ts`)

Provides common functionality for all scrapers:

- **Rate Limiting** - 2 second delay between requests (configurable)
- **Concurrency Control** - Max 3 concurrent requests (configurable)
- **Image Processing** - Download and resize images to max 2048px
- **Metadata Storage** - Save plan details as JSON
- **Error Handling** - Graceful failure with retry logic

### Source Scrapers

Each source implements the `BaseScraper` abstract class:

- **HousePlansScraper** - Scrapes houseplans.com collections
  - Collections: small-house-plans, tiny-house-plans, adu-house-plans, 1-bedroom, 2-bedroom
  - Filters to plans under 1500 sqft
  - Extracts: plan ID, image URL, sqft, beds, baths, dimensions

## Usage

### Quick Start

```bash
# Scrape 50 floor plans from houseplans.com
npm run scrape:houseplans

# Or use custom count
npm run scrape houseplans 100
```

### Manual Usage

```bash
# Run scraper with specific source and count
npx tsx scripts/scraper/run-scraper.ts <source> [maxPlans]

# Examples:
npx tsx scripts/scraper/run-scraper.ts houseplans 50
npx tsx scripts/scraper/run-scraper.ts houseplans 200
```

### Available Sources

- `houseplans` - HousePlans.com (small homes, ADUs, tiny houses)

## Output Structure

```
data/
└── floor-plans/
    ├── images/              # Floor plan images (ignored by git)
    │   └── houseplans/      # Source-specific subdirectories
    │       ├── HPG-1234.jpg
    │       └── HPG-5678.jpg
    └── metadata/            # JSON metadata files (committed to git)
        └── houseplans/      # Source-specific subdirectories
            ├── HPG-1234.json
            └── HPG-5678.json
```

### Metadata Format

Each `.json` file contains:

```json
{
  "id": "HPG-1234",
  "source": "houseplans",
  "sourceUrl": "https://www.houseplans.com/plan/HPG-1234",
  "imageUrl": "https://...",
  "localImagePath": "HPG-1234.jpg",
  "squareFootage": 850,
  "bedrooms": 2,
  "bathrooms": 1,
  "stories": 1,
  "width": 30,
  "depth": 40,
  "style": "Modern",
  "description": "Compact 2-bedroom ADU",
  "scrapedAt": "2025-01-10T12:00:00.000Z"
}
```

## Git Strategy

- **Images**: Excluded from git (large binary files)
- **Metadata**: Committed to git (small JSON files)
- **Structure**: Directory structure tracked via `.gitkeep`

This allows the team to:
- Share floor plan metadata and analysis
- Reproduce scraping results
- Avoid bloating the git repository with images

## Rate Limiting & Ethics

### Current Settings

- **Rate Limit**: 2000ms (2 seconds) between requests
- **Concurrency**: Max 3 concurrent requests
- **Timeout**: 30 seconds per request

### Best Practices

1. **Respect robots.txt** - Check site's crawling policies
2. **Reasonable Delays** - Current 2s delay is conservative
3. **User-Agent** - Uses realistic browser user-agent
4. **Error Handling** - Fails gracefully without retrying excessively
5. **Limited Scope** - Targets public-facing floor plans only

### Adjusting Rate Limits

Edit `BaseScraper.ts` constructor:

```typescript
constructor(sourceName: string, baseUrl: string, options?: {
  rateLimit?: number;      // Default: 2000ms
  maxConcurrent?: number;  // Default: 3
}) {
  // ...
}
```

Or pass options when creating a scraper:

```typescript
new HousePlansScraper({
  rateLimit: 3000,       // 3 seconds
  maxConcurrent: 2       // 2 concurrent
})
```

## Adding New Sources

1. Create new scraper in `sources/`:

```typescript
import { BaseScraper, FloorPlanMetadata } from '../BaseScraper';

export class NewSiteScraper extends BaseScraper {
  constructor() {
    super('newsite', 'https://newsite.com', {
      rateLimit: 2000,
      maxConcurrent: 3,
    });
  }

  async scrape(maxPlans: number = 50): Promise<void> {
    await this.init();
    // Implement scraping logic
  }
}
```

2. Register in `run-scraper.ts`:

```typescript
import { NewSiteScraper } from './sources/NewSiteScraper';

const AVAILABLE_SCRAPERS = {
  houseplans: HousePlansScraper,
  newsite: NewSiteScraper,  // Add here
};
```

3. Add npm script to `package.json`:

```json
{
  "scripts": {
    "scrape:newsite": "tsx scripts/scraper/run-scraper.ts newsite 50"
  }
}
```

## Next Steps

After scraping floor plans:

1. **Review Images** - Check `data/floor-plans/images/` for quality
2. **Analyze Metadata** - Review `data/floor-plans/metadata/` for completeness
3. **Pattern Extraction** - Use Claude Vision API to analyze layouts:
   - Room configurations (open concept vs separated)
   - Common dimensions and proportions
   - Efficient space usage patterns
   - Circulation and flow patterns
4. **Improve Prompts** - Update floor plan generation prompts based on findings
5. **Database Import** (Future) - Load metadata into Prisma for searchable reference library

## Troubleshooting

### No Plans Found

- Check if site structure changed (update selectors)
- Verify URL patterns are still valid
- Check console output for specific errors

### Images Not Downloading

- Check image URLs are accessible
- Verify rate limiting isn't too aggressive
- Check disk space and permissions

### Rate Limited by Site

- Increase `rateLimit` delay
- Decrease `maxConcurrent`
- Add random jitter to delays
- Check site's robots.txt for guidance

### TypeScript Errors

```bash
# Regenerate types
npx tsx --version

# Clear cache
rm -rf node_modules/.cache
npm install
```

## Performance

Expected scraping times:

- 50 plans: ~5-10 minutes
- 100 plans: ~10-20 minutes
- 500 plans: ~60-90 minutes

Factors affecting speed:
- Rate limiting (2s delay)
- Network latency
- Image download sizes
- Server response times

## Legal & Compliance

This scraper is designed for:
- Building reference databases for internal use
- Educational and research purposes
- Improving AI-generated floor plan quality

**Important:**
- Images remain property of original copyright holders
- Use scraped content in compliance with site terms of service
- Do not republish or redistribute scraped floor plans
- Respect intellectual property rights

If planning commercial use, consult with legal counsel.

## Support

For issues or questions:
1. Check console output for error messages
2. Review `data/floor-plans/metadata/` for failed scrapes
3. Adjust rate limiting if encountering blocks
4. Open GitHub issue with details

## License

See project root LICENSE file.
