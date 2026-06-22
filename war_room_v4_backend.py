"""
War Room Pro v4 Hybrid — Backend Engine
Run sekali sehari (5 AM MYT) via GitHub Actions
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
    all_values = ws.get_all_values()
    if len(all_values) < 3:
        return [], []
    # Row 3 (index 2) = headers in Apps Script layout
    headers = [h.strip() for h in all_values[2]]
    records = []
    for row in all_values[3:]:
        # SKIP row kalau PROSPECT NAME (column C = index 2) kosong
        name_col = 2
        if not row or len(row) <= name_col or not str(row[name_col]).strip():
            continue
        record = {}
        for i, h in enumerate(headers):
            if h:
                record[h] = row[i] if i < len(row) else ""
        records.append(record)
    return records, headers

def read_client_sheet(client_key):
    cfg = CLIENTS[client_key]
    gc = get_google_client()
    sh = gc.open_by_key(cfg["spreadsheet_id"])
    ws = sh.worksheet(cfg["sheet_name"])
    return read_sheet_data(ws) + (ws,)

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
    score = 0
    status = str(lead.get("STATUS", "")).strip().lower()
    source = str(lead.get("SOURCE", "")).strip().lower()

    for key, weight in STATUS_WEIGHTS.items():
        if key in status:
            score += weight
            break
    else:
        score += 10

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

    for key, bonus in SOURCE_BONUS.items():
        if key in source:
            score += bonus
            break

    engagement = lead.get("ENGAGEMENT SCORE", "")
    if isinstance(engagement, (int, float)):
        score += min(engagement, 10)
    elif str(engagement).isdigit():
        score += min(int(engagement), 10)

    price_str = str(lead.get("PRICE (RM)", lead.get("PRICE", "0"))).replace(",", "").replace("RM", "").strip()
    try:
        price = float(price_str) if price_str else 0
        if price > 0:
            score += min(35, price / 2_000_000 * 35)
    except ValueError:
        pass

    return min(int(score), 100)

def identify_ghost_stage(lead):
    days = days_since(lead.get("LAST CONTACT", ""))
    if days < 7:
        return None
    for stage in GHOST_STAGES:
        if days <= stage:
            return f"Day {stage}"
    return f"Day {GHOST_STAGES[-1]}+"

def get_next_action_script(lead):
    name = lead.get("PROSPECT NAME", lead.get("NAME", "there"))
    status = str(lead.get("STATUS", "")).strip().lower()
    ghost = lead.get("_ghost_stage")
    prop = lead.get("PROPERTY INTEREST", lead.get("PROPERTY", ""))
    first_name = str(name).split(" ")[0] if name else "there"

    if ghost:
        for stage in reversed(GHOST_STAGES):
            if days_since(lead.get("LAST CONTACT", "")) >= stage:
                key = f"Day {stage}"
                if key in GHOST_REVIVAL_SCRIPTS:
                    return GHOST_REVIVAL_SCRIPTS[key].replace("{name}", first_name).replace("{property}", prop)
        return GHOST_REVIVAL_SCRIPTS.get("Day 7", "").replace("{name}", first_name).replace("{property}", prop)

    if any(s in status for s in ["hot", "closing", "appointment"]):
        return HOT_LEAD_SCRIPTS["urgency"].replace("{name}", first_name).replace("{property}", prop)
    if "dsr" in status or "qualified" in status:
        return f"Hi {first_name}, thanks for your interest! Boleh saya tahu bajet awak untuk property ni? Senang saya filterkan yang sesuai. 👍"
    if "warm" in status:
        return f"Hi {first_name}, saya follow up tentang interest awak dengan {prop}. Ada update terbaru yang saya nak share. Boleh borak sekejap? 👍"
    if any(s in status for s in ["new", "first touch", "cold"]):
        return FIRST_TOUCH_SCRIPTS["skeleton"].replace("{name}", first_name).replace("{property}", prop)
    return f"Hi {first_name}, saya Zubair dari ZK Revenue Ops. Nak follow up tentang interest awak dalam property. Still looking? 👍"

def get_ai_analysis(lead):
    try:
        groq = OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=os.getenv("GROQ_API_KEY")
        )
        prompt = f"""Analyze this real estate lead for REN in Malaysia:
Name: {lead.get('PROSPECT NAME', lead.get('NAME', 'Unknown'))}
Status: {lead.get('STATUS', 'Unknown')}
Days since contact: {lead.get('_days_since', 'N/A')}
Ghost stage: {lead.get('_ghost_stage') or 'Active'}
Source: {lead.get('SOURCE', 'Unknown')}
Property: {lead.get('PROPERTY INTEREST', lead.get('PROPERTY', 'Unknown'))}
Price: {lead.get('PRICE (RM)', lead.get('PRICE', 'Unknown'))}

Provide 1) next action, 2) tone, 3) why priority. Under 100 words. Malay/Manglish."""
        resp = groq.chat.completions.create(
            model="llama-3.1-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200, temperature=0.7
        )
        return resp.choices[0].message.content
    except Exception as e:
        return f"AI unavailable: {str(e)[:50]}"

# =============================================================================
# SHEET UPDATE
# =============================================================================
def update_sheet(ws, lead, row_idx, headers):
    try:
        # SKIP update kalau lead ni kosong
        name = lead.get("PROSPECT NAME", lead.get("NAME", ""))
        if not name or not str(name).strip():
            return
        col_map = {h: i+1 for i, h in enumerate(headers) if h}
        sheet_row = row_idx + 4
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
        if "STATUS" in col_map and lead.get("_ghost_stage") and not str(lead.get("STATUS", "")).strip().lower() == "ghost":
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
        records, headers, ws = read_client_sheet(client_key)
    except Exception as e:
        return None, 0, f"*{client_key}*: ❌ Cannot read sheet: {str(e)[:100]}"

    if not records:
        return None, 0, f"*{client_key}*: 📭 *EMPTY SHEET* — No leads found.\n  👉 Paste leads into War Room tab starting from row 4."

    # Check if LAST CONTACT column exists
    has_last_contact = "LAST CONTACT" in headers
    has_status = "STATUS" in headers
    has_name = "PROSPECT NAME" in headers or "NAME" in headers

    if not has_name:
        return None, 0, f"*{client_key}*: ⚠️ *MISSING COLUMN* — No 'PROSPECT NAME' or 'NAME' column found.\n  Headers found: {', '.join(headers[:8])}..."

    if not has_last_contact:
        return None, 0, f"*{client_key}*: ⚠️ *MISSING COLUMN* — No 'LAST CONTACT' column found.\n  Headers found: {', '.join(headers[:8])}..."

    print(f"  Total leads: {len(records)} | Headers: {len(headers)}")

    enriched = []
    for idx, lead in enumerate(records):
        l = dict(lead)
        l["_idx"] = idx
        l["_days_since"] = days_since(lead.get("LAST CONTACT", ""))
        l["_priority"] = calculate_priority(lead)
        l["_ghost_stage"] = identify_ghost_stage(lead)
        enriched.append(l)

    ghost_count = sum(1 for l in enriched if l["_ghost_stage"])
    hot_count = sum(1 for l in enriched if "hot" in str(l.get("STATUS", "")).lower())
    appt_count = sum(1 for l in enriched if "appointment" in str(l.get("STATUS", "")).lower())
    closing_count = sum(1 for l in enriched if "closing" in str(l.get("STATUS", "")).lower())
    warm_count = sum(1 for l in enriched if "warm" in str(l.get("STATUS", "")).lower())
    cold_count = sum(1 for l in enriched if "cold" in str(l.get("STATUS", "")).lower())
    new_count = sum(1 for l in enriched if "new" in str(l.get("STATUS", "")).lower())

    enriched.sort(key=lambda x: x["_priority"], reverse=True)
    batch_size = min(cfg.get("batch_size", 25), BATCH_SIZE_TOTAL // len(CLIENTS))
    batch = enriched[:batch_size]

    ai_used = 0
    report_lines = [
        f"*{client_key}* — {len(records)} leads | 🔥 {hot_count} | 📅 {appt_count} | 💰 {closing_count} | 🟡 {warm_count} | 🔵 {cold_count} | 🆕 {new_count} | 👻 {ghost_count} | {len(batch)} updated\n"
    ]

    for lead in batch:
        name = lead.get("PROSPECT NAME", lead.get("NAME", "Unknown"))
        print(f"  → {name} (P:{lead['_priority']}, G:{lead['_ghost_stage'] or 'Active'})")
        script = get_next_action_script(lead)
        lead["_next_action"] = script
        analysis = ""
        ai_limit = max(1, AI_ANALYSIS_LIMIT // len(CLIENTS))
        if ai_used < ai_limit and lead["_priority"] >= 50:
            analysis = get_ai_analysis(lead)
            ai_used += 1
        else:
            analysis = f"Script: {script[:100]}..."
        lead["_analysis"] = analysis
        update_sheet(ws, lead, lead["_idx"], headers)
        ghost_info = f" | Ghost: {lead['_ghost_stage']}" if lead['_ghost_stage'] else ""
        report_lines.append(f"• *{name}* — P:{lead['_priority']}/100{ghost_info}\n  {analysis[:120]}...")
        time.sleep(0.5)

    return enriched, len(batch), "\n".join(report_lines)

def run_backend():
    print(f"🛡️ War Room Backend: {datetime.now()}")
    total_leads = 0
    total_processed = 0
    all_reports = []
    errors = []

    for client_key in CLIENTS:
        try:
            all_leads, processed, report = process_client(client_key)
            if all_leads is not None:
                total_leads += len(all_leads)
                total_processed += processed
            all_reports.append(report)
        except Exception as e:
            err = f"*{client_key}*: ❌ Error — {str(e)[:100]}"
            all_reports.append(err)
            errors.append(err)
            print(f"Error: {e}")

    if not all_reports and not CLIENTS:
        all_reports.append("⚠️ *NO CLIENTS CONFIGURED* — Edit config_hybrid.py to add clients.")

    summary = f"🛡️ *War Room Daily Report*\n"
    summary += f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M')}\n"
    summary += f"📊 Clients: {len(CLIENTS)} | Total leads: {total_leads} | Updated: {total_processed}\n"
    if errors:
        summary += f"⚠️ Errors: {len(errors)}\n"
    summary += "\n\n"
    summary += "\n\n".join(all_reports)
    summary += "\n\n💡 *Tip:* Buka sheet → click '📱⚡ Send WA — Top 5 Batch' untuk hantar leads priority tinggi."

    send_telegram(summary)
    print(f"\n✅ Done. Total: {total_processed}/{total_leads}")

if __name__ == "__main__":
    run_backend()
