const URL_WEB_APP = 'https://script.google.com/macros/s/AKfycbytEYgGRugIClUqJogRkyjqz2K1wAfB7ZQoRpehr_cdmQHlOpD5NjjHKSR-_OeQ4a52/exec';

let dataFull = [];
let chartInstance = null;

async function loadData() {
    const sheet = document.getElementById('sheetSelect').value;
    const btn = document.getElementById('btnAction');
    btn.innerText = "Cargando...";

    try {
        const response = await fetch(`${URL_WEB_APP}?hoja=${sheet}`);
        dataFull = await response.json();
        
        if (dataFull.length > 0) {
            populateSelectors();
            btn.innerText = "Consultar";
        }
    } catch (e) {
        console.error("Error:", e);
        btn.innerText = "Error de Enlace";
    }
}

function populateSelectors() {
    const groupSelect = document.getElementById('groupSelect');
    const meetingSelect = document.getElementById('meetingSelect');

    // Buscar la columna que contenga la palabra "Grupo"
    const groupKey = Object.keys(dataFull[0]).find(k => k.toLowerCase().includes("grupo"));
    
    // Extraer grupos únicos
    const groups = [...new Set(dataFull.map(item => item[groupKey]))].filter(Boolean);
    groupSelect.innerHTML = '<option value="">Seleccione Grupo...</option>' + 
        groups.map(g => `<option value="${g}">${g}</option>`).join('');

    // Extraer reuniones (columnas con guion ej. Abril-1)
    const meetings = Object.keys(dataFull[0]).filter(k => k.includes("-"));
    meetingSelect.innerHTML = '<option value="">Seleccione Reunión...</option>' + 
        meetings.map(m => `<option value="${m}">${m}</option>`).join('');
}

function calculateStats() {
    const selectedGroup = document.getElementById('groupSelect').value;
    const selectedMeeting = document.getElementById('meetingSelect').value;

    if (!selectedGroup || !selectedMeeting) return alert("Seleccione ambos campos");

    const groupKey = Object.keys(dataFull[0]).find(k => k.toLowerCase().includes("grupo"));
    const members = dataFull.filter(item => item[groupKey] === selectedGroup);
    
    // Lógica de conteo: cuenta si es "SI" o si es un número mayor a 0
    const attendees = members.filter(m => {
        const v = m[selectedMeeting] ? m[selectedMeeting].toString().toUpperCase().trim() : "";
        return v === "SI" || (!isNaN(v) && parseFloat(v) > 0);
    }).length;

    const total = members.length;
    const percentage = total > 0 ? ((attendees / total) * 100).toFixed(1) : 0;

    // Actualizar Tabla de Estadísticas
    document.getElementById('groupMembers').innerText = total;
    document.getElementById('countReal').innerText = attendees;
    document.getElementById('attendancePct').innerText = percentage + "%";

    updateChart(attendees, total - attendees, selectedGroup);
}

function updateChart(a, f, name) {
    const ctx = document.getElementById('statsChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Asistieron', 'Faltaron'],
            datasets: [{
                data: [a, f],
                backgroundColor: ['#28a745', '#dc3545'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { title: { display: true, text: 'Gráfico de Asistencia: ' + name } }
        }
    });
}

window.onload = loadData;
