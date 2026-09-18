#!/usr/bin/env sh
# Üretimde uygulamayı başlatır. Yeni oluşturulan bir veritabanı (ör. Railway'de
# Postgres) ilk deploy sırasında birkaç saniye geç hazır olabildiği için
# migration adımı birkaç kez denenir. Tüm denemeler başarısız olsa bile sunucu
# yine de başlatılır; böylece konteyner ölü kalmak yerine loglarda net bir hata
# gösterir.

set -e

echo "[start] Prisma Client üretiliyor..."
npx prisma generate

MIGRATED=0
ATTEMPT=1
MAX_ATTEMPTS=10

while [ "$ATTEMPT" -le "$MAX_ATTEMPTS" ]; do
  echo "[start] Migration uygulanıyor (deneme $ATTEMPT/$MAX_ATTEMPTS)..."
  if npx prisma migrate deploy; then
    MIGRATED=1
    break
  fi
  echo "[start] Veritabanına bağlanılamadı. 3 saniye sonra tekrar denenecek."
  ATTEMPT=$((ATTEMPT + 1))
  sleep 3
done

if [ "$MIGRATED" -eq 1 ]; then
  echo "[start] Migration tamam, seed çalıştırılıyor..."
  npm run prisma:seed || echo "[start] UYARI: seed başarısız oldu, devam ediliyor."
else
  echo "[start] HATA: Veritabanına bağlanılamadı. DATABASE_URL değerini kontrol edin."
  echo "[start] Sunucu yine de başlatılıyor (uygulama veritabanı olmadan hata verecektir)."
fi

echo "[start] Next.js sunucusu başlatılıyor..."
exec npx next start
