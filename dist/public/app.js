// Configuración global - Usar valores inyectados por el servidor o detectar dinámicamente
let BASE_URL = window.BASE_URL;
let API_BASE = window.API_BASE;

// Si no están inyectados, detectar dinámicamente
if (!BASE_URL) {
    const pathname = window.location.pathname;
    
    // Si contiene /finanzas, extraer eso
    if (pathname.includes('/finanzas')) {
        BASE_URL = pathname.substring(0, pathname.indexOf('/finanzas') + '/finanzas'.length);
    } else {
        BASE_URL = '/finanzas';
    }
    
    console.log('[App] BASE_URL detected:', BASE_URL);
}

if (!API_BASE) {
    API_BASE = BASE_URL + '/api';
    console.log('[App] API_BASE constructed:', API_BASE);
}

const APP_BASE = BASE_URL;

console.log('=== FINANZAS APP CONFIG ===');
console.log('BASE_URL:', BASE_URL);
console.log('API_BASE:', API_BASE);
console.log('APP_BASE:', APP_BASE);
console.log('=== END CONFIG ===');

// Obtener token de autorización
function getAuthHeader() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = `${APP_BASE}/login`;
        return null;
    }
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user) {
        window.location.href = `${APP_BASE}/login`;
        return;
    }
    
    // Mostrar usuario actual
    document.getElementById('userDisplay').textContent = `👤 ${user.username}`;
    
    // Cargar transacciones
    cargarTransacciones();
    
    // Agregar eventos de formularios
    document.getElementById('formIngreso').addEventListener('submit', manejarFormIngreso);
    document.getElementById('formEgreso').addEventListener('submit', manejarFormEgreso);
    document.getElementById('btnLogout').addEventListener('click', logout);
    document.getElementById('btnChangePassword').addEventListener('click', abrirModalCambiarPassword);
    document.getElementById('btnExportar').addEventListener('click', exportarExcel);
    document.getElementById('btnGuardarDatos').addEventListener('click', guardarDatos);
    document.getElementById('btnCargarServidor').addEventListener('click', cargarDelServidor);
    
    // Cargar datos desde JSON
    const cargarDatosInput = document.getElementById('cargarDatos');
    if (cargarDatosInput) {
        cargarDatosInput.addEventListener('change', manejarCargarDatos);
    }
    
    // Configurar modal de cambiar contraseña
    const modal = document.getElementById('changePasswordModal');
    const closeBtn = document.querySelector('.close');
    const changePasswordForm = document.getElementById('changePasswordForm');
    
    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };
    
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
    
    changePasswordForm.addEventListener('submit', cambiarPassword);
});

// Función logout
function logout() {
    if (confirm('¿Deseas cerrar sesión?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = `${APP_BASE}/login`;
    }
}

// Función exportar a Excel
async function exportarExcel() {
    try {
        const headers = getAuthHeader();
        if (!headers) return;

        const response = await fetch(`${API_BASE}/exportar-excel`, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            if (response.status === 401) {
                alert('No autorizado. Por favor, inicia sesión nuevamente.');
                window.location.href = `${APP_BASE}/login`;
            } else {
                alert('Error al exportar a Excel');
            }
            return;
        }

        // Convertir la respuesta a blob y descargar
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `finanzas_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error al exportar:', error);
        alert('Error al exportar a Excel');
    }
}

// Función guardar datos
async function guardarDatos() {
    try {
        const headers = getAuthHeader();
        if (!headers) return;

        // Cargar datos actuales
        const response = await fetch(`${API_BASE}/transacciones`, {
            headers
        });

        if (!response.ok) {
            alert('Error al guardar los datos');
            return;
        }

        const data = await response.json();
        
        // Enviar confirmación de guardado
       // alert(`✅ Datos guardados en el servidor!\n`); 
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar los datos');
    }
}

// Función para obtener mes y año actual
function getMesActual() {
    const hoy = new Date();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const anio = hoy.getFullYear();
    return { mes, anio };
}

// Función para extraer mes y año de una fecha
function extraerMesAnio(fechaStr) {
    try {
        // Formato: "7/12/2025, 21:14:34"
        const partes = fechaStr.split(',')[0].split('/');
        if (partes.length === 3) {
            const dia = partes[0].trim();
            const mes = partes[1].trim();
            const anio = partes[2].trim();
            
            // Asegurar que mes tiene dos dígitos
            const mesFormatado = String(mes).padStart(2, '0');
            
            return { mes: mesFormatado, anio };
        }
    } catch (error) {
        console.error('Error al extraer fecha:', error);
    }
    return null;
}

// Función para cargar datos del servidor
async function cargarDelServidor() {
    try {
        const headers = getAuthHeader();
        if (!headers) return;

        const response = await fetch(`${API_BASE}/obtener-datos-guardados`, {
            headers
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = `${APP_BASE}/login`;
            } else {
                alert('Error al cargar datos del servidor');
            }
            return;
        }

        const datos = await response.json();
        const mesActual = getMesActual();

        // Filtrar datos del mes actual
        const ingresosMes = datos.ingresos.filter(ingreso => {
            const fechaIngreso = extraerMesAnio(ingreso.fecha);
            return fechaIngreso && 
                   fechaIngreso.mes === mesActual.mes && 
                   String(fechaIngreso.anio) === String(mesActual.anio);
        });

        const egresosMes = datos.egresos.filter(egreso => {
            const fechaEgreso = extraerMesAnio(egreso.fecha);
            return fechaEgreso && 
                   fechaEgreso.mes === mesActual.mes && 
                   String(fechaEgreso.anio) === String(mesActual.anio);
        });

        // Mostrar grilla
        mostrarDatosMes(ingresosMes, egresosMes);
        
       // alert(`✅ Datos cargados del servidor!\nIngresos del mes: ${ingresosMes.length}\nEgresos del mes: ${egresosMes.length}`);
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los datos');
    }
}

// Mostrar datos del mes en la grilla
function mostrarDatosMes(ingresos, egresos) {
    const datosMesCard = document.getElementById('datosMesCard');
    const bodyDatosMes = document.getElementById('bodyDatosMes');
    
    // Combinar ingresos y egresos
    const datosComplementos = [
        ...ingresos.map(ing => ({ ...ing, tipo: 'Ingreso' })),
        ...egresos.map(egr => ({ ...egr, tipo: 'Egreso' }))
    ];

    // Ordenar por fecha
    datosComplementos.sort((a, b) => {
        const fechaA = new Date(a.fecha.replace(',', ''));
        const fechaB = new Date(b.fecha.replace(',', ''));
        return fechaB - fechaA;
    });

    if (datosComplementos.length === 0) {
        bodyDatosMes.innerHTML = '<tr><td colspan="4" class="empty">No hay datos para este mes</td></tr>';
        datosMesCard.style.display = 'block';
    } else {
        bodyDatosMes.innerHTML = datosComplementos.map(dato => `
            <tr class="${dato.tipo === 'Ingreso' ? 'fila-ingreso' : 'fila-egreso'}">
                <td><strong>${dato.tipo}</strong></td>
                <td>${dato.descripcion}</td>
                <td>$${dato.monto.toFixed(2)}</td>
                <td>${dato.fecha}</td>
            </tr>
        `).join('');
        datosMesCard.style.display = 'block';
    }

    // Calcular totales
    const totalIngresos = ingresos.reduce((sum, ing) => sum + ing.monto, 0);
    const totalEgresos = egresos.reduce((sum, egr) => sum + egr.monto, 0);
    const balance = totalIngresos - totalEgresos;

    // Mostrar resumen
    document.getElementById('ingresosMes').textContent = `$${totalIngresos.toFixed(2)}`;
    document.getElementById('egresosMes').textContent = `$${totalEgresos.toFixed(2)}`;
    document.getElementById('balanceMes').textContent = `$${balance.toFixed(2)}`;
}

// Cargar datos desde JSON
async function manejarCargarDatos(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const fileContent = await file.text();
        const datosGuardados = JSON.parse(fileContent);

        if (!Array.isArray(datosGuardados.ingresos) || !Array.isArray(datosGuardados.egresos)) {
            alert('Formato de archivo inválido. Por favor carga un archivo JSON válido.');
            return;
        }

        if (!confirm('¿Deseas reemplazar todos tus datos actuales con los datos del archivo?')) {
            return;
        }

        const headers = getAuthHeader();
        if (!headers) return;

        const response = await fetch(`${API_BASE}/cargar-datos`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                ingresos: datosGuardados.ingresos,
                egresos: datosGuardados.egresos
            })
        });

        const result = await response.json();

        if (response.ok) {
            alert(`✅ Datos cargados exitosamente!\n${result.ingresosCount} ingresos\n${result.egresosCount} egresos`);
            cargarTransacciones();
        } else if (response.status === 401) {
            window.location.href = `${APP_BASE}/login`;
        } else {
            alert('Error al cargar los datos: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al procesar el archivo');
    }

    // Resetear el input
    e.target.value = '';
}

// Función para manejar formulario de ingreso
async function manejarFormIngreso(e) {
    e.preventDefault();
    
    const descripcion = document.getElementById('descripcionIngreso').value;
    const monto = document.getElementById('montoIngreso').value;
    const headers = getAuthHeader();

    if (!headers) return;

    try {
        const response = await fetch(`${API_BASE}/ingresos`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ descripcion, monto: parseFloat(monto) })
        });

        if (response.ok) {
            document.getElementById('formIngreso').reset();
            cargarTransacciones();
        } else if (response.status === 401) {
            window.location.href = `${APP_BASE}/login`;
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al agregar ingreso');
    }
}

// Función para manejar formulario de egreso
async function manejarFormEgreso(e) {
    e.preventDefault();
    
    const descripcion = document.getElementById('descripcionEgreso').value;
    const monto = document.getElementById('montoEgreso').value;
    const headers = getAuthHeader();

    if (!headers) return;

    try {
        const response = await fetch(`${API_BASE}/egresos`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ descripcion, monto: parseFloat(monto) })
        });

        if (response.ok) {
            document.getElementById('formEgreso').reset();
            cargarTransacciones();
        } else if (response.status === 401) {
            window.location.href = `${APP_BASE}/login`;
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al agregar egreso');
    }
}

// Cargar transacciones
async function cargarTransacciones() {
    try {
        const headers = getAuthHeader();
        if (!headers) return;

        const response = await fetch(`${API_BASE}/transacciones`, {
            headers
        });

        if (response.status === 401) {
            window.location.href = `${APP_BASE}/login`;
            return;
        }

        const data = await response.json();

        // Actualizar resumen
        document.getElementById('totalIngresos').textContent = `$${data.totalIngresos.toFixed(2)}`;
        document.getElementById('totalEgresos').textContent = `$${data.totalEgresos.toFixed(2)}`;
        document.getElementById('balance').textContent = `$${data.balance.toFixed(2)}`;

        // Cambiar color del balance si es negativo
        const balanceCard = document.querySelector('.balance-card');
        if (data.balance < 0) {
            balanceCard.classList.add('negativo');
        } else {
            balanceCard.classList.remove('negativo');
        }

        // Actualizar tabla de ingresos
        const bodyIngresos = document.getElementById('bodyIngresos');
        if (data.ingresos.length === 0) {
            bodyIngresos.innerHTML = '<tr><td colspan="4" class="empty">No hay ingresos registrados</td></tr>';
        } else {
            bodyIngresos.innerHTML = data.ingresos.map(ingreso => `
                <tr>
                    <td>${ingreso.descripcion}</td>
                    <td>$${ingreso.monto.toFixed(2)}</td>
                    <td>${ingreso.fecha}</td>
                    <td>
                        <button class="btn btn-eliminar" onclick="eliminarIngreso(${ingreso.id})">
                            🗑️ Eliminar
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        // Actualizar tabla de egresos
        const bodyEgresos = document.getElementById('bodyEgresos');
        if (data.egresos.length === 0) {
            bodyEgresos.innerHTML = '<tr><td colspan="4" class="empty">No hay egresos registrados</td></tr>';
        } else {
            bodyEgresos.innerHTML = data.egresos.map(egreso => `
                <tr>
                    <td>${egreso.descripcion}</td>
                    <td>$${egreso.monto.toFixed(2)}</td>
                    <td>${egreso.fecha}</td>
                    <td>
                        <button class="btn btn-eliminar" onclick="eliminarEgreso(${egreso.id})">
                            🗑️ Eliminar
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Eliminar ingreso
async function eliminarIngreso(id) {
    if (confirm('¿Está seguro de eliminar este ingreso?')) {
        try {
            const headers = getAuthHeader();
            if (!headers) return;

            const response = await fetch(`${API_BASE}/ingresos/${id}`, {
                method: 'DELETE',
                headers
            });

            if (response.ok) {
                cargarTransacciones();
            } else if (response.status === 401) {
                window.location.href = `${APP_BASE}/login`;
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al eliminar ingreso');
        }
    }
}

// Eliminar egreso
async function eliminarEgreso(id) {
    if (confirm('¿Está seguro de eliminar este egreso?')) {
        try {
            const headers = getAuthHeader();
            if (!headers) return;

            const response = await fetch(`${API_BASE}/egresos/${id}`, {
                method: 'DELETE',
                headers
            });

            if (response.ok) {
                cargarTransacciones();
            } else if (response.status === 401) {
                window.location.href = `${APP_BASE}/login`;
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al eliminar egreso');
        }
    }
}

// Abrir modal de cambiar contraseña
function abrirModalCambiarPassword() {
    const modal = document.getElementById('changePasswordModal');
    modal.style.display = 'block';
}

// Cambiar contraseña
async function cambiarPassword(e) {
    e.preventDefault();
    
    const passwordActual = document.getElementById('currentPassword').value;
    const passwordNueva = document.getElementById('newPassword').value;
    const passwordConfirm = document.getElementById('confirmPassword').value;
    const messageEl = document.getElementById('changePasswordMessage');
    
    if (passwordNueva !== passwordConfirm) {
        messageEl.textContent = 'Las nuevas contraseñas no coinciden';
        messageEl.classList.remove('success');
        messageEl.classList.add('error', 'show');
        return;
    }
    
    if (passwordNueva.length < 8) {
        messageEl.textContent = 'La contraseña debe tener al menos 8 caracteres';
        messageEl.classList.remove('success');
        messageEl.classList.add('error', 'show');
        return;
    }
    
    try {
        const headers = getAuthHeader();
        if (!headers) return;
        
        const response = await fetch(`${API_BASE}/cambiar-password`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                passwordActual,
                passwordNueva,
                passwordConfirm
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            messageEl.textContent = '✅ Contraseña cambiada exitosamente';
            messageEl.classList.add('success', 'show');
            messageEl.classList.remove('error');
            
            // Limpiar formulario
            document.getElementById('changePasswordForm').reset();
            
            // Cerrar modal después de 2 segundos
            setTimeout(() => {
                document.getElementById('changePasswordModal').style.display = 'none';
                messageEl.classList.remove('success', 'show');
            }, 2000);
        } else {
            messageEl.textContent = data.error || 'Error al cambiar la contraseña';
            messageEl.classList.remove('success');
            messageEl.classList.add('error', 'show');
        }
    } catch (error) {
        console.error('Error:', error);
        messageEl.textContent = 'Error al cambiar la contraseña';
        messageEl.classList.remove('success');
        messageEl.classList.add('error', 'show');
    }
}

