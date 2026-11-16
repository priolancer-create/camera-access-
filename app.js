const video = document.getElementById("preview");
const canvas = document.getElementById("canvas");
const statusEl = document.getElementById("status");
const badge = document.getElementById("cameraBadge");
const consent = document.getElementById("consent");
const accessCode = document.getElementById("accessCode");
const startCameraBtn = document.getElementById("startCamera");
const startAutoBtn = document.getElementById("startAuto");
const stopBtn = document.getElementById("stopAll");
const activity = document.getElementById("activity");
const sentCountEl = document.getElementById("sentCount");

let stream = null;
let autoRunning = false;
let busy = false;
let sentCount = 0;

function setStatus(message) { statusEl.textContent = message; }

function addLog(message) {
  const li = document.createElement("li");
  li.textContent = `${new Date().toLocaleTimeString()} — ${message}`;
  activity.prepend(li);
  while (activity.children.length > 12) activity.lastElementChild.remove();
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    setStatus("এই ব্রাউজারে ক্যামেরা API নেই। HTTPS ওয়েবসাইট ব্যবহার করুন।");
    return;
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: "user" }, width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    video.srcObject = stream;
    await video.play();
    badge.classList.add("live");
    badge.innerHTML = "<span></span> ক্যামেরা চালু";
    startCameraBtn.disabled = true;
    startAutoBtn.disabled = false;
    stopBtn.disabled = false;
    setStatus("সামনের ক্যামেরা চালু হয়েছে। Auto Capture শুরু করতে সম্মতি দিন।");
  } catch (err) {
    setStatus("ক্যামেরা চালু হয়নি: " + err.message);
  }
}

function stopCamera() {
  autoRunning = false;
  if (stream) stream.getTracks().forEach(track => track.stop());
  stream = null;
  video.srcObject = null;
  badge.classList.remove("live");
  badge.innerHTML = "<span></span> ক্যামেরা বন্ধ";
  startCameraBtn.disabled = false;
  startAutoBtn.disabled = true;
  stopBtn.disabled = true;
  setStatus("ক্যামেরা বন্ধ করা হয়েছে।");
}

async function captureAndSend() {
  if (!stream || !autoRunning || busy || document.hidden) return;
  if (!video.videoWidth || !video.videoHeight) return;
  busy = true;
  try {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    // Preview is mirrored for a natural selfie view; send the same mirrored orientation.
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.82));
    if (!blob) throw new Error("ছবি তৈরি করা যায়নি");

    const form = new FormData();
    form.append("photo", blob, "front-camera.jpg");
    const response = await fetch("/api/send-photo", {
      method: "POST",
      headers: { "x-access-code": accessCode.value },
      body: form
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `Server error ${response.status}`);
    sentCount++;
    sentCountEl.textContent = `পাঠানো: ${sentCount}`;
    addLog("ছবি Telegram-এ পাঠানো হয়েছে");
    setStatus("ছবি পাঠানো হয়েছে। পরবর্তী ছবি ২ সেকেন্ডের ব্যবধানে পাঠানো হবে।");
  } catch (err) {
    addLog("পাঠানো যায়নি: " + err.message);
    setStatus("পাঠাতে সমস্যা: " + err.message);
  } finally {
    busy = false;
  }
}

async function runAutoCapture() {
  if (!stream) return setStatus("আগে Start Camera চাপুন।");
  if (!consent.checked) return setStatus("প্রথমে সম্মতি checkbox নির্বাচন করুন।");
  if (!accessCode.value.trim()) return setStatus("Backend access code লিখুন।");
  if (autoRunning) return;

  autoRunning = true;
  startAutoBtn.disabled = true;
  startCameraBtn.disabled = true;
  stopBtn.disabled = false;
  setStatus("Auto Capture চালু — প্রতি ২ সেকেন্ডে ছবি পাঠানো হচ্ছে। Stop চাপলে বন্ধ হবে।");
  addLog("Auto Capture শুরু হয়েছে");

  while (autoRunning) {
    if (!document.hidden) await captureAndSend();
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

startCameraBtn.addEventListener("click", startCamera);
startAutoBtn.addEventListener("click", runAutoCapture);
stopBtn.addEventListener("click", () => {
  stopCamera();
  addLog("ক্যামেরা ও Auto Capture বন্ধ");
});
consent.addEventListener("change", () => {
  startAutoBtn.disabled = !stream || !consent.checked;
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && autoRunning) {
    autoRunning = false;
    startAutoBtn.disabled = !stream || !consent.checked;
    setStatus("ট্যাব আড়ালে যাওয়ায় Auto Capture থেমেছে। আবার শুরু করতে Start Auto Capture চাপুন।");
    addLog("পেজ আড়ালে যাওয়ায় অটো-ক্যাপচার বন্ধ");
  }
});
window.addEventListener("pagehide", stopCamera);
