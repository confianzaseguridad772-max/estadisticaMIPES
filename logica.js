const URL_WEB_APP = 'https://script.google.com/macros/s/AKfycbytEYgGRugIClUqJogRkyjqz2K1wAfB7ZQoRpehr_cdmQHlOpD5NjjHKSR-_OeQ4a52/exec';

let rawData = [];
let chartInstances = []; // Guardamos los gráficos para poder borrarlos al actualizar

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

    const groupKey = Object.keys(rawData[0]).find(k => k.toLowerCase().replace(/\s/g, '').includes("grupo"));
    const stats = {};

    rawData.forEach(row => {
        const groupName = row[groupKey] || "Sin Grupo";
        if (groupName === "sn" || groupName === "") return;

        if (!stats[groupName]) stats[groupName] = { total: 0, present: 0 };
        stats[groupName].total++;
        
        const val = row[meeting] ? row[meeting].toString().toUpperCase().trim() : "";
        if (val === "SI" || (!isNaN(val) && parseFloat(val) > 0)) {
            stats[groupName].present++;
        }
    });

    const labels = Object.keys(stats);
    const dataValues = labels.map(l => ((stats[l].present / stats[l].total) * 100).toFixed(1));

    // Tarjetas principales
    document.getElementById('totalGroups').innerText = labels.length;
    const avg = (dataValues.reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / (labels.length || 1)).toFixed(1);
    document.getElementById('avgTotal').innerText = avg + "%";
    
    const topVal = Math.max(...dataValues.map(v => parseFloat(v)));
    const bestGroup = labels[dataValues.indexOf(topVal.toFixed(1))];
    document.getElementById('topGroup').innerText = bestGroup || "---";

    renderMultipleGauges(stats);
}

function renderMultipleGauges(stats) {
    const container = document.getElementById('chartsContainer');
    container.innerHTML = ''; // Limpiar anteriores
    chartInstances.forEach(chart => chart.destroy()); // Destruir instancias de Chart.js
    chartInstances = [];

    const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    let i = 0;

    for (const group in stats) {
        const percent = ((stats[group].present / stats[group].total) * 100).toFixed(0);
        const color = colors[i % colors.length];

        const wrapper = document.createElement('div');
        wrapper.className = 'gauge-item';
        wrapper.innerHTML = `
            <canvas id="canvas-${i}"></canvas>
            <div class="gauge-info">
                <span class="percent">${percent}%</span>
                <span class="name">${group}</span>
            </div>
        `;
        container.appendChild(wrapper);

        const ctx = document.getElementById(`canvas-${i}`).getContext('2d');
        const newChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [percent, 100 - percent],
                    backgroundColor: [color, '#e2e8f0'],
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
        chartInstances.push(newChart);
        i++;
    }
}

window.onload = loadData;
