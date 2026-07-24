// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDAWdW_M10sMElFdkWabPeJoHJC-FX7ji0",
  authDomain: "sineup-63fd8.firebaseapp.com",
  projectId: "sineup-63fd8",
  storageBucket: "sineup-63fd8.firebasestorage.app",
  messagingSenderId: "537176667497",
  appId: "1:537176667497:web:319901884f5efc1c0639f8",
  measurementId: "G-GBX6HP3FHY"
};





firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();



/* ================= NAV ================= */
function showPage(name){
  if(name!=='medical' && typeof pc !== 'undefined' && pc){ endCall(); }
  if(name!=='medical' && typeof currentRoomApptId !== 'undefined' && currentRoomApptId){ closeMedRoom(); }
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+name).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  const navBtn = document.querySelector('.nav-btn[data-page="'+name+'"]');
  if(navBtn) navBtn.classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
  if(name==='myplans'){
    backToMyPlansList();
  }
  if(name==='profile' || name==='marketplace' || name==='myplans' || name==='medical'){
    renderAccountState();
  }
  if(name==='home'){
    renderHomeTasks();
    renderHomeAppointments();
  }
  if(name==='become-doctor'){
    initBecomeDoctorPage();
  }
  if(name==='admin-doctors'){
    initAdminDoctorsPage();
  }
}
document.querySelectorAll('.nav-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>showPage(btn.dataset.page));
});

/* ================= WEATHER TOGGLE ================= */
const wToggle = document.getElementById('weatherToggle');
const wPanel = document.getElementById('weatherPanel');
wToggle.addEventListener('click', ()=>{
  wPanel.classList.toggle('open');
  wToggle.classList.toggle('open');
  wToggle.querySelector('span').textContent = wPanel.classList.contains('open') ? 'Show less' : 'Learn more';
});

/* ================= REAL-TIME WEATHER (Open-Meteo, no key needed) ================= */
const weatherIconsSVG = {
  sun:'<circle cx="12" cy="12" r="5"/><path d="M12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  cloud:'<path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.4-1.5A5 5 0 0 0 6.5 19h11z"/>',
  rain:'<path d="M17.5 15a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.4-1.5A5 5 0 0 0 6.5 15h11z"/><path d="M8 19v2M12 19v2M16 19v2"/>'
};
function iconForWmoCode(code){
  if(code===0 || code===1) return 'sun';
  if([2,3,45,48].includes(code)) return 'cloud';
  return 'rain';
}
function descForWmoCode(code){
  const map = {0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',48:'Freezing fog',
    51:'Light drizzle',53:'Drizzle',55:'Dense drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',
    71:'Light snow',73:'Snow',75:'Heavy snow',80:'Rain showers',81:'Rain showers',82:'Violent rain showers',
    95:'Thunderstorm',96:'Thunderstorm with hail',99:'Severe thunderstorm'};
  return map[code] || 'Mixed conditions';
}
const DEFAULT_LOCATION = {lat:23.8103, lon:90.4125, label:'Dhaka, Bangladesh'};

function initWeather(){
  if(!navigator.geolocation){
    loadWeatherFor(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon, DEFAULT_LOCATION.label, true);
    return;
  }
  navigator.geolocation.getCurrentPosition(
    pos=>{
      reverseGeocode(pos.coords.latitude, pos.coords.longitude).then(label=>{
        loadWeatherFor(pos.coords.latitude, pos.coords.longitude, label, false);
      });
    },
    err=>{
      console.warn('Geolocation unavailable, using default location:', err.message);
      loadWeatherFor(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon, DEFAULT_LOCATION.label, true);
    },
    {timeout:8000, maximumAge:600000}
  );
}
function reverseGeocode(lat, lon){
  return fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`)
    .then(r=>r.json())
    .then(d=> [d.city||d.locality, d.principalSubdivision, d.countryName].filter(Boolean).join(', ') || 'Your location')
    .catch(()=> 'Your location');
}
async function loadWeatherFor(lat, lon, label, isDefault){
  document.getElementById('chip-loc').textContent = (isDefault ? 'Location unavailable — showing ' : 'Locating… ') + label;
  try{
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`;
    const res = await fetch(url);
    const data = await res.json();
    if(!data.current) throw new Error('No current weather in response');

    const cur = data.current;
    const desc = descForWmoCode(cur.weather_code);
    document.getElementById('chip-temp').textContent = `${Math.round(cur.temperature_2m)}°C`;
    document.getElementById('chip-loc').textContent = `${desc} · ${label} · feels ${Math.round(cur.apparent_temperature)}°C`;
    document.getElementById('weatherSourceTag').textContent = (isDefault ? 'Live from Open-Meteo (default location) · ' : 'Live from Open-Meteo · your location · ') + label;

    const stripEl = document.getElementById('forecastStrip');
    stripEl.innerHTML = '';
    data.daily.time.forEach((dateStr, i)=>{
      let dayLabel;
      if(i===0) dayLabel='Today';
      else if(i===1) dayLabel='Tomorrow';
      else dayLabel = new Date(dateStr+'T00:00:00').toLocaleDateString(undefined,{weekday:'short'});
      const icon = iconForWmoCode(data.daily.weather_code[i]);
      const hi = Math.round(data.daily.temperature_2m_max[i]);
      stripEl.innerHTML += `<div class="fc-day"><div class="d">${dayLabel}</div><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${weatherIconsSVG[icon]}</svg><div class="t">${hi}°</div></div>`;
    });

    fetchWeatherAdvisory(desc, cur, data.daily, label);
  } catch(err){
    console.warn('Weather fetch failed:', err);
    document.getElementById('weatherErrorNote').style.display='block';
    document.getElementById('weatherErrorNote').textContent = 'Could not load live weather: ' + err.message;
    document.getElementById('weatherSourceTag').textContent = 'Weather unavailable right now';
  }
}
async function fetchWeatherAdvisory(desc, cur, daily, label){
  const prompt = `You are a farm advisory AI. Current weather in ${label}: ${desc}, temperature ${Math.round(cur.temperature_2m)}°C, feels like ${Math.round(cur.apparent_temperature)}°C, humidity ${cur.relative_humidity_2m}%, wind ${Math.round(cur.wind_speed_10m)} km/h. Next few days highs: ${daily.temperature_2m_max.slice(0,3).map(t=>Math.round(t)+'°C').join(', ')}.
Give practical advice for a smallholder farmer raising poultry, cattle, goats and/or ducks. Reply with ONLY raw JSON (no markdown, no commentary) in this shape:
{"advisory":[string,string,string], "alert": {"title":string,"body":string} or null}
"advisory" must be exactly 3 short (under 20 words each) actionable tips relevant to this specific weather. Set "alert" to null unless the weather poses a real elevated risk (heat stress, cold stress, flooding, storm, high wind) worth a dedicated warning.`;
  try{
    const res = await fetch(WORKER_URL, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({contents:[{role:'user', parts:[{text:prompt}]}]})
    });
    const data = await res.json();
    if(data.error) throw new Error(data.error.message||'AI service error');
    const text = data.candidates && data.candidates[0] && data.candidates[0].content
      ? data.candidates[0].content.parts.map(p=>p.text||'').join('') : '';
    const parsed = extractJson(text);
    if(!parsed) throw new Error('Could not parse advisory response');

    document.getElementById('recoList').innerHTML = (parsed.advisory||[]).map(tip=>
      `<li><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg> ${escapeHtml(tip)}</li>`
    ).join('');

    const alertBanner = document.getElementById('weatherAlertBanner');
    if(parsed.alert && parsed.alert.title){
      document.getElementById('weatherAlertTitle').textContent = parsed.alert.title;
      document.getElementById('weatherAlertBody').textContent = parsed.alert.body || '';
      alertBanner.style.display = 'flex';
    } else {
      alertBanner.style.display = 'none';
    }
  } catch(err){
    console.warn('Weather advisory failed:', err);
    document.getElementById('recoList').innerHTML = `<li><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg> Could not load AI advisory right now — check back shortly.</li>`;
  }
}
initWeather();

/* sparkline bars for market */
['spark1','spark2','spark3','spark4','spark5','spark6'].forEach(id=>{
  const el = document.getElementById(id);
  for(let i=0;i<12;i++){
    const h = 20 + Math.random()*80;
    el.innerHTML += `<div style="height:${h}%"></div>`;
  }
});

/* ================= MARKET PRICES (live via Gemini + Google Search grounding) ================= */
const MARKET_WORKER_URL = 'https://misty-mountain-fc0e.mdaimon59.workers.dev/';
const marketRefreshBtn = document.getElementById('marketRefreshBtn');
const marketStatusNote = document.getElementById('marketStatusNote');
const marketUpdatedTag = document.getElementById('marketUpdatedTag');

const marketFields = ['eggs','milk','broiler','goat','feed','duck'];
const marketElIds = {
  eggs:{price:'eggPrice', unit:'eggUnit', trend:'eggTrend', source:'eggSource'},
  milk:{price:'milkPrice', unit:'milkUnit', trend:'milkTrend', source:'milkSource'},
  broiler:{price:'broilerPrice', unit:'broilerUnit', trend:'broilerTrend', source:'broilerSource'},
  goat:{price:'goatPrice', unit:'goatUnit', trend:'goatTrend', source:'goatSource'},
  feed:{price:'feedPrice', unit:'feedUnit', trend:'feedTrend', source:'feedSource'},
  duck:{price:'duckPrice', unit:'duckUnit', trend:'duckTrend', source:'duckSource'}
};

function marketPrompt(region){
  return `Use Google Search to find the most current market prices (this week if possible) in ${region} for smallholder farm products. I need: (1) chicken eggs, price per single egg, (2) cow milk, price per litre, (3) broiler chicken meat, price per kg live or dressed weight, (4) goat meat, price per kg, (5) poultry/cattle feed, price per 50kg bag, (6) duck meat, price per kg.
Look at recent local news sites, agricultural market reports, or government price bulletins for ${region}.
Reply with ONLY raw JSON (no markdown, no code fences, no commentary) in exactly this shape:
{"eggs":{"price":number,"unit":"per egg","trend":"up"|"down"|"flat","source":string},
"milk":{"price":number,"unit":"per litre","trend":"up"|"down"|"flat","source":string},
"broiler":{"price":number,"unit":"per kg","trend":"up"|"down"|"flat","source":string},
"goat":{"price":number,"unit":"per kg","trend":"up"|"down"|"flat","source":string},
"feed":{"price":number,"unit":"per 50kg bag","trend":"up"|"down"|"flat","source":string},
"duck":{"price":number,"unit":"per kg","trend":"up"|"down"|"flat","source":string},
"asOf":string}
All prices in local currency with the symbol included (e.g. "৳ 12.50" for Bangladesh, or the correct symbol for the given region). "source" should be a short attribution like "Dhaka Tribune, Jul 2026" — not a full URL. If you can't find an exact figure for something, give your best current estimate from related reports and say so briefly inside "source" (e.g. "Estimated from regional feed price trends"). "trend" reflects direction vs last week/month if known, otherwise "flat".`;
}

function renderTrend(el, trend){
  el.className = 'trend ' + (trend==='down' ? 'down' : 'up');
  el.textContent = trend==='down' ? '▼ trending down' : (trend==='up' ? '▲ trending up' : '● steady');
}

async function refreshMarketPrices(){
  const region = document.getElementById('marketRegionInput').value.trim() || 'Bangladesh';
  marketRefreshBtn.disabled = true;
  const origLabel = marketRefreshBtn.textContent;
  marketRefreshBtn.textContent = 'Checking live prices…';
  marketStatusNote.style.display = 'none';

  try{
    const res = await fetch(MARKET_WORKER_URL, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        contents:[{role:'user', parts:[{text: marketPrompt(region)}]}],
        tools:[{google_search:{}}]
      })
    });
    const data = await res.json();
    if(data.error){ throw new Error((data.error.message||'AI service error') + ' (status ' + res.status + ')'); }
    const text = data.candidates && data.candidates[0] && data.candidates[0].content
      ? data.candidates[0].content.parts.map(p=>p.text||'').join('')
      : '';
    const parsed = extractJson(text);
    if(!parsed){ throw new Error('Could not parse AI response: ' + text.slice(0,200)); }

    marketFields.forEach(key=>{
      const info = parsed[key];
      const ids = marketElIds[key];
      if(!info || !ids) return;
      const priceEl = document.getElementById(ids.price);
      const unitEl = document.getElementById(ids.unit);
      const trendEl = document.getElementById(ids.trend);
      const sourceEl = document.getElementById(ids.source);
      if(priceEl) priceEl.textContent = (typeof info.price === 'number') ? `৳ ${info.price.toLocaleString()}` : String(info.price || '—');
      if(unitEl && info.unit) unitEl.textContent = '/ ' + info.unit.replace(/^per\s*/,'');
      if(trendEl) renderTrend(trendEl, info.trend);
      if(sourceEl) sourceEl.textContent = info.source || 'AI estimate';
    });

    marketUpdatedTag.textContent = `Live via AI · ${parsed.asOf || 'just now'} · ${region}`;
  } catch(err){
    console.warn('Market price refresh failed:', err);
    marketStatusNote.style.display = 'block';
    marketStatusNote.textContent = 'Could not refresh live prices (showing previous values): ' + err.message;
  } finally {
    marketRefreshBtn.disabled = false;
    marketRefreshBtn.textContent = origLabel;
  }
}

/* ================= AI SCAN LOGIC (live Gemini via Worker proxy) ================= */
const WORKER_URL = 'https://misty-mountain-fc0e.mdaimon59.workers.dev/';

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const previewWrap = document.getElementById('previewWrap');
const previewImg = document.getElementById('previewImg');
const scanLine = document.getElementById('scanLine');
const analyzeBtn = document.getElementById('analyzeBtn');
const offTopicNote = document.getElementById('offTopicNote');
const scanErrorNote = document.getElementById('scanErrorNote');
const resultCard = document.getElementById('resultCard');

let currentImageBase64 = null;
let currentImageMime = null;

dropzone.addEventListener('click', ()=>fileInput.click());
['dragover','dragenter'].forEach(evt=>dropzone.addEventListener(evt, e=>{e.preventDefault(); dropzone.style.borderColor='var(--meadow)';}));
['dragleave','drop'].forEach(evt=>dropzone.addEventListener(evt, e=>{e.preventDefault(); dropzone.style.borderColor='';}));
dropzone.addEventListener('drop', e=>{
  if(e.dataTransfer.files.length){ handleFile(e.dataTransfer.files[0]); }
});
fileInput.addEventListener('change', e=>{
  if(e.target.files.length){ handleFile(e.target.files[0]); }
});

function handleFile(file){
  offTopicNote.style.display='none';
  resultCard.classList.remove('show');
  currentImageMime = file.type || 'image/jpeg';
  const reader = new FileReader();
  reader.onload = e=>{
    previewImg.src = e.target.result;
    currentImageBase64 = e.target.result.split(',')[1];
    previewWrap.style.display='block';
    analyzeBtn.disabled = false;
  };
  reader.readAsDataURL(file);
}

/* offline fallback set, used only if the AI service can't be reached */
const diagnoses = [
  {species:'Broiler chicken · Batch B', condition:'Suspected: Coccidiosis (early stage)', severity:'sev-med', sevLabel:'Medium',
   cause:'Damp, overcrowded litter combined with recent temperature swings has likely triggered an outbreak of intestinal parasites common at 2–4 weeks of age.',
   action:'Isolate visibly affected birds today. Start an anticoccidial such as amprolium in drinking water for 5–7 days at the label dose, and replace wet litter in the affected pen.',
   plan:'Add a vitamin K and electrolyte supplement for 3 days to offset fluid loss. Re-check droppings on day 3; if blood persists, involve your local vet.'},
  {species:'Dairy cow', condition:'Suspected: Mild foot rot', severity:'sev-med', sevLabel:'Medium',
   cause:'Wet, muddy standing areas have softened the hoof, letting bacteria in between the claws — very common after heavy rain.',
   action:'Move the cow to a dry area and clean the hoof thoroughly. Apply a topical antibacterial spray twice daily for 4 days.',
   plan:'Keep the standing area drained going forward. If limping worsens, get a vet to check for deeper infection.'},
  {species:'Goat', condition:'Suspected: Mild parasitic scours', severity:'sev-low', sevLabel:'Low',
   cause:'Loose, pale droppings alongside a slightly dull coat suggest a mild internal parasite load.',
   action:'Deworm with a broad-spectrum anthelmintic dosed to body weight, and keep on clean, dry bedding.',
   plan:'Offer extra clean water during recovery. Re-weigh in a week — if weight gain stalls, a vet visit is worth it.'}
];

function showOfflineFallback(){
  const d = diagnoses[Math.floor(Math.random()*diagnoses.length)];
  renderResult({offTopic:false, species:d.species+' (offline estimate)', condition:d.condition, severity:d.sevLabel, cause:d.cause, action:d.action, plan:d.plan});
}

function severityClass(label){
  const s = (label||'').toLowerCase();
  if(s==='high') return 'sev-high';
  if(s==='low') return 'sev-low';
  return 'sev-med';
}

function renderResult(d){
  document.getElementById('resSpecies').textContent = d.species || 'Result';
  document.getElementById('resCondition').textContent = d.condition || '';
  const sevEl = document.getElementById('resSeverity');
  sevEl.className = 'badge-severity ' + severityClass(d.severity);
  sevEl.textContent = d.severity || 'Medium';
  document.getElementById('resCause').textContent = d.cause || '';
  document.getElementById('resAction').textContent = d.action || '';
  document.getElementById('resPlan').textContent = d.plan || '';
  resultCard.classList.add('show');
  resultCard.scrollIntoView({behavior:'smooth', block:'nearest'});

  /* seed the chat with the photo + diagnosis so follow-up questions can reference it */
  const summaryText = `Species/context: ${d.species}. Condition: ${d.condition}. Severity: ${d.severity}. Cause: ${d.cause} Action: ${d.action} Plan: ${d.plan}`;
  const seedParts = [{text: 'Here is the photo I just analyzed for this farmer, along with my own diagnosis summary so I can answer follow-up questions about it:\n' + summaryText}];
  if(currentImageBase64){
    seedParts.push({inline_data:{mime_type: currentImageMime, data: currentImageBase64}});
  }
  chatHistory = [
    {role:'user', parts:[{text:'(system context, not shown to the farmer) ' + seedParts[0].text}].concat(seedParts.length>1?[seedParts[1]]:[])},
    {role:'model', parts:[{text:'Got it — I can see the photo and my diagnosis. Ready for follow-up questions.'}]}
  ];
  chatThread.innerHTML = `<div class="msg ai">Hi — I've had a look at the photo. Ask me anything about dosage, timing or what to watch for next.</div>`;
}

function extractJson(text){
  if(!text) return null;
  let cleaned = text.trim().replace(/^```json/i,'').replace(/^```/,'').replace(/```$/,'').trim();
  try{ return JSON.parse(cleaned); }
  catch(e){
    const match = cleaned.match(/\{[\s\S]*\}/);
    if(match){ try{ return JSON.parse(match[0]); }catch(e2){ return null; } }
    return null;
  }
}

const SCAN_PROMPT = `You are an expert livestock and poultry health advisor inside a farm app used by smallholder farmers raising poultry, cattle, goats and ducks.
Look at the attached photo and reply with ONLY raw JSON (no markdown, no code fences, no extra text) in exactly this shape:
{"offTopic": boolean, "species": string, "condition": string, "severity": "Low" or "Medium" or "High", "cause": string, "action": string, "plan": string}
Rules:
- If the photo is not a poultry bird, cow, goat, or duck (or a directly relevant part like droppings, hooves, feathers, comb, eyes), set "offTopic" to true and leave the other string fields empty.
- Otherwise set "offTopic" to false. Fill "species" with what you see (species/breed guess + any batch context visible). Fill "condition" with your best-guess assessment. Fill "cause", "action" and "plan" with concrete, practical steps a farmer could act on today, each 2-3 sentences.
- If the photo is ambiguous or you're not confident, say so plainly inside "condition" rather than inventing a confident diagnosis.
- Always include a brief reminder that this is an AI estimate and a vet should confirm anything serious, worked naturally into "plan".`;

analyzeBtn.addEventListener('click', async ()=>{
  if(!currentImageBase64) return;
  analyzeBtn.disabled = true;
  scanLine.style.display='block';
  resultCard.classList.remove('show');
  offTopicNote.style.display='none';
  scanErrorNote.style.display='none';

  try{
    const res = await fetch(WORKER_URL, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        contents:[{
          role:'user',
          parts:[
            {text: SCAN_PROMPT},
            {inline_data:{mime_type: currentImageMime, data: currentImageBase64}}
          ]
        }]
      })
    });
    const data = await res.json();
    if(data.error){ throw new Error((data.error.message || 'AI service error') + ' (status ' + res.status + ')'); }
    const text = data.candidates && data.candidates[0] && data.candidates[0].content
      ? data.candidates[0].content.parts.map(p=>p.text||'').join('')
      : '';
    const parsed = extractJson(text);
    scanLine.style.display='none';

    if(!parsed){ throw new Error('Could not parse AI response: ' + text.slice(0,200)); }

    if(parsed.offTopic){
      offTopicNote.style.display='block';
    } else {
      renderResult(parsed);
    }
  } catch(err){
    scanLine.style.display='none';
    console.warn('Gemini scan failed, using offline fallback:', err);
    scanErrorNote.style.display='block';
    scanErrorNote.textContent = 'AI service error (showing offline sample instead): ' + err.message;
    showOfflineFallback();
  } finally {
    analyzeBtn.disabled = false;
  }
});

/* ---- chat, restricted to farming topics via system instruction ---- */
const chatThread = document.getElementById('chatThread');
const chatInput = document.getElementById('chatInput');
document.getElementById('chatSend').addEventListener('click', sendChat);
chatInput.addEventListener('keydown', e=>{ if(e.key==='Enter') sendChat(); });

let chatHistory = [];

const CHAT_SYSTEM = `You are the AgriPulse farm assistant. You ONLY discuss topics related to farming: poultry, cattle, goats, ducks, crops, feed, disease, vaccination, farm economics, weather impact on farms, and this app's features.
If the user asks about anything unrelated to farming (homework, entertainment, coding, general trivia, etc.), politely decline in one sentence and redirect them back to farming topics — do not answer the off-topic part.
Keep answers short and practical (2-4 sentences), in plain language for a smallholder farmer. For anything involving exact medication dosing or a rapidly worsening condition, remind them to confirm with a local vet.`;

function sendChat(){
  const val = chatInput.value.trim();
  if(!val) return;
  chatThread.innerHTML += `<div class="msg user">${escapeHtml(val)}</div>`;
  chatInput.value='';
  chatThread.scrollTop = chatThread.scrollHeight;
  chatThread.innerHTML += `<div class="msg ai" id="chatPending">…</div>`;
  chatThread.scrollTop = chatThread.scrollHeight;

  chatHistory.push({role:'user', parts:[{text: val}]});

  fetch(WORKER_URL, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({
      systemInstruction:{parts:[{text: CHAT_SYSTEM}]},
      contents: chatHistory
    })
  })
  .then(res=>res.json())
  .then(data=>{
    if(data.error) throw new Error(data.error.message || 'AI service error');
    const text = data.candidates && data.candidates[0] && data.candidates[0].content
      ? data.candidates[0].content.parts.map(p=>p.text||'').join('').trim()
      : '';
    const reply = text || "Sorry, I couldn't work that out — could you rephrase?";
    chatHistory.push({role:'model', parts:[{text: reply}]});
    const pending = document.getElementById('chatPending');
    if(pending){ pending.outerHTML = `<div class="msg ai">${escapeHtml(reply)}</div>`; }
    chatThread.scrollTop = chatThread.scrollHeight;
  })
  .catch(err=>{
    console.warn('Chat request failed, using offline fallback:', err);
    const reply = canned(val) + `\n\n(offline fallback — AI service error: ${err.message})`;
    const pending = document.getElementById('chatPending');
    if(pending){ pending.outerHTML = `<div class="msg ai">${escapeHtml(reply)}</div>`; }
    chatThread.scrollTop = chatThread.scrollHeight;
  });
}
function canned(q){
  const s = q.toLowerCase();
  if(s.includes('dose')||s.includes('dosage')) return "For a flock this size, follow the label per-litre rate and treat all birds sharing the same waterline, not just the visibly sick ones — partial dosing lets the outbreak linger.";
  if(s.includes('how long')||s.includes('days')) return "Most animals show improvement within 3–4 days of correct treatment. If there's no change by day 5, it's worth a vet visit to rule out a secondary infection.";
  if(s.includes('feed')||s.includes('fertilizer')) return "Keep the current feed but add the supplement I mentioned — don't switch brands mid-treatment, as that stress can slow recovery.";
  if(s.includes('spread')||s.includes('contagious')) return "Yes, this can spread through shared water and bedding — isolate affected animals and disinfect equipment as a precaution.";
  return "Good question — for anything outside standard dosing, treatment length or feed guidance, it's safest to loop in your local vet, especially if symptoms change quickly.";
}
function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}


/* ================= PLANNER LOGIC ================= */

/* ---- reference data, generic across all four groups ---- */
const lvlWidth = {low:33, med:66, high:100};
const lvlColorClass = {low:'lvl-low', med:'lvl-med', high:'lvl-high'};
const growthCycleMult = {low:1.2, med:1.0, high:0.85};
const hardinessSurvival = {low:87, med:93, high:97};

const feedTiers = {
  economy:{label:'Economy', costMult:0.8, cycleMult:1.12, priceMult:0.9, note:'Lower cost, slower growth, achieves a lower market grade.'},
  standard:{label:'Standard', costMult:1.0, cycleMult:1.0, priceMult:1.0, note:'Balanced cost, growth speed and market grade.'},
  premium:{label:'Premium', costMult:1.3, cycleMult:0.9, priceMult:1.1, note:'Higher cost, faster growth, better market grade and price.'}
};

const housingConfig = {
  open:{label:'Open field', setupMult:0.6, survivalAdj:-6},
  semi:{label:'Semi-open shed', setupMult:1.0, survivalAdj:-2},
  closed:{label:'Closed shed', setupMult:1.4, survivalAdj:0},
  climate:{label:'Climate-controlled', setupMult:2.0, survivalAdj:3}
};

const waterLabels = {pond:'Pond', tubewell:'Tube-well', municipal:'Municipal supply'};
const waterNotes = {
  poultry:{pond:'Treat pond water before use — it carries higher parasite risk for young birds.', tubewell:'Tube-well water is a safe, reliable default for poultry.', municipal:'Municipal supply is fine; just check chlorine levels don\'t upset young chicks.'},
  cow:{pond:'Pond water works but watch for liver-fluke risk during monsoon.', tubewell:'Tube-well water is ideal for consistent milk quality.', municipal:'Municipal supply is safe; ensure steady volume for wallowing and drinking.'},
  goat:{pond:'Goats generally do fine on pond water if it\'s not stagnant.', tubewell:'Tube-well water is the safest choice for kids.', municipal:'Municipal supply works well for small herds.'},
  duck:{pond:'A pond is ideal for ducks — supports natural foraging behaviour.', tubewell:'Tube-well water works, but ducks benefit from added swimming access.', municipal:'Municipal supply is fine for drinking; add a shallow pool for welfare.'}
};

const groupIcons = {
  poultry:'<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="13" rx="7" ry="8"/><path d="M9 5.5C9 3.5 10.5 2 12 2"/></svg>',
  cow:'<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10c0-2 1.5-4 4-4s4 1 5 2c1-1 3-2 5-2s4 2 4 4c0 3-4 4-4 8H8c0-4-4-5-4-8z"/></svg>',
  goat:'<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c2 2 2 4 1 6 3 0 5 2 5 5 0 3-2 6-6 9-4-3-6-6-6-9 0-3 2-5 5-5-1-2-1-4 1-6z"/></svg>',
  duck:'<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12c0-3 3-6 7-6 4 0 6 3 9 3 1.5 0 2-1 2-1s0 3-3 4c1 1 1 3-1 4-3 1-6 0-8-2-3 0-6-1-6-2z"/></svg>'
};
function groupIconSVG(group){ return groupIcons[group] || groupIcons.poultry; }

const groupConfig = {
  poultry:{unitWord:'bird', groupName:'poultry', spacePerUnitSqft:1.3, feedKgPerUnitPerDay:0.11, baseCycleDays:42,
    feedCostPerKgBase:45, setupCostPerUnitBase:15, medicineCostPerUnitBase:8, laborFixedBase:3000, laborPerUnit:2,
    defaultQty:500, qtyMax:2000,
    breeds:[
      {id:'broiler', name:'Broiler', desc:'Fast growth, standard', growth:'high', hardiness:'med', marketValue:'med'},
      {id:'sonali', name:'Sonali', desc:'Hardy, dual-purpose', growth:'med', hardiness:'high', marketValue:'med'},
      {id:'layer', name:'Layer', desc:'Egg-focused', growth:'low', hardiness:'med', marketValue:'high'}
    ]},
  cow:{unitWord:'cow', groupName:'cattle', spacePerUnitSqft:240, feedKgPerUnitPerDay:12, baseCycleDays:305,
    feedCostPerKgBase:35, setupCostPerUnitBase:3000, medicineCostPerUnitBase:600, laborFixedBase:8000, laborPerUnit:200,
    defaultQty:5, qtyMax:60,
    breeds:[
      {id:'deshi', name:'Local / Deshi', desc:'Low cost, hardy', growth:'low', hardiness:'high', marketValue:'med'},
      {id:'crossbred', name:'Crossbred', desc:'Balanced', growth:'med', hardiness:'med', marketValue:'high'},
      {id:'holstein', name:'Holstein Friesian', desc:'High yield, needs more care', growth:'high', hardiness:'low', marketValue:'high'}
    ]},
  goat:{unitWord:'goat', groupName:'goats', spacePerUnitSqft:38, feedKgPerUnitPerDay:2.2, baseCycleDays:180,
    feedCostPerKgBase:38, setupCostPerUnitBase:400, medicineCostPerUnitBase:90, laborFixedBase:4000, laborPerUnit:20,
    defaultQty:30, qtyMax:250,
    breeds:[
      {id:'blackbengal', name:'Black Bengal', desc:'Disease-resistant, popular in BD', growth:'med', hardiness:'high', marketValue:'high'},
      {id:'jamunapari', name:'Jamunapari', desc:'Larger body size', growth:'high', hardiness:'med', marketValue:'high'}
    ]},
  duck:{unitWord:'duck', groupName:'ducks', spacePerUnitSqft:2.2, feedKgPerUnitPerDay:0.16, baseCycleDays:49,
    feedCostPerKgBase:42, setupCostPerUnitBase:20, medicineCostPerUnitBase:10, laborFixedBase:3000, laborPerUnit:3,
    defaultQty:200, qtyMax:1500,
    breeds:[
      {id:'khaki', name:'Khaki Campbell', desc:'Egg layer', growth:'med', hardiness:'med', marketValue:'high'},
      {id:'localduck', name:'Local Deshi', desc:'Meat-focused', growth:'low', hardiness:'high', marketValue:'med'}
    ]}
};

const templates = [
  {group:'poultry', breed:'broiler', area:1000, tier:'standard', housing:'closed', water:'tubewell', env:'Hot & humid', qty:300, price:210, budget:70000, label:'300 Broilers · Starter', sub:'Small batch, low risk'},
  {group:'cow', breed:'crossbred', area:3000, tier:'standard', housing:'semi', water:'pond', env:'Moderate, well-drained', qty:3, price:80, budget:220000, label:'3 Crossbred Cows', sub:'Small dairy holder'},
  {group:'goat', breed:'blackbengal', area:900, tier:'economy', housing:'open', water:'pond', env:'Moderate, well-drained', qty:20, price:800, budget:120000, label:'20 Black Bengal Goats', sub:'Popular in BD'},
  {group:'duck', breed:'khaki', area:700, tier:'standard', housing:'semi', water:'pond', env:'Flood-prone lowland', qty:150, price:190, budget:60000, label:'150 Khaki Campbell Ducks', sub:'Egg-focused flock'}
];

let selectedGroup = 'poultry';
let selectedBreed = 'broiler';
let selectedTier = 'standard';
let areaUnit = 'sqft';
let areaSqft = 2153;
let lastBudgetSuggestion = null;
let fallbackPlans = [];

function getBreedObj(group){
  group = group || selectedGroup;
  const list = groupConfig[group].breeds;
  return list.find(b=>b.id===selectedBreed) || list[0];
}

/* ---- breed rendering ---- */
function renderBreedList(group){
  const cfg = groupConfig[group];
  if(!cfg.breeds.some(b=>b.id===selectedBreed)) selectedBreed = cfg.breeds[0].id;
  const html = cfg.breeds.map(b=>`
    <div class="breed-card ${b.id===selectedBreed?'sel':''}" data-breed="${b.id}">
      <div class="b-name">${b.name}</div>
      <div class="b-desc">${b.desc}</div>
      <div class="stat-mini"><span class="s-label">Growth</span><div class="bar-track"><div class="bar-fill ${lvlColorClass[b.growth]}" style="width:${lvlWidth[b.growth]}%"></div></div><span class="s-tag">${b.growth}</span></div>
      <div class="stat-mini"><span class="s-label">Hardiness</span><div class="bar-track"><div class="bar-fill ${lvlColorClass[b.hardiness]}" style="width:${lvlWidth[b.hardiness]}%"></div></div><span class="s-tag">${b.hardiness}</span></div>
      <div class="stat-mini"><span class="s-label">Market</span><div class="bar-track"><div class="bar-fill ${lvlColorClass[b.marketValue]}" style="width:${lvlWidth[b.marketValue]}%"></div></div><span class="s-tag">${b.marketValue}</span></div>
    </div>
  `).join('');
  document.getElementById('breedList').innerHTML = html;
  document.querySelectorAll('#breedList .breed-card').forEach(card=>{
    card.addEventListener('click', ()=>{
      selectedBreed = card.dataset.breed;
      document.querySelectorAll('#breedList .breed-card').forEach(c=>c.classList.remove('sel'));
      card.classList.add('sel');
      suggestSurvival();
      checkBudget();
    });
  });
}

function selectGroup(group){
  selectedGroup = group;
  document.querySelectorAll('#groupGrid .group-card').forEach(c=>c.classList.toggle('sel', c.dataset.group===group));
  selectedBreed = groupConfig[group].breeds[0].id;
  renderBreedList(group);
  document.getElementById('breedPanel').classList.add('open');
  const qtyLabels = {poultry:'Number of birds', cow:'Number of cows', goat:'Number of goats', duck:'Number of ducks'};
  document.getElementById('qtyLabel').textContent = qtyLabels[group] || 'Quantity';
  const cfg = groupConfig[group];
  document.getElementById('qtySlider').max = cfg.qtyMax;
  document.getElementById('qtySlider').value = cfg.defaultQty;
  document.getElementById('qtyInput').value = cfg.defaultQty;
  renderTierRow();
  suggestSurvival();
  checkBudget();
}

document.querySelectorAll('#groupGrid .group-card').forEach(card=>{
  card.addEventListener('click', ()=>selectGroup(card.dataset.group));
});

/* ---- templates ---- */
function renderTemplates(){
  const icon = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg>';
  document.getElementById('templateRow').innerHTML = templates.map((t,i)=>`
    <div class="template-chip" onclick="applyTemplate(${i})">
      ${icon}
      <div><div class="t-name">${t.label}</div><div class="t-sub">${t.sub}</div></div>
    </div>
  `).join('');
}
function applyTemplate(i){
  const t = templates[i];
  selectGroup(t.group);
  selectedBreed = t.breed;
  renderBreedList(t.group);
  areaUnit = 'sqft';
  areaSqft = t.area;
  setAreaUnit('sqft');
  document.getElementById('locInput').value = 'Bogura, Bangladesh';
  document.getElementById('envInput').value = t.env;
  document.getElementById('housingInput').value = t.housing;
  document.getElementById('waterInput').value = t.water;
  renderTierRow();
  selectedTier = t.tier;
  document.querySelectorAll('#tierRow .tier-card').forEach(c=>c.classList.toggle('sel', c.dataset.tier===t.tier));
  document.getElementById('qtySlider').value = t.qty;
  document.getElementById('qtyInput').value = t.qty;
  document.getElementById('priceInput').value = t.price;
  document.getElementById('budgetInput').value = t.budget;
  suggestSurvival();
  calculatePlan();
}

/* ---- area slider/number + unit toggle ---- */
function sqftToDecimal(sqft){ return sqft/435.6; }
function decimalToSqft(dec){ return dec*435.6; }
function onAreaSlider(val){
  val = parseFloat(val);
  areaSqft = areaUnit==='sqft' ? val : decimalToSqft(val);
  document.getElementById('areaNumber').value = val;
}
function onAreaNumber(val){
  val = parseFloat(val) || 0;
  areaSqft = areaUnit==='sqft' ? val : decimalToSqft(val);
  document.getElementById('areaSlider').value = val;
}
function setAreaUnit(u){
  areaUnit = u;
  document.querySelectorAll('#unitToggle button').forEach(b=>b.classList.toggle('on', b.dataset.unit===u));
  const slider = document.getElementById('areaSlider'), number = document.getElementById('areaNumber');
  if(u==='sqft'){
    slider.min=10; slider.max=5000; slider.value=Math.round(areaSqft); number.value=Math.round(areaSqft);
  } else {
    slider.min=1; slider.max=50; const dec=sqftToDecimal(areaSqft); slider.value=dec.toFixed(1); number.value=dec.toFixed(1);
  }
}

/* ---- feed tier ---- */
function renderTierRow(){
  const cfg = groupConfig[selectedGroup];
  const order = ['economy','standard','premium'];
  document.getElementById('tierRow').innerHTML = order.map(key=>{
    const t = feedTiers[key];
    const costPerKg = (cfg.feedCostPerKgBase * t.costMult).toFixed(0);
    return `<div class="tier-card ${key===selectedTier?'sel':''}" data-tier="${key}">
      <div class="t-title">${t.label}</div>
      <div class="t-price">৳ ${costPerKg} <span style="font-size:11px;font-weight:600;color:rgba(18,32,26,.5);">/ kg</span></div>
      <div class="t-note">${t.note}</div>
    </div>`;
  }).join('');
  document.querySelectorAll('#tierRow .tier-card').forEach(card=>{
    card.addEventListener('click', ()=>{
      selectedTier = card.dataset.tier;
      document.querySelectorAll('#tierRow .tier-card').forEach(c=>c.classList.remove('sel'));
      card.classList.add('sel');
      checkBudget();
    });
  });
}

/* ---- headcount slider/number ---- */
function onQtySlider(val){ document.getElementById('qtyInput').value = val; checkBudget(); }
function onQtyNumber(val){ document.getElementById('qtySlider').value = val; checkBudget(); }

function suggestSurvival(){
  const breed = getBreedObj();
  const housingVal = document.getElementById('housingInput').value;
  const housing = housingConfig[housingVal];
  let s = hardinessSurvival[breed.hardiness] + housing.survivalAdj;
  s = Math.max(60, Math.min(99, s));
  document.getElementById('survInput').value = s;
}
document.getElementById('housingInput').addEventListener('change', ()=>{ suggestSurvival(); checkBudget(); });
document.getElementById('waterInput').addEventListener('change', ()=>{});
document.getElementById('budgetInput').addEventListener('input', checkBudget);

/* ---- cost engine (shared by budget check + results) ---- */
function computeCosts(qty){
  const g = groupConfig[selectedGroup];
  const breed = getBreedObj();
  const tier = feedTiers[selectedTier];
  const housingVal = document.getElementById('housingInput').value;
  const housing = housingConfig[housingVal];

  const cycleDays = Math.round(g.baseCycleDays * growthCycleMult[breed.growth] * tier.cycleMult);
  const feedCostPerKg = g.feedCostPerKgBase * tier.costMult;
  const feedTotal = qty * g.feedKgPerUnitPerDay * cycleDays * feedCostPerKg;

  const medMult = breed.hardiness==='low' ? 1.3 : (breed.hardiness==='high' ? 0.85 : 1.0);
  const medicineTotal = qty * g.medicineCostPerUnitBase * medMult;

  const laborTotal = g.laborFixedBase + qty * g.laborPerUnit;
  const setupTotal = qty * g.setupCostPerUnitBase * housing.setupMult;

  const totalCost = feedTotal + medicineTotal + laborTotal + setupTotal;

  return {feedTotal, medicineTotal, laborTotal, setupTotal, totalCost, cycleDays, achievedPriceMult: tier.priceMult};
}

function evaluateBudgetStatus(budget, totalCost, qty, unitWord){
  if(!budget || budget<=0) return {status:'ok', text:'No budget limit set — the cost estimate below is shown for reference.'};
  if(budget >= totalCost) return {status:'ok', text:`Your budget of ৳${Math.round(budget).toLocaleString()} comfortably covers the estimated ৳${Math.round(totalCost).toLocaleString()} cost.`};
  const ratio = budget/totalCost;
  const maxQty = Math.max(1, Math.floor(qty*ratio));
  if(ratio>=0.8) return {status:'warn', text:`Your budget covers about ${maxQty.toLocaleString()} ${unitWord}s — a little tight for ${qty.toLocaleString()}. Consider trimming the headcount slightly.`, maxQty};
  return {status:'bad', text:`Your budget covers about ${maxQty.toLocaleString()} ${unitWord}s — reduce headcount or increase budget.`, maxQty};
}

function checkBudget(){
  const g = groupConfig[selectedGroup];
  const qty = parseFloat(document.getElementById('qtyInput').value) || 0;
  const budget = parseFloat(document.getElementById('budgetInput').value) || 0;
  if(qty<=0){ document.getElementById('budgetWarning').style.display='none'; return; }
  const costs = computeCosts(qty);
  document.getElementById('costPerUnitDisplay').value = `৳ ${Math.round(costs.totalCost/qty).toLocaleString()} per ${g.unitWord}`;
  const evalRes = evaluateBudgetStatus(budget, costs.totalCost, qty, g.unitWord);
  const warnEl = document.getElementById('budgetWarning');
  if(evalRes.status==='ok'){
    warnEl.style.display='none';
  } else {
    warnEl.style.display='flex';
    document.getElementById('budgetWarningText').textContent = evalRes.text;
    lastBudgetSuggestion = evalRes.maxQty;
  }
}
function autoAdjustBudget(){
  if(!lastBudgetSuggestion) return;
  document.getElementById('qtyInput').value = lastBudgetSuggestion;
  document.getElementById('qtySlider').value = Math.min(lastBudgetSuggestion, parseFloat(document.getElementById('qtySlider').max));
  checkBudget();
}

/* ---- steps ---- */
const stepFills = {1:'20%',2:'40%',3:'60%',4:'80%',5:'100%'};
function goStep(n){
  document.querySelectorAll('.plan-step').forEach(s=>s.classList.remove('active'));
  document.getElementById('step-'+n).classList.add('active');
  for(let i=1;i<=5;i++){
    document.getElementById('fill'+i).style.width = i<=n ? stepFills[i] : '0%';
  }
}

/* ---- SVG builders ---- */
function buildDonut(segments){
  const total = segments.reduce((s,x)=>s+x.value,0) || 1;
  const r=55, circumference = 2*Math.PI*r;
  let offset = 0;
  let inner = `<circle cx="70" cy="70" r="${r}" fill="none" stroke="rgba(18,32,26,0.08)" stroke-width="18"/>`;
  segments.forEach(seg=>{
    const pct = seg.value/total;
    const dash = pct*circumference;
    inner += `<circle cx="70" cy="70" r="${r}" fill="none" stroke="${seg.color}" stroke-width="18" stroke-dasharray="${dash.toFixed(2)} ${(circumference-dash).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 70 70)"/>`;
    offset += dash;
  });
  const legend = segments.map(seg=>`<div class="leg-row"><span class="swatch" style="background:${seg.color}"></span>${seg.label}<span class="leg-amt">৳ ${Math.round(seg.value).toLocaleString()}</span></div>`).join('');
  return {inner, legend};
}
function buildCashflow(setup, medicine, feed, totalCost, revenue){
  const steps=6, points=[];
  for(let i=0;i<steps;i++){
    const t=i/(steps-1);
    points.push({t, cost: setup + medicine*Math.min(1,t*2) + feed*t});
  }
  const maxVal = Math.max(totalCost, revenue, 1)*1.08;
  const w=300,h=140,pad=12;
  const xFor = t => pad + t*(w-2*pad);
  const yFor = v => (h-pad) - (v/maxVal)*(h-2*pad);
  const costPts = points.map(p=>`${xFor(p.t).toFixed(1)},${yFor(p.cost).toFixed(1)}`).join(' ');
  const revPts = points.map((p,i)=>`${xFor(p.t).toFixed(1)},${yFor(i===steps-1?revenue:0).toFixed(1)}`).join(' ');
  return `<line x1="${pad}" y1="${h-pad}" x2="${w-pad}" y2="${h-pad}" stroke="rgba(18,32,26,0.15)" stroke-width="1"/>
    <polyline points="${costPts}" fill="none" stroke="#E4572E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="${revPts}" fill="none" stroke="#3FA34D" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
}
function renderFeasHTML(rows){
  const icon = {
    ok:'<svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
    warn:'<svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L14.7 3.86a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
    bad:'<svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>'
  };
  return rows.map(r=>`<div class="feas-row ${r.status}">${icon[r.status]}<div><div class="f-text">${r.text}</div><div class="f-sub">${r.sub}</div></div></div>`).join('');
}

function buildTimeline(group){
  const plans = {
    poultry:[
      {week:'Week 0',desc:'Prepare and disinfect the shed, set brooder temperature to 32–35°C, arrange feeders and waterers.'},
      {week:'Week 1',desc:'Day-old chicks arrive. Keep 24-hour light, monitor for pasty vent, first Newcastle vaccine (eye-drop).'},
      {week:'Week 2–3',desc:'Lower brooder temperature gradually by 2–3°C per week. Watch for early signs of coccidiosis.'},
      {week:'Week 4–5',desc:'Switch to grower feed, second vaccination round, increase ventilation as birds grow.'},
      {week:'Week 6',desc:'Final weight check and market-readiness assessment; arrange buyer or market slot.'}
    ],
    cow:[
      {week:'Month 1',desc:'Set up shed, ensure clean water source and balanced fodder mix, deworm and vaccinate.'},
      {week:'Month 2–3',desc:'Establish a feeding and milking routine; monitor body condition score weekly.'},
      {week:'Month 4–7',desc:'Mid-cycle health checks, hoof trimming, adjust feed for lactation or growth stage.'},
      {week:'Month 8–10',desc:'Peak production monitoring; plan breeding cycle if dairy-focused.'},
      {week:'Month 10+',desc:'Review yield records and plan for the next cycle or sale.'}
    ],
    goat:[
      {week:'Week 1–2',desc:'Prepare shelter with good drainage, deworm new stock, provide mineral licks.'},
      {week:'Week 3–6',desc:'Establish grazing or fodder routine; monitor kids closely for scours.'},
      {week:'Month 2–4',desc:'Vaccinate against PPR and enterotoxaemia; track weight gain.'},
      {week:'Month 5–6',desc:'Final growth push before market or breeding; assess body condition.'}
    ],
    duck:[
      {week:'Week 1',desc:'Ducklings arrive; keep brooder at 30–32°C, provide shallow water for the first days.'},
      {week:'Week 2–4',desc:'Introduce swimming access, transition to grower feed, monitor for viral hepatitis signs.'},
      {week:'Week 5–6',desc:'Increase outdoor access if safe from predators; second health check.'},
      {week:'Week 7',desc:'Market-readiness weight check and buyer arrangement.'}
    ]
  };
  return plans[group];
}

/* ---- build + render the full report ---- */
function buildReportData(){
  const g = groupConfig[selectedGroup];
  const breed = getBreedObj();
  const env = document.getElementById('envInput').value;
  const housingVal = document.getElementById('housingInput').value;
  const housing = housingConfig[housingVal];
  const waterVal = document.getElementById('waterInput').value;
  const qty = parseFloat(document.getElementById('qtyInput').value) || 0;
  const price = parseFloat(document.getElementById('priceInput').value) || 0;
  const budget = parseFloat(document.getElementById('budgetInput').value) || 0;
  const surv = (parseFloat(document.getElementById('survInput').value) || 90)/100;

  const costs = computeCosts(qty);
  const achievedPrice = price * costs.achievedPriceMult;
  const survivingQty = qty * surv;
  const revenue = survivingQty * achievedPrice;
  const profit = revenue - costs.totalCost;

  const spaceNeeded = qty * g.spacePerUnitSqft;
  const maxCapacity = Math.floor(areaSqft / g.spacePerUnitSqft);
  const spaceOk = areaSqft >= spaceNeeded;

  let seasonText = '';
  if(env==='Hot & humid'){
    seasonText = `In a hot, humid setting, start ${g.groupName} rearing in the early cool season (Nov–Jan) so the first few weeks avoid peak heat stress. With a ${housing.label.toLowerCase()}, add extra shade and ventilation from day one.`;
  } else if(env==='Flood-prone lowland'){
    seasonText = `This site floods seasonally, so start right after the monsoon recedes (Oct–Nov) and raise housing on a plinth at least 30cm above the highest recorded water line.`;
  } else if(env==='Cool & dry'){
    seasonText = `Cool, dry conditions suit a spring start (Feb–Mar) so growth overlaps with warmer months, reducing heating costs for young stock.`;
  } else {
    seasonText = `Moderate, well-drained land gives you flexibility — Sep–Nov or Feb–Mar both work well; avoid starting right before the heaviest rains.`;
  }
  const seasonOk = !(env==='Flood-prone lowland' && housingVal==='open');
  if(!seasonOk){ seasonText += ' Note: an open field on flood-prone land is risky — a raised semi-open or closed shed is strongly recommended.'; }

  const budgetEval = evaluateBudgetStatus(budget, costs.totalCost, qty, g.unitWord);

  const feasRows = [
    {status: spaceOk?'ok':'bad', text: spaceOk?'Space sufficient':'Space insufficient',
      sub: spaceOk ? `Your land fits up to ${maxCapacity.toLocaleString()} ${g.unitWord}s — comfortably above your headcount of ${qty.toLocaleString()}.` : `Your land only fits about ${maxCapacity.toLocaleString()} ${g.unitWord}s. Reduce headcount or expand the site.`},
    {status: budgetEval.status, text: budgetEval.status==='ok'?'Budget sufficient':(budgetEval.status==='warn'?'Budget tight':'Budget insufficient'), sub: budgetEval.text},
    {status: seasonOk?'ok':'warn', text: seasonOk?'Season timing good':'Season timing needs care', sub: seasonOk ? 'Your chosen start window avoids the highest-risk weather for this group.' : 'Flood risk with open housing — consider a raised or closed shed.'}
  ];

  const donut = buildDonut([
    {label:'Feed', value:costs.feedTotal, color:'#1E7FB8'},
    {label:'Medicine / vaccination', value:costs.medicineTotal, color:'#E4572E'},
    {label:'Labor / utilities', value:costs.laborTotal, color:'#F2A93B'},
    {label:'Shed / setup', value:costs.setupTotal, color:'#3FA34D'}
  ]);
  const cashflowInner = buildCashflow(costs.setupTotal, costs.medicineTotal, costs.feedTotal, costs.totalCost, revenue);
  const timelineData = buildTimeline(selectedGroup);
  const timelineHTML = timelineData.map(t=>`<div class="tl-item"><div class="week">${t.week}</div><div class="desc">${t.desc}</div></div>`).join('');

  const cycleLabel = costs.cycleDays > 90 ? `${Math.round(costs.cycleDays/30)} months` : `${costs.cycleDays} days`;

  const summaryHTML = `
    <div class="summary-tile"><div class="num">${spaceNeeded.toFixed(0)} sq ft</div><div class="lbl">Space required</div></div>
    <div class="summary-tile"><div class="num">${maxCapacity.toLocaleString()}</div><div class="lbl">Max ${g.unitWord}s your land fits</div></div>
    <div class="summary-tile"><div class="num">${(qty*g.feedKgPerUnitPerDay*costs.cycleDays).toFixed(0)} kg</div><div class="lbl">Total feed for the cycle</div></div>
  `;
  const breakdownHTML = `
    <div>Revenue: ৳ ${Math.round(revenue).toLocaleString()}</div>
    <div>Total cost: ৳ ${Math.round(costs.totalCost).toLocaleString()}</div>
    <div>Surviving stock: ${Math.round(survivingQty).toLocaleString()} ${g.unitWord}s</div>
    <div>Achieved price: ৳ ${achievedPrice.toFixed(1)} / ${g.unitWord} (${feedTiers[selectedTier].label} feed)</div>
  `;

  return {
    id: null, savedAt: null,
    group: selectedGroup, groupName: g.groupName, unitWord: g.unitWord,
    breedName: breed.name, qty, cycleDays: costs.cycleDays, cycleLabel,
    title: `Your ${breed.name} ${g.groupName} plan`,
    subtitle: `${g.groupName.charAt(0).toUpperCase()+g.groupName.slice(1)} · ${breed.name} · ${qty.toLocaleString()} ${g.unitWord}s`,
    summaryHTML, seasonText, donutInner: donut.inner, legendHTML: donut.legend,
    cashflowInner, feasHTML: renderFeasHTML(feasRows), timelineHTML,
    profitLabel: `৳ ${Math.round(profit).toLocaleString()}`, breakdownHTML,
    totalCost: costs.totalCost, revenue, profit, survivalPct: Math.round(surv*100),
    waterNote: (waterNotes[selectedGroup] && waterNotes[selectedGroup][waterVal]) || ''
  };
}

function renderReportFromData(report){
  document.getElementById('resultIconWrap').innerHTML = groupIconSVG(report.group);
  document.getElementById('planTitle').textContent = report.title;
  document.getElementById('planSubtitle').textContent = report.subtitle;
  document.getElementById('planCycleChip').textContent = report.cycleLabel;
  document.getElementById('planSummary').innerHTML = report.summaryHTML;
  document.getElementById('seasonText').textContent = report.seasonText + (report.waterNote ? ' ' + report.waterNote : '');
  document.getElementById('donutSvg').innerHTML = report.donutInner;
  document.getElementById('donutLegend').innerHTML = report.legendHTML;
  document.getElementById('cashflowSvg').innerHTML = report.cashflowInner;
  document.getElementById('feasList').innerHTML = report.feasHTML;
  document.getElementById('planTimeline').innerHTML = report.timelineHTML;
  document.getElementById('profitAmount').textContent = report.profitLabel;
  document.getElementById('profitBreakdown').innerHTML = report.breakdownHTML;
}

function calculatePlan(){
  const report = buildReportData();
  window.currentReport = report;
  renderReportFromData(report);
  goStep(5);
}

/* ---- save / my plans / compare (Firestore, tied to account) ---- */
function saveCurrentPlan(){
  if(!window.currentReport){ return; }
  if(!currentProfile){ promptLoginRequired('save a plan'); return; }
  const id = 'plan_' + Date.now();
  const payload = Object.assign({}, window.currentReport, {
    id, ownerUid: currentUser.uid, savedAtLocal: new Date().toISOString(),
    savedAt: firebase.firestore.FieldValue.serverTimestamp(),
    label: `${window.currentReport.breedName} · ${window.currentReport.qty.toLocaleString()} ${window.currentReport.unitWord}s`,
    active: null
  });
  const finish = ()=>{
    const btn = document.getElementById('saveBtn');
    if(btn){ const orig = btn.textContent; btn.textContent = 'Plan saved'; setTimeout(()=>{ btn.textContent = orig; }, 1600); }
  };
  db.collection('plans').doc(id).set(payload).then(finish).catch(err=>{
    alert('Could not save this plan: ' + err.message);
  });
}

function getAllSavedPlans(){
  if(!currentUser) return Promise.resolve([]);
  return db.collection('plans').where('ownerUid','==',currentUser.uid).orderBy('savedAtLocal','desc').get()
    .then(snap=> snap.docs.map(d=>({id:d.id, ...d.data()})));
}

function deleteSavedPlan(id){
  return db.collection('plans').doc(id).delete();
}

function populateCompareSelects(){
  return getAllSavedPlans().then(plans=>{
    const opts = '<option value="">Choose a plan…</option>' + plans.map(p=>`<option value="${p.id}">${p.label || (p.breedName+' · '+p.qty)}</option>`).join('');
    document.getElementById('compareA').innerHTML = opts;
    document.getElementById('compareB').innerHTML = opts;
    return plans;
  }).catch(err=>{
    console.warn('populateCompareSelects failed:', err);
    document.getElementById('compareGrid').innerHTML = `<div class="empty-state">Could not load your plans: ${escapeHtml(err.message)}</div>`;
    return [];
  });
}

function renderCompare(){
  const idA = document.getElementById('compareA').value;
  const idB = document.getElementById('compareB').value;
  const grid = document.getElementById('compareGrid');
  if(!idA || !idB){ grid.innerHTML = '<div class="empty-state">Select two saved plans above to see them side by side.</div>'; return; }
  getAllSavedPlans().then(plans=>{
    const a = plans.find(p=>p.id===idA), b = plans.find(p=>p.id===idB);
    if(!a || !b) return;
    const rows = [
      ['Headcount', x=>`${x.qty.toLocaleString()} ${x.unitWord}s`],
      ['Breed', x=>x.breedName],
      ['Cycle length', x=>x.cycleLabel],
      ['Survival rate', x=>`${x.survivalPct}%`],
      ['Total cost', x=>`৳ ${Math.round(x.totalCost).toLocaleString()}`],
      ['Revenue', x=>`৳ ${Math.round(x.revenue).toLocaleString()}`],
      ['Profit', x=>`৳ ${Math.round(x.profit).toLocaleString()}`]
    ];
    function col(x){
      return `<div class="card compare-col"><h4>${x.breedName} · ${x.qty.toLocaleString()} ${x.unitWord}s</h4>${rows.map(r=>`<div class="compare-row"><span class="c-label">${r[0]}</span><span class="c-val">${r[1](x)}</span></div>`).join('')}</div>`;
    }
    grid.innerHTML = col(a) + col(b);
  }).catch(err=>{
    console.warn('renderCompare failed:', err);
    grid.innerHTML = `<div class="empty-state">Could not load plans: ${escapeHtml(err.message)}</div>`;
  });
}

function showPlannerView(view){
  document.querySelectorAll('.planner-tab').forEach(t=>t.classList.toggle('active', t.dataset.view===view));
  document.querySelectorAll('.planner-view').forEach(v=>v.classList.toggle('active', v.id==='view-'+view));
  if(view==='compare') populateCompareSelects().then(renderCompare);
}

/* ---- init ---- */
renderTemplates();
selectGroup('poultry');
setAreaUnit('sqft');

/* ================= MY PLANS: ACTIVE EXECUTION TRACKING ================= */
let notifiedKeys = new Set();

function saveActivePlan(record){
  return db.collection('plans').doc(record.id).update({
    active: {startedAt: record.startedAt, schedule: record.schedule}
  });
}
function getAllActivePlans(){
  return getAllSavedPlans().then(plans=> plans
    .filter(p=>p.active)
    .map(p=> Object.assign({}, p.active, {
      id:p.id, group:p.group, groupName:p.groupName, breedName:p.breedName,
      qty:p.qty, unitWord:p.unitWord, cycleDays:p.cycleDays, cycleLabel:p.cycleLabel
    }))
  );
}
function deleteActivePlanRecord(id){
  return db.collection('plans').doc(id).update({active: firebase.firestore.FieldValue.delete()}).catch(()=>{});
}

/* generic confirm modal — returns a Promise<boolean> */
function showConfirm(title, message){
  return new Promise(resolve=>{
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    const overlay = document.getElementById('confirmOverlay');
    overlay.style.display = 'flex';
    const okBtn = document.getElementById('confirmOkBtn');
    const cancelBtn = document.getElementById('confirmCancelBtn');
    function cleanup(result){
      overlay.style.display = 'none';
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      resolve(result);
    }
    function onOk(){ cleanup(true); }
    function onCancel(){ cleanup(false); }
    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
  });
}

/* day-by-day / hour-by-hour execution schedule per group */
function buildExecutionSchedule(group, cycleDays){
  const templates = {
    poultry:{
      recurring:[
        {time:'06:00', title:'Morning check', desc:'Check water lines, feed levels, and any signs of illness or mortality.'},
        {time:'12:00', title:'Midday check', desc:'Top up water — especially important in hot weather.'},
        {time:'18:00', title:'Evening check', desc:'Final feed top-up, close up the shed, record any losses.'}
      ],
      milestones:[
        {day:0, time:'07:00', title:'Shed preparation', desc:'Disinfect the shed, set brooder to 33°C, arrange feeders and waterers.'},
        {day:0, time:'14:00', title:'Chicks arrive', desc:'Day-old chicks arrive. Keep 24-hour light and check for pasty vent.'},
        {day:1, time:'08:00', title:'First health check', desc:'Confirm all chicks are active and eating; isolate any weak ones.'},
        {day:Math.min(7,Math.max(1,cycleDays-1)), time:'08:00', title:'Vaccination round 1', desc:"Newcastle disease vaccine (eye-drop) per hatchery guidance."},
        {day:Math.min(14,Math.max(1,cycleDays-1)), time:'08:00', title:'Litter check', desc:'Turn or replace litter if damp; watch for early coccidiosis signs.'},
        {day:Math.min(21,Math.max(1,cycleDays-1)), time:'08:00', title:'Vaccination round 2', desc:"Booster vaccination per your vet's schedule."},
        {day:Math.max(1,cycleDays-7), time:'09:00', title:'Pre-market weight check', desc:'Weigh a sample of birds to track growth against target.'},
        {day:cycleDays, time:'08:00', title:'Market day', desc:'Final weight check and hand-off to your buyer or market.'}
      ]
    },
    cow:{
      recurring:[
        {time:'05:30', title:'Morning milking & feed', desc:'Milk, feed, and check water availability.'},
        {time:'17:00', title:'Evening milking & feed', desc:'Second milking, evening feed, general health check.'}
      ],
      milestones:[
        {day:0, time:'08:00', title:'Setup', desc:'Set up shed, ensure clean water, deworm and vaccinate.'},
        {day:Math.min(30,Math.max(1,cycleDays-1)), time:'09:00', title:'Body condition check', desc:'Assess body condition score and adjust feed if needed.'},
        {day:Math.min(90,Math.max(1,cycleDays-1)), time:'09:00', title:'Mid-cycle vet check', desc:'Vet check-up and hoof trimming.'},
        {day:Math.min(180,Math.max(1,cycleDays-1)), time:'09:00', title:'Feed review', desc:'Review feed mix against yield and adjust.'},
        {day:Math.min(270,Math.max(1,cycleDays-1)), time:'09:00', title:'Breeding planning', desc:'Plan next breeding cycle if dairy-focused.'},
        {day:cycleDays, time:'09:00', title:'Cycle review', desc:'Review yield records and plan the next cycle.'}
      ]
    },
    goat:{
      recurring:[
        {time:'07:00', title:'Morning feed & graze out', desc:'Feed and let out to graze or browse; check water.'},
        {time:'17:30', title:'Evening pen-up', desc:'Bring animals in, check for injuries, top up feed and water.'}
      ],
      milestones:[
        {day:0, time:'08:00', title:'Shelter prep', desc:'Prepare shelter with good drainage, deworm new stock, provide mineral licks.'},
        {day:Math.min(14,Math.max(1,cycleDays-1)), time:'08:00', title:'Kid monitoring', desc:'Monitor kids closely for scours and weight gain.'},
        {day:Math.min(60,Math.max(1,cycleDays-1)), time:'08:00', title:'Vaccination', desc:'Vaccinate against PPR and enterotoxaemia.'},
        {day:Math.min(120,Math.max(1,cycleDays-1)), time:'08:00', title:'Weight check', desc:'Check weight and body condition.'},
        {day:cycleDays, time:'08:00', title:'Market or breeding decision', desc:'Decide on sale, breeding, or continued rearing.'}
      ]
    },
    duck:{
      recurring:[
        {time:'06:30', title:'Morning feed & water', desc:'Feed, refresh water/swimming access, check for lethargy.'},
        {time:'18:00', title:'Evening shelter check', desc:'Secure shelter from predators, final feed check.'}
      ],
      milestones:[
        {day:0, time:'07:00', title:'Brooder setup', desc:'Set brooder to 30-32°C. Ducklings arrive; provide shallow water.'},
        {day:Math.min(7,Math.max(1,cycleDays-1)), time:'08:00', title:'Health watch', desc:'Monitor closely for signs of viral hepatitis.'},
        {day:Math.min(21,Math.max(1,cycleDays-1)), time:'08:00', title:'Feed transition', desc:'Transition to grower feed, introduce outdoor access.'},
        {day:Math.min(35,Math.max(1,cycleDays-1)), time:'08:00', title:'Second health check', desc:'Check growth and general flock health.'},
        {day:cycleDays, time:'08:00', title:'Market day', desc:'Market-readiness weight check and buyer arrangement.'}
      ]
    }
  };
  const t = templates[group] || templates.poultry;
  const seen = new Set();
  const milestones = t.milestones.filter(m=>{
    const key = m.day+'|'+m.title;
    if(seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a,b)=> a.day-b.day || a.time.localeCompare(b.time));
  return {recurring:t.recurring, milestones};
}

function currentDayIndex(startedAt, cycleDays){
  const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 86400000);
  return Math.max(0, Math.min(cycleDays, elapsed));
}

async function startPlan(planId){
  const ok = await showConfirm(
    'Start this plan?',
    "This begins day-by-day tracking from Day 0. You'll see today's tasks here and get reminders while the app stays open. You can stop anytime."
  );
  if(!ok) return;
  let plans;
  try{ plans = await getAllSavedPlans(); }
  catch(err){ alert('Could not load this plan: ' + err.message); return; }
  const plan = plans.find(p=>p.id===planId);
  if(!plan) return;
  const schedule = buildExecutionSchedule(plan.group, plan.cycleDays);
  const activeRecord = {
    id: planId, startedAt: new Date().toISOString(),
    group: plan.group, groupName: plan.groupName, breedName: plan.breedName,
    qty: plan.qty, unitWord: plan.unitWord, cycleDays: plan.cycleDays, cycleLabel: plan.cycleLabel,
    schedule
  };
  await saveActivePlan(activeRecord);
  if('Notification' in window && Notification.permission === 'default'){
    Notification.requestPermission();
  }
  await renderMyPlansPage();
  openActiveSchedule(planId);
}

async function stopPlan(id){
  const ok = await showConfirm(
    'Stop this plan?',
    'This will end day-by-day tracking and stop reminders for this plan. Your saved plan itself is not deleted — you can start it again later. This cannot be undone for the current run.'
  );
  if(!ok) return;
  await deleteActivePlanRecord(id);
  backToMyPlansList();
  await renderMyPlansPage();
}

async function renderMyPlansPage(){
  const wrap = document.getElementById('myPlansGridWrap');
  wrap.innerHTML = '<div class="empty-state">Loading your plans…</div>';
  let saved, active;
  try{
    [saved, active] = await Promise.all([getAllSavedPlans(), getAllActivePlans()]);
  } catch(err){
    console.warn('renderMyPlansPage failed:', err);
    wrap.innerHTML = `<div class="empty-state">Could not load your plans: ${escapeHtml(err.message)}</div>`;
    return;
  }
  if(!saved.length){
    wrap.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12h8M12 8v8"/></svg><div>No saved plans yet. Build one in the Planner, tap "Save this plan", then come back here to start it.</div></div>`;
    return;
  }
  const activeMap = {};
  active.forEach(a=> activeMap[a.id]=a);

  wrap.innerHTML = `<div class="plans-grid">${saved.map(p=>{
    const act = activeMap[p.id];
    if(act){
      const dayIndex = currentDayIndex(act.startedAt, act.cycleDays);
      const pct = act.cycleDays ? Math.min(100, Math.round((dayIndex/act.cycleDays)*100)) : 0;
      return `<div class="card plan-card" onclick="openActiveSchedule('${p.id}')">
        <div class="icon-wrap">${groupIconSVG(p.group)}</div>
        <h4>${p.breedName} · ${p.groupName}</h4>
        <div class="p-meta">${p.qty.toLocaleString()} ${p.unitWord}s · Day ${dayIndex} of ${act.cycleDays}</div>
        <div style="height:6px;border-radius:100px;background:rgba(18,32,26,0.1);margin-top:10px;overflow:hidden;"><div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--meadow),var(--sky));"></div></div>
        <div class="result-actions" style="margin-top:14px;"><button class="solid-btn" onclick="event.stopPropagation(); openActiveSchedule('${p.id}')">View schedule</button></div>
      </div>`;
    }
    return `<div class="card plan-card">
      <div class="icon-wrap">${groupIconSVG(p.group)}</div>
      <h4>${p.breedName} · ${p.groupName}</h4>
      <div class="p-meta">${p.qty.toLocaleString()} ${p.unitWord}s · ${p.cycleLabel} cycle</div>
      <div class="p-profit">৳ ${Math.round(p.profit).toLocaleString()}</div>
      <div class="p-date">Saved ${new Date(p.savedAt).toLocaleDateString()}</div>
      <div class="result-actions" style="margin-top:14px;"><button class="solid-btn" onclick="event.stopPropagation(); startPlan('${p.id}')">Start this plan</button></div>
      <button class="delete-plan" onclick="event.stopPropagation(); deleteSavedPlan('${p.id}').then(renderMyPlansPage)">Delete</button>
    </div>`;
  }).join('')}</div>`;
}

function backToMyPlansList(){
  document.getElementById('myPlansScheduleView').style.display = 'none';
  document.getElementById('myPlansListView').style.display = 'block';
}

async function openActiveSchedule(planId){
  const active = await getAllActivePlans();
  const act = active.find(a=>a.id===planId);
  if(!act) return;

  document.getElementById('myPlansListView').style.display = 'none';
  document.getElementById('myPlansScheduleView').style.display = 'block';

  document.getElementById('activeIconWrap').innerHTML = groupIconSVG(act.group);
  document.getElementById('activeTitle').textContent = `${act.breedName} · ${act.groupName}`;
  document.getElementById('activeSubtitle').textContent = `${act.qty.toLocaleString()} ${act.unitWord}s · started ${new Date(act.startedAt).toLocaleDateString()}`;

  const dayIndex = currentDayIndex(act.startedAt, act.cycleDays);
  document.getElementById('activeDayChip').textContent = `Day ${dayIndex} of ${act.cycleDays}`;
  document.getElementById('activeProgressFill').style.width = (act.cycleDays ? Math.min(100,(dayIndex/act.cycleDays)*100) : 0) + '%';
  document.getElementById('activeCycleDaysLabel').textContent = act.cycleDays;

  const todaysMilestones = act.schedule.milestones.filter(m=>m.day===dayIndex);
  const todayHtml = [
    ...act.schedule.recurring.map(r=>`<div class="task-row"><div class="task-check"></div><div><div class="task-title">${escapeHtml(r.title)}</div><div class="task-meta">${r.time} · ${escapeHtml(r.desc)}</div></div></div>`),
    ...todaysMilestones.map(m=>`<div class="task-row"><div class="task-check" style="border-color:var(--sky-deep);"></div><div><div class="task-title">${escapeHtml(m.title)} <span style="color:var(--sky-deep);font-size:11px;font-weight:700;">MILESTONE</span></div><div class="task-meta">${m.time} · ${escapeHtml(m.desc)}</div></div></div>`)
  ].join('');
  document.getElementById('activeTodayList').innerHTML = todayHtml || '<div class="empty-state">Nothing scheduled for today.</div>';

  document.getElementById('activeRecurringList').innerHTML = act.schedule.recurring.map(r=>
    `<li><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="9"/></svg> <strong>${r.time}</strong> — ${escapeHtml(r.title)}: ${escapeHtml(r.desc)}</li>`
  ).join('');

  const startedDate = new Date(act.startedAt);
  document.getElementById('activeMilestoneTimeline').innerHTML = act.schedule.milestones.map(m=>{
    const d = new Date(startedDate.getTime() + m.day*86400000);
    const dateLabel = d.toLocaleDateString(undefined,{month:'short', day:'numeric'});
    const statusTag = m.day < dayIndex ? ' · done' : (m.day===dayIndex ? ' · today' : '');
    return `<div class="tl-item"><div class="week">Day ${m.day} · ${m.time} · ${dateLabel}${statusTag}</div><div class="desc"><strong>${escapeHtml(m.title)}</strong> — ${escapeHtml(m.desc)}</div></div>`;
  }).join('');

  if('Notification' in window){
    const note = document.getElementById('notifPermNote');
    if(Notification.permission === 'granted'){
      note.style.display='block';
      note.textContent = "Reminders are on — you'll get a notification for each task while this app stays open in your browser.";
    } else if(Notification.permission === 'denied'){
      note.style.display='block';
      note.textContent = 'Notifications are blocked in your browser settings, so reminders will only show inside this schedule view.';
    } else {
      note.style.display='block';
      note.textContent = 'Allow notifications when prompted to get reminders for each task while the app is open.';
    }
  }

  document.getElementById('stopPlanBtn').onclick = ()=> stopPlan(planId);
}

/* in-app notification scheduler — fires only while this tab stays open */
function checkActivePlanNotifications(){
  if(!('Notification' in window) || Notification.permission!=='granted') return;
  getAllActivePlans().then(activePlans=>{
    const now = new Date();
    const hhmm = now.toTimeString().slice(0,5);
    activePlans.forEach(act=>{
      const dayIndex = currentDayIndex(act.startedAt, act.cycleDays);
      act.schedule.recurring.forEach(r=>{
        if(r.time===hhmm){
          const key = act.id+'|r|'+r.time+'|'+now.toDateString();
          if(!notifiedKeys.has(key)){
            notifiedKeys.add(key);
            new Notification(`${act.breedName} · ${r.title}`, {body:r.desc});
          }
        }
      });
      act.schedule.milestones.filter(m=>m.day===dayIndex).forEach(m=>{
        if(m.time===hhmm){
          const key = act.id+'|m|'+m.day+'|'+m.time;
          if(!notifiedKeys.has(key)){
            notifiedKeys.add(key);
            new Notification(`${act.breedName} · ${m.title}`, {body:m.desc});
          }
        }
      });
    });
  }).catch(()=>{});
}
setInterval(checkActivePlanNotifications, 60000);

/* ================= ACCOUNT SYSTEM (Firebase Auth + Firestore) ================= */
let currentUser = null;
let currentProfile = null;
let unsubListings = null;
let unsubConvs = null;
let unsubMessages = null;
let activeConvId = null;
let cachedListings = [];
let cachedConvs = [];
let authMode = 'login';
let postType = 'sell';

function isGoogleUser(user){
  return !!(user && user.providerData && user.providerData.some(p=>p.providerId==='google.com'));
}

auth.onAuthStateChanged(async (user)=>{
  currentUser = user;
  if(!user){
    currentProfile = null;
    detachAllListeners();
    renderAccountState();
    return;
  }
  const verified = user.emailVerified || isGoogleUser(user);
  if(!verified){
    renderAccountState();
    return;
  }
  try{
    const doc = await db.collection('users').doc(user.uid).get();
    currentProfile = doc.exists ? doc.data() : null;
  } catch(e){
    console.warn('Profile check failed:', e);
    currentProfile = null;
  }
  renderAccountState();
});

/* single source of truth for which screen shows, used by Profile, Marketplace and My Plans */
function renderAccountState(){
  const loggedIn = !!currentUser;
  const verified = loggedIn && (currentUser.emailVerified || isGoogleUser(currentUser));
  const hasProfile = verified && !!currentProfile;

  const gate = document.getElementById('profAuthGate');
  const verify = document.getElementById('profVerifyGate');
  const details = document.getElementById('profDetailsForm');
  const main = document.getElementById('profMain');
  if(gate) gate.style.display = (!loggedIn) ? 'block' : 'none';
  if(verify) verify.style.display = (loggedIn && !verified) ? 'block' : 'none';
  if(details) details.style.display = (verified && !hasProfile) ? 'block' : 'none';
  if(main) main.style.display = hasProfile ? 'block' : 'none';

  if(loggedIn && !verified){
    document.getElementById('verifyEmailText').textContent = currentUser.email || 'your email';
  }
  if(hasProfile){
    document.getElementById('profDetailsHeading').textContent = 'Tell us a little about you';
    document.getElementById('profAvatar').textContent = (currentProfile.name||'?').charAt(0).toUpperCase();
    document.getElementById('profName').textContent = currentProfile.name || 'Farmer';
    document.getElementById('profHandle').textContent = currentProfile.username ? '@'+currentProfile.username : '';
    document.getElementById('profContact').textContent = [currentProfile.phone, currentProfile.location].filter(Boolean).join(' · ');
    document.getElementById('editName').value = currentProfile.name || '';
    document.getElementById('editUsername').value = currentProfile.username || '';
    document.getElementById('editPhone').value = currentProfile.phone || '';
    document.getElementById('editLocation').value = currentProfile.location || '';
  }

  const mktPrompt = document.getElementById('mktLoginPrompt');
  const mktMain = document.getElementById('mktMain');
  if(mktPrompt) mktPrompt.style.display = hasProfile ? 'none' : 'block';
  if(mktMain) mktMain.style.display = hasProfile ? 'block' : 'none';
  if(hasProfile){
    document.getElementById('acctAvatar').textContent = (currentProfile.name||'?').charAt(0).toUpperCase();
    document.getElementById('acctName').textContent = currentProfile.name || 'Farmer';
    document.getElementById('acctLocation').textContent = currentProfile.location || '';
    attachListingsListener();
    attachConversationsListener();
  }

  const plansPrompt = document.getElementById('myPlansLoginPrompt');
  const plansMain = document.getElementById('myPlansListView');
  if(plansPrompt){
    plansPrompt.style.display = hasProfile ? 'none' : 'block';
    if(plansMain) plansMain.style.display = hasProfile ? 'block' : 'none';
    if(hasProfile) renderMyPlansPage();
  }

  const medPrompt = document.getElementById('medLoginPrompt');
  const medMain = document.getElementById('medMain');
  if(medPrompt){
    medPrompt.style.display = hasProfile ? 'none' : 'block';
    if(medMain) medMain.style.display = hasProfile ? 'block' : 'none';
    if(hasProfile) initMedicalPage();
  }

  const adminTile = document.getElementById('adminTile');
  if(adminTile) adminTile.style.display = (hasProfile && currentProfile.isAdmin) ? 'block' : 'none';

  if(typeof renderHomeTasks === 'function'){ renderHomeTasks(); renderHomeAppointments(); }
}

function setAuthMode(mode){
  authMode = mode;
  document.querySelectorAll('.auth-toggle button').forEach(b=>b.classList.toggle('on', b.dataset.mode===mode));
  document.getElementById('authSubmitBtn').textContent = mode==='login' ? 'Log in' : 'Sign up';
  document.getElementById('authError').style.display='none';
}

function submitAuth(){
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const errEl = document.getElementById('authError');
  errEl.style.display='none';
  if(!email || !password){
    errEl.textContent = 'Please enter both an email and a password.';
    errEl.style.display='block';
    return;
  }
  const action = authMode==='login'
    ? auth.signInWithEmailAndPassword(email, password)
    : auth.createUserWithEmailAndPassword(email, password).then(cred=> cred.user.sendEmailVerification());
  action.catch(err=>{
    errEl.textContent = err.message;
    errEl.style.display='block';
  });
}

function signInWithGoogle(){
  const errEl = document.getElementById('authError');
  errEl.style.display='none';
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(err=>{
    if(err.code==='auth/popup-blocked' || err.code==='auth/cancelled-popup-request' || err.code==='auth/operation-not-supported-in-this-environment'){
      auth.signInWithRedirect(provider).catch(()=>{});
    } else {
      errEl.textContent = err.message;
      errEl.style.display='block';
    }
  });
}
auth.getRedirectResult().catch(err=>console.warn('Google redirect sign-in error:', err));

async function checkVerificationAndProceed(){
  const errEl = document.getElementById('verifyError');
  errEl.style.display='none';
  try{
    await auth.currentUser.reload();
    if(auth.currentUser.emailVerified){
      currentUser = auth.currentUser;
      renderAccountState();
    } else {
      errEl.textContent = "Still not verified — check your inbox (and spam folder), then try again.";
      errEl.style.display='block';
    }
  } catch(e){
    errEl.textContent = e.message;
    errEl.style.display='block';
  }
}
function resendVerification(){
  const errEl = document.getElementById('verifyError');
  auth.currentUser.sendEmailVerification().then(()=>{
    errEl.style.display='block';
    errEl.style.background='rgba(63,163,77,0.14)';
    errEl.style.color='var(--canopy-2)';
    errEl.textContent = 'Verification email sent — check your inbox.';
  }).catch(err=>{
    errEl.style.display='block';
    errEl.textContent = err.message;
  });
}

function logOut(){
  detachAllListeners();
  auth.signOut();
}

async function checkUsernameAvailable(username, uid){
  const doc = await db.collection('usernames').doc(username).get();
  return !doc.exists || doc.data().uid===uid;
}

function submitProfile(){
  const errEl = document.getElementById('profileError');
  errEl.style.display='none';
  const name = document.getElementById('profileName').value.trim();
  const username = document.getElementById('profileUsername').value.trim().toLowerCase();
  const phone = document.getElementById('profilePhone').value.trim();
  const location = document.getElementById('profileLocation').value.trim();

  if(!name || !location){
    errEl.textContent = 'Please add at least your name and location.';
    errEl.style.display='block';
    return;
  }
  if(!/^[a-z0-9_]{3,20}$/.test(username)){
    errEl.textContent = 'Unique user ID must be 3-20 characters: letters, numbers or underscore only.';
    errEl.style.display='block';
    return;
  }

  checkUsernameAvailable(username, currentUser.uid).then(available=>{
    if(!available){
      errEl.textContent = 'That user ID is already taken — try another.';
      errEl.style.display='block';
      return;
    }
    const profile = {name, username, phone, location, email: currentUser.email, createdAt: firebase.firestore.FieldValue.serverTimestamp()};
    return db.collection('usernames').doc(username).set({uid: currentUser.uid})
      .then(()=> db.collection('users').doc(currentUser.uid).set(profile))
      .then(()=>{
        currentProfile = profile;
        renderAccountState();
      });
  }).catch(err=>{
    errEl.textContent = err.message;
    errEl.style.display='block';
  });
}

function saveProfileEdits(){
  const errEl = document.getElementById('editProfileError');
  errEl.style.display='none';
  const name = document.getElementById('editName').value.trim();
  const username = document.getElementById('editUsername').value.trim().toLowerCase();
  const phone = document.getElementById('editPhone').value.trim();
  const location = document.getElementById('editLocation').value.trim();

  if(!name || !location){
    errEl.textContent = 'Please keep at least your name and location filled in.';
    errEl.style.display='block';
    return;
  }
  if(!/^[a-z0-9_]{3,20}$/.test(username)){
    errEl.textContent = 'Unique user ID must be 3-20 characters: letters, numbers or underscore only.';
    errEl.style.display='block';
    return;
  }

  checkUsernameAvailable(username, currentUser.uid).then(available=>{
    if(!available){
      errEl.textContent = 'That user ID is already taken — try another.';
      errEl.style.display='block';
      return;
    }
    const updates = {name, username, phone, location};
    const tasks = [db.collection('users').doc(currentUser.uid).set(updates, {merge:true})];
    if(username !== currentProfile.username){
      tasks.push(db.collection('usernames').doc(username).set({uid: currentUser.uid}));
    }
    return Promise.all(tasks).then(()=>{
      currentProfile = Object.assign({}, currentProfile, updates);
      renderAccountState();
      errEl.style.display='block';
      errEl.style.background='rgba(63,163,77,0.14)';
      errEl.style.color='var(--canopy-2)';
      errEl.textContent = 'Profile updated.';
    });
  }).catch(err=>{
    errEl.textContent = err.message;
    errEl.style.display='block';
  });
}

function promptLoginRequired(action){
  alert(`Please log in first to ${action}. Redirecting you to Profile…`);
  showPage('profile');
}

/* ---- tabs ---- */
function showMktView(view){
  document.querySelectorAll('.mkt-tab').forEach(t=>t.classList.toggle('active', t.dataset.view===view));
  document.querySelectorAll('.mkt-view').forEach(v=>v.classList.toggle('active', v.id==='mktview-'+view));
  if(view==='mylistings') renderMyListings();
  if(view==='inbox') backToInboxList();
}

/* ---- post a listing ---- */
function setPostType(type){
  postType = type;
  document.getElementById('postTypeSellBtn').classList.toggle('on', type==='sell');
  document.getElementById('postTypeWantedBtn').classList.toggle('on', type==='wanted');
  document.getElementById('postPriceLabel').textContent = type==='sell' ? 'Price (৳ per unit)' : "Price you're offering (৳ per unit, optional)";
  document.getElementById('postPriceMaxWrap').style.display = type==='wanted' ? 'block' : 'none';
}

function submitListing(){
  const errEl = document.getElementById('postError');
  errEl.style.display='none';
  const group = document.getElementById('postGroup').value;
  const breed = document.getElementById('postBreed').value.trim();
  const qty = parseFloat(document.getElementById('postQty').value) || 1;
  const priceRaw = document.getElementById('postPrice').value;
  const price = priceRaw ? parseFloat(priceRaw) : null;
  const priceMaxRaw = document.getElementById('postPriceMax').value;
  const priceMax = priceMaxRaw ? parseFloat(priceMaxRaw) : null;
  const location = document.getElementById('postLocation').value.trim();
  const desc = document.getElementById('postDesc').value.trim();

  if(!breed || !location){
    errEl.textContent = 'Please fill in at least breed/details and location.';
    errEl.style.display='block';
    return;
  }

  const listing = {
    type: postType, group, breed, qty, price, priceMax: postType==='wanted' ? priceMax : null,
    location, desc, authorUid: currentUser.uid, authorName: currentProfile.name,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(), status:'active'
  };
  db.collection('listings').add(listing).then(()=>{
    document.getElementById('postBreed').value='';
    document.getElementById('postQty').value='1';
    document.getElementById('postPrice').value='';
    document.getElementById('postPriceMax').value='';
    document.getElementById('postLocation').value='';
    document.getElementById('postDesc').value='';
    showMktView('browse');
  }).catch(err=>{
    errEl.textContent = err.message;
    errEl.style.display='block';
  });
}

/* ---- browse / filters (real-time) ---- */
function attachListingsListener(){
  if(unsubListings) unsubListings();
  unsubListings = db.collection('listings').where('status','==','active')
    .orderBy('createdAt','desc')
    .onSnapshot(snap=>{
      cachedListings = snap.docs.map(d=>({id:d.id, ...d.data()}));
      renderListings();
    }, err=>{
      console.warn('Listings listener error:', err);
      document.getElementById('listingsGridWrap').innerHTML = `<div class="empty-state">Could not load listings: ${escapeHtml(err.message)}</div>`;
    });
}

function renderListings(){
  const type = document.getElementById('filterType').value;
  const group = document.getElementById('filterGroup').value;
  const min = parseFloat(document.getElementById('filterMin').value);
  const max = parseFloat(document.getElementById('filterMax').value);
  const loc = document.getElementById('filterLocation').value.trim().toLowerCase();

  const list = cachedListings.filter(l=>{
    if(type!=='all' && l.type!==type) return false;
    if(group!=='all' && l.group!==group) return false;
    if(!isNaN(min) && (l.price==null || l.price<min)) return false;
    if(!isNaN(max) && (l.price==null || l.price>max)) return false;
    if(loc && !(l.location||'').toLowerCase().includes(loc)) return false;
    return true;
  });

  const wrap = document.getElementById('listingsGridWrap');
  if(!list.length){
    wrap.innerHTML = `<div class="empty-state">No listings match your filters yet. Try widening them, or be the first to post one.</div>`;
    return;
  }
  wrap.innerHTML = `<div class="listing-grid">${list.map(l=>listingCardHTML(l)).join('')}</div>`;
}

function listingCardHTML(l){
  const isMine = currentUser && l.authorUid===currentUser.uid;
  const priceText = l.type==='sell'
    ? (l.price!=null ? `৳ ${l.price.toLocaleString()} / unit` : 'Price on request')
    : (l.price!=null && l.priceMax!=null ? `৳ ${l.price.toLocaleString()}–${l.priceMax.toLocaleString()} / unit` : (l.price!=null ? `Up to ৳ ${l.price.toLocaleString()} / unit` : 'Price flexible'));
  return `<div class="card listing-card">
    <span class="listing-type ${l.type}">${l.type==='sell'?'For sale':'Wanted'}</span>
    <div class="icon-wrap">${groupIconSVG(l.group)}</div>
    <h4>${escapeHtml(l.breed||l.group)}</h4>
    <div class="l-meta">${l.qty} ${escapeHtml(l.group)} · ${escapeHtml(l.location||'')}</div>
    <div class="l-price">${priceText}</div>
    <div class="l-desc">${escapeHtml(l.desc||'')}</div>
    <div class="l-footer">
      <span>${escapeHtml(l.authorName||'Farmer')}</span>
      ${isMine ? '<span>Your listing</span>' : `<button class="ghost-btn" style="padding:6px 14px;font-size:11.5px;" onclick="startConversation('${l.id}')">Message</button>`}
    </div>
  </div>`;
}

/* ---- my listings ---- */
function renderMyListings(){
  const wrap = document.getElementById('myListingsGridWrap');
  wrap.innerHTML = '<div class="empty-state">Loading your listings…</div>';
  db.collection('listings').where('authorUid','==',currentUser.uid).orderBy('createdAt','desc').get()
    .then(snap=>{
      const list = snap.docs.map(d=>({id:d.id, ...d.data()}));
      if(!list.length){
        wrap.innerHTML = `<div class="empty-state">You haven't posted anything yet. Head to "Post a listing" to get started.</div>`;
        return;
      }
      wrap.innerHTML = `<div class="listing-grid">${list.map(l=>`
        <div class="card listing-card">
          <span class="listing-type ${l.type}">${l.type==='sell'?'For sale':'Wanted'}</span>
          <div class="icon-wrap">${groupIconSVG(l.group)}</div>
          <h4>${escapeHtml(l.breed||l.group)}</h4>
          <div class="l-meta">${l.qty} ${escapeHtml(l.group)} · ${escapeHtml(l.location||'')}</div>
          <div class="l-price">${l.price!=null?('৳ '+l.price.toLocaleString()):'Flexible'}</div>
          <div class="l-desc">${escapeHtml(l.desc||'')}</div>
          <div class="l-footer"><span>${l.status==='active'?'Active':'Closed'}</span>
            <button class="ghost-btn" style="padding:6px 14px;font-size:11.5px;" onclick="closeListingConfirm('${l.id}')">Delete</button>
          </div>
        </div>
      `).join('')}</div>`;
    })
    .catch(err=>{
      wrap.innerHTML = `<div class="empty-state">Could not load your listings: ${escapeHtml(err.message)}</div>`;
    });
}

async function closeListingConfirm(id){
  const ok = await showConfirm('Remove this listing?', 'It will no longer be visible to other farmers in the marketplace.');
  if(!ok) return;
  db.collection('listings').doc(id).delete().then(renderMyListings).catch(err=>alert(err.message));
}

/* ---- inbox / real-time chat ---- */
function attachConversationsListener(){
  if(unsubConvs) unsubConvs();
  unsubConvs = db.collection('conversations').where('participants','array-contains',currentUser.uid)
    .orderBy('updatedAt','desc')
    .onSnapshot(snap=>{
      cachedConvs = snap.docs.map(d=>({id:d.id, ...d.data()}));
      renderInboxList();
    }, err=>{
      console.warn('Conversations listener error:', err);
      document.getElementById('inboxListWrap').innerHTML = `<div class="empty-state">Could not load inbox: ${escapeHtml(err.message)}</div>`;
    });
}

function renderInboxList(){
  const wrap = document.getElementById('inboxListWrap');
  if(!cachedConvs.length){
    wrap.innerHTML = `<div class="empty-state">No conversations yet. Message someone from a listing in Browse to start one.</div>`;
    return;
  }
  wrap.innerHTML = cachedConvs.map(c=>{
    const otherUid = (c.participants||[]).find(p=>p!==currentUser.uid);
    const otherName = (c.participantNames && c.participantNames[otherUid]) || 'Farmer';
    const lastReadField = 'lastRead_'+currentUser.uid;
    const isUnread = c.lastSenderUid && c.lastSenderUid!==currentUser.uid &&
      (!c[lastReadField] || (c.updatedAt && c[lastReadField] && c.updatedAt.toMillis() > c[lastReadField].toMillis()));
    return `<div class="conv-row" onclick="openConversation('${c.id}')">
      <div class="avatar">${(otherName||'?').charAt(0).toUpperCase()}</div>
      <div style="flex:1;">
        <div class="c-who">${escapeHtml(otherName)}</div>
        <div class="c-listing">${escapeHtml(c.listingTitle||'')}</div>
        <div class="c-last">${escapeHtml(c.lastMessage||'No messages yet')}</div>
      </div>
      ${isUnread ? '<div class="unread-dot"></div>' : ''}
    </div>`;
  }).join('');
}

function backToInboxList(){
  document.getElementById('inboxChatView').style.display='none';
  document.getElementById('inboxListView').style.display='block';
  if(unsubMessages){ unsubMessages(); unsubMessages=null; }
  activeConvId = null;
}

function convIdFor(listingId, uidA, uidB){
  const sorted = [uidA, uidB].sort();
  return listingId + '__' + sorted[0] + '__' + sorted[1];
}

async function startConversation(listingId){
  let listing = cachedListings.find(l=>l.id===listingId);
  if(!listing){
    try{
      const listingDoc = await db.collection('listings').doc(listingId).get();
      if(listingDoc.exists) listing = {id: listingDoc.id, ...listingDoc.data()};
    }catch(e){
      console.warn('Could not fetch listing directly:', e);
    }
  }
  if(!listing){
    alert('Could not open this listing — it may have been removed. Try refreshing Browse.');
    return;
  }
  const otherUid = listing.authorUid;
  if(otherUid===currentUser.uid){
    alert("This is your own listing, so there's no one to message.");
    return;
  }
  try{
    const convId = convIdFor(listingId, currentUser.uid, otherUid);
    const convRef = db.collection('conversations').doc(convId);
    const doc = await convRef.get();
    if(!doc.exists){
      await convRef.set({
        listingId, listingTitle: `${listing.breed||listing.group} (${listing.type==='sell'?'for sale':'wanted'})`,
        participants: [currentUser.uid, otherUid],
        participantNames: {[currentUser.uid]: currentProfile.name, [otherUid]: listing.authorName},
        lastMessage: '', lastSenderUid: null,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    showMktView('inbox');
    openConversation(convId);
  } catch(err){
    console.warn('startConversation failed:', err);
    alert('Could not start the conversation: ' + err.message);
  }
}

function openConversation(convId){
  activeConvId = convId;
  document.getElementById('inboxListView').style.display='none';
  document.getElementById('inboxChatView').style.display='block';

  const conv = cachedConvs.find(c=>c.id===convId);
  const convRef = db.collection('conversations').doc(convId);

  function paintHeader(c){
    const otherUid = (c.participants||[]).find(p=>p!==currentUser.uid);
    const otherName = (c.participantNames && c.participantNames[otherUid]) || 'Farmer';
    document.getElementById('chatPartnerAvatar').textContent = (otherName||'?').charAt(0).toUpperCase();
    document.getElementById('chatPartnerName').textContent = otherName;
    document.getElementById('chatListingTitle').textContent = c.listingTitle || '';
  }
  if(conv) paintHeader(conv);
  else convRef.get().then(d=>{ if(d.exists) paintHeader(d.data()); });

  convRef.update({['lastRead_'+currentUser.uid]: firebase.firestore.FieldValue.serverTimestamp()}).catch(()=>{});

  if(unsubMessages) unsubMessages();
  unsubMessages = convRef.collection('messages').orderBy('at','asc').onSnapshot(snap=>{
    const thread = document.getElementById('mktChatThread');
    thread.innerHTML = snap.docs.map(d=>{
      const m = d.data();
      const mine = m.from===currentUser.uid;
      return `<div class="msg ${mine?'user':'ai'}">${escapeHtml(m.text)}</div>`;
    }).join('');
    thread.scrollTop = thread.scrollHeight;
  }, err=>{
    console.warn('Messages listener error:', err);
  });
}

document.getElementById('mktChatSend').addEventListener('click', sendMktMessage);
document.getElementById('mktChatInput').addEventListener('keydown', e=>{ if(e.key==='Enter') sendMktMessage(); });

function sendMktMessage(){
  const input = document.getElementById('mktChatInput');
  const text = input.value.trim();
  if(!text || !activeConvId) return;
  input.value='';
  const convRef = db.collection('conversations').doc(activeConvId);
  convRef.collection('messages').add({from: currentUser.uid, text, at: firebase.firestore.FieldValue.serverTimestamp()});
  convRef.update({lastMessage: text, lastSenderUid: currentUser.uid, updatedAt: firebase.firestore.FieldValue.serverTimestamp()});
}

function detachAllListeners(){
  if(typeof pc !== 'undefined' && pc){ endCall(); }
  if(unsubListings){ unsubListings(); unsubListings=null; }
  if(unsubConvs){ unsubConvs(); unsubConvs=null; }
  if(unsubMessages){ unsubMessages(); unsubMessages=null; }
  if(unsubAnimals){ unsubAnimals(); unsubAnimals=null; }
  if(unsubDoctors){ unsubDoctors(); unsubDoctors=null; }
  if(unsubFarmerAppts){ unsubFarmerAppts(); unsubFarmerAppts=null; }
  if(unsubRx){ unsubRx(); unsubRx=null; }
  if(unsubDocRequests){ unsubDocRequests(); unsubDocRequests=null; }
  if(unsubDocAppts){ unsubDocAppts(); unsubDocAppts=null; }
  if(unsubRoomAppt){ unsubRoomAppt(); unsubRoomAppt=null; }
  if(unsubRoomMessages){ unsubRoomMessages(); unsubRoomMessages=null; }
  if(unsubCallWatch){ unsubCallWatch(); unsubCallWatch=null; }
  medListenersAttached = false;
}

/* ================= THREE.JS HERO ================= */
(function(){
  const container = document.getElementById('hero-canvas');
  if(!container || !window.THREE) return;
  const width = container.clientWidth, height = container.clientHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width/height, 0.1, 100);
  camera.position.set(0,0,9);

  const renderer = new THREE.WebGLRenderer({alpha:true, antialias:true});
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5,6,7);
  scene.add(dirLight);
  const pointGold = new THREE.PointLight(0xF2A93B, 1.2, 20);
  pointGold.position.set(-4,-2,4);
  scene.add(pointGold);
  const pointSky = new THREE.PointLight(0x38BDF8, 1.2, 20);
  pointSky.position.set(4,3,4);
  scene.add(pointSky);

  // central glass orb
  const orbGeo = new THREE.SphereGeometry(2, 48, 48);
  const orbMat = new THREE.MeshPhysicalMaterial({
    color:0x3FA34D, transparent:true, opacity:0.28, roughness:0.15, metalness:0.1,
    clearcoat:1, transmission:0.6
  });
  const orb = new THREE.Mesh(orbGeo, orbMat);
  scene.add(orb);

  const wireGeo = new THREE.SphereGeometry(2.02, 24, 24);
  const wireMat = new THREE.MeshBasicMaterial({color:0x123524, wireframe:true, transparent:true, opacity:0.18});
  const wire = new THREE.Mesh(wireGeo, wireMat);
  scene.add(wire);

  // orbiting shapes representing weather / livestock / crops
  const shapes = [];
  const shapeDefs = [
    {geo:new THREE.IcosahedronGeometry(0.32,0), color:0x38BDF8, radius:3.1, speed:0.55, yOff:0.4},
    {geo:new THREE.OctahedronGeometry(0.3,0), color:0xF2A93B, radius:3.4, speed:0.4, yOff:-0.6},
    {geo:new THREE.TorusGeometry(0.26,0.09,8,16), color:0x6FCF7C, radius:2.9, speed:0.7, yOff:0.9},
    {geo:new THREE.ConeGeometry(0.26,0.5,6), color:0xE4572E, radius:3.6, speed:0.32, yOff:-0.2},
    {geo:new THREE.SphereGeometry(0.22,12,12), color:0xFFFFFF, radius:3.2, speed:0.48, yOff:0.1}
  ];
  shapeDefs.forEach((d,i)=>{
    const mat = new THREE.MeshStandardMaterial({color:d.color, roughness:0.3, metalness:0.2});
    const mesh = new THREE.Mesh(d.geo, mat);
    mesh.userData = {angle:(i/shapeDefs.length)*Math.PI*2, radius:d.radius, speed:d.speed, yOff:d.yOff};
    scene.add(mesh);
    shapes.push(mesh);
  });

  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', e=>{
    mouseX = (e.clientX / window.innerWidth - 0.5);
    mouseY = (e.clientY / window.innerHeight - 0.5);
  });

  const clock = new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    orb.rotation.y = t*0.15;
    wire.rotation.y = -t*0.1;
    wire.rotation.x = t*0.05;
    shapes.forEach(s=>{
      const a = s.userData.angle + t*s.userData.speed;
      s.position.x = Math.cos(a)*s.userData.radius;
      s.position.z = Math.sin(a)*s.userData.radius;
      s.position.y = s.userData.yOff + Math.sin(t*1.2 + s.userData.angle)*0.3;
      s.rotation.x += 0.01;
      s.rotation.y += 0.012;
    });
    camera.position.x += (mouseX*1.5 - camera.position.x)*0.03;
    camera.position.y += (-mouseY*1.2 - camera.position.y)*0.03;
    camera.lookAt(0,0,0);
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', ()=>{
    const w = container.clientWidth, h = container.clientHeight;
    camera.aspect = w/h;
    camera.updateProjectionMatrix();
    renderer.setSize(w,h);
  });
})();

/* ================= HOME: cursor effects (Home page only) ================= */
(function(){
  const dot = document.getElementById('cursorDot');
  const glow = document.getElementById('cursorGlow');
  if(!dot || !glow) return;

  function onMove(e){
    if(!document.getElementById('page-home').classList.contains('active')) return;
    glow.classList.add('show');
    glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    const overText = e.target.closest && e.target.closest('.mouse-fx-text');
    if(overText){
      dot.classList.add('show');
      dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%) scale(1)`;
    } else {
      dot.classList.remove('show');
    }
  }
  function onLeave(){ dot.classList.remove('show'); glow.classList.remove('show'); }

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseleave', onLeave);
})();

/* ================= HOME: real "today's tasks" from active plans + appointment reminders ================= */
async function renderHomeTasks(){
  const wrap = document.getElementById('homeTasksWrap');
  const tag = document.getElementById('homeTasksTag');
  if(!wrap) return;
  if(!currentUser || !currentProfile){
    wrap.innerHTML = `<div class="empty-state" style="padding:24px 10px;">Log in and start a plan to see today's real tasks here. <a href="#" onclick="showPage('profile'); return false;" style="color:var(--canopy-2);font-weight:700;">Go to Profile</a></div>`;
    if(tag) tag.textContent = 'Not logged in';
    return;
  }
  wrap.innerHTML = `<div class="empty-state" style="padding:24px 10px;">Loading…</div>`;
  let active;
  try{ active = await getAllActivePlans(); }
  catch(err){
    wrap.innerHTML = `<div class="empty-state" style="padding:24px 10px;">Could not load tasks: ${escapeHtml(err.message)}</div>`;
    return;
  }
  if(!active.length){
    wrap.innerHTML = `<div class="empty-state" style="padding:24px 10px;">No active plan yet. <a href="#" onclick="showPage('planner'); return false;" style="color:var(--canopy-2);font-weight:700;">Build one in Planner</a>, save it, then start it from My Plans.</div>`;
    if(tag) tag.textContent = 'No active plan';
    return;
  }
  const badgeClass = {poultry:'badge-poultry', cow:'badge-cow', goat:'badge-cow', duck:'badge-poultry'};
  let rows = [];
  active.forEach(act=>{
    const dayIndex = currentDayIndex(act.startedAt, act.cycleDays);
    const todaysMilestones = (act.schedule.milestones||[]).filter(m=>m.day===dayIndex);
    act.schedule.recurring.forEach(r=>{
      rows.push({title:r.title, meta:`${r.time} · ${act.breedName}`, group:act.group});
    });
    todaysMilestones.forEach(m=>{
      rows.push({title:m.title+' (milestone)', meta:`${m.time} · ${act.breedName}`, group:act.group});
    });
  });
  wrap.innerHTML = rows.map(r=>`
    <div class="task-row">
      <div class="task-check"></div>
      <div><div class="task-title">${escapeHtml(r.title)}</div><div class="task-meta">${escapeHtml(r.meta)}</div></div>
      <span class="task-badge ${badgeClass[r.group]||'badge-poultry'}">${escapeHtml(r.group)}</span>
    </div>
  `).join('');
  if(tag) tag.textContent = `${rows.length} task${rows.length===1?'':'s'} today · ${active.length} active plan${active.length===1?'':'s'}`;
}

async function renderHomeAppointments(){
  const wrap = document.getElementById('homeApptWrap');
  if(!wrap) return;
  if(!currentUser || !currentProfile){ wrap.innerHTML=''; return; }
  try{
    const snaps = await Promise.all([
      db.collection('medAppointments').where('userUid','==',currentUser.uid).where('status','in',['pending','accepted']).get().catch(()=>({docs:[]})),
      db.collection('medAppointments').where('doctorUid','==',currentUser.uid).where('status','==','pending').get().catch(()=>({docs:[]}))
    ]);
    const mine = snaps[0].docs.map(d=>({id:d.id, ...d.data()}));
    const incoming = snaps[1].docs.map(d=>({id:d.id, ...d.data()}));
    if(!mine.length && !incoming.length){ wrap.innerHTML=''; return; }
    let html = '';
    if(mine.length){
      const a = mine[0];
      html += `<div class="card home-appt-card" onclick="showPage('medical')">
        <div class="icon-wrap"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L4 7v6c0 5 4 8 8 9 4-1 8-4 8-9V7l-8-5z"/></svg></div>
        <div><div class="a-title">${a.status==='pending' ? 'Appointment request pending' : 'Upcoming appointment'} with Dr. ${escapeHtml(a.doctorName||'')}</div>
        <div class="a-sub">${escapeHtml(a.animalName||'')}${mine.length>1?` · +${mine.length-1} more`:''} — tap to view in Medical</div></div>
      </div>`;
    }
    if(incoming.length){
      html += `<div class="card home-appt-card" onclick="showPage('medical')">
        <div class="icon-wrap"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L14.7 3.86a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg></div>
        <div><div class="a-title">${incoming.length} patient request${incoming.length===1?'':'s'} waiting</div>
        <div class="a-sub">Tap to accept or decline in Medical</div></div>
      </div>`;
    }
    wrap.innerHTML = html;
  } catch(err){
    console.warn('renderHomeAppointments failed:', err);
    wrap.innerHTML = '';
  }
}

/* ================= MEDICAL: real doctor consultations ================= */

/* ---- state ---- */
let medListenersAttached = false;
let cachedAnimals = [];
let cachedDoctors = [];
let cachedFarmerAppts = [];
let cachedRx = [];
let cachedDocRequests = [];
let cachedDocAppts = [];
let unsubAnimals=null, unsubDoctors=null, unsubFarmerAppts=null, unsubRx=null, unsubDocRequests=null, unsubDocAppts=null;
let unsubRoomAppt=null, unsubRoomMessages=null, unsubCallWatch=null;
let bookingDoctor = null;
let bookMode='text', bookWhen='now';
let currentRoomApptId = null;
let currentRoomAppt = null;
let rxMedCount = 0;

/* recording */
let mediaRecorder=null, recordedChunks=[], recordStream=null, recordTimerHandle=null, recordSeconds=0, recordKind='video';

/* webrtc */
let pc=null, localStream=null, callSessionUnsub=null, callCandUnsub=null, callIsCaller=false, callMode='video';
const RTC_CONFIG = {iceServers:[
  {urls:'stun:stun.l.google.com:19302'},
  {urls:'stun:stun1.l.google.com:19302'},
  /* Free public TURN relay (Open Relay Project) — needed because STUN alone fails to
     connect a meaningful fraction of real mobile/carrier networks. This is a shared,
     rate-limited free service; fine for pilot-scale use, worth a paid TURN provider
     before this app has real usage volume. */
  {urls:'turn:openrelay.metered.ca:80', username:'openrelayproject', credential:'openrelayproject'},
  {urls:'turn:openrelay.metered.ca:443', username:'openrelayproject', credential:'openrelayproject'},
  {urls:'turn:openrelay.metered.ca:443?transport=tcp', username:'openrelayproject', credential:'openrelayproject'}
]};
let callTimeoutHandle = null;

/* ---- helpers ---- */
function genQuickId(prefix){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s='';
  for(let i=0;i<5;i++) s+=chars[Math.floor(Math.random()*chars.length)];
  return (prefix||'ANM')+'-'+s;
}
function fmtWhen(ts){
  if(!ts) return 'As soon as possible';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'});
}
function statusLabel(status){
  return {pending:'Pending', accepted:'Accepted', declined:'Declined', completed:'Completed'}[status] || status;
}
function statusSevClass(status){
  return {pending:'sev-med', accepted:'sev-low', declined:'sev-high', completed:'sev-low'}[status] || 'sev-med';
}

/* ---- page init ---- */
function initMedicalPage(){
  document.getElementById('medAcctAvatar').textContent = (currentProfile.name||'?').charAt(0).toUpperCase();
  document.getElementById('medAcctName').textContent = currentProfile.name || 'Farmer';
  const isDoctor = !!currentProfile.doctorProfile;
  document.getElementById('medAcctRole').textContent = isDoctor ? ('Doctor · '+(currentProfile.doctorProfile.specialty||'')) : 'Farmer account';
  document.getElementById('medRoleSwitchBtn').style.display = isDoctor ? 'none' : 'inline-block';
  if(document.getElementById('medRoom').style.display !== 'block'){
    document.getElementById('medFarmerView').style.display = isDoctor ? 'none' : 'block';
    document.getElementById('medDoctorView').style.display = isDoctor ? 'block' : 'none';
  }

  if(medListenersAttached) return;
  medListenersAttached = true;
  if(isDoctor){
    document.getElementById('docEditSpecialty').value = currentProfile.doctorProfile.specialty||'';
    document.getElementById('docEditBio').value = currentProfile.doctorProfile.bio||'';
    document.getElementById('docEditFeeType').value = currentProfile.doctorProfile.feeType||'free';
    document.getElementById('docEditFeeAmount').value = currentProfile.doctorProfile.fee||'';
    document.getElementById('docEditFeeAmountWrap').style.display = (currentProfile.doctorProfile.feeType==='paid') ? 'block':'none';
    document.getElementById('docEditYearsExp').value = currentProfile.doctorProfile.yearsExperience||'';
    setDoctorStatusButtons(currentProfile.doctorProfile.status||'offline');
    attachDoctorRequestsListener();
    attachDoctorApptsListener();
  } else {
    attachAnimalsListener();
    attachDoctorsListener();
    attachFarmerApptsListener();
    attachRxListener();
  }
}

/* ---- tabs ---- */
function showMedFarmerView(view){
  document.querySelectorAll('#medFarmerView .mkt-tab').forEach(b=>b.classList.remove('active'));
  document.querySelector('#medFarmerView .mkt-tab[data-view="'+view+'"]').classList.add('active');
  document.querySelectorAll('#medFarmerView .mkt-view').forEach(v=>v.classList.remove('active'));
  document.getElementById('medview-'+view).classList.add('active');
}
function showMedDoctorView(view){
  document.querySelectorAll('#medDoctorView .mkt-tab').forEach(b=>b.classList.remove('active'));
  document.querySelector('#medDoctorView .mkt-tab[data-view="'+view+'"]').classList.add('active');
  document.querySelectorAll('#medDoctorView .mkt-view').forEach(v=>v.classList.remove('active'));
  document.getElementById('medview-'+view).classList.add('active');
}

/* ---- doctor registration is now handled by the verified "Become a Doctor" application flow ---- */

function setDoctorStatusButtons(status){
  document.getElementById('docStatusOnlineBtn').classList.toggle('on', status==='online');
  document.getElementById('docStatusOfflineBtn').classList.toggle('on', status!=='online');
}
function setDoctorStatus(status){
  db.collection('users').doc(currentUser.uid).update({'doctorProfile.status': status}).then(()=>{
    currentProfile.doctorProfile.status = status;
    setDoctorStatusButtons(status);
  }).catch(err=>alert(err.message));
}

function saveDoctorProfileEdits(){
  const errEl = document.getElementById('docEditError');
  errEl.style.display='none';
  const specialty = document.getElementById('docEditSpecialty').value.trim();
  const feeType = document.getElementById('docEditFeeType').value;
  const fee = feeType==='paid' ? (parseFloat(document.getElementById('docEditFeeAmount').value)||0) : 0;
  const bio = document.getElementById('docEditBio').value.trim();
  const yearsExperience = parseFloat(document.getElementById('docEditYearsExp').value) || 0;
  if(!specialty){ errEl.textContent='Please enter your specialty.'; errEl.style.display='block'; return; }
  db.collection('users').doc(currentUser.uid).update({
    'doctorProfile.specialty': specialty,
    'doctorProfile.feeType': feeType,
    'doctorProfile.fee': fee,
    'doctorProfile.bio': bio,
    'doctorProfile.yearsExperience': yearsExperience
  }).then(()=>{
    Object.assign(currentProfile.doctorProfile, {specialty, feeType, fee, bio, yearsExperience});
    alert('Profile updated.');
  }).catch(err=>{ errEl.textContent = err.message; errEl.style.display='block'; });
}

/* ---- animals ---- */
function attachAnimalsListener(){
  if(unsubAnimals) unsubAnimals();
  unsubAnimals = db.collection('animals').where('ownerUid','==',currentUser.uid)
    .orderBy('createdAt','desc')
    .onSnapshot(snap=>{
      cachedAnimals = snap.docs.map(d=>({id:d.id, ...d.data()}));
      renderAnimalList();
    }, err=>{
      console.warn('Animals listener error:', err);
      document.getElementById('animalListWrap').innerHTML = `<div class="empty-state">Could not load animals: ${escapeHtml(err.message)}</div>`;
    });
}

function renderAnimalList(){
  const wrap = document.getElementById('animalListWrap');
  if(!cachedAnimals.length){
    wrap.innerHTML = `<div class="empty-state">No animals yet. Add one above to start a consultation.</div>`;
    return;
  }
  wrap.innerHTML = cachedAnimals.map(a=>`
    <div class="card animal-card">
      <div class="ac-body">
        <h4>${escapeHtml(a.name)} <span style="font-weight:400;color:rgba(18,32,26,.5);">· ${escapeHtml(a.species)}</span></h4>
        <p>${[a.breed, a.age].filter(Boolean).map(escapeHtml).join(' · ') || 'No extra details'}</p>
        <span class="aid-chip">${escapeHtml(a.animalId)}</span>
      </div>
    </div>
  `).join('');
}

function submitAnimal(){
  const errEl = document.getElementById('animalError');
  errEl.style.display='none';
  const species = document.getElementById('animalSpecies').value;
  const name = document.getElementById('animalName').value.trim();
  const breed = document.getElementById('animalBreed').value.trim();
  const age = document.getElementById('animalAge').value.trim();
  const notes = document.getElementById('animalNotes').value.trim();
  if(!name){ errEl.textContent='Please give this animal a name or batch label.'; errEl.style.display='block'; return; }
  const animalId = genQuickId(species.slice(0,3).toUpperCase());
  db.collection('animals').add({
    ownerUid: currentUser.uid, ownerName: currentProfile.name, animalId, species, name, breed, age, notes,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(()=>{
    document.getElementById('animalName').value='';
    document.getElementById('animalBreed').value='';
    document.getElementById('animalAge').value='';
    document.getElementById('animalNotes').value='';
    errEl.style.display='none';
  }).catch(err=>{ errEl.textContent = err.message; errEl.style.display='block'; });
}

/* ---- find a doctor ---- */
function attachDoctorsListener(){
  if(unsubDoctors) unsubDoctors();
  unsubDoctors = db.collection('users').where('isDoctor','==',true)
    .onSnapshot(snap=>{
      cachedDoctors = snap.docs.map(d=>({uid:d.id, ...d.data()}));
      renderDoctorList();
    }, err=>{
      console.warn('Doctors listener error:', err);
      document.getElementById('doctorListWrap').innerHTML = `<div class="empty-state">Could not load doctors: ${escapeHtml(err.message)}</div>`;
    });
}

function renderDoctorList(){
  const nameFilter = (document.getElementById('docSearchName').value||'').trim().toLowerCase();
  const statusFilter = document.getElementById('docSearchStatus').value;
  const feeFilter = document.getElementById('docSearchFee').value;
  const list = cachedDoctors.filter(d=>{
    if(nameFilter && !(d.name||'').toLowerCase().includes(nameFilter)) return false;
    const status = (d.doctorProfile && d.doctorProfile.status) || 'offline';
    if(statusFilter!=='all' && status!==statusFilter) return false;
    const feeType = (d.doctorProfile && d.doctorProfile.feeType) || 'free';
    if(feeFilter!=='all' && feeType!==feeFilter) return false;
    return true;
  });
  const wrap = document.getElementById('doctorListWrap');
  if(!list.length){
    wrap.innerHTML = `<div class="empty-state">No doctors match yet. Try widening your search.</div>`;
    return;
  }
  wrap.innerHTML = list.map(d=>{
    const dp = d.doctorProfile||{};
    const status = dp.status||'offline';
    const feeLabel = dp.feeType==='paid' ? ('৳'+(dp.fee||0)+' / session') : 'Free';
    return `
    <div class="card doctor-card" style="cursor:pointer;" onclick="openDoctorDetail(${JSON.stringify(d.uid)})">
      <div class="avatar">${escapeHtml((d.name||'?').charAt(0).toUpperCase())}</div>
      <div class="dc-body">
        <h3>${escapeHtml(d.name||'Doctor')}</h3>
        <div class="dc-spec">${escapeHtml(dp.specialty||'General veterinarian')}</div>
        ${dp.bio ? `<div class="dc-bio">${escapeHtml(dp.bio)}</div>` : ''}
        <div class="dc-meta">
          <span class="status-pill ${status}">${status==='online' ? '<span class="dot-live"></span>Online now' : 'Offline'}</span>
          <span class="fee-pill">${feeLabel}</span>
        </div>
        <button class="primary-btn" style="width:auto;padding:10px 18px;" onclick='event.stopPropagation(); openBookModal(${JSON.stringify(d.uid)})'>Book</button>
      </div>
    </div>`;
  }).join('');
}

/* ---- doctor detail profile (full-screen) ---- */
let ddCurrentUid = null;
let ddCurrentIsSelf = false;

async function openDoctorDetail(uid){
  let doc = cachedDoctors.find(d=>d.uid===uid);
  if(!doc && uid===currentUser.uid && currentProfile.doctorProfile){
    doc = {uid, name: currentProfile.name, doctorProfile: currentProfile.doctorProfile};
  }
  if(!doc){
    try{
      const snap = await db.collection('users').doc(uid).get();
      if(snap.exists) doc = {uid, ...snap.data()};
    }catch(e){}
  }
  if(!doc){ alert('Could not load this doctor profile.'); return; }

  ddCurrentUid = uid;
  ddCurrentIsSelf = (uid===currentUser.uid);
  const dp = doc.doctorProfile || {};

  document.getElementById('doctorDetailOverlay').style.display='block';
  window.scrollTo({top:0});
  document.getElementById('ddAvatar').textContent = (doc.name||'?').charAt(0).toUpperCase();
  document.getElementById('ddName').innerHTML = `${escapeHtml(doc.name || 'Doctor')} <span class="verified-badge"><svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Verified</span>`;
  document.getElementById('ddSpecialty').textContent = dp.specialty || 'General veterinarian';
  document.getElementById('ddFee').textContent = dp.feeType==='paid' ? `৳${dp.fee||0} / session` : 'Free consultation';
  document.getElementById('ddExp').textContent = dp.yearsExperience ? `${dp.yearsExperience} yrs` : '—';
  document.getElementById('ddBio').textContent = dp.bio || "This doctor hasn't added a bio yet.";
  document.getElementById('ddBookBtn').style.display = ddCurrentIsSelf ? 'none' : 'block';
  setDdTab('feedback');

  document.getElementById('ddReviewsWrap').innerHTML = '<div class="empty-state">Loading…</div>';
  document.getElementById('ddRating').innerHTML = '<span class="stars">☆☆☆☆☆</span> <span class="count">Loading…</span>';
  document.getElementById('ddVisits').textContent = '…';
  document.getElementById('ddPatients').textContent = '…';

  try{
    const [reviewSnap, apptSnap] = await Promise.all([
      db.collection('doctorReviews').where('doctorUid','==',uid).orderBy('createdAt','desc').get(),
      db.collection('medAppointments').where('doctorUid','==',uid).where('status','==','completed').orderBy('createdAt','desc').get()
    ]);
    const reviews = reviewSnap.docs.map(d=>({id:d.id, ...d.data()}));
    const completed = apptSnap.docs.map(d=>d.data());
    const patientSet = new Set(completed.map(a=>a.userUid));

    document.getElementById('ddVisits').textContent = completed.length.toLocaleString();
    document.getElementById('ddPatients').textContent = patientSet.size.toLocaleString();

    if(reviews.length){
      const avg = reviews.reduce((s,r)=>s+(r.rating||0),0) / reviews.length;
      document.getElementById('ddRating').innerHTML = `<span class="stars">${starString(avg)}</span> <span class="count">${avg.toFixed(1)} · ${reviews.length} review${reviews.length===1?'':'s'}</span>`;
      document.getElementById('ddReviewsWrap').innerHTML = reviews.map(r=>`
        <div class="dd-review">
          <div class="dd-review-top">
            <span class="dd-review-name">${escapeHtml(r.farmerName||'Farmer')}</span>
            <span class="dd-review-date">${r.createdAt && r.createdAt.toDate ? r.createdAt.toDate().toLocaleDateString() : ''}</span>
          </div>
          <div class="dd-review-stars">${starString(r.rating||0)}</div>
          ${r.text ? `<div class="dd-review-text">${escapeHtml(r.text)}</div>` : ''}
          ${(r.tags&&r.tags.length) ? `<div class="dd-review-tags">${r.tags.map(t=>`<span>${escapeHtml(t)}</span>`).join('')}</div>` : ''}
        </div>
      `).join('');
    } else {
      document.getElementById('ddRating').innerHTML = '<span class="stars">☆☆☆☆☆</span> <span class="count">No reviews yet</span>';
      document.getElementById('ddReviewsWrap').innerHTML = '<div class="empty-state">No reviews yet.</div>';
    }
  } catch(err){
    console.warn('openDoctorDetail stats failed:', err);
    document.getElementById('ddReviewsWrap').innerHTML = `<div class="empty-state">Could not load reviews: ${escapeHtml(err.message)}</div>`;
    document.getElementById('ddVisits').textContent = '—';
    document.getElementById('ddPatients').textContent = '—';
  }
}

function starString(rating){
  const full = Math.round(rating);
  return '★'.repeat(Math.max(0,Math.min(5,full))) + '☆'.repeat(5-Math.max(0,Math.min(5,full)));
}

function closeDoctorDetail(){
  document.getElementById('doctorDetailOverlay').style.display='none';
  ddCurrentUid = null;
}

function setDdTab(tab){
  document.querySelectorAll('.dd-tab').forEach(t=>t.classList.toggle('on', t.dataset.tab===tab));
  document.getElementById('ddPanelFeedback').style.display = tab==='feedback' ? 'block' : 'none';
  document.getElementById('ddPanelAbout').style.display = tab==='about' ? 'block' : 'none';
}

function bookFromDoctorDetail(){
  if(!ddCurrentUid || ddCurrentIsSelf) return;
  const uid = ddCurrentUid;
  closeDoctorDetail();
  openBookModal(uid);
}

function previewMyDoctorProfile(){
  if(!currentUser) return;
  openDoctorDetail(currentUser.uid);
}

/* ================= DOCTOR VERIFICATION SYSTEM ================= */

/* compress an image file client-side into a small JPEG data URL, so certificate
   photos can live directly in Firestore without needing paid file storage */
function compressImageToDataURL(file, maxDim, quality){
  maxDim = maxDim || 800; quality = quality || 0.5;
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onload = e=>{
      const img = new Image();
      img.onload = ()=>{
        let w = img.width, h = img.height;
        if(w > h && w > maxDim){ h = Math.round(h*maxDim/w); w = maxDim; }
        else if(h > maxDim){ w = Math.round(w*maxDim/h); h = maxDim; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

let bdPhotos = {}; // type -> dataURL, held in memory until submit

function handleBdFile(inputEl, type){
  const file = inputEl.files[0];
  if(!file) return;
  compressImageToDataURL(file, 900, 0.55).then(dataUrl=>{
    bdPhotos[type] = dataUrl;
    const thumb = document.getElementById('bdThumb-'+type);
    thumb.src = dataUrl;
    thumb.style.display = 'inline-block';
    if(dataUrl.length > 900000){
      alert('That photo is still fairly large after compression — it may be slow to upload. Consider a simpler/clearer photo if this fails.');
    }
  }).catch(()=>{
    alert('Could not read that photo. Please try a different file.');
  });
}

async function initBecomeDoctorPage(){
  document.getElementById('bdLoginPrompt').style.display = 'none';
  document.getElementById('bdAlreadyDoctor').style.display = 'none';
  document.getElementById('bdStatusView').style.display = 'none';
  document.getElementById('bdFormView').style.display = 'none';

  if(!currentUser || !currentProfile){
    document.getElementById('bdLoginPrompt').style.display = 'block';
    return;
  }
  if(currentProfile.isDoctor){
    document.getElementById('bdAlreadyDoctor').style.display = 'block';
    return;
  }

  let appDoc;
  try{
    const snap = await db.collection('doctorApplications').doc(currentUser.uid).get();
    appDoc = snap.exists ? snap.data() : null;
  } catch(err){
    console.warn('Could not check application status:', err);
    appDoc = null;
  }

  if(appDoc && (appDoc.status==='pending' || appDoc.status==='rejected')){
    const iconWrap = document.getElementById('bdStatusIconWrap');
    const title = document.getElementById('bdStatusTitle');
    const body = document.getElementById('bdStatusBody');
    const noteWrap = document.getElementById('bdRejectNoteWrap');
    const reapplyBtn = document.getElementById('bdReapplyBtn');
    if(appDoc.status==='pending'){
      iconWrap.style.background='rgba(242,169,59,0.18)';
      iconWrap.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#8a5a12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>';
      title.textContent = 'Application under review';
      body.textContent = "We're reviewing your certificates. This usually takes a few days — you'll gain access to Medical's doctor tools as soon as you're approved.";
      noteWrap.style.display='none';
      reapplyBtn.style.display='none';
    } else {
      iconWrap.style.background='rgba(228,87,46,0.16)';
      iconWrap.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="var(--barn)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></svg>';
      title.textContent = 'Application not approved';
      body.textContent = "Your last application wasn't approved. You're welcome to review the note below and apply again.";
      noteWrap.style.display = appDoc.reviewNote ? 'block' : 'none';
      noteWrap.textContent = appDoc.reviewNote ? ('Reviewer note: ' + appDoc.reviewNote) : '';
      reapplyBtn.style.display='block';
    }
    document.getElementById('bdStatusView').style.display = 'block';
    return;
  }

  showBdForm();
}

function showBdForm(){
  bdPhotos = {};
  document.querySelectorAll('.bd-thumb').forEach(t=>{ t.style.display='none'; t.src=''; });
  document.getElementById('bdName').value = currentProfile.name || '';
  document.getElementById('bdError').style.display='none';
  document.getElementById('bdStatusView').style.display = 'none';
  document.getElementById('bdFormView').style.display = 'block';
}

function resetDoctorApplicationForm(){
  showBdForm();
}

async function submitDoctorApplication(){
  const errEl = document.getElementById('bdError');
  errEl.style.display='none';
  const name = document.getElementById('bdName').value.trim();
  const age = parseFloat(document.getElementById('bdAge').value) || null;
  const birthday = document.getElementById('bdBirthday').value;
  const specialty = document.getElementById('bdSpecialty').value.trim();
  const feeType = document.getElementById('bdFeeType').value;
  const fee = feeType==='paid' ? (parseFloat(document.getElementById('bdFeeAmount').value)||0) : 0;
  const yearsExperience = parseFloat(document.getElementById('bdYearsExp').value) || 0;
  const university = document.getElementById('bdUniversity').value.trim();
  const bio = document.getElementById('bdBio').value.trim();

  if(!name || !age || !birthday || !specialty){
    errEl.textContent = 'Please fill in your name, age, birthday and specialty.';
    errEl.style.display='block';
    return;
  }
  const requiredPhotos = ['profile','doctorCertificate','eduQualification','universityCertificate','hsc'];
  const missing = requiredPhotos.filter(t=>!bdPhotos[t]);
  if(missing.length){
    errEl.textContent = 'Please upload all 5 photos before submitting.';
    errEl.style.display='block';
    return;
  }

  const application = {
    applicantUid: currentUser.uid, name, age, birthday, specialty, feeType, fee,
    yearsExperience, university, bio, status:'pending',
    submittedAt: firebase.firestore.FieldValue.serverTimestamp(), reviewedAt: null, reviewNote: null
  };

  try{
    const appRef = db.collection('doctorApplications').doc(currentUser.uid);
    await appRef.set(application);
    const photoWrites = requiredPhotos.map(type=>
      appRef.collection('photos').doc(type).set({type, dataUrl: bdPhotos[type], uploadedAt: firebase.firestore.FieldValue.serverTimestamp()})
    );
    await Promise.all(photoWrites);
    initBecomeDoctorPage();
  } catch(err){
    errEl.textContent = 'Could not submit: ' + err.message;
    errEl.style.display='block';
  }
}

/* ---- admin review dashboard ---- */
let unsubAdminApps = null;

function initAdminDoctorsPage(){
  const wrap = document.getElementById('adminAppsWrap');
  const notAuth = document.getElementById('adminNotAuthorized');
  if(!currentProfile || !currentProfile.isAdmin){
    notAuth.style.display='block';
    wrap.innerHTML='';
    return;
  }
  notAuth.style.display='none';
  wrap.innerHTML = '<div class="empty-state">Loading applications…</div>';

  if(unsubAdminApps) unsubAdminApps();
  unsubAdminApps = db.collection('doctorApplications').where('status','==','pending')
    .onSnapshot(snap=>{
      const apps = snap.docs.map(d=>d.data());
      renderAdminApps(apps);
    }, err=>{
      console.warn('Admin applications listener failed:', err);
      wrap.innerHTML = `<div class="empty-state">Could not load applications: ${escapeHtml(err.message)}</div>`;
    });
}

async function renderAdminApps(apps){
  const wrap = document.getElementById('adminAppsWrap');
  if(!apps.length){
    wrap.innerHTML = '<div class="empty-state">No pending applications right now.</div>';
    return;
  }
  const cardsHtml = await Promise.all(apps.map(async a=>{
    let photosHtml = '';
    try{
      const photoSnap = await db.collection('doctorApplications').doc(a.applicantUid).collection('photos').get();
      const labels = {profile:'Photo', doctorCertificate:'Doctor certificate', eduQualification:'Educational qualification', universityCertificate:'University certificate', hsc:'HSC certificate'};
      photosHtml = photoSnap.docs.map(d=>{
        const p = d.data();
        return `<div style="text-align:center;"><img src="${p.dataUrl}" style="width:100%;max-width:140px;border-radius:12px;border:1px solid rgba(18,32,26,0.1);"><div style="font-size:10.5px;color:rgba(18,32,26,.5);margin-top:4px;">${escapeHtml(labels[p.type]||p.type)}</div></div>`;
      }).join('');
    }catch(e){ photosHtml = '<div class="empty-state">Could not load photos.</div>'; }

    return `<div class="card" style="margin-bottom:18px;padding:22px;">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <div>
          <h3 style="margin:0 0 3px;font-size:16px;color:var(--canopy);">${escapeHtml(a.name)}</h3>
          <div style="font-size:12.5px;color:rgba(18,32,26,.6);">${escapeHtml(a.specialty)} · Age ${a.age} · DOB ${escapeHtml(a.birthday)} · ${a.yearsExperience||0} yrs exp</div>
          <div style="font-size:12.5px;color:rgba(18,32,26,.6);">${escapeHtml(a.university||'—')} · ${a.feeType==='paid' ? ('৳'+a.fee+'/session') : 'Free'}</div>
        </div>
      </div>
      ${a.bio ? `<p style="font-size:13px;color:rgba(18,32,26,.7);margin:10px 0;">${escapeHtml(a.bio)}</p>` : ''}
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:12px;margin:14px 0;">${photosHtml}</div>
      <div style="display:flex;gap:10px;">
        <button class="solid-btn" style="flex:1;" onclick='approveDoctorApplication(${JSON.stringify(a.applicantUid)})'>Approve</button>
        <button class="ghost-btn" style="flex:1;color:var(--barn);" onclick='rejectDoctorApplication(${JSON.stringify(a.applicantUid)})'>Reject</button>
      </div>
    </div>`;
  }));
  wrap.innerHTML = cardsHtml.join('');
}

async function approveDoctorApplication(uid){
  const ok = await showConfirm('Approve this doctor?', "They'll immediately gain access to the doctor tools in Medical and appear in doctor search.");
  if(!ok) return;
  try{
    const appRef = db.collection('doctorApplications').doc(uid);
    const appSnap = await appRef.get();
    const a = appSnap.data();
    const doctorProfile = {
      specialty: a.specialty, feeType: a.feeType, fee: a.fee,
      bio: a.bio, yearsExperience: a.yearsExperience, university: a.university,
      status: 'offline'
    };
    await db.collection('users').doc(uid).set({isDoctor:true, doctorProfile}, {merge:true});
    await appRef.update({status:'approved', reviewedAt: firebase.firestore.FieldValue.serverTimestamp()});
  } catch(err){
    alert('Could not approve: ' + err.message);
  }
}

async function rejectDoctorApplication(uid){
  const reason = prompt('Optional: add a short note for the applicant on why this was rejected.') || '';
  const ok = await showConfirm('Reject this application?', 'The applicant will be able to see your note and apply again.');
  if(!ok) return;
  try{
    await db.collection('doctorApplications').doc(uid).update({
      status:'rejected', reviewNote: reason, reviewedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch(err){
    alert('Could not reject: ' + err.message);
  }
}


/* ---- booking modal ---- */
function openBookModal(doctorUid){
  bookingDoctor = cachedDoctors.find(d=>d.uid===doctorUid);
  if(!bookingDoctor) return;
  if(!cachedAnimals.length){
    alert('Please add an animal ID first, from the "My Animals" tab.');
    return;
  }
  document.getElementById('bookDoctorName').textContent = bookingDoctor.name || 'this doctor';
  const sel = document.getElementById('bookAnimalSelect');
  sel.innerHTML = cachedAnimals.map(a=>`<option value="${a.id}">${escapeHtml(a.name)} (${escapeHtml(a.animalId)})</option>`).join('');
  setBookMode('text');
  setBookWhen('now');
  document.getElementById('bookNote').value='';
  const dp = bookingDoctor.doctorProfile||{};
  document.getElementById('bookFeeNote').textContent = dp.feeType==='paid'
    ? ('This doctor charges ৳'+(dp.fee||0)+' per consultation.')
    : 'This doctor offers free consultations.';
  document.getElementById('bookError').style.display='none';
  document.getElementById('bookModalOverlay').style.display='flex';
}
function closeBookModal(){
  document.getElementById('bookModalOverlay').style.display='none';
  bookingDoctor = null;
}
function setBookMode(mode){
  bookMode = mode;
  ['Text','Voice','Video'].forEach(m=>{
    document.getElementById('bookMode'+m).classList.toggle('on', m.toLowerCase()===mode);
  });
}
function setBookWhen(when){
  bookWhen = when;
  document.getElementById('bookWhenNow').classList.toggle('on', when==='now');
  document.getElementById('bookWhenLater').classList.toggle('on', when==='later');
  document.getElementById('bookScheduleWrap').style.display = when==='later' ? 'block' : 'none';
}

function submitBooking(){
  const errEl = document.getElementById('bookError');
  errEl.style.display='none';
  if(!bookingDoctor) return;
  const animalDocId = document.getElementById('bookAnimalSelect').value;
  const animal = cachedAnimals.find(a=>a.id===animalDocId);
  if(!animal){ errEl.textContent='Please select an animal.'; errEl.style.display='block'; return; }
  let scheduledAt = null;
  if(bookWhen==='later'){
    const raw = document.getElementById('bookScheduleTime').value;
    if(!raw){ errEl.textContent='Please pick a time.'; errEl.style.display='block'; return; }
    scheduledAt = firebase.firestore.Timestamp.fromDate(new Date(raw));
  }
  const note = document.getElementById('bookNote').value.trim();
  const dp = bookingDoctor.doctorProfile||{};
  const appt = {
    userUid: currentUser.uid, userName: currentProfile.name,
    doctorUid: bookingDoctor.uid, doctorName: bookingDoctor.name,
    animalDocId: animal.id, animalId: animal.animalId, animalName: animal.name, animalSpecies: animal.species,
    mode: bookMode, requestedWhen: bookWhen, scheduledAt,
    note, feeType: dp.feeType||'free', fee: dp.fee||0,
    status: 'pending', createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  db.collection('medAppointments').add(appt).then(ref=>{
    if(note){
      ref.collection('messages').add({from: currentUser.uid, type:'text', text: note, at: firebase.firestore.FieldValue.serverTimestamp()});
    }
    closeBookModal();
    openMedRoom(ref.id);
  }).catch(err=>{ errEl.textContent = err.message; errEl.style.display='block'; });
}

/* ---- farmer appointments ---- */
function attachFarmerApptsListener(){
  if(unsubFarmerAppts) unsubFarmerAppts();
  unsubFarmerAppts = db.collection('medAppointments').where('userUid','==',currentUser.uid)
    .orderBy('createdAt','desc')
    .onSnapshot(snap=>{
      cachedFarmerAppts = snap.docs.map(d=>({id:d.id, ...d.data()}));
      renderFarmerApptList();
    }, err=>{
      console.warn('Appointments listener error:', err);
      document.getElementById('apptListWrap').innerHTML = `<div class="empty-state">Could not load appointments: ${escapeHtml(err.message)}</div>`;
    });
}

let cachedMyReviewedApptIds = new Set();

function renderFarmerApptList(){
  const wrap = document.getElementById('apptListWrap');
  if(!cachedFarmerAppts.length){
    wrap.innerHTML = `<div class="empty-state">No appointments yet. Find a doctor to get started.</div>`;
    return;
  }
  wrap.innerHTML = cachedFarmerAppts.map(a=>{
    const canReview = a.status==='completed' && !cachedMyReviewedApptIds.has(a.id);
    return `
    <div class="card appt-card">
      <div onclick="openMedRoom('${a.id}')" style="cursor:pointer;">
        <div class="ac-body">
          <h4>${escapeHtml(a.doctorName||'Doctor')}</h4>
          <p>${escapeHtml(a.animalName||'')} (${escapeHtml(a.animalId||'')}) · ${escapeHtml(a.mode)} · ${a.scheduledAt ? fmtWhen(a.scheduledAt) : 'ASAP'}</p>
        </div>
        <span class="badge-severity ${statusSevClass(a.status)}">${statusLabel(a.status)}</span>
      </div>
      ${canReview ? `<button class="ghost-btn" style="margin-top:10px;" onclick='event.stopPropagation(); openReviewModal(${JSON.stringify(a.id)}, ${JSON.stringify(a.doctorUid)}, ${JSON.stringify(a.doctorName||"the doctor")})'>Leave feedback</button>` : ''}
      ${a.status==='completed' && cachedMyReviewedApptIds.has(a.id) ? `<div style="font-size:11.5px;color:rgba(18,32,26,.45);margin-top:8px;">Feedback sent — thank you</div>` : ''}
    </div>`;
  }).join('');
  db.collection('doctorReviews').where('farmerUid','==',currentUser.uid).get().then(snap=>{
    cachedMyReviewedApptIds = new Set(snap.docs.map(d=>d.data().appointmentId));
  }).catch(()=>{});
}

/* ---- leave feedback / review modal ---- */
let rvApptId = null, rvDoctorUid = null, rvRating = 0, rvTagsSelected = new Set();

function openReviewModal(apptId, doctorUid, doctorName){
  rvApptId = apptId; rvDoctorUid = doctorUid; rvRating = 0; rvTagsSelected = new Set();
  document.getElementById('rvDoctorName').textContent = doctorName || 'the doctor';
  document.getElementById('rvDoctorAvatar').textContent = (doctorName||'?').charAt(0).toUpperCase();
  document.getElementById('rvText').value = '';
  document.getElementById('rvError').style.display='none';
  document.querySelectorAll('#starPicker svg').forEach(s=>s.classList.remove('on'));
  document.querySelectorAll('.rv-tag').forEach(t=>t.classList.remove('on'));
  document.getElementById('reviewModalOverlay').style.display='flex';
}
function closeReviewModal(){
  document.getElementById('reviewModalOverlay').style.display='none';
}
document.querySelectorAll('#starPicker svg').forEach(star=>{
  star.addEventListener('click', ()=>{
    rvRating = parseInt(star.dataset.star,10);
    document.querySelectorAll('#starPicker svg').forEach(s=>{
      s.classList.toggle('on', parseInt(s.dataset.star,10) <= rvRating);
    });
  });
});
document.querySelectorAll('.rv-tag').forEach(tag=>{
  tag.addEventListener('click', ()=>{
    const t = tag.dataset.tag;
    if(rvTagsSelected.has(t)){ rvTagsSelected.delete(t); tag.classList.remove('on'); }
    else { rvTagsSelected.add(t); tag.classList.add('on'); }
  });
});
function submitDoctorReview(){
  const errEl = document.getElementById('rvError');
  errEl.style.display='none';
  if(!rvRating){ errEl.textContent='Please select a star rating.'; errEl.style.display='block'; return; }
  const text = document.getElementById('rvText').value.trim();
  const review = {
    doctorUid: rvDoctorUid, farmerUid: currentUser.uid, farmerName: currentProfile.name,
    rating: rvRating, tags: Array.from(rvTagsSelected), text, appointmentId: rvApptId,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  db.collection('doctorReviews').add(review).then(()=>{
    cachedMyReviewedApptIds.add(rvApptId);
    closeReviewModal();
    renderFarmerApptList();
    alert('Thanks — your review has been sent.');
  }).catch(err=>{
    errEl.textContent = err.message;
    errEl.style.display='block';
  });
}

/* ---- prescriptions (farmer) ---- */
function attachRxListener(){
  if(unsubRx) unsubRx();
  unsubRx = db.collection('prescriptions').where('userUid','==',currentUser.uid)
    .orderBy('createdAt','desc')
    .onSnapshot(snap=>{
      cachedRx = snap.docs.map(d=>({id:d.id, ...d.data()}));
      renderRxList();
    }, err=>{
      console.warn('Prescriptions listener error:', err);
      document.getElementById('rxListWrap').innerHTML = `<div class="empty-state">Could not load prescriptions: ${escapeHtml(err.message)}</div>`;
    });
}
function renderRxList(){
  const wrap = document.getElementById('rxListWrap');
  if(!cachedRx.length){
    wrap.innerHTML = `<div class="empty-state">No prescriptions yet.</div>`;
    return;
  }
  wrap.innerHTML = cachedRx.map(rxCardHTML).join('');
}
function rxCardHTML(rx){
  return `
    <div class="card rx-card">
      <h4>${escapeHtml(rx.animalName||'')} <span style="font-weight:400;color:rgba(18,32,26,.5);">· ${escapeHtml(rx.animalId||'')}</span></h4>
      <div class="rx-meta">By ${escapeHtml(rx.doctorName||'Doctor')} · ${rx.createdAt ? fmtWhen(rx.createdAt) : ''}</div>
      ${(rx.medicines||[]).map(m=>`
        <div class="rx-med-row">
          <span class="rmed-name">${escapeHtml(m.name)}</span>
          <span class="rmed-detail">${escapeHtml(m.dosage||'')}<br>${escapeHtml(m.frequency||'')}${m.duration ? ' · '+escapeHtml(m.duration) : ''}</span>
        </div>
      `).join('')}
      ${rx.notes ? `<div class="rx-notes">${escapeHtml(rx.notes)}</div>` : ''}
    </div>
  `;
}

/* ---- doctor requests / appointments ---- */
function attachDoctorRequestsListener(){
  if(unsubDocRequests) unsubDocRequests();
  unsubDocRequests = db.collection('medAppointments')
    .where('doctorUid','==',currentUser.uid).where('status','==','pending')
    .orderBy('createdAt','desc')
    .onSnapshot(snap=>{
      cachedDocRequests = snap.docs.map(d=>({id:d.id, ...d.data()}));
      renderDocRequests();
    }, err=>{
      console.warn('Requests listener error:', err);
      document.getElementById('docRequestsWrap').innerHTML = `<div class="empty-state">Could not load requests: ${escapeHtml(err.message)}</div>`;
    });
}
function renderDocRequests(){
  const wrap = document.getElementById('docRequestsWrap');
  if(!cachedDocRequests.length){
    wrap.innerHTML = `<div class="empty-state">No pending requests right now.</div>`;
    return;
  }
  wrap.innerHTML = cachedDocRequests.map(a=>`
    <div class="card appt-card" onclick="openMedRoom('${a.id}')">
      <div class="ac-body">
        <h4>${escapeHtml(a.userName||'Farmer')}</h4>
        <p>${escapeHtml(a.animalName||'')} (${escapeHtml(a.animalId||'')}, ${escapeHtml(a.animalSpecies||'')}) · ${escapeHtml(a.mode)} · ${a.scheduledAt ? fmtWhen(a.scheduledAt) : 'ASAP'}</p>
      </div>
      <span class="badge-severity sev-med">New</span>
    </div>
  `).join('');
}

function attachDoctorApptsListener(){
  if(unsubDocAppts) unsubDocAppts();
  unsubDocAppts = db.collection('medAppointments')
    .where('doctorUid','==',currentUser.uid).where('status','in',['accepted','completed'])
    .orderBy('createdAt','desc')
    .onSnapshot(snap=>{
      cachedDocAppts = snap.docs.map(d=>({id:d.id, ...d.data()}));
      renderDocAppts();
    }, err=>{
      console.warn('Doctor appointments listener error:', err);
      document.getElementById('docApptListWrap').innerHTML = `<div class="empty-state">Could not load appointments: ${escapeHtml(err.message)}</div>`;
    });
}
function renderDocAppts(){
  const wrap = document.getElementById('docApptListWrap');
  if(!cachedDocAppts.length){
    wrap.innerHTML = `<div class="empty-state">No appointments yet.</div>`;
    return;
  }
  wrap.innerHTML = cachedDocAppts.map(a=>`
    <div class="card appt-card" onclick="openMedRoom('${a.id}')">
      <div class="ac-body">
        <h4>${escapeHtml(a.userName||'Farmer')}</h4>
        <p>${escapeHtml(a.animalName||'')} (${escapeHtml(a.animalId||'')}) · ${escapeHtml(a.mode)} · ${a.scheduledAt ? fmtWhen(a.scheduledAt) : 'ASAP'}</p>
      </div>
      <span class="badge-severity ${statusSevClass(a.status)}">${statusLabel(a.status)}</span>
    </div>
  `).join('');
}

/* ---- consultation room ---- */
function openMedRoom(apptId){
  currentRoomApptId = apptId;
  document.getElementById('medRoom').style.display='block';
  document.getElementById('medFarmerView').style.display = 'none';
  document.getElementById('medDoctorView').style.display = 'none';
  document.getElementById('prescriptionForm').style.display='none';
  window.scrollTo({top:0, behavior:'smooth'});

  if(unsubRoomAppt) unsubRoomAppt();
  unsubRoomAppt = db.collection('medAppointments').doc(apptId).onSnapshot(doc=>{
    if(!doc.exists) return;
    currentRoomAppt = {id:doc.id, ...doc.data()};
    renderRoomHeader();
  });

  if(unsubRoomMessages) unsubRoomMessages();
  unsubRoomMessages = db.collection('medAppointments').doc(apptId).collection('messages').orderBy('at','asc')
    .onSnapshot(snap=>{
      renderRoomThread(snap.docs.map(d=>({id:d.id, ...d.data()})));
    });

  if(unsubCallWatch) unsubCallWatch();
  unsubCallWatch = db.collection('medAppointments').doc(apptId).collection('call').doc('session').onSnapshot(doc=>{
    const data = doc.data();
    const banner = document.getElementById('incomingCallBanner');
    if(!data || !data.active){
      if(banner) banner.style.display='none';
      return;
    }
    if(!callIsCaller && data.callerUid !== currentUser.uid && !pc){
      if(banner){
        banner.querySelector('.ic-text').textContent = `Incoming ${data.mode} call…`;
        banner.style.display='flex';
      }
    }
  });
}

function closeMedRoom(){
  if(pc) endCall();
  document.getElementById('medRoom').style.display='none';
  if(unsubRoomAppt){ unsubRoomAppt(); unsubRoomAppt=null; }
  if(unsubRoomMessages){ unsubRoomMessages(); unsubRoomMessages=null; }
  if(unsubCallWatch){ unsubCallWatch(); unsubCallWatch=null; }
  document.getElementById('incomingCallBanner').style.display='none';
  currentRoomApptId = null; currentRoomAppt = null;
  const isDoctor = !!currentProfile.doctorProfile;
  document.getElementById('medFarmerView').style.display = isDoctor ? 'none' : 'block';
  document.getElementById('medDoctorView').style.display = isDoctor ? 'block' : 'none';
}

function renderRoomHeader(){
  const a = currentRoomAppt;
  if(!a) return;
  const isDoctor = a.doctorUid === currentUser.uid;
  const partnerName = isDoctor ? a.userName : a.doctorName;
  document.getElementById('roomAvatar').textContent = (partnerName||'?').charAt(0).toUpperCase();
  document.getElementById('roomPartnerName').textContent = partnerName || '—';
  document.getElementById('roomAnimalLine').textContent = `${a.animalName||''} (${a.animalId||''}, ${a.animalSpecies||''}) · ${a.mode}${a.scheduledAt ? ' · '+fmtWhen(a.scheduledAt) : ''}`;
  const badge = document.getElementById('roomStatusBadge');
  badge.className = 'badge-severity ' + statusSevClass(a.status);
  badge.textContent = statusLabel(a.status);

  const pendingNote = document.getElementById('roomPendingNote');
  const acceptBar = document.getElementById('roomAcceptDeclineBar');
  const toolbar = document.getElementById('roomToolbar');
  const doctorActions = document.getElementById('roomDoctorActions');

  if(a.status==='pending'){
    if(isDoctor){
      pendingNote.style.display='none';
      acceptBar.style.display='flex';
    } else {
      pendingNote.style.display='block';
      pendingNote.textContent = 'Waiting for the doctor to accept your request…';
      acceptBar.style.display='none';
    }
    toolbar.style.display = 'none';
    doctorActions.style.display = 'none';
  } else if(a.status==='declined'){
    pendingNote.style.display='block';
    pendingNote.textContent = 'This request was declined.';
    acceptBar.style.display='none';
    toolbar.style.display='none';
    doctorActions.style.display='none';
  } else {
    pendingNote.style.display='none';
    acceptBar.style.display='none';
    toolbar.style.display='flex';
    doctorActions.style.display = (isDoctor && a.status==='accepted') ? 'block' : 'none';
  }
}

function respondToAppointment(accept){
  if(!currentRoomApptId) return;
  const updates = {status: accept ? 'accepted' : 'declined'};
  const timeRaw = document.getElementById('roomAcceptTime').value;
  if(accept && timeRaw){
    updates.scheduledAt = firebase.firestore.Timestamp.fromDate(new Date(timeRaw));
  }
  db.collection('medAppointments').doc(currentRoomApptId).update(updates).then(()=>{
    db.collection('medAppointments').doc(currentRoomApptId).collection('messages').add({
      from:'system', type:'system',
      text: accept ? 'The doctor accepted this appointment.' : 'The doctor declined this appointment.',
      at: firebase.firestore.FieldValue.serverTimestamp()
    });
  }).catch(err=>alert(err.message));
}

function markAppointmentCompleted(){
  if(!currentRoomApptId) return;
  db.collection('medAppointments').doc(currentRoomApptId).update({status:'completed'}).catch(err=>alert(err.message));
}

function renderRoomThread(messages){
  const wrap = document.getElementById('roomThread');
  wrap.innerHTML = messages.map(m=>roomMsgHTML(m)).join('');
  wrap.scrollTop = wrap.scrollHeight;
}

function roomMsgHTML(m){
  if(m.type==='system'){
    return `<div class="msg system">${escapeHtml(m.text||'')}</div>`;
  }
  const mine = m.from === currentUser.uid;
  const cls = 'msg ' + (mine ? 'mine' : 'theirs');
  if(m.type==='text'){
    return `<div class="${cls}">${escapeHtml(m.text||'')}</div>`;
  }
  if(m.type==='image'){
    return `<div class="${cls}"><img src="${m.url}" alt="Photo"></div>`;
  }
  if(m.type==='clip'){
    const isVideo = m.clipType!=='audio';
    return `<div class="${cls}"><div class="clip-label">${m.duration||0}s ${isVideo?'video':'voice'} clip</div>${isVideo ? `<video src="${m.url}" controls></video>` : `<audio src="${m.url}" controls></audio>`}</div>`;
  }
  if(m.type==='prescription'){
    return `<div class="msg rx-msg"><h4><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px;"><path d="M19 14c1.5-2 1.5-4.5 1.5-4.5A5.5 5.5 0 0 0 15 4a5.5 5.5 0 0 0-5.5 5.5S9.5 12 8 14"/><path d="M8 14a5.5 5.5 0 0 0 0 8 5.5 5.5 0 0 0 8-8l-4-4"/><circle cx="18" cy="7" r="1"/></svg>Prescription</h4>${(m.medicines||[]).map(med=>`
      <div class="rx-med-row"><span class="rmed-name">${escapeHtml(med.name)}</span><span class="rmed-detail">${escapeHtml(med.dosage||'')}<br>${escapeHtml(med.frequency||'')}${med.duration?' · '+escapeHtml(med.duration):''}</span></div>
    `).join('')}${m.notes ? `<div class="rx-notes">${escapeHtml(m.notes)}</div>` : ''}</div>`;
  }
  return '';
}

function sendTextMessage(){
  const input = document.getElementById('roomMsgInput');
  const text = input.value.trim();
  if(!text || !currentRoomApptId) return;
  db.collection('medAppointments').doc(currentRoomApptId).collection('messages').add({
    from: currentUser.uid, type:'text', text, at: firebase.firestore.FieldValue.serverTimestamp()
  });
  input.value='';
}
document.addEventListener('keydown', e=>{
  if(e.key==='Enter' && document.activeElement && document.activeElement.id==='roomMsgInput'){
    sendTextMessage();
  }
});

function sendImageMessage(file){
  alert('Photo sharing is turned off for now (needs Firebase Storage, which requires a paid plan). Use text or a call instead.');
  return;
  // eslint-disable-next-line no-unreachable
  if(!file || !currentRoomApptId) return;
  const path = `medical/${currentRoomApptId}/${Date.now()}_${file.name}`;
  const ref = storage.ref(path);
  ref.put(file).then(snap=>snap.ref.getDownloadURL()).then(url=>{
    return db.collection('medAppointments').doc(currentRoomApptId).collection('messages').add({
      from: currentUser.uid, type:'image', url, at: firebase.firestore.FieldValue.serverTimestamp()
    });
  }).catch(err=>alert('Could not upload photo: '+err.message));
  document.getElementById('roomImgInput').value='';
}

/* ---- 10-60s clip recording (video, falls back to audio-only) ---- */
function toggleClipRecording(){
  if(mediaRecorder && mediaRecorder.state==='recording'){
    stopClipRecording();
  } else {
    startClipRecording();
  }
}

async function startClipRecording(){
  alert('Voice/video clips are turned off for now (needs Firebase Storage, which requires a paid plan). Use a call instead.');
  return;
  // eslint-disable-next-line no-unreachable
  if(!currentRoomApptId) return;
  try{
    recordStream = await navigator.mediaDevices.getUserMedia({video:true, audio:true});
    recordKind = 'video';
  } catch(e){
    try{
      recordStream = await navigator.mediaDevices.getUserMedia({audio:true});
      recordKind = 'audio';
    } catch(e2){
      alert('Camera/microphone permission is needed to record a clip.');
      return;
    }
  }
  recordedChunks = [];
  mediaRecorder = new MediaRecorder(recordStream);
  mediaRecorder.ondataavailable = e=>{ if(e.data.size>0) recordedChunks.push(e.data); };
  mediaRecorder.onstop = ()=>{
    recordStream.getTracks().forEach(t=>t.stop());
    const blob = new Blob(recordedChunks, {type: recordKind==='video' ? 'video/webm' : 'audio/webm'});
    const finalSeconds = recordSeconds;
    if(finalSeconds < 10){
      alert('Clips must be at least 10 seconds. Please try again.');
    } else {
      uploadClip(blob, finalSeconds, recordKind);
    }
    recordSeconds = 0;
    document.getElementById('clipRecordBar').style.display='none';
    document.getElementById('roomRecordBtn').classList.remove('recording');
    clearInterval(recordTimerHandle);
  };
  mediaRecorder.start();
  recordSeconds = 0;
  document.getElementById('clipTimer').textContent = '0';
  document.getElementById('clipRecordBar').style.display='flex';
  document.getElementById('roomRecordBtn').classList.add('recording');
  recordTimerHandle = setInterval(()=>{
    recordSeconds++;
    document.getElementById('clipTimer').textContent = recordSeconds;
    if(recordSeconds>=60) stopClipRecording();
  }, 1000);
}

function stopClipRecording(){
  if(mediaRecorder && mediaRecorder.state==='recording'){
    mediaRecorder.stop();
  }
}

function uploadClip(blob, duration, kind){
  const path = `medical/${currentRoomApptId}/clip_${Date.now()}.webm`;
  const ref = storage.ref(path);
  ref.put(blob).then(snap=>snap.ref.getDownloadURL()).then(url=>{
    return db.collection('medAppointments').doc(currentRoomApptId).collection('messages').add({
      from: currentUser.uid, type:'clip', clipType: kind, url, duration, at: firebase.firestore.FieldValue.serverTimestamp()
    });
  }).catch(err=>alert('Could not upload clip: '+err.message));
}

/* ---- prescriptions (doctor writes) ---- */
function openPrescriptionForm(){
  document.getElementById('prescriptionForm').style.display='block';
  document.getElementById('rxMedsWrap').innerHTML='';
  rxMedCount = 0;
  addRxMedRow();
  document.getElementById('rxNotes').value='';
  document.getElementById('rxError').style.display='none';
}

function addRxMedRow(){
  rxMedCount++;
  const div = document.createElement('div');
  div.className='form-grid';
  div.style.marginBottom='6px';
  div.innerHTML = `
    <div class="field"><label>Medicine name</label><input type="text" class="rx-name" placeholder="e.g. Amprolium"></div>
    <div class="field"><label>Dosage</label><input type="text" class="rx-dosage" placeholder="e.g. 1 tablet"></div>
    <div class="field"><label>When to take</label><input type="text" class="rx-frequency" placeholder="e.g. Twice daily, morning &amp; night"></div>
    <div class="field"><label>Duration</label><input type="text" class="rx-duration" placeholder="e.g. 5 days"></div>
  `;
  document.getElementById('rxMedsWrap').appendChild(div);
}

function sendPrescription(){
  const errEl = document.getElementById('rxError');
  errEl.style.display='none';
  if(!currentRoomAppt || !currentRoomApptId) return;
  const rows = document.querySelectorAll('#rxMedsWrap > div');
  const medicines = [];
  rows.forEach(row=>{
    const name = row.querySelector('.rx-name').value.trim();
    if(!name) return;
    medicines.push({
      name,
      dosage: row.querySelector('.rx-dosage').value.trim(),
      frequency: row.querySelector('.rx-frequency').value.trim(),
      duration: row.querySelector('.rx-duration').value.trim()
    });
  });
  if(!medicines.length){
    errEl.textContent = 'Please add at least one medicine.';
    errEl.style.display='block';
    return;
  }
  const notes = document.getElementById('rxNotes').value.trim();
  const a = currentRoomAppt;
  const rx = {
    appointmentId: currentRoomApptId, doctorUid: currentUser.uid, doctorName: currentProfile.name,
    userUid: a.userUid, animalDocId: a.animalDocId, animalId: a.animalId, animalName: a.animalName,
    medicines, notes, createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  db.collection('prescriptions').add(rx).then(()=>{
    return db.collection('medAppointments').doc(currentRoomApptId).collection('messages').add({
      from: currentUser.uid, type:'prescription', medicines, notes, at: firebase.firestore.FieldValue.serverTimestamp()
    });
  }).then(()=>{
    document.getElementById('prescriptionForm').style.display='none';
  }).catch(err=>{ errEl.textContent = err.message; errEl.style.display='block'; });
}

/* ---- WebRTC voice / video calls, signaled through Firestore ---- */
function setupPeerConnection(){
  pc = new RTCPeerConnection(RTC_CONFIG);
  pc.ontrack = e=>{
    document.getElementById('remoteVideo').srcObject = e.streams[0];
  };
  pc.oniceconnectionstatechange = ()=>{
    if(!pc) return;
    const state = pc.iceConnectionState;
    if(state==='connected' || state==='completed'){
      clearTimeout(callTimeoutHandle);
      document.getElementById('callStatusText').textContent = 'Connected';
    } else if(state==='failed' || state==='disconnected'){
      document.getElementById('callStatusText').textContent = 'Connection lost — ending call';
      setTimeout(()=>{ if(pc) endCall(); }, 1500);
    }
  };
  clearTimeout(callTimeoutHandle);
  callTimeoutHandle = setTimeout(()=>{
    if(pc && pc.iceConnectionState!=='connected' && pc.iceConnectionState!=='completed'){
      alert("Couldn't connect the call — this can happen on some mobile networks. Please try again, or use text chat instead.");
      endCall();
    }
  }, 25000);
}

async function startCall(mode){
  if(!currentRoomApptId) return;
  callMode = mode;
  callIsCaller = true;
  setupPeerConnection();
  try{
    localStream = await navigator.mediaDevices.getUserMedia({video: mode==='video', audio:true});
  } catch(e){
    alert('Camera/microphone permission is needed to call.');
    pc.close(); pc=null;
    return;
  }
  document.getElementById('localVideo').srcObject = localStream;
  document.getElementById('localVideo').style.display = mode==='video' ? 'block':'none';
  localStream.getTracks().forEach(t=>pc.addTrack(t, localStream));
  document.getElementById('callOverlay').style.display='flex';
  document.getElementById('callStatusText').textContent = 'Calling…';

  const sessionRef = db.collection('medAppointments').doc(currentRoomApptId).collection('call').doc('session');
  const callerCands = sessionRef.collection('callerCandidates');
  const calleeCandsCleanup = sessionRef.collection('calleeCandidates');
  /* clear leftover ICE candidates from any earlier call in this same appointment */
  Promise.all([
    callerCands.get().then(s=>Promise.all(s.docs.map(d=>d.ref.delete()))),
    calleeCandsCleanup.get().then(s=>Promise.all(s.docs.map(d=>d.ref.delete())))
  ]).catch(()=>{});
  pc.onicecandidate = e=>{
    if(e.candidate) callerCands.add(e.candidate.toJSON());
  };
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await sessionRef.set({
    offer: {type: offer.type, sdp: offer.sdp}, callerUid: currentUser.uid, mode, active:true,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  callSessionUnsub = sessionRef.onSnapshot(doc=>{
    const data = doc.data();
    if(!data) return;
    if(!data.active){ endCall(true); return; }
    if(data.answer && pc && !pc.currentRemoteDescription){
      pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      document.getElementById('callStatusText').textContent = 'Connected';
    }
  });
  callCandUnsub = sessionRef.collection('calleeCandidates').onSnapshot(snap=>{
    snap.docChanges().forEach(change=>{
      if(change.type==='added' && pc){
        pc.addIceCandidate(new RTCIceCandidate(change.doc.data())).catch(()=>{});
      }
    });
  });

  db.collection('medAppointments').doc(currentRoomApptId).collection('messages').add({
    from:'system', type:'system', text: `${currentProfile.name} started a ${mode} call.`,
    at: firebase.firestore.FieldValue.serverTimestamp()
  });
}

async function acceptIncomingCall(){
  document.getElementById('incomingCallBanner').style.display='none';
  if(!currentRoomApptId) return;
  callIsCaller = false;
  const sessionRef = db.collection('medAppointments').doc(currentRoomApptId).collection('call').doc('session');
  const doc = await sessionRef.get();
  const data = doc.data();
  if(!data || !data.offer) return;
  callMode = data.mode;
  setupPeerConnection();
  try{
    localStream = await navigator.mediaDevices.getUserMedia({video: callMode==='video', audio:true});
  } catch(e){
    alert('Camera/microphone permission is needed to answer.');
    pc.close(); pc=null;
    return;
  }
  document.getElementById('localVideo').srcObject = localStream;
  document.getElementById('localVideo').style.display = callMode==='video' ? 'block':'none';
  localStream.getTracks().forEach(t=>pc.addTrack(t, localStream));
  document.getElementById('callOverlay').style.display='flex';
  document.getElementById('callStatusText').textContent = 'Connecting…';

  const calleeCands = sessionRef.collection('calleeCandidates');
  pc.onicecandidate = e=>{ if(e.candidate) calleeCands.add(e.candidate.toJSON()); };

  await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  await sessionRef.update({answer: {type:answer.type, sdp:answer.sdp}});

  callSessionUnsub = sessionRef.onSnapshot(doc2=>{
    const d2 = doc2.data();
    if(d2 && !d2.active) endCall(true);
  });
  callCandUnsub = sessionRef.collection('callerCandidates').onSnapshot(snap=>{
    snap.docChanges().forEach(change=>{
      if(change.type==='added' && pc){
        pc.addIceCandidate(new RTCIceCandidate(change.doc.data())).catch(()=>{});
      }
    });
  });
  document.getElementById('callStatusText').textContent = 'Connected';
}

function declineIncomingCall(){
  document.getElementById('incomingCallBanner').style.display='none';
  if(currentRoomApptId){
    db.collection('medAppointments').doc(currentRoomApptId).collection('call').doc('session').update({active:false}).catch(()=>{});
  }
}

function endCall(remoteEnded){
  clearTimeout(callTimeoutHandle);
  if(currentRoomApptId && !remoteEnded){
    db.collection('medAppointments').doc(currentRoomApptId).collection('call').doc('session').set({active:false}, {merge:true}).catch(()=>{});
  }
  if(localStream){ localStream.getTracks().forEach(t=>t.stop()); localStream=null; }
  if(pc){ pc.close(); pc=null; }
  if(callSessionUnsub){ callSessionUnsub(); callSessionUnsub=null; }
  if(callCandUnsub){ callCandUnsub(); callCandUnsub=null; }
  callIsCaller = false;
  document.getElementById('callOverlay').style.display='none';
  document.getElementById('remoteVideo').srcObject=null;
  document.getElementById('localVideo').srcObject=null;
}

function toggleCallMute(){
  if(!localStream) return;
  const track = localStream.getAudioTracks()[0];
  if(!track) return;
  track.enabled = !track.enabled;
  document.getElementById('callMuteBtn').textContent = track.enabled ? 'Mute' : 'Unmute';
}
function toggleCallCamera(){
  if(!localStream) return;
  const track = localStream.getVideoTracks()[0];
  if(!track) return;
  track.enabled = !track.enabled;
  document.getElementById('callCamBtn').textContent = track.enabled ? 'Camera off' : 'Camera on';
}
