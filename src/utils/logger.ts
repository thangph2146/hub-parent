/**
 * Logger utility cho development
 * Hiển thị thời gian, vị trí file, và chi tiết log
 * Hoạt động được cả client-side và server-side
 */

type LogLevel = "info" | "warn" | "error" | "debug" | "success"

// Kiểm tra môi trường (hoạt động cả client và server)
const isServer = typeof window === "undefined"
const isDevelopment = 
  (isServer && process.env.NODE_ENV === "development") ||
  (!isServer && (process.env.NODE_ENV === "development" || window.location.hostname === "localhost"))
const LOG_ENABLED = isDevelopment || 
  (isServer ? process.env.DEBUG === "true" : false) ||
  (!isServer ? (typeof window !== "undefined" && (window as { __DEBUG__?: boolean }).__DEBUG__ === true) : false)

/**
 * Lấy vị trí file từ stack trace
 */
const getCallerInfo = (): string => {
  const stack = new Error().stack
  if (!stack) return "unknown"

  const lines = stack.split("\n")
  // Safely get process.cwd() only on server and not in edge runtime
  let projectPath = ""
  if (isServer) {
    try {
      if (typeof process !== "undefined" && typeof process.cwd === "function") {
        projectPath = process.cwd()
      }
    } catch {
      // Ignore errors in edge runtime
    }
  }

  // Tìm dòng đầu tiên không phải từ logger.ts hoặc node_modules
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue

    // Bỏ qua các dòng từ logger.ts hoặc node_modules
    if (line.includes("logger.ts") || line.includes("node_modules")) {
      continue
    }

    // Extract file path và line number
    // Format: "    at functionName (file://path:line:column)" hoặc "    at path:line:column"
    const match = line.match(/\((.+):(\d+):(\d+)\)|at (.+):(\d+):(\d+)/)
    if (match) {
      const filePath = match[1] || match[4]
      const lineNum = match[2] || match[5]
      if (filePath && lineNum) {
        if (isServer && projectPath && filePath.includes(projectPath)) {
          // Server-side: Lấy đường dẫn tương đối từ project root
          const relativePath = filePath
            .replace(projectPath, "")
            .replace(/^[\\/]/, "")
            .replace(/\\/g, "/")
          return `${relativePath}:${lineNum}`
        } else if (!isServer) {
          // Client-side: Lấy tên file từ URL
          const urlMatch = filePath.match(/\/?([^\/]+\.(ts|tsx|js|jsx)):(\d+)/)
          if (urlMatch) {
            return `${urlMatch[1]}:${lineNum}`
          }
          // Fallback: lấy phần cuối của path
          const parts = filePath.split("/")
          const filename = parts[parts.length - 1] || filePath
          return `${filename}:${lineNum}`
        }
      }
    }
  }

  return "unknown"
}

/**
 * Format timestamp
 */
const formatTimestamp = (): string => new Date().toISOString()

/**
 * Format log message
 */
const formatLog = (
  level: LogLevel,
  message: string,
  data?: Record<string, unknown> | Error | unknown,
): void => {
  const timestamp = formatTimestamp()
  const location = getCallerInfo()
  const levelEmoji = {
    info: "🔵",
    success: "🟢",
    warn: "🟡",
    error: "🔴",
    debug: "🔷",
  }[level]

  const prefix = `[${levelEmoji}] ${timestamp}`
  const locationStr = `[${location}]`

  // Format data
  let dataStr = ""
  if (data) {
    if (data instanceof Error) {
      dataStr = `\nError: ${data.message}\nStack: ${data.stack}`
    } else if (typeof data === "object") {
      try {
        dataStr = `\nData: ${JSON.stringify(data, null, 2)}`
      } catch {
        dataStr = `\nData: [Circular or Unserializable]`
      }
    } else {
      dataStr = `\nValue: ${String(data)}`
    }
  }

  const output = `${prefix} ${locationStr} ${message}${dataStr}`

  switch (level) {
    case "error":
      console.error(output)
      break
    case "warn":
      console.warn(output)
      break
    case "info":
    case "success":
      console.log(output)
      break
    case "debug":
      console.debug(output)
      break
  }
}

/**
 * Public logger object
 */
export const logger = {
  info: (message: string, data?: unknown) => LOG_ENABLED && formatLog("info", message, data),
  success: (message: string, data?: unknown) => LOG_ENABLED && formatLog("success", message, data),
  warn: (message: string, data?: unknown) => LOG_ENABLED && formatLog("warn", message, data),
  error: (message: string, data?: unknown) => LOG_ENABLED && formatLog("error", message, data),
  debug: (message: string, data?: unknown) => LOG_ENABLED && formatLog("debug", message, data),
}
