import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Verifies the Supabase user from the Authorization header
 * @param {import('http').IncomingMessage} req 
 * @returns {Promise<{userId: string | null, error: string | null}>}
 */
export async function verifyUser(req) {
    const authHeader = req.headers['authorization']
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { userId: null, error: 'Ayrıcalıklı erişim gerekli' }
    }

    const token = authHeader.split(' ')[1]

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token)

        if (error || !user) {
            return { userId: null, error: 'Geçersiz veya süresi dolmuş oturum' }
        }

        return { userId: user.id, error: null }
    } catch (err) {
        console.error('Auth verification error:', err)
        return { userId: null, error: 'Kimlik doğrulama sırasında bir hata oluştu' }
    }
}
