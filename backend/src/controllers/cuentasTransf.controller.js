import * as cuentasService from '../services/cuentasTransf.service.js';

export const getCuentasPublicas = async (req, res) => {
  res.json(await cuentasService.getCuentasPublicas());
};

export const getCuentas = async (req, res) => {
  res.json(await cuentasService.getAllCuentas());
};

export const createCuenta = async (req, res) => {
  res.status(201).json(await cuentasService.createCuenta(req.body));
};

export const updateCuenta = async (req, res) => {
  res.json(await cuentasService.updateCuenta(req.params.id, req.body));
};