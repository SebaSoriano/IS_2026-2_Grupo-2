// Nombres de los roles, iguales a los de la tabla Rol que crea el seed.
// Se escriben una sola vez aquí para no repetir textos sueltos como 'Admin'
// en cada ruta. Si algún día cambia el nombre de un rol en la base de datos,
// se cambia solo en este archivo, y el editor autocompleta ROLES.ADMIN al escribir.
export const ROLES = {
    ADMIN: 'Admin',
    VETERINARIA: 'Veterinaria',
    VOLUNTARIO: 'Voluntario',
};

// Roles que pueden crear, modificar y eliminar registros (todo lo que no sea leer).
// El Voluntario no está en la lista: él solo puede consultar.
export const ROLES_QUE_EDITAN = [ROLES.ADMIN, ROLES.VETERINARIA];

// Métodos HTTP que solo leen datos y no cambian nada en la base de datos.
// GET es el que usa la página para consultar; HEAD y OPTIONS los usa el navegador por su cuenta.
export const METODOS_DE_LECTURA = ['GET', 'HEAD', 'OPTIONS'];