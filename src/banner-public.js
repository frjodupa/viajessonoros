// Campañas publicadas: solo se muestran si la API devuelve estado activo y fechas vigentes.
if(!new URLSearchParams(location.search).has('probar-banners')){
 fetch('/api/banners-public',{cache:'no-store'}).then(r=>r.ok?r.json():{banners:[]}).then(({banners=[]})=>{
  if(!banners.length)return;
  let next=banners.find(x=>!x.show_once||!sessionStorage.getItem('vs-banner-viewed-'+x.slug));
  if(!next)return;
  const show=()=>{
   if(document.querySelector('.vs-public-banner-backdrop'))return;
   const backdrop=document.createElement('div');
   backdrop.className='vs-public-banner-backdrop';
   Object.assign(backdrop.style,{position:'fixed',inset:'0',zIndex:'99000',background:'rgba(26,16,41,.72)',display:'grid',placeItems:'center',padding:'12px'});
   const article=document.createElement('article');
   Object.assign(article.style,{position:'relative',background:'#fffaf5',borderRadius:'18px',maxWidth:'530px',width:'100%',maxHeight:'90dvh',overflowY:'auto',textAlign:'center',boxShadow:'0 18px 48px #0005'});
   const close=document.createElement('button');close.textContent='×';close.setAttribute('aria-label','Cerrar banner');
   Object.assign(close.style,{position:'absolute',right:'12px',top:'12px',zIndex:'1',border:'0',background:'#ffffffed',borderRadius:'50%',fontSize:'28px',width:'38px',height:'38px'});
   const dismiss=()=>{backdrop.remove();if(next.show_once)sessionStorage.setItem('vs-banner-viewed-'+next.slug,'1')};
   close.onclick=dismiss;backdrop.onclick=e=>{if(e.target===backdrop)dismiss()};
   document.addEventListener('keydown',function escape(e){if(e.key==='Escape'){dismiss();document.removeEventListener('keydown',escape)}});
   article.append(close);
   if(next.image_path){const img=document.createElement('img');img.src=next.image_path;img.alt=next.image_alt||next.title;Object.assign(img.style,{display:'block',width:'100%',height:'auto'});article.append(img)}
   const body=document.createElement('div');body.style.padding='16px 22px 26px';
   const title=document.createElement('h2');title.textContent=next.title;
   const desc=document.createElement('p');desc.textContent=next.description;
   const action=document.createElement('a');action.textContent=next.button_text||'Más información';action.href=next.button_url;action.style.cssText='display:inline-block;padding:13px 22px;background:#5b3f98;color:white;border-radius:10px;text-decoration:none;font-weight:700';
   body.append(title,desc,action);article.append(body);backdrop.append(article);document.body.append(backdrop);
  };
  if(next.display_mode==='scroll'){
   const onScroll=()=>{const max=document.documentElement.scrollHeight-innerHeight;if(max>0&&scrollY/max>=Math.min(95,Math.max(10,next.scroll_percent))/100){removeEventListener('scroll',onScroll);show()}};
   addEventListener('scroll',onScroll,{passive:true});onScroll();
  }else if(next.display_mode==='exit'&&matchMedia('(hover:hover)').matches){
   const leave=e=>{if(e.clientY<=0&&!e.relatedTarget){document.removeEventListener('mouseout',leave);show()}};document.addEventListener('mouseout',leave);
  }else setTimeout(show,Math.max(0,Math.min(60,next.delay_seconds||0))*1000);
 }).catch(()=>{});
}
