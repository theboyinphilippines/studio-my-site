import {defineQuery} from 'next-sanity'

export const NAVIGATION_QUERY = defineQuery(`*[_type == "navigation" && language == $language][0]{
  items[]{
    label,
    href
  }
}`)

export const HERO_QUERY = defineQuery(`*[_type == "hero"][0]{
  title,
  description,
  path,
  "imageUrl": imageUrl.asset->url
}`)

export const HOT_PRODUCTS_QUERY = defineQuery(`*[_type == "productList"][0...6]{
  _id,
  title,
  path,
  "imageUrl": imageList[0].asset->url
}`)

export const CONTENT_MEDIA_QUERY = defineQuery(`*[_type == "contentMedia"][0]{
  title,
  description,
  "videoUrl": video.asset->url
}`)

export const PRODUCTS_QUERY = defineQuery(`*[_type == "productList"] | order(title asc){
  _id,
  title,
  path,
  "imageUrl": imageList[0].asset->url,
  "categoryId": category._ref
}`)

export const PRODUCT_CATEGORIES_QUERY = defineQuery(`*[_type == "category"] | order(title asc){
  _id,
  title
}`)

export const PRODUCT_BY_PATH_QUERY = defineQuery(`*[_type == "productList" && path == $path][0]{
  _id,
  title,
  description,
  path,
  "images": imageList[].asset->url,
  "category": category->{_id, title}
}`)

export const RELATED_PRODUCTS_QUERY = defineQuery(`*[_type == "productList" && category._ref == $categoryId && _id != $excludeId] | order(title asc)[0...3]{
  _id,
  title,
  path,
  "imageUrl": imageList[0].asset->url
}`)

export const BLOG_POSTS_QUERY = defineQuery(`*[_type == "blogList"] | order(createdTime desc){
  _id,
  title,
  description,
  author,
  createdTime,
  "label": label->title,
  "imageUrl": imageList[0].asset->url
}`)

export const BLOG_POST_BY_ID_QUERY = defineQuery(`*[_type == "blogList" && _id == $id][0]{
  _id,
  title,
  description,
  author,
  createdTime,
  "label": label->title,
  "images": imageList[].asset->url,
  body
}`)

export const ABOUT_US_QUERY = defineQuery(`*[_type == "aboutUs"][0]{
  storyDescription,
  "images": imageList[].asset->url
}`)

export const CONTACT_INFO_QUERY = defineQuery(`*[_type == "contactInfo"][0]{
  email,
  phone,
  whatsapp,
  address,
  youtube,
  facebook,
  instagram
}`)
