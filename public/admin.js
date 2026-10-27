(function(){'use strict';
var d=document,$=function(s,c){return(c||d).querySelector(s)},$$=function(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))};
var app=$('.app'),csrf=app&&app.dataset.csrf;

/* mobil menü */
var mb=$('.mbtn');if(mb)mb.addEventListener('click',function(){var o=!d.body.classList.contains('nav');d.body.classList.toggle('nav',o);mb.setAttribute('aria-expanded',o)});
d.addEventListener('click',function(e){if(d.body.classList.contains('nav')&&!e.target.closest('aside')&&!e.target.closest('.mbtn')){d.body.classList.remove('nav')}});

/* onay penceresi */
$$('form[data-confirm]').forEach(function(f){f.addEventListener('submit',function(e){if(!confirm(f.dataset.confirm))e.preventDefault()})});

/* değişiklik uyarısı */
var dirty=false;
$$('form[data-dirty]').forEach(function(f){f.addEventListener('input',function(){dirty=true});f.addEventListener('submit',function(){dirty=false})});
addEventListener('beforeunload',function(e){if(dirty){e.preventDefault();e.returnValue=''}});

/* yazı dil sekmeleri */
$$('[data-tabs]').forEach(function(t){$$('button',t).forEach(function(b){b.addEventListener('click',function(){$$('button',t).forEach(function(x){x.classList.toggle('on',x===b)});$$('.tp').forEach(function(p){p.hidden=p.dataset.p!==b.dataset.t})})})});

/* tekrarlayan satır düzenleyici (Başlık | Açıklama biçimini form alanlarına çevirir) */
$$('textarea[data-rep]').forEach(function(ta){
  var cols=JSON.parse(ta.dataset.rep),box=d.createElement('div'),rows=d.createElement('div'),add=d.createElement('button');
  box.className='rows';rows.className='rows';add.type='button';add.className='btn sec add';add.textContent='+ Satır ekle';
  function sync(){ta.value=$$('.rw',rows).map(function(r){var v=$$('input',r).map(function(i){return i.value.replace(/\|/g,'/').replace(/\s*\n\s*/g,' ').trim()});return v.some(Boolean)?v.join(' | '):''}).filter(Boolean).join('\n')}
  function row(vals){var r=d.createElement('div');r.className='rw';r.style.setProperty('--c',cols.length);
    cols.forEach(function(c,i){var l=d.createElement('label'),inp=d.createElement('input');l.textContent=c;inp.value=vals[i]||'';inp.maxLength=400;l.appendChild(inp);r.appendChild(l)});
    var x=d.createElement('button');x.type='button';x.className='x';x.title='Satırı sil';x.setAttribute('aria-label','Satırı sil');x.textContent='×';x.onclick=function(){r.remove();sync();ta.form.dispatchEvent(new Event('input',{bubbles:true}))};r.appendChild(x);rows.appendChild(r)}
  ta.value.split('\n').filter(function(l){return l.trim()}).forEach(function(l){row(l.split('|').map(function(s){return s.trim()}))});
  add.onclick=function(){row([]);var i=$('.rw:last-child input',rows);if(i)i.focus()};
  rows.addEventListener('input',sync);ta.hidden=true;ta.parentNode.appendChild(rows);ta.parentNode.appendChild(add);
  ta.form.addEventListener('submit',sync);
});

/* görsel yükleme (tarayıcıda küçültülür) */
$$('[data-up]').forEach(function(i){i.addEventListener('change',function(){
  var f=i.files[0],w=i.closest('.f'),st=$('.us',w),inp=$('input[name]',w),pv=$('.pv',w);if(!f)return;
  st.className='us';st.textContent='Yükleniyor…';var im=new Image();
  im.onerror=function(){st.className='us er';st.textContent='Bu dosya görsel olarak açılamadı.'};
  im.onload=function(){var k=Math.min(1,1600/im.width),c=d.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);
    fetch('/admin/upload',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF':csrf},body:JSON.stringify({data:c.toDataURL('image/jpeg',.85)})}).then(function(r){return r.json()}).then(function(j){
      if(j.url){inp.value=j.url;pv.classList.remove('empty');pv.innerHTML='';var g=d.createElement('img');g.src=j.url;g.alt='';pv.appendChild(g);st.className='us ok';st.textContent='Yüklendi. Kaydetmeyi unutmayın.';dirty=true}else{st.className='us er';st.textContent=j.error||'Yükleme başarısız'}
    }).catch(function(){st.className='us er';st.textContent='Yükleme başarısız'})};
  im.src=URL.createObjectURL(f);i.value=''})});
$$('[data-clear]').forEach(function(b){b.addEventListener('click',function(){var w=b.closest('.f'),inp=$('input[name]',w),pv=$('.pv',w);inp.value='';pv.classList.add('empty');pv.innerHTML='<span>Görsel yok</span>';dirty=true})});
$$('.f.img input[name]').forEach(function(inp){inp.addEventListener('change',function(){var pv=$('.pv',inp.closest('.f'));if(/^(\/uploads\/|https?:\/\/)/.test(inp.value)){pv.classList.remove('empty');pv.innerHTML='';var g=d.createElement('img');g.src=inp.value;g.alt='';pv.appendChild(g)}})});

/* yedek geri yükleme */
var rf=$('[data-restore]');if(rf){var form=$('#restore'),hid=$('input[name=json]',form),btn=$('#rb');
  rf.addEventListener('change',function(){var f=rf.files[0];if(!f)return;if(f.size>3e6){$('#rf').textContent='Dosya çok büyük';return}var r=new FileReader();r.onload=function(){hid.value=r.result;btn.disabled=false;$('#rf').textContent=f.name};r.readAsText(f)})}
})();
