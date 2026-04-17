// REEMPLAZA CON TU URL COMPLETA DE GOOGLE APPS SCRIPT
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbytEYgGRugIClUqJogRkyjqz2K1wAfB7ZQoRpehr_cdmQHlOpD5NjjHKSR-_OeQ4a52/exec';

let myChart;

async function updateDashboard() {
    const sheetName = document.getElementById('sheetSelect').value;
    const btn = document.getElementById('btnLoad');
    const statusText = document.getElementById('status');
    
    btn.innerText = "Cargando...";
    statusText.innerText = "Conectando...";
    statusText.style.color = "#f39c12";

    try {
        const response = await fetch(`${WEB_APP_URL}?hoja=${sheetName}`);
        const data = await response.json();

        if (data.error) {
            alert("Error: " + data.error);
            return;
        }

        // Actualizar contador total
        document.getElementById('totalCount').innerText = data.length;
        statusText.innerText = "Sincronizado";
        statusText.style.color = "#27ae60";

        // --- Lógica de Estadística ---
        // Vamos a contar cuántas personas hay por cada "Tipo" o "Grupo" 
        // Tomaremos la segunda columna del Excel (que suele ser el Nombre del Grupo o Sector)
        const colName = Object.keys(data[0])[1]; // Selecciona automáticamente la 2da columna
        
        const counts = {};
        data.forEach(item => {
            const val = item[colName] || "Sin Datos";
            counts[val] = (counts[val] || 0) + 1;
        });

        renderChart(Object.keys(counts), Object.values(counts), `Distribución por ${colName} (Hoja: ${sheetName})`);

    } catch (error) {
        console.error("Error:", error);
        statusText.innerText = "Error de Conexión";
        statusText.style.color = "#e74c3c";
    } finally {
        btn.innerText = "Actualizar Datos";
    }
}

function renderChart(labels, values, title) {
    const ctx = document.getElementById('statsChart').getContext('2d');
    
    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Número de Personas',
                data: values,
                backgroundColor: 'rgba(52, 152, 219, 0.7)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: true, text: title, font: { size: 16 } }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// Cargar automáticamente al abrir la página
window.onload = updateDashboard;
