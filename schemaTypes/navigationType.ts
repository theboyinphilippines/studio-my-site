import {defineArrayMember, defineField, defineType} from 'sanity'
import {languageField} from './languageField'

export const navigationType = defineType({
  name: 'navigation',
  title: 'Navigation',
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
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [defineArrayMember({type: 'navItem'})],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'language'},
  },
  orderings: [
    {
      title: 'Language',
      name: 'language',
      by: [{field: 'language', direction: 'asc'}],
    },
  ],
})
