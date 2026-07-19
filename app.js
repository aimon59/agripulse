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



/* ================= NAV ================= */
function showPage(name){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+name).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  const navBtn = document.querySelector('.nav-btn[data-page="'+name+'"]');
  if(navBtn) navBtn.classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
  if(name==='myplans'){
    backToMyPlansList();
  }
  if(name==='profile' || name==='marketplace' || name==='myplans'){
    renderAccountState();
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
    .then(snap=> snap.docs.map(d=>({id:d.id, ...d.data()})))
    .catch(err=>{ console.warn('getAllSavedPlans failed:', err); return []; });
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
  const plans = await getAllSavedPlans();
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
  const [saved, active] = await Promise.all([getAllSavedPlans(), getAllActivePlans()]);
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
  if(unsubListings){ unsubListings(); unsubListings=null; }
  if(unsubConvs){ unsubConvs(); unsubConvs=null; }
  if(unsubMessages){ unsubMessages(); unsubMessages=null; }
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
