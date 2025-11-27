# 🔍 دليل تشخيص مشاكل FBI-Hidden Extension

## المشاكل المكتشفة

### 1️⃣ **TailwindCSS مفقود** ✅ تم الإصلاح
- **المشكلة:** ملف `tailwindcss.js` مش موجود
- **الحل:** تم استبداله بـ CDN في `lib/popup.html`

### 2️⃣ **Facebook DOM Structure تغير**
Facebook بيحدث الـ UI باستمرار، والـ selectors القديمة مش بتشتغل

### 3️⃣ **اللغة العربية النصوص قديمة**
النصوص المستخدمة في الكود ممكن تكون اتغيرت على Facebook

---

## خطوات التشخيص

### الخطوة 1: افتح Facebook وافتح Console (F12)

### الخطوة 2: جرب الأكواد دي للتشخيص:

```javascript
// 1. فحص هيكل الصفحة
console.log('=== Page Structure ===');
console.log('Main role:', document.querySelector('[role="main"]'));
console.log('Feed elements:', document.querySelectorAll('[role="feed"]'));
console.log('Article elements:', document.querySelectorAll('[role="article"]').length);

// 2. فحص النصوص العربية
console.log('\n=== Arabic Text Detection ===');
const allText = document.body.innerText;
console.log('Contains "ريلز":', allText.includes('ريلز'));
console.log('Contains "Reels":', allText.includes('Reels'));
console.log('Contains "مقترح":', allText.includes('مقترح'));
console.log('Contains "Suggested":', allText.includes('Suggested'));

// 3. فحص News Feed Header
console.log('\n=== Feed Headers ===');
document.querySelectorAll('h3').forEach((h3, i) => {
  if (h3.textContent.length < 50) {
    console.log(`H3 ${i}:`, h3.textContent);
  }
});

// 4. فحص Reels elements
console.log('\n=== Reels Elements ===');
const reelElements = Array.from(document.querySelectorAll('*'))
  .filter(el => {
    const text = el.textContent || '';
    const aria = el.getAttribute('aria-label') || '';
    return text.includes('Reels') || text.includes('ريلز') || 
           aria.includes('Reels') || aria.includes('ريلز');
  });
console.log('Found Reels elements:', reelElements.length);
if (reelElements.length > 0) {
  console.log('Sample:', reelElements[0]);
}

// 5. فحص الاقتراحات
console.log('\n=== Suggested Content ===');
const suggested = Array.from(document.querySelectorAll('*'))
  .filter(el => {
    const text = el.textContent || '';
    return text.includes('Suggested for you') || 
           text.includes('مقترح لك') ||
           text.includes('مقترحة لك');
  });
console.log('Found suggested elements:', suggested.length);

// 6. فحص الـ data attributes
console.log('\n=== Data Attributes ===');
const feedPagelets = document.querySelectorAll('[data-pagelet]');
console.log('Pagelets found:', feedPagelets.length);
feedPagelets.forEach((el, i) => {
  console.log(`Pagelet ${i}:`, el.getAttribute('data-pagelet'));
});
```

---

## النتائج المتوقعة

### ✅ إذا ظهرت النتائج دي، المشكلة في الـ Extension:
- `Main role: <div>`
- `Article elements: 10+`
- `Found Reels elements: 5+`

### ❌ إذا ظهرت النتائج دي، المشكلة في Facebook:
- `Main role: null`
- `Article elements: 0`
- `Feed structure changed completely`

---

## الحلول المقترحة حسب النتيجة

### إذا Facebook غير الـ Structure:
1. حدث الـ selectors في `src/content/index.ts`
2. استخدم `role="article"` بدل البحث عن H3
3. استخدم `aria-label` attributes

### إذا اللغة العربية مش صحيحة:
1. حدث النصوص في `src/lib/langs.ts`
2. أضف variations أكتر للنصوص
3. استخدم partial matching بدل exact match

### إذا الـ Extension مش بيحمل:
1. تأكد من reload الصفحة بعد install
2. تأكد من الـ permissions في manifest.json
3. شوف الـ errors في Console

---

## أكواد إضافية للتشخيص المتقدم

### فحص المحتوى المخفي:
```javascript
// شوف إيه اللي الـ extension خفاه
const hidden = document.querySelectorAll('.redact-elem');
console.log('Hidden elements:', hidden.length);
hidden.forEach(el => {
  console.log('Hidden:', el.classList, el.textContent.substring(0, 50));
});
```

### فحص الـ MutationObserver:
```javascript
// تأكد إن الـ observer شغال
const observer = new MutationObserver(() => {
  console.log('DOM changed!');
});
observer.observe(document.body, { childList: true, subtree: true });
```

### فحص الـ Storage:
```javascript
// شوف الإعدادات المحفوظة
chrome.storage.sync.get('data', (result) => {
  console.log('Stored config:', result.data);
});
```

---

## الخطوة التالية

1. جرب الأكواد دي على Facebook
2. سجل النتائج
3. ابعت النتائج عشان نعرف نحدد المشكلة بدقة
4. نبدأ نصلح الكود بناءً على النتائج
