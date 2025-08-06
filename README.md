# 🚗 FiyatIQ - Akıllı Araç Fiyat Tahminleme Platformu

**AI-Powered Real-Time Vehicle Valuation System**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)

## 🌐 Canlı Demo / Live Demo

> **🚀 Ürünü Şimdi Test Edin! / Test the Product Now!**  
> **[Live Demo - FiyatIQ Platform](https://fiyatiq.wxcodesign.com/)**  
> _FiyatIQ'yu denemek için yukarıdaki bağlantıya tıklayın ve AI tabanlı araç değerleme sistemini keşfedin._  
> _Click the link above to try FiyatIQ and discover the AI-powered vehicle valuation system._

## 📋 Proje Özeti / Project Summary

**Türkçe:**
FiyatIQ, kullanıcıların araç bilgilerini girerek **Google Gemini AI** ile gerçek zamanlı pazar analizi yapabileceği, modern bir web uygulamasıdır. Sistem, detaylı hasar değerlendirmesi, parça bazlı analiz ve AI destekli fiyat tahminleri sunar.

> **English:**
> FiyatIQ is a modern web application that allows users to perform real-time market analysis using **Google Gemini AI** by entering vehicle information. The system provides detailed damage assessment, component-based analysis, and AI-powered price predictions.

### ✨ Özellikler / Features

- 🧠 **AI Destekli Analiz** / AI-Powered Analysis: Google Gemini ile akıllı fiyat tahmini
- ⚡ **Gerçek Zamanlı** / Real-Time: Anlık pazar verisi analizi
- 🔧 **Detaylı Hasar Değerlendirmesi** / Detailed Damage Assessment: Parça bazlı hasar analizi
- 📊 **Kapsamlı Raporlama** / Comprehensive Reporting: AI analiz raporları
- 💾 **Kullanıcı Yönetimi** / User Management: Araç kaydetme ve geçmiş takibi
- 📱 **Responsive Tasarım** / Responsive Design: Modern ve kullanıcı dostu arayüz
- 🔒 **Güvenli API** / Secure API: RESTful API standardları

## 🏗 Teknoloji Stack / Technology Stack

### Backend

- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM ve veritabanı yönetimi
- **LangChain** - AI entegrasyonu
- **Google Gemini AI** - Yapay zeka modeli
- **SQLite** - Hafif veritabanı çözümü
- **BeautifulSoup4** - Web scraping
- **Pydantic** - Veri doğrulama

### Frontend

- **Next.js 15** - React framework
- **TypeScript** - Tip güvenli JavaScript
- **Tailwind CSS** - Modern CSS framework
- **Radix UI** - Accessible komponent kütüphanesi
- **React Hook Form** - Form yönetimi
- **Zod** - Schema validation
- **Lucide React** - İkon kütüphanesi

## 🚀 Kurulum ve Çalıştırma / Installation & Setup

### 🏠 Geliştirme Ortamı / Development Environment

#### 1. Projeyi Klonlayın / Clone the Repository

```bash
git clone https://github.com/tamerakdeniz/fiyatiq-app
cd fiyatiq
```

#### 2. Backend Kurulumu / Backend Setup

```bash
cd backend

# Virtual environment oluşturun / Create virtual environment
python -m venv venv

# Virtual environment'ı aktifleştirin / Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Bağımlılıkları yükleyin / Install dependencies
pip install -r requirements.txt

# Environment dosyasını oluşturun / Create environment file
cp env.example .env
```

#### 3. Gemini API Anahtarı Ayarlayın / Configure Gemini API Key

1. [Google AI Studio](https://makersuite.google.com/app/apikey) adresinden API anahtarı alın
2. `.env` dosyasını düzenleyin:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

#### 4. Veritabanını Başlatın / Initialize Database

```bash
# Veritabanını oluşturun ve başlangıç verilerini yükleyin
python initialize_db.py
python populate_initial_data.py
```

#### 5. Backend'i Başlatın / Start Backend

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 6. Frontend Kurulumu / Frontend Setup

Yeni terminal açın / Open new terminal:

```bash
cd frontend

# Bağımlılıkları yükleyin / Install dependencies
npm install
# veya / or
pnpm install

# Environment dosyasını oluşturun (opsiyonel) / Create environment file (optional)
cp env.example .env.local

# Frontend'i başlatın / Start frontend
npm run dev
# veya / or
pnpm dev
```

#### 7. Uygulamayı Açın / Open Application

- **Frontend**: http://localhost:3000
- **Backend API Docs**: http://localhost:8000/docs
- **Backend Health**: http://localhost:8000/health

### 🌐 Production Ortamı / Production Environment

#### Canlı Uygulama / Live Application

- **Frontend**: https://fiyatiq.wxcodesign.com
- **API Documentation**: https://fiyatiq.wxcodesign.com/docs
- **Health Check**: https://fiyatiq.wxcodesign.com/health

#### Production Deployment

Detaylı deployment rehberi için [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) dosyasını inceleyin.

**Hızlı Kurulum / Quick Setup:**

```bash
# Server'da çalıştırın / Run on server
git clone https://github.com/tamerakdeniz/fiyatiq-app.git
cd fiyatiq
cp backend/env.example backend/.env
# backend/.env dosyasını düzenleyin ve Gemini API key'inizi ekleyin
chmod +x deploy.sh
./deploy.sh
```

## 📖 Kullanım Rehberi / Usage Guide

### 1. Ana Sayfa / Homepage

- Uygulama açıldığında otomatik olarak dashboard'a yönlendirilirsiniz
- Backend bağlantı durumu üst kısımda gösterilir

### 2. Basit Fiyat Tahmini / Simple Price Estimation

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

### 3. Detaylı Hasar Analizi / Detailed Damage Analysis

1. **"Detailed Estimate"** sayfasına gidin
2. Temel araç bilgilerini girin
3. **"Add Damage Entry"** ile hasar kayıtları ekleyin:
   - Araç parçası seçin (31 farklı parça)
   - Hasar tipini belirleyin (10 farklı tip)
   - Şiddet seviyesini seçin (Hafif/Orta/Ağır)
4. **"Calculate Price"** ile detaylı analiz yapın
5. Parça bazlı değer kaybı raporunu inceleyin

### 4. Sonuçları Görüntüleme / View Results

- Tahmini fiyat aralığı
- Detaylı AI analiz raporu
- Pazar durumu analizi
- Güven skoru
- Parça bazlı değer kaybı

## 🔧 API Kullanımı / API Usage

### Temel Endpoint'ler / Core Endpoints

#### Basit Fiyat Tahmini / Simple Price Estimation

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

#### Detaylı Hasar Analizi / Detailed Damage Analysis

```bash
POST /detayli-tahmin
Content-Type: application/json

{
  "arac_bilgileri": {
    "marka": "Toyota",
    "model": "Corolla",
    "yil": 2020,
    "kilometre": 50000
  },
  "hasar_kayitlari": [
    {
      "parca_id": 1,
      "hasar_tipi_id": 2,
      "siddet": "Orta",
      "notlar": "Ön çamurluk hasarı"
    }
  ]
}
```

#### Sistem Durumu / System Status

```bash
GET /health
GET /istatistikler
GET /arac-parcalari
GET /hasar-tipleri
```

Detaylı API dokümantasyonu için: http://localhost:8000/docs

## 📊 Proje Yapısı / Project Structure

```
fiyatiq/
├── backend/                 # FastAPI backend
│   ├── main.py             # Ana uygulama / Main application
│   ├── models.py           # Pydantic modeller / Pydantic models
│   ├── database.py         # Veritabanı yapılandırması / Database configuration
│   ├── crud.py             # CRUD işlemleri / CRUD operations
│   ├── web_scraper.py      # Pazar verisi toplama / Market data collection
│   ├── initialize_db.py    # Veritabanı başlatma / Database initialization
│   ├── populate_initial_data.py # Başlangıç verileri / Initial data
│   ├── fiyatiq.db          # SQLite veritabanı / SQLite database
│   └── requirements.txt    # Python bağımlılıkları / Python dependencies
├── frontend/               # Next.js frontend
│   ├── app/                # App router sayfaları / App router pages
│   │   ├── page.tsx        # Ana sayfa / Homepage
│   │   ├── estimate/       # Basit tahmin / Simple estimation
│   │   └── detailed-estimate/ # Detaylı tahmin / Detailed estimation
│   ├── components/         # React komponentleri / React components
│   ├── contexts/           # React context'leri / React contexts
│   ├── services/           # API servisleri / API services
│   ├── types/              # TypeScript tipleri / TypeScript types
│   └── package.json        # Node.js bağımlılıkları / Node.js dependencies
├── nginx/                  # Nginx konfigürasyonu / Nginx configuration
├── deploy.sh               # Deployment script
├── docker-compose.yml      # Docker compose
└── README.md              # Bu dosya / This file
```

## 🔍 Önemli Dosyalar / Important Files

- `backend/main.py` - FastAPI uygulaması ve AI entegrasyonu
- `backend/web_scraper.py` - Pazar verisi toplama servisi
- `frontend/services/api.ts` - API istemci servisleri
- `frontend/app/estimate/page.tsx` - Basit fiyat tahmini sayfası
- `frontend/app/detailed-estimate/page.tsx` - Detaylı hasar analizi sayfası

## 🐛 Sorun Giderme / Troubleshooting

### Backend Sorunları / Backend Issues

1. **Gemini API Hatası**: API anahtarınızı kontrol edin
2. **Port Kullanımda**: Farklı port kullanın: `--port 8001`
3. **Import Hatası**: Virtual environment aktif olduğundan emin olun
4. **Veritabanı Hatası**: `python initialize_db.py` çalıştırın

### Frontend Sorunları / Frontend Issues

1. **Backend Bağlantı Hatası**: Backend'in çalıştığından emin olun
2. **Type Hatası**: `npm run type-check` ile kontrol edin
3. **Environment Değişkenleri**: `.env.local` dosyasını kontrol edin

### Genel Sorunlar / General Issues

1. **CORS Hatası**: Backend CORS ayarlarını kontrol edin
2. **API Response Hatası**: Browser console'da network sekmesini inceleyin

## 🛠 Geliştirme / Development

### Backend Geliştirme / Backend Development

```bash
cd backend
# Otomatik yeniden yükleme ile çalıştır / Run with auto-reload
uvicorn main:app --reload --port 8000
```

### Frontend Geliştirme / Frontend Development

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
# Kod formatı kontrolü / Code formatting check
black .
flake8 .
```

## 📈 Özellikler ve Yenilikler / Features & Innovations

### 🎯 Ana Özellikler / Core Features

- **AI Destekli Fiyat Tahmini**: Google Gemini ile gerçek zamanlı analiz
- **Detaylı Hasar Değerlendirmesi**: 31 araç parçası, 10 hasar tipi
- **Pazar Verisi Entegrasyonu**: Web scraping ile güncel fiyatlar
- **Parça Bazlı Analiz**: Her parçanın değer kaybı hesaplaması
- **Responsive Tasarım**: Mobil ve desktop uyumlu arayüz

### 🔬 Teknik Yenilikler / Technical Innovations

- **LangChain Entegrasyonu**: Gelişmiş AI prompt mühendisliği
- **Real-time Web Scraping**: Anlık pazar verisi toplama
- **Advanced Depreciation Algorithm**: Gelişmiş değer kaybı hesaplama
- **Type-safe API**: TypeScript ile tip güvenliği
- **Modern UI/UX**: Radix UI ve Tailwind CSS

## 🚧 Gelecek Özellikler / Future Features

- [ ] Kullanıcı kimlik doğrulama sistemi / User authentication system
- [ ] Araç fotoğrafı yükleme / Vehicle photo upload
- [ ] Fiyat trend grafikleri / Price trend charts
- [ ] Email bildirimleri / Email notifications
- [ ] Çoklu dil desteği / Multi-language support
- [ ] Mobil uygulama / Mobile application
- [ ] Blockchain entegrasyonu / Blockchain integration

## 📄 Lisans / License

MIT License - Detaylar için LICENSE dosyasına bakın. / See LICENSE file for details.

## 🤝 Katkıda Bulunma / Contributing

1. Fork yapın / Fork the project
2. Feature branch oluşturun / Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit yapın / Commit changes (`git commit -m 'Add amazing feature'`)
4. Push yapın / Push to branch (`git push origin feature/amazing-feature`)
5. Pull Request açın / Open Pull Request

## 🙏 Teşekkürler / Acknowledgments

- **Google Gemini AI** - Yapay zeka modeli sağlayıcısı
- **BTK Hackathon** - Proje geliştirme fırsatı
- **Open Source Community** - Kullanılan kütüphaneler ve araçlar

---

**Not / Note**: Bu proje BTK Hackathon için geliştirilmiştir. Gerçek üretim ortamında kullanım için ek güvenlik önlemleri alınmalıdır. / This project was developed for BTK Hackathon. Additional security measures should be taken for real production use.
