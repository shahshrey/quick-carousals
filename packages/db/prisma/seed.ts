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

// 9 Default TemplateLayouts based on PRD architecture
const templateLayouts = [
  {
    id: 'hook_big_headline',
    name: 'Hook: Big Headline',
    category: 'hook',
    slideType: 'hook',
    layersBlueprint: {
      layers: [
        { type: 'background', properties: {} },
        {
          type: 'text_box',
          id: 'headline',
          position: { x: 60, y: 400, width: 960, height: 400 },
          constraints: { max_lines: 3, min_font: 48, max_font: 72 },
          align: 'center',
        },
      ],
    },
  },
  {
    id: 'promise_two_column',
    name: 'Promise: Two Column',
    category: 'promise',
    slideType: 'promise',
    layersBlueprint: {
      layers: [
        { type: 'background', properties: {} },
        {
          type: 'text_box',
          id: 'headline',
          position: { x: 60, y: 100, width: 960, height: 120 },
          constraints: { max_lines: 2, min_font: 32, max_font: 48 },
        },
        {
          type: 'text_box',
          id: 'body_left',
          position: { x: 60, y: 280, width: 450, height: 900 },
          constraints: { max_lines: 8, min_font: 18, max_font: 24 },
        },
        {
          type: 'text_box',
          id: 'body_right',
          position: { x: 570, y: 280, width: 450, height: 900 },
          constraints: { max_lines: 8, min_font: 18, max_font: 24 },
        },
      ],
    },
  },
  {
    id: 'value_bullets',
    name: 'Value: Bullet List',
    category: 'value',
    slideType: 'list',
    layersBlueprint: {
      layers: [
        { type: 'background', properties: {} },
        {
          type: 'text_box',
          id: 'headline',
          position: { x: 60, y: 80, width: 960, height: 100 },
          constraints: { max_lines: 2, min_font: 28, max_font: 40 },
        },
        {
          type: 'text_box',
          id: 'body',
          position: { x: 60, y: 220, width: 960, height: 1000 },
          constraints: { max_lines: 6, min_font: 20, max_font: 28 },
          bulletStyle: 'disc',
        },
      ],
    },
  },
  {
    id: 'value_numbered_steps',
    name: 'Value: Numbered Steps',
    category: 'value',
    slideType: 'steps',
    layersBlueprint: {
      layers: [
        { type: 'background', properties: {} },
        {
          type: 'text_box',
          id: 'headline',
          position: { x: 60, y: 80, width: 960, height: 100 },
          constraints: { max_lines: 2, min_font: 28, max_font: 40 },
        },
        {
          type: 'text_box',
          id: 'body',
          position: { x: 60, y: 220, width: 960, height: 1000 },
          constraints: { max_lines: 5, min_font: 20, max_font: 28 },
          bulletStyle: 'numbered',
        },
      ],
    },
  },
  {
    id: 'value_text_left_visual_right',
    name: 'Value: Text Left, Visual Right',
    category: 'value',
    slideType: 'text_visual',
    layersBlueprint: {
      layers: [
        { type: 'background', properties: {} },
        {
          type: 'text_box',
          id: 'headline',
          position: { x: 60, y: 80, width: 520, height: 100 },
          constraints: { max_lines: 2, min_font: 28, max_font: 40 },
        },
        {
          type: 'text_box',
          id: 'body',
          position: { x: 60, y: 220, width: 520, height: 950 },
          constraints: { max_lines: 8, min_font: 18, max_font: 24 },
        },
        {
          type: 'visual_placeholder',
          id: 'image',
          position: { x: 640, y: 180, width: 380, height: 850 },
        },
      ],
    },
  },
  {
    id: 'value_centered_quote',
    name: 'Value: Centered Quote',
    category: 'value',
    slideType: 'quote',
    layersBlueprint: {
      layers: [
        { type: 'background', properties: {} },
        {
          type: 'text_box',
          id: 'quote',
          position: { x: 120, y: 350, width: 840, height: 600 },
          constraints: { max_lines: 4, min_font: 32, max_font: 52 },
          align: 'center',
          style: 'quote',
        },
        {
          type: 'text_box',
          id: 'attribution',
          position: { x: 120, y: 1000, width: 840, height: 80 },
          constraints: { max_lines: 1, min_font: 18, max_font: 24 },
          align: 'center',
        },
      ],
    },
  },
  {
    id: 'recap_grid',
    name: 'Recap: Grid Summary',
    category: 'recap',
    slideType: 'recap',
    layersBlueprint: {
      layers: [
        { type: 'background', properties: {} },
        {
          type: 'text_box',
          id: 'headline',
          position: { x: 60, y: 80, width: 960, height: 100 },
          constraints: { max_lines: 1, min_font: 32, max_font: 48 },
        },
        {
          type: 'text_box',
          id: 'body',
          position: { x: 60, y: 220, width: 960, height: 1000 },
          constraints: { max_lines: 5, min_font: 20, max_font: 28 },
          bulletStyle: 'numbered',
        },
      ],
    },
  },
  {
    id: 'cta_centered',
    name: 'CTA: Centered Call to Action',
    category: 'cta',
    slideType: 'cta',
    layersBlueprint: {
      layers: [
        { type: 'background', properties: {} },
        {
          type: 'text_box',
          id: 'headline',
          position: { x: 120, y: 400, width: 840, height: 200 },
          constraints: { max_lines: 2, min_font: 40, max_font: 64 },
          align: 'center',
        },
        {
          type: 'text_box',
          id: 'subtext',
          position: { x: 120, y: 650, width: 840, height: 150 },
          constraints: { max_lines: 2, min_font: 20, max_font: 28 },
          align: 'center',
        },
        {
          type: 'text_box',
          id: 'footer',
          position: { x: 120, y: 1150, width: 840, height: 100 },
          constraints: { max_lines: 2, min_font: 16, max_font: 20 },
          align: 'center',
        },
      ],
    },
  },
  {
    id: 'generic_single_focus',
    name: 'Generic: Single Focus',
    category: 'generic',
    slideType: 'generic',
    layersBlueprint: {
      layers: [
        { type: 'background', properties: {} },
        {
          type: 'text_box',
          id: 'headline',
          position: { x: 60, y: 80, width: 960, height: 120 },
          constraints: { max_lines: 2, min_font: 32, max_font: 48 },
        },
        {
          type: 'text_box',
          id: 'body',
          position: { x: 60, y: 240, width: 960, height: 950 },
          constraints: { max_lines: 8, min_font: 18, max_font: 26 },
        },
      ],
    },
  },
]

async function seed() {
  console.log('🌱 Seeding database with default StyleKits and TemplateLayouts...')

  try {
    // Check if StyleKits already exist
    const existingStyleKits = await db
      .selectFrom('StyleKit')
      .selectAll()
      .execute()

    if (existingStyleKits.length === 0) {
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
    } else {
      console.log(`✓ Database already contains ${existingStyleKits.length} StyleKits`)
      console.log('Skipping StyleKits seed to avoid duplicates')
    }

    // Check if TemplateLayouts already exist
    const existingLayouts = await db
      .selectFrom('TemplateLayout')
      .selectAll()
      .execute()

    if (existingLayouts.length === 0) {
      // Insert TemplateLayouts
      for (const layout of templateLayouts) {
        await db
          .insertInto('TemplateLayout')
          .values(layout)
          .execute()
        
        console.log(`✓ Created TemplateLayout: ${layout.name} (${layout.id})`)
      }

      console.log(`\n✅ Successfully seeded ${templateLayouts.length} TemplateLayouts`)
      console.log(`   - Hook: ${templateLayouts.filter(l => l.category === 'hook').length}`)
      console.log(`   - Promise: ${templateLayouts.filter(l => l.category === 'promise').length}`)
      console.log(`   - Value: ${templateLayouts.filter(l => l.category === 'value').length}`)
      console.log(`   - Recap: ${templateLayouts.filter(l => l.category === 'recap').length}`)
      console.log(`   - CTA: ${templateLayouts.filter(l => l.category === 'cta').length}`)
      console.log(`   - Generic: ${templateLayouts.filter(l => l.category === 'generic').length}`)
    } else {
      console.log(`✓ Database already contains ${existingLayouts.length} TemplateLayouts`)
      console.log('Skipping TemplateLayouts seed to avoid duplicates')
    }
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
