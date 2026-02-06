const apiKey = "a8ab9210c5bf80029d089fa6ffc6b398";
let currentLat = 8.1586;
let currentLon = 125.1251;

function getPreciseLocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentLat = position.coords.latitude;
                currentLon = position.coords.longitude;
                updateDashboardByCoords(currentLat, currentLon);
            },
            () => updateDashboard("Malaybalay"),
            { enableHighAccuracy: true }
        );
    } else {
        updateDashboard("Malaybalay");
    }
}

async function updateDashboardByCoords(lat, lon) {
    try {
        const [currRes, foreRes] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`),
            fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`)
        ]);
        renderData(await currRes.json(), await foreRes.json());
    } catch (e) { console.error(e); }
}

async function updateDashboard(query) {
    if(!query) return;
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${query},PH&units=metric&appid=${apiKey}`);
        const curr = await res.json();
        if (curr.cod === 200) {
            currentLat = curr.coord.lat;
            currentLon = curr.coord.lon;
            const foreRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${currentLat}&lon=${currentLon}&units=metric&appid=${apiKey}`);
            renderData(curr, await foreRes.json());
        }
    } catch (e) { console.error(e); }
}

function renderData(curr, fore) {
    document.getElementById("city").innerText = curr.name.toUpperCase();
    document.getElementById("temp").innerText = Math.round(curr.main.temp) + "°";
    document.getElementById("description").innerHTML = `${curr.weather[0].description.toUpperCase()} <br><small style="color:var(--br-red)">FEELS LIKE ${Math.round(curr.main.feels_like)}°C</small>`;
    document.getElementById("humidity").innerText = curr.main.humidity + "%";
    document.getElementById("wind").innerText = (curr.wind.speed * 3.6).toFixed(1) + " km/h";
    document.getElementById("pressure").innerText = curr.main.pressure + " hPa";
    document.getElementById("visibility").innerText = (curr.visibility / 1000).toFixed(1) + " km";
    document.getElementById("w-icon").src = `https://openweathermap.org/img/wn/${curr.weather[0].icon}@4x.png`;
    document.getElementById("lat-val").innerText = currentLat.toFixed(4);
    document.getElementById("lon-val").innerText = currentLon.toFixed(4);

    const forecastGrid = document.getElementById("forecast-container");
    const dailyData = fore.list.filter(f => f.dt_txt.includes("12:00:00")).slice(0, 5);

    const allMaxTemps = dailyData.map(d => d.main.temp_max);
    const allMinTemps = dailyData.map(d => d.main.temp_min);
    const absoluteMax = Math.max(...allMaxTemps);
    const absoluteMin = Math.min(...allMinTemps);

    forecastGrid.innerHTML = dailyData.map(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', {weekday:'short'}).toUpperCase();
        const monthDay = date.toLocaleDateString('en-US', {month:'short', day:'numeric'}).toUpperCase();
        const rainChance = day.pop ? Math.round(day.pop * 100) : day.main.humidity;
        const isMaxDay = day.main.temp_max === absoluteMax;
        const isMinDay = day.main.temp_min === absoluteMin;

        return `
            <div class="f-item ${isMaxDay ? 'peak-heat' : ''} ${isMinDay ? 'peak-cold' : ''}">
                ${isMaxDay ? '<span class="extreme-badge hot">HOTTEST</span>' : ''}
                ${isMinDay ? '<span class="extreme-badge cold">COLDEST</span>' : ''}
                <div class="f-header">
                    <span class="f-day">${dayName}</span>
                    <span class="f-subtext" style="font-size:0.6rem; color:#aaa;">${monthDay}</span>
                </div>
                <div class="f-visual">
                    <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="Icon">
                    <span class="f-main-temp">${Math.round(day.main.temp)}°</span>
                </div>
                <div class="f-range" style="font-size:0.7rem; margin-top:5px;">
                    <span style="color:#ff4d4d">H:${Math.round(day.main.temp_max)}°</span> 
                    <span style="color:#4da6ff">L:${Math.round(day.main.temp_min)}°</span>
                </div>
            </div>`;
    }).join('');

    checkAlerts(curr, { max: absoluteMax, min: absoluteMin });
    gsap.from(".f-item", { opacity: 0, y: 15, stagger: 0.1, duration: 0.5 });
}

function checkAlerts(curr, extremes) {
    const container = document.getElementById("alerts-list");
    const ticker = document.getElementById("ticker-text");
    let alerts = [];
    
    if (extremes) {
        alerts.push({ title: "HEAT PEAK", desc: `Peak: ${Math.round(extremes.max)}°C.`, level: "warning" });
        alerts.push({ title: "COLD FLOOR", desc: `Floor: ${Math.round(extremes.min)}°C.`, level: "info" });
    }

    if (alerts.length === 0) {
        container.innerHTML = `<div class="alert-box info"><h3>STABLE</h3><p>Conditions are normal.</p></div>`;
    } else {
        container.innerHTML = alerts.map(a => `<div class="alert-box ${a.level}"><h3>${a.title}</h3><p>${a.desc}</p></div>`).join('');
        ticker.innerText = `⚠️ BROADCAST ALERT: Hottest: ${Math.round(extremes.max)}°C | Coldest: ${Math.round(extremes.min)}°C | Current: ${curr.weather[0].description.toUpperCase()}`;
    }
}

function updateRadarFrame() {
    document.getElementById("radar-frame").src = `https://embed.windy.com/embed2.html?lat=${currentLat}&lon=${currentLon}&zoom=8&level=surface&overlay=radar&menu=&message=true&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`;
}

function updateStormsFrame() {
    document.getElementById("storms-frame").src = `https://embed.windy.com/embed2.html?lat=${currentLat}&lon=${currentLon}&zoom=6&level=surface&overlay=thunder&menu=&message=true&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`;
}

function switchView(view) {
    const views = ['view-overview', 'view-radar', 'view-storms', 'view-alerts'];
    const menus = ['menu-overview', 'menu-radar', 'menu-storms', 'menu-alerts'];
    views.forEach(v => document.getElementById(v).style.display = "none");
    menus.forEach(m => document.getElementById(m).classList.remove("active"));
    
    document.getElementById(`view-${view}`).style.display = (view === 'overview' ? 'grid' : 'block');
    document.getElementById(`menu-${view}`).classList.add("active");
    
    if (view === 'radar') updateRadarFrame();
    if (view === 'storms') updateStormsFrame();
    window.scrollTo(0,0);
}

function startClock() {
    setInterval(() => {
        const now = new Date();
        document.getElementById("date-time").innerText = now.toLocaleTimeString('en-GB', { hour12: false });
        document.getElementById("current-date").innerText = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    }, 1000);
}

document.getElementById("search-btn").onclick = () => updateDashboard(document.getElementById("city-input").value);
startClock();
getPreciseLocation();
