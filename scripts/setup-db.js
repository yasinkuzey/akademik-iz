import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Load env
const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env')
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''
const env = {}
envContent.split('\n').forEach(line => {
    const [k, v] = line.split('=')
    if (k && v) env[k.trim()] = v.trim()
})

console.log('--- Veritabanı Kurulum Sihirbazı ---')
console.log('Supabase URL:', env.VITE_SUPABASE_URL || 'YOK')

const sqlPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../supabase/migrations/001_schema.sql')
const sql = fs.readFileSync(sqlPath, 'utf8')

console.log('\nLütfen aşağıdaki SQL kodunu Supabase > SQL Editor kısmına yapıştırıp "Run" butonuna basın:\n')
console.log('--------------------------------------------------')
console.log(sql)
console.log('--------------------------------------------------')
console.log('\nNot: Eğer Service Role Key tanımlasaydınız bunu otomatik yapabilirdik. Şimdilik manuel kopyalama en güvenlisi.')
