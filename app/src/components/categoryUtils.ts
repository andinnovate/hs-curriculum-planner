const CATEGORY_COLORS: Record<string, string> = {
  Bible: '#7c3aed',
  'Language Arts': '#f59e0b',
  Math: '#2563eb',
  Science: '#10b981',
  'Social Sciences': '#f97316',
  'Fine Arts': '#ec4899',
  'Physical Education': '#ef4444',
  'General Electives': '#9ca3af',
}

const CATEGORY_KEYWORDS: { pattern: RegExp; color: string }[] = [
  { pattern: /science/i, color: '#10b981' },
  { pattern: /math/i, color: '#2563eb' },
  { pattern: /language|literature|writing/i, color: '#f59e0b' },
  { pattern: /history|social/i, color: '#f97316' },
  { pattern: /art|music/i, color: '#ec4899' },
  { pattern: /bible|theology|religion/i, color: '#7c3aed' },
  { pattern: /physical|health|pe/i, color: '#ef4444' },
]

const CATEGORY_ROLLUPS: Record<string, string> = {
  'Language Arts Electives': 'Language Arts',
  'Math Electives': 'Math',
  'Physical Science': 'Science',
  'Life Science': 'Science',
  'Earth Science': 'Science',
  'Science Electives': 'Science',
  History: 'Social Sciences',
  'Social Science Electives': 'Social Sciences',
  Electives: 'General Electives',
}

export function rollupCategory(category: string): string {
  return CATEGORY_ROLLUPS[category] ?? category
}

function hashToHue(value: string): number {
  let h = 0
  for (let i = 0; i < value.length; i += 1) {
    h = (h * 31 + value.charCodeAt(i)) % 360
  }
  return h
}

export function getCategoryColor(category: string): string {
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category]
  const hit = CATEGORY_KEYWORDS.find((entry) => entry.pattern.test(category))
  if (hit) return hit.color
  const hue = hashToHue(category)
  return `hsl(${hue} 60% 55%)`
}
