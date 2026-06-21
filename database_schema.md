# Database Schema — The Closing Desk™

## Spreadsheet Name
`The Closing Desk™`

## Sheet Tabs (Satu Tab Per Client)

| Tab Name | Leads | Description |
|----------|-------|-------------|
| `Client_A` | 250 | Client pertama — rename kepada nama client sebenar |
| `Client_B` | 250 | Client kedua — rename kepada nama client sebenar |

> **Nota:** Tukar nama sheet dalam `config.py` (`sheet_name`) kalau kau rename tab.

---

## Required Columns (Wajib Ada)

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| **PROSPECT NAME** | Text | Nama penuh lead | Ahmad Ali |
| **PHONE NUMBER** | Text | Nombor telefon (jangan letak +6) | 0123456789 |
| **SOURCE** | Text | Sumber lead | Facebook, Referral, Organic, Cold |
| **STATUS** | Text | Current status lead | New, Hot Lead, Dormant, etc. |
| **LAST CONTACT DATE** | Date | Tarikh last contact | 2026-01-20 |

## Recommended Columns (System Auto-Update)

| Column | Type | Description |
|--------|------|-------------|
| **EMAIL** | Text | Email lead |
| **NEXT ACTION** | Text | Script/action seterusnya (auto-update) |
| **NOTES** | Text | History & nota (auto-append) |
| **GHOST STAGE** | Text | Day 7, Day 14, Day 30, etc. (auto-update) |
| **PRIORITY SCORE** | Number | Score 0-100 (auto-update) |
| **ENGAGEMENT SCORE** | Number | Score 0-10 (manual, optional) |

> **Nota:** Kalau column tak ada, system akan skip update untuk column tu. Takkan crash.

---

## STATUS Values (Guna salah satu)

| Status | Meaning | Priority |
|--------|---------|----------|
| `New` | Lead baru, belum di-contact | Medium |
| `First Touch` | Dah buat first contact | Medium |
| `DSR Qualified` | Dah qualify bajet/need | High |
| `Hot Lead` | Ready to buy, urgent | **Highest** |
| `Closing` | Dalam proses tutup deal | **Highest** |
| `Closed` | Deal dah tutup | None |
| `Lost` | Deal lost | None |
| `Ghost/Dormant` | Tak respond > 7 hari | Low |

---

## Sample Data (Copy & Paste ke Sheet)

```
PROSPECT NAME	PHONE NUMBER	EMAIL	SOURCE	STATUS	LAST CONTACT DATE	NEXT ACTION	NOTES	GHOST STAGE	PRIORITY SCORE	ENGAGEMENT SCORE
Ahmad Ali	0123456789	ahmad@email.com	Facebook	New	2026-01-20					
Siti Nur	0198765432	siti@email.com	Referral	Hot Lead	2026-01-18					
Rajesh Kumar	0171234567	raj@email.com	Cold	Ghost/Dormant	2025-12-01					
Mira Lee	0169876543	mira@email.com	Organic	DSR Qualified	2026-01-15					
```

---

## Setup Steps

1. **Create Google Sheet** bernama `The Closing Desk™`
2. **Create 2 tabs:** `Client_A` dan `Client_B`
3. **Add headers** (Row 1) — guna exact column names macam atas
4. **Paste leads** ke dalam setiap tab
5. **Tukar `config.py`** kalau kau rename tab atau spreadsheet
6. **Run system** — system akan auto-update columns yang exist
