# War Room Pro v4 Hybrid

Sistem automasi lead management untuk **REN (Real Estate Negotiator)** — dibangunkan oleh **Zubair Ariff (ZK Revenue Ops)**.

> **v4 Hybrid — Scale tanpa human burden.**

---

## Apa Sistem Ni Buat?

War Room Pro v4 Hybrid kombinasi **Google Apps Script** (front office) + **Python GitHub Actions** (back office) untuk automasi penuh follow-up leads:

| Feature | Apps Script (Front) | Python Backend (Back) |
|---------|---------------------|----------------------|
| 📱 **WhatsApp Send** | ✅ Click-to-send | — |
| 📋 **Script Preview** | ✅ Sidebar real-time | — |
| 🧮 **DSR Calculator** | ✅ Built-in | — |
| 📊 **Visual Dashboard** | ✅ KPI cards, funnel | — |
| 🔢 **Lead Scoring** | Basic (real-time) | **Advanced (0-100)** |
| 👻 **Ghost Revival** | Manual detect | **7 stages auto (Day 7→180)** |
| ⚡ **Batch Processing** | **Send Top 5/10/20** | **50 leads/run** |
| 🤖 **AI Analysis** | — | **Groq (top priority only)** |
| 📱 **Telegram Reports** | — | **Daily summary semua client** |
| 📊 **Multi-Client** | **Per-client sheet** | **Auto-read all sheets** |

---

## Architecture

```
Google Sheets (Per Client)
    ├── Apps Script → WhatsApp, Sidebar, DSR, Dashboard
    └── Python Backend (GitHub Actions, 5 AM daily)
        ├── Read all client sheets
        ├── Calculate priority (advanced)
        ├── Detect ghost stages
        ├── Generate next action scripts
        ├── Write back to sheets
        └── Send Telegram summary
```

---

## Quick Start

### 1. Setup GitHub Secrets

Pergi ke **GitHub → Settings → Secrets and variables → Actions**

| Secret | Apa Ni? | Cara Dapat |
|--------|---------|------------|
| `GROQ_API_KEY` | AI analysis | [Groq Console](https://console.groq.com) — free tier |
| `TELEGRAM_BOT_TOKEN` | Bot report | @BotFather → `/newbot` |
| `TELEGRAM_CHAT_ID` | Chat ID | @userinfobot → start |
| `GOOGLE_CREDENTIALS_JSON` | Google API | Google Cloud → Service Account → JSON key |

### 2. Setup Google Sheets

Setiap client = satu Google Spreadsheet (File → Make a copy dari template).

**Tab structure:**
| Tab | Purpose |
|-----|---------|
| Command Center | Dashboard KPI |
| War Room | Leads database (row 3 = headers, row 4+ = data) |
| Engine | Activity log |
| Ghost Revival | Dormant leads |
| System Brain | Script templates (sync dari Outreach Toolkit) |

### 3. Update Apps Script

1. Google Sheet → `Extensions` → `Apps Script`
2. Copy `apps_script_additions.gs` dari repo
3. Paste di bawah kod sedia ada
4. Replace `onOpen()` dengan versi baru (tambah menu batch)
5. Save & Refresh

**Menu baru:**
- 🚀 Closing Desk → 📱⚡ Send WA — Top 5 Batch
- 🚀 Closing Desk → 🔥⚡ Process All Hot Leads
- 🚀 Closing Desk → 👻⚡ Queue All Ghosts

### 4. Configure Clients

Edit `config_hybrid.py`:

```python
CLIENTS = {
    "client_a": {
        "spreadsheet_id": "1jM-TzPwlXwkEbcMLsoEksEiAb04qAzpTxAhIV1YQzSE",
        "sheet_name": "War Room",
        "batch_size": 25,
    },
    # "client_b": {
    #     "spreadsheet_id": "PASTE_ID_HERE",
    #     "sheet_name": "War Room",
    #     "batch_size": 25,
    # },
}
```

### 5. Run Schedule

| Time (MYT) | Action |
|------------|--------|
| **5:00 AM** | Python backend auto-run (GitHub Actions) |
| **5:05 AM** | Telegram report arrives |
| **9:00 AM** | Kau baca report, buka sheet, click batch send |
| **Selesai** | |

**Manual run:** GitHub → Actions → War Room Backend → Run workflow

---

## Scaling: Tambah Client Baru

**One-time setup (5 min):**
1. File → Make a copy dari The Closing Desk template
2. Paste leads dalam War Room tab
3. Dapat spreadsheet ID dari URL
4. Tambah dalam `config_hybrid.py`
5. Push ke GitHub

**Daily effort:** **Tetap 8 minit** — sama untuk 1 client atau 10 clients.

---

## Free Tier Limits (100% Percuma)

| Service | Free Quota | Kita Guna | Status |
|---------|-----------|-----------|--------|
| GitHub Actions | 2,000 min/month | ~30 min/month | ✅ Safe |
| Groq API | Rate limited | ~10 calls/day | ✅ Safe |
| Google Sheets API | 100 req/100s | ~50 calls/day | ✅ Safe |
| Telegram | Unlimited | Unlimited | ✅ Safe |
| Apps Script | 20,000 cells/day | ~500 cells/day | ✅ Safe |

---

## Files

| File | Purpose |
|------|---------|
| `config_hybrid.py` | Client config, thresholds, script templates |
| `war_room_v4_backend.py` | Main backend engine |
| `requirements_backend.txt` | Python dependencies |
| `apps_script_additions.gs` | Batch features untuk Apps Script |
| `HYBRID_SETUP.md` | Full setup guide |

---

## Changelog

### v4 Hybrid (Current)
- ✅ Hybrid: Apps Script + Python backend
- ✅ Multi-client (2+ clients, unlimited)
- ✅ Advanced priority scoring (status + price + days + source + engagement)
- ✅ Ghost detection 7 stages (Day 7 → 180)
- ✅ Batch WhatsApp (Top 5/10/20)
- ✅ Hot leads batch processing
- ✅ Auto-queue all ghosts
- ✅ Daily Telegram report (all clients)
- ✅ Batch Google Sheets update
- ✅ AI analysis (top priority only, save quota)
- ✅ Zero human burden daily workflow

### v4 (Python only)
- Multi-client support
- Lead scoring engine
- Ghost revival
- Batch processing
- Smart scripting

### v3 (Original)
- Dual AI brain (Groq + DeepSeek via Swarm)
- Single client only
- 3 leads per run
- Basic Telegram

---

*Built with hustle by Zubair Ariff | ZK Revenue Ops*
