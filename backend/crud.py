"""
CRUD İşlemleri
Kullanıcı ve Araç yönetimi için veritabanı işlemleri
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from database import Kullanici, KullaniciAraci, AracTahmini
from datetime import datetime
from typing import List, Optional

# === KULLANICI CRUD İŞLEMLERİ ===

def kullanici_olustur(db: Session, ad: str, soyad: str, email: str, telefon: str = None, sehir: str = None):
    """Yeni kullanıcı oluşturur"""
    # Email kontrolü
    mevcut_kullanici = db.query(Kullanici).filter(Kullanici.email == email).first()
    if mevcut_kullanici:
        raise ValueError("Bu email adresi zaten kayıtlı!")
    
    kullanici = Kullanici(
        ad=ad,
        soyad=soyad,
        email=email,
        telefon=telefon,
        sehir=sehir,
        kayit_tarihi=datetime.utcnow(),
        aktif=True
    )
    
    db.add(kullanici)
    db.commit()
    db.refresh(kullanici)
    return kullanici

def kullanici_getir(db: Session, kullanici_id: int):
    """ID'ye göre kullanıcı getirir"""
    return db.query(Kullanici).filter(Kullanici.id == kullanici_id).first()

def kullanici_email_ile_getir(db: Session, email: str):
    """Email'e göre kullanıcı getirir"""
    return db.query(Kullanici).filter(Kullanici.email == email).first()

def kullanici_guncelle(db: Session, kullanici_id: int, **kwargs):
    """Kullanıcı bilgilerini günceller"""
    kullanici = db.query(Kullanici).filter(Kullanici.id == kullanici_id).first()
    if not kullanici:
        return None
    
    for key, value in kwargs.items():
        if hasattr(kullanici, key) and value is not None:
            setattr(kullanici, key, value)
    
    kullanici.son_giris = datetime.utcnow()
    db.commit()
    db.refresh(kullanici)
    return kullanici

def kullanici_sil(db: Session, kullanici_id: int):
    """Kullanıcıyı pasif yapar (fiziksel silme yerine)"""
    kullanici = db.query(Kullanici).filter(Kullanici.id == kullanici_id).first()
    if kullanici:
        kullanici.aktif = False
        db.commit()
        return True
    return False

def kullanici_listesi(db: Session, limit: int = 100, offset: int = 0, aktif_mi: bool = True):
    """Kullanıcı listesini getirir"""
    return db.query(Kullanici).filter(Kullanici.aktif == aktif_mi).offset(offset).limit(limit).all()

# === ARAÇ CRUD İŞLEMLERİ ===

def arac_ekle(db: Session, kullanici_id: int, arac_bilgileri: dict):
    """Kullanıcıya ait yeni araç ekler"""
    kullanici = db.query(Kullanici).filter(Kullanici.id == kullanici_id).first()
    if not kullanici:
        raise ValueError("Kullanıcı bulunamadı!")
    
    arac = KullaniciAraci(
        kullanici_id=kullanici_id,
        arac_adi=arac_bilgileri.get("arac_adi"),
        marka=arac_bilgileri.get("marka"),
        model=arac_bilgileri.get("model"),
        yil=arac_bilgileri.get("yil"),
        kilometre=arac_bilgileri.get("kilometre"),
        yakit_tipi=arac_bilgileri.get("yakit_tipi"),
        vites_tipi=arac_bilgileri.get("vites_tipi"),
        hasar_durumu=arac_bilgileri.get("hasar_durumu"),
        renk=arac_bilgileri.get("renk"),
        motor_hacmi=arac_bilgileri.get("motor_hacmi"),
        motor_gucu=arac_bilgileri.get("motor_gucu"),
        notlar=arac_bilgileri.get("notlar"),
        kayit_tarihi=datetime.utcnow(),
        aktif=True
    )
    
    db.add(arac)
    db.commit()
    db.refresh(arac)
    return arac

def arac_getir(db: Session, arac_id: int):
    """ID'ye göre araç getirir"""
    return db.query(KullaniciAraci).filter(KullaniciAraci.id == arac_id).first()

def kullanici_araclari(db: Session, kullanici_id: int, aktif_mi: bool = True):
    """Kullanıcının tüm araçlarını getirir"""
    return db.query(KullaniciAraci).filter(
        and_(KullaniciAraci.kullanici_id == kullanici_id, KullaniciAraci.aktif == aktif_mi)
    ).all()

def arac_guncelle(db: Session, arac_id: int, kullanici_id: int, **kwargs):
    """Araç bilgilerini günceller"""
    arac = db.query(KullaniciAraci).filter(
        and_(KullaniciAraci.id == arac_id, KullaniciAraci.kullanici_id == kullanici_id)
    ).first()
    
    if not arac:
        return None
    
    for key, value in kwargs.items():
        if hasattr(arac, key) and value is not None:
            setattr(arac, key, value)
    
    arac.guncelleme_tarihi = datetime.utcnow()
    db.commit()
    db.refresh(arac)
    return arac

def arac_sil(db: Session, arac_id: int, kullanici_id: int):
    """Aracı pasif yapar"""
    arac = db.query(KullaniciAraci).filter(
        and_(KullaniciAraci.id == arac_id, KullaniciAraci.kullanici_id == kullanici_id)
    ).first()
    
    if arac:
        arac.aktif = False
        db.commit()
        return True
    return False

def arac_kilometre_guncelle(db: Session, arac_id: int, kullanici_id: int, yeni_kilometre: int):
    """Araç kilometresini günceller"""
    arac = db.query(KullaniciAraci).filter(
        and_(KullaniciAraci.id == arac_id, KullaniciAraci.kullanici_id == kullanici_id)
    ).first()
    
    if arac and yeni_kilometre > arac.kilometre:
        arac.kilometre = yeni_kilometre
        arac.guncelleme_tarihi = datetime.utcnow()
        db.commit()
        db.refresh(arac)
        return arac
    return None

# === TAHMİN CRUD İŞLEMLERİ ===

def kullanici_tahminleri(db: Session, kullanici_id: int, limit: int = 20):
    """Kullanıcının tüm tahminlerini getirir"""
    return db.query(AracTahmini).filter(
        AracTahmini.kullanici_id == kullanici_id
    ).order_by(AracTahmini.analiz_tarihi.desc()).limit(limit).all()

def arac_tahminleri(db: Session, arac_id: int, limit: int = 10):
    """Belirli bir aracın tahmin geçmişini getirir"""
    return db.query(AracTahmini).filter(
        AracTahmini.arac_id == arac_id
    ).order_by(AracTahmini.analiz_tarihi.desc()).limit(limit).all()

def tahmin_istatistikleri(db: Session, kullanici_id: int):
    """Kullanıcının tahmin istatistiklerini getirir"""
    from sqlalchemy import func
    
    # Toplam tahmin sayısı
    toplam_tahmin = db.query(AracTahmini).filter(AracTahmini.kullanici_id == kullanici_id).count()
    
    # En çok tahmin edilen araç
    en_cok_tahmin = db.query(
        AracTahmini.arac_id, 
        func.count(AracTahmini.id).label('tahmin_sayisi')
    ).filter(
        AracTahmini.kullanici_id == kullanici_id
    ).group_by(AracTahmini.arac_id).order_by(func.count(AracTahmini.id).desc()).first()
    
    # Ortalama tahmin değeri
    ortalama_deger = db.query(func.avg(AracTahmini.ortalama_fiyat)).filter(
        AracTahmini.kullanici_id == kullanici_id
    ).scalar()
    
    return {
        "toplam_tahmin": toplam_tahmin,
        "en_cok_tahmin_edilen_arac_id": en_cok_tahmin.arac_id if en_cok_tahmin else None,
        "en_cok_tahmin_sayisi": en_cok_tahmin.tahmin_sayisi if en_cok_tahmin else 0,
        "ortalama_tahmin_degeri": round(ortalama_deger or 0, 2)
    }

# === ARAMA VE FİLTRELEME ===

def arac_ara(db: Session, kullanici_id: int, arama_terimi: str):
    """Kullanıcının araçlarında arama yapar"""
    return db.query(KullaniciAraci).filter(
        and_(
            KullaniciAraci.kullanici_id == kullanici_id,
            KullaniciAraci.aktif == True,
            or_(
                KullaniciAraci.arac_adi.contains(arama_terimi),
                KullaniciAraci.marka.contains(arama_terimi),
                KullaniciAraci.model.contains(arama_terimi)
            )
        )
    ).all()

def marka_model_listesi(db: Session, kullanici_id: int):
    """Kullanıcının kayıtlı araçlarının marka-model listesini getirir"""
    from sqlalchemy import distinct
    
    return db.query(
        distinct(KullaniciAraci.marka), 
        distinct(KullaniciAraci.model)
    ).filter(
        and_(KullaniciAraci.kullanici_id == kullanici_id, KullaniciAraci.aktif == True)
    ).all()
