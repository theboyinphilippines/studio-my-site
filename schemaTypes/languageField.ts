import {defineField} from 'sanity'

/**
 * Shared by every translatable document type, and managed entirely by the
 * documentInternationalization plugin — editors never touch it directly.
 *
 * Read-only and hidden on purpose: the language is set by the plugin when a
 * translation is created from a document's Translations menu, or by the
 * per-language "New document" templates ("Español Hero"). Letting it be edited
 * by hand would let a document change language without the translation
 * metadata following it.
 *
 * The plugin's `languageField` is configured to this same name, and the
 * frontend queries filter on `language`, so the field must keep this name.
 */
export const languageField = () =>
  defineField({
    name: 'language',
    title: 'Language',
    type: 'string',
    readOnly: true,
    hidden: true,
  })
