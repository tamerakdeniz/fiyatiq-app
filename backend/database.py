"""
Veritabanı modelleri
SQLAlchemy ORM kullanarak SQLite veritabanı tabloları
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy import create_engine
from datetime import datetime
import os

Base = declarative_base()

class Kullanici(Base):
    """Sisteme kayıtlı kullanıcıları saklayan tablo"""
    __tablename__ = "kullanicilar"
    
    id = Column(Integer, primary_key=True, index=True)
    ad = Column(String(50), nullable=False)
    soyad = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    telefon = Column(String(20), nullable=True)
    sehir = Column(String(30), nullable=True)
    kayit_tarihi = Column(DateTime, default=datetime.utcnow)
    son_giris = Column(DateTime, nullable=True)
    aktif = Column(Boolean, default=True)
    
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

# Veritabanı bağlantısı ve session yönetimi
DATABASE_URL = "sqlite:///./arac_fiyat_tahmin.db"

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
