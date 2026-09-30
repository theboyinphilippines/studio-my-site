import {defineField, defineType} from 'sanity'
import {languageField} from './languageField'

export const heroType = defineType({
  name: 'hero',
  title: 'Hero',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    languageField(),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'path',
      title: 'Path',
      type: 'string',
      description: 'Site-relative path the CTA links to, e.g. /products or /contact',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'imageUrl',
      title: 'Image URL',
      type: 'image',
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'path'},
  },
  orderings: [
    {
      title: 'Title',
      name: 'title',
      by: [{field: 'title', direction: 'asc'}],
    },
  ],
})
