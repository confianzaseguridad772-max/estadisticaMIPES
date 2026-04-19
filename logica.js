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
    if (!meeting || rawData.length === 0) return;

    // Detectar columnas automáticamente
    const groupKey = Object.keys(rawData[0]).find(k => k.toLowerCase().includes("grupo"));
    const condicionKey = Object.keys(rawData[0]).find(k => k.toLowerCase().includes("condición") || k.toLowerCase().includes("tipo"));

    const stats = {};

    rawData.forEach(row => {
        const groupName = row[groupKey] || "Sin Grupo";
        if (groupName === "sn" || groupName === "") return;

        if (!stats[groupName]) {
            stats[groupName] = { 
                total: 0, present: 0, 
                bautizadosTotal: 0, bautizadosPresent: 0,
                amigosTotal: 0, amigosPresent: 0 
            };
        }

        const isPresent = (row[meeting]?.toString().toUpperCase().trim() === "SI" || parseFloat(row[meeting]) > 0);
        const condicion = row[condicionKey]?.toString().toLowerCase().trim() || "";

        stats[groupName].total++;
        if (isPresent) stats[groupName].present++;

        // Lógica por condición
        if (condicion.includes("bautizado")) {
            stats[groupName].bautizadosTotal++;
            if (isPresent) stats[groupName].bautizadosPresent++;
        } else if (condicion.includes("amigo") || condicion.includes("esperanza")) {
            stats[groupName].amigosTotal++;
            if (isPresent) stats[groupName].amigosPresent++;
        }
    });

    renderMultipleGauges(stats);
}

function renderMultipleGauges(stats) {
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

        const wrapper = document.createElement('div');
        wrapper.className = 'gauge-item';
        wrapper.innerHTML = `
            <canvas id="canvas-${i}"></canvas>
            <div class="gauge-info">
                <span class="percent">${percent}%</span>
                <span class="name">${group}</span>
            </div>
            <div class="mini-bar-container">
                <div class="mini-bar bautizados" style="width: 50%">
                    <span class="val">${pBautizados}%</span>
                    <span class="lbl">Bautizados</span>
                </div>
                <div class="mini-bar amigos" style="width: 50%">
                    <span class="val">${pAmigos}%</span>
                    <span class="lbl">Amigos</span>
                </div>
            </div>
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
            options: { cutout: '80%', responsive: true, plugins: { legend: { display: false }, tooltip: { enabled: false } } }
        });
        chartInstances.push(chart);
        i++;
    }
}

window.onload = loadData;
