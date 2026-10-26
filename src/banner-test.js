// Prueba real aislada: solo se ejecuta si ?probar-banners=1 está presente.
const params=new URLSearchParams(location.search);
if(params.get('probar-banners')==='1'){
 const banners=[
 {id:'individual',title:'Terapias individuales',description:'Un espacio personal de escucha, sonido y calma.',url:'/terapias-individuales.html',image:'/banner-terapia-individual.webp'},
 {id:'pareja',title:'Terapias de pareja',description:'Un viaje sonoro compartido para conectar desde la escucha y la presencia.',url:'/terapias-de-pareja.html',image:'/banner-terapia-pareja.webp'},
 {id:'grupo',title:'Crea tu grupo para tu viaje',description:'Reúne a amigos, familiares o compañeros para una experiencia sonora privada.',url:'/crea-tu-grupo-viaje-sonoro.html',image:'/banner-grupo-viaje.webp'}
 ];
 const root=document.createElement('div');root.id='vs-banner-test';root.innerHTML='<div class="vs-test-bar" aria-label="Prueba de banners"><strong>PRUEBA · BANNERS</strong><select aria-label="Elegir banner"></select><select aria-label="Modo de aparición"><option value="entry">Al entrar</option><option value="scroll">Al hacer scroll (50%)</option><option value="exit">Al intentar salir (escritorio)</option></select><button type="button" data-action="show">Mostrar banner</button><button type="button" data-action="close-test">Salir de prueba</button></div><div class="vs-test-shade" hidden><section class="vs-test-dialog" role="dialog" aria-modal="true" aria-labelledby="vs-test-title" tabindex="-1"><button type="button" class="vs-test-x" aria-label="Cerrar banner">×</button><img class="vs-test-image" alt="" hidden><p class="vs-test-kicker">VIAJES SONOROS FEEL</p><h2 id="vs-test-title"></h2><p class="vs-test-description"></p><a class="vs-test-cta" rel="noopener" href="#">Más información →</a><p class="vs-test-disclaimer">Vista de prueba · No es una campaña publicada</p></section></div>';
 document.body.append(root);
 const options=root.querySelectorAll('select');banners.forEach((b,i)=>options[0].add(new Option(b.title,String(i))));
 const shade=root.querySelector('.vs-test-shade'),dialog=root.querySelector('.vs-test-dialog');let triggered=false;
 function close(){shade.hidden=true;document.body.classList.remove('vs-test-open')}
 function open(){const b=banners[Number(options[0].value)];root.querySelector('h2').textContent=b.title;root.querySelector('.vs-test-description').textContent=b.description;root.querySelector('.vs-test-cta').href=b.url;const image=root.querySelector('.vs-test-image');image.src=b.image;image.alt=b.title;image.hidden=false;image.onerror=()=>{image.hidden=true};shade.hidden=false;document.body.classList.add('vs-test-open');dialog.focus();triggered=true}
 root.querySelector('[data-action="show"]').onclick=open;root.querySelector('.vs-test-x').onclick=close;shade.addEventListener('click',e=>{if(e.target===shade)close()});root.querySelector('[data-action="close-test"]').onclick=()=>{const u=new URL(location.href);u.searchParams.delete('probar-banners');location.assign(u.href)};
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
 options.forEach(o=>o.addEventListener('change',()=>{triggered=false;close();if(options[1].value==='entry')open()}));
 function onScroll(){if(triggered||options[1].value!=='scroll')return;const max=document.documentElement.scrollHeight-innerHeight;if(max>0&&scrollY/max>=.5)open()}
 window.addEventListener('scroll',onScroll,{passive:true});
 document.addEventListener('mouseout',e=>{if(options[1].value==='exit'&&!triggered&&e.clientY<=0&&!e.relatedTarget&&matchMedia('(hover: hover)').matches)open()});
 open();
}
