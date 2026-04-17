const URL_WEB_APP = 'https://script.google.com/macros/s/AKfycbytEYgGRugIClUqJogRkyjqz2K1wAfB7ZQoRpehr_cdmQHlOpD5NjjHKSR-_OeQ4a52/exec';

let rawData = [];
let myChart = null;

// Carga inicial al entrar
async function loadData() {
    const sheet = document.getElementById('sheetSelect').value;
    const status = document.getElementById('statusTag');
    status.innerText = "Sincronizando...";
    status.style.background = "#fef9c3";

    try {
        const response = await fetch(`${URL_WEB_APP}?hoja=${sheet}`);
        rawData = await response.json();
        
        if (rawData.length > 0) {
            updateMeetingOptions();
            status.innerText = "Conectado";
            status.style.background = "#dcfce7";
        }
    } catch (error) {
        status.innerText = "Error de Red";
        status.style.background = "#fee2e2";
    }
}

function updateMeetingOptions() {
    const selector = document.getElementById('meetingSelect');
    // Filtra los encabezados que son de reunión (ej. Abril-1, Mayo-2)
    const headers = Object.keys(rawData[0]).filter(k => k.includes('-'));
    selector.innerHTML = headers.map(h => `<option value="${h}">${h}</option>`).join('');
}

function calculateStats() {
    const meeting = document.getElementById('meetingSelect').value;
    if (!meeting) return alert("Selecciona una reunión");

    const groupKey = Object.keys(rawData[0]).find(k => k.toLowerCase().includes("grupo"));
    const stats = {};

    rawData.forEach(row => {
        const groupName = row[groupKey] || "Sin Grupo";
        if (!stats[groupName]) stats[groupName] = { total: 0, present: 0 };

        stats[groupName].total++;
        
        const val = row[meeting] ? row[meeting].toString().toUpperCase().trim() : "";
        // Lógica: Cuenta si es "SI" o si es un número mayor a 0
        if (val === "SI" || (!isNaN(val) && parseFloat(val) > 0)) {
            stats[groupName].present++;
        }
    });

    const labels = Object.keys(stats);
    const dataValues = labels.map(label => {
        const g = stats[label];
        return ((g.present / g.total) * 100).toFixed(1);
    });

    // Actualizar Tarjetas de Resumen
    document.getElementById('totalGroups').innerText = labels.length;
    
    const avg = (dataValues.reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / labels.length).toFixed(1);
    document.getElementById('avgTotal').innerText = avg + "%";

    const topVal = Math.max(...dataValues);
    const bestGroup = labels[dataValues.indexOf(topVal.toFixed(1))];
    document.getElementById('topGroup').innerText = bestGroup || "---";

    renderChart(labels, dataValues);
}

function renderChart(labels, values) {
    const ctx = document.getElementById('statsChart').getContext('2d');
    if (myChart) myChart.destroy();

    // Gradiente moderno para las barras
    const gradient = ctx.createLinearGradient(0, 0, 400, 0);
    gradient.addColorStop(0, '#4f46e5');
    gradient.addColorStop(1, '#818cf8');

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '% Asistencia',
                data: values,
                backgroundColor: gradient,
                borderRadius: 10,
                borderSkipped: false,
                barThickness: 15
            }]
        },
        options: {
            indexAxis: 'y', // Barras horizontales para elegancia
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { max: 100, grid: { display: false }, ticks: { color: '#94a3b8' } },
                y: { grid: { display: false }, ticks: { color: '#475569', font: { weight: '600' } } }
            }
        }
    });
}

window.onload = loadData;
