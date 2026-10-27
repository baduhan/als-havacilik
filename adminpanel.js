/* Yönetim paneli (Türkçe arayüz). server.js'ten çağrılır: require('./adminpanel')(app, H) */
const fs = require('fs'), path = require('path'), crypto = require('crypto'), express = require('express');

module.exports = (app, H) => {
  const { raw, save, e, shell, A, vu, same, limit, lines, unl, pk, slug, fmt, LANGS, SH, PROD, PASS, UP } = H;
  const LN = { tr: 'Türkçe', en: 'English', es: 'Español' };
  const sess = new Map(), SECRET = crypto.randomBytes(32);
  const sid = q => { const m = (q.headers.cookie || '').match(/(?:^|;\s*)sid=(\w+)/); return m && m[1]; };
  const tok = s => crypto.createHmac('sha256', SECRET).update(s).digest('hex').slice(0, 32);
  const now = () => Date.now();
  const clip = (v, n) => String(Array.isArray(v) ? '' : v ?? '').replace(/\r/g, '').slice(0, n);

  /* ---------- oturum ve CSRF ---------- */
  const auth = (q, r, n) => {
    const s = sid(q), x = s && sess.get(s);
    if (x && x > now()) { q.sid = s; r.locals = { csrf: tok(s) }; return n(); }
    if (s) sess.delete(s);
    r.redirect('/admin/login');
  };
  // Giriş dışındaki her POST: kaynak (Origin/Referer) aynı site olmalı + CSRF jetonu geçerli olmalı
  const sameSite = q => {
    const o = q.headers.origin || q.headers.referer;
    if (!o) return false;
    try { return new URL(o).host === q.headers.host; } catch { return false; }
  };
  app.use('/admin', (q, r, n) => {
    if (q.method === 'POST' && !sameSite(q)) return r.status(403).send('Geçersiz istek kaynağı');
    n();
  });
  const csrf = (q, r, n) => {
    const t = (q.body && q.body._csrf) || q.headers['x-csrf'] || '';
    if (!q.sid || !same(t, tok(q.sid))) return r.status(403).send('Oturum süresi dolmuş olabilir. Sayfayı yenileyip tekrar deneyin.');
    n();
  };
  const post = (p, ...h) => app.post(p, auth, express.urlencoded({ extended: false, limit: '300kb' }), csrf, ...h);
  const ctok = r => `<input type="hidden" name="_csrf" value="${r.locals.csrf}">`;

  /* ---------- giriş / çıkış ---------- */
  const loginPage = (err, locked) => shell('Giriş', `<div class="lg"><form class="lc" method="post" action="/admin/login">
    <div class="lb"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l8 16-8-4-8 4z"/></svg> Yönetim paneli</div>
    <h1>Hoş geldiniz</h1><p class="mut">Siteyi yönetmek için parolanızı girin.</p>
    <label>Parola<input type="password" name="pass" autocomplete="current-password" autofocus required></label>
    ${err ? '<p class="al err">Parola hatalı.</p>' : ''}${locked ? '<p class="al err">Çok fazla deneme. 15 dakika sonra tekrar deneyin.</p>' : ''}
    <button class="btn pri wide">Giriş yap</button><a class="mut sm" href="/">← Siteye dön</a></form></div>`, 'adm login');
  app.get('/admin/login', (q, r) => r.send(loginPage(q.query.err)));
  app.post('/admin/login', express.urlencoded({ extended: false, limit: '10kb' }), (q, r) => {
    if (!sameSite(q)) return r.status(403).send('Geçersiz istek kaynağı');
    if (!limit('login' + q.ip, 5, 15 * 6e4)) return r.status(429).send(loginPage(false, true));
    if (!same(clip(q.body.pass, 200), PASS)) return r.redirect('/admin/login?err=1');
    for (const [k, v] of sess) if (v < now()) sess.delete(k);
    if (sess.size > 50) sess.delete(sess.keys().next().value);
    const id = crypto.randomBytes(24).toString('hex');
    sess.set(id, now() + 8 * 36e5);
    r.setHeader('Set-Cookie', `sid=${id}; HttpOnly; Path=/; SameSite=Strict; Max-Age=28800${PROD ? '; Secure' : ''}`);
    r.redirect('/admin');
  });
  post('/admin/logout', (q, r) => {
    sess.delete(q.sid);
    r.setHeader('Set-Cookie', 'sid=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict');
    r.redirect('/admin/login');
  });

  /* ---------- içerik tanımı ---------- */
  const F = {
    name: ['Şirket adı', 't', 'Logoda, sekme başlığında ve altbilgide görünür.'],
    tagline: ['Slogan', 't', 'Logonun altında ve sayfa başlıklarında kısa bir cümle.'],
    phone: ['Telefon', 't', 'İletişim bölümü ve altbilgi.'], email: ['E-posta', 't', 'Talep formu yanıtları ve iletişim bölümü.'],
    address: ['Adres', 't', ''], linkedin: ['LinkedIn bağlantısı', 'u', 'https://… ile başlayan tam adres. Boşsa buton gizlenir.'],
    instagram: ['Instagram bağlantısı', 'u', 'https://… ile başlayan tam adres. Boşsa buton gizlenir.'],
    heroTitle: ['Ana başlık', 't', 'Ana sayfanın en üstündeki büyük başlık (slayt yoksa).'], heroText: ['Ana başlık metni', 'a', ''],
    heroImage: ['1. slayt görseli', 'i', 'Geniş (en az 1600 px) bir fotoğraf önerilir. Boşsa hazır çizim görünür.'], heroImage2: ['2. slayt görseli', 'i', ''], heroImage3: ['3. slayt görseli', 'i', ''],
    bannerTitle: ['Çağrı bandı başlığı', 't', 'Sayfa altındaki mavi bandın başlığı.'], bannerText: ['Çağrı bandı metni', 'a', ''],
    fuelTitle: ['Yakıt bölümü başlığı', 't', ''], fuelText: ['Yakıt bölümü metni', 'a', ''], fuelImage: ['Yakıt görseli', 'i', ''],
    charterTitle: ['Jet kiralama başlığı', 't', ''], charterText: ['Jet kiralama metni', 'a', ''], charterImage: ['Jet kiralama görseli', 'i', ''],
    aboutTitle: ['Ana sayfa kurumsal başlık', 't', ''], about: ['Ana sayfa kurumsal metin', 'a', ''], aboutImage: ['Kurumsal görsel', 'i', ''],
    whoTitle: ['"Biz kimiz" başlığı', 't', ''], whoText: ['"Biz kimiz" metni', 'a', 'Paragraflar arasında boş satır bırakın.'],
    mission: ['Misyon', 'a', ''], vision: ['Vizyon', 'a', ''],
    mapTitle: ['Dünya ağı başlığı', 't', 'Harita bölümünün başlığı.'], mapText: ['Dünya ağı metni', 'a', ''],
    careerTitle: ['Kariyer başlığı', 't', ''], careerText: ['Kariyer metni', 'a', '']
  };
  const L = {
    slides: ['Ana sayfa slaytları', 3, ['Başlık', 'Alt başlık', 'Bağlantı (#hizmetler, #filo, /about…)'], 'Her satır bir slayt. En fazla 3–4 slayt önerilir.'],
    stats: ['Rakamlar', 2, ['Değer (ör. 120+)', 'Açıklama'], 'Ana sayfadaki sayaç şeridi.'],
    services: ['Hizmetler', 2, ['Başlık', 'Açıklama'], 'Ana sayfadaki numaralı hizmet listesi.'],
    fleet: ['Filo', 4, ['Kategori', 'Model', 'Kapasite', 'Menzil'], 'Kaydırılabilir jet kartları.'],
    values: ['Değerler / güçlü yönler', 2, ['Başlık', 'Açıklama'], ''],
    perks: ['Neden bizimle çalışmalısınız?', 2, ['Başlık', 'Açıklama'], ''],
    jobs: ['Açık pozisyonlar', 3, ['Pozisyon', 'Yer', 'Tür (Tam zamanlı…)'], 'Boş bırakırsanız "açık pozisyon yok" mesajı görünür.']
  };
  const G = [
    ['genel', 'Genel bilgiler', 'Şirket adı, iletişim ve sosyal medya', '/', ['name', 'tagline', 'phone', 'email', 'address', 'linkedin', 'instagram']],
    ['anasayfa', 'Ana sayfa', 'Üstteki slayt, görseller, rakamlar ve çağrı bandı', '/', ['heroTitle', 'heroText', 'heroImage', 'heroImage2', 'heroImage3', 'L:slides', 'L:stats', 'bannerTitle', 'bannerText']],
    ['hizmetler', 'Hizmetler', 'Yakıt ve jet kiralama bölümleri', '/#hizmetler', ['fuelTitle', 'fuelText', 'fuelImage', 'charterTitle', 'charterText', 'charterImage', 'L:services']],
    ['filo', 'Filo', 'Jet modelleri ve dünya ağı haritası metni', '/#filo', ['L:fleet', 'mapTitle', 'mapText']],
    ['kurumsal', 'Kurumsal', '"Biz kimiz", misyon, vizyon ve değerler', '/about', ['aboutTitle', 'about', 'aboutImage', 'whoTitle', 'whoText', 'mission', 'vision', 'L:values']],
    ['kariyer', 'Kariyer', 'Kariyer sayfası ve açık pozisyonlar', '/careers', ['careerTitle', 'careerText', 'L:perks', 'L:jobs']]
  ];
  const MSG = { saved: 'Değişiklikler kaydedildi.', post: 'Yazı kaydedildi.', del: 'Silindi.', restored: 'Yedek geri yüklendi.', read: 'Güncellendi.' };

  /* ---------- parçalar ---------- */
  const unread = d => d.messages.filter(m => !m.read).length;
  const IC = {
    home: '<path d="M3 11l9-8 9 8M5 10v10h14V10"/>', doc: '<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7"/>', pen: '<path d="M4 20h4L20 8l-4-4L4 16zM14 6l4 4"/>',
    mail: '<path d="M3 6h18v12H3zM3 7l9 7 9-7"/>', save: '<path d="M5 3h12l2 2v16H5zM8 3v6h8V3M8 21v-7h8v7"/>', ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>', out: '<path d="M9 4H4v16h5M16 8l4 4-4 4M20 12H9"/>'
  };
  const ic = n => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${IC[n]}</svg>`;
  const layout = (act, title, inner, r, ok, d) => {
    const n = unread(d || raw());
    const lk = (id, href, label, icn, extra = '') => `<a href="${href}"${act === id ? ' class="on"' : ''}>${ic(icn)}<span>${label}</span>${extra}</a>`;
    return shell(title + ' · Yönetim', `<div class="app" data-csrf="${r.locals.csrf}">
<header class="mb"><button class="mbtn" aria-label="Menü" aria-expanded="false"><i></i><i></i><i></i></button><b>Yönetim paneli</b><a class="sm" href="/" target="_blank" rel="noopener">Siteyi gör</a></header>
<aside id="side"><div class="brand">Yönetim paneli</div>
<nav>${lk('home', '/admin', 'Panel', 'home')}
<div class="gl">Site içeriği</div>
${G.map(g => `<a class="sub${act === 'c-' + g[0] ? ' on' : ''}" href="/admin/content?g=${g[0]}">${g[1]}</a>`).join('')}
<div class="gl">Yayın</div>
${lk('posts', '/admin/posts', 'Haberler / yazılar', 'pen')}
${lk('msg', '/admin/messages', 'Gelen talepler', 'mail', n ? `<em class="bd">${n}</em>` : '')}
${lk('backup', '/admin/backup', 'Yedek ve yardım', 'save')}</nav>
<div class="sf"><a href="/" target="_blank" rel="noopener">${ic('ext')}<span>Siteyi aç</span></a>
<form method="post" action="/admin/logout">${ctok(r)}<button class="lo">${ic('out')}<span>Çıkış yap</span></button></form></div></aside>
<main>${ok && MSG[ok] ? `<div class="toast" role="status">${MSG[ok]}</div>` : ''}${inner}</main></div><script src="${A('admin.js')}" defer></script>`, 'adm', '');
  };
  const langTabs = (base, l, extra = '') => `<div class="lt">${LANGS.map(k => `<a href="${base}${base.includes('?') ? '&' : '?'}l=${k}${extra}"${k === l ? ' class="on"' : ''}>${LN[k]}</a>`).join('')}</div>`;

  const field = (k, v, l) => {
    const [label, t, hint] = F[k], h = hint ? `<small>${e(hint)}</small>` : '';
    if (t === 'a') return `<label class="f">${label}${h}<textarea name="${k}" rows="4" maxlength="3000">${e(v)}</textarea></label>`;
    if (t === 'i') return `<div class="f img"><span class="lbl">${label}</span>${h}<div class="up"><div class="pv${v ? '' : ' empty'}">${v ? `<img src="${e(v)}" alt="">` : '<span>Görsel yok</span>'}</div>
<div class="uc"><input name="${k}" value="${e(v)}" placeholder="Görsel yükleyin veya adres yapıştırın" maxlength="500"><div class="ub"><label class="btn sec">Görsel yükle<input type="file" accept="image/jpeg,image/png,image/webp" data-up hidden></label><button type="button" class="btn ghost" data-clear>Kaldır</button></div><small class="us"></small></div></div></div>`;
    return `<label class="f">${label}${h}<input name="${k}" value="${e(v)}" maxlength="300"${t === 'u' ? ' placeholder="https://"' : ''}></label>`;
  };
  const list = (k, items) => { const [t, n, cols, hint] = L[k]; return `<div class="f rep"><span class="lbl">${t}</span>${hint ? `<small>${hint}</small>` : ''}<textarea name="${k}" rows="4" data-rep='${e(JSON.stringify(cols))}'>${e(unl(items, n))}</textarea></div>`; };

  /* ---------- panel (özet) ---------- */
  app.get('/admin', auth, (q, r) => {
    const d = raw(), pub = d.posts.filter(p => p.status === 'published').length, un = unread(d);
    const recent = d.messages.slice(0, 4);
    r.send(layout('home', 'Panel', `<h1>Hoş geldiniz</h1><p class="mut lead">Siteyi buradan yönetirsiniz. Değişiklikler kaydettiğiniz anda sitede görünür.</p>
<div class="cards">
<a class="stat" href="/admin/messages"><b>${un}</b><span>Okunmamış talep</span><small>Toplam ${d.messages.length}</small></a>
<a class="stat" href="/admin/posts"><b>${pub}</b><span>Yayında yazı</span><small>${d.posts.length - pub} taslak</small></a>
<a class="stat" href="/" target="_blank" rel="noopener"><b>3</b><span>Dil</span><small>Türkçe · English · Español</small></a></div>
<h2>Ne yapmak istiyorsunuz?</h2>
<div class="qa">${G.map(g => `<a href="/admin/content?g=${g[0]}"><b>${g[1]}</b><span>${g[2]}</span></a>`).join('')}
<a href="/admin/posts/new" class="hl"><b>Yeni haber yaz</b><span>Görselli bir yazı yayınlayın</span></a></div>
<h2>Son talepler</h2>${recent.length ? recent.map(m => `<a class="msgrow${m.read ? '' : ' un'}" href="/admin/messages"><b>${e(m.name)}</b><span>${e(m.subject)} · ${e(m.date)}</span></a>`).join('') : '<p class="mut">Henüz talep gelmedi.</p>'}
<div class="note"><b>Yayın notu</b><p>Ücretsiz barındırma (ör. Render) kullanıyorsanız panelden yaptığınız değişiklikler sunucu yeniden başladığında silinebilir. Kalıcı olması için <a href="/admin/backup">Yedek ve yardım</a> sayfasından yedek indirin.</p></div>`, r, q.query.ok, d));
  });

  /* ---------- site içeriği ---------- */
  const getG = q => G.find(g => g[0] === q) || G[0];
  const vis = (l, k) => k.startsWith('L:') || l === 'tr' || !SH.includes(k);
  app.get('/admin/content', auth, (q, r) => {
    const g = getG(q.query.g), l = LANGS.includes(q.query.l) ? q.query.l : 'tr', d = raw(), x = d.langs[l];
    const keys = g[4].filter(k => vis(l, k)), hidden = g[4].length - keys.length;
    r.send(layout('c-' + g[0], g[1], `<div class="ph"><div><h1>${g[1]}</h1><p class="mut">${g[2]}</p></div><a class="btn ghost" href="${g[3]}" target="_blank" rel="noopener">${ic('ext')} Sitede gör</a></div>
${langTabs('/admin/content?g=' + g[0], l)}
${l !== 'tr' && hidden ? '<div class="note sm"><p>Görseller, telefon, e-posta, adres, şirket adı ve sosyal medya bağlantıları tüm dillerde ortaktır; <a href="/admin/content?g=' + g[0] + '&l=tr">Türkçe sekmesinden</a> değiştirilir.</p></div>' : ''}
${keys.length ? `<form method="post" action="/admin/content" class="card" data-dirty><input type="hidden" name="g" value="${g[0]}"><input type="hidden" name="l" value="${l}">${ctok(r)}
${keys.map(k => k.startsWith('L:') ? list(k.slice(2), x[k.slice(2)] || []) : field(k, x.site[k], l)).join('')}
<div class="bar"><button class="btn pri">Kaydet (${LN[l]})</button><span class="mut sm">Kaydedince site hemen güncellenir.</span></div></form>` : '<p class="mut">Bu bölümde bu dile özel düzenlenecek alan yok.</p>'}`, r, q.query.ok, d));
  });
  post('/admin/content', (q, r) => {
    const g = getG(q.body.g), l = LANGS.includes(q.body.l) ? q.body.l : 'tr', d = raw(), x = d.langs[l];
    g[4].filter(k => vis(l, k)).forEach(k => {
      if (k.startsWith('L:')) { const n = k.slice(2); x[n] = lines(clip(q.body[n], 6000), L[n][1]).slice(0, 30).map(o => Object.fromEntries(Object.entries(o).map(([a, b]) => [a, b.slice(0, 400)]))); return; }
      const t = F[k][1];
      x.site[k] = t === 'i' || t === 'u' ? vu(clip(q.body[k], 500)) : clip(q.body[k], t === 'a' ? 3000 : 300);
    });
    save(d); r.redirect(`/admin/content?g=${g[0]}&l=${l}&ok=saved`);
  });

  /* ---------- görsel yükleme ---------- */
  app.post('/admin/upload', auth, express.json({ limit: '12mb' }), csrf, (q, r) => {
    if (!limit('up' + q.sid, 60, 36e5)) return r.status(429).json({ error: 'Çok fazla yükleme' });
    const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+\/=]+)$/.exec((q.body || {}).data || '');
    if (!m) return r.status(400).json({ error: 'Geçersiz görsel' });
    const b = Buffer.from(m[2], 'base64');
    const ok = b.length < 9e6 && (m[1] === 'png' ? b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])) : m[1] === 'jpeg' ? b[0] === 0xff && b[1] === 0xd8 : b.subarray(0, 4).toString() === 'RIFF');
    if (!ok) return r.status(400).json({ error: 'Geçersiz görsel dosyası' });
    if (fs.readdirSync(UP).length > 400) return r.status(400).json({ error: 'Yükleme klasörü dolu' });
    const n = crypto.randomBytes(8).toString('hex') + '.' + (m[1] === 'jpeg' ? 'jpg' : m[1]);
    fs.writeFileSync(path.join(UP, n), b); r.json({ url: '/uploads/' + n });
  });

  /* ---------- yazılar ---------- */
  app.get('/admin/posts', auth, (q, r) => {
    const d = raw(), ps = [...d.posts].sort((a, b) => b.date.localeCompare(a.date));
    r.send(layout('posts', 'Yazılar', `<div class="ph"><div><h1>Haberler / yazılar</h1><p class="mut">Sitenin "Haberler" bölümünde görünür. Üç dilde yazabilirsiniz.</p></div><a class="btn pri" href="/admin/posts/new">+ Yeni yazı</a></div>
${ps.length ? ps.map(p => `<div class="prow"><div class="th">${p.image ? `<img src="${e(p.image)}" alt="">` : ''}</div><div class="pi"><b>${e(p.title || '(başlıksız)')}</b><small>${fmt(p.date)} · <span class="tag ${p.status === 'published' ? 'ok' : 'dr'}">${p.status === 'published' ? 'Yayında' : 'Taslak'}</span></small></div>
<div class="pa"><a class="btn ghost" href="/admin/posts/${p.id}">Düzenle</a>${p.status === 'published' ? `<a class="btn ghost" href="/news/${e(p.slug)}" target="_blank" rel="noopener">Gör</a>` : ''}
<form method="post" action="/admin/posts/${p.id}/toggle">${ctok(r)}<button class="btn ghost">${p.status === 'published' ? 'Taslağa al' : 'Yayınla'}</button></form>
<form method="post" action="/admin/posts/${p.id}/delete" data-confirm="Bu yazı silinsin mi?">${ctok(r)}<button class="btn danger">Sil</button></form></div></div>`).join('') : '<div class="empty"><p>Henüz yazı yok.</p><a class="btn pri" href="/admin/posts/new">İlk yazıyı oluştur</a></div>'}`, r, q.query.ok, d));
  });
  const pform = (p, r, l) => {
    const t = (k) => p[pk(l, k)] || '';
    return `<div class="ph"><div><h1>${p.id ? 'Yazıyı düzenle' : 'Yeni yazı'}</h1><p class="mut">Önce Türkçe başlık ve içeriği yazın; diğer dilleri boş bırakırsanız Türkçe gösterilir.</p></div></div>
<form method="post" action="/admin/posts/save" class="card" data-dirty><input type="hidden" name="id" value="${e(p.id || '')}">${ctok(r)}
${field('heroImage', p.image || '', 'tr').replace('name="heroImage"', 'name="image"').replace('1. slayt görseli', 'Kapak görseli').replace('Boşsa hazır çizim görünür.', 'Listede ve yazı başında görünür.')}
<div class="lt tabs" data-tabs>${LANGS.map((k, i) => `<button type="button" class="${i ? '' : 'on'}" data-t="${k}">${LN[k]}${k === 'tr' ? ' *' : ''}</button>`).join('')}</div>
${LANGS.map((k, i) => `<div class="tp" data-p="${k}"${i ? ' hidden' : ''}>
<label class="f">Başlık<input name="${pk(k, 'title')}" value="${e(p[pk(k, 'title')] || '')}" maxlength="200"${k === 'tr' ? ' required' : ''}></label>
<label class="f">Kısa özet<small>Haber listesinde görünen 1–2 cümle.</small><textarea name="${pk(k, 'excerpt')}" rows="3" maxlength="500">${e(p[pk(k, 'excerpt')] || '')}</textarea></label>
<label class="f">İçerik<small>Paragraflar arasında boş satır bırakın. Ara başlık için satırı "## " ile başlatın.</small><textarea name="${pk(k, 'content')}" rows="12" maxlength="20000">${e(p[pk(k, 'content')] || '')}</textarea></label></div>`).join('')}
<label class="f">Durum<select name="status"><option value="published"${p.status !== 'draft' ? ' selected' : ''}>Yayında</option><option value="draft"${p.status === 'draft' ? ' selected' : ''}>Taslak (sitede görünmez)</option></select></label>
<div class="bar"><button class="btn pri">Kaydet</button><a class="btn ghost" href="/admin/posts">Vazgeç</a></div></form>`;
  };
  app.get('/admin/posts/new', auth, (q, r) => r.send(layout('posts', 'Yeni yazı', pform({ status: 'published' }, r, 'tr'), r)));
  app.get('/admin/posts/:id', auth, (q, r) => { const p = raw().posts.find(x => x.id === q.params.id); p ? r.send(layout('posts', 'Yazıyı düzenle', pform(p, r, 'tr'), r)) : r.redirect('/admin/posts'); });
  post('/admin/posts/save', (q, r) => {
    const d = raw(), b = q.body; let p = d.posts.find(x => x.id === b.id);
    if (!p) { if (d.posts.length >= 500) return r.status(400).send('Yazı sınırına ulaşıldı'); p = { id: crypto.randomBytes(5).toString('hex'), date: new Date().toISOString() }; d.posts.push(p); }
    p.image = vu(clip(b.image, 500)); p.status = b.status === 'draft' ? 'draft' : 'published';
    LANGS.forEach(l => { p[pk(l, 'title')] = clip(b[pk(l, 'title')], 200); p[pk(l, 'excerpt')] = clip(b[pk(l, 'excerpt')], 500); p[pk(l, 'content')] = clip(b[pk(l, 'content')], 20000); });
    p.slug = slug(p.title || 'yazi') + '-' + p.id.slice(0, 3); save(d); r.redirect('/admin/posts?ok=post');
  });
  post('/admin/posts/:id/toggle', (q, r) => { const d = raw(), p = d.posts.find(x => x.id === q.params.id); if (p) { p.status = p.status === 'published' ? 'draft' : 'published'; save(d); } r.redirect('/admin/posts?ok=saved'); });
  post('/admin/posts/:id/delete', (q, r) => { const d = raw(); d.posts = d.posts.filter(x => x.id !== q.params.id); save(d); r.redirect('/admin/posts?ok=del'); });

  /* ---------- talepler ---------- */
  const withIds = d => { let ch = false; d.messages.forEach(m => { if (!m.id) { m.id = crypto.randomBytes(5).toString('hex'); ch = true; } }); if (ch) save(d); return d; };
  app.get('/admin/messages', auth, (q, r) => {
    const d = withIds(raw()), only = q.query.f === 'un', ms = d.messages.filter(m => !only || !m.read);
    r.send(layout('msg', 'Talepler', `<div class="ph"><div><h1>Gelen talepler</h1><p class="mut">İletişim formundan gelen mesajlar. Yanıtlamak için e-posta adresine tıklayın.</p></div>
<div class="lt"><a href="/admin/messages"${only ? '' : ' class="on"'}>Tümü (${d.messages.length})</a><a href="/admin/messages?f=un"${only ? ' class="on"' : ''}>Okunmamış (${unread(d)})</a></div></div>
${ms.length ? ms.map(m => `<article class="msg${m.read ? '' : ' un'}"><header><div><b>${e(m.name)}</b> <a href="mailto:${e(m.email)}?subject=${encodeURIComponent('Re: ' + (m.subject || ''))}">${e(m.email)}</a></div><small>${e(m.date)} · ${e(m.lang || 'TR')}</small></header>
<div class="tag ${m.read ? 'dr' : 'ok'}">${e(m.subject)}</div><p>${e(m.message)}</p>
<div class="pa"><a class="btn pri" href="mailto:${e(m.email)}?subject=${encodeURIComponent('Re: ' + (m.subject || ''))}">Yanıtla</a>
<form method="post" action="/admin/messages/${e(m.id)}/read">${ctok(r)}<button class="btn ghost">${m.read ? 'Okunmadı yap' : 'Okundu işaretle'}</button></form>
<form method="post" action="/admin/messages/${e(m.id)}/delete" data-confirm="Bu talep silinsin mi?">${ctok(r)}<button class="btn danger">Sil</button></form></div></article>`).join('') : '<div class="empty"><p>' + (only ? 'Okunmamış talep yok.' : 'Henüz talep yok.') + '</p></div>'}`, r, q.query.ok, d));
  });
  post('/admin/messages/:id/read', (q, r) => { const d = withIds(raw()), m = d.messages.find(x => x.id === q.params.id); if (m) { m.read = !m.read; save(d); } r.redirect('/admin/messages?ok=read'); });
  post('/admin/messages/:id/delete', (q, r) => { const d = withIds(raw()); d.messages = d.messages.filter(x => x.id !== q.params.id); save(d); r.redirect('/admin/messages?ok=del'); });

  /* ---------- yedek ve yardım ---------- */
  app.get('/admin/backup', auth, (q, r) => r.send(layout('backup', 'Yedek ve yardım', `<div class="ph"><div><h1>Yedek ve yardım</h1><p class="mut">İçeriğinizi güvenceye alın, yeni sunucuya taşıyın.</p></div></div>
<div class="card"><h2>İçerik yedeği</h2><p>Tüm metinler, yazılar ve talepler tek bir dosyada iner. Görseller dosyaya dahil değildir (<code>public/uploads</code> klasöründedir).</p>
<div class="bar"><a class="btn pri" href="/admin/backup/download">Yedeği indir</a></div>
<h2>Yedeği geri yükle</h2><p>Daha önce indirdiğiniz dosyayı seçin. Mevcut içerik <b>yedekle değiştirilir</b>.</p>
<form method="post" action="/admin/backup/restore" id="restore" data-confirm="Mevcut içerik yedekle değiştirilsin mi?">${ctok(r)}<input type="hidden" name="json"><label class="btn sec">Yedek dosyası seç<input type="file" accept="application/json,.json" hidden data-restore></label> <span class="mut sm" id="rf"></span><div class="bar"><button class="btn danger" disabled id="rb">Geri yükle</button></div></form></div>
<div class="card"><h2>Sık sorulanlar</h2>
<details><summary>Paneli kimler görebilir?</summary><p>Yalnızca parolayı bilenler. Parola sunucuda <code>ADMIN_PASS</code> ayarıdır; değiştirmek için ayarı güncelleyip yeniden başlatın.</p></details>
<details><summary>Görsel nasıl eklenir?</summary><p>İçerik sayfalarında "Görsel yükle" düğmesine basın. JPG, PNG veya WebP olabilir; otomatik küçültülür.</p></details>
<details><summary>Ücretsiz barındırmada değişiklikler neden kayboluyor?</summary><p>Ücretsiz planlarda disk kalıcı değildir. Sunucu yeniden başladığında içerik ilk kurulumdaki haline döner. Çözüm: değişiklikleri yedekleyip <code>data/content.json</code> dosyasını projeye ekleyerek yeniden yayınlamak.</p></details>
<details><summary>Talepler nereye düşüyor?</summary><p>Bu panelde "Gelen talepler" sayfasına. E-posta bildirimi yoktur; düzenli kontrol edin.</p></details></div>`, r, q.query.ok)));
  app.get('/admin/backup/download', auth, (q, r) => {
    const d = raw(); r.set({ 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="yedek-${new Date().toISOString().slice(0, 10)}.json"` });
    r.send(JSON.stringify({ langs: d.langs, posts: d.posts, messages: d.messages }, null, 1));
  });
  // Geri yükleme: gelen JSON şemaya göre yeniden kurulur; beklenmeyen her şey atılır
  const str = (v, n) => clip(typeof v === 'string' ? v : '', n);
  const sanitize = j => {
    const cur = raw(), out = { langs: {}, posts: [], messages: [] };
    LANGS.forEach(l => {
      const s = (j.langs || {})[l] || {}, base = cur.langs[l]; out.langs[l] = { ...base, site: { ...base.site } };
      Object.keys(base.site).forEach(k => { const v = (s.site || {})[k]; if (typeof v === 'string') out.langs[l].site[k] = /image|^linkedin|^instagram/i.test(k) || F[k]?.[1] === 'i' || F[k]?.[1] === 'u' ? vu(v) : str(v, 3000); });
      Object.keys(L).forEach(k => { if (Array.isArray(s[k])) out.langs[l][k] = s[k].slice(0, 30).map(o => { const t = {}; 'abcd'.slice(0, L[k][1]).split('').forEach(c => t[c] = str((o || {})[c], 400)); return t; }); });
    });
    (Array.isArray(j.posts) ? j.posts : []).slice(0, 500).forEach(p => {
      if (!p || typeof p !== 'object') return; const id = /^[a-f0-9]{10}$/.test(p.id) ? p.id : crypto.randomBytes(5).toString('hex');
      const o = { id, date: isNaN(Date.parse(p.date)) ? new Date().toISOString() : new Date(p.date).toISOString(), image: vu(str(p.image, 500)), status: p.status === 'draft' ? 'draft' : 'published' };
      LANGS.forEach(l => { o[pk(l, 'title')] = str(p[pk(l, 'title')], 200); o[pk(l, 'excerpt')] = str(p[pk(l, 'excerpt')], 500); o[pk(l, 'content')] = str(p[pk(l, 'content')], 20000); });
      o.slug = slug(o.title || 'yazi') + '-' + id.slice(0, 3); out.posts.push(o);
    });
    (Array.isArray(j.messages) ? j.messages : []).slice(0, 1000).forEach(m => { if (m && typeof m === 'object') out.messages.push({ id: crypto.randomBytes(5).toString('hex'), date: str(m.date, 40), lang: str(m.lang, 4), name: str(m.name, 100), email: str(m.email, 150), subject: str(m.subject, 50), message: str(m.message, 3000), read: !!m.read }); });
    return out;
  };
  app.post('/admin/backup/restore', auth, express.urlencoded({ extended: false, limit: '4mb' }), csrf, (q, r) => {
    let j; try { j = JSON.parse(q.body.json || ''); } catch { return r.status(400).send('Geçersiz yedek dosyası'); }
    if (!j || typeof j !== 'object' || !j.langs) return r.status(400).send('Geçersiz yedek dosyası');
    save(sanitize(j)); r.redirect('/admin/backup?ok=restored');
  });
};
