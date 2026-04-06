/* ============================================================
   Pokopia 圖鑑 - app.js
   ============================================================ */

// ── 翻譯 ──────────────────────────────────────────────────────
const T = {
  types: {
    normal:'一般', fire:'火', water:'水', grass:'草', electric:'電',
    ice:'冰', fighting:'格鬥', poison:'毒', ground:'地面', flying:'飛行',
    psychic:'超能力', bug:'蟲', rock:'岩石', ghost:'幽靈', dragon:'龍',
    dark:'惡', steel:'鋼', fairy:'妖精'
  },
  specialties: {
    'grow':'栽培','burn':'燃燒','water':'澆水','build':'建設','chop':'砍伐',
    'gather':'採集','gather honey':'採蜜','gather-honey':'採蜜','mine':'採礦',
    'bulldoze':'開墾','crush':'粉碎','explode':'爆破','fly':'飛行','search':'搜索',
    'litter':'撒播','paint':'塗裝','generate':'發電','recycle':'回收','storage':'儲存',
    'collector':'蒐集','hype':'炒熱','appraise':'鑑定','rarify':'精製','trade':'交換',
    'teleport':'傳送','transform':'變身','yawn':'打哈欠','dream island':'夢幻島',
    'dream-island':'夢幻島'
  },
  specialtyImg: {
    'grow':'grow','burn':'burn','water':'water','build':'build','chop':'chop',
    'gather':'gather','gather honey':'gather-honey','gather-honey':'gather-honey',
    'bulldoze':'bulldoze','crush':'crush','explode':'explode','fly':'fly',
    'search':'search','litter':'litter','paint':'paint','generate':'generate',
    'recycle':'recycle','storage':'storage','collector':'collector','hype':'hype',
    'appraise':'appraise','rarify':'rarify','trade':'trade','teleport':'teleport',
    'transform':'transform','yawn':'yawn','dream island':'dream-island',
    'dream-island':'dream-island'
  },
  time: { dawn:'黎明', day:'白天', dusk:'黃昏', night:'夜晚' },
  weather: { sunny:'晴天', cloudy:'陰天', rainy:'雨天' },
  environment: { bright:'明亮', dark:'黑暗', warm:'溫暖', cool:'涼爽', moist:'潮濕', dry:'乾燥' },
  obtain: {
    habitat:'棲息地', craft:'合成', quest:'任務', story:'劇情',
    event:'活動限定', 'dream-island':'夢幻島'
  },
  rarity: { common:'普通', rare:'稀有', 'very-rare':'非常稀有' },
  favorites: {
    // 口味
    'sweet flavors':'甜味','spicy flavors':'辣味','sour flavors':'酸味',
    'bitter flavors':'苦味','dry flavors':'澀味',
    // 氛圍
    'lots of nature':'自然感','lots of water':'水感','lots of fire':'火焰感',
    'lots of dirt':'泥土感','ocean vibes':'海洋感','nice breezes':'微風',
    'spooky stuff':'陰森的東西','gatherings':'聚會','group activities':'團體活動',
    // 材質
    'soft stuff':'柔軟的東西','hard stuff':'堅硬的東西','shiny stuff':'閃亮的東西',
    'wooden stuff':'木製品','metal stuff':'金屬製品','stone stuff':'石製品',
    'glass stuff':'玻璃製品','fabric':'布製品','containers':'容器',
    // 形狀
    'round stuff':'圓形的東西','blocky stuff':'方塊狀','slender objects':'細長的東西',
    'spinning stuff':'旋轉的東西','wobbly stuff':'搖晃的東西','woblly stuff':'搖晃的東西',
    'sharp stuff':'尖銳的東西',
    // 活動
    'exercise':'運動健身','construction':'建設','consturction':'建設',
    'play spaces':'遊樂場','rides':'交通工具','watching stuff':'觀賞用',
    'healing':'治療','cleanliness':'清潔','garbage':'垃圾',
    // 外觀
    'cute stuff':'可愛的東西','pretty flowers':'美麗花朵','colorful stuff':'色彩繽紛',
    'looks like food':'像食物','symbols':'符號','letters and words':'文字',
    'letter and words':'文字','electronics':'電子產品',
    // 其他
    'luxury':'豪華','strange stuff':'奇妙的東西','complicated stuff':'複雜的東西',
    'noisy stuff':'會發聲',
  }
};

const AREAS = [
  { id:'palette-town',      label:'空空鎮',      color:'#4caf50' },
  { id:'withered-wasteland',label:'乾巴巴荒野',  color:'#ff9800' },
  { id:'bleak-beach',       label:'陰沉沉海濱',  color:'#03a9f4' },
  { id:'rocky-ridges',      label:'凸隆隆山地',  color:'#795548' },
  { id:'sparkling-skylands',label:'亮晶晶空島',  color:'#9c27b0' },
];

const TYPE_COLORS = {
  normal:'#9e9e9e',fire:'#ef5350',water:'#42a5f5',grass:'#66bb6a',
  electric:'#ffca28',ice:'#80deea',fighting:'#e57373',poison:'#ab47bc',
  ground:'#a1887f',flying:'#90caf9',psychic:'#f06292',bug:'#aed581',
  rock:'#bcaaa4',ghost:'#7e57c2',dragon:'#5c6bc0',dark:'#546e7a',
  steel:'#78909c',fairy:'#f48fb1'
};

// ── State ────────────────────────────────────────────────────
let ALL = [];
let filtered = [];
let view = 'grid';
const AF = {
  types:new Set(), specialties:new Set(), time:new Set(),
  weather:new Set(), env:new Set(), obtain:new Set(),
  area:new Set(), search:''
};
let ownedSet  = new Set(JSON.parse(localStorage.getItem('owned')  || '[]'));
let areaMap   = JSON.parse(localStorage.getItem('areaMap')   || '{}'); // id → areaId

function saveOwned()  { localStorage.setItem('owned',  JSON.stringify([...ownedSet])); }
function saveAreaMap(){ localStorage.setItem('areaMap', JSON.stringify(areaMap)); }

// ── Init ────────────────────────────────────────────────────
async function init() {
  try {
    const r = await fetch('data/pokemon.json');
    ALL = await r.json();
    buildFilters();
    applyFilters();
    setTimeout(initFilterPanel, 50);
  } catch(e) {
    document.getElementById('pokemonGrid').innerHTML =
      '<div class="empty"><div class="emoji">❌</div><p>無法載入 data/pokemon.json</p></div>';
  }
}

// ── Build filter chips ───────────────────────────────────────
function buildFilters() {
  // Types
  document.getElementById('typeFilter').innerHTML =
    Object.keys(T.types).map(k => `
      <div class="chip${AF.types.has(k)?' active':''}" data-type="${k}" onclick="toggleFilter('types','${k}',this)">
        <img src="images/types/${k}.png" alt="${k}">
        ${T.types[k]}
      </div>`).join('');

  // Specialties
  const specKeys = ['grow','burn','water','build','chop','gather','gather-honey',
    'bulldoze','crush','explode','fly','search','litter','paint','generate',
    'recycle','storage','collector','hype','appraise','rarify','trade',
    'teleport','transform','yawn','dream-island'];
  document.getElementById('specialtyFilter').innerHTML =
    specKeys.map(k => `
      <div class="chip${AF.specialties.has(k)?' active':''}" onclick="toggleFilter('specialties','${k}',this)">
        <img src="images/specialties/${k}.png" alt="${k}" onerror="this.style.display='none'">
        ${T.specialties[k]||k}
      </div>`).join('');

  // Time
  document.getElementById('timeFilter').innerHTML =
    Object.keys(T.time).map(k => `
      <div class="chip${AF.time.has(k)?' active':''}" onclick="toggleFilter('time','${k}',this)">
        <img src="images/time/${k}.svg" alt="${k}">
        ${T.time[k]}
      </div>`).join('');

  // Weather
  document.getElementById('weatherFilter').innerHTML =
    Object.keys(T.weather).map(k => `
      <div class="chip${AF.weather.has(k)?' active':''}" onclick="toggleFilter('weather','${k}',this)">
        <img src="images/weather/${k}.svg" alt="${k}">
        ${T.weather[k]}
      </div>`).join('');

  // Environment
  document.getElementById('envFilter').innerHTML =
    Object.keys(T.environment).map(k => `
      <div class="chip${AF.env.has(k)?' active':''}" onclick="toggleFilter('env','${k}',this)">
        <img src="images/environment/${k}.svg" alt="${k}">
        ${T.environment[k]}
      </div>`).join('');

  // Obtain
  document.getElementById('obtainFilter').innerHTML =
    Object.keys(T.obtain).map(k => `
      <div class="chip${AF.obtain.has(k)?' active':''}" onclick="toggleFilter('obtain','${k}',this)">
        ${T.obtain[k]}
      </div>`).join('');

  // Area
  document.getElementById('areaFilter').innerHTML =
    [{ id:'none', label:'未分配', color:'#546e7a' }, ...AREAS].map(a => `
      <div class="chip${AF.area.has(a.id)?' active':''}" data-area="${a.id}" onclick="toggleFilter('area','${a.id}',this)">
        <span style="width:8px;height:8px;border-radius:50%;background:${a.color};display:inline-block;flex-shrink:0"></span>
        ${a.label}
      </div>`).join('');
}

function toggleFilter(key, val, el) {
  if (AF[key].has(val)) { AF[key].delete(val); el.classList.remove('active'); }
  else                  { AF[key].add(val);    el.classList.add('active'); }
  // 選「活動限定」獲取方式時，自動開啟活動限定顯示
  if (key === 'obtain' && val === 'event' && AF.obtain.has('event')) {
    document.getElementById('showEvent').checked = true;
  }
  applyFilters();
}

// ── Search input ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('searchInput').addEventListener('input', e => {
    AF.search = e.target.value.trim().toLowerCase();
    applyFilters();
  });
  init();
});

// ── Apply filters ────────────────────────────────────────────
function applyFilters() {
  const showEvent    = document.getElementById('showEvent').checked;
  const showOwned    = document.getElementById('showOnlyOwned').checked;

  filtered = ALL.filter(p => {
    if (!showEvent && p.isEvent) return false;
    if (showOwned && !ownedSet.has(p.id)) return false;

    if (AF.search) {
      const q = AF.search;
      if (!p.name.toLowerCase().includes(q) &&
          !String(p.id).includes(q) &&
          !String(p.id).padStart(3,'0').includes(q) &&
          !p.slug.includes(q)) return false;
    }

    const pk = p.pokopia || {};

    if (AF.types.size > 0) {
      if (![...AF.types].some(t => (p.types||[]).includes(t))) return false;
    }
    if (AF.specialties.size > 0) {
      const specs = (pk.specialties||[]).map(s => T.specialtyImg[s]||s);
      if (![...AF.specialties].some(s => specs.includes(s) || (pk.specialties||[]).includes(s))) return false;
    }
    if (AF.time.size > 0) {
      if (![...AF.time].some(t => (pk.timeOfDay||[]).includes(t))) return false;
    }
    if (AF.weather.size > 0) {
      if (![...AF.weather].some(w => (pk.weather||[]).includes(w))) return false;
    }
    if (AF.env.size > 0) {
      if (!AF.env.has(pk.environmentPreference)) return false;
    }
    if (AF.obtain.size > 0) {
      if (!AF.obtain.has(pk.obtainMethod)) return false;
    }
    if (AF.area.size > 0) {
      const pArea = areaMap[p.id] || 'none';
      if (!AF.area.has(pArea)) return false;
    }

    return true;
  });

  renderGrid();
  document.getElementById('resultCount').textContent =
    `顯示 ${filtered.length} / ${ALL.filter(p=>!p.isEvent).length} 隻`;
  document.getElementById('headerStats').textContent = `共 ${ALL.length} 隻`;
}

// ── Render ───────────────────────────────────────────────────
function renderGrid() {
  const grid = document.getElementById('pokemonGrid');
  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty"><div class="emoji">🔍</div><p>找不到符合條件的寶可夢</p></div>';
    return;
  }
  grid.innerHTML = view === 'grid'
    ? filtered.map(renderCard).join('')
    : filtered.map(renderRow).join('');
}

function idStr(p) {
  return p.id > 9999 ? `#${p.id}` : `#${String(p.id).padStart(3,'0')}`;
}

function renderCard(p) {
  const pk    = p.pokopia || {};
  const owned = ownedSet.has(p.id);
  const area  = areaMap[p.id] || '';
  const areaInfo = area ? AREAS.find(a=>a.id===area) : null;

  const typeIcons = (p.types||[]).map(t =>
    `<div class="type-icon" title="${T.types[t]||t}"><img src="images/types/${t}.png" alt="${t}"></div>`
  ).join('');

  const specIcons = (pk.specialties||[]).map(s => {
    const img = T.specialtyImg[s]||s;
    return `<img class="icon-sm" src="images/specialties/${img}.png" alt="${T.specialties[s]||s}" title="${T.specialties[s]||s}" onerror="this.style.display='none'">`;
  }).join('');

  const timeIcons = (pk.timeOfDay||[]).map(t =>
    `<img class="icon-sm" src="images/time/${t}.svg" alt="${t}" title="${T.time[t]||t}">`
  ).join('');

  const weatherIcons = (pk.weather||[]).map(w =>
    `<img class="icon-sm" src="images/weather/${w}.svg" alt="${w}" title="${T.weather[w]||w}">`
  ).join('');

  const envIcon = pk.environmentPreference
    ? `<img class="icon-sm" src="images/environment/${pk.environmentPreference}.svg" alt="${pk.environmentPreference}" title="${T.environment[pk.environmentPreference]||pk.environmentPreference}">`
    : '';

  const habThumbs = (pk.habitats||[]).slice(0,6).map(h =>
    `<div class="hab-thumb" title="${h.name}"><img src="images/habitats/habitat_${h.id}.png" alt="${h.name}" loading="lazy" onerror="this.parentNode.style.display='none'"></div>`
  ).join('');

  const areaOptions = [
    `<option value="">－ 未分配</option>`,
    ...AREAS.map(a => `<option value="${a.id}"${area===a.id?' selected':''}>${a.label}</option>`)
  ].join('');

  return `
    <div class="poke-card${owned?' owned':''}" data-id="${p.id}" onclick="openModal(${p.id})">
      ${p.isEvent ? '<span class="event-badge">活動</span>' : ''}

      <!-- 捕獲按鈕 -->
      <button class="card-ball-btn${owned?' owned':''}" title="${owned?'取消捕獲':'標記捕獲'}"
        onclick="event.stopPropagation();cardToggleOwned(${p.id},this)">
        <div class="ball-icon"></div>
      </button>

      <div class="card-id">${idStr(p)}</div>
      <div class="card-img-wrap">
        <img class="card-img" src="images/pokemon/${p.slug}.png" alt="${p.name}" loading="lazy"
             onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'96\\' height=\\'96\\'><text y=\\'60\\' font-size=\\'48\\' text-anchor=\\'middle\\' x=\\'48\\'>❓</text></svg>'">
      </div>
      <div class="card-name">${p.name}</div>
      <div class="card-types">${typeIcons}</div>
      <div class="card-icons">${specIcons}${timeIcons}${weatherIcons}${envIcon}</div>
      ${habThumbs ? `<div class="card-habitats">${habThumbs}</div>` : ''}

      <!-- 區域下拉 -->
      <select class="card-area-select" onclick="event.stopPropagation()"
        onchange="event.stopPropagation();cardSetArea(${p.id},this)"
        style="${areaInfo ? `border-color:${areaInfo.color};color:${areaInfo.color}` : ''}">
        ${areaOptions}
      </select>
    </div>`;
}

function renderRow(p) {
  const pk    = p.pokopia || {};
  const owned = ownedSet.has(p.id);

  const typeIcons = (p.types||[]).map(t =>
    `<img src="images/types/${t}.png" alt="${T.types[t]||t}" title="${T.types[t]||t}">`
  ).join('');

  const specIcons = (pk.specialties||[]).map(s => {
    const img = T.specialtyImg[s]||s;
    return `<img src="images/specialties/${img}.png" alt="${T.specialties[s]||s}" title="${T.specialties[s]||s}" onerror="this.style.display='none'">`;
  }).join('');

  const habThumbs = (pk.habitats||[]).slice(0,4).map(h =>
    `<img src="images/habitats/habitat_${h.id}.png" title="${h.name}" onerror="this.style.display='none'">`
  ).join('');

  return `
    <div class="poke-row${owned?' owned':''}" data-id="${p.id}" onclick="openModal(${p.id})">
      <div class="row-id">${idStr(p)}</div>
      <img class="row-img" src="images/pokemon/${p.slug}.png" alt="${p.name}" loading="lazy">
      <div>
        <div class="row-name">${p.name}</div>
        <div class="row-icons">${typeIcons}${specIcons}</div>
      </div>
      <div class="row-right">
        <div class="row-habitats">${habThumbs}</div>
      </div>
    </div>`;
}

// ── Filter panel collapse ────────────────────────────────────
let filtersOpen = true;
function toggleFilters() {
  filtersOpen = !filtersOpen;
  const panel = document.getElementById('filtersPanel');
  const btn   = document.getElementById('filterToggleBtn');
  const isMobile = window.innerWidth <= 640;
  if (filtersOpen) {
    // 手機用 CSS 的 max-height: 52vh，桌面用 scrollHeight
    if (!isMobile) panel.style.maxHeight = panel.scrollHeight + 'px';
    else panel.style.maxHeight = '';  // 讓 CSS media query 的 52vh 生效
    panel.classList.remove('collapsed');
    btn.classList.remove('collapsed');
  } else {
    if (!isMobile) panel.style.maxHeight = panel.scrollHeight + 'px';
    requestAnimationFrame(() => {
      panel.classList.add('collapsed');
      btn.classList.add('collapsed');
    });
  }
}
// Set initial max-height after content loads
function initFilterPanel() {
  const panel = document.getElementById('filtersPanel');
  const btn   = document.getElementById('filterToggleBtn');
  if (!panel) return;
  // 手機直式 → 預設收合
  if (window.innerWidth <= 640) {
    filtersOpen = false;
    panel.classList.add('collapsed');
    btn && btn.classList.add('collapsed');
  } else {
    panel.style.maxHeight = panel.scrollHeight + 'px';
  }
}

// ── View toggle ──────────────────────────────────────────────
function setView(v) {
  view = v;
  document.getElementById('btnGrid').classList.toggle('active', v==='grid');
  document.getElementById('btnList').classList.toggle('active', v==='list');
  document.getElementById('pokemonGrid').className = v==='grid' ? 'grid-view' : 'list-view';
  renderGrid();
}

// ── Clear ────────────────────────────────────────────────────
function clearAll() {
  Object.keys(AF).forEach(k => typeof AF[k]==='object' ? AF[k].clear() : AF[k]='');
  document.getElementById('searchInput').value = '';
  document.getElementById('showEvent').checked  = false;
  document.getElementById('showOnlyOwned').checked = false;
  document.querySelectorAll('.chip.active').forEach(c => c.classList.remove('active'));
  applyFilters();
}

// ── Modal ────────────────────────────────────────────────────
function openModal(id) {
  const p = ALL.find(p => p.id === id);
  if (!p) return;
  document.getElementById('modalContent').innerHTML = buildDetail(p);
  document.getElementById('modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(e) {
  if (!e || e.target === document.getElementById('modal')) {
    document.getElementById('modal').classList.remove('open');
    document.body.style.overflow = '';
  }
}

function buildDetail(p) {
  const pk    = p.pokopia || {};
  const owned = ownedSet.has(p.id);
  const curArea = areaMap[p.id] || '';

  // Types
  const types = (p.types||[]).map(t =>
    `<div class="detail-type-badge" style="background:${TYPE_COLORS[t]}"><img src="images/types/${t}.png" alt="${t}">${T.types[t]||t}</div>`
  ).join('');

  // Specialties
  const specs = (pk.specialties||[]).map(s => {
    const img = T.specialtyImg[s]||s;
    return `<div class="i-chip"><img src="images/specialties/${img}.png" alt="${s}" onerror="this.style.display='none'">${T.specialties[s]||s}</div>`;
  }).join('');

  // Time
  const times = (pk.timeOfDay||[]).map(t =>
    `<div class="i-chip"><img src="images/time/${t}.svg" alt="${t}">${T.time[t]||t}</div>`
  ).join('');

  // Weather
  const weathers = (pk.weather||[]).map(w =>
    `<div class="i-chip"><img src="images/weather/${w}.svg" alt="${w}">${T.weather[w]||w}</div>`
  ).join('');

  // Environment
  const env = pk.environmentPreference
    ? `<div class="i-chip"><img src="images/environment/${pk.environmentPreference}.svg" alt="${pk.environmentPreference}">${T.environment[pk.environmentPreference]||pk.environmentPreference}</div>`
    : '–';

  // Habitats
  const habCards = (pk.habitats||[]).map(h => `
    <div class="habitat-card">
      <div class="rarity-bar ${h.rarity}"></div>
      <img src="images/habitats/habitat_${h.id}.png" alt="${h.name}" loading="lazy" onerror="this.style.background='#1e2235';this.style.height='70px'">
      <div class="hab-info">
        <div class="hab-name">${h.name}</div>
        ${h.materials ? `<div class="hab-materials">${h.materials}</div>` : ''}
        <div style="font-size:.6rem;color:var(--text3);margin-top:2px">${T.rarity[h.rarity]||h.rarity}</div>
      </div>
    </div>`).join('');

  // Favorites
  const favs = (pk.favorites||[]).map(f =>
    `<span class="fav-chip">${T.favorites[f]||f}</span>`
  ).join('');

  // Area select
  const areaOptions = [
    `<option value="">– 未分配 –</option>`,
    ...AREAS.map(a => `<option value="${a.id}"${curArea===a.id?' selected':''}>${a.label}</option>`)
  ].join('');

  // Obtain details
  const obtainDetails = pk.obtainDetails
    ? `<div class="obtain-details">💡 ${pk.obtainDetails}</div>` : '';

  return `
    <div class="detail-header">
      <img class="detail-img" src="images/pokemon/${p.slug}.png" alt="${p.name}">
      <div class="detail-id">${idStr(p)}${p.isEvent?` <span style="background:var(--orange);color:#fff;font-size:.6rem;padding:1px 6px;border-radius:5px;margin-left:4px">活動限定</span>`:''}</div>
      <div class="detail-name">${p.name}</div>
      <div class="detail-types">${types}</div>
      ${pk.obtainMethod ? `<div class="detail-obtain">${T.obtain[pk.obtainMethod]||pk.obtainMethod} 獲得</div>` : ''}
      ${obtainDetails}
      <div class="detail-controls">
        <button class="btn-owned${owned?' owned':''}" onclick="toggleOwned(${p.id},this)">
          ${owned ? '✓ 已捕獲' : '＋ 標記捕獲'}
        </button>
        <select class="area-select" onchange="setArea(${p.id},this.value)">
          ${areaOptions}
        </select>
      </div>
    </div>
    <div class="detail-body">

      <div class="d-section">
        <div class="d-section-title">出沒條件</div>
        ${specs ? `<div class="d-row"><span class="d-label">特長</span><span class="d-val">${specs}</span></div>` : ''}
        ${times ? `<div class="d-row"><span class="d-label">時間</span><span class="d-val">${times}</span></div>` : ''}
        ${weathers ? `<div class="d-row"><span class="d-label">天氣</span><span class="d-val">${weathers}</span></div>` : ''}
        <div class="d-row"><span class="d-label">環境</span><span class="d-val">${env}</span></div>
      </div>

      ${habCards ? `
      <div class="d-section">
        <div class="d-section-title">棲息地 &nbsp;
          <span style="font-weight:400;color:var(--text3)">
            <span style="color:#9e9e9e">■</span> 普通 &nbsp;
            <span style="color:#42a5f5">■</span> 稀有 &nbsp;
            <span style="color:#ffd700">■</span> 非常稀有
          </span>
        </div>
        <div class="habitat-grid">${habCards}</div>
      </div>` : ''}

      ${favs ? `
      <div class="d-section">
        <div class="d-section-title">喜好偏好</div>
        <div class="fav-chips">${favs}</div>
      </div>` : ''}

    </div>`;
}

// ── Card-level quick actions ─────────────────────────────────
function cardToggleOwned(id, btn) {
  if (ownedSet.has(id)) { ownedSet.delete(id); } else { ownedSet.add(id); }
  saveOwned();
  const isOwned = ownedSet.has(id);
  // Update card border
  const card = btn.closest('.poke-card');
  if (card) card.classList.toggle('owned', isOwned);
  // Update button state
  btn.classList.toggle('owned', isOwned);
  btn.title = isOwned ? '取消捕獲' : '標記捕獲';
  // Sync modal button if open
  const modalBtn = document.querySelector(`.btn-owned`);
  if (modalBtn && document.getElementById('modal').classList.contains('open')) {
    const modalId = parseInt(document.querySelector('.detail-name')?.closest('.detail-header')
      ?.querySelector('.detail-id')?.textContent?.replace(/[^0-9]/g,''));
    if (modalId === id) {
      modalBtn.classList.toggle('owned', isOwned);
      modalBtn.textContent = isOwned ? '✓ 已捕獲' : '＋ 標記捕獲';
    }
  }
  if (document.getElementById('showOnlyOwned').checked) applyFilters();
}

function cardSetArea(id, select) {
  const areaId = select.value;
  if (areaId) areaMap[id] = areaId;
  else delete areaMap[id];
  saveAreaMap();
  // Update select styling
  const areaInfo = AREAS.find(a => a.id === areaId);
  if (areaInfo) {
    select.style.borderColor = areaInfo.color;
    select.style.color = areaInfo.color;
  } else {
    select.style.borderColor = '';
    select.style.color = '';
  }
  if (AF.area.size > 0) applyFilters();
}

// ── Owned ────────────────────────────────────────────────────
function toggleOwned(id, btn) {
  if (ownedSet.has(id)) {
    ownedSet.delete(id); btn.textContent='＋ 標記捕獲'; btn.classList.remove('owned');
  } else {
    ownedSet.add(id);    btn.textContent='✓ 已捕獲';   btn.classList.add('owned');
  }
  saveOwned();
  document.querySelectorAll(`.poke-card[data-id="${id}"],.poke-row[data-id="${id}"]`)
    .forEach(el => el.classList.toggle('owned', ownedSet.has(id)));
  const card = document.querySelector(`.poke-card[data-id="${id}"]`);
  if (card) {
    const ballBtn = card.querySelector('.card-ball-btn');
    if (ballBtn) {
      ballBtn.classList.toggle('owned', ownedSet.has(id));
      ballBtn.title = ownedSet.has(id) ? '取消捕獲' : '標記捕獲';
    }
  }
  if (document.getElementById('showOnlyOwned').checked) applyFilters();
}

// ── Area assignment ──────────────────────────────────────────
function setArea(id, areaId) {
  if (areaId) areaMap[id] = areaId;
  else delete areaMap[id];
  saveAreaMap();

  // Update card area tag
  const card = document.querySelector(`.poke-card[data-id="${id}"]`);
  if (card) {
    let tag = card.querySelector('.card-area-tag');
    const areaInfo = AREAS.find(a => a.id === areaId);
    if (areaInfo) {
      if (!tag) { tag = document.createElement('div'); tag.className='card-area-tag'; card.appendChild(tag); }
      tag.textContent = areaInfo.label;
      tag.style.background = areaInfo.color;
    } else {
      if (tag) tag.remove();
    }
  }
  if (AF.area.size > 0) applyFilters();
}

// ── Collection Stats ─────────────────────────────────────────
function openCollectionStats() {
  const total    = ALL.filter(p=>!p.isEvent).length;
  const captured = ALL.filter(p=>!p.isEvent && ownedSet.has(p.id)).length;
  const pct      = total > 0 ? Math.round(captured/total*100) : 0;

  const areaStats = AREAS.map(a => {
    const assigned = Object.values(areaMap).filter(v=>v===a.id).length;
    const capturedInArea = ALL.filter(p=>areaMap[p.id]===a.id && ownedSet.has(p.id)).length;
    return { ...a, assigned, capturedInArea };
  });

  document.getElementById('statsContent').innerHTML = `
    <div class="stats-title">📊 收集統計</div>
    <div class="stats-total">
      <div class="big">${captured}<span style="font-size:1rem;color:var(--text2)">/${total}</span></div>
      <div class="label">已捕獲寶可夢<br><span style="color:var(--accent2)">${pct}%</span> 完成度</div>
    </div>
    <div class="progress-bar-wrap">
      <div class="progress-bar" style="width:${pct}%"></div>
    </div>
    <div style="font-size:.75rem;color:var(--text3);margin-bottom:12px">不含活動限定</div>
    <div style="font-size:.78rem;font-weight:700;color:var(--text2);margin-bottom:8px;text-transform:uppercase;letter-spacing:.6px">各區域分配</div>
    <div class="stats-areas">
      ${areaStats.map(a => `
        <div class="area-stat">
          <div class="area-dot" style="background:${a.color}"></div>
          <div class="area-label">${a.label}</div>
          <div class="area-count">${a.capturedInArea}/${a.assigned}</div>
          <div class="area-progress">
            <div class="area-progress-fill" style="width:${a.assigned?Math.round(a.capturedInArea/a.assigned*100):0}%;background:${a.color}"></div>
          </div>
        </div>`).join('')}
      <div class="area-stat">
        <div class="area-dot" style="background:#546e7a"></div>
        <div class="area-label">未分配</div>
        <div class="area-count">${ALL.filter(p=>!p.isEvent&&!areaMap[p.id]).length} 隻</div>
        <div class="area-progress"></div>
      </div>
    </div>`;
  document.getElementById('statsModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeStats(e) {
  if (!e || e.target === document.getElementById('statsModal')) {
    document.getElementById('statsModal').classList.remove('open');
    document.body.style.overflow = '';
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closeStats(); }
});
