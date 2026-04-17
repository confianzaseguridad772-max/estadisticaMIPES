const URL_WEB_APP = 'https://script.google.com/macros/s/AKfycbytEYgGRugIClUqJogRkyjqz2K1wAfB7ZQoRpehr_cdmQHlOpD5NjjHKSR-_OeQ4a52/exec';

let rawData = [];
let myChart = null;

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
            updateMeetingOptions();
            status.innerText = "Conectado";
            status.className = "badge success";
        }
    } catch (error) {
        status.innerText = "Error de Enlace";
        status.className = "badge danger";
    }
}

function updateMeetingOptions() {
    const selector = document.getElementById('meetingSelect');
    const headers = Object.keys(rawData[0]).filter(k => k.includes('-'));
    
    // Agrupar por Mes
    const groups = {};
    headers.forEach(h => {
        const [mes, num] = h.split('-');
        if (!groups[mes]) groups[mes] = [];
        groups[mes].push({ full: h, label: `Semana-${num}` });
    });

    let html = '<option value="">Seleccione Reunión...</option>';
    for (const mes in groups) {
        html += `<optgroup label="${mes}">`;
        groups[mes].forEach(item => {
            html += `<option value="${item.full}">${item.label}</option>`;
        });
        html += `</optgroup>`;
    }
    selector.innerHTML = html;
}

function calculateStats() {
    const meeting = document.getElementById('meetingSelect').value;
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

    document.getElementById('totalGroups').innerText = labels.length;
    const avg = (dataValues.reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / labels.length).toFixed(1);
    document.getElementById('avgTotal').innerText = avg + "%";

    const topVal = Math.max(...dataValues);
    document.getElementById('topGroup').innerText = labels[dataValues.indexOf(topVal.toFixed(1))] || "---";

    renderChart(labels, dataValues);
}

function renderChart(labels, values) {
    const ctx = document.getElementById('statsChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '% Asistencia',
                data: values,
                backgroundColor: '#4f46e5',
                borderRadius: 5
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { max: 100, ticks: { font: { size: 10 } } },
                y: { ticks: { font: { size: 10, weight: 'bold' } } }
            }
        }
    });
}

window.onload = loadData;
