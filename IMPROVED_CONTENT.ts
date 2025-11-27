// ========================================
// 🔧 IMPROVED CONTENT SCRIPT 
// ========================================
// هذا ملف محسّن يحل المشاكل الأساسية

import { langs, LangText, LangType } from "../lib/langs";
import { Popup } from "../lib/popup";
import { Storage } from "../lib/storage";

interface MWindow extends Window {
  pausecc?: boolean;
}
declare let window: MWindow;

const storage = new Storage();
storage.setup().then(() => console.debug("[FBI] Storage ready"));

// ========================================
// ENHANCED LOGGING
// ========================================
const DEBUG_MODE = true; // Set to false in production

const Logger = {
  log: (msg: string, ...args: any[]) => {
    console.log(`[FBI] ${msg}`, ...args);
  },
  warn: (msg: string, ...args: any[]) => {
    console.warn(`[FBI] ${msg}`, ...args);
  },
  error: (msg: string, ...args: any[]) => {
    console.error(`[FBI] ${msg}`, ...args);
  },
  debug: (msg: string, ...args: any[]) => {
    if (DEBUG_MODE) console.debug(`[FBI DEBUG] ${msg}`, ...args);
  }
};

// ========================================
// IMPROVED FEED DETECTION
// ========================================
class FeedDetector {
  private static foundFeed: Element | null = null;

  /**
   * استراتيجيات متعددة للعثور على الـ Feed
   */
  static findFeed(): Element | null {
    Logger.debug("Starting feed detection...");

    // Strategy 1: Look for role="main"
    let feed = document.querySelector('[role="main"]');
    if (feed) {
      Logger.log("Found feed using role=main");
      this.foundFeed = feed;
      return feed;
    }

    // Strategy 2: Look for feed role
    feed = document.querySelector('[role="feed"]');
    if (feed) {
      Logger.log("Found feed using role=feed");
      this.foundFeed = feed;
      return feed;
    }

    // Strategy 3: Look for data-pagelet containing "Feed"
    feed = document.querySelector('[data-pagelet*="Feed"]');
    if (feed) {
      Logger.log("Found feed using data-pagelet");
      this.foundFeed = feed;
      return feed;
    }

    // Strategy 4: Look for common class patterns
    const possibleFeeds = document.querySelectorAll('[class*="feed"]');
    if (possibleFeeds.length > 0) {
      feed = possibleFeeds[0] as Element;
      Logger.log("Found feed using class pattern");
      this.foundFeed = feed;
      return feed;
    }

    Logger.warn("Could not find feed with any strategy");
    return null;
  }

  /**
   * Get cached feed if available
   */
  static getCachedFeed(): Element | null {
    if (this.foundFeed && document.body.contains(this.foundFeed)) {
      return this.foundFeed;
    }
    // Cache invalid, search again
    return this.findFeed();
  }
}

// ========================================
// IMPROVED CONTENT MATCHER
// ========================================
class ContentMatcher {
  /**
   * فحص ذكي للمحتوى بيستخدم عدة طرق
   */
  static matchesKeywords(element: Element, keywords: string[]): boolean {
    // Get all text sources
    const textContent = (element.textContent || "").toLowerCase();
    const innerHTML = element.innerHTML.toLowerCase();
    const ariaLabel = (element.getAttribute("aria-label") || "").toLowerCase();
    const dataContent = (element.getAttribute("data-content") || "").toLowerCase();

    // Check all sources
    for (const keyword of keywords) {
      const lowerKeyword = keyword.toLowerCase();
      if (
        textContent.includes(lowerKeyword) ||
        innerHTML.includes(lowerKeyword) ||
        ariaLabel.includes(lowerKeyword) ||
        dataContent.includes(lowerKeyword)
      ) {
        Logger.debug(`Matched keyword: ${keyword}`);
        return true;
      }
    }

    return false;
  }

  /**
   * فحص البوستات استخدام role="article"
   */
  static getAllPosts(): Element[] {
    const posts = Array.from(document.querySelectorAll('[role="article"]'));
    Logger.debug(`Found ${posts.length} posts`);
    return posts;
  }
}

// ========================================
// CONTENT CLEANER - IMPROVED
// ========================================
class ContentCleaner {
  private config: any;
  private lang: string;
  private parsedLang: any;

  constructor(config: any, lang: string = "ar") {
    this.config = config;
    this.lang = lang;
    this.parsedLang = this.getLangData(lang);
  }

  private getLangData(lang: string) {
    let data = (langs as any)[lang];
    if (!data) {
      Logger.warn(`Language ${lang} not found, falling back to English`);
      data = langs.en;
    }
    return data;
  }

  /**
   * إخفاء عنصر مع banner
   */
  private hideElement(element: Element, reason: string) {
    const htmlElement = element as HTMLElement;
    
    // Add classes
    htmlElement.classList.add("redact-elem");
    if (this.config.contentCovers !== false) {
      htmlElement.classList.add("redact-elem-cover");
    }
    if (this.config.hideBlocks === true) {
      htmlElement.classList.add("complete-redact");
    }

    // Add custom attribute for reason
    htmlElement.setAttribute("data-hidden-reason", reason);
    
    Logger.debug(`Hidden element: ${reason}`);
  }

  /**
   * فحص وإخفاء Reels
   */
  private checkReels(element: Element): boolean {
    if (this.config.reels !== true) return false;

    const reelsKeywords = Array.isArray(this.parsedLang.reelsBlock)
      ? this.parsedLang.reelsBlock
      : [this.parsedLang.reelsBlock];

    reelsKeywords.push("Reels", "reels", "REELS"); // Always include English

    if (ContentMatcher.matchesKeywords(element, reelsKeywords)) {
      this.hideElement(element, "reels");
      return true;
    }

    return false;
  }

  /**
   * فحص وإخفاء الاقتراحات
   */
  private checkSuggestions(element: Element): boolean {
    if (this.config.suggestions !== true) return false;

    const suggestedKeywords = Array.isArray(this.parsedLang.suggested)
      ? this.parsedLang.suggested
      : [this.parsedLang.suggested];

    suggestedKeywords.push("Suggested for you", "Suggested", "Join", "Follow");

    if (ContentMatcher.matchesKeywords(element, suggestedKeywords)) {
      this.hideElement(element, "suggested");
      return true;
    }

    return false;
  }

  /**
   * فحص وإخفاء الإعلانات
   */
  private checkAds(element: Element): boolean {
    // Check for ads using multiple methods
    const innerHTML = element.innerHTML;
    
    if (innerHTML.includes("/ads/about/")) {
      this.hideElement(element, "ad");
      return true;
    }

    // Check aria-label for "Sponsored"
    const ariaLabel = element.getAttribute("aria-label") || "";
    if (ariaLabel.toLowerCase().includes("sponsored") || 
        ariaLabel.toLowerCase().includes("ممول") ||
        ariaLabel.toLowerCase().includes("إعلان")) {
      this.hideElement(element, "ad");
      return true;
    }

    return false;
  }

  /**
   * المعالج الرئيسي
   */
  public async clean() {
    Logger.log("Starting content cleaning...");

    const feed = FeedDetector.getCachedFeed();
    if (!feed) {
      Logger.error("Feed not found!");
      // Show error popup after retries
      return;
    }

    // Get all posts
    const posts = ContentMatcher.getAllPosts();
    Logger.log(`Processing ${posts.length} posts...`);

    let stats = {
      total: posts.length,
      hidden: 0,
      reels: 0,
      ads: 0,
      suggestions: 0
    };

    for (const post of posts) {
      // Skip if already processed
      if (post.classList.contains("redact-elem")) {
        continue;
      }

      // Check different types
      if (this.checkReels(post)) {
        stats.reels++;
        stats.hidden++;
        continue;
      }

      if (this.checkAds(post)) {
        stats.ads++;
        stats.hidden++;
        continue;
      }

      if (this.checkSuggestions(post)) {
        stats.suggestions++;
        stats.hidden++;
        continue;
      }

      // TODO: Add more checks (commentedOn, tagged, etc.)
    }

    Logger.log("Cleaning completed:", stats);
  }
}

// ========================================
// INITIALIZATION
// ========================================
const initExtension = async () => {
  Logger.log("Initializing FBI-Hidden Extension...");

  await storage.setup();
  const config = await storage.get("data");
  
  Logger.log("Configuration loaded:", config);

  // Check if first time
  if (config.version === "0.0.0") {
    Logger.log("First time setup");
    await Popup.initWebStartHome(false);
    return;
  }

  // Create cleaner
  const cleaner = new ContentCleaner(config, "ar"); // Use detected language

  // Initial clean
  await cleaner.clean();

  // Setup observer
  const observer = new MutationObserver(async () => {
    Logger.debug("DOM mutation detected, re-cleaning...");
    await cleaner.clean();
  });

  // Observe feed
  const feed = FeedDetector.getCachedFeed();
  if (feed) {
    observer.observe(feed, {
      childList: true,
      subtree: true
    });
    Logger.log("MutationObserver attached");
  }

  // Periodic backup clean
  setInterval(async () => {
    Logger.debug("Periodic clean triggered");
    await cleaner.clean();
  }, 30000); // Every 30 seconds

  Logger.log("Extension fully initialized ✅");
};

// Start when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initExtension);
} else {
  initExtension();
}
