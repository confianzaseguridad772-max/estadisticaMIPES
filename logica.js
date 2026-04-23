const URL_WEB_APP = 'https://script.google.com/macros/s/AKfycbytEYgGRugIClUqJogRkyjqz2K1wAfB7ZQoRpehr_cdmQHlOpD5NjjHKSR-_OeQ4a52/exec';
let rawData = [];
let chartInstances = [];

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
        }
    } catch (error) {
        status.innerText = "Error de Enlace";
        status.className = "badge danger";
    }
}

function calculateStats() {
    const meeting = document.getElementById('semana').value;
    const sheetType = document.getElementById('sheetSelect').value;
    if (!meeting || rawData.length === 0) return;

    const headers = Object.keys(rawData[0]);
    const groupKey = headers.find(k => k.toLowerCase().includes("grupo"));
    const condicionKey = headers.find(k => k.toLowerCase().includes("condición") || k.toLowerCase().includes("tipo"));

    const stats = {};

    rawData.forEach(row => {
        const groupName = row[groupKey] || "Sin Grupo";
        if (groupName === "sn" || groupName === "") return;

        if (!stats[groupName]) {
            stats[groupName] = { 
                total: 0, present: 0, 
                bautizadosTotal: 0, bautizadosPresent: 0,
                amigosTotal: 0, amigosPresent: 0,
                estudioTotal: 0 
            };
        }

        const val = row[meeting] ? row[meeting].toString().toUpperCase().trim() : "";
        const condicion = row[condicionKey] ? row[condicionKey].toString().toLowerCase().trim() : "";
        
        const numVal = parseInt(val);
        const isPresent = (val === "SI" || (!isNaN(numVal) && numVal >= 1 && numVal <= 7));
        
        // Estudio de lección: Solo Bautizados con nota 7
        const isSevenBautizado = (val === "7" && condicion.includes("bautizado"));

        stats[groupName].total++;
        if (isPresent) stats[groupName].present++;
        if (isSevenBautizado) stats[groupName].estudioTotal++;

        if (condicion.includes("bautizado")) {
            stats[groupName].bautizadosTotal++;
            if (isPresent) stats[groupName].bautizadosPresent++;
        } else {
            stats[groupName].amigosTotal++;
            if (isPresent) stats[groupName].amigosPresent++;
        }
    });

    const labels = Object.keys(stats);
    
    // --- LÓGICA DE MEJOR GRUPO AJUSTADA ---
    let topGroupName = "---";
    if (sheetType === "Unidad") {
        // En Unidad, el mejor grupo es el que tiene mayor % de Estudio de Lección
        let maxEstudio = -1;
        labels.forEach(l => {
            const pEstudio = (stats[l].estudioTotal / stats[l].total) * 100;
            if (pEstudio > maxEstudio) {
                maxEstudio = pEstudio;
                topGroupName = l;
            }
        });
    } else {
        // En Casas, el mejor grupo sigue siendo por Asistencia General
        const totalPercents = labels.map(l => (stats[l].present / stats[l].total) * 100);
        const topVal = Math.max(...totalPercents);
        topGroupName = labels[totalPercents.indexOf(topVal)] || "---";
    }

    // Promedio de asistencia general (esto no cambia)
    const totalPercentsAsistencia = labels.map(l => (stats[l].present / stats[l].total) * 100);
    const avg = (totalPercentsAsistencia.reduce((a, b) => a + b, 0) / (labels.length || 1)).toFixed(1);

    document.getElementById('totalGroups').innerText = labels.length;
    document.getElementById('avgTotal').innerText = avg + "%";
    document.getElementById('topGroup').innerText = topGroupName;

    renderMultipleGauges(stats, sheetType);
}

function renderMultipleGauges(stats, sheetType) {
    const container = document.getElementById('chartsContainer');
    container.innerHTML = '';
    
    chartInstances.forEach(c => c.destroy());
    chartInstances = [];

    let i = 0;
    for (const group in stats) {
        const g = stats[group];
        const percent = ((g.present / g.total) * 100).toFixed(0);
        const pBautizados = g.bautizadosTotal > 0 ? ((g.bautizadosPresent / g.bautizadosTotal) * 100).toFixed(0) : 0;
        const pAmigos = g.amigosTotal > 0 ? ((g.amigosPresent / g.amigosTotal) * 100).toFixed(0) : 0;
        const pEstudio = ((g.estudioTotal / g.total) * 100).toFixed(0);

        const wrapper = document.createElement('div');
        wrapper.className = 'gauge-item';
        
        const estudioBar = sheetType === "Unidad" ? `
            <div class="full-bar estudio">
                <span class="val">${pEstudio}%</span>
                <span class="lbl">Estudio Lección (Bautizados 7/7)</span>
            </div>
        ` : '';

        wrapper.innerHTML = `
            <canvas id="canvas-${i}"></canvas>
            <div class="gauge-info">
                <span class="percent">${percent}%</span>
                <span class="name">${group}</span>
            </div>
            <div class="mini-bar-container">
                <div class="mini-bar bautizados">
                    <span class="val">${pBautizados}%</span>
                    <span class="lbl">Bautizado</span>
                </div>
                <div class="mini-bar amigos">
                    <span class="val">${pAmigos}%</span>
                    <span class="lbl">Amigos de Esperanza</span>
                </div>
            </div>
            ${estudioBar}
        `;
        container.appendChild(wrapper);

        const ctx = document.getElementById(`canvas-${i}`).getContext('2d');
        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [percent, 100 - percent],
                    backgroundColor: ['#4f46e5', '#e2e8f0'],
                    borderWidth: 0,
                    circumference: 180,
                    rotation: 270
                }]
            },
            options: {
                cutout: '80%',
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });
        chartInstances.push(chart);
        i++;
    }
}

window.onload = loadData;
