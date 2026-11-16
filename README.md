# Front Camera → Telegram (consent-based)

## কীভাবে কাজ করে
- ব্যবহারকারী নিজে `Start Camera` চাপলে browser camera permission চাওয়া হয়।
- `facingMode: user` দিয়ে সামনের ক্যামেরা চাওয়া হয়।
- সম্মতি checkbox এবং backend access code ছাড়া Auto Capture শুরু হয় না।
- চালু থাকলে প্রতি ২ সেকেন্ডে একটি JPEG ছবি Telegram-এ পাঠায়।
- `Stop / Camera Off` ক্যামেরা বন্ধ করে। পেজ আড়ালে গেলে auto capture থামে।
- এটি গোপনে বা background-এ কাজ করার জন্য তৈরি নয়।

## প্রয়োজন
- Node.js 18+
- Telegram bot token এবং আপনার নিজের Telegram chat ID
- HTTPS hosting (localhost-এ development করা যায়)

## সেটআপ
1. এই project folder-এ terminal খুলুন।
2. `npm install` চালান।
3. `.env.example` কপি করে `.env` নাম দিন।
4. `.env`-এ `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `ACCESS_CODE` বসান।
5. `public` নামে folder তৈরি করে `index.html`, `style.css`, `app.js` সেখানে রাখুন। (অথবা নিচের ফাইল বিন্যাস অনুযায়ী রাখুন।)
6. `server.js`-এ `express.static` public folder serve করে, তাই ফাইল বিন্যাস হবে:

   project/
   - server.js
   - package.json
   - .env
   - public/
     - index.html
     - style.css
     - app.js

7. `npm start` চালান এবং `http://localhost:3000` খুলুন।
8. Production-এ HTTPS ব্যবহার করুন।

## Telegram সেটআপ
- Telegram-এ BotFather দিয়ে bot তৈরি করে token নিন।
- আপনার bot-কে একটি message পাঠান।
- নিজের chat ID জানার জন্য Telegram Bot API-এর `getUpdates` ব্যবহার করতে পারেন, অথবা পরিচিত bot utility ব্যবহার করুন।
- Token কাউকে দেবেন না; `.env`-এ রাখুন।

## নিরাপত্তা
- `.env` কখনো GitHub-এ আপলোড করবেন না।
- ACCESS_CODE দীর্ঘ ও অনুমান করা কঠিন রাখুন।
- ব্যক্তিগত/সংবেদনশীল ছবি পাঠানোর আগে সবসময় সংশ্লিষ্ট ব্যক্তির স্পষ্ট সম্মতি নিন।
- ২ সেকেন্ডে ১টি ছবি মানে মিনিটে সর্বোচ্চ প্রায় ৩০টি ছবি; Telegram-এর সীমা ও ডেটা খরচ বিবেচনা করুন।
- এটি basic starter। Public deployment-এর আগে HTTPS, authentication, request rate limiting, abuse protection এবং access logging যোগ করুন।
