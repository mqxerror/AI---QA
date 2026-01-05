const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const storage = require('../utils/storage');

/**
 * Discovery Service
 * Uses Crawl4AI to discover pages and AI to classify them for auto-testing
 */
class DiscoveryService {
  constructor() {
    this.crawl4aiUrl = process.env.CRAWL4AI_URL || 'http://38.97.60.181:11235';
    this.crawl4aiToken = process.env.CRAWL4AI_TOKEN || 'crawl4ai_secret_token';

    // Page type patterns for classification
    this.pagePatterns = {
      form: {
        urlPatterns: [/contact/, /signup/, /sign-up/, /register/, /login/, /subscribe/, /apply/, /quote/, /booking/, /checkout/, /payment/],
        htmlIndicators: ['<form', 'type="submit"', 'type="email"', 'type="password"', 'input[', 'textarea'],
        weight: 1.0
      },
      article: {
        urlPatterns: [/blog/, /news/, /article/, /post/, /story/, /guide/, /how-to/, /tutorial/],
        htmlIndicators: ['<article', 'class="post"', 'class="article"', 'class="blog"', 'class="content"', '<time'],
        weight: 0.8
      },
      landing: {
        urlPatterns: [/^\/$/, /^\/[^\/]+$/, /landing/, /home/, /index/, /welcome/],
        htmlIndicators: ['hero', 'cta', 'call-to-action', 'banner', 'testimonial', 'feature'],
        weight: 0.6
      },
      ecommerce: {
        urlPatterns: [/product/, /shop/, /store/, /cart/, /catalog/, /collection/, /category/],
        htmlIndicators: ['add-to-cart', 'price', 'buy-now', 'add to cart', 'shopping', 'checkout'],
        weight: 0.9
      },
      legal: {
        urlPatterns: [/privacy/, /terms/, /policy/, /legal/, /disclaimer/, /gdpr/, /cookie/],
        htmlIndicators: ['privacy policy', 'terms of service', 'legal', 'disclaimer'],
        weight: 0.5
      },
      faq: {
        urlPatterns: [/faq/, /help/, /support/, /questions/],
        htmlIndicators: ['accordion', 'faq', 'question', 'answer', 'expandable'],
        weight: 0.7
      }
    };

    // Test suite templates by page type
    this.testTemplates = {
      form: {
        tests: ['input_validation', 'required_fields', 'form_submission', 'error_messages', 'accessibility'],
        priority: 'high',
        description: 'Form validation and submission tests'
      },
      article: {
        tests: ['broken_links', 'image_loading', 'readability', 'seo_meta', 'accessibility'],
        priority: 'medium',
        description: 'Content quality and link validation'
      },
      landing: {
        tests: ['visual_regression', 'performance', 'cta_visibility', 'responsive', 'accessibility'],
        priority: 'high',
        description: 'Visual and performance testing for landing pages'
      },
      ecommerce: {
        tests: ['product_display', 'add_to_cart', 'price_display', 'inventory', 'checkout_flow'],
        priority: 'critical',
        description: 'E-commerce functionality tests'
      },
      legal: {
        tests: ['content_presence', 'link_validity', 'accessibility'],
        priority: 'low',
        description: 'Legal page content verification'
      },
      faq: {
        tests: ['accordion_functionality', 'content_visibility', 'search_functionality', 'accessibility'],
        priority: 'medium',
        description: 'FAQ interaction and content tests'
      },
      generic: {
        tests: ['smoke', 'performance', 'accessibility', 'broken_links'],
        priority: 'medium',
        description: 'Generic page tests'
      }
    };
  }

  /**
   * Crawl a domain using Crawl4AI
   * @param {string} domain - Domain to crawl
   * @param {number} depth - Crawl depth (1-3)
   * @param {number} maxPages - Maximum pages to discover
   * @returns {Promise<Object>} - Crawl results
   */
  async crawlDomain(domain, depth = 2, maxPages = 50) {
    const startTime = Date.now();
    logger.info(`Starting crawl for ${domain}`, { depth, maxPages });

    // Normalize domain to URL
    const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;

    try {
      // Call Crawl4AI API with minimal parameters
      const response = await axios.post(
        `${this.crawl4aiUrl}/crawl`,
        {
          urls: [baseUrl],
          priority: 10
        },
        {
          headers: {
            'Authorization': `Bearer ${this.crawl4aiToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      const crawlData = response.data;

      // Check for error in response
      if (crawlData.detail || crawlData.error) {
        logger.warn('Crawl4AI returned error, using fallback:', crawlData.detail || crawlData.error);
        return this.fallbackDiscovery(baseUrl, maxPages);
      }

      // Crawl4AI returns results in an array
      const crawlResult = crawlData.results?.[0] || crawlData;

      // Check if crawl was successful
      if (!crawlResult.success) {
        logger.warn('Crawl4AI crawl failed, using fallback');
        return this.fallbackDiscovery(baseUrl, maxPages);
      }

      // Extract links from the crawled page
      const discoveredUrls = await this.extractLinks(baseUrl, crawlResult, depth, maxPages);

      // If we found too few pages, supplement with sitemap discovery
      if (discoveredUrls.length < 5) {
        logger.info('Few pages found via crawl, supplementing with sitemap discovery');
        const sitemapResult = await this.fallbackDiscovery(baseUrl, maxPages);

        // Merge results, avoiding duplicates
        const urlSet = new Set(discoveredUrls.map(p => p.url));
        for (const page of sitemapResult.pages) {
          if (!urlSet.has(page.url)) {
            discoveredUrls.push(page);
            urlSet.add(page.url);
          }
        }
      }

      const duration = Date.now() - startTime;
      logger.info(`Crawl completed for ${domain}`, {
        pagesDiscovered: discoveredUrls.length,
        duration: `${duration}ms`
      });

      return {
        success: true,
        domain,
        baseUrl,
        pages: discoveredUrls,
        totalPages: discoveredUrls.length,
        crawlDuration: duration
      };

    } catch (error) {
      logger.error('Crawl4AI error:', error.message);

      // Fallback: Try basic sitemap discovery
      return this.fallbackDiscovery(baseUrl, maxPages);
    }
  }

  /**
   * Extract and follow links from crawl result
   * @param {string} baseUrl - Base URL
   * @param {Object} crawlResult - Crawl4AI result
   * @param {number} depth - Remaining depth
   * @param {number} maxPages - Max pages
   * @returns {Promise<Array>} - Discovered URLs with metadata
   */
  async extractLinks(baseUrl, crawlResult, depth, maxPages) {
    const discoveredPages = [];
    const visited = new Set();
    const baseHost = new URL(baseUrl).hostname;

    // Parse the initial page
    const initialPage = {
      url: crawlResult.url || baseUrl,
      html: crawlResult.html || crawlResult.cleaned_html || '',
      title: crawlResult.metadata?.title || this.extractTitle(crawlResult.html || ''),
      depth: 0
    };
    discoveredPages.push(initialPage);
    visited.add(baseUrl);
    visited.add(crawlResult.url || baseUrl);

    const linksToFollow = [];

    // Use Crawl4AI's parsed links if available
    if (crawlResult.links) {
      // Internal links (same domain)
      const internalLinks = crawlResult.links.internal || [];
      for (const link of internalLinks) {
        const href = link.href || link;
        if (href && !visited.has(href)) {
          if (!/\.(jpg|jpeg|png|gif|svg|css|js|pdf|zip|ico|woff|woff2|ttf)$/i.test(href)) {
            linksToFollow.push(href);
            visited.add(href);
          }
        }
      }

      // External links that are same domain (subdomains)
      const externalLinks = crawlResult.links.external || [];
      for (const link of externalLinks) {
        const href = link.href || link;
        try {
          const linkHost = new URL(href).hostname;
          if (linkHost.includes(baseHost) || baseHost.includes(linkHost)) {
            if (!visited.has(href) && !/\.(jpg|jpeg|png|gif|svg|css|js|pdf|zip|ico|woff|woff2|ttf)$/i.test(href)) {
              linksToFollow.push(href);
              visited.add(href);
            }
          }
        } catch (e) {
          // Invalid URL
        }
      }
    }

    // Fallback: Extract links from HTML if Crawl4AI didn't provide them
    if (linksToFollow.length === 0) {
      const linkRegex = /href=["']([^"']+)["']/gi;
      const html = crawlResult.html || crawlResult.cleaned_html || '';
      let match;

      while ((match = linkRegex.exec(html)) !== null) {
        try {
          let link = match[1];
          if (link.startsWith('#') || link.startsWith('javascript:') ||
              link.startsWith('mailto:') || link.startsWith('tel:')) {
            continue;
          }
          const absoluteUrl = new URL(link, baseUrl).href;
          const urlHost = new URL(absoluteUrl).hostname;
          if ((urlHost === baseHost || urlHost.includes(baseHost)) && !visited.has(absoluteUrl)) {
            if (!/\.(jpg|jpeg|png|gif|svg|css|js|pdf|zip|ico|woff|woff2|ttf)$/i.test(absoluteUrl)) {
              linksToFollow.push(absoluteUrl);
              visited.add(absoluteUrl);
            }
          }
        } catch (e) {
          // Invalid URL
        }
      }
    }

    // Follow links up to maxPages
    const pagesToCrawl = linksToFollow.slice(0, maxPages - 1);

    if (depth > 1 && pagesToCrawl.length > 0) {
      // Batch crawl discovered pages
      const batchResults = await this.batchCrawl(pagesToCrawl);

      for (const result of batchResults) {
        if (result.success) {
          discoveredPages.push({
            url: result.url,
            html: result.html || '',
            title: result.title || this.extractTitle(result.html || ''),
            depth: 1
          });
        }
      }
    } else {
      // Just add URLs without crawling content
      for (const url of pagesToCrawl) {
        discoveredPages.push({
          url,
          html: '',
          title: '',
          depth: 1
        });
      }
    }

    return discoveredPages;
  }

  /**
   * Batch crawl multiple URLs
   * @param {Array<string>} urls - URLs to crawl
   * @returns {Promise<Array>} - Results
   */
  async batchCrawl(urls) {
    const results = [];
    const batchSize = 5;

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);

      const batchPromises = batch.map(async (url) => {
        try {
          const response = await axios.post(
            `${this.crawl4aiUrl}/crawl`,
            {
              urls: [url],
              priority: 5
            },
            {
              headers: {
                'Authorization': `Bearer ${this.crawl4aiToken}`,
                'Content-Type': 'application/json'
              },
              timeout: 30000
            }
          );

          const result = response.data.results?.[0] || response.data;
          return {
            success: true,
            url,
            html: result.html || result.cleaned_html || '',
            title: result.metadata?.title || this.extractTitle(result.html || '')
          };
        } catch (error) {
          return { success: false, url, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches
      if (i + batchSize < urls.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    return results;
  }

  /**
   * Fallback discovery using sitemap and common paths
   * @param {string} baseUrl - Base URL
   * @param {number} maxPages - Max pages
   * @returns {Promise<Object>} - Discovery results
   */
  async fallbackDiscovery(baseUrl, maxPages) {
    logger.info('Using fallback discovery method');
    const discoveredPages = [];
    const visited = new Set();

    // Try sitemap first
    const sitemapUrls = await this.fetchSitemap(baseUrl);

    if (sitemapUrls.length > 0) {
      for (const url of sitemapUrls.slice(0, maxPages)) {
        if (!visited.has(url)) {
          discoveredPages.push({ url, html: '', title: '', depth: 0 });
          visited.add(url);
        }
      }
    }

    // Add common paths if sitemap is empty or small
    if (discoveredPages.length < 10) {
      const commonPaths = [
        '/', '/about', '/contact', '/services', '/products', '/blog',
        '/faq', '/pricing', '/team', '/careers', '/privacy', '/terms',
        '/login', '/signup', '/support', '/help'
      ];

      for (const path of commonPaths) {
        const url = new URL(path, baseUrl).href;
        if (!visited.has(url) && discoveredPages.length < maxPages) {
          discoveredPages.push({ url, html: '', title: '', depth: 0 });
          visited.add(url);
        }
      }
    }

    return {
      success: true,
      domain: new URL(baseUrl).hostname,
      baseUrl,
      pages: discoveredPages,
      totalPages: discoveredPages.length,
      method: 'fallback'
    };
  }

  /**
   * Fetch and parse sitemap
   * @param {string} baseUrl - Base URL
   * @returns {Promise<Array<string>>} - Sitemap URLs
   */
  async fetchSitemap(baseUrl) {
    const sitemapUrls = [];
    const sitemapLocations = ['/sitemap.xml', '/sitemap_index.xml', '/sitemap/sitemap.xml'];

    for (const location of sitemapLocations) {
      try {
        const response = await axios.get(`${baseUrl}${location}`, { timeout: 10000 });
        const xml = response.data;

        // Extract URLs from sitemap
        const urlRegex = /<loc>([^<]+)<\/loc>/gi;
        let match;
        while ((match = urlRegex.exec(xml)) !== null) {
          sitemapUrls.push(match[1]);
        }

        if (sitemapUrls.length > 0) break;
      } catch (error) {
        // Sitemap not found at this location
      }
    }

    return sitemapUrls;
  }

  /**
   * Extract title from HTML
   * @param {string} html - HTML content
   * @returns {string} - Page title
   */
  extractTitle(html) {
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match ? match[1].trim() : '';
  }

  /**
   * Classify a page based on URL and HTML content
   * @param {Object} page - Page object with url and html
   * @returns {Object} - Classification result
   */
  classifyPage(page) {
    const { url, html } = page;
    const urlLower = url.toLowerCase();
    const htmlLower = (html || '').toLowerCase();

    const scores = {};

    // Score each page type
    for (const [type, patterns] of Object.entries(this.pagePatterns)) {
      let score = 0;

      // Check URL patterns
      for (const pattern of patterns.urlPatterns) {
        if (pattern.test(urlLower)) {
          score += 2 * patterns.weight;
        }
      }

      // Check HTML indicators
      for (const indicator of patterns.htmlIndicators) {
        if (htmlLower.includes(indicator.toLowerCase())) {
          score += 1 * patterns.weight;
        }
      }

      scores[type] = score;
    }

    // Find the highest scoring type
    let maxScore = 0;
    let pageType = 'generic';

    for (const [type, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        pageType = type;
      }
    }

    // Confidence based on score
    const confidence = Math.min(maxScore / 5, 1.0);

    return {
      type: pageType,
      confidence: parseFloat(confidence.toFixed(2)),
      scores,
      suggestedTests: this.testTemplates[pageType] || this.testTemplates.generic
    };
  }

  /**
   * Classify all discovered pages
   * @param {Array} pages - Array of page objects
   * @returns {Object} - Classified pages grouped by type
   */
  classifyPages(pages) {
    const classified = {
      form: [],
      article: [],
      landing: [],
      ecommerce: [],
      legal: [],
      faq: [],
      generic: []
    };

    for (const page of pages) {
      const classification = this.classifyPage(page);
      page.classification = classification;

      if (classified[classification.type]) {
        classified[classification.type].push(page);
      } else {
        classified.generic.push(page);
      }
    }

    return classified;
  }

  /**
   * Generate test suites based on classified pages
   * @param {Object} classifiedPages - Pages grouped by type
   * @param {string} domain - Domain name
   * @returns {Array} - Generated test suites
   */
  generateTestSuites(classifiedPages, domain) {
    const testSuites = [];
    const suiteId = uuidv4();

    for (const [pageType, pages] of Object.entries(classifiedPages)) {
      if (pages.length === 0) continue;

      const template = this.testTemplates[pageType] || this.testTemplates.generic;

      const suite = {
        id: `${suiteId}-${pageType}`,
        name: `${domain} - ${pageType.charAt(0).toUpperCase() + pageType.slice(1)} Tests`,
        type: pageType,
        priority: template.priority,
        description: template.description,
        pages: pages.map(p => ({
          url: p.url,
          title: p.title || 'Untitled',
          confidence: p.classification?.confidence || 0
        })),
        tests: template.tests,
        totalPages: pages.length,
        estimatedDuration: this.estimateTestDuration(template.tests, pages.length),
        createdAt: new Date().toISOString()
      };

      testSuites.push(suite);
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    testSuites.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return testSuites;
  }

  /**
   * Estimate test duration
   * @param {Array} tests - Test types
   * @param {number} pageCount - Number of pages
   * @returns {string} - Estimated duration
   */
  estimateTestDuration(tests, pageCount) {
    const testTimes = {
      smoke: 5,
      performance: 15,
      visual_regression: 10,
      accessibility: 8,
      input_validation: 10,
      required_fields: 5,
      form_submission: 8,
      error_messages: 5,
      broken_links: 3,
      image_loading: 2,
      readability: 2,
      seo_meta: 2,
      cta_visibility: 3,
      responsive: 10,
      product_display: 5,
      add_to_cart: 8,
      price_display: 3,
      inventory: 5,
      checkout_flow: 15,
      content_presence: 2,
      link_validity: 3,
      accordion_functionality: 5,
      content_visibility: 3,
      search_functionality: 5
    };

    let totalSeconds = 0;
    for (const test of tests) {
      totalSeconds += (testTimes[test] || 5) * pageCount;
    }

    if (totalSeconds < 60) {
      return `${totalSeconds} seconds`;
    } else if (totalSeconds < 3600) {
      return `${Math.ceil(totalSeconds / 60)} minutes`;
    } else {
      return `${(totalSeconds / 3600).toFixed(1)} hours`;
    }
  }

  /**
   * Send webhook notification
   * @param {string} webhookUrl - Webhook URL to notify
   * @param {Object} data - Data to send
   */
  async sendWebhook(webhookUrl, data) {
    if (!webhookUrl) return;

    try {
      await axios.post(webhookUrl, data, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      logger.info(`Webhook notification sent to ${webhookUrl}`);
    } catch (error) {
      logger.error(`Webhook notification failed: ${error.message}`);
    }
  }

  /**
   * Run full discovery and classification
   * @param {Object} config - Discovery configuration
   * @returns {Promise<Object>} - Full discovery result
   */
  async discover(config) {
    const {
      domain,
      depth = 2,
      maxPages = 50,
      autoTest = false,
      webhookUrl = null
    } = config;

    const runId = uuidv4();
    const startTime = Date.now();

    logger.info(`Starting discovery for ${domain}`, { runId, depth, maxPages });

    try {
      // Step 1: Crawl the domain
      const crawlResult = await this.crawlDomain(domain, depth, maxPages);

      if (!crawlResult.success) {
        throw new Error('Crawl failed');
      }

      // Step 2: Classify all pages
      const classifiedPages = this.classifyPages(crawlResult.pages);

      // Step 3: Generate test suites
      const testSuites = this.generateTestSuites(classifiedPages, domain);

      // Step 4: Calculate summary
      const summary = {
        totalPages: crawlResult.totalPages,
        byType: {}
      };

      for (const [type, pages] of Object.entries(classifiedPages)) {
        if (pages.length > 0) {
          summary.byType[type] = pages.length;
        }
      }

      // Step 5: Save discovery result to storage
      const discoveryResult = {
        runId,
        domain,
        baseUrl: crawlResult.baseUrl,
        discoveredAt: new Date().toISOString(),
        duration: Date.now() - startTime,
        summary,
        classifiedPages,
        testSuites,
        autoTest
      };

      // Upload to MinIO
      const reportUrl = await storage.uploadJSON(
        discoveryResult,
        `discoveries/${runId}-discovery.json`
      );

      logger.info(`Discovery completed for ${domain}`, {
        runId,
        totalPages: summary.totalPages,
        testSuites: testSuites.length,
        duration: `${Date.now() - startTime}ms`
      });

      const result = {
        success: true,
        runId,
        domain,
        summary,
        testSuites,
        reportUrl,
        duration: Date.now() - startTime
      };

      // Send webhook notification if configured
      if (webhookUrl) {
        await this.sendWebhook(webhookUrl, {
          event: 'discovery_completed',
          ...result
        });
      }

      return result;

    } catch (error) {
      logger.error('Discovery error:', error);
      throw error;
    }
  }
}

module.exports = new DiscoveryService();
