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
            status.innerText = "Conectado";
            status.className = "badge success";
            calculateStats(); // Calcular automáticamente al cargar
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

    document.getElementById('totalGroups').innerText = labels.length;
    const avg = (dataValues.reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / (labels.length || 1)).toFixed(1);
    document.getElementById('avgTotal').innerText = avg + "%";

    const topVal = Math.max(...dataValues);
    document.getElementById('topGroup').innerText = labels[dataValues.indexOf(topVal.toFixed(1))] || "---";

    renderChart(labels, dataValues);
}

function renderChart(labels, values) {
    const ctx = document.getElementById('statsChart').getContext('2d');
    if (myChart) myChart.destroy();

    // Colores vibrantes estilo tu referencia
    const backgroundColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'];

    myChart = new Chart(ctx, {
        type: 'doughnut', 
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: backgroundColors,
                borderWidth: 2,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%', // Grosor de la dona
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 20, font: { size: 12, family: 'Poppins' } }
                }
            }
        }
    });
}

window.onload = loadData;
