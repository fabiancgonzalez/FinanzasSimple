const express = require('express');
const path = require('path');
const ExcelJS = require('exceljs');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Datos en memoria
let ingresos = [];
let egresos = [];

// Rutas API
app.get('/api/transacciones', (req, res) => {
  const totalIngresos = ingresos.reduce((sum, item) => sum + item.monto, 0);
  const totalEgresos = egresos.reduce((sum, item) => sum + item.monto, 0);
  const balance = totalIngresos - totalEgresos;

  res.json({
    ingresos,
    egresos,
    totalIngresos,
    totalEgresos,
    balance
  });
});

app.post('/api/ingresos', (req, res) => {
  const { descripcion, monto } = req.body;
  
  if (!descripcion || !monto || monto <= 0) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  const nuevoIngreso = {
    id: Date.now(),
    descripcion,
    monto: parseFloat(monto),
    fecha: new Date().toLocaleString('es-ES')
  };

  ingresos.push(nuevoIngreso);
  res.json(nuevoIngreso);
});

app.post('/api/egresos', (req, res) => {
  const { descripcion, monto } = req.body;
  
  if (!descripcion || !monto || monto <= 0) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  const nuevoEgreso = {
    id: Date.now(),
    descripcion,
    monto: parseFloat(monto),
    fecha: new Date().toLocaleString('es-ES')
  };

  egresos.push(nuevoEgreso);
  res.json(nuevoEgreso);
});

app.delete('/api/ingresos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  ingresos = ingresos.filter(item => item.id !== id);
  res.json({ success: true });
});

app.delete('/api/egresos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  egresos = egresos.filter(item => item.id !== id);
  res.json({ success: true });
});

app.get('/api/exportar-excel', async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    
    // Hoja de Resumen
    const resumenSheet = workbook.addWorksheet('Resumen');
    resumenSheet.columns = [
      { header: 'Concepto', key: 'concepto', width: 20 },
      { header: 'Monto', key: 'monto', width: 15 }
    ];
    
    const totalIngresos = ingresos.reduce((sum, item) => sum + item.monto, 0);
    const totalEgresos = egresos.reduce((sum, item) => sum + item.monto, 0);
    const balance = totalIngresos - totalEgresos;
    
    resumenSheet.addRow({ concepto: 'Total Ingresos', monto: totalIngresos });
    resumenSheet.addRow({ concepto: 'Total Egresos', monto: totalEgresos });
    resumenSheet.addRow({ concepto: 'Balance', monto: balance });
    
    // Estilo para el resumen
    resumenSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    resumenSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    resumenSheet.getRow(4).font = { bold: true };
    
    // Hoja de Ingresos
    const ingresosSheet = workbook.addWorksheet('Ingresos');
    ingresosSheet.columns = [
      { header: 'Descripción', key: 'descripcion', width: 30 },
      { header: 'Monto', key: 'monto', width: 15 },
      { header: 'Fecha', key: 'fecha', width: 20 }
    ];
    
    ingresos.forEach(ingreso => {
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
    
    egresos.forEach(egreso => {
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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor iniciado en http://localhost:${PORT}`);
  console.log(`📊 Abre tu navegador en http://localhost:${PORT}\n`);
});
