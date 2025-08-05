# 🚗 FiyatIQ - Akıllı Araç Fiyat Tahminleme Platformu

**Gerçek zamanlı AI destekli araç değerleme sistemi**

## 📋 Proje Özeti

FiyatIQ, kullanıcıların araç bilgilerini girerek **Gemini AI** ile güncel pazar analizi yapabileceği, modern bir web uygulamasıdır. Sistem, FastAPI backend ve Next.js frontend ile geliştirilmiş olup, gerçek zamanlı fiyat tahminleri sunar.

### ✨ Özellikler

- 🧠 **AI Destekli Analiz**: Google Gemini ile akıllı fiyat tahmini
- ⚡ **Gerçek Zamanlı**: Anlık pazar verisi analizi
- 📊 **Detaylı Raporlama**: Kapsamlı AI analiz raporları
- 💾 **Kullanıcı Yönetimi**: Araç kaydetme ve geçmiş takibi
- 📱 **Responsive Tasarım**: Modern ve kullanıcı dostu arayüz
- 🔒 **Güvenli API**: RESTful API standardları

## 🏗 Teknoloji Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM ve veritabanı yönetimi  
- **LangChain** - AI entegrasyonu
- **Google Gemini AI** - Yapay zeka modeli
- **SQLite** - Hafif veritabanı çözümü

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - Tip güvenli JavaScript
- **Tailwind CSS** - Modern CSS framework
- **Radix UI** - Accessible komponent kütüphanesi
- **React Hook Form** - Form yönetimi

## 🚀 Kurulum ve Çalıştırma

### 1. Projeyi Klonlayın
```bash
git clone <repo-url>
cd fiyatiq
```

### 2. Backend Kurulumu

```bash
cd backend

# Virtual environment oluşturun
python -m venv venv

# Virtual environment'ı aktifleştirin
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Bağımlılıkları yükleyin
pip install -r requirements.txt

# Environment dosyasını oluşturun
cp .env.example .env
```

### 3. Gemini API Anahtarı Ayarlayın

1. [Google AI Studio](https://makersuite.google.com/app/apikey) adresinden API anahtarı alın
2. `.env` dosyasını düzenleyin:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Backend'i Başlatın
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Frontend Kurulumu

Yeni terminal açın:
```bash
cd frontend

# Bağımlılıkları yükleyin
npm install
# veya
pnpm install

# Environment dosyasını oluşturun (opsiyonel)
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000" > .env.local

# Frontend'i başlatın
npm run dev
# veya  
pnpm dev
```

### 6. Uygulamayı Açın

- **Frontend**: http://localhost:3000
- **Backend API Docs**: http://localhost:8000/docs
- **Backend Health**: http://localhost:8000/health

## 📖 Kullanım Rehberi

### 1. Ana Sayfa
- Uygulama açıldığında otomatik olarak dashboard'a yönlendirilirsiniz
- Backend bağlantı durumu üst kısımda gösterilir

### 2. Araç Fiyat Tahmini
1. **"Add Vehicle"** butonuna tıklayın
2. Araç bilgilerini doldurun:
   - Marka ve model
   - Model yılı
   - Kilometre
   - Hasar durumu
   - Yakıt tipi, vites, renk, şehir
3. **"Predict Price"** butonuna tıklayın
4. AI analiz sonucunu bekleyin (2-5 saniye)
5. İsterseniz sonucu dashboard'a kaydedin

### 3. Sonuçları Görüntüleme
- Tahmini fiyat aralığı
- Detaylı AI analiz raporu
- Pazar durumu analizi
- Güven skoru

## 🔧 API Kullanımı

### Temel Endpoint'ler

#### Fiyat Tahmini
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

#### Sistem Durumu
```bash
GET /health
GET /istatistikler
```

Detaylı API dokümantasyonu için: http://localhost:8000/docs

## 🛠 Geliştirme

### Backend Geliştirme
```bash
cd backend
# Otomatik yeniden yükleme ile çalıştır
uvicorn main:app --reload --port 8000
```

### Frontend Geliştirme  
```bash
cd frontend
# Development server
npm run dev
```

### Linting ve Type Checking
```bash
# Frontend
cd frontend
npm run lint
npm run type-check

# Backend
cd backend
# Kod formatı kontrolü
black .
flake8 .
```

## 📊 Proje Yapısı

```
fiyatiq/
├── backend/                 # FastAPI backend
│   ├── main.py             # Ana uygulama
│   ├── models.py           # Pydantic modeller
│   ├── database.py         # Veritabanı yapılandırması
│   ├── crud.py             # CRUD işlemleri
│   └── requirements.txt    # Python bağımlılıkları
├── frontend/               # Next.js frontend
│   ├── app/                # App router sayfaları
│   ├── components/         # React komponentleri
│   ├── contexts/           # React context'leri
│   ├── services/           # API servisleri
│   ├── types/              # TypeScript tipleri
│   └── package.json        # Node.js bağımlılıkları
└── README.md              # Bu dosya
```

## 🔍 Önemli Dosyalar

- `backend/main.py` - FastAPI uygulaması ve AI entegrasyonu
- `frontend/services/api.ts` - API istemci servisleri
- `frontend/app/estimate/page.tsx` - Fiyat tahmini sayfası
- `frontend/contexts/auth-context.tsx` - Kimlik doğrulama yönetimi

## 🐛 Sorun Giderme

### Backend Sorunları
1. **Gemini API Hatası**: API anahtarınızı kontrol edin
2. **Port Kullanımda**: Farklı port kullanın: `--port 8001`
3. **Import Hatası**: Virtual environment aktif olduğundan emin olun

### Frontend Sorunları
1. **Backend Bağlantı Hatası**: Backend'in çalıştığından emin olun
2. **Type Hatası**: `npm run type-check` ile kontrol edin
3. **Environment Değişkenleri**: `.env.local` dosyasını kontrol edin

### Genel Sorunlar
1. **CORS Hatası**: Backend CORS ayarlarını kontrol edin
2. **API Response Hatası**: Browser console'da network sekmesini inceleyin

## 📝 Geliştirme Notları

- Mock data tamamen kaldırılmış, gerçek API entegrasyonu yapılmıştır
- Backend bağlantı durumu frontend'de görsel olarak gösterilir
- Tüm API çağrıları error handling ile korunmaktadır
- TypeScript tipleri backend schema'sı ile uyumludur

## 🚧 Gelecek Özellikler

- [ ] Kullanıcı kimlik doğrulama sistemi
- [ ] Araç fotoğrafı yükleme
- [ ] Fiyat trend grafikleri
- [ ] Email bildirimleri
- [ ] Çoklu dil desteği
- [ ] Mobil uygulama

## 📄 Lisans

MIT License - Detaylar için LICENSE dosyasına bakın.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

---

**Not**: Bu proje BTK Hackathon için geliştirilmiştir. Gerçek üretim ortamında kullanım için ek güvenlik önlemleri alınmalıdır.