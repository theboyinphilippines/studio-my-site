import {defineField, defineType} from 'sanity'
import {languageField} from './languageField'

export const categoryType = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    languageField(),
  ],
  preview: {
    select: {title: 'title'},
  },
  orderings: [
    {
      title: 'Title',
      name: 'title',
      by: [{field: 'title', direction: 'asc'}],
    },
  ],
})
