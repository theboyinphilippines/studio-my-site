/**
 * Creates translated documents for the documentInternationalization setup.
 *
 * This mirrors, byte for byte, what the plugin's own "create translation"
 * action does when you click it in the Studio:
 *
 *   1. a DRAFT copy of the source document under a fresh id, with the
 *      `language` field set to the target language and the translated field
 *      values swapped in;
 *   2. a `translation.metadata` document holding a weak reference to the source
 *      and to each translation, which is how the Studio's Translations menu
 *      discovers them (it looks up `*[references($id)]`).
 *
 * Running this is equivalent to clicking through the Studio, except the
 * translated text comes from the job file rather than from Sanity's AI. It
 * creates DRAFTS only — nothing is visible on the site until each is published.
 *
 * Usage:
 *   SANITY_API_WRITE_TOKEN=... node scripts/create-translations.mjs jobs.json [--dry-run]
 *
 * The job file is an array of:
 *   {
 *     "sourceId": "<published document id>",
 *     "type": "<schema type>",
 *     "translations": { "es": { "title": "...", ... }, ... }
 *   }
 * Only the fields listed under a language are replaced; everything else (images,
 * paths, references) is carried over from the source untouched.
 */
import {createClient} from '@sanity/client'
import {randomUUID} from 'node:crypto'
import {readFile} from 'node:fs/promises'

const PROJECT_ID = 'hgjts5tp'
const DATASET = 'production'
const API_VERSION = '2025-02-19'
const METADATA_TYPE = 'translation.metadata'

const [jobPath, ...flags] = process.argv.slice(2)
const dryRun = flags.includes('--dry-run')

if (!jobPath) {
  console.error('Usage: node scripts/create-translations.mjs <jobs.json> [--dry-run]')
  process.exit(1)
}

const token = process.env.SANITY_API_WRITE_TOKEN
if (!token && !dryRun) {
  console.error('SANITY_API_WRITE_TOKEN is required (or pass --dry-run)')
  process.exit(1)
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  token,
  useCdn: false,
})

/** Reference shape the plugin writes into translation.metadata.translations. */
function createReference(language, ref, type) {
  return {
    language,
    _key: Math.random().toString(36).slice(2, 12),
    _type: 'internationalizedArrayReferenceValue',
    value: {
      _type: 'reference',
      _ref: ref,
      _weak: true,
      _strengthenOnPublish: {type},
    },
  }
}

/** Everything except Sanity's own bookkeeping, so the copy keeps the content. */
function contentFields(document) {
  const {_id, _rev, _createdAt, _updatedAt, ...rest} = document
  return rest
}

const publishedId = (id) => id.replace(/^drafts\./, '')

async function runJob(job) {
  const sourceId = publishedId(job.sourceId)
  const source = await client.getDocument(sourceId)

  if (!source) {
    console.error(`  ✗ ${sourceId}: no such document — skipped`)
    return
  }

  const existingMetadata = await client.fetch(
    `*[_type == $type && references($id)][0]{_id, translations}`,
    {type: METADATA_TYPE, id: sourceId},
  )
  // An entry only counts as a real translation if it carries a reference — a
  // failed create can leave an entry with a language but no target document,
  // and treating that as "done" would silently skip the language forever.
  const existingTranslations = existingMetadata?.translations ?? []
  const linkedLanguages = new Set(
    existingTranslations.filter((entry) => entry.value?._ref).map((entry) => entry.language),
  )

  const references = [createReference(source.language ?? 'en', sourceId, job.type)]
  const translationDocs = []
  const creatingLanguages = new Set()

  for (const [language, fields] of Object.entries(job.translations)) {
    if (linkedLanguages.has(language)) {
      console.log(`  ↩ ${language}: already linked in the Studio — skipped`)
      continue
    }

    const translationId = randomUUID()
    translationDocs.push({
      ...contentFields(source),
      ...fields,
      _id: `drafts.${translationId}`,
      language,
    })
    references.push(createReference(language, translationId, job.type))
    creatingLanguages.add(language)
    console.log(`  + ${language}: ${Object.keys(fields).join(', ')}`)
  }

  if (translationDocs.length === 0) {
    return
  }

  if (dryRun) {
    console.log(`  (dry run — would create ${translationDocs.length} draft(s))`)
    return
  }

  const transaction = client.transaction()
  for (const doc of translationDocs) {
    transaction.create(doc)
  }

  if (existingMetadata) {
    // Rebuilt rather than appended, so a dangling entry for a language being
    // (re)created is replaced instead of sitting alongside the new one.
    const kept = existingTranslations.filter(
      (entry) => entry.value?._ref || !creatingLanguages.has(entry.language),
    )
    transaction.patch(client.patch(existingMetadata._id).set({translations: [...kept, ...references.slice(1)]}))
  } else {
    transaction.create({
      _id: randomUUID(),
      _type: METADATA_TYPE,
      schemaTypes: [job.type],
      translations: references,
    })
  }

  await transaction.commit()
  console.log(`  ✓ ${translationDocs.length} draft(s) created and linked`)
}

const jobs = JSON.parse(await readFile(jobPath, 'utf8'))
console.log(`${dryRun ? '[dry run] ' : ''}${jobs.length} document(s) to translate\n`)

for (const job of jobs) {
  console.log(`${job.type} ${job.sourceId}`)
  await runJob(job)
}

console.log('\nDone. Drafts are unpublished — review them in the Studio.')
