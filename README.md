# 🤲 Dhikr (Zekr)

**A voice-powered Islamic dhikr counter that listens and counts automatically.**

> Say it. It counts.

---

## 💡 The Idea

Most dhikr apps require you to tap a button every time you say a remembrance. This breaks your focus and interrupts the flow of worship.

**Dhikr** lets you recite naturally while the app listens, recognizes your dhikr, and counts for you.

✅ No tapping  
✅ No interruptions  
✅ Just you and your worship

---

## ✨ How It Works

### 1️⃣ Choose Your Dhikr

| Arabic | Transliteration | Meaning |
|---------|----------------|----------|
| اللَّهُ أَكْبَر | Allahu Akbar | Allah is the Greatest |
| الْحَمْدُ لِلَّهِ | Alhamdulillah | All praise is due to Allah |
| سُبْحَانَ اللَّهِ | Subhan Allah | Glory be to Allah |
| أَسْتَغْفِرُ اللَّه | Astaghfirullah | I seek forgiveness from Allah |
| لَا إِلَهَ إِلَّا اللَّه | La ilaha illallah | There is no god but Allah |
| سُبْحَانَ اللَّهِ وَبِحَمْدِهِ | Subhanallahi wa bihamdihi | Glory and praise be to Allah |

### 2️⃣ Set Your Target

33 · 99 · 100 · 500 · Unlimited · or any custom number.

### 3️⃣ Choose Your Completion Sound

Pick the sound played when you reach your target (4 sounds available, with preview).

### 4️⃣ Start Reciting

Allow microphone access and recite. The counter updates automatically as it recognizes your dhikr. You can pause, restart, or change the dhikr at any time.

---

## 📱 Features

- 🎙️ Automatic voice counting (Arabic speech recognition)
- 👆 Manual tap-to-count fallback — used when the browser doesn't support speech recognition, the mic is blocked, or you're offline
- 🌐 Arabic and English interface
- 📲 Installable as a PWA (home screen on Android / iOS), with offline support for manual counting
- 🔔 Completion sound with preview

---

## 🔒 Privacy

- The app **does not record, store, or upload** your audio, and has no backend or database.
- Speech recognition is performed by your **browser's built-in speech service** (the Web Speech API). Depending on the browser, this service may send audio to the browser vendor (e.g. Google for Chrome, Apple for Safari) for processing, which is why voice counting needs an internet connection.
- If you prefer not to use it, you can count by tapping and never grant microphone access.

---

## 🌐 Browser Support

| Browser | Voice counting | Manual counting |
|---------|:---:|:---:|
| Chrome / Edge (desktop + Android) | ✅ | ✅ |
| Safari (macOS + iOS) | ✅ | ✅ |
| Firefox | ❌ | ✅ |

---

## 🛠️ Tech Stack

- [Next.js](https://nextjs.org) 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- [next-intl](https://next-intl.dev) for Arabic / English localization
- Web Speech API for recognition (`useZekrSpeechRecognition` hook)
- Service worker + web manifest (PWA)
- Deployed on Vercel

### Run locally

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build + service worker generation
```

---

## 👩‍💻 Team

| Role | Member |
|--------|--------|
| 🤖 AI | Sohila |
| 💻 Website | Sara |
| 🎨 UI & Design | Maryam |

---

## 🎯 Vision

To create a distraction-free dhikr experience that allows Muslims to focus on remembrance while technology quietly handles the counting.