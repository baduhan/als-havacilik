# Güvenlik özeti

Kapsam: Express uygulaması + yönetim paneli. Her sürümde otomatik test paketi çalıştırıldı (116 denetim, hepsi geçti).

| Alan | Önlem | Test edildi |
|---|---|---|
| Kimlik doğrulama | Üretimde ≥10 karakterli `ADMIN_PASS` zorunlu; sabit-zamanlı karşılaştırma; 8 saat oturum; HttpOnly + SameSite=Strict + Secure çerez | ✓ |
| Kaba kuvvet | IP başına 5 deneme / 15 dk (proxy arkasında `TRUST_PROXY=1`) | ✓ |
| CSRF | Her yazma isteğinde oturuma bağlı jeton + Origin/Referer aynı-site zorunluluğu | ✓ (jetonsuz, yanlış jeton, yabancı/boş Origin) |
| XSS | Tüm çıktılar kaçışlı; CSP `script-src 'self'` (satır içi betik yok); `javascript:`/`data:`/`//` bağlantılar reddedilir | ✓ (form, yazı, ayarlar, yedek geri yükleme) |
| Yükleme | Yalnızca JPG/PNG/WebP, sihirli bayt kontrolü, rastgele ad, SVG/HTML yok, boyut ve adet sınırı, `nosniff` | ✓ |
| Yol atlatma | Statik klasör yalnızca `public/`; kaynak kod, `data/`, `.env` erişilemez | ✓ (20 yol) |
| Girdi | Gövde boyut sınırları (413), alan uzunluk kırpma, dizi/nesne parametreleri kapalı (`extended:false`), yedek geri yükleme şemaya göre yeniden kurulur | ✓ |
| Başlıklar | CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, HSTS (üretimde) | ✓ |
| Form kötüye kullanımı | Honeypot, onay kutusu, 5/saat IP sınırı | ✓ |
| Bağımlılıklar | Tek bağımlılık: express; `npm audit` 0 açık | ✓ |

## Bilinen sınırlar
- Oturumlar bellekte tutulur; sunucu yeniden başlayınca çıkış yapılır (tek kullanıcılı demo için kabul edilebilir).
- Tek yönetici parolası; iki adımlı doğrulama yok.
- Talep formunda CAPTCHA yok (honeypot + hız sınırı var); yoğun spam için eklenmeli.
- Dış penetrasyon testi yapılmadı; bu, kendi yazdığım otomatik saldırı senaryolarıdır.
