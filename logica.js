// REEMPLAZA ESTA URL CON LA TUYA DE GOOGLE APPS SCRIPT
const URL_GOOGLE = "https://script.google.com/macros/s/AKfycbwejLeWqUfmYGx49YOetmCSdJUso_Tfoz6y_arcFfVM_93CjZQq1Ocg2uG993bJ6NUOug/exec"; 

async function enviarAlPadron() {
    const btn = document.getElementById('btnGuardar');
    
    // Captura de datos
    const campos = {
        dni: document.getElementById('dni').value.trim(),
        nombres: document.getElementById('nombres').value.trim(),
        apPaterno: document.getElementById('apPaterno').value.trim(),
        apMaterno: document.getElementById('apMaterno').value.trim(),
        fecha: document.getElementById('fechaNac').value,
        sexo: document.getElementById('sexo').value,
        celular: document.getElementById('celular').value.trim(),
        direccion: document.getElementById('direccion').value.trim(),
        tipo: document.getElementById('tipo').value,
        lider: document.getElementById('liderGp').value
    };

    // Validación de campos vacíos
    if (Object.values(campos).some(v => v === "")) {
        Swal.fire({
            icon: 'warning',
            title: 'Datos incompletos',
            text: 'Por favor, llena todos los campos.',
            background: '#080b12',
            color: '#ffffff',
            confirmButtonColor: '#7000ff'
        });
        return;
    }

    // Validación DNI 8 dígitos
    if (campos.dni.length !== 8 || isNaN(campos.dni)) {
        Swal.fire({
            icon: 'error',
            title: 'DNI inválido',
            text: 'DNI incompleto',
            background: '#080b12',
            color: '#ffffff',
            confirmButtonColor: '#7000ff'
        });
        return;
    }

    btn.innerText = "Paciencia 🔍";
    btn.disabled = true;

    try {
        // 1. VERIFICACIÓN DE DUPLICADO
        const respuesta = await fetch(`${URL_GOOGLE}?dni=${campos.dni}`);
        const resultado = await respuesta.text();

        if (resultado.startsWith("existe")) {
            const nombreLiderRegistrado = resultado.split(":")[1] || "Otro Líder";
            
            Swal.fire({
                icon: 'info',
                title: 'Felicidades',
                html: `Su líder de GP es: <b>${nombreLiderRegistrado}</b>.<br><br>Ve en Paz.`,
                background: '#080b12',
                color: '#ffffff',
                confirmButtonColor: '#00f2ff',
                confirmButtonText: 'Okis'
            }).then(() => {
                location.reload();
            });
            return;
        }

        // 2. PREPARAR DATOS PARA ENVÍO
        const p = campos.fecha.split("-");
        const fechaFormat = `${p[2]}/${p[1]}/${p[0]}`; // Formato DD/MM/AAAA

        const datosFinales = {
            destino: "PADRON",
            DNI: campos.dni,
            Nombres: campos.nombres,
            ApPaterno: campos.apPaterno,
            ApMaterno: campos.apMaterno,
            fechaNac: fechaFormat,
            Sexo: campos.sexo,
            Celular: campos.celular,
            Direccion: campos.direccion,
            Tipo: campos.tipo,
            LiderGp: campos.lider
        };

        // 3. ENVÍO FINAL
        btn.innerText = "GUARDANDO... 💾";
        await fetch(URL_GOOGLE, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(datosFinales)
        });

        // 4. ALERTA DE ÉXITO
        Swal.fire({
            icon: 'success',
            title: '¡Bienvenido al GP!',
            text: 'Verdadero Discípulo',
            background: '#080b12',
            color: '#ffffff',
            showConfirmButton: false,
            timer: 2500
        }).then(() => {
            location.reload();
        });

    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo conectar con el servidor. Inténtalo de nuevo.',
            background: '#080b12',
            color: '#ffffff',
            confirmButtonColor: '#ff0055'
        });
        btn.disabled = false;
        btn.innerText = "GUARDAR⚡";
    }
}