# ALS Havacılık Web Sitesi

## Local çalıştırma
    npm install
    npm start
Site: http://localhost:3000  |  Panel: /admin (local'de varsayılan parola: als2026)
Diller: / (TR), /en/ (EN), /es/ (ES)

## Yayına alma (production) kontrol listesi
1. Ortam değişkenleri (zorunlu):
       NODE_ENV=production
       ADMIN_PASS=en-az-10-karakterlik-guclu-parola   (yoksa sunucu açılmaz)
       TRUST_PROXY=1     (Nginx/Caddy/Cloudflare arkasındaysan)
2. Mutlaka HTTPS kullan (Caddy en kolayı, otomatik sertifika). Node'u doğrudan 80/443'e açma;
   proxy arkasında 3000 portunda, root olmayan bir kullanıcıyla çalıştır (pm2 veya systemd).
3. KALICI DİSK: `data/` ve `public/uploads/` klasörleri kalıcı olmalı. Render/Railway/Heroku gibi
   servislerde disk geçicidir, içerik ve görseller her deploy'da silinir; Volume/Disk ekle ya da VPS kullan.
4. Yedek: `data/content.json` ve `public/uploads/` klasörünü düzenli yedekle.
5. Yayından önce: gizlilik/çerez metni (KVKK/GDPR), Google Fonts'u kendi sunucuna alma (IP paylaşımı).
6. Parolayı değiştirdiğinde sunucuyu yeniden başlat; oturumlar 8 saat sonra kendiliğinden düşer.

## Bilinen sınırlar
- Tek yönetici parolası var (kullanıcı hesabı yok). Rate limit ve oturumlar bellekte tutulur,
  sunucu yeniden başlayınca sıfırlanır. Birden fazla sunucu örneğiyle çalıştırma.
- Veri JSON dosyasında; yoğun trafik / çok yazan kullanıcı için SQLite/PostgreSQL'e geçilmeli.

## Önbellek ve varlıklar
- CSS/JS dosyaları `?v=<değişiklik zamanı>` ile yüklenir; dosya değişince tarayıcı otomatik yenisini alır (eski/bozuk görünüm sorunu olmaz).
- Yazı tipleri (`public/fonts`), akıcı kaydırma (`public/vendor/lenis.min.js`, MIT) ve dünya haritası (`public/map-dots.svg`, `map.json`) projeyle birlikte gelir; dış bağlantı gerekmez.
- Admin varsayılan parolası yalnızca yerelde geçerlidir; yayında `ADMIN_PASS` zorunludur.

## Yönetim paneli
`/admin` — Panel (özet), Site içeriği (6 bölüm × 3 dil, satır satır düzenleyici, görsel yükleme), Haberler/yazılar (taslak/yayın), Gelen talepler (okundu/yanıtla/sil), Yedek ve yardım (indir/geri yükle). Tüm yazma işlemleri oturum + CSRF jetonu + aynı-site kontrolü ister.

## Yayın
Ücretsiz: `DEPLOY.md` (Render). Kendi sunucunuz: `DEPLOY-VPS.md`. Güvenlik testleri `SECURITY.md` içinde.
