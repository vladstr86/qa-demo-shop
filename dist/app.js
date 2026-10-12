(async () => {
const { createAccountUI, addressInputs, readAddress, validateContact } = await import('./account-ui.mjs');
async function readDemoAccount(path, optional = false) {
  let response;
  try {
    response = await fetch(path, { cache: 'no-store' });
  } catch {
    throw new Error(`Cannot load demo account configuration: ${path}.`);
  }
  if (optional && (response.status === 404 || response.status === 410)) return null;
  if (!response.ok) throw new Error(`Cannot load demo account configuration: ${path} (HTTP ${response.status}).`);
  const body = await response.text();
  // Static hosts can return the HTML entry page for a missing optional file.
  if (optional && (response.headers.get('content-type')?.includes('text/html') || /^\s*</.test(body))) return null;
  let value;
  try {
    value = JSON.parse(body);
  } catch {
    throw new Error(`Demo account configuration must contain valid JSON: ${path}.`);
  }
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).some(key => !['email', 'password'].includes(key)) ||
      typeof value.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email) ||
      typeof value.password !== 'string' || !value.password.trim()) {
    throw new Error(`Demo account configuration must contain only a valid email and nonempty password: ${path}.`);
  }
  return Object.freeze({ email: value.email, password: value.password });
}
const demoAccount = await readDemoAccount('./demo.local.json', true) ?? await readDemoAccount('./demo.example.json');
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const queryLanguage=new URLSearchParams(location.search).get('lang');
let lang=['ro','en'].includes(queryLanguage)?queryLanguage:localStorage.getItem('atelier-tech-language')==='en'?'en':'ro';const t=(ro,en)=>lang==='ro'?ro:en;
const labels={black:['Negru','Black'],red:['Roșu','Red'],purple:['Violet','Purple'],silver:['Argintiu','Silver'],white:['Alb','White'],wireless:['Wireless','Wireless'],wired:['Cablu','Wired'],laptops:['Laptopuri','Laptops'],audio:['Audio','Audio'],accessories:['Accesorii','Accessories']};const label=v=>labels[v]?labels[v][lang==='ro'?0:1]:v;
const products=[{id:1,name:'Laptop Atlas 14',brand:'Atlas',priceCents:79900,category:'laptops',options:{color:['red','purple','black'],ram:['16','32'],ssd:['512','1024']},description:['Ușor și rapid pentru proiectele tale. Ecran IPS de 14", autonomie până la 10 ore și carcasă compactă.','Light and fast for your projects. A 14-inch IPS screen, up to 10 hours of battery life and a compact body.'],spec:['Procesor: Demo Core i5 · Greutate: 1,4 kg · Porturi: USB-C, HDMI · Garanție demo: 24 luni','Processor: Demo Core i5 · Weight: 1.4 kg · Ports: USB-C, HDMI · Demo warranty: 24 months']},{id:2,name:'Laptop Horizon 16',brand:'Horizon',priceCents:109950,category:'laptops',options:{color:['red','purple','black'],ram:['16','32']},description:['Un ecran generos pentru lucru și creație. Panou IPS 16", SSD 1 TB și tastatură iluminată.','A spacious screen for work and creativity. A 16-inch IPS panel, 1 TB SSD and backlit keyboard.'],spec:['Procesor: Demo Core i7 · Greutate: 1,8 kg · Porturi: USB-C, HDMI · Garanție demo: 24 luni','Processor: Demo Core i7 · Weight: 1.8 kg · Ports: USB-C, HDMI · Demo warranty: 24 months']},{id:3,name:'Căști Pulse Pro',enName:'Pulse Pro Headphones',brand:'Pulse',priceCents:13995,category:'audio',options:{color:['red','purple','black'],connection:['wireless','wired']},description:['Sunet clar și confort pentru o zi întreagă. Cupe moi, microfon integrat și design pliabil.','Clear sound and all-day comfort. Soft ear cups, a built-in microphone and a folding design.'],spec:['Difuzoare: 40 mm · Greutate: 240 g · Autonomie wireless: 30 ore · Garanție demo: 24 luni','Drivers: 40 mm · Weight: 240 g · Wireless battery life: 30 hours · Demo warranty: 24 months']},{id:4,name:'Boxă Wave Mini',enName:'Wave Mini Speaker',brand:'Wave',priceCents:4990,category:'audio',description:['Muzica ta, oriunde. Boxă compactă cu Bluetooth, sunet de 10 W și autonomie de 12 ore.','Your music, anywhere. A compact Bluetooth speaker with 10 W sound and 12-hour battery life.'],spec:['Conectare: Bluetooth · Greutate: 350 g · Încărcare: USB-C · Garanție demo: 24 luni','Connection: Bluetooth · Weight: 350 g · Charging: USB-C · Demo warranty: 24 months']},{id:5,stock:false,name:'Tastatură Studio',enName:'Studio Keyboard',brand:'Studio',priceCents:6900,category:'accessories',description:['Fiecare tastă contează. Tastatură mecanică cu iluminare discretă și layout US.','Every key matters. A mechanical keyboard with subtle lighting and a US layout.'],spec:['Conectare: USB · Layout: US · 87 taste · Garanție demo: 24 luni','Connection: USB · Layout: US · 87 keys · Demo warranty: 24 months']},{id:6,name:'Mouse Precision',brand:'Precision',priceCents:3999,category:'accessories',description:['Control precis, mișcare naturală. Mouse wireless ergonomic pentru biroul tău.','Precise control, natural movement. An ergonomic wireless mouse for your desk.'],spec:['Senzor: 3200 DPI · 6 butoane · Greutate: 90 g · Garanție demo: 24 luni','Sensor: 3200 DPI · 6 buttons · Weight: 90 g · Demo warranty: 24 months']}];
const pname=p=>lang==='en'?(p.enName||p.name):p.name, ptext=(p,key)=>p[key][lang==='ro'?0:1],money=cents=>new Intl.NumberFormat(lang==='ro'?'ro-RO':'en-GB',{style:'currency',currency:'EUR',currencyDisplay:'narrowSymbol',minimumFractionDigits:2,maximumFractionDigits:2}).format(cents/100);
const optname=k=>({color:t('Culoare','Color'),ram:'RAM (GB)',ssd:'SSD (GB)',connection:t('Conectare','Connection')}[k]);
function variant(p,v={}){const complete=!p.options||Object.keys(p.options).every(k=>p.options[k].includes(v[k]));let priceCents=p.priceCents;if(p.id===1)priceCents+=(v.ram==='32'?10000:0)+(v.ssd==='1024'?6050:0);if(p.id===2)priceCents+=v.ram==='32'?12025:0;if(p.id===3)priceCents-=v.connection==='wired'?2000:0;const stock=complete&&p.stock!==false&&!(p.id===1&&v.color==='red'&&v.ram==='32'&&v.ssd==='1024')&&!(p.id===2&&v.color==='black'&&v.ram==='32')&&!(p.id===3&&v.color==='purple'&&v.connection==='wired');return {complete,priceCents,stock,key:[p.id,...Object.keys(p.options||{}).map(k=>v[k])].join('-')};}
let cart=[];try{const raw=JSON.parse(localStorage.getItem('atelier-tech-cart-v2')||'[]');if(Array.isArray(raw))for(const item of raw){const p=products.find(p=>p.id===item.id);if(!p)continue;const v=variant(p,item.options);if(v.complete&&v.stock&&item.key===v.key&&Number.isInteger(item.qty)&&item.qty>=1&&item.qty<=10&&!cart.some(i=>i.key===item.key))cart.push({id:p.id,key:v.key,options:item.options||{},qty:item.qty});}}catch{}
let auth=null;try{const a=JSON.parse(localStorage.getItem('atelier-tech-auth')||sessionStorage.getItem('atelier-tech-auth')||'null');if(a?.email===demoAccount.email)auth=a;}catch{}
let currentProduct=null,selected={},view=1,checkout=null,orderNumber=0,toastTimer;
const shippingPricesCents=Object.freeze({standard:300,express:650});
const subtotalCents=()=>cart.reduce((s,i)=>s+variant(products.find(p=>p.id===i.id),i.options).priceCents*i.qty,0), totalCents=()=>subtotalCents()+shippingPricesCents[checkout?.shipping||'standard'];
function save(){localStorage.setItem('atelier-tech-cart-v2',JSON.stringify(cart));$('#cart-count').textContent=cart.reduce((s,i)=>s+i.qty,0);}
function toast(ro,en){$('#toast').textContent=t(ro,en);$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2500);}
const closeButton=id=>`<div class="dialog-language"><button type="button" data-testid="dialog-language-ro" data-language="ro" aria-pressed="${lang==='ro'}">RO</button><button type="button" data-testid="dialog-language-en" data-language="en" aria-pressed="${lang==='en'}">EN</button></div><button class="close" data-testid="${id}" aria-label="${t('Închide','Close')}">×</button>`;
function renderAnalyticsLink() {
  const link = $('[data-testid="analytics-link"]');
  link.textContent = t('Analiză date', 'Data Analytics');
  link.href = `https://vlad-qa-analytics.pages.dev/?lang=${lang}`;
}
function renderHero() {
  const image = $('[data-testid="hero-photo"]');
  const fallback = $('[data-testid="hero-image-fallback"]');
  image.alt = t('Fotografie ilustrativă de laptop', 'Illustrative laptop photograph');
  fallback.textContent = t(
    'Fotografia nu este disponibilă. Deschide Laptop Atlas 14 pentru detalii.',
    'The photograph is unavailable. Open Laptop Atlas 14 for product details.'
  );
  image.onerror = () => {
    image.hidden = true;
    fallback.hidden = false;
  };
  image.onload = () => {
    image.hidden = false;
    fallback.hidden = true;
  };
  if (image.complete && image.naturalWidth === 0) image.onerror();
  $('[data-testid="hero-price"]').textContent = money(products[0].priceCents);
  $('.hero .eyebrow').textContent = t('ATELIER TECH / COLECȚIA DEMO', 'ATELIER TECH / DEMO COLLECTION');
  $('.hero h1').innerHTML = t('Un upgrade pentru<br>fiecare zi.', 'An upgrade for<br>your everyday.');
  $('.hero-copy p:not(.eyebrow)').textContent = t(
    'Descoperă laptopuri, audio și accesorii. Alege configurația potrivită și explorează un checkout complet, într-un magazin demo.',
    'Discover laptops, audio, and accessories. Find your configuration and explore a complete checkout in a demo store.'
  );
  $('.hero-art small').textContent = t('Fotografie reală · produs ilustrativ', 'Real photo · illustrative product');
  $('.hero-actions a[href="#catalog"]').textContent = t('Explorează produsele →', 'Explore products →');
}
function renderShell() {
  localStorage.setItem('atelier-tech-language', lang);
  renderHero();
  renderAnalyticsLink();
  const creditsLink = $('[data-testid="photo-credits-link"]');
  creditsLink.textContent = t('Surse fotografii', 'Photo credits');
  creditsLink.href = `photo-credits.html?lang=${lang}`;
  const categoryValue = $('#category').value;
  document.documentElement.lang = lang;
  $('#account-open').textContent = auth || accountUI.signedIn() ? t('Contul meu', 'My account') : t('Autentificare', 'Sign in');
  $('#guide-open').textContent = t('Ghid QA', 'QA guide');
  $('#reset').textContent = t('Reset demo', 'Reset demo');
  $('#cart-open').innerHTML = `${t('Coș', 'Cart')} <span id="cart-count">${cart.reduce((sum, item) => sum + item.qty, 0)}</span>`;
  $('.notice').textContent = t('DEMO · Folosește date fictive. Nu se procesează plăți reale.', 'DEMO · Use fictional data. No real payments are processed.');
  $('#catalog .eyebrow').textContent = t('COLECȚIA DEMO', 'DEMO COLLECTION');
  $('#catalog h2').textContent = t('Găsește-ți următorul upgrade', 'Find your next upgrade');
  $('#search-label').textContent = t('Caută un produs', 'Search products');
  $('#search').placeholder = t('Ex: laptop, căști…', 'E.g. laptop, headphones…');
  $('#category-label').textContent = t('Categorie', 'Category');
  $('#category').innerHTML = `<option value="">${t('Toate categoriile', 'All categories')}</option>` + ['laptops', 'audio', 'accessories'].map(value => `<option value="${value}">${label(value)}</option>`).join('');
  $('#category').value = categoryValue;
  $('#brand-title').textContent = t('Branduri', 'Brands');
  $('#stock-label').textContent = t('Doar produse în stoc', 'In-stock products only');
  $('.features').innerHTML = [
    [t('01 / Alege-ți varianta', '01 / Find your configuration'), t('Culoare, memorie și opțiuni pentru fiecare stil de lucru.', 'Colors, memory, and options for your way of working.')],
    [t('02 / Vezi fiecare detaliu', '02 / Explore every detail'), t('Fotografii reale și trei imagini ilustrative pentru fiecare produs.', 'Real photography and three illustrative photos for every product.')],
    [t('03 / Explorează fără griji', '03 / Explore freely'), t('Checkout complet, comenzi și plăți simulate.', 'A complete checkout with simulated orders and payments.')]
  ].map(([title, description]) => `<div><b>${title}</b><p>${description}</p></div>`).join('');
  $('footer span').textContent = t('JavaScript + Playwright pregătit', 'JavaScript + Playwright ready');
  $('#language-ro').setAttribute('aria-pressed', lang === 'ro');
  $('#language-en').setAttribute('aria-pressed', lang === 'en');
  renderGuide();
}
function renderGuide(){$('#guide-dialog').innerHTML=`${closeButton('guide-close')}<p class="eyebrow">${t('GHID QA','QA GUIDE')}</p><h2>${t('Explorează scenariile demo','Explore demo scenarios')}</h2><a class="primary link-button" href="./qa-demo-shop.zip" download>${t('Descarcă proiectul și testele','Download project and tests')}</a><ol>${[t('Filtrează după categorie, brand și stoc. Caută un produs.','Filter by category, brand and stock. Search for a product.'),t('Selectează o variantă; Roșu / 32 / 1024 la Atlas este indisponibilă.','Select a variant; Red / 32 / 1024 on Atlas is unavailable.'),t('Navighează cele 3 fotografii și deschide zoom.','Browse the 3 photographs and open zoom.'),t('Adaugă variante diferite și verifică totalul coșului.','Add different variants and verify the cart total.'),t(`Testează login: ${esc(demoAccount.email)} / ${esc(demoAccount.password)}, cu și fără memorare.`,`Test login: ${esc(demoAccount.email)} / ${esc(demoAccount.password)}, with and without remember me.`),t('Finalizează checkout în 3 pași; verifică adresa de facturare, cardul fictiv și termenii.','Complete the 3-step checkout; check billing address, dummy card and terms.'),t('Schimbă RO / EN, reîncarcă pagina și resetează demo-ul.','Switch RO / EN, reload the page and reset the demo.')].map(s=>`<li>${s}</li>`).join('')}</ol><pre>await page.getByTestId('product-open-1').click();
await page.getByTestId('swatch-black').check();
await page.getByTestId('variant-ram').selectOption('16');
await page.getByTestId('variant-ssd').selectOption('512');
await page.getByTestId('add-to-cart').click();</pre><p>${t('Fotografii reale, ilustrative; stoc și plăți simulate. Cantitate 1–10 per variantă. Nu introduce date reale.','Real illustrative photographs; simulated stock and payments. Quantity 1–10 per variant. Never enter real data.')}</p>`;}
function renderProducts(){const q=$('#search').value.trim().toLocaleLowerCase(lang),cat=$('#category').value,brands=$$('.brand-filter:checked').map(x=>x.value),only=$('#stock-only').checked;const items=products.filter(p=>(!cat||cat===p.category)&&(!brands.length||brands.includes(p.brand))&&(!only||p.stock!==false)&&pname(p).toLocaleLowerCase(lang).includes(q));$('#result-count').textContent=items.length+' '+t('produse','products');$('#products').innerHTML=items.length?items.map(p=>`<article class="card" data-testid="product-card-${p.id}"><div class="product-art"><img data-product-image data-base="assets/products/${p.id}-1.jpg" src="assets/products/${p.id}-1.jpg" alt="${pname(p)}"></div><div class="card-body"><span class="category">${label(p.category)} · ${p.brand}</span><h3>${pname(p)}</h3><p>${ptext(p,'description')}</p><small class="stock-badge">${p.stock===false?t('Indisponibil','Unavailable'):t('În stoc','In stock')}${p.options?' · '+t('variante disponibile','variants available'):''}</small><div class="price-row"><b>${p.options?t('De la ','From '):''}${money(p.id===3?variant(p,{color:'black',connection:'wired'}).priceCents:p.priceCents)}</b><button data-testid="product-open-${p.id}" data-product="${p.id}">${t('Vezi produsul ↗','View product ↗')}</button></div></div></article>`).join(''):`<p class="empty">${t('Nu am găsit produse. Încearcă altă căutare.','No products found. Try another search.')}</p>`;attachImageFallbacks();}
function attachImageFallbacks() {
  $$('[data-product-image]').forEach(image => {
    image.onerror = () => {
      image.hidden = true;
      let message = image.parentElement.querySelector('.image-error');
      if (!message) {
        message = document.createElement('span');
        message.className = 'image-error';
        image.parentElement.append(message);
      }
      message.textContent = t('Fotografie indisponibilă. Încearcă altă vedere.', 'Photograph unavailable. Try another view.');
    };
    if (image.complete && image.naturalWidth === 0) image.onerror();
  });
}
function setProductImage(img,p,n){img.hidden=false;img.parentElement.querySelector('.image-error')?.remove();delete img.dataset.fallback;img.dataset.base=`assets/products/${p.id}-${n}.jpg`;img.src=imageSource(p,n);}
// Real product photographs stay the same when a color option changes.
function imageSource(p,n){return `assets/products/${p.id}-${n}.jpg`;}
function renderProduct(){const p=currentProduct,d=$('#product-dialog');if(!p)return;d.innerHTML=`${closeButton('product-close')}<div class="gallery" data-color="${selected.color||'default'}"><button data-testid="gallery-zoom" id="gallery-zoom" class="image-zoom" aria-label="${t('Mărește imaginea','Zoom image')}"><img data-product-image data-base="assets/products/${p.id}-${view}.jpg" data-testid="gallery-image" src="${imageSource(p,view)}" alt="${pname(p)} · ${t('fotografie ilustrativă','illustrative photo')} ${view}"></button><div class="gallery-controls"><button data-testid="gallery-prev" id="gallery-prev" aria-label="${t('Imaginea precedentă','Previous image')}">←</button>${[1,2,3].map(n=>`<button data-testid="gallery-thumb-${n}" data-view="${n}" aria-pressed="${n===view}" aria-label="${t('Fotografia','Photo')} ${n}"><img data-product-image data-base="assets/products/${p.id}-${n}.jpg" src="${imageSource(p,n)}" alt="${pname(p)} · ${t('fotografie ilustrativă','illustrative photo')} ${n}"></button>`).join('')}<button data-testid="gallery-next" id="gallery-next" aria-label="${t('Imaginea următoare','Next image')}">→</button></div><small>${t('Fotografii ilustrative · opțiune culoare','Illustrative photos · color option')}: ${selected.color?label(selected.color):t('selectează varianta','select variant')}</small></div><p class="eyebrow">${p.brand} · ${label(p.category)}</p><h2>${pname(p)}</h2><p>${ptext(p,'description')}</p><p class="spec">${ptext(p,'spec')}</p><form id="product-form">${Object.entries(p.options||{}).map(([k,values])=>k==='color'?`<fieldset class="swatch-group" data-testid="variant-color"><legend>${optname(k)}</legend><div class="swatches">${values.map(v=>`<label class="swatch-label"><input type="radio" name="product-color" data-testid="swatch-${v}" data-option="color" value="${v}" ${selected.color===v?'checked':''} required><span class="swatch-dot" data-color="${v}" aria-hidden="true"></span><span>${label(v)}</span></label>`).join('')}</div></fieldset>`:`<label>${optname(k)}<select data-testid="variant-${k}" data-option="${k}" required><option value="">${t('Selectează','Select')}</option>${values.map(v=>`<option value="${v}" ${selected[k]===v?'selected':''}>${label(v)}</option>`).join('')}</select></label>`).join('')}<div class="variant-summary"><b data-testid="product-price">${money(variant(p,selected).priceCents)}</b><span data-testid="product-stock" role="status"></span><button type="button" data-testid="select-options" id="select-options">${t('Selectează toate opțiunile','Select all options')}</button></div><div class="dialog-actions"><label>${t('Cantitate','Quantity')}<input data-testid="product-quantity" id="product-quantity" type="number" min="1" max="10" step="1" value="1" required></label><button class="primary" data-testid="add-to-cart">${t('Adaugă în coș','Add to cart')}</button></div><div class="error" data-testid="product-error" id="product-error" role="alert"></div></form>`;updateVariant();$('#product-form').onsubmit=e=>{e.preventDefault();const v=variant(p,selected),qty=Number($('#product-quantity').value);if(!v.complete||!v.stock||!Number.isInteger(qty)||qty<1||qty>10)return;const line=cart.find(i=>i.key===v.key);if((line?.qty||0)+qty>10){$('#product-error').textContent=t('Maximum 10 bucăți per variantă.','Maximum 10 units per variant.');return;}if(line)line.qty+=qty;else cart.push({id:p.id,key:v.key,options:{...selected},qty});save();d.close();toast('Produs adăugat în coș.','Product added to cart.');};}
function updateVariant(){const v=variant(currentProduct,selected);$('[data-testid="product-price"]').textContent=money(v.priceCents);$('[data-testid="product-stock"]').textContent=!v.complete?t('Opțiuni incomplete','Options incomplete'):v.stock?t('În stoc','In stock'):t('Variantă indisponibilă','Variant unavailable');$('[data-testid="select-options"]').hidden=v.complete;$('[data-testid="add-to-cart"]').disabled=!v.complete||!v.stock;$('.gallery').dataset.color=selected.color||'default';const img=$('[data-testid="gallery-image"]');setProductImage(img,currentProduct,view);$$('[data-view]').forEach(b=>setProductImage(b.querySelector('img'),currentProduct,Number(b.dataset.view)));attachImageFallbacks();img.alt=`${pname(currentProduct)} · ${t('fotografie ilustrativă','illustrative photo')} ${view}`;$('.gallery small').textContent=currentProduct.options?t('Fotografii ilustrative · nu reprezintă culorile selectate. Opțiune: ','Illustrative photos · selected colors are not shown. Option: ')+(selected.color?label(selected.color):t('selectează varianta','select variant')):t('3 fotografii reale, ilustrative','3 real illustrative photos');}
function focusMissingOption(){const k=Object.keys(currentProduct.options||{}).find(k=>!currentProduct.options[k].includes(selected[k]));if(!k)return;const target=k==='color'?$('[data-testid="variant-color"] input'):$(`[data-testid="variant-${k}"]`);target.scrollIntoView({block:'center',behavior:'smooth'});target.focus();const group=k==='color'?$('[data-testid="variant-color"]'):target;group.classList.add('option-attention');setTimeout(()=>group.classList.remove('option-attention'),1800);}
function openProduct(id){currentProduct=products.find(p=>p.id===id);selected={};view=1;renderProduct();$('#product-dialog').showModal();}
function variantText(i){return Object.entries(i.options).map(([k,v])=>`${optname(k)}: ${label(v)}`).join(' · ');}
function renderCart(){const d=$('#cart-dialog');d.innerHTML=`${closeButton('cart-close')}<p class="eyebrow">${t('COMANDA TA','YOUR ORDER')}</p><h2>${t('Coș de cumpărături','Shopping cart')}</h2>${cart.length?cart.map(i=>{const p=products.find(p=>p.id===i.id);return `<div class="cart-row" data-testid="cart-row-${i.key}"><div><b>${pname(p)}</b><small>${variantText(i)}</small><small><span data-testid="cart-unit-price-${i.key}">${money(variant(p,i.options).priceCents)}</span> / ${t('buc.','unit')}</small></div><input aria-label="${t('Cantitate','Quantity')} ${pname(p)} ${variantText(i)}" data-testid="cart-quantity-${i.key}" data-quantity="${i.key}" type="number" min="1" max="10" step="1" value="${i.qty}" required><button aria-label="${t('Șterge','Remove')} ${pname(p)}" data-testid="cart-remove-${i.key}" data-remove="${i.key}">×</button></div>`;}).join(''):`<p class="empty">${t('Coșul tău este gol.','Your cart is empty.')}</p>`}<div class="error" id="cart-error" role="alert"></div><div class="total"><span>${t('Subtotal','Subtotal')}</span><b data-testid="cart-total">${money(subtotalCents())}</b></div><p>${t('Livrare calculată la checkout','Shipping at checkout')}: ${money(shippingPricesCents.standard)} standard / ${money(shippingPricesCents.express)} express.</p><button class="primary wide" data-testid="checkout-open" id="checkout-open" ${cart.length?'':'disabled'}>${t('Continuă la checkout →','Continue to checkout →')}</button>`;}
function renderMockAccount(){const d=$('#login-dialog');if(auth){d.innerHTML=`${closeButton('login-close')}<h2>${t('Contul meu','My account')}</h2><p>Demo QA · ${esc(demoAccount.email)}</p><p>${t('Autentificare simulată, fără securitate sau backend real.','Simulated login, no real security or backend.')}</p><button class="primary" data-testid="logout" id="logout">${t('Deconectare','Sign out')}</button>`;return;}d.innerHTML=`${closeButton('login-close')}<h2>${t('Autentificare demo','Demo sign in')}</h2><p>${t('Cont de test','Test account')}: <b>${esc(demoAccount.email)}</b><br>${t('Parolă','Password')}: <b>${esc(demoAccount.password)}</b></p><p>${t('Nu folosi date reale. Autentificare simulată.','Do not use real data. Simulated authentication.')}</p><form id="login-form"><label>Email<input data-testid="login-email" name="email" type="email" required></label><label>${t('Parolă','Password')}<input data-testid="login-password" name="password" type="password" required></label><label class="check"><input data-testid="login-remember" name="remember" type="checkbox">${t('Ține-mă minte','Remember me')}</label><div class="error" data-testid="login-error" id="login-error" role="alert"></div><button class="primary wide" data-testid="login-submit">${t('Autentificare','Sign in')}</button></form>`;$('#login-form').onsubmit=e=>{e.preventDefault();const f=e.currentTarget;if(f.elements.email.value.trim()!==demoAccount.email||f.elements.password.value!==demoAccount.password){$('#login-error').textContent=t('Email sau parolă incorectă.','Incorrect email or password.');return;}auth={email:demoAccount.email,name:'Demo QA',address:t('Strada Demo 1, Cluj-Napoca','1 Demo Street, Cluj-Napoca')};localStorage.removeItem('atelier-tech-auth');sessionStorage.removeItem('atelier-tech-auth');(f.elements.remember.checked?localStorage:sessionStorage).setItem('atelier-tech-auth',JSON.stringify(auth));renderShell();d.close();};}
function renderAccount() { accountUI.render($('#login-dialog'), renderMockAccount); }
function startCheckout(){
  if(!cart.length)return;
  $('#cart-dialog').close();
  const account = accountUI.signedIn();
  checkout={step:1,mode:account?'account':'guest',name:auth?.name||'',email:auth?.email||'',address:auth?.address||'',sameBilling:true,billing:'',phone:'',shippingAddress:{},billingAddress:{},newsletter:false,shipping:'standard',payment:'cash',cardNumber:'',expiry:'',cvv:'',terms:false,submitting:false,pendingOrder:null};
  if(account)Object.assign(checkout,accountUI.defaults());
  renderCheckout();$('#checkout-dialog').showModal();
}
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
let lastAccountOwner = null;
const accountUI = createAccountUI({ t, esc, closeButton, money, onStateChange() {
  const owner = accountUI.state.session?.user?.id || null;
  if (lastAccountOwner && lastAccountOwner !== owner && checkout?.mode === 'account') {
    checkout = null;
    $('#checkout-dialog').close();
    $('#checkout-dialog').innerHTML = '';
    toast('Sesiunea contului s-a schimbat. Coșul este păstrat; autentifică-te și reia checkout-ul.', 'Your account session changed. Your cart is kept; sign in and restart checkout.');
  }
  lastAccountOwner = owner;
  renderShell();
} });
function collectCheckout(){
  if(!checkout)return;
  const map={'customer-name':'name','customer-email':'email','customer-address':'address','billing-address':'billing','customer-phone':'phone','card-number':'cardNumber','card-expiry':'expiry','card-cvv':'cvv'};
  for(const [id,key] of Object.entries(map)){const e=$(`[data-testid="${id}"]`);if(e)checkout[key]=e.value;}
  for(const [id,key] of [['same-billing','sameBilling'],['newsletter','newsletter'],['terms','terms']]){const e=$(`[data-testid="${id}"]`);if(e)checkout[key]=e.checked;}
  if(checkout.mode==='account'&&$('[data-testid="shipping-street"]')){checkout.shippingAddress=readAddress($('#checkout-dialog'),'shipping');checkout.billingAddress=readAddress($('#checkout-dialog'),'billing');checkout.email=accountUI.state.session?.user?.email||'';}
  const shipping=$('[name="shipping"]:checked'),payment=$('[name="payment"]:checked');if(shipping)checkout.shipping=shipping.value;if(payment)checkout.payment=payment.value;
}
function readableAddress(address){return [address.street,address.houseNumber,address.city,address.postalCode,address.country].filter(Boolean).join(', ');}
function checkoutContactFields(c){
  if(c.mode!=='account')return `${field('customer-name',t('Nume complet','Full name'),'name')}${field('customer-email','Email','email','email')}${field('customer-address',t('Adresă de livrare','Shipping address'),'address')}<label class="check"><input data-testid="same-billing" type="checkbox" ${c.sameBilling?'checked':''}>${t('Adresa de facturare este aceeași','Billing address is the same')}</label><div id="billing-fields" ${c.sameBilling?'hidden':''}>${field('billing-address',t('Adresă de facturare','Billing address'),'billing')}</div>`;
  return `${field('customer-name',t('Nume complet','Full name'),'name')}<label>${t('Email din cont','Account email')}<input data-testid="customer-email" type="email" value="${esc(c.email)}" readonly></label>${field('customer-phone',t('Telefon','Phone'),'phone','tel')}<fieldset><legend>${t('Adresă de livrare','Shipping address')}</legend>${addressInputs({prefix:'shipping',address:c.shippingAddress,t,esc})}</fieldset><label class="check"><input data-testid="same-billing" type="checkbox" ${c.sameBilling?'checked':''}>${t('Adresa de facturare este aceeași','Billing address is the same')}</label><fieldset id="billing-fields" ${c.sameBilling?'hidden':''}><legend>${t('Adresă de facturare','Billing address')}</legend>${addressInputs({prefix:'billing',address:c.billingAddress,t,esc})}</fieldset>`;
}
function field(id,title,key,type='text'){return `<label>${title}<input data-testid="${id}" name="${key}" type="${type}" value="${esc(checkout[key])}" required maxlength="300"></label>`;}
function renderCheckout(){
  const c=checkout,d=$('#checkout-dialog');if(!c)return;
  const contactFields=checkoutContactFields(c);
  const shippingAddress=c.mode==='account'?readableAddress(c.shippingAddress):c.address;
  const billingAddress=c.mode==='account'?readableAddress(c.sameBilling?c.shippingAddress:c.billingAddress):c.sameBilling?c.address:c.billing;
  const modeLabel=c.mode==='account'?t('Cont Supabase · comandă demo salvată','Supabase account · saved demo order'):t('Invitat / demo local · fără salvare în Supabase','Guest / local mock · no Supabase writes');
  d.innerHTML=`${closeButton('checkout-close')}<p class="eyebrow">${t('CHECKOUT DEMO','DEMO CHECKOUT')} · <span data-testid="checkout-step">${c.step} / 3</span></p><h2>${[t('Adresă și contact','Address and contact'),t('Livrare și plată','Shipping and payment'),t('Verifică și confirmă','Review and confirm')][c.step-1]}</h2><p>${t('Doar date fictive. Fără plăți sau livrări reale.','Fictional data only. No real payments or deliveries.')}</p><p class="account-notice" data-testid="checkout-mode-label">${modeLabel}</p><form data-testid="checkout-form" id="checkout-form" novalidate>${c.step===1?`<label>${t('Mod comandă','Order mode')}<select data-testid="checkout-mode"><option value="guest" ${c.mode==='guest'?'selected':''}>${t('Invitat / demo local (simulat)','Guest / local demo (mock)')}</option><option value="account" ${c.mode==='account'?'selected':''} ${accountUI.signedIn()?'':'disabled'}>${t('Cont Supabase (salvat)','Supabase account (saved)')}</option></select></label>${contactFields}<label class="check"><input data-testid="newsletter" type="checkbox" ${c.newsletter?'checked':''}>${t('Abonare newsletter (opțional, simulat)','Newsletter subscription (optional, simulated)')}</label>`:c.step===2?`<fieldset><legend>${t('Livrare','Shipping')}</legend>${['standard','express'].map(v=>`<label class="check"><input type="radio" name="shipping" data-testid="shipping-${v}" value="${v}" ${c.shipping===v?'checked':''}>${v==='standard'?`Standard · ${money(shippingPricesCents.standard)} · ${t('3–5 zile','3–5 days')}`:`Express · ${money(shippingPricesCents.express)} · ${t('1–2 zile','1–2 days')}`}</label>`).join('')}</fieldset><fieldset><legend>${t('Plată simulată','Simulated payment')}</legend>${['cash','card'].map(v=>`<label class="check"><input type="radio" name="payment" data-testid="payment-${v}" value="${v}" ${c.payment===v?'checked':''}>${v==='cash'?t('Numerar la livrare (simulat)','Cash on delivery (simulated)'):t('Card fictiv (simulat)','Dummy card (simulated)')}</label>`).join('')}</fieldset><div id="card-fields" ${c.payment==='card'?'':'hidden'}><p>${t('Exemplu fictiv: 4242424242424242 · 12/30 · 123','Dummy example: 4242424242424242 · 12/30 · 123')}</p>${field('card-number',t('Număr card fictiv','Dummy card number'),'cardNumber')}${field('card-expiry',t('Expirare MM/YY','Expiry MM/YY'),'expiry')}${field('card-cvv','CVV','cvv')}</div>`:`<div class="review"><h3>${t('Produse','Products')}</h3>${cart.map(i=>`<p>${pname(products.find(p=>p.id===i.id))} × ${i.qty}<small>${variantText(i)}</small></p>`).join('')}<p><b>${t('Contact','Contact')}</b>: ${esc(c.name)} · ${esc(c.email)}${c.mode==='account'?` · ${esc(c.phone)}`:''}</p><p><b>${t('Livrare','Shipping')}</b>: ${esc(shippingAddress)} · ${c.shipping==='express'?'Express':'Standard'}</p><p><b>${t('Facturare','Billing')}</b>: ${esc(billingAddress)}</p><p><b>${t('Plată','Payment')}</b>: ${c.payment==='card'?t('Card fictiv','Dummy card'):t('Numerar','Cash')}</p><p>Newsletter: ${c.newsletter?t('Da','Yes'):t('Nu','No')}</p></div><label class="check"><input data-testid="terms" type="checkbox" ${c.terms?'checked':''} required>${t('Accept termenii comenzii demo','I accept the demo order terms')}</label>`}<div class="total"><span>${t('Total cu livrare','Total including shipping')}</span><b data-testid="review-total">${money(totalCents())}</b></div><div class="error" data-testid="checkout-error" id="checkout-error" role="alert">${c.error?t(c.error.ro,c.error.en):''}</div><div class="checkout-actions">${c.step>1?`<button type="button" data-testid="checkout-back" id="checkout-back" ${c.submitting?'disabled':''}>${t('← Înapoi','← Back')}</button>`:''}<button class="primary" data-testid="${c.step===3?'place-order':'checkout-next'}" ${c.submitting?'disabled':''}>${c.submitting?t('Se salvează…','Saving…'):c.step===3?c.mode==='account'?t('Salvează comanda demo','Save demo order'):t('Plasează comanda demo','Place demo order'):t('Continuă →','Continue →')}</button></div></form>`;
  d.querySelector('[data-testid="checkout-mode"]')?.addEventListener('change',event=>{
    collectCheckout();const mode=event.target.value;if(mode==='account'&&!accountUI.signedIn())return;
    c.mode=mode;c.pendingOrder=null;c.error=null;
    if(mode==='account')Object.assign(c,accountUI.defaults());
    else Object.assign(c,{name:auth?.name||'',email:auth?.email||'',address:auth?.address||'',billing:'',sameBilling:true});
    renderCheckout();
  });
  if(c.submitting)d.querySelectorAll('input,select,[data-testid="checkout-close"]').forEach(control=>control.disabled=true);
  $('#checkout-form').onsubmit=e=>{
    e.preventDefault();if(c.submitting)return;collectCheckout();let error='';c.error=null;
    if(c.step===1){
      if(c.mode==='account'){
        if(!accountUI.signedIn())error=t('Autentifică-te din nou pentru a salva comanda.','Sign in again to save your order.');
        else try{validateContact(c);}catch{error=t('Completează numele (2–120 caractere), telefonul (7–15 cifre) și toate câmpurile adresei; țara necesită două litere.','Complete the name (2–120 characters), phone (7–15 digits), and all address fields; country requires two letters.');}
      }else if(!c.name.trim()||!c.email.trim()||!c.address.trim()||(!c.sameBilling&&!c.billing.trim()))error=t('Completează toate câmpurile obligatorii.','Complete all required fields.');
      else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim()))error=t('Introdu un email valid.','Enter a valid email.');
    }
    if(c.step===2&&c.payment==='card'&&(!/^\d{16}$/.test(c.cardNumber.replaceAll(' ',''))||!/^(0[1-9]|1[0-2])\/\d{2}$/.test(c.expiry)||!/^\d{3}$/.test(c.cvv)))error=t('Completează cardul fictiv: 16 cifre, MM/YY și CVV 3 cifre.','Complete the dummy card: 16 digits, MM/YY and 3-digit CVV.');
    if(c.step===3&&!c.terms)error=t('Acceptă termenii pentru a continua.','Accept the terms to continue.');
    if(error){$('#checkout-error').textContent=error;return;}
    if(c.step<3){c.step++;renderCheckout();}else finishOrder();
  };
}
let lastOrder=null;
function renderConfirmation(){
  const {amountCents,number,stored,orderId}=lastOrder;
  $('#checkout-dialog').innerHTML=`${closeButton('checkout-close')}<div data-testid="order-confirmation"><div class="success-icon">✓</div><p class="eyebrow">${stored?t('COMANDĂ DEMO SALVATĂ ÎN CONT','DEMO ORDER SAVED TO ACCOUNT'):t('COMANDĂ SIMULATĂ LOCAL','LOCAL MOCK ORDER')}</p><h2>${stored?t('Comanda demo a fost salvată!','Demo order saved!'):t('Comanda a fost plasată!','Order placed!')}</h2><p>${t('Numărul comenzii','Order number')}: <b data-testid="order-number">${stored?esc(orderId):`DEMO-${String(number).padStart(4,'0')}`}</b></p><div class="total"><span>${t('Total comandă','Order total')}</span><b data-testid="order-total">${money(amountCents)}</b></div><p>${stored?t('Confirmare primită de la Supabase. Nu s-a efectuat nicio plată și nu se livrează produse.','Confirmation received from Supabase. No payment was made and no products will be shipped.'):t('Comandă locală simulată, fără salvare în Supabase. Nu s-a efectuat nicio plată și nu se livrează produse.','Local mock order, with no Supabase writes. No payment was made and no products will be shipped.')}</p><button class="primary wide" id="continue-shopping">${t('Continuă cumpărăturile','Continue shopping')}</button></div>`;
}
function freezePayload(value){if(value&&typeof value==='object'){Object.values(value).forEach(freezePayload);Object.freeze(value);}return value;}
async function finishOrder(){
  const c=checkout;if(!c||c.submitting)return;
  if(c.mode!=='account'){lastOrder={amountCents:totalCents(),number:++orderNumber,stored:false};cart=[];save();checkout=null;renderConfirmation();return;}
  const owner=accountUI.state.session?.user?.id,sessionVersion=accountUI.sessionVersion();
  if(!owner){c.error={ro:'Autentifică-te din nou pentru a salva comanda. Coșul este păstrat.',en:'Sign in again to save your order. Your cart is kept.'};renderCheckout();return;}
  let contact;
  try{contact=validateContact(c);}catch{c.error={ro:'Verifică datele de contact și adresele înainte de salvare.',en:'Check contact details and addresses before saving.'};renderCheckout();return;}
  const orderData={contact,items:cart.map(({key,qty})=>({key,qty})),shipping:c.shipping,expectedTotals:{subtotalCents:subtotalCents(),shippingCents:shippingPricesCents[c.shipping],totalCents:totalCents()}};
  const fingerprint=JSON.stringify(orderData);
  if(!c.pendingOrder||c.pendingOrder.fingerprint!==fingerprint||c.pendingOrder.owner!==owner||c.pendingOrder.sessionVersion!==sessionVersion)c.pendingOrder={owner,sessionVersion,fingerprint,payload:freezePayload({requestId:crypto.randomUUID(),...orderData})};
  const request=c.pendingOrder;c.submitting=true;c.error=null;renderCheckout();
  try{
    const result=await accountUI.placeOrder(request.payload);
    if(checkout!==c||accountUI.state.session?.user?.id!==owner||accountUI.sessionVersion()!==sessionVersion)return;
    const expected=request.payload.expectedTotals;
    if(result?.order_id!==request.payload.requestId||result.currency!=='EUR'||result.subtotal_cents!==expected.subtotalCents||result.shipping_cents!==expected.shippingCents||result.total_cents!==expected.totalCents||![result.subtotal_cents,result.shipping_cents,result.total_cents].every(Number.isSafeInteger))throw new Error('Order confirmation totals mismatch.');
    lastOrder={amountCents:result.total_cents,stored:true,orderId:result.order_id};
    cart=[];save();c.cardNumber='';c.expiry='';c.cvv='';checkout=null;renderConfirmation();
    await accountUI.refreshAfterOrder();
  }catch(error){
    if(checkout!==c||accountUI.state.session?.user?.id!==owner||accountUI.sessionVersion()!==sessionVersion)return;
    const mismatch=/price|catalog|total|confirmation|stock|variant/i.test(error?.message||'');
    c.error=mismatch?{ro:'Catalogul, prețul sau confirmarea nu corespunde. Comanda nu este confirmată în interfață; coșul este păstrat. Verifică datele și reîncearcă cu același identificator pentru reconciliere.',en:'Catalog, price, or confirmation mismatch. This order is not confirmed in the interface; your cart is kept. Check the details and retry with the same request ID to reconcile.'}:{ro:'Salvarea comenzii nu a putut fi confirmată. Coșul și datele sunt păstrate. Reîncearcă; aceleași date reutilizează același identificator, fără comandă duplicată.',en:'Order saving could not be confirmed. Your cart and details are kept. Retry; identical details reuse the same request ID without duplicating the order.'};
  }finally{if(checkout===c){c.submitting=false;renderCheckout();}}
}
function renderZoom(){const d=$('#zoom-dialog');d.innerHTML=`${closeButton('zoom-close')}<img data-product-image data-base="assets/products/${currentProduct.id}-${view}.jpg" src="${imageSource(currentProduct,view)}" alt="${pname(currentProduct)} · ${t('fotografie ilustrativă','illustrative photo')} ${view}" class="zoom-image" data-color="${selected.color||'default'}">`;attachImageFallbacks();}
function persistLanguage() {
  localStorage.setItem('atelier-tech-language', lang);
  const languageUrl = new URL(location.href);
  languageUrl.searchParams.set('lang', lang);
  history.replaceState(history.state, '', languageUrl.href);
}
function switchLanguage(next){if(!['ro','en'].includes(next))return;accountUI.collect();if(lang===next){persistLanguage();return;}collectCheckout();const category=$('#category').value,qty=$('#product-quantity')?.value;const loginEmail=$('[data-testid="login-email"]')?.value,loginPassword=$('[data-testid="login-password"]')?.value,remember=$('[data-testid="login-remember"]')?.checked;lang=next;persistLanguage();renderShell();$('#category').value=category;renderProducts();if($('#product-dialog').open){renderProduct();$('#product-quantity').value=qty;}if($('#zoom-dialog').open)renderZoom();if($('#cart-dialog').open)renderCart();if($('#login-dialog').open){renderAccount();if(!auth&&accountUI.state.mode==='guest'&&$('[data-testid="login-email"]')){$('[data-testid="login-email"]').value=loginEmail||'';$('[data-testid="login-password"]').value=loginPassword||'';$('[data-testid="login-remember"]').checked=remember;}}if($('#checkout-dialog').open&&checkout)renderCheckout();else if($('#checkout-dialog').open&&lastOrder)renderConfirmation();$('#toast').classList.remove('show');}
let resetPending = false;
async function resetDemo(){
  if(resetPending)return;
  resetPending=true;$('#reset').disabled=true;
  try{
    if(!(await accountUI.reset())){
      toast('Resetarea nu a fost aplicată: deconectarea contului nu a putut fi confirmată. Încearcă din nou.', 'Reset was not applied: account sign out could not be confirmed. Try again.');
      return;
    }
    cart=[];auth=null;checkout=null;currentProduct=null;orderNumber=0;lastOrder=null;localStorage.removeItem('atelier-tech-auth');sessionStorage.removeItem('atelier-tech-auth');localStorage.removeItem('atelier-tech-cart');save();$$('dialog[open]').forEach(d=>d.close());$('#checkout-dialog').innerHTML='';$('#search').value='';$('#category').value='';$$('.brand-filter').forEach(e=>e.checked=false);$('#stock-only').checked=false;renderShell();renderProducts();toast('Demo resetat.','Demo reset.');
  }finally{resetPending=false;$('#reset').disabled=false;}
}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.classList.contains('close'))b.closest('dialog').close();if(b.id==='select-options')focusMissingOption();if(b.dataset.product)openProduct(Number(b.dataset.product));if(b.dataset.remove){cart=cart.filter(i=>i.key!==b.dataset.remove);save();renderCart();}if(b.id==='cart-open'){renderCart();$('#cart-dialog').showModal();}if(b.id==='checkout-open')startCheckout();if(b.id==='guide-open')$('#guide-dialog').showModal();if(b.id==='account-open'){renderAccount();$('#login-dialog').showModal();}if(b.id==='logout'){auth=null;localStorage.removeItem('atelier-tech-auth');sessionStorage.removeItem('atelier-tech-auth');renderShell();$('#login-dialog').close();}if(b.id==='continue-shopping')$('#checkout-dialog').close();if(b.id==='checkout-back'){collectCheckout();checkout.step--;renderCheckout();}if(b.id==='gallery-next'||b.id==='gallery-prev'||b.dataset.view){view=b.dataset.view?Number(b.dataset.view):((view-1+(b.id==='gallery-next'?1:2))%3)+1;const qty=$('#product-quantity').value;renderProduct();$('#product-quantity').value=qty;}if(b.id==='gallery-zoom'){renderZoom();$('#zoom-dialog').showModal();}if(b.dataset.language)switchLanguage(b.dataset.language);if(b.id==='language-ro'||b.id==='language-en')switchLanguage(b.id.endsWith('en')?'en':'ro');if(b.id==='reset')resetDemo();});
document.addEventListener('change',e=>{if(e.target.dataset.option){selected[e.target.dataset.option]=e.target.value;updateVariant();}if(e.target.dataset.quantity){const item=cart.find(i=>i.key===e.target.dataset.quantity),qty=Number(e.target.value);if(!Number.isInteger(qty)||qty<1||qty>10){$('#cart-error').textContent=t('Cantitatea trebuie să fie un întreg între 1 și 10.','Quantity must be an integer from 1 to 10.');e.target.value=item.qty;return;}item.qty=qty;save();renderCart();}if(e.target.classList.contains('brand-filter')||e.target.id==='stock-only'||e.target.id==='category')renderProducts();if(e.target.matches('[data-testid="same-billing"],[name="payment"],[name="shipping"]')){collectCheckout();$('#billing-fields')?.toggleAttribute('hidden',checkout.sameBilling);$('#card-fields')?.toggleAttribute('hidden',checkout.payment!=='card');if($('[data-testid="review-total"]'))$('[data-testid="review-total"]').textContent=money(totalCents());}});
$('#search').addEventListener('input',renderProducts);renderShell();save();renderProducts();accountUI.init();
})().catch(error => console.error('Unable to start the demo shop:', error.message));
