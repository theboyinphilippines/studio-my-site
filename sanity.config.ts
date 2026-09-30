import {assist} from '@sanity/assist'
import {documentInternationalization} from '@sanity/document-internationalization'
import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {schemaTypes} from './schemaTypes'

/**
 * Content types that exist once per language. Mirrors the locale set in the
 * frontend's lib/i18n/locales.ts, and each of these schemas declares the
 * `language` field the plugin manages.
 */
const TRANSLATABLE_TYPES = [
  'hero',
  'productList',
  'category',
  'contentMedia',
  'blogList',
  'aboutUs',
  'contactInfo',
  'navigation',
]

export default defineConfig({
  name: 'default',
  title: 'sanity-my-site',

  projectId: 'hgjts5tp',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.documentTypeListItem('inquiry').title('Inquiries'),
            S.divider(),
            ...S.documentTypeListItems().filter(
              (item) => item.getId() !== 'inquiry',
            ),
          ]),
    }),
    visionTool(),
    documentInternationalization({
      supportedLanguages: [
        {id: 'en', title: 'English'},
        {id: 'es', title: 'Español'},
        {id: 'de', title: 'Deutsch'},
        {id: 'ja', title: '日本語'},
      ],
      schemaTypes: TRANSLATABLE_TYPES,
      // Stated rather than left to the default, because the frontend's GROQ
      // queries filter on this exact field name.
      languageField: 'language',
    }),
    assist({
      translate: {
        // Document-level translation: each language is its own document, which
        // is what documentInternationalization manages. `languageField` must
        // match that plugin's config.
        document: {
          languageField: 'language',
          documentTypes: TRANSLATABLE_TYPES,
        },
        // Guidance for the translation model. It is a guide rather than a
        // rule — review the output. Edit freely; terminology here is the
        // cheapest lever on translation quality.
        styleguide:
          'This is B2B software marketing and documentation for a product called "Meridian". ' +
          'Never translate or transliterate "Meridian" — it is a product name. ' +
          'Keep product model names, version numbers and anything in ALL CAPS exactly as written. ' +
          'Use the formal register (German: Sie, Spanish: usted, Japanese: です／ます). ' +
          'Aim for natural, concise B2B wording rather than literal word-for-word translation. ' +
          'Never translate URLs, email addresses or phone numbers. ' +
          'Preserve headings, lists and links in rich text exactly as structured in the source.',
      },
    }),
  ],

  document: {
    // The plugin registers a template per type and language ("Español Hero")
    // that sets `language`, and those are what should be used. The generic
    // per-type entries would create documents with no language and no place
    // in a translation set, so they are dropped.
    newDocumentOptions: (prev) =>
      prev.filter((item) => !TRANSLATABLE_TYPES.includes(item.templateId)),
  },

  schema: {
    types: schemaTypes,
  },
})
