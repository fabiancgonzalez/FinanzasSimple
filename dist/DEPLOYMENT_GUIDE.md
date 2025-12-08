# Deployment Guide

## Instalación rápida en servidor

1. Instalar dependencias de producción:
   ```bash
   npm install --production
   ```

2. Configurar variables de entorno (.env):
   ```bash
   cp .env.example .env
   # Editar .env con tus configuraciones
   ```

3. Iniciar la aplicación:
   ```bash
   npm start
   ```
   O con PM2:
   ```bash
   pm2 start ecosystem.config.js
   ```

## Archivos incluidos

- `server.js` - Servidor Express principal
- `app.js` - Versión CLI
- `package.json` - Dependencias
- `public/` - Archivos estáticos (optimizados)
- `data/` - Datos persistentes
- `ecosystem.config.js` - Configuración PM2

## Requisitos

- Node.js 14+
- npm o yarn
