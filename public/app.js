// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    cargarTransacciones();
});

// Exportar a Excel
document.getElementById('btnExportar').addEventListener('click', () => {
    window.location.href = '/api/exportar-excel';
});

// Form Ingreso
document.getElementById('formIngreso').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const descripcion = document.getElementById('descripcionIngreso').value;
    const monto = document.getElementById('montoIngreso').value;

    try {
        const response = await fetch('/api/ingresos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ descripcion, monto: parseFloat(monto) })
        });

        if (response.ok) {
            document.getElementById('formIngreso').reset();
            cargarTransacciones();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al agregar ingreso');
    }
});

// Form Egreso
document.getElementById('formEgreso').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const descripcion = document.getElementById('descripcionEgreso').value;
    const monto = document.getElementById('montoEgreso').value;

    try {
        const response = await fetch('/api/egresos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ descripcion, monto: parseFloat(monto) })
        });

        if (response.ok) {
            document.getElementById('formEgreso').reset();
            cargarTransacciones();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al agregar egreso');
    }
});

// Cargar transacciones
async function cargarTransacciones() {
    try {
        const response = await fetch('/api/transacciones');
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
            const response = await fetch(`/api/ingresos/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                cargarTransacciones();
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
            const response = await fetch(`/api/egresos/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                cargarTransacciones();
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al eliminar egreso');
        }
    }
}
