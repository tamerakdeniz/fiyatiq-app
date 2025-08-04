### Proje Adı: Akıllı Araç Fiyat Tahminleme Platformu (Gerçek Zamanlı Analiz)

**Proje Amacı:** Kullanıcı tarafından girilen araç bilgilerini alarak, Gemini gibi bir yapay zeka modeli aracılığıyla internetteki güncel ilanları **anlık olarak analiz edip** bir fiyat tahmini ve özet rapor sunan bir web uygulaması geliştirmek.

---

### Proje Akışı (Kullanıcı Gözünden)
1.  **Bilgi Girişi:** Kullanıcı, web arayüzünden aracının temel bilgilerini (marka, model, yıl, kilometre, hasar durumu vb.) girer.
2.  **Tahmin Başlatma:** "Fiyat Tahmin Et" butonuna tıklar.
3.  **Anlık Analiz:** Backend, bu bilgileri alarak yapay zeka (Gemini) için bir görev oluşturur. Görev şuna benzer: *"Bu özelliklere sahip bir aracın Türkiye pazarındaki güncel ortalama fiyatı nedir? Sahibinden.com, Arabam.com gibi sitelerdeki benzer ilanları anlık olarak analiz ederek bir sonuç ve bulgularını özetleyen kısa bir rapor oluştur."*
4.  **Sonuç Üretimi:** Yapay zeka, bu komuta dayanarak internette anlık bir araştırma ve analiz yapar. Bir fiyat aralığı/tahmini belirler ve bulgularını özetleyen bir rapor metni oluşturur.
5.  **Sunum:** Üretilen fiyat tahmini ve özet rapor, backend aracılığıyla kullanıcı arayüzünde gösterilir.

---

### Güncellenmiş Proje Fazları

**Faz 1: Sistem Tasarımı ve Çekirdek Entegrasyon**
*   **Görev 1.1: Yapay Zeka API Erişimi:**
    *   Gemini API'sine erişim sağlanması ve kimlik bilgilerinin (API key) güvenli bir şekilde yönetilmesi.
    *   API'nin yeteneklerinin, maliyetlerinin ve limitlerinin anlaşılması.
*   **Görev 1.2: Backend Mimarisi ve Teknoloji Seçimi:**
    *   Kullanıcı isteklerini alacak, yapay zeka API'si ile iletişime geçecek ve sonuçları işleyecek bir backend servisi için teknoloji seçimi (Öneri: Python ve FastAPI - AI kütüphaneleriyle uyumu ve hızı nedeniyle).
*   **Görev 1.3: Prompt Mühendisliği (AI Komut Tasarımı):**
    *   Projenin en kritik adımı: Kullanıcıdan gelen bilgilere dayanarak Gemini'ye gönderilecek en etkili ve doğru sonuçlar üretecek komut (prompt) şablonlarının tasarlanması ve test edilmesi.

**Faz 2: Backend Geliştirme (Orkestrasyon Motoru)**
*   **Görev 2.1: API Endpoint'inin Oluşturulması:**
    *   Frontend'den araç bilgilerini JSON formatında alacak bir `/tahmin-et` (veya `/estimate`) endpoint'inin oluşturulması.
*   **Görev 2.2: Gemini API Entegrasyonu:**
    *   Backend'den Gemini API'sine tasarlanan prompt ile birlikte istek gönderecek ve gelen yanıtı (fiyat tahmini ve rapor) alacak kodun yazılması.
*   **Görev 2.3: Yanıt İşleme ve Formatlama:**
    *   Gemini'den gelen metin tabanlı yanıtın ayrıştırılıp (parsing), frontend'in kolayca gösterebileceği yapısal bir JSON formatına (örn: `{ "tahmini_fiyat": 550000, "rapor": "..." }`) dönüştürülmesi.

**Faz 3: Frontend Geliştirme (Kullanıcı Arayüzü)**
*   **Görev 3.1: Girdi Formu:**
    *   Kullanıcının araç bilgilerini gireceği basit ve anlaşılır bir formun tasarlanması ve kodlanması.
*   **Görev 3.2: Sonuç Ekranı:**
    *   Tahmin edilen fiyatın ve yapay zekanın oluşturduğu özet raporun gösterileceği bir sonuç alanının tasarlanması. "Yükleniyor..." gibi bir bekleme durumu göstergesi eklenmesi.
*   **Görev 3.3: API İletişimi:**
    *   Formdaki verileri backend'deki API endpoint'ine gönderen ve dönen sonucu ekranda gösteren frontend mantığının (JavaScript/React/Vue vb. ile) kodlanması.

**Faz 4: Test, Optimizasyon ve Dağıtım**
*   **Görev 4.1: Uçtan Uca Test:**
    *   Farklı araç bilgileri girilerek sistemin anlık olarak doğru ve mantıklı sonuçlar üretip üretmediğinin test edilmesi.
    *   API yanıt sürelerinin ve maliyetlerinin gözlemlenmesi.
*   **Görev 4.2: Dağıtım (Deployment):**
    *   Uygulamanın bir bulut platformuna (örn: Vercel, Heroku, AWS) yüklenmesi.
*   **Görev 4.3: Güvenlik:**
    *   Gemini API anahtarının ve diğer hassas bilgilerin güvenli bir şekilde ortam değişkenleri (environment variables) olarak saklandığından emin olunması.
