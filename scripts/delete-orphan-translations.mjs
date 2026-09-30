/**
 * Deletes translation drafts that match a job file but are no longer linked.
 *
 * Run after a create-translations run whose metadata links were lost: the
 * drafts still exist, but nothing references them, so re-running the create
 * script would produce a second copy rather than repairing the link.
 *
 * A draft is only deleted when its translated field values match a job entry
 * exactly, so drafts authored by hand (or by AI Assist in the Studio) are left
 * alone even when they cover the same document and language.
 *
 * Usage:
 *   SANITY_API_WRITE_TOKEN=... node scripts/delete-orphan-translations.mjs jobs.json [--dry-run]
 */
import {createClient} from '@sanity/client'
import {readFile} from 'node:fs/promises'

const [jobPath, ...flags] = process.argv.slice(2)
const dryRun = flags.includes('--dry-run')

if (!jobPath) {
  console.error('Usage: node scripts/delete-orphan-translations.mjs <jobs.json> [--dry-run]')
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

const jobs = JSON.parse(await readFile(jobPath, 'utf8'))

const drafts = await client.fetch(
  `*[_id in path("drafts.**") && _type in $types]{_id, _type, language, title, description}`,
  {types: [...new Set(jobs.map((job) => job.type))]},
  {perspective: 'raw'},
)

console.log(`${drafts.length} draft(s) of the job types\n`)

const matches = (draft, fields) =>
  Object.entries(fields).every(([key, value]) => draft[key] === value)

const toDelete = []
const claimed = new Set()

for (const job of jobs) {
  for (const [language, fields] of Object.entries(job.translations)) {
    const hit = drafts.find(
      (draft) =>
        !claimed.has(draft._id) &&
        draft._type === job.type &&
        draft.language === language &&
        matches(draft, fields),
    )

    if (hit) {
      claimed.add(hit._id)
      toDelete.push(hit._id)
      console.log(`  ${hit._id}  ${job.type} ${language}`)
    }
  }
}

console.log(`\nmatched ${toDelete.length} draft(s) created from this job file`)

if (toDelete.length === 0) {
  process.exit(0)
}

if (dryRun) {
  console.log('[dry run] nothing deleted')
  process.exit(0)
}

const transaction = client.transaction()
for (const id of toDelete) {
  transaction.delete(id)
}
await transaction.commit()
console.log(`✓ deleted ${toDelete.length} draft(s)`)
