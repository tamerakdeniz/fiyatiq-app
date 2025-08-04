# 🚗 Akıllı Araç Fiyat Tahminleme API - Kullanım Rehberi

## 🚀 Hızlı Başlangıç

### 1. API Durumunu Kontrol Edin
```bash
GET /
```

### 2. Sistem Sağlığını Kontrol Edin
```bash
GET /health
```

### 3. Fiyat Tahmini Yapın
```bash
POST /tahmin-et
Content-Type: application/json

{
  "marka": "Toyota",
  "model": "Corolla", 
  "yil": 2020,
  "kilometre": 50000,
  "yakit_tipi": "Benzin",
  "vites_tipi": "Otomatik",
  "hasar_durumu": "Hasarsız",
  "renk": "Beyaz",
  "il": "İstanbul"
}
```

## 👤 Kullanıcı Yönetimi

### Kullanıcı Kaydı
```bash
POST /kullanici/kayit
Content-Type: application/json

{
  "ad": "Ahmet",
  "soyad": "Yılmaz", 
  "email": "ahmet@email.com",
  "telefon": "0532 123 4567",
  "sehir": "İstanbul"
}
```

### Araç Ekleme
```bash
POST /kullanici/{kullanici_id}/arac
Content-Type: application/json

{
  "arac_adi": "Benim Corollam",
  "marka": "Toyota",
  "model": "Corolla",
  "yil": 2020,
  "kilometre": 50000,
  "yakit_tipi": "Benzin",
  "vites_tipi": "Otomatik",
  "hasar_durumu": "Hasarsız",
  "renk": "Beyaz"
}
```

## 📊 Veri Formatları

### Yakıt Tipleri
- `"Benzin"`
- `"Dizel"`
- `"LPG"`
- `"Hibrit"`
- `"Elektrik"`

### Vites Tipleri
- `"Manuel"`
- `"Otomatik"`

### Hasar Durumları
- `"Hasarsız"`
- `"Boyalı"`
- `"Değişen"`
- `"Hasarlı"`

## 🔧 Teknoloji Stack

- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM ve veritabanı yönetimi
- **LangChain** - AI entegrasyonu
- **Gemini AI** - Google'ın yapay zeka modeli
- **SQLite** - Hafif veritabanı çözümü

## 📚 Swagger UI

Bu API dokümantasyonu `/docs` endpoint'inde interaktif olarak mevcuttur. Tüm endpoint'leri test edebilir ve detaylı açıklamaları görebilirsiniz.

## 🔒 Güvenlik

- API anahtarları çevre değişkenlerinde güvenli şekilde saklanır
- Kullanıcı verisi validasyonu
- SQL injection koruması
- CORS güvenlik ayarları
