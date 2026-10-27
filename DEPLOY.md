# Ücretsiz yayına alma (demo site) — Render + GitHub

Maliyet: 0 TL. Kredi kartı gerekmez. Süre: ~10 dakika. Sonuç: `https://<ad>.onrender.com` adresinde HTTPS'li site.

## Ne beklemeli? (dürüst özet)
- **Uyku modu:** 15 dk ziyaretçi olmazsa site uyur; ilk açılış ~30–60 sn sürer. Demo için sorun değil.
- **Kalıcı olmayan disk:** Ücretsiz planda sunucu yeniden başlayınca (uyku, yeni yayın) panelden yaptığınız değişiklikler ve yüklenen görseller **silinir**. Site, projeyle gelen haline döner.
  - Çözüm: İçeriği **yerelde** panelden düzenleyin → `data/content.json` ve `public/uploads/` içeriğini GitHub'a gönderin → Render otomatik yeniden yayınlar. Panel canlıda da çalışır ama kalıcı değildir (bkz. "Yedek" bölümü).
- Talep formu mesajları da aynı nedenle kalıcı değildir. Gerçek kullanımda e-posta bildirimi veya kalıcı disk (ücretli) gerekir.

## 1) Kodu GitHub'a koyun
1. github.com'da hesap açın → **New repository** (Private seçebilirsiniz) → ad: `als-havacilik`.
2. Bilgisayarınızda proje klasöründe (`node_modules` gitmez, `.gitignore` bunu engeller):
```bash
git init && git add . && git commit -m "ilk sürüm"
git branch -M main
git remote add origin https://github.com/KULLANICI/als-havacilik.git
git push -u origin main
```
3. **Önemli:** Göndermeden önce istediğiniz içeriği yerelde panelden hazırlayın (`npm start` → http://localhost:3000/admin, yerel parola `als2026`). Görselleri yüklediyseniz `.gitignore` içindeki şu iki satırı silin ki GitHub'a gitsinler:
   `public/uploads/*` ve `!public/uploads/.keep`.

## 2) Render'da yayınlayın
1. render.com → GitHub ile giriş.
2. **New → Blueprint** → deponuzu seçin → `render.yaml` otomatik okunur → **Apply**.
3. İlk yayın 2–4 dk sürer. Bitince üstte site adresi çıkar.
4. **Yönetici parolası:** servis sayfası → **Environment** → `ADMIN_PASS` değerini kopyalayın (Render rastgele üretti). Panel: `https://<adres>/admin`.
5. (İsteğe bağlı) Environment'a `SITE_URL` = `https://<adres>` ekleyin (sitemap/SEO için).

Alternatif (Blueprint olmadan): New → Web Service → Build `npm ci --omit=dev`, Start `node server.js`, Plan Free, ortam değişkenleri: `NODE_ENV=production`, `TRUST_PROXY=1`, `ADMIN_PASS=<en az 10 karakter>`.

## 3) Yayın sonrası kontrol listesi
- [ ] `https://<adres>/healthz` → `ok`
- [ ] Ana sayfa, `/en/`, `/es/`, `/about`, `/careers`, `/news` açılıyor
- [ ] `/admin` parola istiyor; yanlış parola 5 denemeden sonra kilitleniyor
- [ ] Talep formunu doldurup gönderin → panelde "Gelen talepler"de görünüyor
- [ ] Telefondan açıp menüyü deneyin

## 4) Yedek ve içeriği kalıcı yapmak
- Panel → **Yedek ve yardım → Yedeği indir** (JSON). Yeni sunucuda aynı sayfadan geri yükleyin.
- Kalıcı yayın için: indirdiğiniz dosyayı `data/content.json` olarak projeye koyup GitHub'a gönderin.

## 5) Güncelleme
Kodu/içeriği değiştirin → `git add . && git commit -m "güncelleme" && git push` → Render otomatik yayınlar.

## Güvenlik notları
- `ADMIN_PASS` yalnızca Render'daki ortam değişkenidir; koda yazmayın, GitHub'a göndermeyin (`.env` zaten `.gitignore`'da).
- Üretimde (NODE_ENV=production) parola yoksa veya 10 karakterden kısaysa sunucu **başlamaz**.
- Demo siteyi arama motorlarına açmak istemiyorsanız panel dışında bir şey gerekmez; `/admin` zaten `noindex`.
- Gizlilik metni örnektir; gerçek kullanımda hukuki kontrol gerekir.

## Diğer ücretsiz seçenekler
| Seçenek | Not |
|---|---|
| Render (önerilen) | Yukarıdaki rehber; Node desteği tam, kart istemez |
| Koyeb / Railway | Ücretsiz katman değişken; kalıcı disk yok/ücretli |
| Fly.io | Kart ister |
| GitHub Pages / Netlify (statik) | Admin paneli ve form çalışmaz; yalnızca vitrin |

Kendi sunucunuz (VPS + Docker + otomatik HTTPS) için: `DEPLOY-VPS.md`.
