// eslint-disable-next-line no-restricted-imports
import { Dayjs } from "dayjs"

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
