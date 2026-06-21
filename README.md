# War Room Pro v4

Sistem automasi lead management untuk **REN (Real Estate Negotiator)** — dibangunkan oleh **Zubair Ariff (ZK Revenue Ops)**.

---

## Apa Sistem Ni Buat?

War Room Pro v4 automasi proses follow-up leads untuk **2+ clients**:

| Feature | Description |
|---------|-------------|
| 🔢 **Lead Scoring** | Auto-kira priority score setiap lead (0-100) |
| 👻 **Ghost Revival** | Auto-detect leads dorman > 7 hari, assign stage (Day 7 → Day 180) |
| ⚡ **Batch Processing** | Proses 50 leads per run (3x sehari = 150 leads/hari) |
| 📝 **Smart Scripting** | Pilih pre-written script based on funnel stage — dari VA Outreach Toolkit |
| 🤖 **AI Analysis** | Groq AI untuk analyze top priority leads sahaja (save API quota) |
| 📱 **Telegram Reports** | Daily summary terus ke phone dengan stats |
| 📊 **Google Sheets Sync** | Auto-update status, notes, ghost stage, priority score |

---

## Architecture

```
GitHub Actions (3x sehari)
    └── war_room_v4.py (main engine)
        ├── config.py (settings & script templates)
        ├── Google Sheets (The Closing Desk™)
        │   ├── Client_A (250 leads)
        │   └── Client_B (250 leads)
        └── Telegram (daily reports)
```

---

## Setup

### 1. Configure GitHub Secrets

Pergi ke **GitHub → Settings → Secrets and variables → Actions → New repository secret**

| Secret | Apa Ni? | Cara Dapat |
|--------|---------|------------|
| `GROQ_API_KEY` | API key untuk AI analysis | [Groq Console](https://console.groq.com) — free tier |
| `TELEGRAM_BOT_TOKEN` | Bot token untuk report | @BotFather di Telegram → `/newbot` |
| `TELEGRAM_CHAT_ID` | Chat ID kau | @userinfobot → start, copy ID |
| `GOOGLE_CREDENTIALS_JSON` | Service account JSON | Google Cloud Console → Service Account → Key → JSON (copy paste full JSON) |
| `TAVILY_API_KEY` | (Optional) Research API | [Tavily](https://tavily.com) — free tier |
| `DEEPSEEK_API_KEY` | (Legacy) Not used in v4 | Boleh delete kalau nak bersihkan |

### 2. Setup Google Sheets

1. **Create spreadsheet** bernama `The Closing Desk™`
2. **Create 2 tabs:** `Client_A` dan `Client_B`
3. **Add headers** (Row 1) — lihat `database_schema.md`
4. **Paste 250 leads** ke setiap tab

> **Nota:** Tukar nama tab? Edit `config.py` → `sheet_name` untuk setiap client.

### 3. Run Schedule

| Time (MYT) | Action |
|------------|--------|
| **9:00 AM** | Morning scan — process top priority leads |
| **1:00 PM** | Mid-day scan — follow-up leads |
| **5:00 PM** | Evening scan — summary & ghost detection |

**Manual run:** GitHub → Actions → War Room Pro v4 → Run workflow

### 4. Customization

Edit `config.py` untuk:
- **Tambah client baru** — duplicate entry dalam `CLIENTS`
- **Tukar script templates** — edit `FIRST_TOUCH_SCRIPTS`, `GHOST_REVIVAL_SCRIPTS`, `HOT_LEAD_SCRIPTS`
- **Adjust batch size** — `BATCH_SIZE_TOTAL` (default 50)
- **Adjust AI limit** — `AI_ANALYSIS_LIMIT` (default 10 per run)
- **Tukar thresholds** — `STATUS_WEIGHTS`, `SOURCE_BONUS`

---

## Free Tier Limits (100% Percuma)

| Service | Free Quota | Coverage Kita |
|---------|-----------|---------------|
| **GitHub Actions** | 2,000 min/month | ~180 min/month (3x/day) ✅ |
| **Groq** | Rate limited | ~30 AI calls/day (top priority only) ✅ |
| **Google Sheets API** | 100 req/100s | Batch update, 1 call per lead ✅ |
| **Telegram** | Unlimited | Unlimited ✅ |

---

## Changelog

### v4 (Current)
- ✅ Multi-client support (2+ clients)
- ✅ Lead scoring engine (0-100)
- ✅ Ghost revival with 7 stages (Day 7 → Day 180)
- ✅ Batch processing (50 leads/run)
- ✅ Smart script selection (pre-written templates)
- ✅ AI analysis limit (save API quota)
- ✅ Batch Google Sheets update (1 API call per lead)
- ✅ Improved Telegram reports (stats + analysis)
- ✅ Flexible column mapping (auto-detect headers)
- ✅ Auto-status update (Ghost/Dormant detection)

### v3 (Original)
- Dual AI brain (Groq + DeepSeek via Swarm)
- Single client only
- 3 leads per run
- Basic Telegram notification
- No lead scoring
- No ghost revival

---

## Support

Kalau ada issue, check:
1. **GitHub Actions logs** — GitHub → Actions → latest run → check error
2. **Telegram** — confirm bot token & chat ID betul
3. **Google Sheets** — confirm spreadsheet name & tab names match `config.py`
4. **Secrets** — confirm semua secrets dah set dekat repo

---

*Built with hustle by Zubair Ariff | ZK Revenue Ops*
