/**
 * Removes translation.metadata entries that point at nothing.
 *
 * A failed translation create can leave an entry with a language but no target
 * document (or a reference to a document that was never written). The Studio
 * then shows that language as "Open translation" and errors when clicked,
 * rather than offering to create it.
 *
 * This drops only entries whose reference does not resolve. Entries backed by a
 * real document are left untouched, as is any metadata document that is already
 * intact.
 *
 * Usage:
 *   SANITY_API_WRITE_TOKEN=... node scripts/repair-translation-metadata.mjs [--dry-run]
 */
import {createClient} from '@sanity/client'

const PROJECT_ID = 'hgjts5tp'
const DATASET = 'production'
const API_VERSION = '2025-02-19'
const METADATA_TYPE = 'translation.metadata'

const dryRun = process.argv.includes('--dry-run')
const token = process.env.SANITY_API_WRITE_TOKEN

if (!token) {
  console.error('SANITY_API_WRITE_TOKEN is required')
  process.exit(1)
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  token,
  useCdn: false,
})

const metadataDocs = await client.fetch(
  `*[_type == $type]{_id, schemaTypes, translations}`,
  {type: METADATA_TYPE},
  {perspective: 'raw'},
)

const referencedIds = [
  ...new Set(
    metadataDocs.flatMap((doc) =>
      (doc.translations ?? []).map((entry) => entry.value?._ref).filter(Boolean),
    ),
  ),
]

const existingIds = new Set(
  referencedIds.length
    ? await client.fetch(`*[_id in $ids]._id`, {ids: referencedIds}, {perspective: 'raw'})
    : [],
)

console.log(`${metadataDocs.length} metadata documents, ${referencedIds.length} distinct references\n`)

let repaired = 0
const transaction = client.transaction()

for (const doc of metadataDocs) {
  const entries = doc.translations ?? []
  const keep = entries.filter((entry) => entry.value?._ref && existingIds.has(entry.value._ref))
  const dropped = entries.length - keep.length

  if (dropped === 0) {
    continue
  }

  repaired += 1
  console.log(`${doc._id} (${doc.schemaTypes?.[0] ?? '?'}) — dropping ${dropped} dangling entry/entries`)
  for (const entry of entries) {
    const ref = entry.value?._ref
    if (!ref || !existingIds.has(ref)) {
      console.log(`    - ${entry.language}: ${ref ?? 'no reference'}`)
    }
  }

  transaction.patch(client.patch(doc._id).set({translations: keep}))
}

if (repaired === 0) {
  console.log('Nothing to repair.')
} else if (dryRun) {
  console.log(`\n[dry run] would repair ${repaired} metadata document(s)`)
} else {
  await transaction.commit()
  console.log(`\n✓ repaired ${repaired} metadata document(s)`)
}
