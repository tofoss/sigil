// eslint-disable-next-line no-restricted-imports
import dayjs, { Dayjs } from "dayjs"

export interface Article {
  id: string
  userId: string
  title: string
  content: string
  createdAt: Dayjs
  updatedAt: Dayjs
  publishedAt: Dayjs | undefined
  published: boolean
  isEditable?: boolean
}

export function fromJson(article: Article): Article {
  return {
    ...article,
    createdAt: dayjs(article.createdAt),
    updatedAt: dayjs(article.updatedAt),
    publishedAt: article.publishedAt ? dayjs(article.publishedAt) : undefined,
  }
}
