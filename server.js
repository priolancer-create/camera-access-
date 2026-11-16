require("dotenv").config();
const express = require("express");
const multer = require("multer");
const path = require("path");

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "image/jpeg") return cb(new Error("শুধু JPEG ছবি গ্রহণ করা হয়"));
    cb(null, true);
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.post("/api/send-photo", upload.single("photo"), async (req, res) => {
  try {
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID || !process.env.ACCESS_CODE) {
      return res.status(500).json({ error: "সার্ভারের environment configuration অসম্পূর্ণ" });
    }
    if (req.get("x-access-code") !== process.env.ACCESS_CODE) {
      return res.status(401).json({ error: "Access code সঠিক নয়" });
    }
    if (!req.file) return res.status(400).json({ error: "ছবি পাওয়া যায়নি" });

    const body = new FormData();
    body.append("chat_id", process.env.TELEGRAM_CHAT_ID);
    body.append("caption", "অনুমতিসহ Front Camera capture");
    body.append("photo", new Blob([req.file.buffer], { type: "image/jpeg" }), "front-camera.jpg");

    const tg = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`, {
      method: "POST",
      body
    });
    const data = await tg.json();
    if (!tg.ok || !data.ok) {
      console.error("Telegram send failed:", data.description || tg.status);
      return res.status(502).json({ error: "Telegram-এ ছবি পাঠানো যায়নি" });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("Upload error:", err.message);
    res.status(500).json({ error: "সার্ভারে সমস্যা হয়েছে" });
  }
});

app.use((err, req, res, next) => {
  res.status(400).json({ error: err.message || "Invalid upload" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Camera sender running on port ${port}`));
