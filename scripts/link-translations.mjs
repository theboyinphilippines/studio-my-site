/**
 * Rebuilds translation.metadata links for a job file, reusing drafts that
 * already exist.
 *
 * Earlier runs created the translated drafts successfully but lost their
 * metadata links, so re-running create-translations.mjs would duplicate them
 * and leaving them alone would strand them. This reconciles the two: for each
 * source document and language it finds the already-created draft by matching
 * the translated field values, links it, and only creates a document when no
 * matching draft exists.
 *
 * Deletes nothing.
 *
 * Usage:
 *   SANITY_API_WRITE_TOKEN=... node scripts/link-translations.mjs jobs.json [--dry-run]
 */
import {createClient} from '@sanity/client'
import {randomUUID} from 'node:crypto'
import {readFile} from 'node:fs/promises'

const METADATA_TYPE = 'translation.metadata'

const [jobPath, ...flags] = process.argv.slice(2)
const dryRun = flags.includes('--dry-run')

if (!jobPath) {
  console.error('Usage: node scripts/link-translations.mjs <jobs.json> [--dry-run]')
  process.exit(1)
}

const token = process.env.SANITY_API_WRITE_TOKEN
if (!token) {
  console.error('SANITY_API_WRITE_TOKEN is required')
  process.exit(1)
}

const client = createClient({
  projectId: 'hgjts5tp',
  dataset: 'production',
  apiVersion: '2025-02-19',
  token,
  useCdn: false,
})

function createReference(language, ref, type) {
  return {
    language,
    _key: Math.random().toString(36).slice(2, 12),
    _type: 'internationalizedArrayReferenceValue',
    value: {_type: 'reference', _ref: ref, _weak: true, _strengthenOnPublish: {type}},
  }
}

function contentFields(document) {
  const {_id, _rev, _createdAt, _updatedAt, ...rest} = document
  return rest
}

const matches = (draft, fields) =>
  Object.entries(fields).every(([key, value]) => draft[key] === value)

const jobs = JSON.parse(await readFile(jobPath, 'utf8'))

const drafts = await client.fetch(
  `*[_id in path("drafts.**") && _type in $types]{_id, _type, language, title, description}`,
  {types: [...new Set(jobs.map((job) => job.type))]},
  {perspective: 'raw'},
)

console.log(`${drafts.length} existing draft(s) available to reuse\n`)

const claimed = new Set()
const transaction = client.transaction()
let reused = 0
let created = 0
let linked = 0

for (const job of jobs) {
  const sourceId = job.sourceId.replace(/^drafts\./, '')
  const source = await client.getDocument(sourceId)
  if (!source) {
    console.log(`  ✗ ${sourceId}: missing — skipped`)
    continue
  }

  const metadata = await client.fetch(
    `*[_type == $type && references($id)][0]{_id}`,
    {type: METADATA_TYPE, id: sourceId},
    {perspective: 'raw'},
  )

  const references = [createReference(source.language ?? 'en', sourceId, job.type)]
  const actions = []

  for (const [language, fields] of Object.entries(job.translations)) {
    const existing = drafts.find(
      (draft) =>
        !claimed.has(draft._id) &&
        draft._type === job.type &&
        draft.language === language &&
        matches(draft, fields),
    )

    let refId
    if (existing) {
      claimed.add(existing._id)
      refId = existing._id.replace(/^drafts\./, '')
      reused += 1
      actions.push(`${language}=reuse`)
    } else {
      refId = randomUUID()
      transaction.create({
        ...contentFields(source),
        ...fields,
        _id: `drafts.${refId}`,
        language,
      })
      created += 1
      actions.push(`${language}=new`)
    }

    references.push(createReference(language, refId, job.type))
  }

  console.log(`  ${job.type} ${sourceId}: ${actions.join(', ')}`)

  if (metadata) {
    transaction.patch(client.patch(metadata._id).set({translations: references}))
  } else {
    transaction.create({
      _id: randomUUID(),
      _type: METADATA_TYPE,
      schemaTypes: [job.type],
      translations: references,
    })
  }
  linked += 1
}

console.log(`\nreused ${reused}, creating ${created}, relinking ${linked} document(s)`)

if (dryRun) {
  console.log('[dry run] nothing written')
  process.exit(0)
}

await transaction.commit()
console.log('✓ committed')
