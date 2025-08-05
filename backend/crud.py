"""
CRUD İşlemleri
Kullanıcı ve Araç yönetimi için veritabanı işlemleri
"""

from datetime import datetime
from typing import List, Optional

from database import (AracHasarDetayi, AracParcasi, AracTahmini, HasarTipi,
                      Kullanici, KullaniciAraci, PazarVerisi)
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

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

# === ARAÇ PARÇALARI CRUD İŞLEMLERİ ===

def get_arac_parcalari(db: Session, kategori: Optional[str] = None, aktif_mi: bool = True):
    """Araç parçalarını getirir"""
    query = db.query(AracParcasi).filter(AracParcasi.aktif == aktif_mi)
    
    if kategori:
        query = query.filter(AracParcasi.kategori == kategori)
    
    return query.all()

def get_arac_parcasi(db: Session, parca_id: int):
    """ID'ye göre araç parçası getirir"""
    return db.query(AracParcasi).filter(AracParcasi.id == parca_id).first()

def create_arac_parcasi(db: Session, parca_adi: str, kategori: str, ortalama_maliyet: Optional[int] = None, etki_faktoru: float = 0.05):
    """Yeni araç parçası oluşturur"""
    parca = AracParcasi(
        parca_adi=parca_adi,
        kategori=kategori,
        ortalama_maliyet=ortalama_maliyet,
        etki_faktoru=etki_faktoru,
        aktif=True
    )
    
    db.add(parca)
    db.commit()
    db.refresh(parca)
    return parca

def update_arac_parcasi(db: Session, parca_id: int, **kwargs):
    """Araç parçası bilgilerini günceller"""
    parca = db.query(AracParcasi).filter(AracParcasi.id == parca_id).first()
    if not parca:
        return None
    
    for key, value in kwargs.items():
        if hasattr(parca, key) and value is not None:
            setattr(parca, key, value)
    
    db.commit()
    db.refresh(parca)
    return parca

# === HASAR TİPLERİ CRUD İŞLEMLERİ ===

def get_hasar_tipleri(db: Session, aktif_mi: bool = True):
    """Hasar tiplerini getirir"""
    return db.query(HasarTipi).filter(HasarTipi.aktif == aktif_mi).all()

def get_hasar_tipi(db: Session, hasar_tipi_id: int):
    """ID'ye göre hasar tipi getirir"""
    return db.query(HasarTipi).filter(HasarTipi.id == hasar_tipi_id).first()

def create_hasar_tipi(db: Session, hasar_adi: str, aciklama: Optional[str] = None, deger_azalma_orani: float = 0.1):
    """Yeni hasar tipi oluşturur"""
    hasar_tipi = HasarTipi(
        hasar_adi=hasar_adi,
        aciklama=aciklama,
        deger_azalma_orani=deger_azalma_orani,
        aktif=True
    )
    
    db.add(hasar_tipi)
    db.commit()
    db.refresh(hasar_tipi)
    return hasar_tipi

# === HASAR DETAYLARI CRUD İŞLEMLERİ ===

def create_hasar_detayi(db: Session, tahmin_id: int, parca_id: int, hasar_tipi_id: int, 
                       hasar_seviyesi: str = "Orta", tahmini_maliyet: Optional[int] = None,
                       deger_etkisi: Optional[int] = None, aciklama: Optional[str] = None):
    """Yeni hasar detayı oluşturur"""
    hasar_detayi = AracHasarDetayi(
        tahmin_id=tahmin_id,
        parca_id=parca_id,
        hasar_tipi_id=hasar_tipi_id,
        hasar_seviyesi=hasar_seviyesi,
        tahmini_maliyet=tahmini_maliyet,
        deger_etkisi=deger_etkisi,
        aciklama=aciklama,
        kayit_tarihi=datetime.utcnow()
    )
    
    db.add(hasar_detayi)
    db.commit()
    db.refresh(hasar_detayi)
    return hasar_detayi

def get_tahmin_hasar_detaylari(db: Session, tahmin_id: int):
    """Tahmine ait hasar detaylarını getirir"""
    return db.query(AracHasarDetayi).filter(AracHasarDetayi.tahmin_id == tahmin_id).all()

def delete_hasar_detayi(db: Session, hasar_detayi_id: int):
    """Hasar detayını siler"""
    hasar_detayi = db.query(AracHasarDetayi).filter(AracHasarDetayi.id == hasar_detayi_id).first()
    if hasar_detayi:
        db.delete(hasar_detayi)
        db.commit()
        return True
    return False

# === PAZAR VERİLERİ CRUD İŞLEMLERİ ===

def create_pazar_verisi(db: Session, kaynak: str, marka: str, model: str, yil: int, 
                       ortalama_fiyat: Optional[int] = None, minimum_fiyat: Optional[int] = None,
                       maksimum_fiyat: Optional[int] = None, ilan_sayisi: int = 0,
                       hasarsiz_ortalama: Optional[int] = None, boyali_ortalama: Optional[int] = None,
                       degisen_ortalama: Optional[int] = None, hasarli_ortalama: Optional[int] = None):
    """Yeni pazar verisi oluşturur"""
    pazar_verisi = PazarVerisi(
        kaynak=kaynak,
        marka=marka,
        model=model,
        yil=yil,
        ortalama_fiyat=ortalama_fiyat,
        minimum_fiyat=minimum_fiyat,
        maksimum_fiyat=maksimum_fiyat,
        ilan_sayisi=ilan_sayisi,
        hasarsiz_ortalama=hasarsiz_ortalama,
        boyali_ortalama=boyali_ortalama,
        degisen_ortalama=degisen_ortalama,
        hasarli_ortalama=hasarli_ortalama,
        veri_tarihi=datetime.utcnow(),
        guncelleme_tarihi=datetime.utcnow(),
        aktif=True
    )
    
    db.add(pazar_verisi)
    db.commit()
    db.refresh(pazar_verisi)
    return pazar_verisi

def get_latest_pazar_verisi(db: Session, marka: str, model: str, yil: int):
    """En güncel pazar verisini getirir"""
    return db.query(PazarVerisi).filter(
        PazarVerisi.marka == marka,
        PazarVerisi.model == model,
        PazarVerisi.yil == yil,
        PazarVerisi.aktif == True
    ).order_by(PazarVerisi.veri_tarihi.desc()).first()

def get_pazar_verileri_by_marka(db: Session, marka: str, limit: int = 50):
    """Markaya göre pazar verilerini getirir"""
    return db.query(PazarVerisi).filter(
        PazarVerisi.marka == marka,
        PazarVerisi.aktif == True
    ).order_by(PazarVerisi.veri_tarihi.desc()).limit(limit).all()

def update_pazar_verisi(db: Session, pazar_verisi_id: int, **kwargs):
    """Pazar verisi günceller"""
    pazar_verisi = db.query(PazarVerisi).filter(PazarVerisi.id == pazar_verisi_id).first()
    if not pazar_verisi:
        return None
    
    for key, value in kwargs.items():
        if hasattr(pazar_verisi, key) and value is not None:
            setattr(pazar_verisi, key, value)
    
    pazar_verisi.guncelleme_tarihi = datetime.utcnow()
    db.commit()
    db.refresh(pazar_verisi)
    return pazar_verisi

# === GELİŞMİŞ ARAMA VE FİLTRELEME ===

def search_tahminler_by_hasar(db: Session, hasar_tipi_id: Optional[int] = None, 
                             parca_id: Optional[int] = None, limit: int = 20):
    """Hasar tipine veya parçaya göre tahmin arar"""
    query = db.query(AracTahmini).join(AracHasarDetayi)
    
    if hasar_tipi_id:
        query = query.filter(AracHasarDetayi.hasar_tipi_id == hasar_tipi_id)
    
    if parca_id:
        query = query.filter(AracHasarDetayi.parca_id == parca_id)
    
    return query.order_by(AracTahmini.analiz_tarihi.desc()).limit(limit).all()

def get_populer_hasar_tipleri(db: Session, limit: int = 10):
    """En popüler hasar tiplerini getirir"""
    from sqlalchemy import func
    
    return db.query(
        HasarTipi.hasar_adi,
        func.count(AracHasarDetayi.id).label('kullanim_sayisi')
    ).join(AracHasarDetayi).group_by(HasarTipi.id).order_by(
        func.count(AracHasarDetayi.id).desc()
    ).limit(limit).all()

def get_ortalama_hasar_maliyeti(db: Session, parca_id: int, hasar_tipi_id: int):
    """Belirli parça ve hasar tipi için ortalama maliyet"""
    from sqlalchemy import func
    
    result = db.query(func.avg(AracHasarDetayi.tahmini_maliyet)).filter(
        and_(
            AracHasarDetayi.parca_id == parca_id,
            AracHasarDetayi.hasar_tipi_id == hasar_tipi_id,
            AracHasarDetayi.tahmini_maliyet.isnot(None)
        )
    ).scalar()
    
    return result or 0

# === İSTATİSTİK VE ANALİZ ===

def get_hasar_istatistikleri(db: Session, kullanici_id: Optional[int] = None):
    """Hasar istatistiklerini getirir"""
    from sqlalchemy import func
    
    query = db.query(AracTahmini)
    if kullanici_id:
        query = query.filter(AracTahmini.kullanici_id == kullanici_id)
    
    # Temel istatistikler
    toplam_tahmin = query.count()
    
    # Hasar detayları olan tahminler
    hasarli_tahmin_sayisi = query.join(AracHasarDetayi).count()
    
    # En çok hasarlı parçalar
    en_cok_hasarli_parcalar = db.query(
        AracParcasi.parca_adi,
        func.count(AracHasarDetayi.id).label('hasar_sayisi')
    ).join(AracHasarDetayi).group_by(AracParcasi.id).order_by(
        func.count(AracHasarDetayi.id).desc()
    ).limit(5).all()
    
    # Ortalama hasar oranı
    if toplam_tahmin > 0:
        hasar_orani = (hasarli_tahmin_sayisi / toplam_tahmin) * 100
    else:
        hasar_orani = 0
    
    return {
        "toplam_tahmin": toplam_tahmin,
        "hasarli_tahmin_sayisi": hasarli_tahmin_sayisi,
        "hasar_orani": round(hasar_orani, 2),
        "en_cok_hasarli_parcalar": [
            {"parca_adi": parca[0], "hasar_sayisi": parca[1]} 
            for parca in en_cok_hasarli_parcalar
        ]
    }
