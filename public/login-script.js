// Script específico para la página de LOGIN
// No debe afectar a otras páginas

// Verificar si ya está logueado
(function() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        // Detectar correctamente la base URL
        let baseUrl = '/finanzas';
        const pathname = window.location.pathname;
        
        // Si el pathname contiene /finanzas, usar eso
        if (pathname.includes('/finanzas')) {
            baseUrl = pathname.substring(0, pathname.indexOf('/finanzas') + '/finanzas'.length);
        }
        
        console.log('[LOGIN] User already authenticated. Redirecting to app...');
        console.log('[LOGIN] pathname:', pathname);
        console.log('[LOGIN] baseUrl:', baseUrl);
        
        window.location.replace(baseUrl + '/');
        document.documentElement.style.display = 'none';
        return; // Detener ejecución
    }
})();

// DEFINIR FUNCIÓN GLOBAL PRIMERO - Antes que cualquier otra cosa
window.switchTab = function(tab) {
    // Ocultar todos los tabs
    document.querySelectorAll('.tab-content').forEach(el => {
        el.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(el => {
        el.classList.remove('active');
    });

    // Mostrar el tab seleccionado
    document.getElementById(tab).classList.add('active');
    event.target.classList.add('active');
};

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
    
    console.log('[LOGIN] BASE_URL detected:', BASE_URL);
}

if (!API_BASE) {
    API_BASE = BASE_URL + '/api';
    console.log('[LOGIN] API_BASE constructed:', API_BASE);
}

const APP_BASE = BASE_URL;

console.log('=== LOGIN PAGE CONFIG ===');
console.log('BASE_URL:', BASE_URL);
console.log('API_BASE:', API_BASE);
console.log('APP_BASE:', APP_BASE);
console.log('switchTab available:', typeof window.switchTab);
console.log('=== END CONFIG ===');

// FUNCIÓN DE VALIDACIÓN DE CONTRASEÑA SEGURA
function validarContraseña(password) {
    const minLength = 8;
    const tieneMayuscula = /[A-Z]/.test(password);
    const tieneMinuscula = /[a-z]/.test(password);
    const tieneNumero = /[0-9]/.test(password);
    
    const errores = [];
    
    if (password.length < minLength) {
        errores.push(`Mínimo ${minLength} caracteres (actualmente ${password.length})`);
    }
    if (!tieneMayuscula) {
        errores.push('Al menos una letra mayúscula (A-Z)');
    }
    if (!tieneMinuscula) {
        errores.push('Al menos una letra minúscula (a-z)');
    }
    if (!tieneNumero) {
        errores.push('Al menos un número (0-9)');
    }
    
    return {
        esValida: errores.length === 0,
        errores: errores
    };
}

// LOGIN
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const messageEl = document.getElementById('loginMessage');

    const loginURL = `${API_BASE}/login`;
    console.log('[LOGIN] Intentando login en:', loginURL);
    console.log('[LOGIN] Username:', username);

    try {
        const response = await fetch(loginURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        console.log('[LOGIN] Response status:', response.status);
        console.log('[LOGIN] Response ok:', response.ok);

        const data = await response.json();
        console.log('[LOGIN] Response data:', data);

        if (response.ok) {
            // Guardar token
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Mostrar mensaje
            messageEl.textContent = '¡Bienvenido! Redirigiendo...';
            messageEl.classList.add('success', 'show');

            // Redirigir
            setTimeout(() => {
                window.location.href = `${APP_BASE}/`;
            }, 1500);
        } else {
            messageEl.textContent = data.error || 'Error al iniciar sesión';
            messageEl.classList.remove('success');
            messageEl.classList.add('error', 'show');
        }
    } catch (error) {
        console.error('[LOGIN] Error:', error);
        messageEl.textContent = 'Error de conexión: ' + error.message;
        messageEl.classList.remove('success');
        messageEl.classList.add('error', 'show');
    }
});

// REGISTER
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;
    const messageEl = document.getElementById('registerMessage');

    // Validar que la contraseña sea segura
    const validacion = validarContraseña(password);
    if (!validacion.esValida) {
        messageEl.textContent = 'Contraseña débil: ' + validacion.errores.join(', ');
        messageEl.classList.remove('success');
        messageEl.classList.add('error', 'show');
        return;
    }

    if (password !== passwordConfirm) {
        messageEl.textContent = 'Las contraseñas no coinciden';
        messageEl.classList.remove('success');
        messageEl.classList.add('error', 'show');
        return;
    }

    const registerURL = `${API_BASE}/register`;
    console.log('[REGISTER] Intentando registro en:', registerURL);
    console.log('[REGISTER] Username:', username, 'Email:', email);

    try {
        const response = await fetch(registerURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        console.log('[REGISTER] Response status:', response.status);
        const data = await response.json();
        console.log('[REGISTER] Response data:', data);

        if (response.ok) {
            messageEl.textContent = '¡Registro exitoso! Por favor inicia sesión.';
            messageEl.classList.add('success', 'show');
            messageEl.classList.remove('error');

            // Limpiar formulario
            document.getElementById('registerForm').reset();

            // Cambiar a login
            setTimeout(() => {
                window.switchTab('login');
                document.getElementById('loginForm').reset();
            }, 2000);
        } else {
            messageEl.textContent = data.error || 'Error al registrarse';
            messageEl.classList.remove('success');
            messageEl.classList.add('error', 'show');
        }
    } catch (error) {
        console.error('[REGISTER] Error:', error);
        messageEl.textContent = 'Error de conexión: ' + error.message;
        messageEl.classList.remove('success');
        messageEl.classList.add('error', 'show');
    }
});

// RECUPERAR CONTRASEÑA
document.getElementById('recoverForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('recoverEmail').value;
    const messageEl = document.getElementById('recoverMessage');

    const recoverURL = `${API_BASE}/recuperar-password`;
    console.log('[RECOVER] Intentando recuperación en:', recoverURL);
    console.log('[RECOVER] Email:', email);

    try {
        const response = await fetch(recoverURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        console.log('[RECOVER] Response status:', response.status);
        const data = await response.json();
        console.log('[RECOVER] Response data:', data);

        if (response.ok) {
            messageEl.textContent = '✅ Se ha enviado una nueva contraseña a tu email. Usuario: ' + data.username;
            messageEl.classList.add('success', 'show');
            messageEl.classList.remove('error');

            // Limpiar formulario
            document.getElementById('recoverForm').reset();

            // Cambiar a login después de 3 segundos
            setTimeout(() => {
                window.switchTab('login');
                document.getElementById('loginForm').reset();
            }, 3000);
        } else {
            messageEl.textContent = 'Error al recuperar contraseña';
            messageEl.classList.remove('success');
            messageEl.classList.add('error', 'show');
            messageEl.textContent += ' Contactar Fabian +5493513721988 para soporte.';
            clickwhatsapp = document.createElement('a');
            clickwhatsapp.href = 'https://wa.me/5493513721988';
            clickwhatsapp.target = '_blank';
            clickwhatsapp.textContent = ' FABIAN WhatsApp';
            clickwhatsapp.style.display = 'inline-flex';
            clickwhatsapp.style.alignItems = 'center';
            clickwhatsapp.style.gap = '5px';
            clickwhatsapp.style.marginTop = '10px';
            clickwhatsappicon = document.createElement('img');
            clickwhatsappicon.src = 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg';
            clickwhatsappicon.alt = 'WhatsApp';
            clickwhatsappicon.style.width = '40px';
            clickwhatsappicon.style.height = '40px';
            clickwhatsapp.appendChild(clickwhatsappicon);
            messageEl.appendChild(clickwhatsapp);
        }
    } catch (error) {
        console.error('[RECOVER] Error:', error);
        messageEl.textContent = 'Error de conexión: ' + error.message;
        messageEl.classList.remove('success');
        messageEl.classList.add('error', 'show');
    }
});
