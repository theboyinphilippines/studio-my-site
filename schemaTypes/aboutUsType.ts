import {defineArrayMember, defineField, defineType} from 'sanity'
import {languageField} from './languageField'

export const aboutUsType = defineType({
  name: 'aboutUs',
  title: 'About Us',
  type: 'document',
  fields: [
    languageField(),
    defineField({
      name: 'storyDescription',
      title: 'Story Description',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'imageList',
      title: 'Image List',
      type: 'array',
      of: [defineArrayMember({type: 'image', options: {hotspot: true}})],
    }),
  ],
  preview: {
    select: {title: 'storyDescription'},
  },
  orderings: [
    {
      title: 'Story Description',
      name: 'storyDescription',
      by: [{field: 'storyDescription', direction: 'asc'}],
    },
  ],
})
