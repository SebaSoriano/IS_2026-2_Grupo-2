const API_BASE_URL = '/api'

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

// para POST, PUT y DELETE: envia el body como JSON y junta los mensajes de validacion de Zod
async function sendJson(path, method, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

  // el DELETE responde 204 sin contenido
  if (response.status === 204) return null

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    throw new Error('La API devolvió una respuesta que no es JSON.')
  }

  const data = await response.json()

  if (!response.ok) {
    const detalles = data.details?.map((detalle) => detalle.mensaje).join('. ')
    throw new Error(detalles || data.error || `Error HTTP ${response.status}`)
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
  return sendJson('/turnos', 'POST', turno)
}

export function actualizarTurno(id, turno) {
  return sendJson(`/turnos/${id}`, 'PUT', turno)
}

export function eliminarTurno(id) {
  return sendJson(`/turnos/${id}`, 'DELETE')
}
