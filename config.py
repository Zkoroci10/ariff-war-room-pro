"""
War Room Pro v4 — Configuration & Script Templates
"""

# === CLIENT CONFIGURATION ===
# Setiap client dapat sheet tab sendiri dalam Google Spreadsheet yang sama
# Tukar nama sheet dan spreadsheet mengikut setup kau
CLIENTS = {
    "client_a": {
        "spreadsheet_name": "The Closing Desk™",
        "sheet_name": "Client_A",
        "batch_size": 25,
        "dormant_threshold": 7,
    },
    "client_b": {
        "spreadsheet_name": "The Closing Desk™",
        "sheet_name": "Client_B",
        "batch_size": 25,
        "dormant_threshold": 7,
    },
}

# === GLOBAL SETTINGS ===
BATCH_SIZE_TOTAL = 50  # max leads processed per run across all clients
AI_ANALYSIS_LIMIT = 10  # max leads per run that get AI analysis (save API quota)

# === GHOST REVIVAL STAGES ===
GHOST_STAGES = [7, 14, 30, 60, 90, 120, 180]

# === STATUS PRIORITY WEIGHTS (0-100) ===
# Leads dengan status "Hot" atau "Closing" akan dapat priority tinggi
STATUS_WEIGHTS = {
    "hot": 40,
    "closing": 35,
    "dsr": 30,
    "qualified": 30,
    "new": 20,
    "first touch": 20,
    "dormant": 15,
    "ghost": 15,
    "closed": 0,
    "lost": 0,
}

# === SOURCE QUALITY BONUS ===
# Leads dari referral lebih berkualiti
SOURCE_BONUS = {
    "referral": 10,
    "organic": 5,
    "social": 5,
    "facebook": 5,
    "paid": 3,
    "cold": 0,
}

# === PRE-WRITTEN SCRIPT TEMPLATES ===
# Simplified versions dari VA Outreach Toolkit kau
# Guna {name} placeholder untuk replace dengan nama lead

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

# === DEFAULT STATUS FLOW ===
# Apa yang system suggest untuk next status
STATUS_FLOW = {
    "New": "First Touch",
    "First Touch": "DSR Qualified",
    "DSR Qualified": "Hot Lead",
    "Hot Lead": "Closing",
    "Closing": "Closed",
    "Ghost/Dormant": "First Touch",
}
