const URL_WEB_APP = 'https://script.google.com/macros/s/AKfycbytEYgGRugIClUqJogRkyjqz2K1wAfB7ZQoRpehr_cdmQHlOpD5NjjHKSR-_OeQ4a52/exec';

let dataFull = [];
let chartInstance = null;

// Función para cargar datos iniciales
async function loadData() {
    const sheet = document.getElementById('sheetSelect').value;
    const btn = document.getElementById('btnAction');
    
    btn.innerText = "Cargando...";
    
    try {
        const response = await fetch(`${URL_WEB_APP}?hoja=${sheet}`);
        dataFull = await response.json();
        
        populateSelectors();
        btn.innerText = "Consultar";
    } catch (error) {
        console.error("Error al cargar:", error);
        btn.innerText = "Error";
    }
}

// Llena los selectores de Grupos y Reuniones dinámicamente
function populateSelectors() {
    if (dataFull.length === 0) return;

    const groupSelect = document.getElementById('groupSelect');
    const meetingSelect = document.getElementById('meetingSelect');

    // Obtener nombres de grupos únicos (Columna "nombreGrupo")
    const groups = [...new Set(dataFull.map(item => item.nombreGrupo))].filter(Boolean);
    groupSelect.innerHTML = '<option value="">Seleccione Grupo...</option>' + 
        groups.map(g => `<option value="${g}">${g}</option>`).join('');

    // Obtener reuniones (Columnas que contienen un guion '-', ej: Abril-1)
    const headers = Object.keys(dataFull[0]);
    const meetings = headers.filter(h => h.includes('-'));
    meetingSelect.innerHTML = '<option value="">Seleccione Reunión...</option>' + 
        meetings.map(m => `<option value="${m}">${m}</option>`).join('');
}

// Calcula estadísticas al presionar el botón
function calculateStats() {
    const selectedGroup = document.getElementById('groupSelect').value;
    const selectedMeeting = document.getElementById('meetingSelect').value;

    if (!selectedGroup || !selectedMeeting) {
        alert("Seleccione Grupo y Reunión");
        return;
    }

    // Filtrar personas que pertenecen al grupo
    const groupMembers = dataFull.filter(item => item.nombreGrupo === selectedGroup);
    const totalMembers = groupMembers.length;

    // Contar quiénes tienen valor mayor a 0 en la reunión seleccionada
    const attendees = groupMembers.filter(m => {
        const val = parseFloat(m[selectedMeeting]);
        return val > 0;
    }).length;

    const missing = totalMembers - attendees;
    const percentage = totalMembers > 0 ? ((attendees / totalMembers) * 100).toFixed(1) : 0;

    // Actualizar UI
    document.getElementById('groupMembers').innerText = totalMembers;
    document.getElementById('countReal').innerText = attendees;
    document.getElementById('attendancePct').innerText = `${percentage}%`;

    updateChart(attendees, missing, selectedGroup);
}

function updateChart(attended, missing, groupName) {
    const ctx = document.getElementById('statsChart').getContext('2d');
    
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Asistieron', 'Faltaron'],
            datasets: [{
                data: [attended, missing],
                backgroundColor: ['#27ae60', '#e74c3c'],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: `Asistencia de ${groupName}`, font: { size: 18 } }
            }
        }
    });
}

// Carga inicial
window.onload = loadData;
