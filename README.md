# Gestor de Finanzas Personales 💰

Aplicación web completa para gestionar ingresos y egresos de dinero con interfaz moderna y exportación a Excel.

## 🚀 Características

- ✅ **Interfaz web moderna** con diseño responsivo
- ✅ Agregar ingresos con descripción, monto y fecha
- ✅ Agregar egresos/gastos con descripción, monto y fecha
- ✅ **Resumen financiero en tiempo real** (total ingresos, egresos y balance)
- ✅ Ver detalle de todas las transacciones
- ✅ Eliminar transacciones individuales
- ✅ **Exportar a Excel** con múltiples hojas (Resumen, Ingresos, Egresos)
- ✅ Balance con código de colores (positivo/negativo)
- ✅ Registro automático de fecha y hora

## 📦 Instalación

```bash
npm install
```

## 🎯 Uso Local

### Versión Web (Recomendado)
```bash
npm start
```
Abre tu navegador en: http://localhost:3000

### Versión Consola
```bash
npm run console
```

## 🌐 Deployment en Servidor

Ver guía completa en [DEPLOYMENT.md](DEPLOYMENT.md)

### Pasos rápidos:
1. Comprimir archivos: `server.js`, `package.json`, carpeta `public/`
2. Subir a tu servidor WNPower/cPanel
3. Instalar dependencias: `npm install --production`
4. Configurar Node.js App en cPanel
5. Iniciar aplicación

## 📁 Estructura del Proyecto

```
gestor-finanzas/
├── server.js              # Servidor Express y API REST
├── app.js                 # Versión de consola (opcional)
├── package.json           # Dependencias y scripts
├── ecosystem.config.js    # Configuración PM2 para producción
├── .htaccess              # Configuración Apache (proxy reverso)
├── public/
│   ├── index.html         # Interfaz web
│   ├── styles.css         # Estilos
│   └── app.js             # Lógica del cliente
└── DEPLOYMENT.md          # Guía de deployment
```

## 🛠️ Tecnologías

- **Backend**: Node.js + Express
- **Frontend**: HTML5 + CSS3 + JavaScript (Vanilla)
- **Exportación**: ExcelJS
- **Interacción**: Readline-sync (versión consola)

## 📊 API Endpoints

- `GET /api/transacciones` - Obtener todas las transacciones y resumen
- `POST /api/ingresos` - Agregar un ingreso
- `POST /api/egresos` - Agregar un egreso
- `DELETE /api/ingresos/:id` - Eliminar un ingreso
- `DELETE /api/egresos/:id` - Eliminar un egreso
- `GET /api/exportar-excel` - Descargar archivo Excel

## 🔒 Seguridad

- Headers de seguridad configurados
- Validación de datos en servidor
- Protección XSS
- Content Security Policy

## 📝 Scripts Disponibles

- `npm start` - Inicia servidor web
- `npm run console` - Ejecuta versión de consola
- `npm run build` - Prepara para producción
- `npm run prod` - Inicia en modo producción

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

ISC License
