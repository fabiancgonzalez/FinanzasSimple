const readlineSync = require('readline-sync');

class GestorFinanzas {
  constructor() {
    this.ingresos = [];
    this.egresos = [];
  }

  agregarIngreso(descripcion, monto) {
    this.ingresos.push({ descripcion, monto, fecha: new Date().toLocaleString() });
    console.log(`\n✓ Ingreso agregado: $${monto} - ${descripcion}`);
  }

  agregarEgreso(descripcion, monto) {
    this.egresos.push({ descripcion, monto, fecha: new Date().toLocaleString() });
    console.log(`\n✓ Egreso agregado: $${monto} - ${descripcion}`);
  }

  calcularTotalIngresos() {
    return this.ingresos.reduce((total, ingreso) => total + ingreso.monto, 0);
  }

  calcularTotalEgresos() {
    return this.egresos.reduce((total, egreso) => total + egreso.monto, 0);
  }

  calcularBalance() {
    return this.calcularTotalIngresos() - this.calcularTotalEgresos();
  }

  mostrarResumen() {
    console.log('\n' + '='.repeat(50));
    console.log('RESUMEN FINANCIERO');
    console.log('='.repeat(50));
    console.log(`Total Ingresos:  $${this.calcularTotalIngresos().toFixed(2)}`);
    console.log(`Total Egresos:   $${this.calcularTotalEgresos().toFixed(2)}`);
    console.log('-'.repeat(50));
    console.log(`Balance:         $${this.calcularBalance().toFixed(2)}`);
    console.log('='.repeat(50));
  }

  mostrarDetalleIngresos() {
    console.log('\n' + '='.repeat(50));
    console.log('DETALLE DE INGRESOS');
    console.log('='.repeat(50));
    if (this.ingresos.length === 0) {
      console.log('No hay ingresos registrados.');
    } else {
      this.ingresos.forEach((ingreso, index) => {
        console.log(`${index + 1}. $${ingreso.monto.toFixed(2)} - ${ingreso.descripcion}`);
        console.log(`   Fecha: ${ingreso.fecha}`);
      });
    }
    console.log('='.repeat(50));
  }

  mostrarDetalleEgresos() {
    console.log('\n' + '='.repeat(50));
    console.log('DETALLE DE EGRESOS/GASTOS');
    console.log('='.repeat(50));
    if (this.egresos.length === 0) {
      console.log('No hay egresos registrados.');
    } else {
      this.egresos.forEach((egreso, index) => {
        console.log(`${index + 1}. $${egreso.monto.toFixed(2)} - ${egreso.descripcion}`);
        console.log(`   Fecha: ${egreso.fecha}`);
      });
    }
    console.log('='.repeat(50));
  }
}

function mostrarMenu() {
  console.log('\n' + '='.repeat(50));
  console.log('GESTOR DE FINANZAS PERSONALES');
  console.log('='.repeat(50));
  console.log('1. Agregar Ingreso');
  console.log('2. Agregar Egreso/Gasto');
  console.log('3. Ver Resumen');
  console.log('4. Ver Detalle de Ingresos');
  console.log('5. Ver Detalle de Egresos');
  console.log('6. Salir');
  console.log('='.repeat(50));
}

function main() {
  const gestor = new GestorFinanzas();
  let continuar = true;

  console.log('\n¡Bienvenido al Gestor de Finanzas Personales!\n');

  while (continuar) {
    mostrarMenu();
    const opcion = readlineSync.question('Seleccione una opcion: ');

    switch (opcion) {
      case '1':
        const descripcionIngreso = readlineSync.question('\nDescripcion del ingreso: ');
        const montoIngreso = parseFloat(readlineSync.question('Monto: $'));
        if (!isNaN(montoIngreso) && montoIngreso > 0) {
          gestor.agregarIngreso(descripcionIngreso, montoIngreso);
        } else {
          console.log('\n✗ Error: Ingrese un monto valido.');
        }
        break;

      case '2':
        const descripcionEgreso = readlineSync.question('\nDescripcion del egreso/gasto: ');
        const montoEgreso = parseFloat(readlineSync.question('Monto: $'));
        if (!isNaN(montoEgreso) && montoEgreso > 0) {
          gestor.agregarEgreso(descripcionEgreso, montoEgreso);
        } else {
          console.log('\n✗ Error: Ingrese un monto valido.');
        }
        break;

      case '3':
        gestor.mostrarResumen();
        break;

      case '4':
        gestor.mostrarDetalleIngresos();
        break;

      case '5':
        gestor.mostrarDetalleEgresos();
        break;

      case '6':
        console.log('\n¡Hasta luego! Gracias por usar el Gestor de Finanzas.\n');
        continuar = false;
        break;

      default:
        console.log('\n✗ Opcion invalida. Por favor, seleccione una opcion valida.');
    }

    if (continuar) {
      readlineSync.question('\nPresione Enter para continuar...');
    }
  }
}

main();
