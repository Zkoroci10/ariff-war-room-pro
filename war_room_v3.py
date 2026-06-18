import os
import json
import time
import requests
import gspread
from datetime import datetime
from google.oauth2.service_account import Credentials
from swarm import Swarm, Agent
from openai import OpenAI

# 1. Konfigurasi Mastermind (Dual Brain)
# Groq (The Runner)
GROQ_CLIENT = OpenAI(base_url="https://api.groq.com/openai/v1", api_key=os.getenv("GROQ_API_KEY"))
# DeepSeek (The Auditor)
DEEPSEEK_CLIENT = OpenAI(base_url="https://api.deepseek.com", api_key=os.getenv("DEEPSEEK_API_KEY"))

swarm_client = Swarm(client=GROQ_CLIENT)

# 2. Integrasi Google Sheets (The Closing Desk™)
def get_google_client():
    creds_dict = json.loads(os.getenv("GOOGLE_CREDENTIALS_JSON"))
    creds = Credentials.from_service_account_info(creds_dict, scopes=["https://www.googleapis.com/auth/spreadsheets"])
    return gspread.authorize(creds)

def read_closing_desk(spreadsheet_name, sheet_name):
    gc = get_google_client()
    sh = gc.open(spreadsheet_name)
    worksheet = sh.worksheet(sheet_name)
    return worksheet.get_all_records()

# 3. Fungsi Mastermind & Tools
def search_lead_profile(name):
    """Ejen Researcher stalk profile lead."""
    tavily_key = os.getenv("TAVILY_API_KEY")
    url = "https://api.tavily.com/search"
    payload = {"api_key": tavily_key, "query": f"property agent REN Malaysia {name}", "max_results": 3}
    return requests.post(url, json=payload).json()

def send_to_telegram(message):
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    requests.post(url, json={"chat_id": chat_id, "text": message, "parse_mode": "Markdown"})

# 4. Definisi Ejen War Room
auditor = Agent(
    name="DeepSeek-Auditor",
    instructions="""Anda adalah Mastermind Strategik. Tugas anda adalah menganalisis data lead dari 
    The Closing Desk™ dan menentukan strategi 'Rendam' atau 'Closing' yang paling padu. 
    Anda sangat cerewet tentang kualiti data.""",
    model="deepseek-chat" # Guna DeepSeek untuk pemikiran mendalam
)

runner = Agent(
    name="Groq-Runner",
    instructions="""Anda adalah Pelaksana Pantas. Anda ambil skrip dari System Brain dan 
    sesuaikan dengan profil lead. Anda hantar draf ke Telegram Ariff.""",
    functions=[search_lead_profile, send_to_telegram],
    model="llama-3.1-70b-versatile"
)

# 5. Aliran Kerja War Room (9-5)
def run_war_room():
    print(f"🛡️ War Room Pro Dimulakan: {datetime.now()}")
    
    # Contoh: Baca Pipeline
    try:
        leads = read_closing_desk("The Closing Desk™", "Pipeline")
        hot_leads = [l for l in leads if l.get('STATUS') == 'Hot']
        
        if not hot_leads:
            send_to_telegram("✅ *War Room Update*: Tiada 'Hot Leads' baru untuk diproses sekarang. Ejen sedang monitor 'Dormant Leads'.")
            return

        for lead in hot_leads[:3]: # Batch processing 3 leads per run
            name = lead.get('PROSPECT NAME')
            
            # Mastermind Berbincang
            response = swarm_client.run(
                agent=runner,
                messages=[{"role": "user", "content": f"Ariff nak kita proses lead ni: {name}. Auditor, apa strategi kita?"}]
            )
            
            send_to_telegram(f"🚀 *Strategi Lead*: {name}\n\n{response.messages[-1]['content']}")
            
    except Exception as e:
        print(f"Ralat War Room: {e}")

if __name__ == "__main__":
    run_war_room()
