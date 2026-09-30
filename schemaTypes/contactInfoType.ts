import {defineField, defineType} from 'sanity'
import {languageField} from './languageField'

export const contactInfoType = defineType({
  name: 'contactInfo',
  title: 'Contact Info',
  type: 'document',
  fields: [
    languageField(),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (rule) => rule.required().email(),
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
    }),
    defineField({
      name: 'whatsapp',
      title: 'WhatsApp',
      type: 'string',
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'string',
    }),
    defineField({
      name: 'youtube',
      title: 'YouTube',
      type: 'string',
      description: 'Full URL, e.g. https://youtube.com/@yourchannel',
    }),
    defineField({
      name: 'facebook',
      title: 'Facebook',
      type: 'string',
      description: 'Full URL, e.g. https://facebook.com/yourpage',
    }),
    defineField({
      name: 'instagram',
      title: 'Instagram',
      type: 'string',
      description: 'Full URL, e.g. https://instagram.com/yourhandle',
    }),
  ],
  preview: {
    select: {title: 'email', subtitle: 'phone'},
  },
  orderings: [
    {
      title: 'Email',
      name: 'email',
      by: [{field: 'email', direction: 'asc'}],
    },
  ],
})
