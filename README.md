# LGS Takip

LGS'ye hazırlanan bir öğrencinin günlük çalışmasını (ödevler, çözülen sorular,
hatalar, konu ilerlemesi ve deneme sınavı sonuçları) veli ve öğrencinin
birlikte takip edebildiği basit bir web uygulaması.

## Özellikler

- **Panel**: Bugün/bu hafta çözülen soru sayısı, bekleyen ödev sayısı,
  öğrenilen konu oranı, son 7 günün soru trendi grafiği, en çok hata yapılan
  konular ve yaklaşan ödevler.
- **Ödevler**: Ders/konu bazında, gün gün ödev ekleme (verildiği tarih, sayfa
  aralığı, son tarih), durumu güncelleme (bekliyor / devam ediyor /
  tamamlandı), öğretmenin tahtaya/kitaba yazdığı ödevin fotoğrafını yükleme
  (telefondan yeni fotoğraf çekebilir veya galerideki bir fotoğrafı
  seçebilirsiniz).
- **Sorular**: Günlük çözülen soruları ders/konu bazında doğru/yanlış/boş
  olarak kaydetme, net hesaplama, süre ve not ekleme. Birden fazla konuyu
  karışık soran kitap testleri **karma test** olarak işaretlenir: konu alanı
  kapanır ve kayıt konu bazlı analizlere girmez (bkz. aşağıdaki not).
- **Hatalar**: Yanlış yapılan soruları nedeniyle (bilgi eksiği, dikkatsizlik,
  zaman yetersizliği, soruyu yanlış anlama, işlem hatası, diğer) kaydetme ve
  giderildi olarak işaretleme.
- **Konular**: LGS müfredatına göre (Türkçe, Matematik, Fen Bilimleri, T.C.
  İnkılap Tarihi, Din Kültürü, İngilizce) konu listesi ve her konunun
  öğrenilme durumu (başlanmadı / öğreniliyor / tekrar gerekli / öğrenildi).
- **Denemeler**: Deneme sınavı sonuçlarını ders bazında kaydetme, net
  hesaplama, MEB katsayılarıyla tahmini LGS puanı ve geçmiş sonuçları
  listeleme.
- **Hedefler**: Hedef liseleri taban puanıyla birlikte kaydetme ve en son
  denemenin tahmini puanıyla karşılaştırma.
- **Analiz**: Bu haftaki hedefin gerçekleşme özeti, son 8 haftanın hedefe
  ulaşma oranı, **ders bazında konu durumu** (hangi dersin yüzde kaçı
  öğrenildi / öğreniliyor / tekrar gerekli / başlanmadı), zayıf konu radarı,
  tahmini puan gelişimi, ders bazında net gelişimi, son denemede ders bazlı
  net, haftalık doğruluk oranı, hata nedeni dağılımı ve konu bazlı hata
  sayısı. Her grafiğin sağ üstündeki *Tablo* düğmesiyle aynı veri sayı sayı da
  okunabilir.
- **Ayarlar**: Şifre değiştirme ve haftalık hedef belirleme — soru sayısı,
  çalışma süresi (dakika) ve deneme sayısı. Hedef girildiğinde panelde
  ilerleme çubuğu ve "ne kadar eksik kaldı" bilgisi çıkar; iki gündür kayıt
  girilmemişse panel uyarı gösterir.

Girdiğiniz her kaydın (ödev, soru, hata, deneme, hedef okul) yanında bir
**Düzenle** düğmesi vardır: form kartın yerinde açılır, mevcut değerlerle dolu
gelir, *Vazgeç* ile kapanır. Yanlış girilen bir veriyi silip yeniden girmeniz
gerekmez.

İki kullanıcı rolü vardır (veli ve öğrenci); ikisi de aynı verileri görebilir
ve girebilir. Ödev, soru, hata ve deneme kayıtlarının yanında kaydı kimin
girdiği rozet olarak yazar (*Veli ekledi* / *Öğrenci ekledi*), böylece iki
kişinin girişleri birbirine karışmaz.

## Teknolojiler

Next.js 15 (App Router, TypeScript) · Prisma + PostgreSQL · NextAuth (Credentials)
· Tailwind CSS · Recharts

## Kurulum

```bash
npm install
cp .env.example .env   # DATABASE_URL ve NEXTAUTH_SECRET değerlerini kendinize göre ayarlayın
npx prisma migrate dev
npm run dev
```

Yerelde çalışan bir PostgreSQL sunucusuna ihtiyacınız var; `DATABASE_URL`
bunu göstermelidir.

Uygulama http://localhost:3000 adresinde açılır.

Veritabanı seed işlemi (`prisma migrate dev`) sırasında otomatik çalışır ve
iki kullanıcı ile LGS müfredat konularını oluşturur:

| Kullanıcı adı | Şifre        | Rol      |
| ------------- | ------------ | -------- |
| `veli`        | `veli1234`   | Veli     |
| `ogrenci`     | `ogrenci1234`| Öğrenci  |

**Giriş yaptıktan sonra şifreleri değiştirmeniz önerilir** — uygulama
içindeki **Ayarlar** sayfasından yapabilirsiniz.

## Telefondan / Her Yerden Erişim (Railway ile Yayına Alma)

Bilgisayara ihtiyaç duymadan, tamamen telefon tarayıcısından, uygulamayı
internete açık bir adrese (ör. `lgs-takip-production.up.railway.app`)
yayınlayabilirsiniz. [Railway](https://railway.app) aylık ~$5 civarı bir
ücretle çalışır, GitHub'daki bu depoyu doğrudan bağlar ve her `git push`
sonrasında otomatik olarak yeniden yayınlar.

1. Telefonda [railway.app](https://railway.app) adresine gidin, **"Login with
   GitHub"** ile giriş yapın ve GitHub hesabınızı (bu depoyu içeren hesap)
   yetkilendirin.
2. **New Project → Deploy from GitHub repo** seçin, `asaygili/LgsTakip`
   deposunu seçin. İzin isterse Railway'e bu depoya erişim izni verin.
3. Servis oluşturulduktan sonra servisin **Settings** sekmesinde
   **Source → Branch** kısmından `claude/lgs-student-tracking-app-ci5l6u`
   branch'ini seçin (veya isterseniz önce bu branch'i `main`e birleştirip
   `main`i seçebilirsiniz).
4. Proje ekranında **"+ New" → "Database" → "PostgreSQL"** ile bir Postgres
   veritabanı ekleyin. (Kalıcı disk/volume ayarına gerek yoktur; fotoğraflar
   dahil tüm veriler bu veritabanında saklanır.)
5. **Variables** sekmesinden şu ortam değişkenlerini ekleyin:
   - `DATABASE_URL` → `${{Postgres.DATABASE_URL}}` (Railway'in Postgres
     servisine referans; servis adınız farklıysa ona göre yazın)
   - `NEXTAUTH_SECRET` → rastgele, uzun bir metin
   - `NEXTAUTH_URL` → şimdilik boş bırakın, 6. adımda dolduracağız
6. **Settings → Networking → Generate Domain** ile herkese açık bir adres
   oluşturun (`https://....up.railway.app` şeklinde). Bu adresi kopyalayıp
   5. adımdaki `NEXTAUTH_URL` değişkenine `https://` ile birlikte yapıştırın
   ve kaydedin.
7. Railway otomatik olarak `npm install`, `npm run build` ve
   `npm run start` komutlarını çalıştırıp uygulamayı ayağa kaldırır (build
   birkaç dakika sürebilir). `npm run start` içine gömülü olan
   `prisma migrate deploy` ve seed adımı sayesinde veritabanı tabloları ve
   `veli`/`ogrenci` kullanıcıları otomatik oluşur — elle bir komut
   çalıştırmanıza gerek yoktur.
8. Deploy tamamlanınca 6. adımdaki adresi telefonda açın, `veli` /
   `veli1234` ile giriş yapın. Ana ekrana kısayol eklemek için tarayıcı
   menüsünden "Ana ekrana ekle" seçeneğini kullanabilirsiniz.

Bundan sonra branch'e her yeni push yapıldığında (ben değişiklik ekleyip
push ettiğimde) Railway uygulamayı otomatik olarak yeniden yayınlar; siz
bir şey yapmanıza gerek kalmaz.

## Üretim (production) build — kendi sunucunuzda çalıştırmak isterseniz

```bash
npm run build
npm run start
```

`npm run start`, sunucuyu başlatmadan önce `prisma migrate deploy` ve
seed adımını otomatik çalıştırır.

## Karma testler

Bazı test kitapları bir testte birden fazla konuyu karışık sorar. Böyle bir
kaydı tek bir konuya bağlamak analizi yanıltır: 20 soruluk karma testteki 4
yanlışı tek konuya yazmak o konuyu haksız yere zayıf gösterir.

Bu yüzden kayıt **karma test** olarak işaretlenir. Soru sayıları, net, süre,
haftalık hedef ilerlemesi ve doğruluk oranı gibi her şey normal işler; kayıt
yalnızca **Zayıf Konu Radarı** ve konu bazlı yanlış dağılımına girmez. Analiz
sayfası kaç karma test kaydı olduğunu ve kaç soru içerdiğini yazar, böylece
dışarıda kalan hacim görünür olur.

Karma testteki yanlışların hangi konudan geldiğini biliyorsanız **Hatalar**
sayfasına tek tek girin: orada konu ve neden birlikte tutulur ve radarda
yanlış sayısına göre 3 kat ağırlık taşır.

## Haftalık hedefler nasıl sayılır?

Hafta **pazartesi 00:00'da başlar, pazar 23:59'da biter**; pazar gece yarısını
geçince sayaçlar sıfırdan başlar. Sunucu (Railway) UTC saatiyle çalıştığı için
hafta sınırları `src/lib/week.ts` içinde açıkça `Europe/Istanbul` saatine göre
hesaplanır — yani hedefin ne zaman sıfırlanacağı sunucunun bulunduğu bölgeye
göre kaymaz.

"Bu hafta" ifadesi uygulamanın her yerinde bu pazartesi–pazar penceresini
gösterir. Paneldeki *Son 7 Gün Soru Trendi* grafiği ise adı üstünde son yedi
günü gösterir; ikisi kasıtlı olarak farklıdır.

## Veri modeli

Tüm veriler PostgreSQL veritabanında tutulur. Ödev fotoğrafları da diskte
değil, veritabanında (`HomeworkPhoto.data`) saklanır ve `/api/photos/<id>`
adresi üzerinden yalnızca giriş yapmış kullanıcılara sunulur. Bu sayede
uygulama kalıcı disk (volume) yapılandırması gerektirmez; yeniden
başlatmalarda hiçbir veri kaybolmaz.

Fotoğraf başına en fazla 8MB, tek istekte en fazla 20MB kabul edilir
(`next.config.mjs` → `serverActions`).

## Sonraki adımlar için öneriler

- **Bildirim/hatırlatma**: tamamlanmamış ödevler için e-posta veya push
  bildirimi (panel içi uyarı hâlihazırda var)
- Konu bazlı **net/doğruluk trend grafiği** (tek bir konuda zaman içinde
  gelişim)
- Aylık hedef ve seri (streak) takibi
- Tek bir konunun zaman içindeki doğruluk değişimi
- Öğrenci ve veli için ayrı görünümler (ör. öğrenci sadece kendi girişini
  yapabilsin, veli tüm geçmişi görsün)
- Verileri **dışa aktarma** (CSV/PDF) — veliyle veya özel derslerle
  paylaşmak için
