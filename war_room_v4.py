"""
War Room Pro v4
Sistem automasi lead management untuk 2+ clients.
Handle 500 leads, prioritize, ghost revival, batch processing.
"""
import os
import json
import time
import requests
import gspread
from datetime import datetime
from google.oauth2.service_account import Credentials
from openai import OpenAI

from config import (
    CLIENTS, BATCH_SIZE_TOTAL, AI_ANALYSIS_LIMIT, GHOST_STAGES,
    STATUS_WEIGHTS, SOURCE_BONUS,
    FIRST_TOUCH_SCRIPTS, GHOST_REVIVAL_SCRIPTS, HOT_LEAD_SCRIPTS,
    STATUS_FLOW
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


def read_client_sheet(client_key):
    cfg = CLIENTS[client_key]
    gc = get_google_client()
    sh = gc.open(cfg["spreadsheet_name"])
    ws = sh.worksheet(cfg["sheet_name"])
    records = ws.get_all_records()
    return records, ws


# =============================================================================
# LEAD ENGINE
# =============================================================================
def parse_date(date_str):
    if not date_str:
        return None
    formats = ["%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y"]
    for fmt in formats:
        try:
            return datetime.strptime(str(date_str), fmt)
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

    # Days since contact — lebih lama = lebih urgent
    days = days_since(lead.get("LAST CONTACT DATE"))
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

    return min(score, 100)


def identify_ghost_stage(lead):
    """Detect ghost stage based on days since last contact."""
    days = days_since(lead.get("LAST CONTACT DATE"))
    if days < 7:
        return None
    for stage in GHOST_STAGES:
        if days <= stage:
            return f"Day {stage}"
    return f"Day {GHOST_STAGES[-1]}+"


def get_next_action_script(lead):
    """Pilih pre-written script based on lead status dan ghost stage."""
    name = lead.get("PROSPECT NAME", "there")
    status = str(lead.get("STATUS", "")).strip().lower()
    ghost = lead.get("_ghost_stage")

    # Ghost revival — priority highest untuk dormant leads
    if ghost:
        if ghost in GHOST_REVIVAL_SCRIPTS:
            return GHOST_REVIVAL_SCRIPTS[ghost].replace("{name}", name)
        # Fallback ke stage terdekat
        for stage in reversed(GHOST_STAGES):
            if days_since(lead.get("LAST CONTACT DATE")) >= stage:
                key = f"Day {stage}"
                if key in GHOST_REVIVAL_SCRIPTS:
                    return GHOST_REVIVAL_SCRIPTS[key].replace("{name}", name)

    # Hot / Closing leads
    if "hot" in status or "closing" in status:
        return HOT_LEAD_SCRIPTS["urgency"].replace("{name}", name)

    # DSR Qualified
    if "dsr" in status or "qualified" in status:
        return f"Hi {name}, thanks for your interest! Boleh saya tahu bajet awak untuk property ni? Senang saya filterkan yang sesuai. 👍"

    # New / First Touch
    if "new" in status or "first touch" in status:
        return FIRST_TOUCH_SCRIPTS["skeleton"].replace("{name}", name)

    # Default fallback
    return f"Hi {name}, saya Zubair dari ZK Revenue Ops. Saya nak follow up tentang interest awak dalam property. Still looking? 👍"


def get_ai_analysis(lead):
    """Guna Groq untuk analyze lead kompleks. Limited untuk save API quota."""
    try:
        groq = OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=os.getenv("GROQ_API_KEY")
        )

        prompt = f"""Analyze this real estate lead for REN (Real Estate Negotiator) in Malaysia:
Name: {lead.get('PROSPECT NAME')}
Status: {lead.get('STATUS')}
Days since contact: {lead.get('_days_since')}
Ghost stage: {lead.get('_ghost_stage') or 'Active'}
Source: {lead.get('SOURCE')}
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
def update_lead(worksheet, lead, row_idx):
    """Update lead row dalam Google Sheets guna batch update (1 API call)."""
    try:
        headers = worksheet.row_values(1)
        col_map = {h.strip(): i+1 for i, h in enumerate(headers)}

        cell_list = []
        today = datetime.now().strftime("%Y-%m-%d")
        sheet_row = row_idx + 2  # Row 1 = header

        if "LAST CONTACT DATE" in col_map:
            cell_list.append(gspread.Cell(sheet_row, col_map["LAST CONTACT DATE"], today))
        if "NEXT ACTION" in col_map:
            cell_list.append(gspread.Cell(sheet_row, col_map["NEXT ACTION"], lead.get("_next_action", "")))
        if "NOTES" in col_map:
            notes = lead.get("NOTES", "")
            new_note = f"[{today}] {lead.get('_analysis', '')[:200]}"
            combined = f"{notes}\n{new_note}" if notes else new_note
            cell_list.append(gspread.Cell(sheet_row, col_map["NOTES"], combined[:500]))
        if "GHOST STAGE" in col_map:
            cell_list.append(gspread.Cell(sheet_row, col_map["GHOST STAGE"], lead.get("_ghost_stage", "")))
        if "PRIORITY SCORE" in col_map:
            cell_list.append(gspread.Cell(sheet_row, col_map["PRIORITY SCORE"], str(lead.get("_priority", 0))))
        if "STATUS" in col_map and lead.get("_ghost_stage"):
            # Auto-update status ke Ghost/Dormant kalau detect ghost
            cell_list.append(gspread.Cell(sheet_row, col_map["STATUS"], "Ghost/Dormant"))

        if cell_list:
            worksheet.update_cells(cell_list, value_input_option='USER_ENTERED')

    except Exception as e:
        print(f"Sheet update error: {e}")


# =============================================================================
# MAIN ENGINE
# =============================================================================
def process_client(client_key):
    cfg = CLIENTS[client_key]
    print(f"📂 Processing {client_key}...")

    leads, ws = read_client_sheet(client_key)
    if not leads:
        return None, 0, f"*{client_key}*: 📭 Tiada leads dalam sheet."

    print(f"  Total leads: {len(leads)}")

    # Enrich leads dengan metadata
    enriched = []
    for idx, lead in enumerate(leads):
        l = dict(lead)
        l["_idx"] = idx
        l["_days_since"] = days_since(lead.get("LAST CONTACT DATE"))
        l["_priority"] = calculate_priority(lead)
        l["_ghost_stage"] = identify_ghost_stage(lead)
        enriched.append(l)

    # Stats
    ghost_count = sum(1 for l in enriched if l["_ghost_stage"])
    hot_count = sum(1 for l in enriched if "hot" in str(l.get("STATUS", "")).lower())
    closing_count = sum(1 for l in enriched if "closing" in str(l.get("STATUS", "")).lower())
    new_count = sum(1 for l in enriched if "new" in str(l.get("STATUS", "")).lower())

    # Sort by priority desc
    enriched.sort(key=lambda x: x["_priority"], reverse=True)

    # Batch size
    batch_size = min(cfg.get("batch_size", 25), BATCH_SIZE_TOTAL // len(CLIENTS))
    batch = enriched[:batch_size]

    ai_used = 0
    report_lines = [
        f"*{client_key}* — {len(leads)} leads | 🔥 {hot_count} | 🎯 {closing_count} | 🆕 {new_count} | 👻 {ghost_count} | {len(batch)} diproses\n"
    ]

    for lead in batch:
        name = lead.get("PROSPECT NAME", "Unknown")
        print(f"  → {name} (P:{lead['_priority']}, G:{lead['_ghost_stage'] or 'Active'})")

        # Pilih script
        script = get_next_action_script(lead)
        lead["_next_action"] = script

        # AI analysis untuk top priority sahaja (save API quota)
        analysis = ""
        ai_limit_per_client = AI_ANALYSIS_LIMIT // len(CLIENTS)
        if ai_used < ai_limit_per_client and lead["_priority"] >= 50:
            analysis = get_ai_analysis(lead)
            ai_used += 1
        else:
            analysis = f"Script: {script[:100]}..."

        lead["_analysis"] = analysis

        # Update Google Sheets
        update_lead(ws, lead, lead["_idx"])

        # Report line
        ghost_info = f" | Ghost: {lead['_ghost_stage']}" if lead['_ghost_stage'] else ""
        report_lines.append(f"• *{name}* — P:{lead['_priority']}/100{ghost_info}\n  {analysis[:120]}...")

        time.sleep(0.5)  # Rate limit buffer

    return enriched, len(batch), "\n".join(report_lines)


def run_war_room():
    print(f"🛡️ War Room Pro v4 Dimulakan: {datetime.now()}")

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
            else:
                all_reports.append(report)
        except Exception as e:
            err_msg = f"*{client_key}*: ❌ Ralat — {str(e)[:100]}"
            all_reports.append(err_msg)
            print(f"Error: {e}")

    # Build summary
    summary = f"🛡️ *War Room Pro v4 Report*\n"
    summary += f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M')}\n"
    summary += f"📊 Total leads: {total_leads} | Diproses: {total_processed}\n\n"
    summary += "\n\n".join(all_reports)

    send_telegram(summary)
    print(f"\n✅ Done. Total: {total_processed}/{total_leads}")


if __name__ == "__main__":
    run_war_room()
