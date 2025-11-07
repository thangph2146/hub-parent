/**
 * Shared Error Classes for Admin Features
 * 
 * Các error classes được dùng chung bởi tất cả admin features
 * để đảm bảo consistency và giảm duplicate code
 */

/**
 * Base application error class
 */
export class ApplicationError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
    this.name = "ApplicationError"
  }
}

/**
 * Forbidden error (403)
 * Thrown when user doesn't have required permissions
 */
export class ForbiddenError extends ApplicationError {
  constructor(message = "Forbidden") {
    super(message, 403)
    this.name = "ForbiddenError"
  }
}

/**
 * Not found error (404)
 * Thrown when resource doesn't exist
 */
export class NotFoundError extends ApplicationError {
  constructor(message = "Not found") {
    super(message, 404)
    this.name = "NotFoundError"
  }
}

