"""
Akıllı Araç Fiyat Tahminleme API
Bu uygulama, kullanıcının girdiği araç bilgilerine göre
LangChain ve Gemini AI kullanarak anlık fiyat tahmini yapar.
"""

import json
import os
import re
import requests
from datetime import datetime
from typing import List, Optional
from bs4 import BeautifulSoup

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from langchain.output_parsers import PydanticOutputParser
from langchain.prompts import PromptTemplate
from langchain.schema import BaseOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field

# FastAPI uygulamasını oluştur
app = FastAPI(
    title="🚗 Akıllı Araç Fiyat Tahminleme API",
    description="""
    ## 🚀 Gelişmiş Araç Değerleme Sistemi
    
    Bu API, **Gemini AI**, **LangChain** ve **Google Web Search** teknolojilerini kullanarak anlık araç fiyat tahmini yapar.
    
    ### ✨ Özellikler
    * 🎯 **Anlık Fiyat Tahmini** - Güncel pazar verilerine dayalı
    * 🧠 **Yapay Zeka Analizi** - Gemini AI ile akıllı değerlendirme
    * 📊 **Detaylı Raporlama** - Hasar durumuna göre değer kaybı analizi
    * 🌐 **Web Arama Entegrasyonu** - Güncel piyasa fiyatlarını referans alır
    """,
    version="3.0.0",
)

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini API'sini yapılandır
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY çevre değişkeni ayarlanmamış!")

# LangChain ile Gemini modelini oluştur
llm = ChatGoogleGenerativeAI(
    model=os.getenv("GEMINI_MODEL", "gemini-1.5-flash"),
    google_api_key=GEMINI_API_KEY,
    temperature=float(os.getenv("GEMINI_TEMPERATURE", "0.2")),
    max_tokens=int(os.getenv("GEMINI_MAX_TOKENS", "2048")),
    convert_system_message_to_human=True
)

# Pydantic Modelleri
class HasarDetayi(BaseModel):
    parca: str
    durum: str

class AracBilgileri(BaseModel):
    marka: str
    model: str
    yil: int
    kilometre: int
    yakit_tipi: str
    vites_tipi: str
    il: str

class DetayliAracBilgileri(AracBilgileri):
    renk: str
    motor_hacmi: Optional[float] = None
    motor_gucu: Optional[int] = None
    ekstra_bilgiler: Optional[str] = None
    hasar_detaylari: List[HasarDetayi] = []

class TahminSonucu(BaseModel):
    tahmini_fiyat_min: int
    tahmini_fiyat_max: int
    ortalama_fiyat: int
    rapor: str
    analiz_tarihi: str
    pazar_analizi: str

# LangChain Output Parser
class FiyatTahminParser(BaseOutputParser):
    def parse(self, text: str) -> dict:
        try:
            cleaned_text = re.sub(r'```json\n?|```', '', text).strip()
            if '{' in cleaned_text and '}' in cleaned_text:
                json_start = cleaned_text.find('{')
                json_end = cleaned_text.rfind('}') + 1
                return json.loads(cleaned_text[json_start:json_end])
        except Exception:
            pass
        # Fallback regex parsing
        min_fiyat = int(re.search(r'min.*?(\d+)', text, re.IGNORECASE).group(1) or 0)
        max_fiyat = int(re.search(r'max.*?(\d+)', text, re.IGNORECASE).group(1) or 0)
        ortalama_fiyat = int(re.search(r'ortalama.*?(\d+)', text, re.IGNORECASE).group(1) or 0)
        return {
            "tahmini_fiyat_min": min_fiyat, "tahmini_fiyat_max": max_fiyat, "ortalama_fiyat": ortalama_fiyat,
            "rapor": text, "pazar_analizi": "Pazar analizi ayrıştırılamadı."
        }

# LangChain Prompt Templates
hizli_tahmin_prompt = PromptTemplate.from_template(
    """Sen bir otomotiv uzmanısın ve Türkiye'deki ikinci el araç piyasasını çok iyi biliyorsun.
    Aşağıdaki araç için güncel pazar değerini hızlıca analiz et ve bir fiyat aralığı sun.
    ARAÇ BİLGİLERİ: Marka: {marka}, Model: {model}, Yıl: {yil}, Kilometre: {kilometre} km, Yakıt: {yakit_tipi}, Vites: {vites_tipi}, İl: {il}.
    GÖREV: Minimum, maksimum ve ortalama fiyat içeren bir JSON yanıtı oluştur. Fiyatı etkileyen ana faktörleri bir cümleyle özetle.
    JSON FORMATI: {{'tahmini_fiyat_min': int, 'tahmini_fiyat_max': int, 'ortalama_fiyat': int, 'rapor': str, 'pazar_analizi': str}}
    Önemli: Yanıtın sadece JSON formatında olsun, başka açıklama ekleme."""
)

detayli_tahmin_prompt = PromptTemplate.from_template(
    """Sen bir otomotiv uzmanısın ve Türkiye'deki ikinci el araç piyasasını çok iyi biliyorsun.
    GÖREV: Aşağıdaki bilgilere dayanarak detaylı bir araç fiyat analizi yap.
    
    1.  **Piyasa Fiyatı Belirleme:**
        *   Verilen araç bilgileri: {marka} {model} {yil}.
        *   Bu aracın hasarsız ve ortalama kilometredeki güncel Türkiye piyasa fiyatı referans olarak **{piyasa_fiyati} TL** bulunmuştur.

    2.  **Değer Kaybı Hesaplama:**
        *   Aracın bilgileri: Kilometre: {kilometre} km, Renk: {renk}, İl: {il}, Motor: {motor_hacmi}L {motor_gucu}HP, Ekstra Bilgiler: {ekstra_bilgiler}.
        *   Hasar Listesi: {hasar_listesi}
        *   Bu listedeki her bir hasarın (parça ve durum) değer kaybını ayrı ayrı hesapla. Kilometre, renk gibi diğer faktörlerin etkisini de ekle.

    3.  **Nihai Fiyat Tahmini:**
        *   Referans piyasa fiyatından toplam değer kaybını düşerek aracın nihai fiyat aralığını (minimum, maksimum, ortalama) hesapla.

    4.  **Raporlama:**
        *   **Rapor:** Değer kaybı hesaplamalarını detaylı olarak açıkla. Her bir hasarın ve diğer faktörlerin fiyata etkisini TL cinsinden belirt. Adım adım nihai fiyata nasıl ulaştığını anlat.
        *   **Pazar Analizi:** Aracın modelinin genel pazar durumunu (popülerlik, arz-talep) ve gelecekteki değer beklentilerini özetle.

    JSON FORMATI: {{'tahmini_fiyat_min': int, 'tahmini_fiyat_max': int, 'ortalama_fiyat': int, 'rapor': str, 'pazar_analizi': str}}
    Önemli: Yanıtın sadece JSON formatında olsun, başka açıklama ekleme."""
)

# LangChain Chains
hizli_tahmin_chain = hizli_tahmin_prompt | llm | FiyatTahminParser()
detayli_tahmin_chain = detayli_tahmin_prompt | llm | FiyatTahminParser()

# Web Scraping Function
def search_google_and_get_prices(query: str) -> int:
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(f"https://www.google.com/search?q={query}", headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Google search results are complex, this is a simplified approach
        # It might need adjustments based on actual Google HTML structure
        price_texts = soup.get_text()
        
        fiyatlar = re.findall(r'(\d[\d.,]*\d)\s*TL', price_texts)
        temiz_fiyatlar = [int(re.sub(r'[.,]', '', f)) for f in fiyatlar if f]
        
        if temiz_fiyatlar:
            return int(sum(temiz_fiyatlar) / len(temiz_fiyatlar))
        return 1000000  # Default if no prices found
    except Exception:
        return 1000000 # Default on error

# API Endpoints
@app.get("/")
async def root():
    return {"message": "FiyatIQ API v3.0 çalışıyor!"}

@app.post("/hizli-tahmin", response_model=TahminSonucu)
async def hizli_fiyat_tahmini(arac: AracBilgileri):
    try:
        result = await hizli_tahmin_chain.ainvoke(arac.dict())
        return TahminSonucu(**result, analiz_tarihi=datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hızlı tahmin sırasında hata: {str(e)}")

@app.post("/detayli-tahmin", response_model=TahminSonucu)
async def detayli_fiyat_tahmini(arac: DetayliAracBilgileri):
    try:
        # 1. Web'de hasarsız piyasa fiyatını araştır
        arama_sorgusu = f"{arac.yil} {arac.marka} {arac.model} hasarsız fiyatları"
        piyasa_fiyati_referans = search_google_and_get_prices(arama_sorgusu)

        # 2. Hasar listesini formatla
        hasar_listesi_str = ", ".join([f"{h.parca}: {h.durum}" for h in arac.hasar_detaylari]) or "Hasar yok"

        # 3. Geliştirilmiş prompt ile AI'ı çağır
        result = await detayli_tahmin_chain.ainvoke({
            **arac.dict(),
            "piyasa_fiyati": f"{piyasa_fiyati_referans:,}",
            "hasar_listesi": hasar_listesi_str
        })

        return TahminSonucu(**result, analiz_tarihi=datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detaylı tahmin sırasında hata: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "3.0.0"}