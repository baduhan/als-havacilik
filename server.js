const express=require('express'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const app=express(),F=path.join(__dirname,'data','content.json'),UP=path.join(__dirname,'public','uploads');
const PROD=process.env.NODE_ENV==='production',PORT=process.env.PORT||3000,PASS=process.env.ADMIN_PASS||'als2026';
if(PROD&&(!process.env.ADMIN_PASS||process.env.ADMIN_PASS.length<10)){console.error('HATA: Production için en az 10 karakterlik ADMIN_PASS ortam değişkeni gerekli.');process.exit(1)}
app.disable('x-powered-by');if(process.env.TRUST_PROXY)app.set('trust proxy',1);
const hits=new Map();
const limit=(k,max,ms)=>{const n=Date.now(),a=(hits.get(k)||[]).filter(t=>n-t<ms);if(a.length>=max){hits.set(k,a);return false}a.push(n);hits.set(k,a);return true};
setInterval(()=>{const n=Date.now();for(const [k,a] of hits)if(!a.some(t=>n-t<36e5))hits.delete(k)},6e5).unref();
const same=(a,b)=>crypto.timingSafeEqual(crypto.createHash('sha256').update(String(a)).digest(),crypto.createHash('sha256').update(String(b)).digest());
const vu=u=>{u=String(u||'').trim();return /^(\/uploads\/[\w.-]+|https?:\/\/[^\s'"()<>\\]+)$/.test(u)?u:''};
const {DEF,T,PV}=require('./i18n'),LANGS=['tr','en','es'],SH=['name','phone','email','address','heroImage','fuelImage','charterImage','aboutImage','heroImage2','heroImage3','linkedin','instagram'];
const LN={tr:'Türkçe',en:'English',es:'Español'};
let CUR={l:'tr',p:'',path:'/'};
const clean=o=>Object.fromEntries(Object.entries(o||{}).filter(([,v])=>v!==undefined));
const raw=()=>{let d={};try{d=JSON.parse(fs.readFileSync(F,'utf8'))}catch{}
 if(d.site)d.langs={tr:{site:d.site,stats:d.stats,services:(d.services||[]).map(x=>x.title?{a:x.title,b:x.text}:x),fleet:d.fleet}};
 const L={};LANGS.forEach(l=>{const g=clean((d.langs||{})[l]);L[l]={...DEF[l],...g,site:{...DEF[l].site,...clean(g.site)}}});
 return {langs:L,posts:d.posts||[],messages:d.messages||[]}};
const load=()=>{const r=raw(),x=r.langs[CUR.l],site={...x.site};SH.forEach(k=>site[k]=r.langs.tr.site[k]);return {site,stats:x.stats,services:x.services,fleet:x.fleet,values:x.values,slides:x.slides,jobs:x.jobs,perks:x.perks,posts:r.posts,messages:r.messages}};
const save=d=>{const t=F+'.tmp';fs.writeFileSync(t,JSON.stringify({langs:d.langs,posts:d.posts,messages:d.messages},null,1));fs.renameSync(t,F)};
const lp=(p,k)=>p[k+(CUR.l==='tr'?'':'_'+CUR.l)]||p[k];
const pk=(l,k)=>l==='tr'?k:k+'_'+l;
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug=t=>t.replace(/İ/g,'i').toLowerCase().replace(/ç/g,'c').replace(/ğ/g,'g').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ş/g,'s').replace(/ü/g,'u').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'yazi';
const lines=(t,n)=>String(t||'').split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{const p=l.split('|').map(x=>x.trim());const o={};'abcd'.slice(0,n).split('').forEach((k,i)=>o[k]=p[i]||'');return o});
const unl=(a,n)=>a.map(x=>'abcd'.slice(0,n).split('').map(k=>x[k]).join(' | ')).join('\n');
const body=t=>String(t||'').split(/\n\s*\n/).map(p=>p.startsWith('## ')?`<h3>${e(p.slice(3))}</h3>`:`<p>${e(p).replace(/\n/g,'<br>')}</p>`).join('');
const fmt=d=>new Date(d).toLocaleDateString({tr:'tr-TR',en:'en-GB',es:'es-ES'}[CUR.l],{day:'numeric',month:'long',year:'numeric'});
fs.mkdirSync(path.dirname(F),{recursive:true});fs.mkdirSync(UP,{recursive:true});
app.use((q,r,n)=>{const m=/^\/(en|es)(\/.*)?$/.exec(q.url);CUR=m?{l:m[1],p:'/'+m[1],path:(m[2]||'/').split('?')[0]}:{l:'tr',p:'',path:q.url.split('?')[0]};if(m)q.url=m[2]||'/';n()});
app.use((q,r,n)=>{r.set({'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()','Content-Security-Policy':"default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'"});
 if(PROD)r.set('Strict-Transport-Security','max-age=31536000');if(q.url.startsWith('/admin'))r.set('X-Robots-Tag','noindex, nofollow');
 if(q.method==='POST'&&q.headers.origin){try{if(new URL(q.headers.origin).host!==q.headers.host)return r.status(403).send('Geçersiz istek kaynağı')}catch{return r.status(403).send('Geçersiz istek')}}n()});
{const up=express.urlencoded({extended:false,limit:'300kb'});app.use((q,r,n)=>q.path==='/admin/backup/restore'?n():up(q,r,n))}
app.use((q,r,n)=>{if(/\.(css|js|svg|json)$/.test(q.path))r.set('Cache-Control',q.query.v?'public, max-age=31536000, immutable':'no-cache');n()});
app.use(express.static(path.join(__dirname,'public'),{maxAge:0,setHeaders:(r,f)=>{if(/[\\/](fonts|uploads)[\\/]/.test(f))r.setHeader('Cache-Control','public, max-age=31536000, immutable')}}));
app.use((q,r,n)=>{r.set('Cache-Control','no-cache');n()});
const base=q=>process.env.SITE_URL||q.protocol+'://'+q.get('host');
app.get('/healthz',(q,r)=>r.type('text/plain').send('ok'));
app.get('/robots.txt',(q,r)=>r.type('text/plain').send(`User-agent: *\nDisallow: /admin\nSitemap: ${base(q)}/sitemap.xml\n`));
app.get('/sitemap.xml',(q,r)=>{const b=base(q),d=raw(),u=[];['/','/about','/careers','/news','/privacy',...d.posts.filter(p=>p.status==='published').map(p=>'/news/'+p.slug)].forEach(x=>LANGS.forEach(l=>u.push(`<url><loc>${e(b+(l==='tr'?'':'/'+l)+x)}</loc></url>`)));r.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${u.join('')}</urlset>`)});
const seo=(cls,t,d)=>{const b=process.env.SITE_URL;let h=`<meta property="og:title" content="${e(t)}"><meta property="og:description" content="${e(d)}"><meta property="og:type" content="website"><link rel="icon" href="/favicon.svg" type="image/svg+xml">`;
if(b&&!/\badm\b/.test(cls))h+=`<link rel="canonical" href="${e(b+(CUR.l==='tr'?'':'/'+CUR.l)+CUR.path)}">`+LANGS.map(l=>`<link rel="alternate" hreflang="${l}" href="${e(b+(l==='tr'?'':'/'+l)+CUR.path)}">`).join('');return h};
const A=f=>{try{return '/'+f+'?v='+Math.floor(fs.statSync(path.join(__dirname,'public',f)).mtimeMs/1000)}catch{return '/'+f}};
const shell=(t,b,cls='',d='')=>`<!doctype html><html lang="${CUR.l}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#06182a"><meta name="description" content="${e(d)}">${seo(cls,t,d)}<title>${e(t)}</title><script src="${A('boot.js')}"></script><link rel="stylesheet" href="${A('fonts.css')}"><link rel="stylesheet" href="${A(/\badm\b/.test(cls)?'admin.css':'site.css')}"></head><body class="${cls}">${b}</body></html>`;
const href=c=>{c=String(c||'').trim();if(/^\/[\w\-\/#]*$/.test(c))return CUR.p+c;return /^(#[\w-]*|https?:\/\/[^\s'"<>]+)$/.test(c)?c:'#'};
const MAP=require('./map.json');
const IN='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4V21H3zM9.5 9.75h3.8v1.6h.06c.53-1 1.82-2.05 3.75-2.05 4 0 4.74 2.63 4.74 6.05V21h-4v-5.07c0-1.2-.02-2.76-1.68-2.76-1.68 0-1.94 1.31-1.94 2.67V21h-4z"/></svg>';
const IG='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.2" cy="6.8" r="1.2" fill="currentColor"/></svg>';
const AR='<svg class="ar" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const WIN=Array.from({length:9},(_,i)=>`<rect x="${336+i*24}" y="82" width="12" height="9" rx="4.5"/>`).join('');
const SPR=`<svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute"><defs><linearGradient id="jg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#c9dcec"/></linearGradient><linearGradient id="jd" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#a9c2d8"/><stop offset="1" stop-color="#6d8fb0"/></linearGradient><g id="jet"><path d="M52 24L98 24L156 90L84 102Z" fill="url(#jd)"/><rect x="38" y="17" width="82" height="9" rx="4.5" fill="url(#jd)"/><path d="M398 124L292 166L250 166L322 124Z" fill="url(#jd)"/><path d="M250 166L238 142L258 158Z" fill="url(#jd)"/><path d="M70 92C112 74 222 62 362 60C472 58 562 70 614 100C620 104 620 108 614 112C562 130 472 138 362 138C222 138 122 128 84 112C72 106 66 98 70 92Z" fill="url(#jg)"/><path d="M118 88h86q12 0 12 9t-12 9h-86q-8 0-8-9t8-9z" fill="#7f9db9"/><path d="M124 92h30v10h-30z" fill="#0a3a5f" opacity=".5"/><g fill="#0a3a5f">${WIN}</g><path d="M556 84L598 96L556 96z" fill="#0a3a5f"/><path d="M104 118C250 130 450 130 594 113" fill="none" stroke="#2f8fd8" stroke-width="3" stroke-linecap="round"/></g><g id="drop"><path d="M100 14C100 14 38 88 38 130a62 62 0 0 0 124 0C162 88 100 14 100 14z" fill="url(#jg)"/><path d="M70 128a30 30 0 0 0 26 30" fill="none" stroke="#2f8fd8" stroke-width="5" stroke-linecap="round"/></g></defs></svg>`;
const JET=(c,w=480)=>`<svg class="${c}" viewBox="0 0 640 200" width="${w}" height="${Math.round(w*.3125)}" aria-hidden="true" focusable="false"><use href="#jet"/></svg>`;
const soc=s=>[['linkedin','LinkedIn',IN],['instagram','Instagram',IG]].filter(x=>vu(s[x[0]])).map(x=>`<a class="so" href="${e(vu(s[x[0]]))}" target="_blank" rel="noopener noreferrer" aria-label="${x[1]}" title="${x[1]}">${x[2]}</a>`).join('');
const langs=()=>`<span class="lang">${LANGS.map(l=>`<a href="${l==='tr'?'':'/'+l}${CUR.path}" hreflang="${l}" lang="${l}" aria-label="${LN[l]}" title="${LN[l]}"${l===CUR.l?' class="on" aria-current="true"':''}><img src="/flags/${l}.svg" width="24" height="16" alt=""></a>`).join('')}</span>`;
const pub=(t,s,inner)=>{const X=T[CUR.l],p=CUR.p,tel=String(s.phone).replace(/[^\d+]/g,'');return shell(t,`${SPR}<div class="pg" aria-hidden="true"></div>
<header class="top" id="top"><div class="bar"><a class="logo" href="${p}/"><svg class="lm" viewBox="0 0 64 64" width="26" height="26" aria-hidden="true" focusable="false"><path d="M12 46 32 12l20 34H42L32 28 22 46z" fill="currentColor"/></svg><span>${e(s.name)}</span></a>
<nav id="nav" aria-label="${X.menu}"><a href="${p}/">${X.home}</a>
<div class="dd"><a href="${p}/#hizmetler">${X.svc}</a><button class="chev" aria-label="${X.subm}" aria-expanded="false"></button><div class="sub"><a href="${p}/#yakit">${e(s.fuelTitle)}</a><a href="${p}/#jet">${e(s.charterTitle)}</a><a href="${p}/#filo">${X.fleet}</a></div></div>
<a href="${p}/#filo">${X.fleet}</a><a href="${p}/news">${X.news}</a>
<div class="dd r"><a href="${p}/about">${X.about}</a><button class="chev" aria-label="${X.subm}" aria-expanded="false"></button><div class="sub"><a href="${p}/about">${X.who}</a><a href="${p}/about#mv">${X.mv}</a><a href="${p}/about#values">${X.vals}</a><a href="${p}/careers">${X.career}</a></div></div>
<a class="ncta" href="${p}/#iletisim">${X.contact}</a>
<div class="nx"><a href="tel:${e(tel)}">${e(s.phone)}</a><a href="mailto:${e(s.email)}">${e(s.email)}</a><div class="nxr">${soc(s)}${langs()}</div></div></nav>
<div class="hr">${soc(s)}${langs()}<a class="btn sm" href="${p}/#iletisim">${X.contact}</a></div>
<button class="burger" aria-label="${X.menu}" aria-expanded="false" aria-controls="nav"><span></span></button></div></header>
${inner}
<footer><div class="fwrap"><div class="ftop"><div><a class="flogo" href="${p}/">${e(s.name)}</a><p class="ftag">${e(s.tagline)}</p></div><a class="fcta" href="${p}/#iletisim"><span>${X.qT}</span>${AR}</a></div>
<div class="fgrid"><div><h4>${X.contact}</h4><p>${e(s.address)}</p><p><a href="tel:${e(tel)}">${e(s.phone)}</a><br><a href="mailto:${e(s.email)}">${e(s.email)}</a></p><div class="fsoc">${soc(s)}</div></div>
<div><h4>${X.svc}</h4><a href="${p}/#yakit">${e(s.fuelTitle)}</a><a href="${p}/#jet">${e(s.charterTitle)}</a><a href="${p}/#filo">${X.fleet}</a></div>
<div><h4>${X.about}</h4><a href="${p}/about">${X.who}</a><a href="${p}/about#mv">${X.mv}</a><a href="${p}/about#values">${X.vals}</a><a href="${p}/careers">${X.career}</a></div>
<div><h4>${X.news}</h4><a href="${p}/news">${X.all}</a><a href="${p}/privacy">${X.priv}</a></div></div>
<div class="fbot"><span>© ${new Date().getFullYear()} ${e(s.name)}. ${X.rights}</span>${langs()}</div></div></footer>
<script src="${A('vendor/lenis.min.js')}" defer></script><script src="${A('site.js')}" defer></script>`,'',s.tagline)};
const visual=(u,kind,c='')=>{u=vu(u);return u?`<div class="vis img ${c}"><img src="${e(u)}" alt="" loading="lazy"></div>`:`<div class="vis ${c}" aria-hidden="true"><i class="ring r1"></i><i class="ring r2"></i><i class="ring r3"></i>${kind==='fuel'?'<svg class="drop" viewBox="0 0 200 200" width="190" height="190" focusable="false"><use href="#drop"/></svg>':JET('vj',420)}</div>`};
const posts=d=>d.posts.filter(p=>p.status==='published').sort((x,y)=>y.date.localeCompare(x.date));
const card=p=>`<a class="post" href="${CUR.p}/news/${e(p.slug)}">${vu(p.image)?`<span class="pimg"><img src="${e(vu(p.image))}" alt="" loading="lazy"></span>`:`<span class="pimg ph">${JET('pj',240)}</span>`}<div><small>${fmt(p.date)}</small><h3>${e(lp(p,'title'))}</h3><p>${e(lp(p,'excerpt'))}</p><span class="more">${T[CUR.l].learn}${AR}</span></div></a>`;
const svc=a=>`<div class="cards">${a.map((x,i)=>`<article><span class="no">${String(i+1).padStart(2,'0')}</span><h3>${e(x.a)}</h3><p>${e(x.b)}</p></article>`).join('')}</div>`;
const band=(a,b)=>`<section class="phead"><div class="sky"></div><div class="pw"><h1>${e(a)}</h1>${b?`<p>${e(b)}</p>`:''}</div></section>`;
const km=n=>parseInt(String(n).replace(/\D/g,''))||0;
const NET=`<div class="map"><img src="/map-dots.svg" width="${MAP.w}" height="${MAP.h}" alt="" loading="lazy"><svg viewBox="${MAP.vb}" aria-hidden="true" focusable="false">${MAP.routes.map((r,i)=>`<path class="rt" d="${r.d}" style="--i:${i}"/><circle r="3.2" fill="#fff"><animateMotion dur="${9+i*1.6}s" begin="-${i*1.7}s" repeatCount="indefinite" path="${r.d}"/></circle>`).join('')}${Object.entries(MAP.points).map(([k,v])=>`<g class="pt${k==='ant'?' hub':''}" transform="translate(${v[0]} ${v[1]})"><circle class="pl" r="${k==='ant'?9:6}"/><circle class="dt" r="${k==='ant'?5:3.4}"/><text x="${k==='ant'?14:k==='lon'?-10:10}" y="${k==='ant'?22:k==='lon'?-8:4}" text-anchor="${k==='lon'?'end':'start'}">${k.toUpperCase()}</text></g>`).join('')}</svg></div>`;
const slbg=(u)=>(u=vu(u))?`style="background-image:url('${e(u)}')"`:'';

app.get('/',(q,r)=>{const d=load(),s=d.site,X=T[CUR.l],p=CUR.p,ps=posts(d).slice(0,3),im=[s.heroImage,s.heroImage2,s.heroImage3],tick=[...d.services.map(x=>x.a),...d.stats.map(x=>x.a+' '+x.b)];
r.send(pub(s.name+' | '+s.tagline,s,`
<section class="hero" id="hero"><div class="sky" data-p=".12"></div><div class="stars" data-p=".2"></div><i class="cl c1"></i><i class="cl c2"></i><i class="cl c3"></i>
<div class="glide" data-p="-.06"><i class="trail"></i>${JET('gj',560)}</div>
${d.slides.map((x,i)=>`<div class="slide${i?'':' on'}"><div class="sbg" ${slbg(im[i%3])}></div><div class="sc"><span class="kick">${e(s.name)}</span><h2>${e(x.a)}</h2><p>${e(x.b)}</p><a class="btn" href="${e(href(x.c))}">${X.learn}${AR}</a></div></div>`).join('')}
<div class="hctl"><div class="dots">${d.slides.map((x,i)=>`<button aria-label="${i+1}"${i?'':' class="on"'}><i></i></button>`).join('')}</div><span class="scr">${X.scroll}<i></i></span></div></section>
<section class="qb"><form class="qcard" id="qb" action="#iletisim" data-mf="${e(X.mf)}" data-mj="${e(X.mj)}"><div class="qh"><b>${X.quick}</b><div class="tabs"><button type="button" class="on" data-k="f">${X.fuel}</button><button type="button" data-k="j">${X.jet}</button></div></div>
<div class="qf" data-k="f"><label><span>${X.ap}</span><input name="ap" placeholder="LTAI / AYT"></label><label><span>${X.date}</span><input name="date" type="date"></label><label><span>${X.qty}</span><input name="qty" inputmode="numeric" placeholder="5000"></label></div>
<div class="qf" data-k="j" hidden><label><span>${X.route}</span><input name="route" placeholder="LTAI → EGLL"></label><label><span>${X.date}</span><input name="date2" type="date"></label><label><span>${X.pax}</span><input name="pax" inputmode="numeric" placeholder="6"></label></div>
<button class="btn go">${X.offer}${AR}</button></form></section>
<section class="sec intro"><div class="w two"><div><span class="kick">${e(s.name)}</span><h2>${e(s.aboutTitle)}</h2><p>${e(s.about)}</p><p><a class="lnk" href="${p}/about">${X.learn}${AR}</a></p></div>${visual(s.aboutImage,'jet')}</div></section>
<section class="stats"><div class="w">${d.stats.map(x=>`<div><b>${e(x.a)}</b><span>${e(x.b)}</span></div>`).join('')}</div></section>
<section id="hizmetler" class="sec"><div class="w"><span class="kick">${X.svc}</span><h2>${X.provide}</h2><ol class="rows">${d.services.map((x,i)=>`<li><span class="no">${String(i+1).padStart(2,'0')}</span><h3>${e(x.a)}</h3><p>${e(x.b)}</p>${AR}</li>`).join('')}</ol></div></section>
<div class="mq" aria-hidden="true"><div class="mqt">${[0,1].map(()=>`<div>${tick.map(t=>`<span>${e(t)}</span>`).join('')}</div>`).join('')}</div></div>
<section class="sec net"><div class="w"><div class="nh"><span class="kick">${X.netKick}</span><h2>${e(s.mapTitle)}</h2><p>${e(s.mapText)}</p></div>${NET}</div></section>
<section id="yakit" class="sec"><div class="w two"><div><span class="kick">${X.fuel}</span><h2>${e(s.fuelTitle)}</h2><p>${e(s.fuelText)}</p><p><a class="btn" href="#iletisim" data-tab="f">${X.offer}${AR}</a></p></div>${visual(s.fuelImage,'fuel')}</div></section>
<section id="jet" class="sec alt"><div class="w two rev">${visual(s.charterImage,'jet')}<div><span class="kick">${X.jet}</span><h2>${e(s.charterTitle)}</h2><p>${e(s.charterText)}</p><p><a class="btn" href="#filo">${X.seeFleet}${AR}</a></p></div></div></section>
<section id="filo" class="sec dark"><div class="w"><div class="fh"><div><span class="kick">${X.fleet}</span><h2>${X.fT}</h2></div><div class="fnav"><button class="fp" aria-label="${X.prev}">←</button><button class="fn" aria-label="${X.next}">→</button></div></div></div>
<div class="ftrack" tabindex="0">${d.fleet.map(x=>`<article class="fcard"><small>${e(x.a)}</small><h3>${e(x.b)}</h3>${JET('fj',320)}<dl><div><dt>${X.cap}</dt><dd>${e(x.c)}</dd></div><div><dt>${X.rng}</dt><dd>${e(x.d)}</dd></div></dl><div class="bar2"><i style="--w:${Math.min(100,Math.round(km(x.d)/120))}%"></i></div><a href="#iletisim" data-jet="${e(x.b)}">${X.fCta}${AR}</a></article>`).join('')}</div>
<div class="w"><div class="fprog"><i></i></div></div></section>
<section class="sec"><div class="w"><span class="kick">${X.strengths}</span><h2>${X.strengths}</h2>${svc(d.values)}</div></section>
<section class="cta2"><div class="runway" aria-hidden="true"></div><div class="w"><div><h2>${e(s.bannerTitle)}</h2><p>${e(s.bannerText)}</p></div><a class="btn" href="#iletisim">${X.start}${AR}</a></div></section>
${ps.length?`<section class="sec"><div class="w"><div class="row"><div><span class="kick">${X.news}</span><h2>${X.latest}</h2></div><a class="lnk" href="${p}/news">${X.all}${AR}</a></div><div class="posts">${ps.map(card).join('')}</div></div></section>`:''}
<section id="iletisim" class="sec contact"><div class="w two"><div><span class="kick">${X.contact}</span><h2>${X.qT}</h2><ul class="cl2"><li>${e(s.address)}</li><li><a href="tel:${e(String(s.phone).replace(/[^\d+]/g,''))}">${e(s.phone)}</a></li><li><a href="mailto:${e(s.email)}">${e(s.email)}</a></li></ul><div class="fsoc">${soc(s)}</div></div>
<form class="formc" method="post" action="${p}/iletisim" id="qf" data-msg="${e(X.msg)}"><div class="tabs"><button type="button" class="on" data-t="${X.fuel}" data-p="${e(X.p1)}">${X.fuel}</button><button type="button" id="tj" data-t="${X.jet}" data-p="${e(X.p2)}">${X.jet}</button></div><input type="hidden" name="subject" value="${X.fuel}"><input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><input name="name" placeholder="${X.name}" required><input name="email" type="email" placeholder="${X.mail}" required><textarea name="message" rows="4" required placeholder="${e(X.p1)}"></textarea><label class="chk"><input type="checkbox" name="consent" required><span>${X.consent} <a href="${p}/privacy">${X.priv}</a></span></label><button class="btn go">${X.send}${AR}</button>${q.query.ok?`<p class="ok">${X.ok}</p>`:''}</form></div></section>`))});

app.get('/about',(q,r)=>{const d=load(),s=d.site,X=T[CUR.l];r.send(pub(s.whoTitle+' | '+s.name,s,`${band(s.whoTitle,s.tagline)}<section class="sec"><div class="w two"><p class="lead">${e(s.whoText)}</p>${visual(s.aboutImage,'jet')}</div></section>
<section class="stats"><div class="w">${d.stats.map(x=>`<div><b>${e(x.a)}</b><span>${e(x.b)}</span></div>`).join('')}</div></section>
<section class="sec" id="mv"><div class="w two"><div><span class="kick">01</span><h2>${X.mission}</h2><p>${e(s.mission)}</p></div><div><span class="kick">02</span><h2>${X.vision}</h2><p>${e(s.vision)}</p></div></div></section>
<section class="sec alt" id="values"><div class="w"><span class="kick">${X.values}</span><h2>${X.values}</h2>${svc(d.values)}<p><a class="btn" href="${CUR.p}/#iletisim">${X.quote}${AR}</a></p></div></section>`))});
app.get('/careers',(q,r)=>{const d=load(),s=d.site,X=T[CUR.l],m=s.email;r.send(pub(s.careerTitle+' | '+s.name,s,`${band(s.careerTitle,s.tagline)}<section class="sec"><div class="w two"><p class="lead">${e(s.careerText)}</p>${visual(s.aboutImage,'jet')}</div></section>
<section class="sec alt"><div class="w"><span class="kick">${X.career}</span><h2>${X.whyJoin}</h2>${svc(d.perks)}</div></section>
<section class="sec" id="roles"><div class="w"><span class="kick">${X.career}</span><h2>${X.roles}</h2>${d.jobs.length?`<div class="jobs">${d.jobs.map(j=>`<div class="job"><div><h3>${e(j.a)}</h3><p>${e(j.b)} · ${e(j.c)}</p></div><a class="btn" href="mailto:${e(m)}?subject=${encodeURIComponent(j.a)}">${X.apply}${AR}</a></div>`).join('')}</div>`:`<p>${X.noRoles}</p>`}<p>${X.openApp} <a class="ml" href="mailto:${e(m)}?subject=${encodeURIComponent(X.openAppSub)}">${e(m)}</a></p></div></section>`))});
app.get('/news',(q,r)=>{const d=load(),ps=posts(d),X=T[CUR.l];r.send(pub(X.news,d.site,`${band(X.news)}<section class="sec"><div class="w">${ps.length?`<div class="posts">${ps.map(card).join('')}</div>`:`<p>${X.none}</p>`}</div></section>`))});
app.get('/news/:s',(q,r)=>{const d=load(),X=T[CUR.l],p=posts(d).find(x=>x.slug===q.params.s);if(!p)return r.status(404).send(pub(X.nf,d.site,`${band(X.nf)}<section class="sec"><div class="w"><a class="lnk" href="${CUR.p}/news">${X.back}</a></div></section>`));
r.send(pub(lp(p,'title'),d.site,`${band(lp(p,'title'),fmt(p.date))}<article class="sec"><div class="w narrow">${vu(p.image)?`<img class="cover" src="${e(vu(p.image))}" alt="">`:''}<div class="prose">${body(lp(p,'content'))}</div><p><a class="lnk" href="${CUR.p}/news">${X.back}</a></p></div></article>`))});
app.post('/iletisim',(q,r)=>{const b=q.body;if(b.website)return r.redirect(CUR.p+'/?ok=1#iletisim');if(b.consent!=='on')return r.status(400).send('Consent required');if(!limit('form'+q.ip,5,36e5))return r.status(429).send('Too many requests');const d=raw(),c=(v,n)=>String(v||'').slice(0,n);d.messages.unshift({id:crypto.randomBytes(5).toString('hex'),read:false,date:new Date().toLocaleString('tr-TR'),lang:CUR.l.toUpperCase(),name:c(b.name,100),email:c(b.email,150),subject:c(b.subject,50),message:c(b.message,3000)});d.messages=d.messages.slice(0,1000);save(d);r.redirect(CUR.p+'/?ok=1#iletisim')});

require('./adminpanel')(app,{raw,save,e,shell,A,vu,same,limit,lines,unl,pk,slug,fmt,LANGS,SH,PROD,PASS,UP});
app.get('/privacy',(q,r)=>{const d=load(),s=d.site,V=PV[CUR.l];r.send(pub(V.t,s,`${band(V.t)}<section class="sec"><div class="wrap narrow prose">${V.s.map(x=>`<h3>${e(x[0])}</h3><p>${e(x[1].replace(/\{n\}/g,s.name).replace(/\{m\}/g,s.email))}</p>`).join('')}</div></section>`))});
app.use((q,r)=>{const d=load();r.status(404).send(pub('404',d.site,band('404')+`<section class="sec"><div class="wrap"><a href="${CUR.p}/">${T[CUR.l].home}</a></div></section>`))});
app.use((err,q,r,n)=>{const c=err&&err.status>=400&&err.status<500?err.status:500;if(c===500)console.error(err);if(r.headersSent)return n(err);r.status(c).type('text/plain').send(c===413?'İstek çok büyük':c===500?'Sunucu hatası':'Geçersiz istek')});
app.listen(PORT,()=>console.log('ALS Havacılık: http://localhost:'+PORT+'  |  Panel: /admin'));
