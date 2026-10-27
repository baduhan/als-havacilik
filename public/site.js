(function(){
'use strict';
var d=document,$=function(s,c){return(c||d).querySelector(s)},$$=function(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))};
var R=matchMedia('(prefers-reduced-motion:reduce)').matches,root=d.documentElement;
var h=$('#top'),burger=$('.burger'),dds=$$('.dd',h),pg=$('.pg'),hero=$('#hero');
window.__rv=1;

/* ---- akıcı kaydırma (yalnız fare/masaüstü) ---- */
var L=null;
if(window.Lenis&&!R&&matchMedia('(hover:hover) and (pointer:fine)').matches){
  try{L=new Lenis({lerp:.1,smoothWheel:true});var raf=function(t){L.raf(t);requestAnimationFrame(raf)};requestAnimationFrame(raf)}catch(e){L=null}
}
function goTo(el,off){var y=el.getBoundingClientRect().top+(window.scrollY||pageYOffset)-(off==null?72:off);if(L)L.scrollTo(y,{duration:1.4});else scrollTo({top:y,behavior:R?'auto':'smooth'})}
var norm=function(p){return p.replace(/\/+$/,'')||'/'};

/* ---- menü ---- */
function closeSubs(ex){dds.forEach(function(x){if(x!==ex){x.classList.remove('open');$('.chev',x).setAttribute('aria-expanded','false')}})}
function menu(o){h.classList.toggle('open',o);burger.setAttribute('aria-expanded',o);root.classList.toggle('menu-open',o&&innerWidth<=1000);if(L){o&&innerWidth<=1000?L.stop():L.start()}if(o)h.classList.remove('hide');else closeSubs()}
burger.addEventListener('click',function(){menu(!h.classList.contains('open'))});
dds.forEach(function(x){$('.chev',x).addEventListener('click',function(e){e.stopPropagation();var o=!x.classList.contains('open');closeSubs(x);x.classList.toggle('open',o);this.setAttribute('aria-expanded',o)})});
d.addEventListener('click',function(e){if(!h.contains(e.target)){closeSubs();if(h.classList.contains('open'))menu(false)}});
d.addEventListener('keydown',function(e){if(e.key==='Escape'){closeSubs();menu(false)}});
addEventListener('resize',function(){if(innerWidth>1000&&h.classList.contains('open'))menu(false)});

/* ---- sayfa içi bağlantılar ---- */
d.addEventListener('click',function(e){
  var a=e.target.closest&&e.target.closest('a[href*="#"]');if(!a||a.target==='_blank'||e.defaultPrevented||e.metaKey||e.ctrlKey)return;
  var u;try{u=new URL(a.href,location.href)}catch(x){return}
  if(u.origin!==location.origin||norm(u.pathname)!==norm(location.pathname)||!u.hash||u.hash.length<2)return;
  var t=d.getElementById(decodeURIComponent(u.hash.slice(1)));if(!t)return;
  e.preventDefault();if(h.classList.contains('open'))menu(false);history.pushState(null,'',u.hash);goTo(t,t.id==='iletisim'?40:70)
});
if(L&&location.hash.length>1){addEventListener('load',function(){var t=d.getElementById(decodeURIComponent(location.hash.slice(1)));if(t)setTimeout(function(){goTo(t,70)},120)})}

/* ---- kaydırma: header, ilerleme çubuğu, parallax ---- */
var lastY=0,tick=false,par=$$('[data-p]');
function onScroll(){
  var y=window.scrollY||pageYOffset;
  h.classList.toggle('scrolled',y>40);
  if(!h.classList.contains('open')&&!h.querySelector('.dd.open')){var dy=y-lastY;if(y>300&&dy>8)h.classList.add('hide');else if(dy<-6||y<300)h.classList.remove('hide')}
  lastY=y;
  var m=d.documentElement.scrollHeight-innerHeight;pg.style.transform='scaleX('+(m>0?Math.min(1,y/m):0)+')';
  if(hero&&!R&&y<innerHeight*1.2)par.forEach(function(el){el.style.transform='translate3d(0,'+(y*parseFloat(el.dataset.p)).toFixed(1)+'px,0)'});
  tick=false
}
addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(onScroll)}},{passive:true});onScroll();
h.addEventListener('mouseenter',function(){h.classList.remove('hide')});h.addEventListener('focusin',function(){h.classList.remove('hide')});

/* ---- beliriş animasyonları ---- */
(function(){
  var sel='.sec .kick,.sec h2,.sec .lead,.sec .two>div>p,.sec .nh p,.sec .vis,.stats .w>div,.rows li,.cards article,.fcard,.post,.job,.row>a,.cl2,.formc,.map,.prose>*,.fh,.cta2 .w>div,.cta2 .btn,.qcard,.fprog';
  var els=$$(sel);
  els.forEach(function(el){var p=el.parentNode;p._n=(p._n||0)+1;el.setAttribute('data-r','');el.style.setProperty('--d',(Math.min(p._n-1,6)*.08).toFixed(2)+'s')});
  if(!('IntersectionObserver' in window)){els.forEach(function(el){el.classList.add('in')});return}
  var io=new IntersectionObserver(function(es){es.forEach(function(x){if(!x.isIntersecting)return;var el=x.target;el.classList.add('in');io.unobserve(el);setTimeout(function(){el.removeAttribute('data-r')},1900)})},{threshold:.1,rootMargin:'0px 0px -6% 0px'});
  els.forEach(function(el){io.observe(el)});
  /* sayaçlar */
  var co=new IntersectionObserver(function(es){es.forEach(function(x){if(!x.isIntersecting)return;co.unobserve(x.target);var el=x.target,m=/^(\d+)(\+?)$/.exec(el.textContent.trim());if(!m||R)return;var n=+m[1],t0=performance.now();(function f(t){var k=Math.min(1,(t-t0)/1600);el.textContent=Math.round(n*(1-Math.pow(1-k,4)))+m[2];if(k<1)requestAnimationFrame(f)})(t0)})},{threshold:.7});
  $$('.stats b').forEach(function(b){co.observe(b)});
})();

/* ---- hero slider ---- */
if(hero){
  var S=$$('.slide',hero),D=$$('.dots button',hero),cur=0;
  $$('.sc h2',hero).forEach(function(hh){var w=hh.textContent.trim().split(/\s+/);hh.setAttribute('aria-label',hh.textContent.trim());hh.innerHTML=w.map(function(t,i){return'<span class="wd" aria-hidden="true"><i style="--i:'+i+'">'+t.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</i></span>'}).join(' ')});
  var go=function(n){if(S.length<2)return;S[cur].classList.remove('on');D[cur].classList.remove('on');cur=(n+S.length)%S.length;void hero.offsetWidth;S[cur].classList.add('on');D[cur].classList.add('on')};
  D.forEach(function(b,i){b.addEventListener('click',function(){go(i)})});
  $('.dots',hero).addEventListener('animationend',function(e){if(e.animationName==='fill')go(cur+1)});
  hero.addEventListener('mouseenter',function(){hero.classList.add('pause')});hero.addEventListener('mouseleave',function(){hero.classList.remove('pause')});
  d.addEventListener('visibilitychange',function(){hero.classList.toggle('pause',d.hidden)});
  var sx=0;hero.addEventListener('touchstart',function(e){sx=e.touches[0].clientX},{passive:true});hero.addEventListener('touchend',function(e){var dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>50)go(dx<0?cur+1:cur-1)},{passive:true});
}

/* ---- filo karuseli ---- */
var tr=$('.ftrack');
if(tr){
  var fi=$('.fprog i'),step=function(){var c=$('.fcard',tr);return c?c.offsetWidth+22:340};
  $('.fp').addEventListener('click',function(){tr.scrollBy({left:-step(),behavior:'smooth'})});$('.fn').addEventListener('click',function(){tr.scrollBy({left:step(),behavior:'smooth'})});
  var pr=function(){var m=tr.scrollWidth-tr.clientWidth,w=Math.min(100,tr.clientWidth/tr.scrollWidth*100);if(fi){fi.style.width=w+'%';fi.style.left=(m>0?tr.scrollLeft/m*(100-w):0)+'%'}};
  tr.addEventListener('scroll',pr,{passive:true});addEventListener('resize',pr);pr();
  var dn=false,sx0=0,sl0=0,moved=0;
  tr.addEventListener('pointerdown',function(e){if(e.pointerType!=='mouse'||e.button!==0)return;dn=true;moved=0;sx0=e.clientX;sl0=tr.scrollLeft});
  addEventListener('pointermove',function(e){if(!dn)return;var dx=e.clientX-sx0;moved=Math.max(moved,Math.abs(dx));if(moved>5)tr.classList.add('drag');tr.scrollLeft=sl0-dx});
  addEventListener('pointerup',function(){if(!dn)return;dn=false;setTimeout(function(){tr.classList.remove('drag')},30)});
  tr.addEventListener('click',function(e){if(moved>5){e.preventDefault();e.stopPropagation();moved=0}},true);
  tr.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){tr.scrollBy({left:step(),behavior:'smooth'})}else if(e.key==='ArrowLeft'){tr.scrollBy({left:-step(),behavior:'smooth'})}});
}

/* ---- teklif formu ve hızlı teklif çubuğu ---- */
var f=$('#qf'),tabsMain=f?$$('.tabs button',f):[];
function mainTab(i){if(tabsMain[i])tabsMain[i].click()}
tabsMain.forEach(function(b){b.addEventListener('click',function(){tabsMain.forEach(function(x){x.classList.remove('on')});b.classList.add('on');f.subject.value=b.dataset.t;f.message.placeholder=b.dataset.p})});
$$('[data-jet]').forEach(function(a){a.addEventListener('click',function(){if(!f)return;mainTab(1);f.message.value=f.dataset.msg.replace('{}',a.dataset.jet)})});
$$('[data-tab]').forEach(function(a){a.addEventListener('click',function(){mainTab(a.dataset.tab==='j'?1:0)})});
var qb=$('#qb');
if(qb){
  var qt=$$('.tabs button',qb),qfs=$$('.qf',qb);
  qt.forEach(function(b){b.addEventListener('click',function(){qt.forEach(function(x){x.classList.toggle('on',x===b)});qfs.forEach(function(s){s.hidden=s.dataset.k!==b.dataset.k})})});
  qb.addEventListener('submit',function(e){
    e.preventDefault();if(!f)return;var k=$('.tabs .on',qb).dataset.k,g=function(n){return(qb.elements[n]&&qb.elements[n].value||'').trim()||'—'};
    var msg=k==='f'?qb.dataset.mf.replace('{ap}',g('ap')).replace('{date}',g('date')).replace('{qty}',g('qty')):qb.dataset.mj.replace('{route}',g('route')).replace('{date}',g('date2')).replace('{pax}',g('pax'));
    mainTab(k==='f'?0:1);f.message.value=msg;var t=d.getElementById('iletisim');if(t)goTo(t,40);setTimeout(function(){try{f.name.focus({preventScroll:true})}catch(x){}},900)
  });
}
})();
