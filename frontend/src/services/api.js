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
