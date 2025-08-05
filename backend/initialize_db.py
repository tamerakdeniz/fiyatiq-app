"""
Database Initialization Script
Creates all tables and populates initial data
"""

from database import AracParcasi, HasarTipi, SessionLocal, create_tables


def main():
    """Initialize database with tables and data"""
    print("🚀 Initializing FiyatIQ Database...")
    
    # Remove existing database file to ensure clean state with new schema
    import os
    if os.path.exists("fiyatiq.db"):
        os.remove("fiyatiq.db")
        print("🗑️ Removed existing database for clean initialization")
    
    # Create all tables
    print("\n📊 Creating database tables...")
    create_tables()
    print("✅ Database tables created successfully!")
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Populate car parts
        print("\n📦 Populating car parts...")
        populate_car_parts(db)
        
        # Populate damage types
        print("\n🔧 Populating damage types...")
        populate_damage_types(db)
        
        print("\n✅ Database initialization completed successfully!")
        print("\n📊 Database Summary:")
        parts_count = db.query(AracParcasi).count()
        damage_count = db.query(HasarTipi).count()
        print(f"   - Car Parts: {parts_count}")
        print(f"   - Damage Types: {damage_count}")
        print(f"\n💾 Database file: fiyatiq.db")
        
    except Exception as e:
        print(f"❌ Error during initialization: {e}")
        db.rollback()
    finally:
        db.close()

def populate_car_parts(db):
    """Populates car parts data"""
    
    parts_data = [
        # Body parts - Gövde parçaları
        {"parca_adi": "Ön Kapak", "kategori": "Gövde", "ortalama_maliyet": 15000, "etki_faktoru": 0.08},
        {"parca_adi": "Arka Kapak", "kategori": "Gövde", "ortalama_maliyet": 12000, "etki_faktoru": 0.06},
        {"parca_adi": "Sol Ön Kapı", "kategori": "Gövde", "ortalama_maliyet": 18000, "etki_faktoru": 0.10},
        {"parca_adi": "Sağ Ön Kapı", "kategori": "Gövde", "ortalama_maliyet": 18000, "etki_faktoru": 0.10},
        {"parca_adi": "Sol Arka Kapı", "kategori": "Gövde", "ortalama_maliyet": 16000, "etki_faktoru": 0.08},
        {"parca_adi": "Sağ Arka Kapı", "kategori": "Gövde", "ortalama_maliyet": 16000, "etki_faktoru": 0.08},
        {"parca_adi": "Ön Tampon", "kategori": "Gövde", "ortalama_maliyet": 8000, "etki_faktoru": 0.05},
        {"parca_adi": "Arka Tampon", "kategori": "Gövde", "ortalama_maliyet": 7000, "etki_faktoru": 0.04},
        {"parca_adi": "Sol Çamurluk", "kategori": "Gövde", "ortalama_maliyet": 10000, "etki_faktoru": 0.07},
        {"parca_adi": "Sağ Çamurluk", "kategori": "Gövde", "ortalama_maliyet": 10000, "etki_faktoru": 0.07},
        {"parca_adi": "Tavan", "kategori": "Gövde", "ortalama_maliyet": 35000, "etki_faktoru": 0.15},
        
        # Engine and mechanical - Motor ve mekanik
        {"parca_adi": "Motor", "kategori": "Motor", "ortalama_maliyet": 80000, "etki_faktoru": 0.25},
        {"parca_adi": "Şanzıman", "kategori": "Motor", "ortalama_maliyet": 60000, "etki_faktoru": 0.20},
        {"parca_adi": "Fren Sistemi", "kategori": "Mekanik", "ortalama_maliyet": 25000, "etki_faktoru": 0.12},
        {"parca_adi": "Direksiyon", "kategori": "Mekanik", "ortalama_maliyet": 15000, "etki_faktoru": 0.08},
        {"parca_adi": "Amortisör", "kategori": "Mekanik", "ortalama_maliyet": 12000, "etki_faktoru": 0.06},
        {"parca_adi": "Egzoz Sistemi", "kategori": "Motor", "ortalama_maliyet": 8000, "etki_faktoru": 0.04},
        {"parca_adi": "Soğutma Sistemi", "kategori": "Motor", "ortalama_maliyet": 15000, "etki_faktoru": 0.07},
        
        # Interior - İç mekan
        {"parca_adi": "Ön Koltuklar", "kategori": "İç Mekan", "ortalama_maliyet": 20000, "etki_faktoru": 0.08},
        {"parca_adi": "Arka Koltuklar", "kategori": "İç Mekan", "ortalama_maliyet": 15000, "etki_faktoru": 0.06},
        {"parca_adi": "Dashboard", "kategori": "İç Mekan", "ortalama_maliyet": 18000, "etki_faktoru": 0.06},
        {"parca_adi": "Klima Sistemi", "kategori": "İç Mekan", "ortalama_maliyet": 12000, "etki_faktoru": 0.05},
        {"parca_adi": "Ses Sistemi", "kategori": "İç Mekan", "ortalama_maliyet": 8000, "etki_faktoru": 0.03},
        {"parca_adi": "Döşeme", "kategori": "İç Mekan", "ortalama_maliyet": 10000, "etki_faktoru": 0.04},
        
        # Electrical - Elektrik
        {"parca_adi": "Aydınlatma Sistemi", "kategori": "Elektrik", "ortalama_maliyet": 5000, "etki_faktoru": 0.02},
        {"parca_adi": "Elektrik Tesisatı", "kategori": "Elektrik", "ortalama_maliyet": 15000, "etki_faktoru": 0.06},
        {"parca_adi": "Batarya", "kategori": "Elektrik", "ortalama_maliyet": 3000, "etki_faktoru": 0.02},
        
        # Other - Diğer
        {"parca_adi": "Lastikler", "kategori": "Diğer", "ortalama_maliyet": 6000, "etki_faktoru": 0.04},
        {"parca_adi": "Jantlar", "kategori": "Diğer", "ortalama_maliyet": 12000, "etki_faktoru": 0.06},
        {"parca_adi": "Camlar", "kategori": "Diğer", "ortalama_maliyet": 8000, "etki_faktoru": 0.03},
        {"parca_adi": "Aynalar", "kategori": "Diğer", "ortalama_maliyet": 3000, "etki_faktoru": 0.02},
    ]
    
    # Check if data already exists
    existing_parts = db.query(AracParcasi).count()
    if existing_parts > 0:
        print(f"   Car parts already exist ({existing_parts} parts found). Skipping population.")
        return
    
    # Add all parts
    for part_data in parts_data:
        part = AracParcasi(**part_data)
        db.add(part)
    
    db.commit()
    print(f"   Successfully added {len(parts_data)} car parts to database.")

def populate_damage_types(db):
    """Populates damage types data"""
    
    damage_types_data = [
        {
            "hasar_adi": "Boyalı",
            "aciklama": "Parçanın boyası yenilenmiş, orijinal değil",
            "deger_azalma_orani": 0.15
        },
        {
            "hasar_adi": "Değişen",
            "aciklama": "Parça tamamen değiştirilmiş, orijinal değil",
            "deger_azalma_orani": 0.30
        },
        {
            "hasar_adi": "Hasarlı",
            "aciklama": "Parçada görünür hasar mevcut, onarım gerekli",
            "deger_azalma_orani": 0.45
        },
        {
            "hasar_adi": "Çizik",
            "aciklama": "Yüzeysel çizikler mevcut",
            "deger_azalma_orani": 0.08
        },
        {
            "hasar_adi": "Ezik",
            "aciklama": "Parçada göçük veya ezik var",
            "deger_azalma_orani": 0.20
        },
        {
            "hasar_adi": "Çatlak",
            "aciklama": "Parçada çatlak var",
            "deger_azalma_orani": 0.25
        },
        {
            "hasar_adi": "Paslanma",
            "aciklama": "Parçada korozyon/pas var",
            "deger_azalma_orani": 0.18
        },
        {
            "hasar_adi": "Yanık",
            "aciklama": "Parçada yanık izleri var",
            "deger_azalma_orani": 0.35
        },
        {
            "hasar_adi": "Aşınma",
            "aciklama": "Normal kullanımdan kaynaklı aşınma",
            "deger_azalma_orani": 0.10
        },
        {
            "hasar_adi": "Kırık",
            "aciklama": "Parça kırılmış, tamamen değişim gerekli",
            "deger_azalma_orani": 0.40
        }
    ]
    
    # Check if data already exists
    existing_damages = db.query(HasarTipi).count()
    if existing_damages > 0:
        print(f"   Damage types already exist ({existing_damages} types found). Skipping population.")
        return
    
    # Add all damage types
    for damage_data in damage_types_data:
        damage_type = HasarTipi(**damage_data)
        db.add(damage_type)
    
    db.commit()
    print(f"   Successfully added {len(damage_types_data)} damage types to database.")

if __name__ == "__main__":
    main()