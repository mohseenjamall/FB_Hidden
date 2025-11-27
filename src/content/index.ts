import { langs, LangText, LangType } from "../lib/langs";
import { Popup } from "../lib/popup";
import { Storage } from "../lib/storage";
interface MWindow extends Window {
  pausecc?: boolean;
}
declare let window: MWindow;

const storage = new Storage();
storage.setup().then(() => console.debug("storage ready."));

// if (window.location.pathname === "/") {
//   document
//     .querySelectorAll('div[role="main"]')
//     .forEach((x) => x.setAttribute("visible", "hide"));
// } else {
//   document
//     .querySelectorAll('div[role="main"]')
//     .forEach((x) => x.setAttribute("visible", "show"));
// }

let consolelogs: Array<{ type: "log" | "warn" | "error"; msg: string }> = [];
const consoleLog = {
  _addLog: (type: "log" | "warn" | "error", msg: string) => {
    if (consolelogs.length > 100) consolelogs.shift();
    consolelogs.push({ type, msg });
    console[type](`[FBI] ${msg}`);
  },
  log: (msg: string) => {
    consoleLog._addLog("log", msg);
  },
  warn: (msg: string) => {
    consoleLog._addLog("warn", msg);
  },
  error: (msg: string) => {
    consoleLog._addLog("error", msg);
  },
  debug: (msg: string) => {
    if (DEBUG_MODE) console.debug(`[FBI DEBUG] ${msg}`);
  },
};

const LANGS = () => JSON.parse(JSON.stringify(langs));

let forceReloadRequested = false;
let asLang =
  window.localStorage.getItem("fbhrar_locale") ??
  document.documentElement.lang ??
  "en";
let parsedLang: (LangType & LangText) | undefined = LANGS()[asLang];
const setLANG = (lang: string) => {
  asLang = lang;
  parsedLang = LANGS()[lang];

  if (parsedLang !== undefined && lang !== "en") {
    for (let key of Object.keys(LANGS().en)) {
      if ((parsedLang as any)[key] === undefined) {
        (parsedLang as any)[key] = (LANGS()["en"] as any)[key];
      }
    }
  }

  if (parsedLang === undefined) {
    parsedLang = LANGS().en;
  }
};

const DEBUG_MODE =
  window.location.hostname ===
  "chrome-facebook-hide-ads-and-reels.mrincops.net" &&
  window.location.pathname.indexOf("/diag/") === 0;

if (DEBUG_MODE) consoleLog.warn("DEBUG MODE ENABLED");

// let fullPageLoaderConfig: any = null;
// storage.setup().then(() => {
//   storage.get("data").then(async (config) => {
//     fullPageLoaderConfig = config;
//     if (config.fullPageLoader === true) return;
//     document
//       .querySelectorAll('div[role="main"]')
//       .forEach((x) => x.setAttribute("visible", "show"));
//   });
// });
// window.addEventListener("popstate", function (event) {
//   if (window.location.pathname === "/") {
//     document
//       .querySelectorAll('div[role="main"]')
//       .forEach((x) => x.setAttribute("visible", "hide"));
//     if (fullPageLoaderConfig !== null)
//       contentCleaner("post-state", false, fullPageLoaderConfig);
//   } else {
//     document
//       .querySelectorAll('div[role="main"]')
//       .forEach((x) => x.setAttribute("visible", "show"));
//   }
// });

const redactAddElem = (key: string, elemA: Element, config: any) => {
  let elem = elemA as HTMLElement;

  if (elem.innerHTML == "") {
    elem.style.display = "none";
  }

  // generate a random UUID
  let uid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    let r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

  elem.classList.add("redact-elem");
  if (config.contentCovers !== false) {
    elem.classList.add("redact-elem-cover");
  }
  if (config.hideBlocks === true) {
    elem.classList.add("complete-redact");
  }
  elem.classList.add("redact-elemid-" + uid);
  let setText: string | null = null;
  if ((parsedLang as any)["_" + key] !== undefined)
    setText = (parsedLang as any)["_" + key];
  if (setText !== null) {
    try {
      let elem = document.querySelector(
        ".redact-elemid-" + uid + " h4 span a span"
      )!;
      while (elem.children.length > 0) {
        elem = elem.children[0] as HTMLElement;
      }
      let itemTitle = elem.innerHTML;
      setText += ` (${decodeURIComponent(itemTitle)})`;
    } catch (e) { }
    elem.children[0].setAttribute("ctext", setText);
  }

  // Click to show functionality disabled
  /*
  if (config.clickToShow !== false) {
    elem.classList.add("can-show");
    elem.addEventListener("click", (e) => {
      if (elem.classList.contains("temp-show")) {
        e.preventDefault();
        elem.classList.remove("temp-show");
        return;
      }
      e.preventDefault();
      elem.classList.add("temp-show");
      elem.classList.add("redact-elem-cover");
    });
  }
  */
};

// ===== Helper Functions for Content Detection =====

// Helper: Check if element is a Reels Block (dedicated section)
const isReelsBlock = (elem: Element): boolean => {
  // Articles are not Reels blocks - they are posts
  if (elem.querySelector('[role="article"]')) {
    return false;
  }

  // Look for Reels block header in h2, h3, h4 or span elements
  const headers = elem.querySelectorAll('h3, h4, h2, span[dir="auto"]');
  for (const header of headers) {
    const text = (header.textContent || '').toLowerCase().trim();

    // Check against language-specific Reels block strings
    const reelsTexts = typeof parsedLang!.reelsBlock === 'string'
      ? [parsedLang!.reelsBlock]
      : parsedLang!.reelsBlock || [];

    for (const reelText of reelsTexts) {
      // Exact match or starts with the text (avoiding false positives)
      if (text === reelText.toLowerCase() ||
        text.startsWith(reelText.toLowerCase())) {
        consoleLog.debug(`Found Reels block by header: "${text}"`);
        return true;
      }
    }
  }

  return false;
};

// Helper: Check if article contains shared Reels
const containsSharedReels = (elem: Element): boolean => {
  // Must be an article
  if (elem.getAttribute('role') !== 'article') {
    return false;
  }

  // Check for Reels-specific data attributes and aria labels
  const hasReelsIndicator =
    elem.querySelector('[data-pagelet*="Reel"]') !== null ||
    elem.querySelector('[data-pagelet*="reel"]') !== null ||
    elem.querySelector('[aria-label*="Reel"]') !== null ||
    elem.querySelector('[aria-label*="reel"]') !== null ||
    elem.querySelector('[aria-label*="ريلز"]') !== null;

  if (hasReelsIndicator) {
    consoleLog.debug('Found shared Reels by data attributes');
    return true;
  }

  // Check for video with Reels-specific class or structure
  const videos = elem.querySelectorAll('video');
  for (const video of videos) {
    const parent = video.parentElement;
    if (parent) {
      const classes = parent.className || '';
      const ariaLabel = parent.getAttribute('aria-label') || '';
      if (classes.includes('reel') || classes.includes('Reel') ||
        ariaLabel.includes('Reel') || ariaLabel.includes('ريلز')) {
        consoleLog.debug('Found shared Reels by video element');
        return true;
      }
    }
  }

  return false;
};

// Helper: Safe text search in specific elements only (headers/titles)
const hasTextInHeaders = (elem: Element, searchTexts: string[]): boolean => {
  const headers = elem.querySelectorAll('h3, h4, h2, span[dir="auto"]');
  for (const header of headers) {
    const text = (header.textContent || '').toLowerCase();
    for (const searchText of searchTexts) {
      if (text.includes(searchText.toLowerCase())) {
        return true;
      }
    }
  }
  return false;
};

// Helper: Check for suggested content (groups, pages, events)
const isSuggestedContent = (elem: Element): boolean => {
  // Check headers and spans for suggested keywords
  const headers = elem.querySelectorAll('h3, h4, h2, span[dir="auto"], span');

  const suggestedTexts = typeof parsedLang!.suggested === 'string'
    ? [parsedLang!.suggested]
    : parsedLang!.suggested || [];

  for (const header of headers) {
    const text = (header.textContent || '').toLowerCase().trim();

    for (const suggestedText of suggestedTexts) {
      const searchText = suggestedText.toLowerCase();

      // Check if text contains the suggested keyword
      if (text.includes(searchText)) {
        consoleLog.debug(`Found suggested content: "${text}"`);
        return true;
      }
    }
  }

  return false;
};




let definedFeedHolder = false;
const findFeedHolder = (lang: string) => {
  if (definedFeedHolder) {
    let newsFeedHolder = window.document.getElementsByClassName(
      "defined-feed-holder"
    );
    if (newsFeedHolder.length > 0) return newsFeedHolder[0];
    definedFeedHolder = false;
    consoleLog.warn("Couldnt find defined-feed-holder, trying again");
  }
  setLANG(lang);
  consoleLog.warn("contentCleaner: findFeedHolder: lang: " + lang);

  // Strategy 1: Try modern selectors first (more reliable)
  let modernFeed: Element | null = null;

  // Try role="main" selector
  modernFeed = document.querySelector('[role="main"]');
  if (modernFeed && modernFeed.querySelectorAll('[role="article"]').length > 0) {
    consoleLog.log("contentCleaner: Found feed using role='main'");
    definedFeedHolder = true;
    modernFeed.classList.add("defined-feed-holder");
    return modernFeed;
  }

  // Try data-pagelet with "Feed" or "Newsfeed"
  modernFeed = document.querySelector('[data-pagelet*="Feed"]');
  if (modernFeed) {
    consoleLog.log("contentCleaner: Found feed using data-pagelet*='Feed'");
    definedFeedHolder = true;
    modernFeed.classList.add("defined-feed-holder");
    return modernFeed;
  }

  // Try role="feed"
  modernFeed = document.querySelector('[role="feed"]');
  if (modernFeed) {
    consoleLog.log("contentCleaner: Found feed using role='feed'");
    definedFeedHolder = true;
    modernFeed.classList.add("defined-feed-holder");
    return modernFeed;
  }

  // Try finding container of articles
  const articles = document.querySelectorAll('[role="article"]');
  if (articles.length > 2) {
    const parent = articles[0].parentElement;
    if (parent) {
      consoleLog.log("contentCleaner: Found feed as parent of articles");
      definedFeedHolder = true;
      parent.classList.add("defined-feed-holder");
      return parent;
    }
  }

  // Strategy 2: Fallback to legacy text matching
  for (let feedHeader of window.document.querySelectorAll('h3[dir="auto"]')) {
    for (let looper of typeof parsedLang!.newsFeedPosts! === "string"
      ? [parsedLang!.newsFeedPosts!]
      : parsedLang!.newsFeedPosts!) {
      if (feedHeader.innerHTML.toLowerCase() === looper.toLowerCase()) {
        consoleLog.log("contentCleaner: try main finder - 1");
        if (feedHeader.parentNode!.children.length > 3) {
          definedFeedHolder = true;
          (feedHeader.parentNode as Element).classList.add(
            "defined-feed-holder"
          );
          return feedHeader.parentNode as Element;
        }
        continue;
      }
    }
  }
  for (let feedHeader of window.document.querySelectorAll('h3[dir="auto"]')) {
    for (let looper of typeof parsedLang!.newsFeedPosts! === "string"
      ? [parsedLang!.newsFeedPosts!]
      : parsedLang!.newsFeedPosts!) {
      if (feedHeader.innerHTML.toLowerCase() === looper.toLowerCase()) {
        consoleLog.log("contentCleaner: try main finder - 2");
        if ((feedHeader.parentNode as Element).children.length === 2) {
          if (
            (feedHeader.parentNode as Element).children[0].tagName !== "H3" ||
            (feedHeader.parentNode as Element).children[1].tagName !== "DIV"
          )
            continue;
          definedFeedHolder = true;
          (feedHeader.parentNode as Element).children[1].classList.add(
            "defined-feed-holder"
          );
          return (feedHeader.parentNode as Element).children[1];
        }
        continue;
      }
    }
  }
  for (let feedHeader of window.document.querySelectorAll('h3[dir="auto"]')) {
    for (let looper of typeof parsedLang!.newsFeedPosts! === "string"
      ? [parsedLang!.newsFeedPosts!]
      : parsedLang!.newsFeedPosts!) {
      if (feedHeader.innerHTML.toLowerCase() === looper.toLowerCase()) {
        consoleLog.log("contentCleaner: try main finder - 3");
        if ((feedHeader.parentNode as Element).children.length === 3) {
          if (
            (feedHeader.parentNode as Element).children[0].tagName !== "H3" ||
            (feedHeader.parentNode as Element).children[1].tagName !== "DIV" ||
            (feedHeader.parentNode as Element).children[2].tagName !== "DIV" ||
            (feedHeader.parentNode as Element).children[2].children.length === 0
          )
            continue;
          definedFeedHolder = true;
          (feedHeader.parentNode as Element).children[2].classList.add(
            "defined-feed-holder"
          );
          return (feedHeader.parentNode as Element).children[2];
        }
        continue;
      }
    }
  }
  for (let feedHeader of window.document.querySelectorAll('h2[dir="auto"]')) {
    for (let looper of typeof parsedLang!.newsFeedPosts! === "string"
      ? [parsedLang!.newsFeedPosts!]
      : parsedLang!.newsFeedPosts!) {
      if (feedHeader.innerHTML.toLowerCase() === looper.toLowerCase()) {
        consoleLog.log("contentCleaner: try main finder - 4");
        if ((feedHeader.parentNode as Element).children.length === 2) {
          if (
            (feedHeader.parentNode as Element).children[0].tagName !== "H2" ||
            (feedHeader.parentNode as Element).children[1].tagName !== "DIV" ||
            (feedHeader.parentNode as Element).children[1].children.length === 0
          )
            continue;
          definedFeedHolder = true;
          (feedHeader.parentNode as Element).children[1].classList.add(
            "defined-feed-holder"
          );
          return (feedHeader.parentNode as Element).children[1];
        }
        continue;
      }
    }
  }

  return null;
};

let paused = false;
let triedAllLangs = false;
let triedTwice = false;
let errorNotified = false;
let ccDebounceTimer: NodeJS.Timeout | null = null;
let observerDebounceTimer: NodeJS.Timeout | null = null;
let feedObserver: MutationObserver | null = null;
const contentCleaner = (
  key: string | undefined,
  isreRun = false,
  config: any
) => {
  if (errorNotified) return;
  if (window.pausecc === true) return;
  if (window.location.pathname !== "/" && !DEBUG_MODE) {
    paused = true;
    consoleLog.log(
      "contentCleaner:v" + storage.version + " - paused as not on home page"
    );
    definedFeedHolder = false;
    /*document
      .querySelectorAll('div[role="main"]')
      .forEach((x) => x.setAttribute("visible", "show"));*/
    return;
  }
  if (paused) {
    paused = false;
    /*document
      .querySelectorAll('div[role="main"]')
      .forEach((x) => x.setAttribute("visible", "hide"));*/
    // scrollTo(0, 1024);
    // setTimeout(() => {
    //   scrollTo(0, 0);
    //   contentCleaner("main-loader", false, config);
    //   setTimeout(() => {
    //     scrollTo(0, 0);
    //     document
    //       .querySelectorAll('div[role="main"]')
    //       .forEach((x) => x.setAttribute("visible", "show"));
    //   }, 100);
    // }, 1000);
  }
  consoleLog.log(
    "contentCleaner:v" + storage.version + " " + key + " lang: " + asLang
  );
  if (forceReloadRequested) {
    forceReloadRequested = false;
    return window.location.reload();
  }

  try {
    let feed: Element | null = findFeedHolder(asLang);
    /*feed = null as any;
    errorNotified = false;*/

    if (feed == null) {
      consoleLog.warn(
        "Cannot find feed with document lang, lets find it another way"
      );
      for (let lang of Object.keys(LANGS())) {
        feed = findFeedHolder(lang);
        if (feed != null) {
          consoleLog.log("Found feed with lang: " + lang);
          break;
        }
      }
    }
    //feed = null as any;
    if (feed == null) {
      if (window.location.pathname !== "/" && !DEBUG_MODE) {
        consoleLog.log(
          "contentCleaner:v" +
          storage.version +
          " - paused as not on home page2"
        );
        definedFeedHolder = false;
        return;
      }
      if (!triedAllLangs) {
        window.pausecc = true;
        setTimeout(() => {
          window.pausecc = false;
          triedAllLangs = true;
        }, 5000);
        consoleLog.warn(
          "Cannot find feed with default lang (and any), trying again to find with any lang after 5s."
        );
        return;
      }
      if (!triedTwice) {
        window.pausecc = true;
        setTimeout(() => {
          window.pausecc = false;
          triedTwice = true;
        }, 5000);
        consoleLog.warn(
          "Cannot find feed with any lang, trying again one more time after 5s."
        );
        return;
      }
      errorNotified = true;
      if (!DEBUG_MODE) Popup.initWebError();
      return consoleLog.warn("cannot find facebook feed");
    }
    if (window.localStorage.getItem("fbhrar_locale") ?? "ns" !== asLang) {
      window.localStorage.setItem("fbhrar_locale", asLang);
    }
    triedAllLangs = false;
    triedTwice = false;
    consoleLog.log(
      "contentCleaner:v" + storage.version + " " + key + " -clean"
    );
    let result = {
      total: feed.children.length,
      alreadyRedacted: 0,
      ignored: 0,
      opsignored: 0,
      redacted: {
        total: 0,
        reels: 0,
        games: 0,
        ads: 0,
        suggestions: 0,
        commentedOn: 0,
        answeredQuestion: 0,
        peopleMayKnow: 0,
      },
      monitoring: 0,
    };
    for (let elem of feed.children) {
      let upContinue = false;
      if (elem.classList.contains("redact-elem")) {
        result.alreadyRedacted += 1;
        continue;
      }
      if (elem.classList.contains("no-redact-elem")) {
        result.ignored += 1;
        continue;
      }
      for (let arrOfChecks of typeof parsedLang!.friendRequests! === "string"
        ? [parsedLang!.friendRequests!]
        : parsedLang!.friendRequests!) {
        if (
          elem.innerHTML.toLowerCase().indexOf(arrOfChecks.toLowerCase()) >= 0
        ) {
          if (config.friendRequests !== true) {
            elem.classList.add("no-redact-elem");
            elem.classList.add("no-reels-redact");
            result.opsignored += 1;
            upContinue = true;
            continue;
          }
          redactAddElem("friendRequests", elem, config);
          elem.classList.add("redact-elem-reels");
          result.redacted.reels += 1;
          upContinue = true;
          continue;
        }
      }
      if (upContinue) continue;

      // Check for Reels Block (dedicated section) using helper function
      if (isReelsBlock(elem)) {
        if (config.reels !== true) {
          elem.classList.add("no-redact-elem");
          elem.classList.add("no-reels-redact");
          result.opsignored += 1;
          upContinue = true;
          continue;
        }
        redactAddElem("reelsBlock", elem, config);
        elem.classList.add("redact-elem-reels");
        result.redacted.reels += 1;
        upContinue = true;
        continue;
      }
      if (upContinue) continue;

      // Check for shared Reels in articles using helper function
      if (containsSharedReels(elem)) {
        if (config.containsReels !== true) {
          elem.classList.add("no-redact-elem");
          elem.classList.add("no-reels-redact");
          result.opsignored += 1;
          upContinue = true;
          continue;
        }
        redactAddElem("containsReels", elem, config);
        elem.classList.add("redact-elem-reels");
        result.redacted.reels += 1;
        upContinue = true;
        continue;
      }
      if (upContinue) continue;
      for (let arrOfChecks of typeof parsedLang!.commentedOn! === "string"
        ? [parsedLang!.commentedOn!]
        : parsedLang!.commentedOn!) {
        if (
          elem.innerHTML
            .toLowerCase()
            .indexOf(" " + arrOfChecks.toLowerCase()) >= 0
        ) {
          if (config.commentedOn !== true) {
            elem.classList.add("no-redact-elem");
            elem.classList.add("no-commentedOn-redact");
            result.opsignored += 1;
            upContinue = true;
            continue;
          }
          redactAddElem("commentedOn", elem, config);
          elem.classList.add("redact-elem-commentedOn");
          result.redacted.commentedOn += 1;
          upContinue = true;
          continue;
        }
      }
      if (upContinue) continue;
      for (let arrOfChecks of typeof parsedLang!.commentedOnFriend! === "string"
        ? [parsedLang!.commentedOnFriend!]
        : parsedLang!.commentedOnFriend!) {
        if (
          elem.innerHTML
            .toLowerCase()
            .indexOf(" " + arrOfChecks.toLowerCase()) >= 0
        ) {
          if (config.commentedOnFriend !== true) {
            elem.classList.add("no-redact-elem");
            elem.classList.add("no-commentedOn-redact");
            result.opsignored += 1;
            upContinue = true;
            continue;
          }
          redactAddElem("commentedOnFriend", elem, config);
          elem.classList.add("redact-elem-commentedOn");
          result.redacted.commentedOn += 1;
          upContinue = true;
          continue;
        }
      }
      if (upContinue) continue;
      for (let arrOfChecks of typeof parsedLang!.tagged! === "string"
        ? [parsedLang!.tagged!]
        : parsedLang!.tagged!) {
        if (
          elem.innerHTML
            .toLowerCase()
            .indexOf(" " + arrOfChecks.toLowerCase()) >= 0
        ) {
          if (config.tagged !== true) {
            elem.classList.add("no-redact-elem");
            elem.classList.add("no-answeredQuestion-redact");
            result.opsignored += 1;
            upContinue = true;
            continue;
          }
          redactAddElem("tagged", elem, config);
          elem.classList.add("redact-elem-answeredQuestion");
          result.redacted.answeredQuestion += 1;
          upContinue = true;
          continue;
        }
      }
      if (upContinue) continue;
      for (let arrOfChecks of typeof parsedLang!.answeredQuestion! === "string"
        ? [parsedLang!.answeredQuestion!]
        : parsedLang!.answeredQuestion!) {
        if (
          elem.innerHTML
            .toLowerCase()
            .indexOf(" " + arrOfChecks.toLowerCase()) >= 0
        ) {
          if (config.answeredQuestion !== true) {
            elem.classList.add("no-redact-elem");
            elem.classList.add("no-answeredQuestion-redact");
            result.opsignored += 1;
            upContinue = true;
            continue;
          }
          redactAddElem("answeredQuestion", elem, config);
          elem.classList.add("redact-elem-answeredQuestion");
          result.redacted.answeredQuestion += 1;
          upContinue = true;
          continue;
        }
      }
      if (upContinue) continue;
      for (let arrOfChecks of typeof parsedLang!.peopleKnow! === "string"
        ? [parsedLang!.peopleKnow!]
        : parsedLang!.peopleKnow!) {
        if (
          elem.innerHTML.toLowerCase().indexOf(arrOfChecks.toLowerCase()) >= 0
        ) {
          if (config.peopleMayKnow !== true) {
            elem.classList.add("no-redact-elem");
            elem.classList.add("no-peopleMayKnow-redact");
            result.opsignored += 1;
            upContinue = true;
            continue;
          }
          redactAddElem("peopleKnow", elem, config);
          elem.classList.add("redact-elem-peopleMayKnow");
          result.redacted.peopleMayKnow += 1;
          upContinue = true;
          continue;
        }
      }
      if (upContinue) continue;
      for (let arrOfChecks of typeof parsedLang!.games! === "string"
        ? [parsedLang!.games!]
        : parsedLang!.games!) {
        if (
          elem.innerHTML.toLowerCase().indexOf(arrOfChecks.toLowerCase()) >= 0
        ) {
          if (config.games !== true) {
            elem.classList.add("no-redact-elem");
            elem.classList.add("no-games-redact");
            result.opsignored += 1;
            upContinue = true;
            continue;
          }
          redactAddElem("games", elem, config);
          elem.classList.add("redact-elem-games");
          result.redacted.games += 1;
          upContinue = true;
          continue;
        }
      }
      if (upContinue) continue;
      if (
        elem.innerHTML.indexOf("/ads/about/") > 0 /* ||
      (elem.innerHTML.indexOf(">p</div>") > 0 &&
        elem.innerHTML.indexOf(">S</div>") > 0 &&
        elem.innerHTML.indexOf(">o</div>") > 0 &&
        elem.innerHTML.indexOf(">n</div>") > 0 &&
        elem.innerHTML.indexOf(">s</div>") > 0 &&
        elem.innerHTML.indexOf(">r</div>") > 0 &&
        elem.innerHTML.indexOf(">e</div>") > 0 &&
        elem.innerHTML.indexOf(">d</div>") > 0 &&

        elem.innerHTML.indexOf('/groups/') < 0 &&
        elem.innerHTML.indexOf('/posts/') < 0
        )*/
      ) {
        redactAddElem("ad", elem, config);
        elem.classList.add("redact-elem-ads");
        result.redacted.ads += 1;
        continue;
      }

      // Check for suggested content (groups, pages, events) using helper function
      if (isSuggestedContent(elem)) {
        if (config.suggestions !== true) {
          elem.classList.add("no-redact-elem");
          elem.classList.add("no-suggestions-redact");
          result.opsignored += 1;
          upContinue = true;
          continue;
        }
        redactAddElem("suggested", elem, config);
        elem.classList.add("redact-elem-suggestions");
        result.redacted.suggestions += 1;
        upContinue = true;
        continue;
      }
      if (upContinue) continue;
      let contentCounter: string | number = `${elem.getAttribute("ccount") || ""
        }`;
      if (contentCounter == "") contentCounter = "0";
      contentCounter = Number.parseInt(contentCounter);
      contentCounter++;
      elem.setAttribute("ccount", contentCounter.toString());
      result.monitoring += 1;
      if (contentCounter >= 20) elem.classList.add("no-redact-elem");
    }
    result.redacted.total =
      result.redacted.reels +
      result.redacted.ads +
      result.redacted.suggestions +
      result.redacted.commentedOn +
      result.redacted.answeredQuestion +
      result.redacted.peopleMayKnow +
      result.alreadyRedacted;
    consoleLog.log(
      `contentCleaner: ` +
      `[opsIgnored: ${result.opsignored}/${result.total}] ` +
      `[alreadyRedacted: ${result.alreadyRedacted}/${result.total}] ` +
      `[ignored: ${result.ignored}/${result.total}] ` +
      `[monitoring: ${result.monitoring}/${result.total}] ` +
      `[redacted(reels,ads,suggestions,commentedOn,answeredQuestion,peopleMayKnow): ${result.redacted.reels},${result.redacted.ads},${result.redacted.suggestions},${result.redacted.commentedOn},${result.redacted.answeredQuestion},${result.redacted.peopleMayKnow}/${result.total}] ` +
      `[cleaned(redacted,ignored,monitoring): ${result.redacted.total},${result.ignored
      },${result.monitoring}=${result.redacted.total + result.ignored + result.monitoring
      }/${result.total}] `
    );

    if (ccDebounceTimer !== null) clearTimeout(ccDebounceTimer);
    if (document.getElementById("stories-container") === null) {
      let storiesDoc = document.querySelectorAll('div[aria-label="Stories"]');
      if (storiesDoc.length > 0) {
        let hiracDiv = storiesDoc[0].parentElement!;
        let max = 30;
        while (hiracDiv.classList.length > 0) {
          hiracDiv = hiracDiv.parentElement!;
          max = max - 1;
          if (max <= 0) return;
        }
        hiracDiv.setAttribute("id", "stories-container");
      }
      if (config.stories !== false) {
        let storiesDoc2 = document.getElementById("stories-container")!;
        for (let childH of storiesDoc2.children) {
          if (childH.getAttribute("id") === "fbcont-banner") continue;
          childH.classList.add("stories");
        }
      }
      if (document.getElementById("fbcont-banner") === null) {
        document.getElementById("stories-container")!.innerHTML =
          '<div id="fbcont-banner" class="redact-elem redact-elem-fbhaar" fbver="' +
          storage.version +
          '" fbtxt="Facebook Hide Recommendations and Reels v' +
          storage.version +
          '"></div>' +
          document.getElementById("stories-container")!.innerHTML;
      }
    }
    if (
      config.createPost !== false &&
      document.getElementById("createPost-container") === null
    ) {
      try {
        for (let elem of document.getElementsByTagName("h3")) {
          if (elem.innerHTML === parsedLang!.createAPost) {
            elem.parentElement!.parentElement!.parentElement!.parentElement!.setAttribute(
              "id",
              "createPost-container"
            );
            elem.parentElement!.parentElement!.parentElement!.parentElement!.style.display =
              "none";
            break;
          }
        }
      } catch (e: any) {
        consoleLog.error(e.message ?? e.toString());
      }
    }
    if (isreRun) return;
    ccDebounceTimer = setTimeout(() => {
      //if (`${lastAction}` != lastActionKey) return;
      contentCleaner("re-clear:" + key, true, config);
    }, 2000);
  } catch (xcc: any) {
    consoleLog.error(xcc.message ?? xcc.toString());
  }
};

/*if (parsedLang === undefined) {
  // unknown lang
  console.warn("Unknown lang!");
  if (window.location.pathname === "/") {
    alert(
      "FB Hide Recommendations and Reels: Unknown language! - Please log an issue on our GitHub page to add your language (" +
        (window.localStorage.getItem("fbhrar_locale") ??
          document.documentElement.lang) +
        "). This plugin cannot work without defining a language."
    );
  }
} else*/
//document.body.onload = async () => {
const runApp = async () => {
  await storage.setup();
  storage.get("data").then(async (config) => {
    setTimeout(() => contentCleaner(undefined, false, config), 0);
    if (config.version !== storage.version) {
      // new version alert
    }
    if (config.version === "0.0.0") {
      // config never set
      await Popup.initWebStartHome(false);
      return;
    }
    if (config.version !== storage.version && !DEBUG_MODE) {
      await Popup.initWebStartHome(
        config.version !== undefined &&
        config.version !== null &&
        config.version !== ""
      );
      return;
    }
    consoleLog.log("Known CC Config: " + JSON.stringify(config));
    if (config.needsDelay !== false) {
      consoleLog.log(
        "Delaying CC by 5s as per https://github.com/mrinc/Facebook-Hide-Recommendations-and-Reels/issues/15"
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    // Reduced timer interval - MutationObserver handles most changes
    let contentClearTimer = setInterval(
      () => contentCleaner("timer-backup", false, config),
      300000  // 5 minutes instead of 1 minute
    );

    // MutationObserver for efficient DOM watching
    const setupFeedObserver = () => {
      if (feedObserver) {
        feedObserver.disconnect();
      }

      const feed = document.querySelector('.defined-feed-holder');
      if (!feed) {
        consoleLog.warn("Feed holder not found for MutationObserver");
        return;
      }

      feedObserver = new MutationObserver((mutations) => {
        if (window.pausecc === true) return;

        let hasNewContent = false;

        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
              if (node instanceof HTMLElement) {
                if (node.matches('[role="article"]') ||
                  node.querySelector('[role="article"]')) {
                  hasNewContent = true;
                  break;
                }
              }
            }
          }
          if (hasNewContent) break;
        }

        if (hasNewContent) {
          if (observerDebounceTimer) clearTimeout(observerDebounceTimer);
          observerDebounceTimer = setTimeout(() => {
            contentCleaner("mutation-observer", false, config);
          }, 250);
        }
      });

      try {
        feedObserver.observe(feed, {
          childList: true,
          subtree: true
        });
        consoleLog.log("MutationObserver attached to feed");
      } catch (err: any) {
        consoleLog.error("Failed to attach observer: " + (err.message ?? err.toString()));
      }
    };

    // Setup observer after initial content cleaning
    setTimeout(() => setupFeedObserver(), 1000);

    window.addEventListener("blur", () => {
      contentCleaner("blur", false, config);
      if (feedObserver) feedObserver.disconnect();
      clearInterval(contentClearTimer);
      contentClearTimer = setInterval(
        () => contentCleaner("timer-backup", false, config),
        300000
      );
    });
    window.addEventListener("focus", () => {
      contentCleaner("focus", false, config);
      setupFeedObserver(); // Reconnect observer
      clearInterval(contentClearTimer);
      contentClearTimer = setInterval(
        () => contentCleaner("timer-backup", false, config),
        300000
      );
    });

    // Cleanup on page unload
    window.addEventListener("beforeunload", () => {
      if (feedObserver) feedObserver.disconnect();
      clearInterval(contentClearTimer);
    });

    storage
      .getRawInstance()
      .runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.fbhrar_reload === true) {
          consoleLog.log("force reload requested: config changed");
          forceReloadRequested = true;
        }
      });

    console.warn(
      "FB Hide Recommendations and Reels: Loaded content script - v" +
      storage.version
    );

    /*if (config.fullPageLoader === false) {
      document
        .querySelectorAll('div[role="main"]')
        .forEach((x) => x.setAttribute("visible", "show"));
      return;
    }
    scrollTo(0, 1024);
    setTimeout(() => {
      scrollTo(0, 0);
      contentCleaner("main-loader", false, config);
      setTimeout(() => {
        scrollTo(0, 0);
        document
          .querySelectorAll('div[role="main"]')
          .forEach((x) => x.setAttribute("visible", "show"));
      }, 100);
    }, 1000);*/
  });
};
runApp();
