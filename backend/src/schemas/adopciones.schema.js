import { crearSchema, texto, rut, correo, telefono, fechaNoFutura } from './validadores.js';

export const createAdopcionSchema = crearSchema({
    //Datos de la adopcion
    fecha_adopcion: { validar: fechaNoFutura, transformar: (valor) => new Date(valor) },
    rut_usuario: { validar: rut },

    //Datos del adoptante
    nombre_adoptante: { validar: (valor) => texto(valor, {min: 2, max: 100}) },
    direccion: { validar: (valor) => texto(valor, {min: 5, max: 200}) },
    telefono: { validar: telefono },
    correo: { validar: correo },
    fecha_nacimiento: { validar: fechaNoFutura, transformar: (valor) => new Date(valor) },
    observaciones_adoptante: { validar: (valor) => texto(valor, {max: 500}), opcional: true },

})