const express = require('express');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const nodemailer = require('nodemailer');
const app = express();
const PORT = process.env.PORT || 3000;

// Obtener base URL desde variable de entorno o usar /finanzas como default
const BASE_URL = process.env.BASE_URL || '/finanzas';

// Configurar transporte de email (Gmail SMTP con contraseña de aplicación)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'ceferinomonier@gmail.com', // Cambiar por tu email
    pass: process.env.EMAIL_PASSWORD || 'vqojsugfiprdpmlu' // Usar contraseña de aplicación de Google
  }
});

// Verificar conexión de email al iniciar
transporter.verify((error, success) => {
  if (error) {
    console.log('[EMAIL] Error al conectar SMTP:', error);
    console.log('[EMAIL] Los emails no se enviarán. Configura EMAIL_USER y EMAIL_PASSWORD en .env');
  } else {
    console.log('[EMAIL] ✅ Servicio de email configurado correctamente');
  }
});

// Middleware
app.use(express.json());

// Prevenir cache para desarrollo/testing
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Ruta raíz que redirige a BASE_URL
app.get('/', (req, res) => {
  res.redirect(BASE_URL + '/');
});

// Rutas específicas ANTES de archivos estáticos
app.get(BASE_URL + '/login', (req, res) => {
  let html = fs.readFileSync(path.join(__dirname, 'public', 'login.html'), 'utf-8');
  // Inyectar la BASE_URL en el HTML para que esté disponible antes del script
  const script = `<script>
  window.BASE_URL = "${BASE_URL}";
  window.API_BASE = "${BASE_URL}/api";
  console.log('[Server Config] BASE_URL:', window.BASE_URL);
  console.log('[Server Config] API_BASE:', window.API_BASE);
</script>`;
  html = html.replace('</head>', script + '</head>');
  res.send(html);
});

app.get(BASE_URL + '/', (req, res) => {
  let html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf-8');
  // Inyectar la BASE_URL en el HTML para que esté disponible antes del script
  const script = `<script>
  window.BASE_URL = "${BASE_URL}";
  window.API_BASE = "${BASE_URL}/api";
  console.log('[Server Config] BASE_URL:', window.BASE_URL);
  console.log('[Server Config] API_BASE:', window.API_BASE);
</script>`;
  html = html.replace('</head>', script + '</head>');
  res.send(html);
});

// Servir archivos estáticos desde BASE_URL
app.use(BASE_URL, express.static('public'));

// Funciones de gestión de usuarios JSON
const dataPath = path.join(__dirname, 'data', 'users.json');

function readUsers() {
  try {
    const data = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users file:', error);
    return { users: [] };
  }
}

function saveUsers(data) {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving users file:', error);
  }
}

function findUserByUsername(username) {
  const data = readUsers();
  return data.users.find(u => u.username === username);
}

// Middleware de autenticación
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log('[AUTH] Authorization header:', authHeader ? 'Present' : 'Missing');
  
  if (!authHeader) {
    console.log('[AUTH] No authorization header found');
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('[AUTH] No token found after Bearer');
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    console.log('[AUTH] Token decoded successfully:', decoded.username);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('[AUTH] Token decode error:', error.message);
    res.status(401).json({ error: 'Token inválido' });
  }
}

// Rutas de autenticación

// Registro
app.post(BASE_URL + '/api/register', (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Faltan datos' });
  }
  
  const data = readUsers();
  
  if (data.users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'El usuario ya existe' });
  }
  
  const newUser = {
    id: Date.now(),
    username,
    email,
    password,
    ingresos: [],
    egresos: []
  };
  
  data.users.push(newUser);
  saveUsers(data);
  
  res.json({ 
    message: 'Usuario registrado exitosamente',
    user: { id: newUser.id, username: newUser.username, email: newUser.email }
  });
});

// Login
app.post(BASE_URL + '/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Faltan datos' });
  }
  
  const user = findUserByUsername(username);
  
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }
  
  const token = Buffer.from(JSON.stringify({
    id: user.id,
    username: user.username,
    email: user.email
  })).toString('base64');
  
  res.json({ 
    token,
    user: { id: user.id, username: user.username, email: user.email }
  });
});

// Recuperar contraseña
app.post(BASE_URL + '/api/recuperar-password', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'El email es requerido' });
  }
  
  const data = readUsers();
  const user = data.users.find(u => u.email === email);
  
  if (!user) {
    return res.status(404).json({ error: 'No existe cuenta con ese email' });
  }
  
  // Generar contraseña temporal (8 caracteres: 4 letras mayúsculas, 2 minúsculas, 2 números)
  const mayusculas = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const minusculas = 'abcdefghijklmnopqrstuvwxyz';
  const numeros = '0123456789';
  
  let newPassword = '';
  // 4 mayúsculas
  for (let i = 0; i < 4; i++) {
    newPassword += mayusculas.charAt(Math.floor(Math.random() * mayusculas.length));
  }
  // 2 minúsculas
  for (let i = 0; i < 2; i++) {
    newPassword += minusculas.charAt(Math.floor(Math.random() * minusculas.length));
  }
  // 2 números
  for (let i = 0; i < 2; i++) {
    newPassword += numeros.charAt(Math.floor(Math.random() * numeros.length));
  }
  
  // Mezclar la contraseña
  newPassword = newPassword.split('').sort(() => Math.random() - 0.5).join('');
  
  // Actualizar contraseña del usuario
  user.password = newPassword;
  saveUsers(data);
  
  // Intentar enviar email
  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@finanzas.com',
    to: email,
    subject: '🔐 Recuperación de Contraseña - Gestor de Finanzas',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Recuperación de Contraseña</h2>
        <p>Hola <strong>${user.username}</strong>,</p>
        <p>Se ha solicitado una recuperación de contraseña para tu cuenta.</p>
        <p>Tu nueva contraseña temporal es:</p>
        <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="text-align: center; color: #667eea; letter-spacing: 2px;">
            ${newPassword}
          </h3>
        </div>
        <p><strong>⚠️ IMPORTANTE:</strong></p>
        <ul>
          <li>Esta contraseña es temporal y debe ser cambiada en tu próximo acceso</li>
          <li>No compartas esta contraseña con nadie</li>
          <li>Si no solicitaste esta recuperación, ignora este email</li>
        </ul>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          © 2024 Gestor de Finanzas. Todos los derechos reservados.
        </p>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`[RECOVERY] Email enviado correctamente a ${email}`);
    console.log(`[RECOVERY] Usuario: ${user.username}, Contraseña: ${newPassword}`);
    
    res.json({ 
      message: '✅ Se ha enviado una nueva contraseña a tu email.',
      username: user.username
    });
  } catch (error) {
    console.error(`[RECOVERY] Error al enviar email a ${email}:`, error);
    console.log(`[RECOVERY] Contraseña temporal: ${newPassword} (no se pudo enviar por email)`);
    
    // Aún así devolver éxito, con la contraseña en respuesta si falla el email
    res.json({ 
      message: '⚠️ La contraseña fue generada pero hubo un error al enviarla. Contraseña: ' + newPassword,
      username: user.username,
      password: newPassword // Para desarrollo
    });
  }
});

// Cambiar contraseña después de recuperación (sin autenticación)
app.post(BASE_URL + '/api/cambiar-password-recuperacion', (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  
  if (!username || !oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }
  
  // Validar que la nueva contraseña sea segura
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
  }
  
  const tieneMayuscula = /[A-Z]/.test(newPassword);
  const tieneMinuscula = /[a-z]/.test(newPassword);
  const tieneNumero = /[0-9]/.test(newPassword);
  
  if (!tieneMayuscula || !tieneMinuscula || !tieneNumero) {
    return res.status(400).json({ 
      error: 'La nueva contraseña debe contener mayúscula, minúscula y número' 
    });
  }
  
  const data = readUsers();
  const user = data.users.find(u => u.username === username);
  
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  
  // Verificar que la contraseña temporal sea correcta
  if (user.password !== oldPassword) {
    return res.status(401).json({ error: 'La contraseña temporal es incorrecta' });
  }
  
  // Cambiar a la nueva contraseña
  user.password = newPassword;
  saveUsers(data);
  
  console.log(`[CHANGE PASSWORD] Usuario ${username} cambió su contraseña exitosamente`);
  
  res.json({ 
    message: '✅ Contraseña cambiada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.',
    username: user.username
  });
});

// Cambiar contraseña (requiere autenticación)
app.post(BASE_URL + '/api/cambiar-password', requireAuth, (req, res) => {
  const { passwordActual, passwordNueva, passwordConfirm } = req.body;
  
  if (!passwordActual || !passwordNueva || !passwordConfirm) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }
  
  if (passwordNueva !== passwordConfirm) {
    return res.status(400).json({ error: 'Las nuevas contraseñas no coinciden' });
  }
  
  if (passwordNueva.length < 8) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
  }
  
  const tieneMayuscula = /[A-Z]/.test(passwordNueva);
  const tieneMinuscula = /[a-z]/.test(passwordNueva);
  const tieneNumero = /[0-9]/.test(passwordNueva);
  
  if (!tieneMayuscula || !tieneMinuscula || !tieneNumero) {
    return res.status(400).json({ 
      error: 'La nueva contraseña debe contener mayúscula, minúscula y número' 
    });
  }
  
  const data = readUsers();
  const user = data.users.find(u => u.username === req.user.username);
  
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  
  if (user.password !== passwordActual) {
    return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
  }
  
  user.password = passwordNueva;
  saveUsers(data);
  
  console.log(`[PASSWORD CHANGE] Usuario ${user.username} cambió su contraseña`);
  
  res.json({ 
    message: '✅ Contraseña cambiada exitosamente'
  });
});

// Obtener usuario actual
app.get(BASE_URL + '/api/me', requireAuth, (req, res) => {
  res.json(req.user);
});

// Rutas API
app.get(BASE_URL + '/api/transacciones', requireAuth, (req, res) => {
  const user = findUserByUsername(req.user.username);
  
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  
  const totalIngresos = user.ingresos.reduce((sum, item) => sum + item.monto, 0);
  const totalEgresos = user.egresos.reduce((sum, item) => sum + item.monto, 0);
  const balance = totalIngresos - totalEgresos;

  res.json({
    ingresos: user.ingresos,
    egresos: user.egresos,
    totalIngresos,
    totalEgresos,
    balance
  });
});

app.post(BASE_URL + '/api/ingresos', requireAuth, (req, res) => {
  const { descripcion, monto } = req.body;
  
  if (!descripcion || !monto || monto <= 0) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  const data = readUsers();
  const user = data.users.find(u => u.username === req.user.username);
  
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  const nuevoIngreso = {
    id: Date.now(),
    descripcion,
    monto: parseFloat(monto),
    fecha: new Date().toLocaleString('es-ES')
  };

  user.ingresos.push(nuevoIngreso);
  saveUsers(data);
  
  res.json(nuevoIngreso);
});

app.post(BASE_URL + '/api/egresos', requireAuth, (req, res) => {
  const { descripcion, monto } = req.body;
  
  if (!descripcion || !monto || monto <= 0) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  const data = readUsers();
  const user = data.users.find(u => u.username === req.user.username);
  
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  const nuevoEgreso = {
    id: Date.now(),
    descripcion,
    monto: parseFloat(monto),
    fecha: new Date().toLocaleString('es-ES')
  };

  user.egresos.push(nuevoEgreso);
  saveUsers(data);
  
  res.json(nuevoEgreso);
});

app.delete(BASE_URL + '/api/ingresos/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const data = readUsers();
  const user = data.users.find(u => u.username === req.user.username);
  
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  
  user.ingresos = user.ingresos.filter(item => item.id !== id);
  saveUsers(data);
  
  res.json({ success: true });
});

app.delete(BASE_URL + '/api/egresos/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const data = readUsers();
  const user = data.users.find(u => u.username === req.user.username);
  
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  
  user.egresos = user.egresos.filter(item => item.id !== id);
  saveUsers(data);
  
  res.json({ success: true });
});

app.get(BASE_URL + '/api/exportar-excel', requireAuth, async (req, res) => {
  try {
    const user = findUserByUsername(req.user.username);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const workbook = new ExcelJS.Workbook();
    
    // Hoja de Resumen del Usuario
    const resumenSheet = workbook.addWorksheet('Resumen ' + user.username );
    resumenSheet.columns = [
      { header: 'Concepto', key: 'concepto', width: 20 },
      { header: 'Monto', key: 'monto', width: 15 }
    ];
    
    // Agregar título con nombre del usuario
    resumenSheet.insertRow(1, { concepto: `RESUMEN - ${user.username.toUpperCase()}`, monto: '' });
    resumenSheet.mergeCells('A1:B1');
    resumenSheet.getRow(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    resumenSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    resumenSheet.getRow(1).alignment = { horizontal: 'center' };
    
    const totalIngresos = user.ingresos.reduce((sum, item) => sum + item.monto, 0);
    const totalEgresos = user.egresos.reduce((sum, item) => sum + item.monto, 0);
    const balance = totalIngresos - totalEgresos;
    
    resumenSheet.addRow({ concepto: 'Total Ingresos', monto: totalIngresos });
    resumenSheet.addRow({ concepto: 'Total Egresos', monto: totalEgresos });
    resumenSheet.addRow({ concepto: 'Balance', monto: balance });
    
    // Estilo para el resumen del usuario
    resumenSheet.getRow(3).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    resumenSheet.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    resumenSheet.getRow(6).font = { bold: true };
    
    // Hoja de Resumen del Mes Actual
    const resumenMesSheet = workbook.addWorksheet('Resumen Mes');
    resumenMesSheet.columns = [
      { header: 'Concepto', key: 'concepto', width: 20 },
      { header: 'Monto', key: 'monto', width: 15 }
    ];
    
    const ahora = new Date();
    const mesActual = String(ahora.getMonth() + 1).padStart(2, '0');
    const anioActual = ahora.getFullYear();
    
    const ingresosMes = user.ingresos.filter(item => item.fecha.startsWith(`${anioActual}-${mesActual}`));
    const egresosMes = user.egresos.filter(item => item.fecha.startsWith(`${anioActual}-${mesActual}`));
    
    const totalIngresosMes = ingresosMes.reduce((sum, item) => sum + item.monto, 0);
    const totalEgresosMes = egresosMes.reduce((sum, item) => sum + item.monto, 0);
    const balanceMes = totalIngresosMes - totalEgresosMes;
    
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const nombreMes = meses[ahora.getMonth()];
    
    // Agregar título con nombre del usuario y mes
    resumenMesSheet.insertRow(1, { concepto: `${nombreMes.toUpperCase()} ${anioActual} - ${user.username.toUpperCase()}`, monto: '' });
    resumenMesSheet.mergeCells('A1:B1');
    resumenMesSheet.getRow(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    resumenMesSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9E480E' } };
    resumenMesSheet.getRow(1).alignment = { horizontal: 'center' };
    
    resumenMesSheet.addRow({ concepto: `${nombreMes} ${anioActual} - Ingresos`, monto: totalIngresosMes });
    resumenMesSheet.addRow({ concepto: `${nombreMes} ${anioActual} - Egresos`, monto: totalEgresosMes });
    resumenMesSheet.addRow({ concepto: `${nombreMes} ${anioActual} - Balance`, monto: balanceMes });
    
    // Estilo para el resumen del mes
    resumenMesSheet.getRow(3).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    resumenMesSheet.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9E480E' } };
    resumenMesSheet.getRow(6).font = { bold: true };
    
    // Hoja de Ingresos
    const ingresosSheet = workbook.addWorksheet('Ingresos');
    ingresosSheet.columns = [
      { header: 'Descripción', key: 'descripcion', width: 30 },
      { header: 'Monto', key: 'monto', width: 15 },
      { header: 'Fecha', key: 'fecha', width: 20 }
    ];
    
    user.ingresos.forEach(ingreso => {
      ingresosSheet.addRow({
        descripcion: ingreso.descripcion,
        monto: ingreso.monto,
        fecha: ingreso.fecha
      });
    });
    
    ingresosSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ingresosSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };
    
    // Hoja de Egresos
    const egresosSheet = workbook.addWorksheet('Egresos');
    egresosSheet.columns = [
      { header: 'Descripción', key: 'descripcion', width: 30 },
      { header: 'Monto', key: 'monto', width: 15 },
      { header: 'Fecha', key: 'fecha', width: 20 }
    ];
    
    user.egresos.forEach(egreso => {
      egresosSheet.addRow({
        descripcion: egreso.descripcion,
        monto: egreso.monto,
        fecha: egreso.fecha
      });
    });
    
    egresosSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    egresosSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4B183' } };
    
    // Configurar respuesta
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=finanzas_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error al generar Excel:', error);
    res.status(500).json({ error: 'Error al generar el archivo Excel' });
  }
});

// Descargar datos en JSON
app.get(BASE_URL + '/api/descargar-datos', requireAuth, (req, res) => {
  try {
    const user = findUserByUsername(req.user.username);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const datosUsuario = {
      usuario: user.username,
      email: user.email,
      fechaExportacion: new Date().toLocaleString('es-ES'),
      ingresos: user.ingresos,
      egresos: user.egresos,
      totalIngresos: user.ingresos.reduce((sum, item) => sum + item.monto, 0),
      totalEgresos: user.egresos.reduce((sum, item) => sum + item.monto, 0),
      balance: user.ingresos.reduce((sum, item) => sum + item.monto, 0) - 
               user.egresos.reduce((sum, item) => sum + item.monto, 0)
    };
    
    const dataStr = JSON.stringify(datosUsuario, null, 2);
    const filename = `finanzas_${user.username}_${new Date().toISOString().split('T')[0]}.json`;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(dataStr));
    
    res.send(dataStr);
  } catch (error) {
    console.error('Error al descargar datos:', error);
    res.status(500).json({ error: 'Error al descargar los datos' });
  }
});

// Cargar datos desde JSON
app.post(BASE_URL + '/api/cargar-datos', requireAuth, (req, res) => {
  try {
    const { ingresos, egresos } = req.body;
    
    if (!Array.isArray(ingresos) || !Array.isArray(egresos)) {
      return res.status(400).json({ error: 'Formato de datos inválido' });
    }
    
    const data = readUsers();
    const user = data.users.find(u => u.username === req.user.username);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Reemplazar datos
    user.ingresos = ingresos;
    user.egresos = egresos;
    
    saveUsers(data);
    
    res.json({ 
      message: 'Datos cargados exitosamente',
      ingresosCount: ingresos.length,
      egresosCount: egresos.length
    });
  } catch (error) {
    console.error('Error al cargar datos:', error);
    res.status(500).json({ error: 'Error al cargar los datos' });
  }
});

// Obtener datos guardados del usuario
app.get(BASE_URL + '/api/obtener-datos-guardados', requireAuth, (req, res) => {
  try {
    const user = findUserByUsername(req.user.username);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json({
      usuario: user.username,
      email: user.email,
      ingresos: user.ingresos,
      egresos: user.egresos,
      totalIngresos: user.ingresos.reduce((sum, item) => sum + item.monto, 0),
      totalEgresos: user.egresos.reduce((sum, item) => sum + item.monto, 0),
      balance: user.ingresos.reduce((sum, item) => sum + item.monto, 0) - 
               user.egresos.reduce((sum, item) => sum + item.monto, 0)
    });
  } catch (error) {
    console.error('Error al obtener datos:', error);
    res.status(500).json({ error: 'Error al obtener los datos' });
  }
});

// Middleware para manejar rutas API no encontradas con JSON
app.use(BASE_URL + '/api', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor iniciado en http://localhost:${PORT}`);
  console.log(`📊 Abre tu navegador en http://localhost:${PORT}\n`);
});
