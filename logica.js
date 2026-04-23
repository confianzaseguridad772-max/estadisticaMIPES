const URL_WEB_APP = 'https://script.google.com/macros/s/AKfycbytEYgGRugIClUqJogRkyjqz2K1wAfB7ZQoRpehr_cdmQHlOpD5NjjHKSR-_OeQ4a52/exec';
let rawData = [];
let chartInstances = [];
let historyChartInstance = null;

async function loadData() {
    const sheet = document.getElementById('sheetSelect').value;
    const status = document.getElementById('statusTag');
    status.innerText = "Sincronizando...";
    status.className = "badge warning";

    try {
        const response = await fetch(`${URL_WEB_APP}?hoja=${sheet}`);
        const text = await response.text();
        rawData = JSON.parse(text);
        if (rawData.length > 0) {
            status.innerText = "Conectado";
            status.className = "badge success";
            calculateStats();
            renderHistoryChart();
        }
    } catch (e) {
        status.innerText = "Error de Enlace";
        status.className = "badge danger";
    }
}

function calculateStats() {
    const meeting = document.getElementById('semana').value;
    const sheetType = document.getElementById('sheetSelect').value;
    const allWeeks = Array.from(document.getElementById('semana').options).map(o => o.value);
    const prevMeeting = allWeeks[allWeeks.indexOf(meeting) - 1];

    if (!meeting || rawData.length === 0) return;

    const headers = Object.keys(rawData[0]);
    const groupKey = headers.find(k => k.toLowerCase().includes("grupo"));
    const condicionKey = headers.find(k => k.toLowerCase().includes("condición") || k.toLowerCase().includes("tipo"));

    const stats = {};
    let totalPresentesHoy = 0;
    let fidelizadosCount = 0;

    rawData.forEach(row => {
        const group = row[groupKey];
        if (!group || group === "sn") return;

        if (!stats[group]) {
            stats[group] = { total: 0, present: 0, bTotal: 0, bPresent: 0, aTotal: 0, aPresent: 0, estudio: 0, prevPresent: 0 };
        }

        const val = (row[meeting] || "").toString().toUpperCase().trim();
        const condicion = (row[condicionKey] || "").toLowerCase();
        const isPresent = (val === "SI" || (parseInt(val) >= 1 && parseInt(val) <= 7));

        stats[group].total++;
        if (isPresent) {
            stats[group].present++;
            totalPresentesHoy++;
            
            // Lógica de fidelización: si hoy está presente, ¿estuvo la semana pasada?
            if (prevMeeting) {
                const valPrev = (row[prevMeeting] || "").toString().toUpperCase().trim();
                const isPrevPresent = (valPrev === "SI" || (parseInt(valPrev) >= 1 && parseInt(valPrev) <= 7));
                if (isPrevPresent) fidelizadosCount++;
            }
        }

        if (val === "7" && condicion.includes("bautizado")) stats[group].estudio++;

        // Para tendencia (promedio anterior)
        if (prevMeeting) {
            const valPrev = (row[prevMeeting] || "").toString().toUpperCase().trim();
            if (valPrev === "SI" || (parseInt(valPrev) >= 1 && parseInt(valPrev) <= 7)) stats[group].prevPresent++;
        }

        if (condicion.includes("bautizado")) {
            stats[group].bTotal++;
            if (isPresent) stats[group].bPresent++;
        } else {
            stats[group].aTotal++;
            if (isPresent) stats[group].aPresent++;
        }
    });

    // Cálculos Generales
    const labels = Object.keys(stats);
    let topGroupName = "---";
    let maxScore = -1;
    let sumActualPerc = 0;
    let sumPrevPerc = 0;

    labels.forEach(name => {
        const pAsis = (stats[name].present / stats[name].total) * 100;
        const pEst = (stats[name].estudio / stats[name].total) * 100;
        
        // El "score" premia asistencia y estudio en Unidad, solo asistencia en Casas
        const score = (sheetType === "Unidad") ? (pAsis * 0.4 + pEst * 0.6) : pAsis;
        
        if (score > maxScore) { maxScore = score; topGroupName = name; }
        
        sumActualPerc += pAsis;
        if (prevMeeting) sumPrevPerc += (stats[name].prevPresent / stats[name].total) * 100;
    });

    const avgActual = (sumActualPerc / labels.length).toFixed(1);
    const avgPrev = prevMeeting ? (sumPrevPerc / labels.length).toFixed(1) : avgActual;
    const diff = (avgActual - avgPrev).toFixed(1);

    // Renderizar UI de Tarjetas
    document.getElementById('avgTotal').innerText = avgActual + "%";
    document.getElementById('topGroup').innerText = topGroupName;
    document.getElementById('retencionVal').innerText = totalPresentesHoy > 0 ? ((fidelizadosCount / totalPresentesHoy) * 100).toFixed(0) + "%" : "0%";

    const trend = document.getElementById('trendLabel');
    const cardAsis = document.getElementById('cardAsistencia');

    if (!prevMeeting) {
        trend.innerText = "Inicio de serie";
        cardAsis.className = "card";
    } else if (diff >= 0) {
        trend.innerHTML = `<span style="color:var(--verde-modelo)">▲ +${diff}% subió</span>`;
        cardAsis.className = "card trend-up";
    } else {
        trend.innerHTML = `<span style="color:var(--rojo-meta)">▼ ${diff}% bajó</span>`;
        cardAsis.className = "card trend-down";
    }

    renderMultipleGauges(stats, sheetType);
}

function renderMultipleGauges(stats, type) {
    const container = document.getElementById('chartsContainer');
    container.innerHTML = '';
    chartInstances.forEach(c => c.destroy());
    chartInstances = [];

    let i = 0;
    for (const group in stats) {
        const g = stats[group];
        const p = ((g.present / g.total) * 100).toFixed(0);
        const pB = g.bTotal > 0 ? ((g.bPresent / g.bTotal) * 100).toFixed(0) : 0;
        const pA = g.aTotal > 0 ? ((g.aPresent / g.aTotal) * 100).toFixed(0) : 0;
        const pE = ((g.estudio / g.total) * 100).toFixed(0);

        const wrapper = document.createElement('div');
        wrapper.className = 'gauge-item';
        wrapper.innerHTML = `
            <canvas id="gauge-${i}"></canvas>
            <div class="gauge-info"><span class="percent">${p}%</span><span class="name">${group}</span></div>
            <div class="mini-bar-container">
                <div class="mini-bar bautizados"><span>${pB}%</span><span>Bautizado</span></div>
                <div class="mini-bar amigos"><span>${pA}%</span><span>Amigos</span></div>
            </div>
            ${type === "Unidad" ? `<div class="full-bar estudio">Estudio Lección 7/7: ${pE}%</div>` : ''}
        `;
        container.appendChild(wrapper);

        const ctx = document.getElementById(`gauge-${i}`).getContext('2d');
        chartInstances.push(new Chart(ctx, {
            type: 'doughnut',
            data: { datasets: [{ data: [p, 100 - p], backgroundColor: ['#4f46e5', '#e2e8f0'], circumference: 180, rotation: 270, borderWidth: 0 }] },
            options: { cutout: '80%', plugins: { legend: false, tooltip: false } }
        }));
        i++;
    }
}

function renderHistoryChart() {
    const ctx = document.getElementById('historyChart').getContext('2d');
    if (historyChartInstance) historyChartInstance.destroy();

    const headers = Object.keys(rawData[0]);
    const weeks = headers.filter(k => k.includes("-"));
    const groupKey = headers.find(k => k.toLowerCase().includes("grupo"));
    const groups = [...new Set(rawData.map(r => r[groupKey]))].filter(g => g && g !== "sn");

    const datasets = groups.map((name, i) => {
        const data = weeks.map(w => {
            const members = rawData.filter(r => r[groupKey] === name);
            const present = members.filter(r => {
                const v = (r[w] || "").toString().toUpperCase().trim();
                return (v === "SI" || (parseInt(v) >= 1 && parseInt(v) <= 7));
            }).length;
            return ((present / members.length) * 100).toFixed(1);
        });
        return { 
            label: name, 
            data: data, 
            borderColor: `hsl(${(i * 137)%360}, 70%, 50%)`, 
            backgroundColor: 'transparent', 
            tension: 0.3,
            borderWidth: 2
        };
    });

    // Línea de Meta (90%)
    datasets.push({
        label: 'META (90%)',
        data: weeks.map(() => 90),
        borderColor: '#ef4444',
        borderDash: [8, 4],
        pointRadius: 0,
        fill: false
    });

    historyChartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels: weeks, datasets: datasets },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, max: 100 } },
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } }
        }
    });
}

window.onload = loadData;
