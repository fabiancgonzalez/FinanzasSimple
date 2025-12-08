const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const DIST_DIR = path.join(__dirname, 'dist');
const PUBLIC_DIR = path.join(__dirname, 'public');
const SRC_FILES = ['server.js', 'app.js', 'ecosystem.config.js', 'package.json', 'package-lock.json'];

async function build() {
  try {
    console.log('🔨 Iniciando build para producción...\n');

    // Limpiar directorio dist si existe
    if (fs.existsSync(DIST_DIR)) {
      console.log('🗑️  Limpiando directorio dist anterior...');
      fs.rmSync(DIST_DIR, { recursive: true });
    }

    // Crear estructura de carpetas
    console.log('📁 Creando estructura de directorios...');
    fs.mkdirSync(DIST_DIR, { recursive: true });
    fs.mkdirSync(path.join(DIST_DIR, 'public'), { recursive: true });
    fs.mkdirSync(path.join(DIST_DIR, 'data'), { recursive: true });

    // Copiar archivos principales
    console.log('📄 Copiando archivos principales...');
    for (const file of SRC_FILES) {
      const src = path.join(__dirname, file);
      const dest = path.join(DIST_DIR, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`   ✓ ${file}`);
      }
    }

    // Copiar datos
    console.log('💾 Copiando datos...');
    const dataDir = path.join(__dirname, 'data');
    const distDataDir = path.join(DIST_DIR, 'data');
    if (fs.existsSync(dataDir)) {
      fs.readdirSync(dataDir).forEach(file => {
        fs.copyFileSync(
          path.join(dataDir, file),
          path.join(distDataDir, file)
        );
      });
      console.log('   ✓ data/ copiada');
    }

    // Copiar archivos públicos
    console.log('🎨 Procesando archivos públicos...');
    const publicFiles = fs.readdirSync(PUBLIC_DIR);
    
    for (const file of publicFiles) {
      const src = path.join(PUBLIC_DIR, file);
      const dest = path.join(DIST_DIR, 'public', file);
      const ext = path.extname(file);

      if (ext === '.html') {
        // Minificar HTML
        let content = fs.readFileSync(src, 'utf8');
        content = content
          .replace(/<!--[\s\S]*?-->/g, '') // Eliminar comentarios
          .replace(/\s+/g, ' ') // Reducir espacios en blanco
          .trim();
        fs.writeFileSync(dest, content);
        console.log(`   ✓ ${file} (minificado)`);
      } else if (ext === '.css') {
        // Minificar CSS
        let content = fs.readFileSync(src, 'utf8');
        content = content
          .replace(/\/\*[\s\S]*?\*\//g, '') // Eliminar comentarios
          .replace(/\s*([{}:;,])\s*/g, '$1') // Remover espacios alrededor de símbolos
          .trim();
        fs.writeFileSync(dest, content);
        console.log(`   ✓ ${file} (minificado)`);
      } else if (ext === '.js') {
        // Copiar y registrar minificación futura
        fs.copyFileSync(src, dest);
        console.log(`   ✓ ${file}`);
      } else {
        // Copiar otros archivos
        fs.copyFileSync(src, dest);
        console.log(`   ✓ ${file}`);
      }
    }

    // Crear .env.example si no existe
    if (fs.existsSync(path.join(__dirname, '.env.example'))) {
      fs.copyFileSync(
        path.join(__dirname, '.env.example'),
        path.join(DIST_DIR, '.env.example')
      );
      console.log('   ✓ .env.example');
    }

    // Crear archivo README de deployment
    const deployReadme = `# Deployment Guide

## Instalación rápida en servidor

1. Instalar dependencias de producción:
   \`\`\`bash
   npm install --production
   \`\`\`

2. Configurar variables de entorno (.env):
   \`\`\`bash
   cp .env.example .env
   # Editar .env con tus configuraciones
   \`\`\`

3. Iniciar la aplicación:
   \`\`\`bash
   npm start
   \`\`\`
   O con PM2:
   \`\`\`bash
   pm2 start ecosystem.config.js
   \`\`\`

## Archivos incluidos

- \`server.js\` - Servidor Express principal
- \`app.js\` - Versión CLI
- \`package.json\` - Dependencias
- \`public/\` - Archivos estáticos (optimizados)
- \`data/\` - Datos persistentes
- \`ecosystem.config.js\` - Configuración PM2

## Requisitos

- Node.js 14+
- npm o yarn
`;

    fs.writeFileSync(path.join(DIST_DIR, 'DEPLOYMENT_GUIDE.md'), deployReadme);
    console.log('   ✓ DEPLOYMENT_GUIDE.md');

    // Mostrar estadísticas
    console.log('\n✅ Build completado exitosamente!\n');
    console.log('📊 Estadísticas:');
    
    let totalSize = 0;
    const countFiles = (dir) => {
      let files = 0;
      let size = 0;
      fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          const [subFiles, subSize] = countFiles(fullPath);
          files += subFiles;
          size += subSize;
        } else {
          files++;
          size += stat.size;
        }
      });
      return [files, size];
    };

    const [fileCount, dirSize] = countFiles(DIST_DIR);
    const sizeMB = (dirSize / 1024 / 1024).toFixed(2);
    
    console.log(`   📦 Archivos: ${fileCount}`);
    console.log(`   💾 Tamaño: ${sizeMB} MB`);
    console.log(`\n📍 Carpeta de deployment: ${DIST_DIR}`);
    console.log('\n💡 Próximos pasos:');
    console.log('   1. Copiar contenido de dist/ a tu servidor');
    console.log('   2. Ejecutar: npm install --production');
    console.log('   3. Configurar .env si es necesario');
    console.log('   4. Iniciar con: npm start\n');

  } catch (error) {
    console.error('❌ Error durante el build:', error.message);
    process.exit(1);
  }
}

build();
