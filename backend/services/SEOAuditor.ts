import { chromium } from 'playwright';
import axios from 'axios';

interface SEOIssue {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  issue: string;
  description: string;
  recommendation: string;
}

interface SEOAuditResult {
  success: boolean;
  url: string;
  duration_ms: number;
  timestamp: string;
  overall_score: number; // 0-100
  issues: SEOIssue[];
  meta_tags: {
    title?: string;
    description?: string;
    keywords?: string;
    title_length: number;
    description_length: number;
    has_title: boolean;
    has_description: boolean;
    has_viewport: boolean;
    has_charset: boolean;
  };
  open_graph: {
    has_og_tags: boolean;
    og_title?: string;
    og_description?: string;
    og_image?: string;
    og_url?: string;
  };
  twitter_card: {
    has_twitter_card: boolean;
    card_type?: string;
    twitter_title?: string;
    twitter_description?: string;
    twitter_image?: string;
  };
  structured_data: {
    has_json_ld: boolean;
    schema_types: string[];
    count: number;
  };
  headings: {
    h1_count: number;
    h1_texts: string[];
    h2_count: number;
    h3_count: number;
    missing_h1: boolean;
    multiple_h1: boolean;
  };
  images: {
    total_images: number;
    images_without_alt: number;
    images_with_alt: number;
    alt_text_percentage: number;
  };
  links: {
    total_links: number;
    internal_links: number;
    external_links: number;
    broken_links: number;
  };
  technical: {
    has_robots_txt: boolean;
    has_sitemap: boolean;
    has_canonical: boolean;
    canonical_url?: string;
    is_mobile_friendly: boolean;
    uses_https: boolean;
  };
  summary: {
    critical: number;
    warning: number;
    info: number;
    total: number;
  };
}

class SEOAuditor {
  /**
   * Run comprehensive SEO audit on a URL
   */
  static async runAudit(url: string): Promise<SEOAuditResult> {
    const startTime = Date.now();
    const issues: SEOIssue[] = [];

    let browser = null;
    try {
      // Launch browser
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (compatible; SEOBot/1.0; +https://seobot.com)'
      });
      const page = await context.newPage();

      // Navigate to page
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // 1. Check Meta Tags
      const metaTags = await this.checkMetaTags(page, issues);

      // 2. Check Open Graph Tags
      const openGraph = await this.checkOpenGraphTags(page, issues);

      // 3. Check Twitter Card Tags
      const twitterCard = await this.checkTwitterCardTags(page, issues);

      // 4. Check Structured Data
      const structuredData = await this.checkStructuredData(page, issues);

      // 5. Check Headings
      const headings = await this.checkHeadings(page, issues);

      // 6. Check Images
      const images = await this.checkImages(page, issues);

      // 7. Check Links
      const links = await this.checkLinks(page, url, issues);

      // 8. Check Technical SEO
      const technical = await this.checkTechnicalSEO(page, url, issues);

      await browser.close();

      // Calculate summary
      const summary = {
        critical: issues.filter(i => i.severity === 'critical').length,
        warning: issues.filter(i => i.severity === 'warning').length,
        info: issues.filter(i => i.severity === 'info').length,
        total: issues.length
      };

      // Calculate overall SEO score (0-100)
      const overall_score = this.calculateSEOScore(summary);

      return {
        success: summary.critical === 0,
        url,
        duration_ms: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        overall_score,
        issues,
        meta_tags: metaTags,
        open_graph: openGraph,
        twitter_card: twitterCard,
        structured_data: structuredData,
        headings,
        images,
        links,
        technical,
        summary
      };
    } catch (error: any) {
      if (browser) await browser.close();
      throw new Error(`SEO audit failed: ${error.message}`);
    }
  }

  /**
   * Check meta tags
   */
  private static async checkMetaTags(page: any, issues: SEOIssue[]): Promise<any> {
    const title = await page.title();
    const description = await page.$eval('meta[name="description"]', (el: any) => el.content).catch(() => null);
    const keywords = await page.$eval('meta[name="keywords"]', (el: any) => el.content).catch(() => null);
    const viewport = await page.$eval('meta[name="viewport"]', (el: any) => el.content).catch(() => null);
    const charset = await page.$('meta[charset]').catch(() => null);

    const title_length = title?.length || 0;
    const description_length = description?.length || 0;

    // Title checks
    if (!title || title_length === 0) {
      issues.push({
        severity: 'critical',
        category: 'Meta Tags',
        issue: 'Missing Title Tag',
        description: 'Page has no title tag',
        recommendation: 'Add a descriptive title tag (50-60 characters)'
      });
    } else if (title_length < 30) {
      issues.push({
        severity: 'warning',
        category: 'Meta Tags',
        issue: 'Title Too Short',
        description: `Title is only ${title_length} characters`,
        recommendation: 'Title should be 50-60 characters for optimal display in search results'
      });
    } else if (title_length > 60) {
      issues.push({
        severity: 'warning',
        category: 'Meta Tags',
        issue: 'Title Too Long',
        description: `Title is ${title_length} characters (may be truncated)`,
        recommendation: 'Keep title under 60 characters to avoid truncation'
      });
    }

    // Description checks
    if (!description) {
      issues.push({
        severity: 'critical',
        category: 'Meta Tags',
        issue: 'Missing Meta Description',
        description: 'Page has no meta description tag',
        recommendation: 'Add a compelling meta description (150-160 characters)'
      });
    } else if (description_length < 120) {
      issues.push({
        severity: 'warning',
        category: 'Meta Tags',
        issue: 'Meta Description Too Short',
        description: `Description is only ${description_length} characters`,
        recommendation: 'Meta description should be 150-160 characters'
      });
    } else if (description_length > 160) {
      issues.push({
        severity: 'warning',
        category: 'Meta Tags',
        issue: 'Meta Description Too Long',
        description: `Description is ${description_length} characters (may be truncated)`,
        recommendation: 'Keep meta description under 160 characters'
      });
    }

    // Viewport check
    if (!viewport) {
      issues.push({
        severity: 'warning',
        category: 'Meta Tags',
        issue: 'Missing Viewport Meta Tag',
        description: 'Page is missing viewport meta tag for mobile responsiveness',
        recommendation: 'Add: <meta name="viewport" content="width=device-width, initial-scale=1">'
      });
    }

    // Charset check
    if (!charset) {
      issues.push({
        severity: 'info',
        category: 'Meta Tags',
        issue: 'Missing Charset Declaration',
        description: 'Page should declare character encoding',
        recommendation: 'Add: <meta charset="UTF-8">'
      });
    }

    return {
      title: title || undefined,
      description: description || undefined,
      keywords: keywords || undefined,
      title_length,
      description_length,
      has_title: !!title,
      has_description: !!description,
      has_viewport: !!viewport,
      has_charset: !!charset
    };
  }

  /**
   * Check Open Graph tags
   */
  private static async checkOpenGraphTags(page: any, issues: SEOIssue[]): Promise<any> {
    const ogTitle = await page.$eval('meta[property="og:title"]', (el: any) => el.content).catch(() => null);
    const ogDescription = await page.$eval('meta[property="og:description"]', (el: any) => el.content).catch(() => null);
    const ogImage = await page.$eval('meta[property="og:image"]', (el: any) => el.content).catch(() => null);
    const ogUrl = await page.$eval('meta[property="og:url"]', (el: any) => el.content).catch(() => null);

    const hasOgTags = !!(ogTitle || ogDescription || ogImage || ogUrl);

    if (!hasOgTags) {
      issues.push({
        severity: 'warning',
        category: 'Social Media',
        issue: 'Missing Open Graph Tags',
        description: 'No Open Graph tags found for social media sharing',
        recommendation: 'Add og:title, og:description, og:image, and og:url tags for better social sharing'
      });
    } else {
      if (!ogImage) {
        issues.push({
          severity: 'warning',
          category: 'Social Media',
          issue: 'Missing OG Image',
          description: 'No og:image tag found',
          recommendation: 'Add og:image tag with a high-quality image (1200x630px recommended)'
        });
      }
    }

    return {
      has_og_tags: hasOgTags,
      og_title: ogTitle || undefined,
      og_description: ogDescription || undefined,
      og_image: ogImage || undefined,
      og_url: ogUrl || undefined
    };
  }

  /**
   * Check Twitter Card tags
   */
  private static async checkTwitterCardTags(page: any, issues: SEOIssue[]): Promise<any> {
    const cardType = await page.$eval('meta[name="twitter:card"]', (el: any) => el.content).catch(() => null);
    const twitterTitle = await page.$eval('meta[name="twitter:title"]', (el: any) => el.content).catch(() => null);
    const twitterDescription = await page.$eval('meta[name="twitter:description"]', (el: any) => el.content).catch(() => null);
    const twitterImage = await page.$eval('meta[name="twitter:image"]', (el: any) => el.content).catch(() => null);

    const hasTwitterCard = !!cardType;

    if (!hasTwitterCard) {
      issues.push({
        severity: 'info',
        category: 'Social Media',
        issue: 'Missing Twitter Card',
        description: 'No Twitter Card tags found',
        recommendation: 'Add Twitter Card tags for better Twitter sharing (twitter:card, twitter:title, etc.)'
      });
    }

    return {
      has_twitter_card: hasTwitterCard,
      card_type: cardType || undefined,
      twitter_title: twitterTitle || undefined,
      twitter_description: twitterDescription || undefined,
      twitter_image: twitterImage || undefined
    };
  }

  /**
   * Check structured data (JSON-LD)
   */
  private static async checkStructuredData(page: any, issues: SEOIssue[]): Promise<any> {
    const jsonLdScripts = await page.$$eval('script[type="application/ld+json"]', (scripts: any[]) => {
      return scripts.map(script => {
        try {
          return JSON.parse(script.textContent || '');
        } catch {
          return null;
        }
      }).filter(Boolean);
    });

    const schemaTypes = jsonLdScripts.map((data: any) => data['@type'] || 'Unknown').filter((type: string) => type !== 'Unknown');

    if (jsonLdScripts.length === 0) {
      issues.push({
        severity: 'info',
        category: 'Structured Data',
        issue: 'Missing Structured Data',
        description: 'No JSON-LD structured data found',
        recommendation: 'Add Schema.org structured data to help search engines understand your content'
      });
    }

    return {
      has_json_ld: jsonLdScripts.length > 0,
      schema_types: schemaTypes,
      count: jsonLdScripts.length
    };
  }

  /**
   * Check headings structure
   */
  private static async checkHeadings(page: any, issues: SEOIssue[]): Promise<any> {
    const h1Elements = await page.$$eval('h1', (elements: any[]) => elements.map(el => el.textContent?.trim() || ''));
    const h2Count = await page.$$eval('h2', (elements: any[]) => elements.length);
    const h3Count = await page.$$eval('h3', (elements: any[]) => elements.length);

    const h1Count = h1Elements.length;

    if (h1Count === 0) {
      issues.push({
        severity: 'critical',
        category: 'Content Structure',
        issue: 'Missing H1 Tag',
        description: 'Page has no H1 heading',
        recommendation: 'Add exactly one H1 tag with your main keyword'
      });
    } else if (h1Count > 1) {
      issues.push({
        severity: 'warning',
        category: 'Content Structure',
        issue: 'Multiple H1 Tags',
        description: `Page has ${h1Count} H1 tags`,
        recommendation: 'Use only one H1 tag per page for better SEO structure'
      });
    }

    return {
      h1_count: h1Count,
      h1_texts: h1Elements,
      h2_count: h2Count,
      h3_count: h3Count,
      missing_h1: h1Count === 0,
      multiple_h1: h1Count > 1
    };
  }

  /**
   * Check images for alt text
   */
  private static async checkImages(page: any, issues: SEOIssue[]): Promise<any> {
    const imageData = await page.$$eval('img', (images: any[]) => {
      const total = images.length;
      const withAlt = images.filter(img => img.alt && img.alt.trim().length > 0).length;
      return { total, withAlt, withoutAlt: total - withAlt };
    });

    const altTextPercentage = imageData.total > 0 ? (imageData.withAlt / imageData.total) * 100 : 100;

    if (imageData.withoutAlt > 0) {
      issues.push({
        severity: imageData.withoutAlt > imageData.total / 2 ? 'warning' : 'info',
        category: 'Images',
        issue: 'Images Missing Alt Text',
        description: `${imageData.withoutAlt} out of ${imageData.total} images are missing alt text`,
        recommendation: 'Add descriptive alt text to all images for accessibility and SEO'
      });
    }

    return {
      total_images: imageData.total,
      images_without_alt: imageData.withoutAlt,
      images_with_alt: imageData.withAlt,
      alt_text_percentage: Math.round(altTextPercentage)
    };
  }

  /**
   * Check links
   */
  private static async checkLinks(page: any, baseUrl: string, issues: SEOIssue[]): Promise<any> {
    const linkData = await page.$$eval('a[href]', (links: any[], baseUrl: string) => {
      const total = links.length;
      const hostname = new URL(baseUrl).hostname;

      let internal = 0;
      let external = 0;

      links.forEach(link => {
        const href = link.href;
        if (href.startsWith('/') || href.includes(hostname)) {
          internal++;
        } else if (href.startsWith('http')) {
          external++;
        }
      });

      return { total, internal, external };
    }, baseUrl);

    if (linkData.total === 0) {
      issues.push({
        severity: 'warning',
        category: 'Links',
        issue: 'No Links Found',
        description: 'Page has no links',
        recommendation: 'Add internal and external links to improve SEO and user experience'
      });
    }

    return {
      total_links: linkData.total,
      internal_links: linkData.internal,
      external_links: linkData.external,
      broken_links: 0 // Would require checking each link
    };
  }

  /**
   * Check technical SEO factors
   */
  private static async checkTechnicalSEO(page: any, url: string, issues: SEOIssue[]): Promise<any> {
    const canonical = await page.$eval('link[rel="canonical"]', (el: any) => el.href).catch(() => null);
    const usesHttps = url.startsWith('https://');

    // Check robots.txt
    const robotsTxtUrl = new URL('/robots.txt', url).href;
    let hasRobotsTxt = false;
    try {
      const robotsResponse = await axios.get(robotsTxtUrl, { timeout: 5000, validateStatus: () => true });
      hasRobotsTxt = robotsResponse.status === 200;
    } catch {
      hasRobotsTxt = false;
    }

    // Check sitemap.xml
    const sitemapUrl = new URL('/sitemap.xml', url).href;
    let hasSitemap = false;
    try {
      const sitemapResponse = await axios.get(sitemapUrl, { timeout: 5000, validateStatus: () => true });
      hasSitemap = sitemapResponse.status === 200;
    } catch {
      hasSitemap = false;
    }

    // Mobile-friendly check (basic viewport check)
    const isMobileFriendly = await page.$eval('meta[name="viewport"]', () => true).catch(() => false);

    // HTTPS check
    if (!usesHttps) {
      issues.push({
        severity: 'critical',
        category: 'Security & SEO',
        issue: 'Not Using HTTPS',
        description: 'Website is not using HTTPS',
        recommendation: 'Install SSL certificate and redirect all HTTP traffic to HTTPS'
      });
    }

    // Canonical URL check
    if (!canonical) {
      issues.push({
        severity: 'info',
        category: 'Technical SEO',
        issue: 'Missing Canonical URL',
        description: 'No canonical URL specified',
        recommendation: 'Add a canonical URL to avoid duplicate content issues'
      });
    }

    // Robots.txt check
    if (!hasRobotsTxt) {
      issues.push({
        severity: 'info',
        category: 'Technical SEO',
        issue: 'Missing robots.txt',
        description: 'No robots.txt file found',
        recommendation: 'Create a robots.txt file to guide search engine crawlers'
      });
    }

    // Sitemap check
    if (!hasSitemap) {
      issues.push({
        severity: 'warning',
        category: 'Technical SEO',
        issue: 'Missing sitemap.xml',
        description: 'No sitemap.xml file found',
        recommendation: 'Create an XML sitemap to help search engines discover your pages'
      });
    }

    return {
      has_robots_txt: hasRobotsTxt,
      has_sitemap: hasSitemap,
      has_canonical: !!canonical,
      canonical_url: canonical || undefined,
      is_mobile_friendly: isMobileFriendly,
      uses_https: usesHttps
    };
  }

  /**
   * Calculate overall SEO score (0-100)
   */
  private static calculateSEOScore(summary: {
    critical: number;
    warning: number;
    info: number;
  }): number {
    let score = 100;

    // Deduct points based on severity
    score -= summary.critical * 20;  // Critical: -20 points each
    score -= summary.warning * 10;   // Warning: -10 points each
    score -= summary.info * 3;       // Info: -3 points each

    return Math.max(0, score); // Minimum score is 0
  }
}

export default SEOAuditor;
