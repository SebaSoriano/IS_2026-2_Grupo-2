import { crearSchema, texto, entero, decimal, booleanoTexto } from './validadores.js';

// Reglas para las columnas que HOY tiene la tabla "animales".
// Mientras no exista una columna propia, el estado general se escribe en observaciones_animal.
const reglasAnimal = {
  especie_animal:       { validar: (valor) => texto(valor, { min: 2, max: 100 }) },
  via_ingreso:          { validar: (valor) => texto(valor, { min: 2, max: 100 }) },
  edad:                 { validar: (valor) => entero(valor, { min: 0, max: 40 }) },         // edad estimada, en años
  peso_animal:          { validar: (valor) => decimal(valor, { min: 0.01, max: 150 }) },    // en kg
  observaciones_animal: { validar: (valor) => texto(valor, { max: 1000 }), opcional: true },
};

// POST /api/animales
export const createAnimalSchema = crearSchema(reglasAnimal);

// PUT /api/animales/:id: todos los campos opcionales, pero debe venir al menos uno
const validarCambios = crearSchema(reglasAnimal, { parcial: true });

export const updateAnimalSchema = (entrada) => {
  const resultado = validarCambios(entrada);
  if (resultado.errores.length === 0 && Object.keys(resultado.datos).length === 0) {
    resultado.errores.push({ campo: 'body', mensaje: 'Debe enviar al menos un campo para modificar' });
  }
  return resultado;
};

// GET /api/animales?especie=perro&adoptado=true
export const filterAnimalSchema = crearSchema({
  especie:  { validar: (v) => texto(v, { max: 100 }), opcional: true },
  adoptado: { validar: booleanoTexto, transformar: (v) => v === 'true', opcional: true },
});