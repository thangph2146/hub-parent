import { listComments } from "../server/queries"
import { serializeCommentsList } from "../server/helpers"
import { CommentsTableClient } from "./comments-table.client"

export interface CommentsTableProps {
  canDelete?: boolean
  canRestore?: boolean
  canManage?: boolean
  canApprove?: boolean
}

export async function CommentsTable({ canDelete, canRestore, canManage, canApprove }: CommentsTableProps) {
  const commentsData = await listComments({
    page: 1,
    limit: 10,
    filters: {
      deleted: false,
    },
  })

  return (
    <CommentsTableClient
      canDelete={canDelete}
      canRestore={canRestore}
      canManage={canManage}
      canApprove={canApprove}
      initialData={serializeCommentsList(commentsData)}
    />
  )
}

