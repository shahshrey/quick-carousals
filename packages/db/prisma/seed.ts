import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import type { Database } from './types'

// Create database connection
const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: process.env.POSTGRES_URL,
  }),
})

const db = new Kysely<Database>({ dialect })

// 8 Default StyleKits based on PRD
const styleKits = [
  {
    id: 'minimal_clean',
    name: 'Minimal Clean',
    typography: {
      headline_font: 'Inter',
      headline_weight: 700,
      body_font: 'Inter',
      body_weight: 400,
    },
    colors: {
      background: '#FFFFFF',
      foreground: '#000000',
      accent: '#F5F5F5',
    },
    spacingRules: {
      padding: 'normal',
      line_height: 1.5,
    },
    isPremium: false,
  },
  {
    id: 'high_contrast_punch',
    name: 'High Contrast Punch',
    typography: {
      headline_font: 'Poppins',
      headline_weight: 800,
      body_font: 'Inter',
      body_weight: 600,
    },
    colors: {
      background: '#000000',
      foreground: '#FFFFFF',
      accent: '#FF5733',
    },
    spacingRules: {
      padding: 'tight',
      line_height: 1.3,
    },
    isPremium: false,
  },
  {
    id: 'marker_highlight',
    name: 'Marker Highlight',
    typography: {
      headline_font: 'Poppins',
      headline_weight: 700,
      body_font: 'Inter',
      body_weight: 400,
    },
    colors: {
      background: '#FFFEF9',
      foreground: '#1A1A1A',
      accent: '#FFE866',
      marker: '#FFEB3B',
    },
    spacingRules: {
      padding: 'normal',
      line_height: 1.6,
    },
    isPremium: false,
  },
  {
    id: 'sticky_note',
    name: 'Sticky Note / Notebook',
    typography: {
      headline_font: 'Source Sans Pro',
      headline_weight: 700,
      body_font: 'Source Sans Pro',
      body_weight: 400,
    },
    colors: {
      background: '#FFFACD',
      foreground: '#2C2C2C',
      accent: '#FFD700',
    },
    spacingRules: {
      padding: 'roomy',
      line_height: 1.7,
    },
    isPremium: false,
  },
  {
    id: 'corporate_pro',
    name: 'Corporate Pro',
    typography: {
      headline_font: 'Source Sans Pro',
      headline_weight: 700,
      body_font: 'Source Sans Pro',
      body_weight: 400,
    },
    colors: {
      background: '#FAFAFA',
      foreground: '#1A1A1A',
      accent: '#0052CC',
    },
    spacingRules: {
      padding: 'normal',
      line_height: 1.5,
    },
    isPremium: true,
  },
  {
    id: 'gradient_modern',
    name: 'Gradient Modern',
    typography: {
      headline_font: 'Poppins',
      headline_weight: 700,
      body_font: 'Inter',
      body_weight: 400,
    },
    colors: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      foreground: '#FFFFFF',
      accent: '#F093FB',
    },
    spacingRules: {
      padding: 'normal',
      line_height: 1.5,
    },
    isPremium: true,
  },
  {
    id: 'dark_mode_punch',
    name: 'Dark Mode Punch',
    typography: {
      headline_font: 'Poppins',
      headline_weight: 800,
      body_font: 'Inter',
      body_weight: 500,
    },
    colors: {
      background: '#0D0D0D',
      foreground: '#FFFFFF',
      accent: '#00E5FF',
    },
    spacingRules: {
      padding: 'normal',
      line_height: 1.5,
    },
    isPremium: true,
  },
  {
    id: 'soft_pastel',
    name: 'Soft Pastel',
    typography: {
      headline_font: 'Lora',
      headline_weight: 700,
      body_font: 'Source Sans Pro',
      body_weight: 400,
    },
    colors: {
      background: '#FFF5F5',
      foreground: '#2D3748',
      accent: '#FFB6C1',
    },
    spacingRules: {
      padding: 'roomy',
      line_height: 1.6,
    },
    isPremium: true,
  },
]

async function seed() {
  console.log('🌱 Seeding database with default StyleKits...')

  try {
    // Check if StyleKits already exist
    const existing = await db
      .selectFrom('StyleKit')
      .selectAll()
      .execute()

    if (existing.length > 0) {
      console.log(`✓ Database already contains ${existing.length} StyleKits`)
      console.log('Skipping seed to avoid duplicates')
      return
    }

    // Insert StyleKits
    for (const kit of styleKits) {
      await db
        .insertInto('StyleKit')
        .values(kit)
        .execute()
      
      console.log(`✓ Created StyleKit: ${kit.name} (${kit.id})`)
    }

    console.log(`\n✅ Successfully seeded ${styleKits.length} StyleKits`)
    console.log(`   - Free kits: ${styleKits.filter(k => !k.isPremium).length}`)
    console.log(`   - Premium kits: ${styleKits.filter(k => k.isPremium).length}`)
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  } finally {
    await db.destroy()
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('\n✨ Seeding complete!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Seeding failed:', error)
      process.exit(1)
    })
}

export { seed }
