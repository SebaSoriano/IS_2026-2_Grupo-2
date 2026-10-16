import * as usuarioService from '../services/usuario.service.js';

// GET /api/usuarios
export const getUsuarios = async (req, res) => {
  const usuarios = await usuarioService.obtenerUsuarios();
  res.json(usuarios);
};

// PUT /api/usuarios/:rut
export const updateUsuario = async (req, res) => {
  const usuario = await usuarioService.actualizarUsuario(req.params.rut, req.body);
  res.json(usuario);
};

// DELETE /api/usuarios/:rut
export const deleteUsuario = async (req, res) => {
  await usuarioService.eliminarUsuario(req.params.rut);
  res.status(204).send();
};