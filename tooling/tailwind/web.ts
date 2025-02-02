import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

import base from './base'

export default {
  content: base.content,
  plugins: [animate],
  presets: [base],
} satisfies Config
