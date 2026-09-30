import {defineField, defineType} from 'sanity'
import {languageField} from './languageField'

export const contentMediaType = defineType({
  name: 'contentMedia',
  title: 'Content Media',
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
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'video',
      title: 'Video',
      type: 'file',
      options: {accept: 'video/*'},
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'description'},
  },
  orderings: [
    {
      title: 'Title',
      name: 'title',
      by: [{field: 'title', direction: 'asc'}],
    },
  ],
})
