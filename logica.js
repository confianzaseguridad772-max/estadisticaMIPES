const URL_WEB_APP = 'https://script.google.com/macros/s/AKfycbytEYgGRugIClUqJogRkyjqz2K1wAfB7ZQoRpehr_cdmQHlOpD5NjjHKSR-_OeQ4a52/exec';

let dataFull = [];
let chartInstance = null;

async function loadData() {
    const sheet = document.getElementById('sheetSelect').value;
    const status = document.getElementById('statusIndicator');
    
    status.innerText = "Cargando...";
    status.style.background = "#feebcb";

    try {
        const response = await fetch(`${URL_WEB_APP}?hoja=${sheet}`);
        dataFull = await response.json();
        
        if (dataFull.length > 0) {
            populateMeetingSelector();
            status.innerText = "Datos Sincronizados";
            status.style.background = "#c6f6d5";
        }
    } catch (e) {
        status.innerText = "Error de Conexión";
        status.style.background = "#fed7d7";
    }
}

function populateMeetingSelector() {
    const meetingSelect = document.getElementById('meetingSelect');
    const meetings = Object.keys(dataFull[0]).filter(k => k.includes("-"));
    meetingSelect.innerHTML = meetings.map(m => `<option value="${m}">${m}</option>`).join('');
}

function calculateStats() {
    const selectedMeeting = document.getElementById('meetingSelect').value;
    const groupKey = Object.keys(dataFull[0]).find(k => k.toLowerCase().includes("grupo"));
    
    const statsByGroup = {};

    dataFull.forEach(row => {
        const groupName = row[groupKey] || "Indefinido";
        if (!statsByGroup[groupName]) statsByGroup[groupName] = { total: 0, asist: 0 };
        
        statsByGroup[groupName].total++;
        const val = row[selectedMeeting]?.toString().toUpperCase().trim();
        if (val === "SI" || (!isNaN(val) && parseFloat(val) > 0)) {
            statsByGroup[groupName].asist++;
        }
    });

    const labels = Object.keys(statsByGroup);
    const percentages = labels.map(group => {
        const g = statsByGroup[group];
        return ((g.asist / g.total) * 100).toFixed(1);
    });

    // Actualizar Tarjetas
    document.getElementById('totalGroups').innerText = labels.length;
    const avg = (percentages.reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / labels.length).toFixed(1);
    document.getElementById('avgTotal').innerText = avg + "%";
    
    // Encontrar el mejor grupo
    const maxVal = Math.max(...percentages);
    const bestGroup = labels[percentages.indexOf(maxVal.toFixed(1))];
    document.getElementById('topGroup').innerText = bestGroup;

    updateChart(labels, percentages, selectedMeeting);
}

function updateChart(labels, data, meeting) {
    const ctx = document.getElementById('statsChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '% Asistencia',
                data: data,
                backgroundColor: 'rgba(49, 130, 206, 0.8)',
                borderRadius: 8,
                barThickness: 20
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { max: 100, grid: { display: false } },
                y: { grid: { display: false } }
            }
        }
    });
}

window.onload = loadData;
