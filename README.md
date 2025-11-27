# FB Hide - Enhanced Facebook Content Filter

<div dir="rtl">

## 🌟 المميزات | Features

### 🇸🇦 العربية
- إخفاء قسم الريلز والريلز المشترك
- إخفاء القصص (Stories)
- إخفاء المجموعات والصفحات والأحداث المقترحة
- إخفاء أنواع محددة من المنشورات
- إعدادات قابلة للتخصيص بالكامل

### 🇬🇧 English
- Hide Reels blocks and shared reels
- Hide Stories
- Hide Suggested Groups, Pages & Events
- Hide specific post types (comments from unknown, tags, etc.)
- Fully customizable settings

</div>

---

## 📥 التثبيت | Installation

### Chrome / Edge
1. Download this repository
2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" → Select `lib` folder

### Firefox
1. Download this repository
2. Open `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select `lib/manifest.json`

---

## 🎯 What Gets Hidden?

- ✅ Reels sections
- ✅ Shared Reels in feed
- ✅ Stories
- ✅ Suggested Groups (المجموعات المقترحة)
- ✅ Suggested Pages (الصفحات المقترحة)
- ✅ Suggested Events (الأحداث المقترحة)
- ✅ Friend Requests block
- ✅ "People You May Know"
- ✅ Comments from pages you don't follow
- ✅ Tagged posts
- ✅ Answered questions
- ✅ Games
- ✅ Ads

**Your regular posts from friends remain visible!**

---

## ⚙️ Configuration

Click the extension icon to customize what content to hide. Toggle switches make it easy to enable/disable each filter.

---

## 👨‍💻 المطور | Developer

**Developed by:** Mohsen Jamal  
**تم تطويره بواسطة:** محسن جمال

---

## 💖 الدعم | Support

If you find this extension useful, consider supporting the development:

<a href="https://liberapay.com/mohseenjamall/donate"><img alt="Donate using Liberapay" src="https://liberapay.com/assets/widgets/donate.svg"></a>

**Support link:** https://liberapay.com/mohseenjamall/donate

---

## 📜 المرجع | Reference

This extension is based on the excellent work of:  
**[Facebook Hide Recommendations and Reels](https://github.com/mrinc/Facebook-Hide-Recommendations-and-Reels)** by mrinc

### Enhancements Made:
- ✅ Improved feed detection using modern selectors
- ✅ More accurate content filtering (no false positives)
- ✅ Enhanced Arabic language support
- ✅ Better suggested content detection
- ✅ Improved UI with toggle switches
- ✅ Disabled click-to-show for complete hiding

---

## 🌍 اللغات المدعومة | Supported Languages

- 🇸🇦 العربية (Arabic)
- 🇬🇧 English
- 🇫🇷 Français (French)
- 🇩🇪 Deutsch (German)
- 🇵🇱 Polski (Polish)
- 🇯🇵 日本語 (Japanese)
- 🇳🇱 Nederlands (Dutch)
- 🇹🇭 ไทย (Thai)
- 🇨🇳 中文 (Chinese - Simplified & Traditional)
- 🇸🇪 Svenska (Swedish)

---

## 🛠️ للمطورين | For Developers

### Building from Source

```bash
# Install dependencies
npm install

# Build
node node_modules/webpack/bin/webpack.js --config webpack.config.content.js --mode production
node node_modules/webpack/bin/webpack.js --config webpack.config.popup.js --mode production
node node_modules/webpack/bin/webpack.js --config webpack.config.background.js --mode production
```

### Project Structure

```
├── src/
│   ├── content/       # Content script (main logic)
│   ├── lib/          # Shared libraries (langs, storage, popup)
│   ├── popup/        # Extension popup
│   └── background/   # Background script
├── lib/              # Built extension files
└── README.md
```

---

## 📝 الترخيص | License

MIT License

---

## 🐛 الإبلاغ عن مشاكل | Report Issues

Found a bug or have a suggestion? Please open an issue on GitHub!

---

## ⭐ نجمة | Star

If you like this project, give it a ⭐ on GitHub!

---

**Version:** 1.0.0  
**Last Updated:** November 2025
