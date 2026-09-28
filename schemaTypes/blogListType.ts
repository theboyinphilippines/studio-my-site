import {defineArrayMember, defineField, defineType} from 'sanity'

export const blogListType = defineType({
  name: 'blogList',
  title: 'Blog List',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'reference',
      to: [{type: 'label'}],
      options: {disableNew: true},
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'string',
    }),
    defineField({
      name: 'createdTime',
      title: 'Created Time',
      type: 'date',
    }),
    defineField({
      name: 'imageList',
      title: 'Image List',
      type: 'array',
      of: [defineArrayMember({type: 'image', options: {hotspot: true}})],
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
