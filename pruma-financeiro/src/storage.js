/**
 * storage.js — Camada de persistência do Pruma Financeiro
 *
 * Modos de operação:
 * ─────────────────────────────────────────────────────────
 * 1. localStorage (padrão, sem configuração)
 *    Dados ficam no navegador de cada usuário.
 *    Bom para testar. NÃO compartilha entre os 3 sócios.
 *
 * 2. Supabase (recomendado para uso real entre os sócios)
 *    Configure as variáveis no .env e os 3 veem os mesmos dados.
 *    Ver instruções no README.md.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

let _client = null

async function getClient() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null
  if (_client) return _client
  const { createClient } = await import('@supabase/supabase-js')
  _client = createClient(SUPABASE_URL, SUPABASE_KEY)
  return _client
}

export const storage = {
  /**
   * Recupera um valor pelo key.
   * Retorna { value: string } para compatibilidade com a API original,
   * ou null se não encontrado.
   */
  async get(key) {
    const sb = await getClient()
    if (sb) {
      const { data, error } = await sb
        .from('kv_store')
        .select('value')
        .eq('key', key)
        .maybeSingle()
      if (error) console.error('[storage.get]', error.message)
      return data ? { value: data.value } : null
    }
    const val = localStorage.getItem(key)
    return val !== null ? { value: val } : null
  },

  /**
   * Salva um valor (string JSON) pelo key.
   */
  async set(key, value) {
    const sb = await getClient()
    if (sb) {
      const { error } = await sb
        .from('kv_store')
        .upsert({ key, value, updated_at: new Date().toISOString() })
      if (error) console.error('[storage.set]', error.message)
      return
    }
    localStorage.setItem(key, value)
  },

  /**
   * Remove um valor pelo key.
   */
  async delete(key) {
    const sb = await getClient()
    if (sb) {
      await sb.from('kv_store').delete().eq('key', key)
      return
    }
    localStorage.removeItem(key)
  },
}
