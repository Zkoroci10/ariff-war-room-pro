"""
War Room Pro v4 Hybrid — Backend Configuration
Backend: Python (GitHub Actions) → Analytics engine
Frontend: Google Apps Script → UI + WhatsApp

CARA TAMBAH CLIENT BARU:
1. File → Make a copy dari The Closing Desk template
2. Paste leads dalam War Room tab
3. Dapat spreadsheet ID dari URL: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
4. Paste ID dekat bawah dalam entry baru
5. Push ke GitHub
6. System auto-handle — no human work daily
"""

# === CLIENTS ===
# Setiap client = satu Google Spreadsheet (File → Make a copy dari template)
# Spreadsheet ID: dari URL https://docs.google.com/spreadsheets/d/ID/edit
CLIENTS = {
    "client_a": {
        "spreadsheet_id": "1jM-TzPwlXwkEbcMLsoEksEiAb04qAzpTxAhIV1YQzSE",  # Client A (semasa)
        "sheet_name": "War Room",  # Tab name
        "batch_size": 25,          # Max leads update per run
    },
    # Uncomment & paste ID bila ada client kedua:
    # "client_b": {
    #     "spreadsheet_id": "PASTE_CLIENT_B_SPREADSHEET_ID_HERE",
    #     "sheet_name": "War Room",
    #     "batch_size": 25,
    # },
}

# === BACKEND SETTINGS ===
BATCH_SIZE_TOTAL = 100  # Max leads processed across ALL clients per run (optimized from 50)
AI_ANALYSIS_LIMIT = 20  # Max AI calls per run (optimized from 10 for better insights)

# === PERFORMANCE OPTIMIZATIONS ===
ENABLE_BATCH_UPDATES = True  # Batch sheet updates instead of one-by-one
CACHE_PRIORITY_CALCULATION = True  # Cache priority scores to avoid recalculation
PARALLEL_PROCESSING = True  # Enable parallel client processing

# === GHOST STAGES ===
GHOST_STAGES = [7, 14, 30, 60, 90, 120, 180]

# === STATUS PRIORITY WEIGHTS ===
STATUS_WEIGHTS = {
    "hot": 40, "appointment": 38, "closing": 35,
    "warm": 20, "cold": 10, "ghost": 2,
    "first touch": 15, "new": 15, "dsr": 25,
}

# === SOURCE QUALITY BONUS ===
SOURCE_BONUS = {
    "referral": 10, "organic": 5, "social": 5,
    "facebook": 5, "paid": 3, "cold": 0,
}

# === FALLBACK SCRIPT TEMPLATES ===
# Guna ni kalau System Brain tak sync. Prefer sync dari Outreach Toolkit.
FIRST_TOUCH_SCRIPTS = {
    "skeleton": "Hi {name}, saya Zubair dari ZK Revenue Ops. Tengok profil REN awak — nampak aktif. Kami bantu REN macam awak setup sistem follow-up automatik. Ada 5 minit untuk borak? 👍",
    "casual": "Woi {name}, cuba teka — REN yang ada sistem follow-up ni closing 3x lebih banyak. Kita orang bantu setup benda ni. Nak dengar tak? 😄",
    "professional": "Assalamualaikum {name}, saya Zubair, konsultan sales sistem untuk REN. Saya perasan awak aktif dalam market ni. Saya nak share macam mana REN lain naikkan closing rate 200% dengan sistem follow-up. Boleh saya ambil 10 minit awak?",
    "urgent": "Hi {name}, quick one — saya tengok awak baru list property. REN yang ada sistem follow-up dalam 24 jam pertama closing 40% lebih tinggi. Nak saya tunjukkan macam mana? ⚡",
    "social_proof": "Hi {name}, saya Zubair. Baru je bantu REN dari [Kawasan] tutup 3 deal minggu lepas dengan sistem follow-up. Awak nak try juga? 😉",
    "problem_agitation": "Hi {name}, saya perasan banyak REN struggle dengan leads yang 'hangus' sebab tak follow-up tepat masa. Awak pernah kena? Saya ada solution untuk tu. Nak dengar? 🔥",
    "video_voice": "Hi {name}, saya Zubair. Saya ada voice note 30 saat untuk awak — tentang macam mana REN lain scale bisnes dengan sistem follow-up. Nak saya hantar? 🎙️",
}

GHOST_REVIVAL_SCRIPTS = {
    "Day 7": "Hi {name}, saya faham — kadang-kadang timing tak kena. Tapi property market tengah panas sekarang. Nak saya share update terbaru untuk kawasan awak? 🔥",
    "Day 14": "Hi {name}, saya tak nak jadi pushy. Tapi saya ada data yang menunjukkan REN yang maintain follow-up consistently closing 5x lebih banyak. Nak dengar tip simple? 👍",
    "Day 30": "Hi {name}, dah sebulan! 😄 Saya tengok awak still aktif list property. Saya nak offer 1x free audit sistem follow-up awak. No strings attached. Nak?",
    "Day 60": "Hi {name}, saya perasan kita tak contact lama. Tapi market dah berubah banyak. Saya ada strategy baru untuk revive leads lama. Nak saya share? 📈",
    "Day 90": "Hi {name}, saya faham awak sibuk. Tapi saya ada benda penting — lead yang awak tak follow-up sebelum ni mungkin still interested. Ada 1 cara untuk revive semula. Nak try?",
    "Day 120": "Hi {name}, dah 4 bulan! 😅 Saya nak tanya — masih aktif dalam real estate? Kalau ya, saya nak offer sistem follow-up yang boleh tolong awak tutup lebih banyak deal. Last offer ni. 👍",
    "Day 180": "Hi {name}, saya tahu awak dah lama tak dengar dari saya. Tapi saya baru je launch sistem baru untuk REN yang nak scale. Kalau awak still dalam game, saya nak offer free trial. Nak?",
}

HOT_LEAD_SCRIPTS = {
    "urgency": "Hi {name}, awak punya lead ni dah semakin panas! 🔥 Market tengah gila sekarang, kalau awak tak act fast, lead ni akan pergi ke competitor. Bila awak free untuk call 5 minit?",
    "scarcity": "Hi {name}, saya nak bagitahu — saya hanya ambil 5 REN baru untuk program Q2 ni. Slot tinggal 2 je. Kalau awak serious nak scale, kita kena act sekarang. 💪",
    "social_proof": "Hi {name}, baru je ada REN dari [Kawasan] sign up dengan kita. Minggu lepas dia dah tutup 2 deals dengan leads yang dia pernah 'ghost'. Nak saya tunjukkan macam mana? 🚀",
}

# === STATUS FLOW SUGGESTION ===
STATUS_FLOW = {
    "New": "First Touch",
    "First Touch": "DSR Qualified",
    "DSR Qualified": "Hot Lead",
    "Hot Lead": "Closing",
    "Closing": "Closed",
    "Ghost/Dormant": "First Touch",
}
