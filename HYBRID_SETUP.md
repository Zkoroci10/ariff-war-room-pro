# War Room Pro v4 Hybrid — Setup Guide

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     THE CLOSING DESK™ v4 Hybrid                  │
├─────────────────────────────────────────────────────────────────┤
│  FRONT OFFICE (Google Apps Script)                               │
│  ├── Visual Dashboard (Command Center)                          │
│  ├── War Room (leads, priority, conditional formatting)         │
│  ├── WhatsApp Integration (click-to-send)                       │
│  ├── Script Preview Sidebar                                      │
│  ├── DSR Quick-Check Calculator                                  │
│  ├── Ghost Revival (7 stages)                                    │
│  └── Engine Activity Log                                         │
│                                                                  │
│  BACK OFFICE (Python + GitHub Actions)                           │
│  ├── Daily Analytics (7:30 AM MYT)                              │
│  ├── Advanced Priority Scoring (0-100)                           │
│  ├── Ghost Stage Detection (Day 7 → 180)                         │
│  ├── Next Action Script Generation                               │
│  ├── Batch Sheet Updates (priority, ghost, next action)         │
│  └── Telegram Daily Report (all clients)                       │
└─────────────────────────────────────────────────────────────────┘
```

## What Changed from v3?

| Feature | v3 (Old) | v4 Hybrid (New) |
|---------|----------|-----------------|
| Clients | 1 | **2+ (unlimited)** |
| Leads per run | 3 | **50+** |
| Priority scoring | Basic (status only) | **Advanced (status + price + days + source + engagement)** |
| Ghost detection | ❌ | **7 stages (Day 7 → 180)** |
| Batch WhatsApp | ❌ | **Send top 5/10/20** |
| Hot leads batch | ❌ | **Process all Hot** |
| Ghost queue | ❌ | **Auto-queue all ghosts** |
| Telegram report | Basic text | **Full stats + top leads + ghost summary** |
| Daily schedule | 9x/day (hourly) | **1x/day (5 AM)** |
| Script source | Hardcoded | **Sync from Outreach Toolkit** |

## Setup Steps

### 1. GitHub Repository (Done ✅)

Files dah ada dalam repo:
- `config_hybrid.py` — Client configuration
- `war_room_v4_backend.py` — Backend engine
- `requirements_backend.txt` — Dependencies
- `backend.yml` — GitHub Actions workflow

### 2. GitHub Secrets (Pastikan semua dah set)

Pergi ke **GitHub → Settings → Secrets and variables → Actions → New repository secret**

| Secret | Apa Ni? | Cara Dapat |
|--------|---------|------------|
| `GROQ_API_KEY` | API untuk AI analysis | [Groq Console](https://console.groq.com) — free tier (sufficient untuk 10 calls/day) |
| `TELEGRAM_BOT_TOKEN` | Bot token untuk report | @BotFather di Telegram → `/newbot` → copy token |
| `TELEGRAM_CHAT_ID` | Chat ID kau | @userinfobot di Telegram → start → copy ID |
| `GOOGLE_CREDENTIALS_JSON` | Service account JSON | Google Cloud Console → IAM → Service Accounts → Create Key → JSON → paste FULL JSON |

> **Nota:** `GOOGLE_CREDENTIALS_JSON` mesti share dengan spreadsheet kau. Pergi ke Google Sheet → Share → paste service account email.

### 3. Google Sheets Setup (Per Client)

Setiap client = satu Google Spreadsheet (File → Make a copy dari template).

**Current layout (semasa):**
- 5 Tabs: Command Center, War Room, Engine, Ghost Revival, System Brain
- Headers kat row 3 (bukan row 1)
- War Room data mula dari row 4

**Required columns dalam War Room:**
| Column | Wajib? | Description |
|--------|--------|-------------|
| LEAD ID | Auto | Auto-generate |
| PROSPECT NAME | ✅ | Nama lead |
| WA NO. | ✅ | Nombor WhatsApp |
| PROPERTY INTEREST | ✅ | Property interest |
| PRICE (RM) | ✅ | Harga property |
| STATUS | ✅ | New, Warm, Hot, Appointment, Closing, Ghost |
| PRIORITY | ✅ | Priority score (0-100) — Python update |
| COMMISSION (RM) | Auto | Auto-kira 2% |
| TOUCH # | ✅ | Berapa kali dah contact |
| LAST CONTACT | ✅ | Tarikh last contact |
| DAYS STALE | Auto | Auto-kira dari LAST CONTACT |
| NEXT ACTION | ✅ | Script/action seterusnya — Python update |
| DSR | ✅ | DSR status |
| SCRIPT REF | ✅ | Script reference |
| VA NOTES | ✅ | Nota — Python auto-append |

**Python akan auto-update:**
- `PRIORITY` / `PRIORITY SCORE`
- `GHOST STAGE` (tambah column ni kalau tak ada)
- `NEXT ACTION`
- `NOTES` (append daily analysis)
- `STATUS` (auto tukar ke Ghost kalau detect)

### 4. Apps Script Update (Tambah batch features)

1. Pergi ke **Google Sheet** → `Extensions` → `Apps Script`
2. Copy semua code dari `apps_script_additions.gs`
3. Paste di BAWAH kod sedia ada (sebelum atau selepas `onOpen()`)
4. **Replace** `onOpen()` function yang sedia ada dengan yang baru (tambah menu items)
5. Save & Refresh sheet

**Menu baru yang akan muncul:**
- 🚀 Closing Desk → 📱⚡ Send WA — Top 5 Batch
- 🚀 Closing Desk → 🔥⚡ Process All Hot Leads
- 🚀 Closing Desk → 👻⚡ Queue All Ghosts

### 5. Config Client (tambah client baru)

Edit `config_hybrid.py`:

```python
CLIENTS = {
    "client_a": {
        "spreadsheet_id": "1jM-TzPwlXwkEbcMLsoEksEiAb04qAzpTxAhIV1YQzSE",  # Client A
        "sheet_name": "War Room",
        "batch_size": 25,
    },
    "client_b": {  # ← Tambah client baru
        "spreadsheet_id": "PASTE_CLIENT_B_SPREADSHEET_ID_HERE",
        "sheet_name": "War Room",
        "batch_size": 25,
    },
    "client_c": {  # ← Tambah client lagi
        "spreadsheet_id": "PASTE_CLIENT_C_SPREADSHEET_ID_HERE",
        "sheet_name": "War Room",
        "batch_size": 25,
    },
}
```

**Cara dapat spreadsheet ID:**
1. Buka Google Sheet client
2. Copy dari URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
3. Paste dalam config

### 6. Push to GitHub

```bash
git add .
git commit -m "Add v4 Hybrid backend"
git push origin main
```

### 7. Test Run

1. GitHub → Actions → War Room Backend → Run workflow
2. Check Telegram → daily report should arrive
3. Check Google Sheet → PRIORITY, NEXT ACTION, GHOST STAGE updated

## Daily Workflow (Zero Human Effort)

| Time | Event | Effort |
|------|-------|--------|
| **7:30 AM** | Python backend auto-run | 0 min |
| **7:35 AM** | Telegram report arrives | 0 min |
| **9:00 AM** | Kau baca Telegram summary | 1 min |
| **9:05 AM** | Buka client sheet → click "📱⚡ Send WA — Top 5 Batch" | 2 min |
| **9:10 AM** | Click setiap link dalam dialog → hantar WhatsApp | 5 min |
| **Selesai** | | **8 min total** |

## Scaling: Tambah Client Baru

**One-time setup (5 min):**
1. File → Make a copy dari The Closing Desk template
2. Paste leads dalam War Room tab
3. Dapat spreadsheet ID dari URL
4. Tambah dalam `config_hybrid.py`
5. Push ke GitHub

**Daily effort:** **Tetap 8 minit** (same for 1 client or 10 clients)
- Python process SEMUA client sekali gus
- Telegram report tunjuk semua client
- Kau buka sheet mana-mana client → click batch send
- Time tak berganda dengan client — batch processing handle semua

## Troubleshooting

### Telegram tak receive report
- Check `TELEGRAM_BOT_TOKEN` dan `TELEGRAM_CHAT_ID` betul
- Try manual run: GitHub → Actions → Run workflow
- Check Actions logs untuk error

### Google Sheet tak update
- Confirm `GOOGLE_CREDENTIALS_JSON` service account email dah share dengan sheet
- Check spreadsheet ID betul dalam config
- Check tab name "War Room" (case sensitive)

### Priority score 0 untuk semua leads
- Check `STATUS` column values match (Hot, Warm, Cold, Ghost, etc.)
- Check `LAST CONTACT` dalam format tarikh yang boleh baca

### Batch WhatsApp tak work
- Confirm `WA NO.` column ada data
- Nombor mesti start dengan 0 atau 60 (e.g., 0123456789 atau 60123456789)

## Free Tier Limits (100% Percuma)

| Service | Free Quota | Kita Guna | Status |
|---------|-----------|-----------|--------|
| GitHub Actions | 2,000 min/month | ~30 min/month (1x/day) | ✅ Safe |
| Groq API | Rate limited | ~10 calls/day | ✅ Safe |
| Google Sheets API | 100 req/100s | ~50 calls/day | ✅ Safe |
| Telegram | Unlimited | Unlimited | ✅ Safe |
| Apps Script | 20,000 cells/day | ~500 cells/day | ✅ Safe |

---

*Built with hustle by Zubair Ariff | ZK Revenue Ops*
*Hybrid v4 — Scale tanpa human burden*
