const SHEET_ID = '1B7mzaX28g9lmvGMJ2xy9BmuEUabgK3IY0XpSRyTHc1M';
const GID = '1469617527';
const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

let myChart;

async function fetchData() {
    try {
        const response = await fetch(URL);
        const csvData = await response.text();
        return parseCSV(csvData);
    } catch (e) {
        console.error("Error cargando datos:", e);
        return [];
    }
}

function parseCSV(csv) {
    const lines = csv.split('\n');
    const result = [];
    const headers = lines[0].split(',');

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i]) continue;
        const obj = {};
        const currentline = lines[i].split(',');
        headers.forEach((header, j) => {
            obj[header.trim()] = currentline[j]?.trim();
        });
        result.push(obj);
    }
    return result;
}

async function updateDashboard() {
    const data = await fetchData();
    const type = document.getElementById('queryType').value;
    
    document.getElementById('totalCount').innerText = data.length;

    // Supongamos que tu Excel tiene columnas como 'Sector', 'Fecha', 'Asistencia'
    // Ajustaremos la lógica según los datos detectados
    const firstColumn = Object.keys(data[0])[0];
    const labels = [...new Set(data.map(item => item[firstColumn]))].slice(0, 15);
    const values = labels.map(label => data.filter(item => item[firstColumn] === label).length);

    renderChart(labels, values, `Distribución por ${firstColumn}`);
}

function renderChart(labels, values, title) {
    const ctx = document.getElementById('statsChart').getContext('2d');
    
    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Cantidad de Registros',
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
                legend: { position: 'top' },
                title: { display: true, text: title }
            }
        }
    });
}

// Carga inicial
window.onload = updateDashboard;
