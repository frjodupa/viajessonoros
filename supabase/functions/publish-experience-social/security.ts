// Pure guards: no environment access, SDK import, or network at module load.
export async function isAdminUser(client: {auth: {getUser: () => Promise<any>}; rpc: (name: string) => PromiseLike<any>}): Promise<boolean> {
  try {
    const {data, error} = await client.auth.getUser()
    if (error || !data?.user?.id) return false
    const result = await client.rpc('is_vs_admin')
    return !result.error && result.data === true
  } catch { return false }
}

export function approvedImageURL(value: string, supabaseURL: string): URL {
  if (typeof value !== 'string' || /[\\\u0000-\u0020]/.test(value) || /%2f|%5c|%2e|%25/i.test(value) || /(?:^|\/)\.{1,2}(?:\/|$)/.test(value)) throw new Error('URL de imagen no permitida.')
  const url = new URL(value), storage = new URL(supabaseURL)
  if (storage.protocol !== 'https:' || !/^[a-z0-9]{20}\.supabase\.co$/.test(storage.hostname) ||
      storage.port || storage.username || storage.password || storage.pathname !== '/' || storage.search || storage.hash ||
      url.protocol !== 'https:' || url.origin !== storage.origin ||
      url.username || url.password || url.search || url.hash ||
      !url.pathname.startsWith('/storage/v1/object/public/eventos/') ||
      !/\.(?:jpe?g|png|webp)$/i.test(url.pathname)) throw new Error('La imagen debe pertenecer al bucket público eventos de este proyecto.')
  const parts = url.pathname.slice('/storage/v1/object/public/eventos/'.length).split('/')
  if (parts.some(part => !part || ['.', '..'].includes(decodeURIComponent(part)))) throw new Error('Ruta de imagen no permitida.')
  return url
}

export async function validateStorageImage(value: string, network: string, supabaseURL: string, fetchImpl: typeof fetch = fetch): Promise<void> {
  const url = approvedImageURL(value, supabaseURL)
  const limit = 8 * 1024 * 1024
  const response = await fetchImpl(url, {method:'GET', redirect:'error', signal:AbortSignal.timeout(8000)})
  const reader = response.body?.getReader()
  try {
    if (!response.ok) throw new Error('La imagen no está disponible.')
    const type = (response.headers.get('content-type') || '').split(';')[0].toLowerCase()
    const allowed = network === 'instagram' ? ['image/jpeg'] : ['image/jpeg','image/png','image/webp']
    if (!allowed.includes(type)) throw new Error('Formato de imagen no permitido para esta red.')
    const declaredLength = response.headers.get('content-length')
    const length = Number(declaredLength || 0)
    if ((declaredLength !== null && !/^\d+$/.test(declaredLength)) || length > limit || !reader) throw new Error('Tamaño de imagen no permitido.')
    let size = 0
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      size += chunk.value.byteLength
      if (size > limit) throw new Error('La imagen supera 8 MB.')
    }
    if (!size) throw new Error('La imagen está vacía.')
  } finally { await reader?.cancel().catch(() => {}) }
}
