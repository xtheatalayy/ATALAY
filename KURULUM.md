# Planned Life — Kurulum Talimatları

Kişisel planlama uygulaması: gider takibi, sağlık rutinleri, görev yönetimi, notlar ve yapay zeka asistanı.

## Gereksinimler

- **Node.js** 18+ (önerilen: 22.x)
- **Yarn** paket yöneticisi
- **PostgreSQL** veritabanı (14+)

## Kurulum Adımları

### 1. Bağımlılıkları yükleyin

```bash
yarn install
```

### 2. Ortam değişkenlerini yapılandırın

Proje kök dizininde `.env` dosyası oluşturun:

```env
# Veritabanı bağlantısı
DATABASE_URL="postgresql://KULLANICI:SIFRE@localhost:5432/planned_life"

# NextAuth ayarları
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="<rastgele-gizli-anahtar>"   # openssl rand -base64 32 ile oluşturabilirsiniz

# Push bildirimleri (VAPID anahtarları)
# npx web-push generate-vapid-keys komutuyla oluşturabilirsiniz
NEXT_PUBLIC_VAPID_PUBLIC_KEY="<vapid-public-key>"
VAPID_PRIVATE_KEY="<vapid-private-key>"

# Yapay Zeka API anahtarı (Abacus AI)
ABACUSAI_API_KEY="<api-anahtariniz>"
```

### 3. Veritabanını oluşturun

```bash
yarn prisma db push
```

### 4. (İsteğe bağlı) Örnek verileri yükleyin

```bash
yarn prisma db seed
```

### 5. Geliştirme sunucusunu başlatın

```bash
yarn dev
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

### 6. Üretim derlemesi

```bash
yarn build
yarn start
```

## Proje Yapısı

```
├── app/                    # Next.js App Router sayfaları ve API rotaları
│   ├── (app)/              # Oturum açmış kullanıcı sayfaları
│   │   ├── asistan/        # Yapay zeka sohbet sayfası
│   │   ├── giderler/       # Gider takibi
│   │   ├── gorevler/       # Yapılacaklar listesi
│   │   ├── hatirlaticilar/ # Hatırlatıcılar
│   │   ├── notlar/         # Notlar
│   │   ├── saglik/         # Sağlık rutinleri
│   │   └── page.tsx        # Ana özet sayfası
│   ├── api/                # API uç noktaları
│   │   ├── auth/           # Kimlik doğrulama
│   │   ├── chat/           # Yapay zeka sohbet
│   │   ├── push/           # Push bildirimleri
│   │   ├── dashboard/      # Özet verileri
│   │   ├── expenses/       # Gider CRUD
│   │   ├── notes/          # Not CRUD
│   │   ├── routines/       # Rutin CRUD
│   │   ├── todos/          # Görev CRUD
│   │   └── ...             # Diğer API rotaları
│   ├── giris/              # Giriş sayfası
│   ├── kayit/              # Kayıt sayfası
│   └── cevrimdisi/         # Çevrimdışı sayfası
├── components/             # React bileşenleri
│   ├── chat/               # Yapay zeka sohbet bileşeni
│   ├── dashboard/          # Özet panosu bileşenleri
│   ├── expenses/           # Gider bileşenleri
│   ├── health/             # Sağlık rutini bileşenleri
│   ├── notes/              # Not bileşenleri
│   ├── todos/              # Görev bileşenleri
│   ├── auth/               # Giriş/kayıt formları
│   ├── ui/                 # Temel UI bileşenleri
│   └── ...                 # Diğer bileşenler
├── lib/                    # Yardımcı fonksiyonlar ve veritabanı
├── prisma/                 # Veritabanı şeması
│   └── schema.prisma       # Prisma şema dosyası
├── public/                 # Statik dosyalar (ikonlar, SW)
├── scripts/                # Seed ve yardımcı betikler
└── auth.ts                 # NextAuth yapılandırması
```

## Veritabanı Şeması (Özet)

| Model              | Açıklama                      |
|---------------------|-------------------------------|
| User               | Kullanıcı hesapları           |
| Expense            | Gider kayıtları               |
| Budget             | Aylık bütçe hedefleri         |
| Routine            | Sağlık rutinleri              |
| RoutineCompletion  | Rutin tamamlama kayıtları     |
| Todo               | Görevler / yapılacaklar       |
| Note               | Notlar                        |
| PushSubscription   | Push bildirim abonelikleri    |
| ChatMessage        | Yapay zeka sohbet geçmişi     |

Detaylı şema için `prisma/schema.prisma` dosyasına bakın.

## Özellikler

- 📊 **Gider Takibi** — Kategori bazlı harcama kaydı, aylık bütçe ve hesap makinesi
- 💪 **Sağlık Rutinleri** — Günlük/haftalık/aylık alışkanlık takibi ve seri (streak) sistemi
- ✅ **Yapılacaklar** — Öncelikli görev yönetimi ve hatırlatıcılar
- 📝 **Notlar** — Serbest metin notları ve arama
- 🤖 **Yapay Zeka Asistanı** — Planlama, bütçe ve sağlık konusunda AI danışmanı
- 🔔 **Push Bildirimleri** — Uygulama kapalıyken bile hatırlatma
- 📱 **PWA** — Ana ekrana kurulabilir, çevrimdışı destek
- 🌙 **Koyu Mod** — Açık ve koyu tema desteği
