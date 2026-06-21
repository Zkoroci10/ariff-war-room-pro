"""
War Room Pro v4 Hybrid — Backend Engine
Run sekali sehari (5 AM MYT) via GitHub Actions
Job: Analyze leads, calculate priority, detect ghosts, write back to sheets
"""
import os
import json
import time
import requests
import gspread
from datetime import datetime
from google.oauth2.service_account import Credentials
from openai import OpenAI

from config_hybrid import (
    CLIENTS, BATCH_SIZE_TOTAL, AI_ANALYSIS_LIMIT, GHOST_STAGES,
    STATUS_WEIGHTS, SOURCE_BONUS,
    FIRST_TOUCH_SCRIPTS, GHOST_REVIVAL_SCRIPTS, HOT_LEAD_SCRIPTS
)


# =============================================================================
# TELEGRAM
# =============================================================================
def send_telegram(message, parse_mode="Markdown"):
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        print("Telegram not configured")
        return False
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    max_len = 4000
    for i in range(0, len(message), max_len):
        chunk = message[i:i+max_len]
        try:
            resp = requests.post(url, json={"chat_id": chat_id, "text": chunk, "parse_mode": parse_mode})
            if not resp.ok:
                print(f"Telegram error: {resp.text}")
        except Exception as e:
            print(f"Telegram exception: {e}")
    return True


# =============================================================================
# GOOGLE SHEETS
# =============================================================================
def get_google_client():
    creds_dict = json.loads(os.getenv("GOOGLE_CREDENTIALS_JSON"))
    creds = Credentials.from_service_account_info(
        creds_dict, scopes=["https://www.googleapis.com/auth/spreadsheets"]
    )
    return gspread.authorize(creds)


def read_sheet_data(ws):
    """Read sheet data from War Room tab (headers at row 3 per Apps Script layout)."""
    all_values = ws.get_all_values()
    if len(all_values) < 3:
        return []
    # Row 3 (index 2) is the header row in the Apps Script layout
    headers = [h.strip() for h in all_values[2]]
    records = []
    for row in all_values[3:]:
        if not any(row):  # Skip empty rows
            continue
        record = {}
        for i, h in enumerate(headers):
            if h:  # Skip empty headers
                record[h] = row[i] if i < len(row) else ""
        records.append(record)
    return records


def read_client_sheet(client_key):
    cfg = CLIENTS[client_key]
    gc = get_google_client()
    sh = gc.open_by_key(cfg["spreadsheet_id"])
    ws = sh.worksheet(cfg["sheet_name"])
    return read_sheet_data(ws), ws


# =============================================================================
# LEAD ENGINE
# =============================================================================
def parse_date(date_str):
    if not date_str:
        return None
    formats = ["%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y", "%d %b %Y"]
    for fmt in formats:
        try:
            return datetime.strptime(str(date_str).strip(), fmt)
        except ValueError:
            continue
    return None


def days_since(date_str):
    dt = parse_date(date_str)
    if not dt:
        return 999
    return (datetime.now() - dt).days


def calculate_priority(lead):
    """Kira priority score 0-100. Lebih tinggi = lebih urgent."""
    score = 0
    status = str(lead.get("STATUS", "")).strip().lower()
    source = str(lead.get("SOURCE", "")).strip().lower()

    # Status weight
    for key, weight in STATUS_WEIGHTS.items():
        if key in status:
            score += weight
            break
    else:
        score += 10  # Default

    # Days since contact — lebih lama = lebih urgent
    days = days_since(lead.get("LAST CONTACT", ""))
    if days <= 1:
        score += 5
    elif days <= 3:
        score += 10
    elif days <= 7:
        score += 15
    elif days <= 14:
        score += 20
    elif days <= 30:
        score += 25
    else:
        score += 30

    # Source quality
    for key, bonus in SOURCE_BONUS.items():
        if key in source:
            score += bonus
            break

    # Engagement score (optional)
    engagement = lead.get("ENGAGEMENT SCORE", "")
    if isinstance(engagement, (int, float)):
        score += min(engagement, 10)
    elif str(engagement).isdigit():
        score += min(int(engagement), 10)

    # Property price bonus (higher price = higher priority)
    price_str = str(lead.get("PRICE (RM)", lead.get("PRICE", "0"))).replace(",", "").replace("RM", "").strip()
    try:
        price = float(price_str) if price_str else 0
        if price > 0:
            score += min(35, price / 2_000_000 * 35)
    except ValueError:
        pass

    return min(int(score), 100)


def identify_ghost_stage(lead):
    """Detect ghost stage based on days since last contact."""
    days = days_since(lead.get("LAST CONTACT", ""))
    if days < 7:
        return None
    for stage in GHOST_STAGES:
        if days <= stage:
            return f"Day {stage}"
    return f"Day {GHOST_STAGES[-1]}+"


def get_next_action_script(lead):
    """Pilih pre-written script based on lead status dan ghost stage."""
    name = lead.get("PROSPECT NAME", lead.get("NAME", "there"))
    status = str(lead.get("STATUS", "")).strip().lower()
    ghost = lead.get("_ghost_stage")
    prop = lead.get("PROPERTY INTEREST", lead.get("PROPERTY", ""))
    first_name = str(name).split(" ")[0] if name else "there"

    # Ghost revival — priority highest untuk dormant leads
    if ghost:
        for stage in reversed(GHOST_STAGES):
            if days_since(lead.get("LAST CONTACT", "")) >= stage:
                key = f"Day {stage}"
                if key in GHOST_REVIVAL_SCRIPTS:
                    return GHOST_REVIVAL_SCRIPTS[key].replace("{name}", first_name).replace("{property}", prop)
        return GHOST_REVIVAL_SCRIPTS.get("Day 7", "").replace("{name}", first_name).replace("{property}", prop)

    # Hot / Closing / Appointment leads
    if any(s in status for s in ["hot", "closing", "appointment"]):
        return HOT_LEAD_SCRIPTS["urgency"].replace("{name}", first_name).replace("{property}", prop)

    # DSR Qualified
    if "dsr" in status or "qualified" in status:
        return f"Hi {first_name}, thanks for your interest! Boleh saya tahu bajet awak untuk property ni? Senang saya filterkan yang sesuai. 👍"

    # Warm
    if "warm" in status:
        return f"Hi {first_name}, saya follow up tentang interest awak dengan {prop}. Ada update terbaru yang saya nak share. Boleh borak sekejap? 👍"

    # New / First Touch / Cold
    if any(s in status for s in ["new", "first touch", "cold"]):
        return FIRST_TOUCH_SCRIPTS["skeleton"].replace("{name}", first_name).replace("{property}", prop)

    # Default fallback
    return f"Hi {first_name}, saya Zubair dari ZK Revenue Ops. Nak follow up tentang interest awak dalam property. Still looking? 👍"


def get_ai_analysis(lead):
    """Guna Groq untuk analyze lead kompleks. Limited untuk save API quota."""
    try:
        groq = OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=os.getenv("GROQ_API_KEY")
        )

        prompt = f"""Analyze this real estate lead for REN (Real Estate Negotiator) in Malaysia:
Name: {lead.get('PROSPECT NAME', lead.get('NAME', 'Unknown'))}
Status: {lead.get('STATUS', 'Unknown')}
Days since contact: {lead.get('_days_since', 'N/A')}
Ghost stage: {lead.get('_ghost_stage') or 'Active'}
Source: {lead.get('SOURCE', 'Unknown')}
Property: {lead.get('PROPERTY INTEREST', lead.get('PROPERTY', 'Unknown'))}
Price: {lead.get('PRICE (RM)', lead.get('PRICE', 'Unknown'))}
Notes: {lead.get('NOTES', 'None')}

Provide:
1. Recommended next action (1 sentence)
2. Message tone (casual/professional/urgent)
3. Why this lead is priority (1 sentence)

Keep under 100 words. Reply in Malay/Manglish mix."""

        resp = groq.chat.completions.create(
            model="llama-3.1-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.7
        )
        return resp.choices[0].message.content
    except Exception as e:
        return f"AI analysis unavailable: {str(e)[:50]}"


# =============================================================================
# SHEET UPDATE (BATCH)
# =============================================================================
def update_sheet(ws, lead, row_idx):
    """Update lead row dalam Google Sheets guna batch update (1 API call)."""
    try:
        # Get headers from row 3 (Apps Script layout)
        all_values = ws.get_all_values()
        if len(all_values) < 3:
            return
        headers = [h.strip() for h in all_values[2]]
        col_map = {h: i+1 for i, h in enumerate(headers) if h}

        sheet_row = row_idx + 4  # Row 4 = first data row (header=3, title=2, spacer=1)
        today = datetime.now().strftime("%Y-%m-%d")

        cells = []
        if "NEXT ACTION" in col_map:
            cells.append(gspread.Cell(sheet_row, col_map["NEXT ACTION"], lead.get("_next_action", "")))
        if "GHOST STAGE" in col_map:
            cells.append(gspread.Cell(sheet_row, col_map["GHOST STAGE"], lead.get("_ghost_stage", "")))
        if "PRIORITY" in col_map:
            cells.append(gspread.Cell(sheet_row, col_map["PRIORITY"], lead.get("_priority", 0)))
        if "PRIORITY SCORE" in col_map:
            cells.append(gspread.Cell(sheet_row, col_map["PRIORITY SCORE"], lead.get("_priority", 0)))
        if "NOTES" in col_map:
            notes = str(lead.get("NOTES", ""))
            new_note = f"[PY {today}] P={lead.get('_priority',0)}"
            if lead.get("_ghost_stage"):
                new_note += f" | Ghost:{lead['_ghost_stage']}"
            combined = f"{notes}\n{new_note}" if notes else new_note
            cells.append(gspread.Cell(sheet_row, col_map["NOTES"], combined[:500]))
        if "STATUS" in col_map and lead.get("_ghost_stage") and not lead.get("STATUS", "").lower() == "ghost":
            # Auto-update status ke Ghost kalau detect ghost stage
            cells.append(gspread.Cell(sheet_row, col_map["STATUS"], "Ghost"))

        if cells:
            ws.update_cells(cells, value_input_option='USER_ENTERED')

    except Exception as e:
        print(f"Sheet update error for row {row_idx}: {e}")


# =============================================================================
# MAIN ENGINE
# =============================================================================
def process_client(client_key):
    cfg = CLIENTS[client_key]
    print(f"📂 Processing {client_key}...")

    try:
        records, ws = read_client_sheet(client_key)
    except Exception as e:
        return None, 0, f"*{client_key}*: ❌ Cannot read sheet: {str(e)[:100]}"

    if not records:
        return None, 0, f"*{client_key}*: 📭 Empty sheet."

    print(f"  Total leads: {len(records)}")

    # Enrich leads dengan metadata
    enriched = []
    for idx, lead in enumerate(records):
        l = dict(lead)
        l["_idx"] = idx
        l["_days_since"] = days_since(lead.get("LAST CONTACT", ""))
        l["_priority"] = calculate_priority(lead)
        l["_ghost_stage"] = identify_ghost_stage(lead)
        enriched.append(l)

    # Stats
    ghost_count = sum(1 for l in enriched if l["_ghost_stage"])
    hot_count = sum(1 for l in enriched if "hot" in str(l.get("STATUS", "")).lower())
    appt_count = sum(1 for l in enriched if "appointment" in str(l.get("STATUS", "")).lower())
    closing_count = sum(1 for l in enriched if "closing" in str(l.get("STATUS", "")).lower())
    warm_count = sum(1 for l in enriched if "warm" in str(l.get("STATUS", "")).lower())
    cold_count = sum(1 for l in enriched if "cold" in str(l.get("STATUS", "")).lower())
    new_count = sum(1 for l in enriched if "new" in str(l.get("STATUS", "")).lower())

    # Sort by priority desc
    enriched.sort(key=lambda x: x["_priority"], reverse=True)

    # Batch size
    batch_size = min(cfg.get("batch_size", 25), BATCH_SIZE_TOTAL // len(CLIENTS))
    batch = enriched[:batch_size]

    ai_used = 0
    report_lines = [
        f"*{client_key}* — {len(records)} leads | 🔥 {hot_count} | 📅 {appt_count} | 💰 {closing_count} | 🟡 {warm_count} | 🔵 {cold_count} | 🆕 {new_count} | 👻 {ghost_count} | {len(batch)} updated\n"
    ]

    for lead in batch:
        name = lead.get("PROSPECT NAME", lead.get("NAME", "Unknown"))
        print(f"  → {name} (P:{lead['_priority']}, G:{lead['_ghost_stage'] or 'Active'})")

        # Pilih script
        script = get_next_action_script(lead)
        lead["_next_action"] = script

        # AI analysis untuk top priority sahaja (save API quota)
        analysis = ""
        ai_limit_per_client = max(1, AI_ANALYSIS_LIMIT // len(CLIENTS))
        if ai_used < ai_limit_per_client and lead["_priority"] >= 50:
            analysis = get_ai_analysis(lead)
            ai_used += 1
        else:
            analysis = f"Script: {script[:100]}..."

        lead["_analysis"] = analysis

        # Update Google Sheets
        update_sheet(ws, lead, lead["_idx"])

        # Report line
        ghost_info = f" | Ghost: {lead['_ghost_stage']}" if lead['_ghost_stage'] else ""
        report_lines.append(f"• *{name}* — P:{lead['_priority']}/100{ghost_info}\n  {analysis[:120]}...")

        time.sleep(0.5)  # Rate limit buffer

    return enriched, len(batch), "\n".join(report_lines)


def run_backend():
    print(f"🛡️ War Room Backend: {datetime.now()}")

    total_leads = 0
    total_processed = 0
    all_reports = []

    for client_key in CLIENTS:
        try:
            all_leads, processed, report = process_client(client_key)
            if all_leads is not None:
                total_leads += len(all_leads)
                total_processed += processed
            all_reports.append(report)
        except Exception as e:
            err_msg = f"*{client_key}*: ❌ Error — {str(e)[:100]}"
            all_reports.append(err_msg)
            print(f"Error: {e}")

    # Build summary
    summary = f"🛡️ *War Room Daily Report*\n"
    summary += f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M')}\n"
    summary += f"📊 Clients: {len(CLIENTS)} | Total leads: {total_leads} | Updated: {total_processed}\n\n"
    summary += "\n\n".join(all_reports)
    summary += "\n\n💡 *Tip:* Buka sheet mana-mana client → click '📱⚡ Send WA — Top 5 Batch' untuk hantar semua leads priority tinggi sekali gus."

    send_telegram(summary)
    print(f"\n✅ Done. Total: {total_processed}/{total_leads}")


if __name__ == "__main__":
    run_backend()
