const URL_WEB_APP = 'https://script.google.com/macros/s/AKfycbytEYgGRugIClUqJogRkyjqz2K1wAfB7ZQoRpehr_cdmQHlOpD5NjjHKSR-_OeQ4a52/exec';

let rawData = [];
let myChart = null;

// 1. CARGA DE DATOS DESDE GOOGLE SHEETS
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
            // Ya no llamamos a updateMeetingOptions porque el HTML es manual
            status.innerText = "Conectado";
            status.className = "badge success";
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        status.innerText = "Error de Enlace";
        status.className = "badge danger";
    }
}

// 2. CÁLCULO DE ESTADÍSTICAS
function calculateStats() {
    // IMPORTANTE: Leemos el ID "semana" de tu nuevo HTML
    const meeting = document.getElementById('semana').value;
    
    if (!meeting) {
        alert("Por favor, selecciona una semana en el menú.");
        return;
    }
    
    if (rawData.length === 0) {
        alert("Aún no se han cargado datos. Dale a Sincronizar de nuevo.");
        return;
    }

    // Buscamos la columna que contiene la palabra "Grupo"
    const groupKey = Object.keys(rawData[0]).find(k => k.toLowerCase().replace(/\s/g, '').includes("grupo"));
    const stats = {};

    rawData.forEach(row => {
        const groupName = row[groupKey] || "Sin Grupo";
        if (groupName === "sn" || groupName === "") return; // Ignorar filas vacías

        if (!stats[groupName]) stats[groupName] = { total: 0, present: 0 };
        
        stats[groupName].total++;
        
        // Obtenemos el valor de la columna seleccionada (ej: Abril-1)
        const val = row[meeting] ? row[meeting].toString().toUpperCase().trim() : "";
        
        // Lógica de conteo: "SI" o número mayor a 0
        if (val === "SI" || (!isNaN(val) && parseFloat(val) > 0)) {
            stats[groupName].present++;
        }
    });

    const labels = Object.keys(stats);
    const dataValues = labels.map(l => ((stats[l].present / stats[l].total) * 100).toFixed(1));

    // ACTUALIZAR TARJETAS SUPERIORES
    document.getElementById('totalGroups').innerText = labels.length;
    
    if (labels.length > 0) {
        const avg = (dataValues.reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / labels.length).toFixed(1);
        document.getElementById('avgTotal').innerText = avg + "%";

        const topVal = Math.max(...dataValues);
        const bestGroup = labels[dataValues.indexOf(topVal.toFixed(1))];
        document.getElementById('topGroup').innerText = bestGroup || "---";
    }

    // RENDERIZAR GRÁFICO
    renderChart(labels, dataValues);
}

// 3. GENERACIÓN DEL GRÁFICO (CHART.JS)
function renderChart(labels, values) {
    const ctx = document.getElementById('statsChart').getContext('2d');
    
    if (myChart) myChart.destroy(); // Borrar gráfico anterior si existe

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
            indexAxis: 'y', // Gráfico horizontal para mejor lectura de nombres
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { 
                    max: 100, 
                    beginAtZero: true,
                    ticks: { font: { size: 11 } } 
                },
                y: { 
                    ticks: { 
                        font: { size: 11, weight: 'bold' },
                        color: '#1e293b'
                    } 
                }
            }
        }
    });
}

// Carga inicial al abrir la página
window.onload = loadData;
