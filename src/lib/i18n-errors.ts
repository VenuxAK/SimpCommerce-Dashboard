import { useI18n } from 'vue-i18n'

const knownPatterns: Array<{ pattern: RegExp; key: string; map?: (m: RegExpMatchArray, extra?: string) => Record<string, any> }> = [
  { pattern: /The (.+) has already been taken\./, key: 'validation.already_taken', map: (m) => ({ attribute: fieldLabel(m[1]) }) },
  { pattern: /The (.+) field is required\./, key: 'validation.required', map: (m) => ({ attribute: fieldLabel(m[1]) }) },
  { pattern: /The selected (.+) is invalid\./, key: 'validation.invalid', map: (m) => ({ attribute: fieldLabel(m[1]) }) },
  { pattern: /(.+) must be at least (\d+) characters?\./, key: 'validation.min_string', map: (m) => ({ attribute: fieldLabel(m[1]), min: m[2] }) },
  { pattern: /(.+) must not be greater than (.+)\./, key: 'validation.max_numeric', map: (m) => ({ attribute: fieldLabel(m[1]), max: m[2] }) },
]

const fieldLabels: Record<string, string> = {
  name: 'products.product_name',
  category_id: 'products.category',
  base_price: 'products.base_price',
  description: 'common.description',
  image: 'products.image',
  sku: 'products.sku',
  size: 'products.size',
  color: 'products.color',
  price_adjustment: 'products.price_adj',
  stock_quantity: 'products.stock',
  email: 'auth.email',
  password: 'auth.password',
  role: 'users.role',
  phone: 'customers.phone',
  address: 'customers.address',
}

function fieldLabel(raw: string): string {
  const clean = raw.replace(/^the /i, '').trim()
  if (fieldLabels[clean]) return fieldLabels[clean]
  return clean.replace(/_/g, ' ')
}

function formatFieldKey(field: string): string {
  const { t } = useI18n()
  const bare = field.split('.').pop() || field
  const clean = bare.replace(/^\d+$/, '').trim()
  if (fieldLabels[clean]) return t(fieldLabels[clean])
  if (bare.match(/^\d+$/)) return `#${parseInt(bare) + 1}`
  return clean.replace(/_/g, ' ')
}

export function translateError(message: string): string {
  const { t } = useI18n()

  for (const { pattern, key, map } of knownPatterns) {
    const match = message.match(pattern)
    if (match) {
      const params = map ? map(match) : {}
      return t(key, params)
    }
  }

  return t('common.error')
}

export function firstError(errors: Record<string, string[]> | null | undefined, field: string): string | null {
  if (!errors || !errors[field] || errors[field].length === 0) return null
  return translateError(errors[field][0])
}

export function flattenErrors(errors: Record<string, string[]> | null | undefined): string {
  if (!errors) return ''
  return Object.values(errors)
    .flat()
    .map(translateError)
    .join(', ')
}

export function formatFieldErrors(errors: Record<string, string[]>): Array<{ label: string; messages: string[] }> {
  const result: Array<{ label: string; messages: string[] }> = []
  for (const [field, msgs] of Object.entries(errors)) {
    result.push({
      label: formatFieldKey(field),
      messages: msgs.map(translateError),
    })
  }
  return result
}
