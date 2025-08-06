"""Akıllı Araç Fiyat Tahminleme API

Bu uygulama, kullanıcının girdiği araç bilgilerine göre
LangChain ve Gemini AI kullanarak anlık fiyat tahmini yapar.
"""

import json
import os
import re
from datetime import datetime
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
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
    
    Bu API, **Gemini AI** ve **LangChain** teknolojilerini kullanarak anlık araç fiyat tahmini yapar.
    
    ### ✨ Özellikler
    * 🎯 **Anlık Fiyat Tahmini** - Güncel pazar verilerine dayalı
    * 🧠 **Yapay Zeka Analizi** - Gemini AI ile akıllı değerlendirme
    * 📊 **Detaylı Raporlama** - Hasar durumuna göre değer kaybı analizi
    """,
    version="5.0.0",
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
    model=os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
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
    motor_hacmi: Optional[float] = None
    motor_gucu: Optional[int] = None

class DetayliAracBilgileri(AracBilgileri):
    renk: str
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
        min_fiyat_match = re.search(r'"tahmini_fiyat_min":\s*(\d+)', text)
        max_fiyat_match = re.search(r'"tahmini_fiyat_max":\s*(\d+)', text)
        ortalama_fiyat_match = re.search(r'"ortalama_fiyat":\s*(\d+)', text)
        min_fiyat = int(min_fiyat_match.group(1)) if min_fiyat_match else 0
        max_fiyat = int(max_fiyat_match.group(1)) if max_fiyat_match else 0
        ortalama_fiyat = int(ortalama_fiyat_match.group(1)) if ortalama_fiyat_match else 0
        return {
            "tahmini_fiyat_min": min_fiyat, "tahmini_fiyat_max": max_fiyat, "ortalama_fiyat": ortalama_fiyat,
            "rapor": "Rapor ayrıştırılamadı. Ham metin: " + text, 
            "pazar_analizi": "Pazar analizi ayrıştırılamadı."
        }

# LangChain Prompt Templates
hizli_tahmin_prompt = PromptTemplate.from_template(
    """Sen bir otomotiv uzmanısın ve Türkiye'deki ikinci el araç piyasasını çok iyi biliyorsun.
    Aşağıdaki araç için güncel pazar değerini hızlıca analiz et ve bir fiyat aralığı sun.
    ARAÇ BİLGİLERİ: Marka: {marka}, Model: {model}, Yıl: {yil}, Kilometre: {kilometre} km, Yakıt: {yakit_tipi}, Vites: {vites_tipi}, İl: {il}, Motor Hacmi: {motor_hacmi}L, Motor Gücü: {motor_gucu}HP.
    GÖREV: 
    1.  Bu araç için Türkiye pazarında güncel ve gerçekçi bir fiyat aralığı (min, max, ortalama) belirle.
    2.  **Rapor Alanı (HTML):** Fiyatı etkileyen en önemli 2-3 faktörü (örn: modelin popülerliği, kilometre durumu) `<strong>` etiketleriyle vurgulayarak kısaca açıkla.
    3.  **Pazar Analizi Alanı (HTML):** Bu modelin genel piyasa durumu hakkında 1-2 cümlelik bir yorum yap.

    JSON FORMATI: {{'tahmini_fiyat_min': int, 'tahmini_fiyat_max': int, 'ortalama_fiyat': int, 'rapor': "<p>Rapor metni...</p>", 'pazar_analizi': "<p>Analiz metni...</p>"}}
    Önemli: Yanıtın sadece JSON formatında olsun ve `rapor` ile `pazar_analizi` alanları geçerli HTML içermelidir."""
)

detayli_tahmin_prompt = PromptTemplate.from_template(
    """Sen bir otomotiv uzmanısın ve Türkiye'deki ikinci el araç piyasasını çok iyi biliyorsun.
    GÖREV: Sana verilen referans fiyattan yola çıkarak, aracın ek detaylarına göre fiyattaki değişimleri hesapla ve detaylı bir rapor oluştur.
    
    REFERANS BİLGİLER:
    *   Aracın modeli: {marka} {model} {yil}
    *   Bu aracın hasarsız ve ortalama kilometredeki piyasa değeri **{referans_fiyat} TL** olarak belirlendi.

    DEĞERLENDİRİLECEK EK DETAYLAR:
    *   **Kilometre:** {kilometre} km
    *   **Hasar Listesi:** {hasar_listesi}
    *   **Diğer Faktörler:** Renk ({renk}), İl ({il}), Ekstra Bilgiler ({ekstra_bilgiler}).

HESAPLAMA VE RAPORLAMA (HTML FORMATINDA):
    1.  **Değer Kaybı/Artışı Hesapla:** Belirlenen referans fiyattan başlayarak, yukarıdaki 'DEĞERLENDİRİLECEK EK DETAYLAR' bölümündeki her bir faktörün fiyata etkisini TL cinsinden hesapla.
    2.  **Nihai Fiyatı Belirle:** Referans fiyattan toplam değer kayıplarını düşüp, artışları ekleyerek aracın yeni nihai fiyat aralığını (minimum, maksimum, ortalama) hesapla.
    3.  **Rapor Oluştur:**
        *   `<h4>Referans Fiyat</h4>` başlığı altında başlangıç fiyatını belirt.
        *   `<h4>Değer Kaybı/Artışı Analizi</h4>` başlığı altında, değerlendirdiğin her faktörü `<li><strong>Faktör Adı:</strong> Açıklama ve +/- TL Etkisi</li>` şeklinde listele.
        *   `<h4>Nihai Fiyat Tahmini</h4>` başlığı altında ulaştığın sonuçları özetle.
    4.  **Pazar Analizi Oluştur:** Aracın modelinin genel pazar durumunu (popülerlik, arz-talep) özetle.

    JSON FORMATI: {{"tahmini_fiyat_min": int, "tahmini_fiyat_max": int, "ortalama_fiyat": int, "rapor": "<h4>...</h4><ul><li>...</li></ul>", "pazar_analizi": "<p>...</p>"}}
    Önemli: Yanıtın sadece JSON formatında olsun ve `rapor` ile `pazar_analizi` alanları geçerli HTML içermelidir."""
)

# LangChain Chains
hizli_tahmin_chain = hizli_tahmin_prompt | llm | FiyatTahminParser()
detayli_tahmin_chain = detayli_tahmin_prompt | llm | FiyatTahminParser()

# API Endpoints
@app.get("/")
async def root():
    return {"message": "FiyatIQ API v5.0 çalışıyor!"}

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
        # 1. Adım: Güvenilir bir referans fiyat almak için önce "Hızlı Analiz" zincirini çağır.
        hizli_analiz_sonucu = await hizli_tahmin_chain.ainvoke(arac.dict())
        referans_fiyat = hizli_analiz_sonucu.get('ortalama_fiyat', 0)

        if referans_fiyat == 0:
            raise HTTPException(status_code=500, detail="Referans fiyat alınamadı, detaylı analiz yapılamıyor.")

        # 2. Adım: Hasar listesini formatla.
        hasar_listesi_str = ", ".join([f'{h.parca}: {h.durum}' for h in arac.hasar_detaylari if h.parca and h.durum]) or "Hasar yok"

        # 3. Adım: Elde edilen referans fiyatı ve diğer detayları kullanarak "Detaylı Analiz" zincirini çağır.
        detayli_analiz_input = {
            **arac.dict(),
            "referans_fiyat": f'{referans_fiyat:,}',
            "hasar_listesi": hasar_listesi_str
        }
        
        result = await detayli_tahmin_chain.ainvoke(detayli_analiz_input)

        return TahminSonucu(**result, analiz_tarihi=datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detaylı tahmin sırasında hata: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "5.0.0"}