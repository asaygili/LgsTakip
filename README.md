# LGS Takip

LGS'ye hazırlanan bir öğrencinin günlük çalışmasını (ödevler, çözülen sorular,
hatalar, konu ilerlemesi ve deneme sınavı sonuçları) veli ve öğrencinin
birlikte takip edebildiği basit bir web uygulaması.

## Özellikler

- **Panel**: Bugün/bu hafta çözülen soru sayısı, bekleyen ödev sayısı,
  öğrenilen konu oranı, son 7 günün soru trendi grafiği, en çok hata yapılan
  konular ve yaklaşan ödevler.
- **Ödevler**: Ders/konu bazında ödev ekleme, durumu güncelleme (bekliyor /
  devam ediyor / tamamlandı), son tarih takibi.
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

## Üretim (production) build

```bash
npm run build
npm run start
```

## Veri modeli

Veriler `prisma/dev.db` adlı yerel bir SQLite dosyasında tutulur (bu dosya
git'e dahil edilmez). Aile içi kullanım için yeterlidir; ileride birden çok
cihazdan/uzaktan erişim gerekirse `DATABASE_URL` değiştirilerek Postgres gibi
gerçek bir sunucu veritabanına kolayca geçilebilir (Prisma şeması taşınabilir
şekilde yazılmıştır).

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
