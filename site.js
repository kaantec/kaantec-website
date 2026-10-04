document.addEventListener('DOMContentLoaded',()=>{
 const nav=document.getElementById('navLinks'),button=document.querySelector('.menu-button');
 if(button)button.addEventListener('click',()=>{const open=nav.classList.toggle('active');button.setAttribute('aria-expanded',String(open));});
 document.querySelectorAll('#navLinks a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('active')));
 const reveal=document.querySelectorAll('section:not(.hero) .container > *');
 if('IntersectionObserver'in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('reveal-ready');const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}}),{threshold:.1});reveal.forEach(el=>{el.dataset.reveal='';io.observe(el)})}
 const canvas=document.querySelector('.hero-canvas');
 if(!canvas||!window.THREE||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 let renderer,scene,camera,group,frame=0,raf=0;
 try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(canvas.clientWidth,canvas.clientHeight,false);scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(34,canvas.clientWidth/canvas.clientHeight,.1,100);camera.position.set(0,0,11);group=new THREE.Group();group.position.set(1.15,.05,0);scene.add(group);
 const mat=(color,metal=0.45,rough=.4)=>new THREE.MeshStandardMaterial({color,metalness:metal,roughness:rough});const steel=mat(0x40545a,.75,.3),dark=mat(0x17272d,.5,.42),lime=mat(0xd8ff54,.35,.34),glass=new THREE.MeshStandardMaterial({color:0x8eb4b1,metalness:.5,roughness:.24,transparent:true,opacity:.34});
 const box=(w,h,d,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);group.add(o);return o};
 // Abstract, low-poly ventilation plant: duct runs, housings, fan rings and service rails.
 box(4.9,.34,.48,steel,.3,-1.35,0);box(.36,2.55,.48,dark,2.58,-.1,0);box(3.9,.3,.42,steel,.2,1.24,0);box(.34,2.3,.42,steel,-1.65,.05,0);box(1.35,.95,.95,dark,-.2,.25,.08);box(1.08,.68,1.05,steel,1.36,-.28,.12);box(.72,.18,1.1,lime,1.36,.14,.12);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.55,.075,8,32),steel);ring.position.set(-.2,.25,.58);group.add(ring);const hub=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.12,12),lime);hub.rotation.x=Math.PI/2;hub.position.set(-.2,.25,.6);group.add(hub);
 for(let i=0;i<7;i++){const fin=box(.08,.68,.035,steel,-.72+i*.16,.25,.56);fin.rotation.z=-.12}
 for(let i=0;i<4;i++){box(.035,2.2,.035,mat(0x667878,.65,.35),-2.15+i*.28,.02,.46)}
 scene.add(new THREE.HemisphereLight(0xc7e4e4,0x10191c,2));const key=new THREE.DirectionalLight(0xe5f0dc,3.4);key.position.set(3,5,7);scene.add(key);const rim=new THREE.PointLight(0xd8ff54,16,9);rim.position.set(-2,1,3);scene.add(rim);
 const resize=()=>{const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};new ResizeObserver(resize).observe(canvas);let px=0,py=0;window.addEventListener('pointermove',e=>{px=(e.clientX/innerWidth-.5)*.12;py=(e.clientY/innerHeight-.5)*.08},{passive:true});const animate=()=>{raf=requestAnimationFrame(animate);frame+=.006;group.rotation.y=Math.sin(frame)*.07+px;group.rotation.x=py;group.position.y=.05+Math.sin(frame*.8)*.04;renderer.render(scene,camera)};animate();document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(raf);else animate()});
 }catch(e){if(renderer)renderer.dispose()}
});
