// Queries
export {
  listUsers,
  getUserById,
  getUserDetailById,
  getActiveRoles,
  getActiveRolesForSelect,
  getActiveUsersForSelect,
  type ListUsersInput,
  type ListedUser,
  type UserDetail,
  type ListUsersResult,
} from "./queries"


// Mutations
export {
  createUser,
  updateUser,
  softDeleteUser,
  hardDeleteUser,
  restoreUser,
  bulkSoftDeleteUsers,
  bulkRestoreUsers,
  bulkHardDeleteUsers,
  type AuthContext,
  ApplicationError,
  NotFoundError,
} from "./mutations"

// Validation types
export {
  type CreateUserSchema,
  type UpdateUserSchema,
} from "./validation"

// Helpers
export {
  mapUserRecord,
  buildWhereClause,
  serializeUserForTable,
  serializeUsersList,
  serializeUserDetail,
  type UserWithRoles,
} from "./helpers"

// Notifications
export {
  notifySuperAdminsOfUserAction,
} from "./notifications"

