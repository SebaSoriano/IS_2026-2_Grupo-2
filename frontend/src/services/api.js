export const API_BASE_URL = '/api'

async function getJson(path) {
  const response = await fetch(`${API_BASE_URL}${path}`)
  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes('application/json')) {
    throw new Error('La API devolvió una respuesta que no es JSON.')
  }

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error ?? `Error HTTP ${response.status}`)
  }

  return data
}

export function getApiHealth() {
  return getJson('/health')
}

export async function getInsumos() {
  const insumos = await getJson('/insumos')

  if (!Array.isArray(insumos)) {
    throw new Error('La respuesta de la API de inventario no es válida.')
  }

  return insumos
}

async function postJson(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes('application/json')) {
    throw new Error('La API devolvió una respuesta que no es JSON.')
  }

  const data = await response.json()

  if (!response.ok) {
    const error = new Error(data.error ?? `Error HTTP ${response.status}`)
    error.details = data.details ?? []
    throw error
  }

  return data
}
// Para PUT y DELETE. Igual que postJson, pero el método se elige
// y el body es opcional (DELETE no lleva body).
async function sendJson(method, path, body) {
  const options = { method }

  if (body !== undefined) {
    options.headers = { 'Content-Type': 'application/json' }
    options.body = JSON.stringify(body)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, options)

  // 204 significa "todo bien, pero no hay nada que devolver" (lo que responde el DELETE)
  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes('application/json')) {
    throw new Error('La API devolvió una respuesta que no es JSON.')
  }

  const data = await response.json()

  if (!response.ok) {
    const error = new Error(data.error ?? `Error HTTP ${response.status}`)
    error.details = data.details ?? []
    throw error
  }

  return data
}

export async function getAnimales() {
  const animales = await getJson('/animales')

  if (!Array.isArray(animales)) {
    throw new Error('La respuesta de la API de animales no es válida.')
  }

  return animales
}

export function actualizarAnimal(id, animal) {
  return sendJson('PUT', `/animales/${id}`, animal)
}

export function eliminarAnimal(id) {
  return sendJson('DELETE', `/animales/${id}`)
}

export function crearAnimal(animal) {
  return postJson('/animales', animal)
}

export function crearInsumo(insumo) {
  return postJson('/insumos', insumo)
}

// horario semanal: los 7 dias (1 = Lunes ... 7 = Domingo) con sus turnos
export async function getHorarios() {
  const horarios = await getJson('/horarios')

  if (!Array.isArray(horarios)) {
    throw new Error('La respuesta de la API de horario no es válida.')
  }

  return horarios
}

// usuarios cuyo nombre contiene el texto escrito, sin importar mayusculas
export function buscarUsuarios(nombre) {
  return getJson(`/horarios/usuarios?nombre=${encodeURIComponent(nombre)}`)
}

export function crearTurno(turno) {
  return postJson('/turnos', turno)
}

export function actualizarTurno(id, turno) {
  return sendJson('PUT', `/turnos/${id}`, turno)
}

export function eliminarTurno(id) {
  return sendJson('DELETE', `/turnos/${id}`)
}

// asistencia de un mes ("AAAA-MM"): todos los usuarios con sus dias de turno y sus asistencias marcadas
export async function getAsistencias(mes) {
  const usuarios = await getJson(`/asistencias?mes=${mes}`)

  if (!Array.isArray(usuarios)) {
    throw new Error('La respuesta de la API de asistencia no es válida.')
  }

  return usuarios
}

// marca que el usuario llego a la hora ese dia ("AAAA-MM-DD")
export function marcarAsistencia(rut_usuario, fecha) {
  return postJson('/asistencias', { rut_usuario, fecha })
}

export function desmarcarAsistencia(id) {
  return sendJson('DELETE', `/asistencias/${id}`)
}
