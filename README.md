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
  (telefonda doğrudan kamerayı açar).
- **Sorular**: Günlük çözülen soruları ders/konu bazında doğru/yanlış/boş
  olarak kaydetme, net hesaplama, süre ve not ekleme.
- **Hatalar**: Yanlış yapılan soruları nedeniyle (bilgi eksiği, dikkatsizlik,
  zaman yetersizliği, soruyu yanlış anlama, işlem hatası, diğer) kaydetme ve
  giderildi olarak işaretleme.
- **Konular**: LGS müfredatına göre (Türkçe, Matematik, Fen Bilimleri, T.C.
  İnkılap Tarihi, Din Kültürü, İngilizce) konu listesi ve her konunun
  öğrenilme durumu (başlanmadı / öğreniliyor / tekrar gerekli / öğrenildi).
- **Denemeler**: Deneme sınavı sonuçlarını ders bazında kaydetme, net
  hesaplama ve geçmiş sonuçları listeleme.

İki kullanıcı rolü vardır (veli ve öğrenci); ikisi de aynı verileri görebilir
ve girebilir.

## Teknolojiler

Next.js 14 (App Router, TypeScript) · Prisma + SQLite · NextAuth (Credentials)
· Tailwind CSS · Recharts

## Kurulum

```bash
npm install
cp .env.example .env   # gerekirse NEXTAUTH_SECRET değerini değiştirin
npx prisma migrate dev --name init
npm run dev
```

Uygulama http://localhost:3000 adresinde açılır.

Veritabanı seed işlemi (`prisma migrate dev`) sırasında otomatik çalışır ve
iki kullanıcı ile LGS müfredat konularını oluşturur:

| Kullanıcı adı | Şifre        | Rol      |
| ------------- | ------------ | -------- |
| `veli`        | `veli1234`   | Veli     |
| `ogrenci`     | `ogrenci1234`| Öğrenci  |

**Giriş yaptıktan sonra şifreleri değiştirmeniz önerilir.** Şu an için
şifre değiştirme ekranı yoktur; gerekirse veritabanında `User.passwordHash`
alanını `bcryptjs` ile hash'lenmiş yeni bir değerle güncelleyebilir ya da
`prisma/seed.ts` dosyasındaki şifreleri değiştirip seed'i tekrar
çalıştırabilirsiniz (`npm run prisma:seed`).

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
4. Aynı **Settings** sekmesinde **Volumes → New Volume** ile kalıcı bir disk
   ekleyin, **Mount path** olarak `/data` yazın. (Bu adım çok önemli: volume
   eklemezseniz her yeni yayında veriler ve fotoğraflar silinir.)
5. **Variables** sekmesinden şu ortam değişkenlerini ekleyin:
   - `DATABASE_URL` → `file:/data/app.db`
   - `UPLOADS_DIR` → `/data/uploads`
   - `NEXTAUTH_SECRET` → rastgele, uzun bir metin (bana "bir NEXTAUTH_SECRET
     üret" diyebilirsiniz, ya da telefonda rastgele 40 karakterlik bir metin
     yazabilirsiniz)
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

## Veri modeli

Veriler `prisma/dev.db` adlı yerel bir SQLite dosyasında tutulur (bu dosya
git'e dahil edilmez). Aile içi kullanım için yeterlidir; ileride birden çok
cihazdan/uzaktan erişim gerekirse `DATABASE_URL` değiştirilerek Postgres gibi
gerçek bir sunucu veritabanına kolayca geçilebilir (Prisma şeması taşınabilir
şekilde yazılmıştır).

Ödev fotoğrafları `UPLOADS_DIR` ortam değişkeninin gösterdiği klasöre
(yerelde varsayılan olarak `data/uploads/`, Railway'de `/data/uploads`)
kaydedilir ve `/api/photos/...` adresi üzerinden, yalnızca giriş yapmış
kullanıcılara sunulur. Bu klasör de git'e dahil edilmez; kalıcı olması için
mutlaka bir disk/volume üzerinde olmalıdır (bkz. yukarıdaki Railway adımı 4).
Fotoğraf başına en fazla 8MB, tek istekte en fazla 20MB kabul edilir
(`next.config.mjs` → `serverActions`).

## Sonraki adımlar için öneriler

- Haftalık/aylık **hedef belirleme** (ör. haftada 500 soru, deneme netinde X
  hedefi) ve panelde hedefe göre ilerleme çubuğu
- **Bildirim/hatırlatma**: tamamlanmamış ödevler veya birkaç gündür kayıt
  girilmemiş dersler için uyarı
- Konu bazlı **net/doğruluk trend grafiği** (bir konuda zaman içinde gelişim)
- Öğrenci ve veli için ayrı görünümler (ör. öğrenci sadece kendi girişini
  yapabilsin, veli tüm geçmişi görsün)
- Verileri **dışa aktarma** (CSV/PDF) — veliyle veya özel derslerle
  paylaşmak için
