# Guía de Deployment para WNPower (cPanel/Hostinger)

## 📦 Preparación de Archivos

### Archivos necesarios para el servidor:
```
├── server.js
├── package.json
├── app.js (opcional - versión consola)
└── public/
    ├── index.html
    ├── styles.css
    └── app.js
```

## 🚀 Pasos para Subir a WNPower/cPanel

### 1. Comprimir la aplicación
Comprime los siguientes archivos en un ZIP:
- `server.js`
- `package.json`
- Carpeta `public` completa
- (Opcional) `app.js` si quieres la versión de consola

### 2. Acceder a cPanel
1. Ingresa a tu panel de control de WNPower
2. Busca el **Administrador de Archivos** (File Manager)

### 3. Subir archivos
1. Navega a la carpeta `public_html` o `www`
2. Crea una subcarpeta (ejemplo: `finanzas`)
3. Sube el archivo ZIP
4. Extrae el ZIP en el servidor

### 4. Instalar Node.js en cPanel (si está disponible)

#### Opción A: Setup Node.js Application (Recomendado)
1. En cPanel, busca **"Setup Node.js App"**
2. Haz clic en **"Create Application"**
3. Configura:
   - **Node.js version**: 18.x o superior
   - **Application mode**: Production
   - **Application root**: `/home/usuario/public_html/finanzas`
   - **Application URL**: `finanzas` o tu dominio
   - **Application startup file**: `server.js`
4. Haz clic en **"Create"**

#### Opción B: Terminal SSH
Si tienes acceso SSH:
```bash
cd /home/usuario/public_html/finanzas
npm install --production
node server.js
```

### 5. Configurar el dominio
1. En cPanel, ve a **"Dominios"** o **"Subdomains"**
2. Crea un subdominio (ejemplo: `finanzas.tudominio.com`)
3. Apúntalo a la carpeta donde instalaste la app

### 6. Configurar variables de entorno
En la configuración de Node.js App o creando archivo `.env`:
```
PORT=3000
NODE_ENV=production
```

## 🔧 Configuración con PM2 (Recomendado para mantener la app corriendo)

Si tienes acceso SSH:
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar la aplicación
pm2 start server.js --name "gestor-finanzas"

# Guardar configuración
pm2 save

# Configurar inicio automático
pm2 startup
```

## 📝 Archivo de configuración PM2 (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'gestor-finanzas',
    script: './server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

## 🌐 Configuración de Proxy Reverso (Apache)

Si usas Apache, crea/edita `.htaccess` en la raíz:
```apache
RewriteEngine On
RewriteRule ^$ http://127.0.0.1:3000/ [P,L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
```

## ⚡ Deployment Alternativo: Usando FTP

1. **Conectar por FTP**:
   - Host: ftp.tudominio.com
   - Usuario: tu usuario de cPanel
   - Contraseña: tu contraseña

2. **Subir archivos**:
   - Sube todos los archivos a `/public_html/finanzas/`

3. **Instalar dependencias** (vía SSH o Terminal de cPanel):
   ```bash
   cd public_html/finanzas
   npm install --production
   ```

4. **Iniciar aplicación**:
   ```bash
   node server.js
   ```

## 🔍 Verificación

1. Accede a tu dominio: `http://tudominio.com/finanzas` o `http://finanzas.tudominio.com`
2. Verifica que la aplicación cargue correctamente
3. Prueba agregar ingresos y egresos
4. Prueba la exportación a Excel

## ❗ Problemas Comunes

### La aplicación no inicia
- Verifica que Node.js esté instalado
- Revisa los logs en cPanel
- Asegúrate de que el puerto no esté en uso

### Error al instalar dependencias
```bash
# Limpiar caché de npm
npm cache clean --force
npm install --production
```

### Puerto no disponible
- Cambia el puerto en el código o usa variable de entorno
- Contacta soporte de WNPower para puertos disponibles

## 📞 Soporte

Si WNPower no soporta Node.js directamente, considera:
1. Usar un VPS o servidor dedicado
2. Desplegar en servicios cloud como:
   - Heroku (gratis/pago)
   - Vercel (gratis)
   - Railway (gratis)
   - Render (gratis)
   - DigitalOcean App Platform

## 🔄 Actualizaciones

Para actualizar la aplicación:
1. Sube los archivos modificados por FTP
2. Reinicia la aplicación:
   ```bash
   pm2 restart gestor-finanzas
   ```
   O desde cPanel: "Restart" en Node.js App Manager
