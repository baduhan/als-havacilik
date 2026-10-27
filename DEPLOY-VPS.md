# ALS Havacılık: Yayına Alma Rehberi (VPS + Docker + otomatik HTTPS)

## 0) Gerekenler
- Bir VPS (Ubuntu 22.04/24.04, 1 GB RAM yeter) ve alan adı.
- Alan adında A kaydı: `alshavacilik.com` ve `www` → VPS'in IP adresi. (Yayılması 5 dk - birkaç saat sürebilir.)

## 1) Sunucuyu hazırla (bir kez)
    ssh root@SUNUCU_IP
    apt update && apt upgrade -y
    curl -fsSL https://get.docker.com | sh
    ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw --force enable

## 2) Siteyi yükle
Bilgisayarından (zip'in olduğu klasörde):
    scp als-havacilik.zip root@SUNUCU_IP:/opt/
Sunucuda:
    cd /opt && apt install -y unzip && unzip als-havacilik.zip && cd als-havacilik
    cp .env.example .env && nano .env        # DOMAIN, SITE_URL ve ADMIN_PASS'i doldur
    mkdir -p storage/data storage/uploads && chown -R 1000:1000 storage

## 3) Başlat
    docker compose up -d --build
    docker compose ps            # app ve caddy "running/healthy" olmalı
    docker compose logs -f caddy # sertifika alındığını görürsün (Ctrl+C ile çık)
Tarayıcıda `https://alshavacilik.com` ve `https://alshavacilik.com/admin` aç.

## 4) Yayına alma sonrası kontrol
- [ ] Site HTTPS ile açılıyor, `http://` otomatik `https://` e yönleniyor
- [ ] /admin'e yeni parolayla giriliyor (parola .env içindeki ADMIN_PASS)
- [ ] Panelden telefon, e-posta, adres ve görselleri gir; 3 dili doldur
- [ ] Test teklif talebi gönder, "Talepler" sayfasında görünüyor
- [ ] /sitemap.xml ve /robots.txt açılıyor; sitemap'i Google Search Console'a ekle
- [ ] /privacy metnini hukukçuna okut (saklama süresi, iletişim bilgisi doğru mu)

## 5) Yedek (önemli)
    crontab -e
    0 3 * * * /opt/als-havacilik/backup.sh
Yedekleri başka bir yere de kopyala (kendi bilgisayarına): 
    scp root@SUNUCU_IP:/opt/als-havacilik/backups/*.tar.gz ./yedekler/

## 6) Güncelleme
Yeni sürüm zip'ini aynı klasörün üzerine aç (`storage/` ve `.env` silinmez), sonra:
    ./backup.sh && docker compose up -d --build

## Sorun giderme
- Sertifika alınmıyor → DNS A kaydı doğru mu? 80/443 açık mı? `docker compose logs caddy`
- Yüklenen görsel kaydedilemiyor → `chown -R 1000:1000 storage`
- Parolayı değiştirmek → `.env` düzenle, `docker compose up -d`
- Loglar → `docker compose logs -f app`

## Docker kullanmadan (alternatif)
Node 20 kur, `npm ci --omit=dev`, ortam değişkenlerini ver (NODE_ENV=production, ADMIN_PASS, TRUST_PROXY=1,
SITE_URL), `pm2 start server.js --name als` ile çalıştır, önüne Caddy/Nginx ile HTTPS kur.
