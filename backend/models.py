"""
Pydantic Modelleri
API request/response için veri validasyonu
FastAPI Swagger UI'da otomatik dokümantasyon oluşturur
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime

# === KULLANICI MODELLERİ ===

class KullaniciOlustur(BaseModel):
    """
    ## 👤 Yeni Kullanıcı Kaydı
    
    Sisteme yeni kullanıcı eklemek için gerekli bilgiler
    """
    ad: str = Field(..., min_length=2, max_length=50, description="Kullanıcının adı", example="Ahmet")
    soyad: str = Field(..., min_length=2, max_length=50, description="Kullanıcının soyadı", example="Yılmaz") 
    email: str = Field(..., description="Email adresi", example="ahmet.yilmaz@email.com")
    telefon: Optional[str] = Field(None, max_length=20, description="Telefon numarası", example="0532 123 4567")
    sehir: Optional[str] = Field(None, max_length=30, description="Şehir", example="İstanbul")
    
    class Config:
        schema_extra = {
            "example": {
                "ad": "Ahmet",
                "soyad": "Yılmaz",
                "email": "ahmet.yilmaz@email.com",
                "telefon": "0532 123 4567",
                "sehir": "İstanbul"
            }
        }

class KullaniciGuncelle(BaseModel):
    ad: Optional[str] = Field(None, min_length=2, max_length=50)
    soyad: Optional[str] = Field(None, min_length=2, max_length=50)
    telefon: Optional[str] = Field(None, max_length=20)
    sehir: Optional[str] = Field(None, max_length=30)

class KullaniciYanit(BaseModel):
    id: int
    ad: str
    soyad: str
    email: str
    telefon: Optional[str]
    sehir: Optional[str]
    kayit_tarihi: datetime
    son_giris: Optional[datetime]
    aktif: bool
    
    class Config:
        from_attributes = True

# === ARAÇ MODELLERİ ===

class AracOlustur(BaseModel):
    """
    ## 🚗 Yeni Araç Kaydı
    
    Kullanıcının sistemine araç eklemesi için gerekli tüm bilgiler
    """
    arac_adi: str = Field(..., min_length=1, max_length=100, description="Aracın özel adı", example="Benim Arabam")
    marka: str = Field(..., min_length=1, max_length=50, description="Araç markası", example="Toyota")
    model: str = Field(..., min_length=1, max_length=100, description="Araç modeli", example="Corolla")
    yil: int = Field(..., ge=1950, le=2025, description="Model yılı", example=2020)
    kilometre: int = Field(..., ge=0, description="Kilometre", example=50000)
    yakit_tipi: str = Field(..., description="Yakıt türü", example="Benzin")
    vites_tipi: str = Field(..., description="Vites türü", example="Otomatik")
    hasar_durumu: str = Field(..., description="Hasar durumu", example="Hasarsız")
    renk: str = Field(..., max_length=30, description="Araç rengi", example="Beyaz")
    motor_hacmi: Optional[float] = Field(None, ge=0.5, le=10.0, description="Motor hacmi (Litre)", example=1.6)
    motor_gucu: Optional[int] = Field(None, ge=50, le=2000, description="Motor gücü (HP)", example=130)
    notlar: Optional[str] = Field(None, max_length=500, description="Ek notlar", example="Harika durumda araç")
    
    class Config:
        schema_extra = {
            "example": {
                "arac_adi": "Benim Corollam",
                "marka": "Toyota",
                "model": "Corolla",
                "yil": 2020,
                "kilometre": 50000,
                "yakit_tipi": "Benzin",
                "vites_tipi": "Otomatik", 
                "hasar_durumu": "Hasarsız",
                "renk": "Beyaz",
                "motor_hacmi": 1.6,
                "motor_gucu": 130,
                "notlar": "Çok temiz araç"
            }
        }

class AracGuncelle(BaseModel):
    arac_adi: Optional[str] = Field(None, min_length=1, max_length=100)
    kilometre: Optional[int] = Field(None, ge=0)
    hasar_durumu: Optional[str] = None
    notlar: Optional[str] = Field(None, max_length=500)

class AracYanit(BaseModel):
    id: int
    kullanici_id: int
    arac_adi: str
    marka: str
    model: str
    yil: int
    kilometre: int
    yakit_tipi: str
    vites_tipi: str
    hasar_durumu: str
    renk: str
    motor_hacmi: Optional[float]
    motor_gucu: Optional[int]
    kayit_tarihi: datetime
    guncelleme_tarihi: datetime
    aktif: bool
    notlar: Optional[str]
    
    class Config:
        from_attributes = True

class AracOzet(BaseModel):
    """Araç listesi için özet bilgi"""
    id: int
    arac_adi: str
    marka: str
    model: str
    yil: int
    kilometre: int
    renk: str
    son_guncelleme: datetime
    
    class Config:
        from_attributes = True

# === TAHMİN MODELLERİ ===

class TahminGecmisi(BaseModel):
    id: int
    arac_id: Optional[int]
    arac_bilgisi: str  # "Marka Model Yıl" formatında
    ortalama_fiyat: int
    analiz_tarihi: datetime
    islem_suresi: Optional[float]
    
    class Config:
        from_attributes = True

class KullaniciIstatistik(BaseModel):
    toplam_arac: int
    toplam_tahmin: int
    en_cok_tahmin_edilen_arac_id: Optional[int]
    en_cok_tahmin_sayisi: int
    ortalama_tahmin_degeri: float
    kayit_tarihi: datetime
    son_aktivite: Optional[datetime]

# === GENEL MODELLERİ ===

class YanitMesaj(BaseModel):
    mesaj: str
    basarili: bool = True
    veri: Optional[dict] = None

class SayfalamaBilgisi(BaseModel):
    sayfa: int = Field(1, ge=1, description="Sayfa numarası")
    sayfa_boyutu: int = Field(10, ge=1, le=100, description="Sayfa başına kayıt sayısı")

class SayfaliYanit(BaseModel):
    veriler: List[dict]
    toplam_kayit: int
    sayfa: int
    sayfa_boyutu: int
    toplam_sayfa: int
    
    @classmethod
    def olustur(cls, veriler: List[dict], toplam_kayit: int, sayfa: int, sayfa_boyutu: int):
        import math
        return cls(
            veriler=veriler,
            toplam_kayit=toplam_kayit,
            sayfa=sayfa,
            sayfa_boyutu=sayfa_boyutu,
            toplam_sayfa=math.ceil(toplam_kayit / sayfa_boyutu)
        )

# === VALİDASYON MODELLERİ ===

class EmailKontrol(BaseModel):
    email: str
    
class KilometreGuncelle(BaseModel):
    yeni_kilometre: int = Field(..., ge=0, description="Yeni kilometre değeri")
