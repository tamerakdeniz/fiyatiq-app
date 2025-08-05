"""
Veritabanı modelleri
SQLAlchemy ORM kullanarak SQLite veritabanı tabloları
"""

import os
from datetime import datetime

from sqlalchemy import (Boolean, Column, DateTime, Float, ForeignKey, Integer,
                        String, Text, create_engine)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker

Base = declarative_base()

class Kullanici(Base):
    """Sisteme kayıtlı kullanıcıları saklayan tablo"""
    __tablename__ = "kullanicilar"
    
    id = Column(Integer, primary_key=True, index=True)
    ad = Column(String(50), nullable=False)
    soyad = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)  # Hashed password
    telefon = Column(String(20), nullable=True)
    sehir = Column(String(30), nullable=True)
    kayit_tarihi = Column(DateTime, default=datetime.utcnow)
    son_giris = Column(DateTime, nullable=True)
    aktif = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)  # Email verification
    failed_login_attempts = Column(Integer, default=0)  # Security feature
    account_locked_until = Column(DateTime, nullable=True)  # Account lockout
    
    # İlişkiler
    araclar = relationship("KullaniciAraci", back_populates="kullanici")
    tahminler = relationship("AracTahmini", back_populates="kullanici")
    
    def __repr__(self):
        return f"<Kullanici(id={self.id}, ad='{self.ad}', soyad='{self.soyad}', email='{self.email}')>"

class KullaniciAraci(Base):
    """Kullanıcıların sisteme kaydettiği araç bilgilerini saklayan tablo"""
    __tablename__ = "kullanici_araclari"
    
    id = Column(Integer, primary_key=True, index=True)
    kullanici_id = Column(Integer, ForeignKey("kullanicilar.id"), nullable=False)
    
    # Araç bilgileri
    arac_adi = Column(String(100), nullable=False)  # Kullanıcının verdiği özel isim
    marka = Column(String(50), nullable=False)
    model = Column(String(100), nullable=False)
    yil = Column(Integer, nullable=False)
    kilometre = Column(Integer, nullable=False)
    yakit_tipi = Column(String(20), nullable=False)
    vites_tipi = Column(String(20), nullable=False)
    hasar_durumu = Column(String(30), nullable=False)
    renk = Column(String(30), nullable=False)
    motor_hacmi = Column(Float, nullable=True)
    motor_gucu = Column(Integer, nullable=True)
    
    # Meta bilgiler
    kayit_tarihi = Column(DateTime, default=datetime.utcnow)
    guncelleme_tarihi = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    aktif = Column(Boolean, default=True)
    notlar = Column(Text, nullable=True)
    
    # İlişkiler
    kullanici = relationship("Kullanici", back_populates="araclar")
    
    def __repr__(self):
        return f"<KullaniciAraci(id={self.id}, arac_adi='{self.arac_adi}', marka='{self.marka}')>"

class AracTahmini(Base):
    """Yapılan araç fiyat tahminlerini saklayan tablo"""
    __tablename__ = "arac_tahminleri"
    
    id = Column(Integer, primary_key=True, index=True)
    kullanici_id = Column(Integer, ForeignKey("kullanicilar.id"), nullable=True)  # Misafir kullanıcılar için nullable
    arac_id = Column(Integer, ForeignKey("kullanici_araclari.id"), nullable=True)  # Kayıtlı araç için
    
    # Araç bilgileri
    marka = Column(String(50), nullable=False)
    model = Column(String(100), nullable=False)
    yil = Column(Integer, nullable=False)
    kilometre = Column(Integer, nullable=False)
    yakit_tipi = Column(String(20), nullable=False)
    vites_tipi = Column(String(20), nullable=False)
    hasar_durumu = Column(String(30), nullable=False)
    renk = Column(String(30), nullable=False)
    il = Column(String(30), nullable=False)
    motor_hacmi = Column(Float, nullable=True)
    motor_gucu = Column(Integer, nullable=True)
    ekstra_bilgiler = Column(Text, nullable=True)
    
    # Tahmin sonuçları
    tahmini_fiyat_min = Column(Integer, nullable=False)
    tahmini_fiyat_max = Column(Integer, nullable=False)
    ortalama_fiyat = Column(Integer, nullable=False)
    rapor = Column(Text, nullable=False)
    pazar_analizi = Column(Text, nullable=True)
    
    # Meta bilgiler
    analiz_tarihi = Column(DateTime, default=datetime.utcnow)
    ip_adresi = Column(String(45), nullable=True)  # IPv6 için 45 karakter
    islem_suresi = Column(Float, nullable=True)  # Saniye cinsinden
    gemini_token_kullanimi = Column(Integer, nullable=True)
    
    # İlişkiler
    kullanici = relationship("Kullanici", back_populates="tahminler")

class ApiKullanimi(Base):
    """API kullanım istatistiklerini tutan tablo"""
    __tablename__ = "api_kullanimi"
    
    id = Column(Integer, primary_key=True, index=True)
    endpoint = Column(String(100), nullable=False)
    method = Column(String(10), nullable=False)  # GET, POST, etc.
    status_code = Column(Integer, nullable=False)
    response_time = Column(Float, nullable=False)  # milisaniye
    ip_adresi = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    hata_mesaji = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<ApiKullanimi(id={self.id}, endpoint='{self.endpoint}', status={self.status_code})>"

class PopulerAraclar(Base):
    """En çok aranan araçları tutan özet tablo"""
    __tablename__ = "populer_araclar"
    
    id = Column(Integer, primary_key=True, index=True)
    marka = Column(String(50), nullable=False)
    model = Column(String(100), nullable=False)
    arama_sayisi = Column(Integer, default=1)
    son_arama = Column(DateTime, default=datetime.utcnow)
    ortalama_fiyat = Column(Integer, nullable=True)
    
    def __repr__(self):
        return f"<PopulerAraclar(marka='{self.marka}', model='{self.model}', arama_sayisi={self.arama_sayisi})>"

# New tables for car damage and depreciation assessment
class AracParcasi(Base):
    """Car parts that can affect depreciation"""
    __tablename__ = "arac_parcalari"
    
    id = Column(Integer, primary_key=True, index=True)
    parca_adi = Column(String(100), nullable=False)  # Door, Engine, Transmission, etc.
    kategori = Column(String(50), nullable=False)    # Body, Engine, Interior, etc.
    ortalama_maliyet = Column(Integer, nullable=True)  # Average replacement cost
    etki_faktoru = Column(Float, default=1.0)        # Impact factor on depreciation (0.1 to 1.0)
    aktif = Column(Boolean, default=True)
    
    def __repr__(self):
        return f"<AracParcasi(parca_adi='{self.parca_adi}', kategori='{self.kategori}')>"

class HasarTipi(Base):
    """Types of damage that can occur to car parts"""
    __tablename__ = "hasar_tipleri"
    
    id = Column(Integer, primary_key=True, index=True)
    hasar_adi = Column(String(100), nullable=False)   # Scratched, Dented, Replaced, etc.
    aciklama = Column(Text, nullable=True)
    deger_azalma_orani = Column(Float, default=0.1)   # Percentage decrease in value (0.05 to 0.5)
    aktif = Column(Boolean, default=True)
    
    def __repr__(self):
        return f"<HasarTipi(hasar_adi='{self.hasar_adi}', deger_azalma_orani={self.deger_azalma_orani})>"

class AracHasarDetayi(Base):
    """Detailed damage assessment for specific vehicle evaluations"""
    __tablename__ = "arac_hasar_detaylari"
    
    id = Column(Integer, primary_key=True, index=True)
    tahmin_id = Column(Integer, ForeignKey("arac_tahminleri.id"), nullable=False)
    parca_id = Column(Integer, ForeignKey("arac_parcalari.id"), nullable=False)
    hasar_tipi_id = Column(Integer, ForeignKey("hasar_tipleri.id"), nullable=False)
    
    # Additional details
    hasar_seviyesi = Column(String(20), default="Orta")  # Hafif, Orta, Ağır
    tahmini_maliyet = Column(Integer, nullable=True)      # Estimated repair cost
    deger_etkisi = Column(Integer, nullable=True)         # Direct impact on car value
    aciklama = Column(Text, nullable=True)               # Additional notes
    
    kayit_tarihi = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    tahmin = relationship("AracTahmini", backref="hasar_detaylari")
    parca = relationship("AracParcasi")
    hasar_tipi = relationship("HasarTipi")
    
    def __repr__(self):
        return f"<AracHasarDetayi(tahmin_id={self.tahmin_id}, parca='{self.parca.parca_adi if self.parca else 'N/A'}')>"

class PazarVerisi(Base):
    """Market data collected from web scraping for depreciation calculations"""
    __tablename__ = "pazar_verileri"
    
    id = Column(Integer, primary_key=True, index=True)
    kaynak = Column(String(100), nullable=False)          # Source: sahibinden.com, arabam.com, etc.
    marka = Column(String(50), nullable=False)
    model = Column(String(100), nullable=False)
    yil = Column(Integer, nullable=False)
    
    # Market data
    ortalama_fiyat = Column(Integer, nullable=True)
    minimum_fiyat = Column(Integer, nullable=True)
    maksimum_fiyat = Column(Integer, nullable=True)
    ilan_sayisi = Column(Integer, default=0)
    
    # Damage-specific data
    hasarsiz_ortalama = Column(Integer, nullable=True)
    boyali_ortalama = Column(Integer, nullable=True)
    degisen_ortalama = Column(Integer, nullable=True)
    hasarli_ortalama = Column(Integer, nullable=True)
    
    # Meta
    veri_tarihi = Column(DateTime, default=datetime.utcnow)
    guncelleme_tarihi = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    aktif = Column(Boolean, default=True)
    
    def __repr__(self):
        return f"<PazarVerisi(marka='{self.marka}', model='{self.model}', kaynak='{self.kaynak}')>"

# Veritabanı bağlantısı ve session yönetimi
DATABASE_URL = "sqlite:///./fiyatiq.db"

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False},
    echo=False  # SQL sorgularını görmek için True yapabilirsiniz
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_tables():
    """Veritabanı tablolarını oluşturur"""
    Base.metadata.create_all(bind=engine)

def get_db():
    """Database session dependency for FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
