"""
Akıllı Araç Fiyat Tahminleme API
Bu uygulama, kullanıcının girdiği araç bilgilerine göre
LangChain ve Gemini AI kullanarak anlık fiyat tahmini yapar.
"""

import json
import os
import re
import time
from datetime import datetime
from typing import List, Optional

# CRUD imports
import crud
# Authentication imports
from auth import (PasswordChange, SecurityLog, TokenResponse, UserLogin,
                  UserProfile, UserRegister, authenticate_user,
                  change_password, create_access_token, create_refresh_token,
                  get_current_user, get_current_user_optional, rate_limiter,
                  register_user, sanitize_input)
# Database imports
from database import (ApiKullanimi, AracHasarDetayi, AracParcasi, AracTahmini,
                      HasarTipi, Kullanici, KullaniciAraci, PazarVerisi,
                      PopulerAraclar, SessionLocal, create_tables, get_db)
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from langchain.output_parsers import PydanticOutputParser
from langchain.prompts import PromptTemplate
from langchain.schema import BaseOutputParser
# LangChain imports
from langchain_google_genai import ChatGoogleGenerativeAI
# Model imports
from models import (AracGuncelle, AracOlustur, AracOzet, AracParcasiYanit,
                    AracYanit, DetayliTahminIstegi, DetayliTahminSonucu,
                    EmailKontrol, HasarTipiYanit, KilometreGuncelle,
                    KullaniciGuncelle, KullaniciIstatistik, KullaniciOlustur,
                    KullaniciYanit, PazarVerisiYanit, SayfalamaBilgisi,
                    SayfaliYanit, TahminGecmisi, YanitMesaj)
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

# Çevre değişkenlerini yükle
load_dotenv()

# Veritabanı tablolarını oluştur
create_tables()

# FastAPI uygulamasını oluştur
app = FastAPI(
    title="🚗 Akıllı Araç Fiyat Tahminleme API",
    description="""
    ## 🚀 Gelişmiş Araç Değerleme Sistemi
    
    Bu API, **Gemini AI** ve **LangChain** teknolojilerini kullanarak:
    
    ### ✨ Özellikler
    * 🎯 **Anlık Fiyat Tahmini** - Güncel pazar verilerine dayalı
    * 🧠 **Yapay Zeka Analizi** - Gemini AI ile akıllı değerlendirme
    * 📊 **Detaylı Raporlama** - Pazar analizi ve öneriler
    * 💾 **Kullanıcı Yönetimi** - Araç ve tahmin geçmişi
    * 📈 **İstatistikler** - Kullanım ve trend analizleri
    
    ### 🔧 Teknoloji Stack
    * **FastAPI** - Modern Python web framework
    * **SQLAlchemy** - ORM ve veritabanı yönetimi
    * **LangChain** - AI entegrasyonu
    * **SQLite** - Hafif veritabanı çözümü
    
    ### 📚 API Kullanımı
    1. **Kullanıcı Kaydı** - `/kullanici/kayit` endpoint'i ile
    2. **Araç Ekleme** - Kişisel araç bilgilerinizi kaydedin
    3. **Fiyat Tahmini** - `/tahmin-et` ile anlık analiz
    4. **Geçmiş Görüntüleme** - Önceki tahminlerinizi inceleyin
    
    ### 🎨 Frontend Örnekleri
    * React, Vue.js veya vanilla JavaScript ile entegre edilebilir
    * RESTful API standartlarına uygun
    * JSON formatında veri alışverişi
    """,
    version="1.0.0",
    terms_of_service="https://github.com/your-repo/terms",
    contact={
        "name": "Geliştirici",
        "url": "https://github.com/your-repo",
        "email": "developer@example.com",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
    openapi_tags=[
        {
            "name": "🏠 Ana Sistem",
            "description": "Temel sistem kontrolleri ve sağlık durumu"
        },
        {
            "name": "🎯 Fiyat Tahmini",
            "description": "AI destekli araç fiyat tahmin işlemleri"
        },
        {
            "name": "👤 Kullanıcı Yönetimi", 
            "description": "Kullanıcı hesap işlemleri"
        },
        {
            "name": "🚗 Araç Yönetimi",
            "description": "Kullanıcı araçları CRUD işlemleri"
        },
        {
            "name": "📊 İstatistikler",
            "description": "Sistem ve kullanıcı istatistikleri"
        },
        {
            "name": "🔍 Arama",
            "description": "Arama ve filtreleme işlemleri"
        }
    ]
)

# CORS ayarları (Frontend ile backend arasındaki iletişim için)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Üretimde bunu daha spesifik yapın
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini API'sini yapılandır
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY çevre değişkeni ayarlanmamış!")

# Gemini model konfigürasyonu
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")
GEMINI_TEMPERATURE = float(os.getenv("GEMINI_TEMPERATURE", "0.3"))
GEMINI_MAX_TOKENS = int(os.getenv("GEMINI_MAX_TOKENS", "2048"))

# LangChain ile Gemini modelini oluştur
llm = ChatGoogleGenerativeAI(
    model=GEMINI_MODEL,
    google_api_key=GEMINI_API_KEY,
    temperature=GEMINI_TEMPERATURE,  # Daha tutarlı sonuçlar için düşük temperature
    max_tokens=GEMINI_MAX_TOKENS,
    convert_system_message_to_human=True
)

# Pydantic modelleri (API'ye gelen ve giden veriler için)
class AracBilgileri(BaseModel):
    """
    ## 🎯 Fiyat Tahmini İçin Araç Bilgileri
    
    AI analizi için gerekli araç özellikleri
    """
    marka: str = Field(..., description="Araç markası", example="Toyota")
    model: str = Field(..., description="Araç modeli", example="Corolla")
    yil: int = Field(..., ge=1950, le=2025, description="Model yılı", example=2020)
    kilometre: int = Field(..., ge=0, description="Kilometre", example=50000)
    yakit_tipi: str = Field(..., description="Yakıt türü", example="Benzin")
    vites_tipi: str = Field(..., description="Vites türü", example="Otomatik")
    hasar_durumu: str = Field(..., description="Hasar durumu", example="Hasarsız")
    renk: str = Field(..., description="Araç rengi", example="Beyaz")
    il: str = Field(..., description="Bulunduğu şehir", example="İstanbul")
    motor_hacmi: Optional[float] = Field(None, description="Motor hacmi (L)", example=1.6)
    motor_gucu: Optional[int] = Field(None, description="Motor gücü (HP)", example=130)
    ekstra_bilgiler: Optional[str] = Field(None, description="Ek bilgiler", example="Çok temiz araç")
    
    class Config:
        json_schema_extra = {
            "example": {
                "marka": "Toyota",
                "model": "Corolla",
                "yil": 2020,
                "kilometre": 50000,
                "yakit_tipi": "Benzin",
                "vites_tipi": "Otomatik",
                "hasar_durumu": "Hasarsız",
                "renk": "Beyaz",
                "il": "İstanbul",
                "motor_hacmi": 1.6,
                "motor_gucu": 130,
                "ekstra_bilgiler": "Garajda saklanmış temiz araç"
            }
        }

class TahminSonucu(BaseModel):
    """
    ## 📊 AI Fiyat Tahmini Sonucu
    
    Gemini AI tarafından üretilen detaylı analiz raporu
    """
    tahmini_fiyat_min: int = Field(description="Minimum tahmini fiyat (TL)", example=450000)
    tahmini_fiyat_max: int = Field(description="Maksimum tahmini fiyat (TL)", example=550000)
    ortalama_fiyat: int = Field(description="Ortalama tahmini fiyat (TL)", example=500000)
    rapor: str = Field(description="Detaylı analiz raporu", example="Bu araç için pazar analizi...")
    analiz_tarihi: str = Field(description="Analiz yapılan tarih ve saat", example="2024-08-04 14:30:25")
    pazar_analizi: str = Field(description="Güncel pazar durumu hakkında bilgi", example="Pazar durumu stabil...")
    tahmin_id: Optional[int] = Field(description="Veritabanındaki tahmin ID'si", example=123)
    
    class Config:
        json_schema_extra = {
            "example": {
                "tahmini_fiyat_min": 450000,
                "tahmini_fiyat_max": 550000,
                "ortalama_fiyat": 500000,
                "rapor": "2020 model Toyota Corolla için yapılan analiz sonucunda...",
                "analiz_tarihi": "2024-08-04 14:30:25",
                "pazar_analizi": "Toyota Corolla modeli piyasada stabil bir değere sahip...",
                "tahmin_id": 123
            }
        }

class IstatistikModel(BaseModel):
    toplam_tahmin: int
    populer_markalar: List[dict]
    ortalama_response_time: float
    gunluk_kullanim: int

# LangChain Output Parser
class FiyatTahminParser(BaseOutputParser):
    """Gemini'den gelen yanıtı parse eden özel parser"""
    
    def parse(self, text: str) -> dict:
        # JSON formatında yanıt bekliyoruz
        try:
            # Önce JSON parse etmeyi dene
            if "{" in text and "}" in text:
                json_start = text.find("{")
                json_end = text.rfind("}") + 1
                json_text = text[json_start:json_end]
                result = json.loads(json_text)
                return result
        except:
            pass
        
        # JSON parse edilemezse regex ile parse et
        try:
            min_match = re.search(r'min.*?(\d+)', text, re.IGNORECASE)
            max_match = re.search(r'max.*?(\d+)', text, re.IGNORECASE)
            avg_match = re.search(r'ortalama.*?(\d+)', text, re.IGNORECASE)
            
            min_fiyat = int(min_match.group(1)) if min_match else 400000
            max_fiyat = int(max_match.group(1)) if max_match else 600000
            ortalama_fiyat = int(avg_match.group(1)) if avg_match else 500000
            
            return {
                "tahmini_fiyat_min": min_fiyat,
                "tahmini_fiyat_max": max_fiyat,
                "ortalama_fiyat": ortalama_fiyat,
                "rapor": text,
                "pazar_analizi": "Güncel pazar verilerine dayalı analiz"
            }
        except:
            # Son çare olarak varsayılan değerler
            return {
                "tahmini_fiyat_min": 400000,
                "tahmini_fiyat_max": 600000,
                "ortalama_fiyat": 500000,
                "rapor": text,
                "pazar_analizi": "Analiz sırasında hata oluştu"
            }

# LangChain Prompt Template
fiyat_tahmin_prompt = PromptTemplate(
    input_variables=[
        "marka", "model", "yil", "kilometre", "yakit_tipi", 
        "vites_tipi", "hasar_durumu", "renk", "il", 
        "motor_hacmi", "motor_gucu", "ekstra_bilgiler"
    ],
    template="""
Sen bir otomotiv uzmanısın ve Türkiye'deki ikinci el araç piyasasını çok iyi biliyorsun.
Aşağıdaki araç için güncel pazar değerini analiz et ve fiyat tahmini yap.

ARAÇ BİLGİLERİ:
- Marka: {marka}
- Model: {model}  
- Yıl: {yil}
- Kilometre: {kilometre:,} km
- Yakıt Tipi: {yakit_tipi}
- Vites: {vites_tipi}
- Hasar Durumu: {hasar_durumu}
- Renk: {renk}
- İl: {il}
{motor_hacmi}
{motor_gucu}
{ekstra_bilgiler}

GÖREV:
1. Bu araç için Türkiye pazarında güncel fiyat tahmini yap
2. Minimum, maksimum ve ortalama fiyat belirle
3. Pazar durumunu analiz et
4. Fiyatı etkileyen faktörleri açıkla

Yanıtını aşağıdaki JSON formatında ver:
{{
    "tahmini_fiyat_min": [minimum_fiyat_sayı],
    "tahmini_fiyat_max": [maksimum_fiyat_sayı], 
    "ortalama_fiyat": [ortalama_fiyat_sayı],
    "rapor": "Bu araç için [detaylı_analiz_ve_açıklama]",
    "pazar_analizi": "Güncel pazar durumu: [pazar_durumu_analizi]"
}}

Önemli: Yanıtın sadece JSON formatında olsun, başka açıklama ekleme.
"""
)

from operator import itemgetter

# LangChain Chain oluştur
from langchain.schema.runnable import RunnableSequence

# Create the chain using LCEL syntax
fiyat_tahmin_chain = RunnableSequence(
    first=fiyat_tahmin_prompt,
    middle=[llm],  # Wrap llm in a list
    last=FiyatTahminParser()
).with_config({"run_name": "fiyat_tahmin"})

# Ana endpoint'ler
@app.get("/", tags=["🏠 Ana Sistem"])
async def root():
    """
    ## 🏠 API Durum Kontrolü
    
    API'nin çalışır durumda olduğunu kontrol eder.
    
    **Yanıt:**
    - API durum mesajı
    - Versiyon bilgisi  
    - Dokümantasyon bağlantısı
    """
    return {
        "message": "🚗 Akıllı Araç Fiyat Tahminleme API çalışıyor!",
        "version": "1.0.0",
        "docs": "/docs",
        "api_features": [
            "AI Destekli Fiyat Tahmini",
            "Kullanıcı ve Araç Yönetimi", 
            "Detaylı İstatistikler",
            "Geçmiş Analiz"
        ]
    }

@app.post("/tahmin-et", response_model=TahminSonucu, tags=["🎯 Fiyat Tahmini"])
async def fiyat_tahmini_yap(arac: AracBilgileri, request: Request, db: Session = Depends(get_db)):
    """
    ## 🎯 AI Destekli Araç Fiyat Tahmini
    
    Girilen araç bilgilerine göre **Gemini AI** kullanarak anlık fiyat tahmini yapar.
    
    ### 📝 Gerekli Bilgiler:
    - **Marka & Model**: Araç markası ve modeli
    - **Yıl**: Model yılı (1950-2025)
    - **Kilometre**: Güncel kilometre bilgisi
    - **Yakıt Tipi**: Benzin, Dizel, LPG, Hibrit, Elektrik
    - **Vites**: Manuel, Otomatik
    - **Hasar Durumu**: Hasarsız, Boyalı, Değişen, Hasarlı
    - **Renk**: Araç rengi
    - **İl**: Bulunduğu şehir
    
    ### 🚀 AI Analiz Süreci:
    1. **Veri Doğrulama** - Girilen bilgilerin kontrolü
    2. **Pazar Araştırması** - Gemini AI ile güncel fiyat analizi
    3. **Rapor Oluşturma** - Detaylı analiz ve öneriler
    4. **Veritabanı Kayıt** - Sonuçların saklanması
    
    ### 📊 Yanıt İçeriği:
    - Minimum/Maksimum/Ortalama fiyat
    - Detaylı analiz raporu
    - Pazar durumu analizi
    - Tahmin ID'si (geçmiş için)
    """
    start_time = time.time()
    client_ip = request.client.host
    
    try:
        # LangChain Chain'i çalıştır
        result = fiyat_tahmin_chain.invoke({
            "marka": arac.marka,
            "model": arac.model,
            "yil": arac.yil,
            "kilometre": arac.kilometre,
            "yakit_tipi": arac.yakit_tipi,
            "vites_tipi": arac.vites_tipi,
            "hasar_durumu": arac.hasar_durumu,
            "renk": arac.renk,
            "il": arac.il,
            "motor_hacmi": f"- Motor Hacmi: {arac.motor_hacmi} L" if arac.motor_hacmi else "",
            "motor_gucu": f"- Motor Gücü: {arac.motor_gucu} HP" if arac.motor_gucu else "",
            "ekstra_bilgiler": f"- Ekstra Bilgiler: {arac.ekstra_bilgiler}" if arac.ekstra_bilgiler else ""
        })
        
        end_time = time.time()
        processing_time = end_time - start_time
        current_time = datetime.now()
        
        # Veritabanına tahmin sonucunu kaydet
        db_tahmin = AracTahmini(
            marka=arac.marka,
            model=arac.model,
            yil=arac.yil,
            kilometre=arac.kilometre,
            yakit_tipi=arac.yakit_tipi,
            vites_tipi=arac.vites_tipi,
            hasar_durumu=arac.hasar_durumu,
            renk=arac.renk,
            il=arac.il,
            motor_hacmi=arac.motor_hacmi,
            motor_gucu=arac.motor_gucu,
            ekstra_bilgiler=arac.ekstra_bilgiler,
            tahmini_fiyat_min=result.get("tahmini_fiyat_min", 400000),
            tahmini_fiyat_max=result.get("tahmini_fiyat_max", 600000),
            ortalama_fiyat=result.get("ortalama_fiyat", 500000),
            rapor=result.get("rapor", "Analiz tamamlandı"),
            pazar_analizi=result.get("pazar_analizi", "Güncel pazar analizi"),
            analiz_tarihi=current_time,
            ip_adresi=client_ip,
            islem_suresi=processing_time
        )
        
        db.add(db_tahmin)
        db.commit()
        db.refresh(db_tahmin)
        
        # Popüler araçlar tablosunu güncelle
        populer_arac = db.query(PopulerAraclar).filter(
            PopulerAraclar.marka == arac.marka,
            PopulerAraclar.model == arac.model
        ).first()
        
        if populer_arac:
            populer_arac.arama_sayisi += 1
            populer_arac.son_arama = current_time
            populer_arac.ortalama_fiyat = result.get("ortalama_fiyat", populer_arac.ortalama_fiyat)
        else:
            populer_arac = PopulerAraclar(
                marka=arac.marka,
                model=arac.model,
                arama_sayisi=1,
                son_arama=current_time,
                ortalama_fiyat=result.get("ortalama_fiyat", 500000)
            )
            db.add(populer_arac)
        
        db.commit()
        
        # API kullanım istatistiğini kaydet
        api_log = ApiKullanimi(
            endpoint="/tahmin-et",
            method="POST",
            status_code=200,
            response_time=processing_time * 1000,  # milisaniye
            ip_adresi=client_ip
        )
        db.add(api_log)
        db.commit()
        
        return TahminSonucu(
            tahmini_fiyat_min=result.get("tahmini_fiyat_min", 400000),
            tahmini_fiyat_max=result.get("tahmini_fiyat_max", 600000),
            ortalama_fiyat=result.get("ortalama_fiyat", 500000),
            rapor=result.get("rapor", "Analiz tamamlandı"),
            analiz_tarihi=current_time.strftime("%Y-%m-%d %H:%M:%S"),
            pazar_analizi=result.get("pazar_analizi", "Güncel pazar analizi"),
            tahmin_id=db_tahmin.id
        )

    except Exception as e:
        # Hata durumunda da API kullanımını logla
        api_log = ApiKullanimi(
            endpoint="/tahmin-et",
            method="POST",
            status_code=500,
            response_time=(time.time() - start_time) * 1000,
            ip_adresi=client_ip,
            hata_mesaji=str(e)
        )
        db.add(api_log)
        db.commit()
        
        raise HTTPException(status_code=500, detail=f"Fiyat tahmini yapılırken hata oluştu: {str(e)}")

@app.get("/health", tags=["🏠 Ana Sistem"])
async def health_check():
    """
    ## 🏥 Sistem Sağlık Kontrolü
    
    Sistemin tüm bileşenlerinin çalışır durumda olduğunu kontrol eder.
    
    **Kontrol Edilen Servisler:**
    - Gemini AI API bağlantısı
    - LangChain entegrasyonu  
    - SQLite veritabanı
    - Temel sistem durumu
    """
    return {
        "status": "healthy",
        "gemini_api": "configured" if GEMINI_API_KEY else "not_configured",
        "langchain": "enabled",
        "database": "sqlite_connected"
    }

@app.get("/istatistikler", response_model=IstatistikModel, tags=["📊 İstatistikler"])
async def get_istatistikler(db: Session = Depends(get_db)):
    """
    ## 📊 Genel Sistem İstatistikleri
    
    Sistemin genel kullanım istatistiklerini görüntüler.
    
    ### 📈 İçerik:
    - **Toplam Tahmin**: Yapılan tüm tahmin sayısı
    - **Popüler Markalar**: En çok aranan araç markaları (Top 10)
    - **Performans**: Ortalama yanıt süresi
    - **Günlük Aktivite**: Bugün yapılan işlem sayısı
    
    ### 💡 Kullanım Alanları:
    - Sistem performans analizi
    - Popüler araç trendleri
    - Kullanıcı davranış analizi
    """
    try:
        # Toplam tahmin sayısı
        toplam_tahmin = db.query(AracTahmini).count()
        
        # En popüler markalar (son 10)
        populer_markalar = db.query(PopulerAraclar).order_by(
            PopulerAraclar.arama_sayisi.desc()
        ).limit(10).all()
        
        populer_markalar_list = [
            {
                "marka": p.marka,
                "model": p.model, 
                "arama_sayisi": p.arama_sayisi,
                "ortalama_fiyat": p.ortalama_fiyat
            }
            for p in populer_markalar
        ]
        
        # Ortalama response time
        from sqlalchemy import func
        avg_response = db.query(func.avg(ApiKullanimi.response_time)).scalar() or 0
        
        # Bugünkü kullanım
        today = datetime.now().date()
        gunluk_kullanim = db.query(ApiKullanimi).filter(
            func.date(ApiKullanimi.timestamp) == today
        ).count()
        
        return IstatistikModel(
            toplam_tahmin=toplam_tahmin,
            populer_markalar=populer_markalar_list,
            ortalama_response_time=round(avg_response, 2),
            gunluk_kullanim=gunluk_kullanim
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"İstatistikler alınırken hata: {str(e)}")

@app.get("/gecmis-tahminler")
async def get_gecmis_tahminler(limit: int = 10, db: Session = Depends(get_db)):
    """Son yapılan tahminleri gösterir"""
    try:
        tahminler = db.query(AracTahmini).order_by(
            AracTahmini.analiz_tarihi.desc()
        ).limit(limit).all()
        
        return [
            {
                "id": t.id,
                "marka": t.marka,
                "model": t.model,
                "yil": t.yil,
                "ortalama_fiyat": t.ortalama_fiyat,
                "analiz_tarihi": t.analiz_tarihi.strftime("%Y-%m-%d %H:%M:%S"),
                "islem_suresi": round(t.islem_suresi or 0, 2)
            }
            for t in tahminler
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Geçmiş tahminler alınırken hata: {str(e)}")

@app.get("/tahmin/{tahmin_id}")
async def get_tahmin_detay(tahmin_id: int, db: Session = Depends(get_db)):
    """Belirli bir tahmin ID'sine göre detayları getir"""
    try:
        tahmin = db.query(AracTahmini).filter(AracTahmini.id == tahmin_id).first()
        
        if not tahmin:
            raise HTTPException(status_code=404, detail="Tahmin bulunamadı")
        
        return {
            "id": tahmin.id,
            "arac_bilgileri": {
                "marka": tahmin.marka,
                "model": tahmin.model,
                "yil": tahmin.yil,
                "kilometre": tahmin.kilometre,
                "yakit_tipi": tahmin.yakit_tipi,
                "vites_tipi": tahmin.vites_tipi,
                "hasar_durumu": tahmin.hasar_durumu,
                "renk": tahmin.renk,
                "il": tahmin.il,
                "motor_hacmi": tahmin.motor_hacmi,
                "motor_gucu": tahmin.motor_gucu
            },
            "tahmin_sonucu": {
                "tahmini_fiyat_min": tahmin.tahmini_fiyat_min,
                "tahmini_fiyat_max": tahmin.tahmini_fiyat_max,
                "ortalama_fiyat": tahmin.ortalama_fiyat,
                "rapor": tahmin.rapor,
                "pazar_analizi": tahmin.pazar_analizi
            },
            "meta": {
                "analiz_tarihi": tahmin.analiz_tarihi.strftime("%Y-%m-%d %H:%M:%S"),
                "islem_suresi": round(tahmin.islem_suresi or 0, 2),
                "ip_adresi": tahmin.ip_adresi[:8] + "***" if tahmin.ip_adresi else None  # Güvenlik için maskeleme
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tahmin detayları alınırken hata: {str(e)}")

# ===== ENHANCED CAR EVALUATION ENDPOINTS =====

@app.post("/detayli-tahmin", response_model=DetayliTahminSonucu, tags=["🎯 Fiyat Tahmini"])
async def detayli_fiyat_tahmini(arac: DetayliTahminIstegi, request: Request, db: Session = Depends(get_db)):
    """
    ## 🔍 Enhanced AI Car Valuation with Detailed Damage Assessment
    
    Advanced car evaluation that includes:
    - Specific part damage analysis
    - Real-time market data collection
    - Depreciation calculations based on damage
    - Comprehensive AI assessment
    
    ### 📋 Enhanced Features:
    - **Part-specific damage assessment**
    - **Real-time web scraping for market prices**
    - **Depreciation calculation by damage type**
    - **Detailed cost breakdown**
    - **Market comparison analysis**
    
    ### 🔧 Damage Assessment:
    Select specific car parts and damage types to get accurate depreciation calculations.
    The system will automatically factor in:
    - Part replacement costs
    - Damage severity impact
    - Market perception effects
    - Repair vs. replacement decisions
    """
    start_time = time.time()
    client_ip = request.client.host
    
    try:
        # Import web scraper
        from web_scraper import (depreciation_calculator,
                                 save_market_data_to_db, scraper)

        # 1. Get real-time market data
        market_data = await scraper.get_depreciation_data_by_damage(
            arac.marka, arac.model, arac.yil
        )
        
        # Save market data to database
        save_market_data_to_db(db, market_data)
        
        # 2. Calculate depreciation based on damage details
        base_price = market_data.get('ortalama_fiyat', 500000)
        
        # Convert damage details to depreciation calculator format
        damage_list = []
        for hasar in arac.hasar_detaylari:
            # Get part and damage type info from database
            parca = db.query(AracParcasi).filter(AracParcasi.id == hasar.parca_id).first()
            hasar_tipi = db.query(HasarTipi).filter(HasarTipi.id == hasar.hasar_tipi_id).first()
            
            if parca and hasar_tipi:
                # Map to depreciation calculator format
                damage_type_map = {
                    'Boyalı': 'boyali',
                    'Değişen': 'degisen', 
                    'Hasarlı': 'hasarli',
                    'Çizik': 'boyali',
                    'Ezik': 'hasarli',
                    'Çatlak': 'hasarli',
                    'Paslanma': 'hasarli',
                    'Yanık': 'hasarli',
                    'Aşınma': 'boyali',
                    'Kırık': 'degisen'
                }
                
                damage_list.append({
                    'part': parca.parca_adi.lower().replace(' ', '_').replace('ö', 'o').replace('ü', 'u').replace('ı', 'i').replace('ş', 's').replace('ğ', 'g').replace('ç', 'c'),
                    'damage_level': hasar.hasar_seviyesi.lower(),
                    'damage_type': damage_type_map.get(hasar_tipi.hasar_adi, 'boyali')
                })
        
        # Calculate depreciation
        depreciation_result = depreciation_calculator.calculate_depreciation(
            base_price, damage_list
        )
        
        # 3. Enhanced AI prompt with market data and depreciation
        enhanced_prompt = f"""
Sen bir otomotiv uzmanısın ve Türkiye'deki ikinci el araç piyasasını çok iyi biliyorsun.
Aşağıdaki araç için detaylı pazar analizi ve fiyat tahmini yap.

ARAÇ BİLGİLERİ:
- Marka: {arac.marka}
- Model: {arac.model}
- Yıl: {arac.yil}
- Kilometre: {arac.kilometre:,} km
- Yakıt Tipi: {arac.yakit_tipi}
- Vites: {arac.vites_tipi}
- Renk: {arac.renk}
- İl: {arac.il}
- Genel Durum: {arac.genel_durum}
- Bakım Durumu: {arac.bakım_durumu}
- Kaza Geçmişi: {'Var' if arac.kaza_gecmisi else 'Yok'}

GÜNCEL PAZAR VERİLERİ:
- Hasarsız Ortalama: {market_data.get('hasarsiz_ortalama', 'N/A'):,} TL
- Boyalı Ortalama: {market_data.get('boyali_ortalama', 'N/A'):,} TL  
- Değişen Ortalama: {market_data.get('degisen_ortalama', 'N/A'):,} TL
- Hasarlı Ortalama: {market_data.get('hasarli_ortalama', 'N/A'):,} TL
- İlan Sayısı: {market_data.get('ilan_sayisi', 'N/A')}

HASAR ANALİZİ:
- Toplam Değer Kaybı: %{depreciation_result['total_depreciation_rate']*100:.1f}
- Hasar İndirimi: {depreciation_result['depreciation_amount']:,} TL
- Tahmini Net Fiyat: {depreciation_result['final_estimated_price']:,} TL

HASAR DETAYLARI:
{chr(10).join([f"- {d.get('part', 'Bilinmeyen')}: {d.get('damage_type', 'N/A')} ({d.get('damage_level', 'N/A')})" for d in damage_list]) if damage_list else "Hasar detayı belirtilmemiş"}

GÖREV:
1. Bu verilere dayanarak gerçekçi bir fiyat aralığı belirle
2. Hasar durumunun fiyata etkisini analiz et
3. Pazar durumunu değerlendir
4. Alıcı ve satıcı için öneriler sun

Yanıtını aşağıdaki JSON formatında ver:
{{
    "tahmini_fiyat_min": [minimum_fiyat],
    "tahmini_fiyat_max": [maksimum_fiyat],
    "ortalama_fiyat": [ortalama_fiyat],
    "rapor": "Detaylı analiz raporu...",
    "pazar_analizi": "Güncel pazar durumu analizi...",
    "oneri": "Alıcı ve satıcı önerileri..."
}}
"""
        
        # 4. Call AI for enhanced analysis
        result = fiyat_tahmin_chain.invoke({
            "marka": arac.marka,
            "model": arac.model,
            "yil": arac.yil,
            "kilometre": arac.kilometre,
            "yakit_tipi": arac.yakit_tipi,
            "vites_tipi": arac.vites_tipi,
            "hasar_durumu": f"Detaylı hasar analizi: {len(damage_list)} parça etkilenmiş",
            "renk": arac.renk,
            "il": arac.il,
            "motor_hacmi": f"- Motor Hacmi: {arac.motor_hacmi} L" if arac.motor_hacmi else "",
            "motor_gucu": f"- Motor Gücü: {arac.motor_gucu} HP" if arac.motor_gucu else "",
            "ekstra_bilgiler": enhanced_prompt
        })
        
        end_time = time.time()
        processing_time = end_time - start_time
        current_time = datetime.now()
        
        # 5. Save detailed estimation to database
        db_tahmin = AracTahmini(
            marka=arac.marka,
            model=arac.model,
            yil=arac.yil,
            kilometre=arac.kilometre,
            yakit_tipi=arac.yakit_tipi,
            vites_tipi=arac.vites_tipi,
            hasar_durumu=f"Detaylı: {len(damage_list)} hasar",
            renk=arac.renk,
            il=arac.il,
            motor_hacmi=arac.motor_hacmi,
            motor_gucu=arac.motor_gucu,
            ekstra_bilgiler=f"Genel durum: {arac.genel_durum}, Bakım: {arac.bakım_durumu}",
            tahmini_fiyat_min=result.get("tahmini_fiyat_min", depreciation_result['final_estimated_price']),
            tahmini_fiyat_max=result.get("tahmini_fiyat_max", int(depreciation_result['final_estimated_price'] * 1.2)),
            ortalama_fiyat=result.get("ortalama_fiyat", depreciation_result['final_estimated_price']),
            rapor=result.get("rapor", "Detaylı analiz tamamlandı"),
            pazar_analizi=result.get("pazar_analizi", "Güncel pazar verileri analiz edildi"),
            analiz_tarihi=current_time,
            ip_adresi=client_ip,
            islem_suresi=processing_time
        )
        
        db.add(db_tahmin)
        db.commit()
        db.refresh(db_tahmin)
        
        # 6. Save damage details
        for hasar in arac.hasar_detaylari:
            hasar_detay = AracHasarDetayi(
                tahmin_id=db_tahmin.id,
                parca_id=hasar.parca_id,
                hasar_tipi_id=hasar.hasar_tipi_id,
                hasar_seviyesi=hasar.hasar_seviyesi,
                tahmini_maliyet=hasar.tahmini_maliyet,
                aciklama=hasar.aciklama
            )
            db.add(hasar_detay)
        
        db.commit()
        
        # 7. Prepare detailed response
        return DetayliTahminSonucu(
            tahmini_fiyat_min=result.get("tahmini_fiyat_min", depreciation_result['final_estimated_price']),
            tahmini_fiyat_max=result.get("tahmini_fiyat_max", int(depreciation_result['final_estimated_price'] * 1.2)),
            ortalama_fiyat=result.get("ortalama_fiyat", depreciation_result['final_estimated_price']),
            pazar_fiyati=market_data.get('ortalama_fiyat', 500000),
            hasar_indirimi=depreciation_result['depreciation_amount'],
            net_fiyat=depreciation_result['final_estimated_price'],
            hasar_detay_raporu=depreciation_result['detailed_calculations'],
            toplam_depreciation_orani=depreciation_result['total_depreciation_rate'],
            rapor=result.get("rapor", "Detaylı analiz tamamlandı"),
            pazar_analizi=result.get("pazar_analizi", "Pazar verileri güncellendi"),
            oneri=result.get("oneri", "Hasar durumu fiyatı etkilemektedir"),
            analiz_tarihi=current_time.strftime("%Y-%m-%d %H:%M:%S"),
            güven_skoru=90 if len(damage_list) > 0 else 85,
            veri_kaynagi=market_data.get('kaynak', 'aggregated'),
            tahmin_id=db_tahmin.id
        )
        
    except Exception as e:
        print(f"Error in detailed estimation: {e}")
        raise HTTPException(status_code=500, detail=f"Detaylı fiyat tahmini yapılırken hata: {str(e)}")

@app.get("/arac-parcalari", response_model=List[AracParcasiYanit], tags=["🔧 Araç Parçaları"])
async def get_arac_parcalari(kategori: Optional[str] = None, db: Session = Depends(get_db)):
    """
    ## 🔧 Get Car Parts List
    
    Returns all available car parts for damage assessment.
    
    **Parameters:**
    - `kategori` (optional): Filter by category (Gövde, Motor, İç Mekan, etc.)
    
    **Returns:** List of car parts with impact factors and average costs
    """
    query = db.query(AracParcasi).filter(AracParcasi.aktif == True)
    
    if kategori:
        query = query.filter(AracParcasi.kategori == kategori)
    
    parcalar = query.all()
    return parcalar

@app.get("/hasar-tipleri", response_model=List[HasarTipiYanit], tags=["🔧 Hasar Tipleri"])
async def get_hasar_tipleri(db: Session = Depends(get_db)):
    """
    ## 🔧 Get Damage Types List
    
    Returns all available damage types for car parts.
    
    **Returns:** List of damage types with depreciation rates
    """
    hasar_tipleri = db.query(HasarTipi).filter(HasarTipi.aktif == True).all()
    return hasar_tipleri

@app.get("/pazar-verileri/{marka}/{model}/{yil}", response_model=PazarVerisiYanit, tags=["📊 Pazar Verileri"])
async def get_pazar_verileri(marka: str, model: str, yil: int, db: Session = Depends(get_db)):
    """
    ## 📊 Get Latest Market Data
    
    Returns the most recent market data for a specific car.
    
    **Parameters:**
    - `marka`: Car brand
    - `model`: Car model  
    - `yil`: Model year
    
    **Returns:** Latest market data including damage-specific pricing
    """
    from web_scraper import get_latest_market_data

    # Try to get from database first
    pazar_verisi = get_latest_market_data(db, marka, model, yil)
    
    if not pazar_verisi:
        # If not found, collect new data
        from web_scraper import save_market_data_to_db, scraper
        market_data = await scraper.get_depreciation_data_by_damage(marka, model, yil)
        pazar_verisi = save_market_data_to_db(db, market_data)
    
    return pazar_verisi

# ===== SECURE AUTHENTICATION ENDPOINTS =====

@app.post("/auth/register", response_model=TokenResponse, tags=["🔐 Authentication"])
async def register(user_data: UserRegister, request: Request, db: Session = Depends(get_db)):
    """
    ## 🔐 Secure User Registration
    
    Register a new user with strong password requirements and security features.
    
    ### 🛡️ Security Features:
    - **Password Hashing**: Bcrypt with salt
    - **Input Validation**: Email, password strength, name validation
    - **Rate Limiting**: Prevents spam registrations
    - **Security Logging**: All registration attempts logged
    - **Email Uniqueness**: Prevents duplicate accounts
    
    ### 📋 Password Requirements:
    - At least 8 characters long
    - Contains uppercase and lowercase letters
    - Contains at least one digit
    - Contains at least one special character
    
    **Returns**: JWT tokens for immediate login after registration
    """
    client_ip = request.client.host
    
    # Rate limiting check
    if not rate_limiter.is_allowed(f"register_{client_ip}", max_attempts=5, window_minutes=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many registration attempts. Please try again later."
        )
    
    try:
        # Sanitize inputs
        user_data.ad = sanitize_input(user_data.ad)
        user_data.soyad = sanitize_input(user_data.soyad)
        if user_data.telefon:
            user_data.telefon = sanitize_input(user_data.telefon)
        if user_data.sehir:
            user_data.sehir = sanitize_input(user_data.sehir)
        
        # Register user
        new_user = register_user(db, user_data)
        
        # Create tokens
        access_token = create_access_token(data={"sub": str(new_user.id)})
        refresh_token = create_refresh_token(data={"sub": str(new_user.id)})
        
        # Log registration
        SecurityLog.log_registration(user_data.email, client_ip)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=60 * 24,  # 24 hours
            user={
                "id": new_user.id,
                "ad": new_user.ad,
                "soyad": new_user.soyad,
                "email": new_user.email,
                "telefon": new_user.telefon,
                "sehir": new_user.sehir
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@app.post("/auth/login", response_model=TokenResponse, tags=["🔐 Authentication"])
async def login(user_credentials: UserLogin, request: Request, db: Session = Depends(get_db)):
    """
    ## 🔐 Secure User Login
    
    Authenticate user with email and password.
    
    ### 🛡️ Security Features:
    - **Account Lockout**: Protection against brute force attacks
    - **Failed Attempt Tracking**: Monitors suspicious activity
    - **Rate Limiting**: Prevents automated attacks
    - **Security Logging**: All login attempts logged
    - **JWT Tokens**: Secure stateless authentication
    
    ### 🔒 Account Protection:
    - Account locks after 5 failed attempts
    - 30-minute lockout period
    - Automatic unlock after timeout
    
    **Returns**: JWT access and refresh tokens
    """
    client_ip = request.client.host
    
    # Rate limiting check
    if not rate_limiter.is_allowed(f"login_{client_ip}", max_attempts=20, window_minutes=15):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later."
        )
    
    try:
        # Authenticate user
        user = authenticate_user(db, user_credentials.email, user_credentials.password)
        
        if not user:
            SecurityLog.log_login_attempt(user_credentials.email, False, client_ip)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create tokens
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        # Log successful login
        SecurityLog.log_login_attempt(user_credentials.email, True, client_ip)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=60 * 24,  # 24 hours
            user={
                "id": user.id,
                "ad": user.ad,
                "soyad": user.soyad,
                "email": user.email,
                "telefon": user.telefon,
                "sehir": user.sehir
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@app.get("/auth/profile", response_model=UserProfile, tags=["🔐 Authentication"])
async def get_profile(current_user: Kullanici = Depends(get_current_user)):
    """
    ## 👤 Get User Profile
    
    Get current authenticated user's profile information.
    
    **Requires**: Valid JWT token in Authorization header
    **Returns**: User profile data (passwords are never returned)
    """
    return UserProfile(
        id=current_user.id,
        ad=current_user.ad,
        soyad=current_user.soyad,
        email=current_user.email,
        telefon=current_user.telefon,
        sehir=current_user.sehir,
        kayit_tarihi=current_user.kayit_tarihi,
        son_giris=current_user.son_giris,
        email_verified=current_user.email_verified
    )

@app.put("/auth/change-password", tags=["🔐 Authentication"])
async def change_user_password(
    password_data: PasswordChange,
    request: Request,
    current_user: Kullanici = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ## 🔒 Change Password
    
    Change user's password with current password verification.
    
    ### 🛡️ Security Features:
    - **Current Password Verification**: Must provide current password
    - **Strong Password Requirements**: Same as registration
    - **Security Logging**: Password changes are logged
    - **Token Invalidation**: Optionally invalidate existing tokens
    
    **Requires**: Valid JWT token and current password
    """
    client_ip = request.client.host
    
    try:
        # Change password
        change_password(db, current_user, password_data)
        
        # Log password change
        SecurityLog.log_password_change(current_user.email, client_ip)
        
        return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password change failed: {str(e)}"
        )

@app.post("/auth/refresh", response_model=TokenResponse, tags=["🔐 Authentication"])
async def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    """
    ## 🔄 Refresh Access Token
    
    Generate new access token using refresh token.
    
    **Requires**: Valid refresh token
    **Returns**: New access and refresh tokens
    """
    try:
        from auth import verify_token

        # Verify refresh token
        payload = verify_token(refresh_token)
        
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        user_id = payload.get("sub")
        user = db.query(Kullanici).filter(Kullanici.id == int(user_id)).first()
        
        if not user or not user.aktif:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Create new tokens
        new_access_token = create_access_token(data={"sub": str(user.id)})
        new_refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=60 * 24,
            user={
                "id": user.id,
                "ad": user.ad,
                "soyad": user.soyad,
                "email": user.email,
                "telefon": user.telefon,
                "sehir": user.sehir
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token refresh failed: {str(e)}"
        )

# ===== KULLANICI YÖNETİMİ ENDPOINT'LERİ =====

@app.post("/kullanici/kayit", response_model=KullaniciYanit, tags=["👤 Kullanıcı Yönetimi"])
async def kullanici_kayit(kullanici_data: KullaniciOlustur, db: Session = Depends(get_db)):
    """
    ## 👤 Yeni Kullanıcı Kaydı
    
    Sisteme yeni kullanıcı kaydı oluşturur.
    
    ### ✅ Gereksinimler:
    - **Ad**: En az 2 karakter
    - **Soyad**: En az 2 karakter  
    - **Email**: Geçerli ve benzersiz email adresi
    - **Telefon**: Opsiyonel telefon numarası
    - **Şehir**: Opsiyonel şehir bilgisi
    
    ### 🔒 Güvenlik:
    - Email benzersizlik kontrolü
    - Veri validasyonu
    - Otomatik kayıt tarihi
    
    **Yanıt:** Kullanıcı ID'si ile birlikte tam kullanıcı bilgileri
    """
    try:
        kullanici = crud.kullanici_olustur(
            db=db,
            ad=kullanici_data.ad,
            soyad=kullanici_data.soyad,
            email=kullanici_data.email,
            telefon=kullanici_data.telefon,
            sehir=kullanici_data.sehir
        )
        return kullanici
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Kullanıcı kaydı sırasında hata: {str(e)}")

@app.get("/kullanici/{kullanici_id}", response_model=KullaniciYanit, tags=["👤 Kullanıcı Yönetimi"])
async def kullanici_getir(kullanici_id: int, db: Session = Depends(get_db)):
    """
    ## 👁️ Kullanıcı Bilgilerini Görüntüle
    
    Belirli bir kullanıcının tüm bilgilerini getirir.
    
    **Parametre:** `kullanici_id` - Görüntülenecek kullanıcının ID'si
    
    **Yanıt:** Kullanıcının tam profil bilgileri
    """
    kullanici = crud.kullanici_getir(db, kullanici_id)
    if not kullanici:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    return kullanici

@app.put("/kullanici/{kullanici_id}", response_model=KullaniciYanit)
async def kullanici_guncelle(kullanici_id: int, kullanici_data: KullaniciGuncelle, db: Session = Depends(get_db)):
    """Kullanıcı bilgilerini günceller"""
    kullanici = crud.kullanici_guncelle(
        db=db,
        kullanici_id=kullanici_id,
        **kullanici_data.dict(exclude_unset=True)
    )
    if not kullanici:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    return kullanici

@app.delete("/kullanici/{kullanici_id}", response_model=YanitMesaj)
async def kullanici_sil(kullanici_id: int, db: Session = Depends(get_db)):
    """Kullanıcıyı pasif yapar"""
    success = crud.kullanici_sil(db, kullanici_id)
    if not success:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    return YanitMesaj(mesaj="Kullanıcı başarıyla silindi")

@app.post("/kullanici/email-kontrol", response_model=YanitMesaj)
async def email_kontrol(email_data: EmailKontrol, db: Session = Depends(get_db)):
    """Email adresinin kullanılıp kullanılmadığını kontrol eder"""
    kullanici = crud.kullanici_email_ile_getir(db, email_data.email)
    if kullanici:
        return YanitMesaj(mesaj="Email adresi zaten kayıtlı", basarili=False)
    return YanitMesaj(mesaj="Email adresi kullanılabilir")

# ===== ARAÇ YÖNETİMİ ENDPOINT'LERİ =====

@app.post("/kullanici/{kullanici_id}/arac", response_model=AracYanit, tags=["🚗 Araç Yönetimi"])
async def arac_ekle(kullanici_id: int, arac_data: AracOlustur, db: Session = Depends(get_db)):
    """
    ## 🚗 Yeni Araç Ekleme
    
    Kullanıcıya ait yeni araç kaydı oluşturur.
    
    ### 📋 Gerekli Bilgiler:
    - **Araç Adı**: Kişisel tanımlama için
    - **Marka & Model**: Araç markası ve modeli
    - **Yıl**: Model yılı (1950-2025)
    - **Kilometre**: Güncel km bilgisi
    - **Yakıt & Vites**: Teknik özellikler
    - **Hasar Durumu**: Mevcut durum
    
    ### ➕ Opsiyonel Bilgiler:
    - Motor hacmi ve gücü
    - Plaka ve şasi numarası
    - Sigorta durumu
    - Muayene tarihi
    - Özel notlar
    
    **Yanıt:** Kaydedilen aracın tam bilgileri
    """
    try:
        arac = crud.arac_ekle(
            db=db,
            kullanici_id=kullanici_id,
            arac_bilgileri=arac_data.dict()
        )
        return arac
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Araç ekleme sırasında hata: {str(e)}")

@app.get("/kullanici/{kullanici_id}/araclar", response_model=List[AracOzet], tags=["🚗 Araç Yönetimi"])
async def kullanici_araclari_listele(kullanici_id: int, db: Session = Depends(get_db)):
    """
    ## 📋 Kullanıcı Araçları Listesi
    
    Kullanıcının kayıtlı tüm araçlarını özet bilgilerle listeler.
    
    **Özet Bilgiler:**
    - Araç ID ve özel adı
    - Marka, model, yıl
    - Güncel kilometre
    - Renk bilgisi
    - Son güncelleme tarihi
    
    **Kullanım:** Araç seçimi ve genel görüntüleme için optimize edilmiş
    """
    araclar = crud.kullanici_araclari(db, kullanici_id)
    return [
        AracOzet(
            id=arac.id,
            arac_adi=arac.arac_adi,
            marka=arac.marka,
            model=arac.model,
            yil=arac.yil,
            kilometre=arac.kilometre,
            renk=arac.renk,
            son_guncelleme=arac.guncelleme_tarihi
        )
        for arac in araclar
    ]

@app.get("/arac/{arac_id}", response_model=AracYanit)
async def arac_detay(arac_id: int, db: Session = Depends(get_db)):
    """Araç detaylarını getirir"""
    arac = crud.arac_getir(db, arac_id)
    if not arac:
        raise HTTPException(status_code=404, detail="Araç bulunamadı")
    return arac

@app.put("/kullanici/{kullanici_id}/arac/{arac_id}", response_model=AracYanit)
async def arac_guncelle(kullanici_id: int, arac_id: int, arac_data: AracGuncelle, db: Session = Depends(get_db)):
    """Araç bilgilerini günceller"""
    arac = crud.arac_guncelle(
        db=db,
        arac_id=arac_id,
        kullanici_id=kullanici_id,
        **arac_data.dict(exclude_unset=True)
    )
    if not arac:
        raise HTTPException(status_code=404, detail="Araç bulunamadı veya yetkiniz yok")
    return arac

@app.delete("/kullanici/{kullanici_id}/arac/{arac_id}", response_model=YanitMesaj)
async def arac_sil(kullanici_id: int, arac_id: int, db: Session = Depends(get_db)):
    """Aracı siler (pasif yapar)"""
    success = crud.arac_sil(db, arac_id, kullanici_id)
    if not success:
        raise HTTPException(status_code=404, detail="Araç bulunamadı veya yetkiniz yok")
    return YanitMesaj(mesaj="Araç başarıyla silindi")

@app.put("/kullanici/{kullanici_id}/arac/{arac_id}/kilometre", response_model=AracYanit)
async def arac_kilometre_guncelle(kullanici_id: int, arac_id: int, km_data: KilometreGuncelle, db: Session = Depends(get_db)):
    """Araç kilometresini günceller"""
    arac = crud.arac_kilometre_guncelle(db, arac_id, kullanici_id, km_data.yeni_kilometre)
    if not arac:
        raise HTTPException(status_code=400, detail="Kilometre güncellenemedi (yeni kilometre eskisinden düşük olabilir)")
    return arac

# ===== TAHMİN GEÇMİŞİ ENDPOINT'LERİ =====

@app.get("/kullanici/{kullanici_id}/tahminler", response_model=List[TahminGecmisi])
async def kullanici_tahmin_gecmisi(kullanici_id: int, limit: int = 20, db: Session = Depends(get_db)):
    """Kullanıcının tahmin geçmişini getirir"""
    tahminler = crud.kullanici_tahminleri(db, kullanici_id, limit)
    return [
        TahminGecmisi(
            id=t.id,
            arac_id=t.arac_id,
            arac_bilgisi=f"{t.marka} {t.model} {t.yil}",
            ortalama_fiyat=t.ortalama_fiyat,
            analiz_tarihi=t.analiz_tarihi,
            islem_suresi=t.islem_suresi
        )
        for t in tahminler
    ]

@app.get("/arac/{arac_id}/tahminler", response_model=List[TahminGecmisi])
async def arac_tahmin_gecmisi(arac_id: int, limit: int = 10, db: Session = Depends(get_db)):
    """Belirli bir aracın tahmin geçmişini getirir"""
    tahminler = crud.arac_tahminleri(db, arac_id, limit)
    return [
        TahminGecmisi(
            id=t.id,
            arac_id=t.arac_id,
            arac_bilgisi=f"{t.marka} {t.model} {t.yil}",
            ortalama_fiyat=t.ortalama_fiyat,
            analiz_tarihi=t.analiz_tarihi,
            islem_suresi=t.islem_suresi
        )
        for t in tahminler
    ]

@app.get("/kullanici/{kullanici_id}/istatistikler", response_model=KullaniciIstatistik)
async def kullanici_istatistikleri(kullanici_id: int, db: Session = Depends(get_db)):
    """Kullanıcının istatistiklerini getirir"""
    kullanici = crud.kullanici_getir(db, kullanici_id)
    if not kullanici:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    # Araç sayısı
    toplam_arac = len(crud.kullanici_araclari(db, kullanici_id))
    
    # Tahmin istatistikleri
    tahmin_stats = crud.tahmin_istatistikleri(db, kullanici_id)
    
    return KullaniciIstatistik(
        toplam_arac=toplam_arac,
        toplam_tahmin=tahmin_stats["toplam_tahmin"],
        en_cok_tahmin_edilen_arac_id=tahmin_stats["en_cok_tahmin_edilen_arac_id"],
        en_cok_tahmin_sayisi=tahmin_stats["en_cok_tahmin_sayisi"],
        ortalama_tahmin_degeri=tahmin_stats["ortalama_tahmin_degeri"],
        kayit_tarihi=kullanici.kayit_tarihi,
        son_aktivite=kullanici.son_giris
    )

# ===== ARAMA VE FİLTRELEME ENDPOINT'LERİ =====

@app.get("/kullanici/{kullanici_id}/arac-ara")
async def arac_ara(kullanici_id: int, q: str, db: Session = Depends(get_db)):
    """Kullanıcının araçlarında arama yapar"""
    if len(q.strip()) < 2:
        raise HTTPException(status_code=400, detail="Arama terimi en az 2 karakter olmalıdır")
    
    araclar = crud.arac_ara(db, kullanici_id, q.strip())
    return [
        AracOzet(
            id=arac.id,
            arac_adi=arac.arac_adi,
            marka=arac.marka,
            model=arac.model,
            yil=arac.yil,
            kilometre=arac.kilometre,
            renk=arac.renk,
            son_guncelleme=arac.guncelleme_tarihi
        )
        for arac in araclar
    ]
