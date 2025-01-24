// eslint-disable-next-line no-restricted-imports
import dayjs, { Dayjs } from "dayjs"

export interface Article {
  articleId: string
  articleUserId: string
  articleTitle: string
  articleContent: string
  articleCreatedAt: Dayjs
  articleUpdatedAt: Dayjs
  articlePublishedAt: Dayjs | undefined
  articlePublished: boolean
}

export function fromJson(article: Article): Article {
  return {
    ...article,
    articleCreatedAt: dayjs(article.articleCreatedAt),
    articleUpdatedAt: dayjs(article.articleUpdatedAt),
    articlePublishedAt: article.articlePublishedAt
      ? dayjs(article.articlePublishedAt)
      : undefined,
  }
}
