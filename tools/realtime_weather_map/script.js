const REFRESH_INTERVAL_MS = 60 * 1000;
const CACHE_TTL_MS = 45 * 1000;
const FETCH_TIMEOUT_MS = 10000;
const DEFAULT_POINT = { lat: 39.9042, lon: 116.4074 };
const LOCALE_OUT_MS = 220;
const LOCALE_IN_MS = 480;

const I18N = {
  zh: {
    pageTitle: "实时天气地图",
    eyebrow: "实时天气",
    heroTitle: "实时天气地图",
    heroSubtitle: "点击地图任意位置查看天气。",
    mapTitle: "地图",
    mapHintIdle: "请选择一个点",
    mapSelected: "已选",
    mapFallback: "备用地图已启用",
    nowTitle: "当前天气",
    latLabel: "纬度",
    lonLabel: "经度",
    timezoneLabel: "时区",
    updatedLabel: "更新时间",
    currentTitle: "实时状况",
    forecastTitle: "24小时预报",
    locateMe: "使用我的位置",
    locating: "定位中",
    refresh: "刷新",
    refreshing: "刷新中",
    waiting: "等待中",
    loading: "加载中",
    live: "实时",
    liveCache: "缓存",
    statusError: "错误",
    noLocation: "请选择地图位置",
    noGeo: "浏览器不支持定位",
    locationBlocked: "定位权限被拒绝",
    autoRefresh: "秒",
    humidity: "湿度",
    feels: "体感",
    wind: "风速",
    direction: "风向",
    rain: "降水",
    cachedSuffix: "（缓存）",
    switchLabel: "切换语言"
  },
  en: {
    pageTitle: "Real-time Weather Map",
    eyebrow: "Live Weather",
    heroTitle: "Real-time Weather Map",
    heroSubtitle: "Tap anywhere on the map.",
    mapTitle: "Map",
    mapHintIdle: "Select a point",
    mapSelected: "Selected",
    mapFallback: "Fallback map in use",
    nowTitle: "Now",
    latLabel: "Latitude",
    lonLabel: "Longitude",
    timezoneLabel: "Timezone",
    updatedLabel: "Updated",
    currentTitle: "Current",
    forecastTitle: "24H Forecast",
    locateMe: "Use My Location",
    locating: "Locating",
    refresh: "Refresh",
    refreshing: "Refreshing",
    waiting: "Waiting",
    loading: "Loading",
    live: "Live",
    liveCache: "Cache",
    statusError: "Error",
    noLocation: "Select a location on map",
    noGeo: "No geolocation support",
    locationBlocked: "Location blocked",
    autoRefresh: "s",
    humidity: "Humidity",
    feels: "Feels",
    wind: "Wind",
    direction: "Direction",
    rain: "Rain",
    cachedSuffix: " (cache)",
    switchLabel: "Switch language"
  }
};

const WEATHER_TEXT = {
  zh: {
    0: ["晴", "晴夜"],
    1: "大部晴朗",
    2: "局部多云",
    3: "阴天",
    45: "有雾",
    48: "霜雾",
    51: "小毛毛雨",
    53: "中等毛毛雨",
    55: "强毛毛雨",
    56: "小冻毛毛雨",
    57: "强冻毛毛雨",
    61: "小雨",
    63: "中雨",
    65: "大雨",
    66: "小冻雨",
    67: "大冻雨",
    71: "小雪",
    73: "中雪",
    75: "大雪",
    77: "米雪",
    80: "小阵雨",
    81: "中阵雨",
    82: "强阵雨",
    85: "小阵雪",
    86: "大阵雪",
    95: "雷暴",
    96: "雷暴夹小冰雹",
    99: "雷暴夹大冰雹"
  },
  en: {
    0: ["Clear sky", "Clear night"],
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
  }
};

const state = {
  locale: localStorage.getItem("weather-lang") === "en" ? "en" : "zh",
  selectedPoint: null,
  nextRefreshAt: Date.now() + REFRESH_INTERVAL_MS,
  loading: false,
  locating: false,
  visible: document.visibilityState === "visible",
  requestController: null,
  weatherCache: new Map(),
  statusType: "pending",
  statusKey: "waiting",
  latestWeather: null,
  localeSwitching: false
};

const ui = {
  eyebrowText: document.getElementById("eyebrowText"),
  heroTitle: document.getElementById("heroTitle"),
  heroSubtitle: document.getElementById("heroSubtitle"),
  langToggle: document.getElementById("langToggle"),
  mapTitle: document.getElementById("mapTitle"),
  mapHint: document.getElementById("mapHint"),
  nowTitle: document.getElementById("nowTitle"),
  forecastTitle: document.getElementById("forecastTitle"),
  latLabel: document.getElementById("latLabel"),
  lonLabel: document.getElementById("lonLabel"),
  timezoneLabel: document.getElementById("timezoneLabel"),
  updatedLabel: document.getElementById("updatedLabel"),
  currentTitle: document.getElementById("currentTitle"),
  statusBadge: document.getElementById("statusBadge"),
  lat: document.getElementById("lat"),
  lon: document.getElementById("lon"),
  timezone: document.getElementById("timezone"),
  updatedAt: document.getElementById("updatedAt"),
  temp: document.getElementById("temp"),
  weatherDesc: document.getElementById("weatherDesc"),
  factsList: document.getElementById("factsList"),
  refreshBtn: document.getElementById("refreshBtn"),
  autoRefresh: document.getElementById("autoRefresh"),
  forecast: document.getElementById("forecast"),
  quickPicks: document.getElementById("quickPicks"),
  locateMeBtn: document.getElementById("locateMeBtn"),
  mapShell: document.querySelector(".map-shell")
};

const panels = Array.from(document.querySelectorAll(".panel"));

const map = L.map("map", {
  zoomControl: true,
  preferCanvas: true,
  worldCopyJump: true
}).setView([DEFAULT_POINT.lat, DEFAULT_POINT.lon], 5);

const mainlandBaseLayer = L.tileLayer(
  "https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}",
  {
    subdomains: ["1", "2", "3", "4"],
    maxZoom: 18,
    attribution: "&copy; Amap",
    updateWhenIdle: true,
    keepBuffer: 2
  }
).addTo(map);

const fallbackLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
  updateWhenIdle: true,
  keepBuffer: 2,
  crossOrigin: true
});

let tileErrorCount = 0;
mainlandBaseLayer.on("tileerror", () => {
  tileErrorCount += 1;
  if (tileErrorCount >= 8 && map.hasLayer(mainlandBaseLayer)) {
    map.removeLayer(mainlandBaseLayer);
    fallbackLayer.addTo(map);
    ui.mapHint.textContent = t("mapFallback");
  }
});

mainlandBaseLayer.on("tileload", () => {
  if (tileErrorCount > 0) {
    tileErrorCount -= 1;
  }
});

const weatherPinIcon = L.divIcon({
  className: "weather-pin-wrapper",
  html: '<span class="liquid-pin"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

const marker = L.marker([DEFAULT_POINT.lat, DEFAULT_POINT.lon], {
  icon: weatherPinIcon,
  keyboard: false
}).addTo(map);

function t(key) {
  return I18N[state.locale][key] || I18N.en[key] || key;
}

function toFixed(value, digits = 4) {
  return Number(value).toFixed(digits);
}

function toCacheKey(lat, lon) {
  return `${Number(lat).toFixed(3)},${Number(lon).toFixed(3)}`;
}

function weatherCodeToText(code, isDay) {
  const table = WEATHER_TEXT[state.locale] || WEATHER_TEXT.en;
  const value = table[code];
  if (!value) {
    return state.locale === "zh" ? "未知天气" : "Unknown weather";
  }
  if (Array.isArray(value)) {
    return isDay ? value[0] : value[1];
  }
  return value;
}

function setThemeByWeather(code, temperature) {
  let rgb = "102, 217, 255";

  if (code >= 61 && code <= 67) {
    rgb = "95, 176, 255";
  } else if (code >= 71 && code <= 77) {
    rgb = "174, 221, 255";
  } else if (code >= 80) {
    rgb = "92, 164, 238";
  } else if (code >= 1 && code <= 3) {
    rgb = "142, 190, 231";
  }

  if (temperature >= 30) {
    rgb = "255, 180, 112";
  } else if (temperature <= 0) {
    rgb = "153, 211, 255";
  }

  document.documentElement.style.setProperty("--weather-glow-rgb", rgb);
}

function setLangButtonState() {
  ui.langToggle.classList.toggle("is-zh", state.locale === "zh");
  ui.langToggle.classList.toggle("is-en", state.locale === "en");
  ui.langToggle.textContent = state.locale === "zh" ? "中 / EN" : "ZH / EN";
  ui.langToggle.setAttribute("aria-label", t("switchLabel"));
  ui.langToggle.setAttribute("title", t("switchLabel"));
}

function updateStatus(type, textKey) {
  state.statusType = type;
  state.statusKey = textKey;
  ui.statusBadge.className = `badge ${type}`;
  ui.statusBadge.textContent = t(textKey);
}

function formatHour(isoText) {
  const date = new Date(isoText);
  return `${String(date.getHours()).padStart(2, "0")}:00`;
}

function animateTempValue(nextValue) {
  ui.temp.classList.add("updating");
  window.setTimeout(() => {
    ui.temp.textContent = nextValue;
    ui.temp.classList.remove("updating");
  }, 130);
}

function renderForecastSkeleton() {
  const skeletonCount = window.innerWidth < 760 ? 6 : 12;
  ui.forecast.innerHTML = Array.from({ length: skeletonCount })
    .map(() => '<article class="forecast-item skeleton"></article>')
    .join("");
}

async function fetchWeather(lat, lon, signal) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m"
    ].join(",")
  );
  url.searchParams.set("hourly", "temperature_2m,weather_code");
  url.searchParams.set("forecast_hours", "24");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    signal,
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Weather API HTTP ${response.status}`);
  }

  return response.json();
}

async function getWeatherData(point, force = false) {
  const key = toCacheKey(point.lat, point.lon);
  const cached = state.weatherCache.get(key);
  const now = Date.now();

  if (!force && cached && now - cached.time < CACHE_TTL_MS) {
    return { payload: cached.payload, fromCache: true };
  }

  if (state.requestController) {
    state.requestController.abort();
  }

  state.requestController = new AbortController();
  const timeoutId = setTimeout(() => state.requestController.abort(), FETCH_TIMEOUT_MS);

  try {
    const payload = await fetchWeather(point.lat, point.lon, state.requestController.signal);
    state.weatherCache.set(key, { payload, time: now });
    return { payload, fromCache: false };
  } finally {
    clearTimeout(timeoutId);
  }
}

function renderForecast(hourly) {
  ui.forecast.innerHTML = "";
  const hours = hourly?.time || [];
  const temps = hourly?.temperature_2m || [];
  const codes = hourly?.weather_code || [];

  if (!hours.length) {
    ui.forecast.innerHTML = '<p class="forecast-item">No hourly data.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();

  for (let i = 0; i < Math.min(hours.length, 24); i += 1) {
    const card = document.createElement("article");
    card.className = "forecast-item";
    card.style.setProperty("--delay", String(i));
    card.innerHTML = `
      <p class="forecast-time">${formatHour(hours[i])}</p>
      <p class="forecast-temp">${temps[i]}°C</p>
      <p>${weatherCodeToText(codes[i], true)}</p>
    `;
    fragment.appendChild(card);
  }

  ui.forecast.appendChild(fragment);
}

function renderWeather(point, payload, fromCache, skipTempAnimation = false) {
  const current = payload.current || {};
  const code = Number(current.weather_code);
  const isDay = Number(current.is_day) === 1;
  const tempNow = current.temperature_2m ?? "--";

  state.latestWeather = { point, payload, fromCache };
  ui.lat.textContent = toFixed(point.lat);
  ui.lon.textContent = toFixed(point.lon);
  ui.timezone.textContent = payload.timezone || "--";
  ui.updatedAt.textContent = `${new Date().toLocaleTimeString()}${fromCache ? t("cachedSuffix") : ""}`;

  if (skipTempAnimation) {
    ui.temp.textContent = tempNow;
  } else {
    animateTempValue(tempNow);
  }

  ui.weatherDesc.textContent = weatherCodeToText(code, isDay);

  ui.factsList.innerHTML = [
    `${t("humidity")} ${current.relative_humidity_2m ?? "--"}%`,
    `${t("feels")} ${current.apparent_temperature ?? "--"}°C`,
    `${t("wind")} ${current.wind_speed_10m ?? "--"} km/h`,
    `${t("direction")} ${current.wind_direction_10m ?? "--"}°`,
    `${t("rain")} ${current.precipitation ?? "--"} mm`
  ]
    .map((text) => `<li>${text}</li>`)
    .join("");

  renderForecast(payload.hourly);
  setThemeByWeather(code, Number(tempNow));
}

function setActiveCityButton(lat, lon) {
  const cityButtons = ui.quickPicks.querySelectorAll(".quick-btn[data-lat][data-lon]");
  cityButtons.forEach((button) => {
    const bLat = Number(button.dataset.lat);
    const bLon = Number(button.dataset.lon);
    const active = Math.abs(bLat - lat) < 0.0001 && Math.abs(bLon - lon) < 0.0001;
    button.classList.toggle("is-active", active);
  });
}

async function refreshSelectedPoint(force = false) {
  if (!state.selectedPoint || state.loading) {
    return;
  }

  state.loading = true;
  ui.refreshBtn.disabled = true;
  ui.refreshBtn.textContent = t("refreshing");
  updateStatus("pending", "loading");
  renderForecastSkeleton();

  try {
    const { payload, fromCache } = await getWeatherData(state.selectedPoint, force);
    renderWeather(state.selectedPoint, payload, fromCache);
    updateStatus("ok", fromCache ? "liveCache" : "live");
    state.nextRefreshAt = Date.now() + REFRESH_INTERVAL_MS;
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }
    updateStatus("error", "statusError");
    ui.weatherDesc.textContent = `${t("statusError")}: ${error.message}`;
  } finally {
    state.loading = false;
    ui.refreshBtn.disabled = false;
    ui.refreshBtn.textContent = t("refresh");
  }
}

function selectPoint(lat, lon, smooth = true) {
  state.selectedPoint = { lat, lon };
  marker.setLatLng([lat, lon]);

  if (smooth) {
    map.flyTo([lat, lon], Math.max(map.getZoom(), 6), {
      duration: 0.85,
      easeLinearity: 0.25
    });
  } else {
    map.panTo([lat, lon]);
  }

  marker.bindPopup(`${toFixed(lat)}<br>${toFixed(lon)}`).openPopup();
  ui.mapHint.textContent = `${t("mapSelected")} ${toFixed(lat)} / ${toFixed(lon)}`;
  ui.mapShell.classList.add("ping");
  setActiveCityButton(lat, lon);
  window.setTimeout(() => ui.mapShell.classList.remove("ping"), 360);
  refreshSelectedPoint();
}

function updateCountdown() {
  const sec = Math.max(0, Math.ceil((state.nextRefreshAt - Date.now()) / 1000));
  ui.autoRefresh.textContent = `${sec}${t("autoRefresh")}`;
}

function applyLocale() {
  document.documentElement.lang = state.locale === "zh" ? "zh-CN" : "en";
  document.title = t("pageTitle");

  ui.eyebrowText.textContent = t("eyebrow");
  ui.heroTitle.textContent = t("heroTitle");
  ui.heroSubtitle.textContent = t("heroSubtitle");
  ui.mapTitle.textContent = t("mapTitle");
  ui.nowTitle.textContent = t("nowTitle");
  ui.latLabel.textContent = t("latLabel");
  ui.lonLabel.textContent = t("lonLabel");
  ui.timezoneLabel.textContent = t("timezoneLabel");
  ui.updatedLabel.textContent = t("updatedLabel");
  ui.currentTitle.textContent = t("currentTitle");
  ui.forecastTitle.textContent = t("forecastTitle");
  ui.locateMeBtn.textContent = state.locating ? t("locating") : t("locateMe");
  ui.refreshBtn.textContent = state.loading ? t("refreshing") : t("refresh");
  ui.mapHint.textContent = state.selectedPoint
    ? `${t("mapSelected")} ${toFixed(state.selectedPoint.lat)} / ${toFixed(state.selectedPoint.lon)}`
    : t("mapHintIdle");

  ui.quickPicks.querySelectorAll(".quick-btn[data-name-zh][data-name-en]").forEach((button) => {
    button.textContent = state.locale === "zh" ? button.dataset.nameZh : button.dataset.nameEn;
  });

  setLangButtonState();
  updateStatus(state.statusType, state.statusKey);
  updateCountdown();

  if (!state.selectedPoint && !state.latestWeather) {
    ui.weatherDesc.textContent = t("noLocation");
  }

  if (state.latestWeather) {
    renderWeather(
      state.latestWeather.point,
      state.latestWeather.payload,
      state.latestWeather.fromCache,
      true
    );
  }
}

function canAnimateLocaleSwitch() {
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    && typeof Element.prototype.animate === "function";
}

function getLocaleTransitionGroups() {
  const groups = [
    [ui.eyebrowText, ui.heroTitle, ui.heroSubtitle],
    [ui.mapTitle, ui.mapHint, ui.nowTitle, ui.forecastTitle, ui.statusBadge],
    [ui.latLabel, ui.lonLabel, ui.timezoneLabel, ui.updatedLabel, ui.currentTitle, ui.weatherDesc, ui.autoRefresh],
    [ui.locateMeBtn, ui.refreshBtn, ...ui.quickPicks.querySelectorAll(".quick-btn")],
    [...ui.factsList.querySelectorAll("li")],
    [...ui.forecast.querySelectorAll(".forecast-item")]
  ];

  return groups
    .map((group) => Array.from(new Set(group.filter(Boolean))))
    .filter((group) => group.length > 0);
}

function animateLocaleGroups(groups, options) {
  const {
    keyframes,
    duration,
    easing,
    groupDelay = 32,
    itemStagger = 12,
    maxItemDelay = 84
  } = options;

  groups.forEach((group, groupIndex) => {
    group.forEach((target, itemIndex) => {
      target.animate(keyframes, {
        duration,
        delay: groupIndex * groupDelay + Math.min(itemIndex * itemStagger, maxItemDelay),
        easing,
        fill: "both"
      });
    });
  });
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function switchLocaleWithTransition() {
  if (state.localeSwitching) {
    return;
  }

  const nextLocale = state.locale === "zh" ? "en" : "zh";

  if (!canAnimateLocaleSwitch()) {
    state.locale = nextLocale;
    localStorage.setItem("weather-lang", state.locale);
    applyLocale();
    return;
  }

  state.localeSwitching = true;
  ui.langToggle.disabled = true;
  document.body.classList.add("locale-switching");

  try {
    const outGroups = getLocaleTransitionGroups();
    animateLocaleGroups(outGroups, {
      keyframes: [
        { opacity: 1, filter: "blur(0px)", transform: "translate3d(0, 0px, 0) scale(1)" },
        { opacity: 0.06, filter: "blur(3px)", transform: "translate3d(0, -7px, 0) scale(0.992)" }
      ],
      duration: LOCALE_OUT_MS,
      easing: "cubic-bezier(0.33, 0, 0.67, 1)",
      groupDelay: 22,
      itemStagger: 8,
      maxItemDelay: 62
    });

    await wait(LOCALE_OUT_MS + 88);

    state.locale = nextLocale;
    localStorage.setItem("weather-lang", state.locale);
    applyLocale();

    const inGroups = getLocaleTransitionGroups();
    animateLocaleGroups(inGroups, {
      keyframes: [
        { opacity: 0, filter: "blur(4px)", transform: "translate3d(0, 9px, 0) scale(0.992)" },
        { opacity: 1, filter: "blur(0px)", transform: "translate3d(0, 0px, 0) scale(1)" }
      ],
      duration: LOCALE_IN_MS,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      groupDelay: 30,
      itemStagger: 12,
      maxItemDelay: 88
    });

    await wait(LOCALE_IN_MS + 190);
  } finally {
    ui.langToggle.disabled = false;
    state.localeSwitching = false;
    document.body.classList.remove("locale-switching");
  }
}

function bindRippleEffect() {
  document.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", (event) => {
      const rect = button.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      button.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 620);
    });
  });
}

function canUseAdvancedHover() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches
    && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function bindMagneticButtons() {
  if (!canUseAdvancedHover()) {
    return;
  }

  const buttons = document.querySelectorAll(".quick-btn, #refreshBtn, .lang-toggle");

  buttons.forEach((button) => {
    let rafId = 0;
    let shiftX = 0;
    let shiftY = 0;

    const update = () => {
      button.style.setProperty("--btn-shift-x", `${shiftX.toFixed(2)}px`);
      button.style.setProperty("--btn-shift-y", `${shiftY.toFixed(2)}px`);
      rafId = 0;
    };

    button.addEventListener("pointermove", (event) => {
      const rect = button.getBoundingClientRect();
      const px = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const py = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      shiftX = px * 4.5;
      shiftY = py * 3.4;

      if (!rafId) {
        rafId = requestAnimationFrame(update);
      }
    });

    button.addEventListener("pointerleave", () => {
      shiftX = 0;
      shiftY = 0;

      if (!rafId) {
        rafId = requestAnimationFrame(update);
      }
    });
  });
}

function bindSurfaceTilt() {
  if (!canUseAdvancedHover()) {
    return;
  }

  const surfaces = [
    ...document.querySelectorAll(".panel"),
    ui.mapShell
  ].filter(Boolean);

  surfaces.forEach((surface) => {
    const isMap = surface === ui.mapShell;
    const propX = isMap ? "--map-tilt-x" : "--panel-tilt-x";
    const propY = isMap ? "--map-tilt-y" : "--panel-tilt-y";
    const maxTilt = isMap ? 1.1 : 3.4;
    let rafId = 0;
    let nextTiltX = 0;
    let nextTiltY = 0;

    const update = () => {
      surface.style.setProperty(propX, `${nextTiltX.toFixed(2)}deg`);
      surface.style.setProperty(propY, `${nextTiltY.toFixed(2)}deg`);
      rafId = 0;
    };

    surface.addEventListener("pointermove", (event) => {
      const rect = surface.getBoundingClientRect();
      const px = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const py = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      nextTiltY = px * maxTilt;
      nextTiltX = -py * maxTilt;

      if (!rafId) {
        rafId = requestAnimationFrame(update);
      }
    });

    surface.addEventListener("pointerleave", () => {
      nextTiltX = 0;
      nextTiltY = 0;

      if (!rafId) {
        rafId = requestAnimationFrame(update);
      }
    });
  });
}

function bindForecastSpotlight() {
  if (!canUseAdvancedHover()) {
    return;
  }

  ui.forecast.addEventListener("pointermove", (event) => {
    const card = event.target.closest(".forecast-item");
    if (!card || card.classList.contains("skeleton")) {
      return;
    }

    const rect = card.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty("--fx", `${x}%`);
    card.style.setProperty("--fy", `${y}%`);
  });
}

function bindPanelReveal() {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  panels.forEach((panel) => io.observe(panel));
}

function bindPointerLight() {
  let rafId = 0;
  let lastX = -999;
  let lastY = -999;

  const scheduleUpdate = () => {
    if (!rafId && lastX > -900 && lastY > -900) {
      rafId = requestAnimationFrame(update);
    }
  };

  const update = () => {
    document.documentElement.style.setProperty("--cursor-x", `${lastX}px`);
    document.documentElement.style.setProperty("--cursor-y", `${lastY}px`);

    panels.forEach((panel) => {
      const rect = panel.getBoundingClientRect();
      const x = ((lastX - rect.left) / rect.width) * 100;
      const y = ((lastY - rect.top) / rect.height) * 100;
      panel.style.setProperty("--light-x", `${x}%`);
      panel.style.setProperty("--light-y", `${y}%`);
    });

    rafId = 0;
  };

  window.addEventListener("pointermove", (event) => {
    lastX = event.clientX;
    lastY = event.clientY;
    scheduleUpdate();
  });

  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate, { passive: true });
  window.addEventListener("wheel", scheduleUpdate, { passive: true });
  window.addEventListener("touchmove", scheduleUpdate, { passive: true });
}

function bindQuickPickEvents() {
  const cityButtons = ui.quickPicks.querySelectorAll(".quick-btn[data-lat][data-lon]");

  cityButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const lat = Number(button.dataset.lat);
      const lon = Number(button.dataset.lon);
      selectPoint(lat, lon, true);
    });
  });

  ui.locateMeBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      ui.weatherDesc.textContent = t("noGeo");
      return;
    }

    state.locating = true;
    ui.locateMeBtn.disabled = true;
    ui.locateMeBtn.textContent = t("locating");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        state.locating = false;
        ui.locateMeBtn.disabled = false;
        ui.locateMeBtn.textContent = t("locateMe");
        selectPoint(pos.coords.latitude, pos.coords.longitude, true);
        setActiveCityButton(-999, -999);
      },
      () => {
        state.locating = false;
        ui.locateMeBtn.disabled = false;
        ui.locateMeBtn.textContent = t("locateMe");
        ui.weatherDesc.textContent = t("locationBlocked");
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 60000 }
    );
  });
}

function bindLanguageToggle() {
  ui.langToggle.addEventListener("click", async () => {
    await switchLocaleWithTransition();
  });
}

function bindEvents() {
  map.on("click", (event) => {
    selectPoint(event.latlng.lat, event.latlng.lng, false);
  });

  ui.refreshBtn.addEventListener("click", () => {
    refreshSelectedPoint(true);
  });

  document.addEventListener("visibilitychange", () => {
    state.visible = document.visibilityState === "visible";
    if (state.visible && state.selectedPoint) {
      refreshSelectedPoint();
    }
  });

  bindQuickPickEvents();
  bindLanguageToggle();
  bindRippleEffect();
  bindPanelReveal();
  bindPointerLight();
  bindMagneticButtons();
  bindSurfaceTilt();
  bindForecastSpotlight();
}

function startAutoRefresh() {
  setInterval(() => {
    if (!state.visible) {
      return;
    }
    updateCountdown();
    if (state.selectedPoint && Date.now() >= state.nextRefreshAt) {
      refreshSelectedPoint();
    }
  }, 1000);
}

function init() {
  bindEvents();
  applyLocale();
  startAutoRefresh();
  selectPoint(DEFAULT_POINT.lat, DEFAULT_POINT.lon, false);
}

init();
