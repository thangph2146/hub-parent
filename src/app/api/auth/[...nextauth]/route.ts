/**
 * NextAuth.js route handlers for Next.js 16
 */
import { handlers } from "@/auth/server"
import { NextRequest, NextResponse } from "next/server"
import { logger } from "@/utils"

// Wrap handlers để đảm bảo luôn trả về JSON response hợp lệ
async function handleRequest(
  handler: (req: NextRequest) => Promise<Response>,
  req: NextRequest
): Promise<Response> {
  // Kiểm tra sớm nếu là error endpoint - trả về JSON ngay lập tức
  try {
    const url = new URL(req.url)
    const pathname = url.pathname
    const isErrorEndpoint = pathname.includes("/error")
    
    if (isErrorEndpoint) {
      const errorType = url.searchParams.get("error") || "UnknownError"
      
      // Log thông tin về error endpoint
      logger.warn("NextAuth error endpoint accessed directly", {
        pathname,
        errorType,
        requestHost: req.headers.get("host"),
        nextAuthUrl: process.env.NEXTAUTH_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      })
      
      // Trả về JSON response ngay lập tức, không cần gọi NextAuth handler
      // Vì NextAuth handler có thể throw exception nếu config không đúng
      return NextResponse.json(
        {
          error: errorType,
          message: errorType === "Configuration" 
            ? "Authentication configuration error. Please check NEXTAUTH_SECRET, NEXTAUTH_URL, and OAuth provider credentials."
            : "Authentication service error",
          details: errorType === "Configuration" ? {
            possibleCauses: [
              "NEXTAUTH_SECRET không đúng hoặc chưa set",
              "NEXTAUTH_URL không khớp với domain hiện tại",
              "Google OAuth credentials không đúng",
              "Callback URL trong Google Cloud Console không khớp",
              "Domain mismatch trong callback request",
            ],
            hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
            hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
            nextAuthUrl: process.env.NEXTAUTH_URL,
            hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
            hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
          } : undefined,
        },
        { status: 400 }
      )
    }
  } catch (urlError) {
    // Nếu không parse được URL, tiếp tục xử lý bình thường
    logger.warn("Failed to parse URL for early error endpoint check", {
      error: urlError instanceof Error ? urlError.message : String(urlError),
    })
  }
  
  try {
    // Log để debug URL và headers
    const requestHost = req.headers.get("host")
    const requestUrl = req.url
    const pathname = new URL(req.url).pathname
    const isCallback = pathname.includes("/callback/")
    const isSignIn = pathname.includes("/signin/")
    
    logger.debug("NextAuth request", {
      requestHost,
      requestUrl,
      pathname,
      isCallback,
      isSignIn,
      method: req.method,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      queryParams: new URL(req.url).searchParams.toString(),
    })
    
    // Log chi tiết cho callback requests
    if (isCallback) {
      const queryParams = new URL(req.url).searchParams
      logger.info("NextAuth callback request detected", {
        pathname,
        requestHost,
        requestUrl,
        code: queryParams.get("code"),
        error: queryParams.get("error"),
        state: queryParams.get("state"),
        nextAuthUrl: process.env.NEXTAUTH_URL,
      })
    }
    
    // Force sử dụng NEXTAUTH_URL từ env nếu có
    // Điều này đảm bảo redirect URI luôn sử dụng đúng domain
    if (process.env.NEXTAUTH_URL) {
      // Normalize NEXTAUTH_URL - remove trailing slash
      const normalizedNextAuthUrl = process.env.NEXTAUTH_URL.replace(/\/$/, "")
      const nextAuthUrl = new URL(normalizedNextAuthUrl)
      const currentUrl = new URL(req.url)
      
      // Chỉ override nếu domain khác nhau
      if (currentUrl.host !== nextAuthUrl.host) {
        logger.warn("NextAuth domain mismatch detected", {
          requestHost: currentUrl.host,
          expectedHost: nextAuthUrl.host,
          nextAuthUrl: process.env.NEXTAUTH_URL,
        })
        
        // Override Host header để đảm bảo NextAuth sử dụng đúng domain
        // Điều này đặc biệt quan trọng khi có reverse proxy (nginx) set Host header từ client
        req.headers.set("host", nextAuthUrl.host)
        req.headers.set("x-forwarded-host", nextAuthUrl.host)
        req.headers.set("x-forwarded-proto", nextAuthUrl.protocol.slice(0, -1)) // Remove ':'
        req.headers.set("x-forwarded-port", nextAuthUrl.port || (nextAuthUrl.protocol === "https:" ? "443" : "80"))
        
        // Update request URL để đảm bảo đúng domain
        currentUrl.host = nextAuthUrl.host
        currentUrl.protocol = nextAuthUrl.protocol
        
        req = new NextRequest(currentUrl.toString(), {
          method: req.method,
          headers: req.headers,
          body: req.body,
        })
        
        logger.info("NextAuth request URL overridden", {
          originalHost: requestHost,
          newHost: nextAuthUrl.host,
        })
      }
    } else {
      logger.warn("NEXTAUTH_URL not set! NextAuth will use request headers (trustHost)", {
        requestHost,
        requestUrl,
      })
    }
    
    const response = await handler(req)
    
    // Log response status
    const locationHeader = response.headers.get("location")
    const responseContentType = response.headers.get("content-type")
    
    logger.debug("NextAuth response", {
      status: response.status,
      statusText: response.statusText,
      pathname,
      isCallback,
      isSignIn,
      hasLocation: !!locationHeader,
      location: locationHeader,
      contentType: responseContentType,
    })
    
    // Log location header nếu có (có thể là redirect trong JSON response)
    if (locationHeader) {
      logger.info("NextAuth response has location header", {
        location: locationHeader,
        status: response.status,
        pathname,
        isCallback,
        isSignIn,
      })
    }
    
    // Kiểm tra nếu là redirect response (3xx status) - fix URL nếu cần
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location")
      
      // Log chi tiết cho error redirects
      let hasError = false
      let errorType: string | null = null
      
      if (location) {
        try {
          const locationUrl = new URL(location)
          hasError = locationUrl.searchParams.has("error")
          errorType = locationUrl.searchParams.get("error")
        } catch {
          // Nếu không parse được URL, kiểm tra string
          hasError = location.includes("error=")
        }
      }
      
      logger.info("NextAuth redirect response", {
        status: response.status,
        location,
        pathname,
        isCallback,
        isSignIn,
        requestUrl: req.url,
        hasError,
        errorType,
        requestHost: req.headers.get("host"),
        nextAuthUrl: process.env.NEXTAUTH_URL,
      })
      
      // Đặc biệt log cho error redirects
      if (hasError && errorType) {
        logger.warn("NextAuth error redirect detected", {
          location,
          errorType,
          pathname,
          isCallback,
          requestHost: req.headers.get("host"),
          nextAuthUrl: process.env.NEXTAUTH_URL,
        })
        
        // Nếu là Configuration error, log thêm thông tin
        if (errorType === "Configuration") {
          logger.error("NextAuth Configuration error - possible causes:", {
            location,
            pathname,
            isCallback,
            requestHost: req.headers.get("host"),
            nextAuthUrl: process.env.NEXTAUTH_URL,
            hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
            hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
            hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
            possibleCauses: [
              "NEXTAUTH_SECRET không đúng hoặc chưa set",
              "Google OAuth credentials không đúng",
              "Callback URL trong Google Cloud Console không khớp",
              "Domain mismatch trong callback request",
            ],
          })
        }
      }
      
      if (location && process.env.NEXTAUTH_URL) {
        try {
          const redirectUrl = new URL(location)
          const nextAuthUrl = new URL(process.env.NEXTAUTH_URL)
          
          logger.debug("NextAuth redirect URL analysis", {
            redirectUrlHost: redirectUrl.host,
            redirectUrlProtocol: redirectUrl.protocol,
            redirectUrlPath: redirectUrl.pathname,
            redirectUrlSearch: redirectUrl.search,
            nextAuthUrlHost: nextAuthUrl.host,
            nextAuthUrlProtocol: nextAuthUrl.protocol,
            hostsMatch: redirectUrl.host === nextAuthUrl.host,
          })
          
          // Nếu redirect URL có domain khác với NEXTAUTH_URL, fix nó
          // Đặc biệt quan trọng cho callback requests
          if (redirectUrl.host !== nextAuthUrl.host) {
            logger.warn("NextAuth redirect URL mismatch detected", {
              originalLocation: location,
              expectedHost: nextAuthUrl.host,
              actualHost: redirectUrl.host,
              pathname,
              isCallback,
              isSignIn,
            })
            
            // Fix redirect URL - đảm bảo sử dụng đúng domain
            const originalPath = redirectUrl.pathname + redirectUrl.search
            redirectUrl.host = nextAuthUrl.host
            redirectUrl.protocol = nextAuthUrl.protocol
            
            // Đảm bảo path và query được giữ nguyên
            const fixedLocation = `${nextAuthUrl.protocol}//${nextAuthUrl.host}${originalPath}`
            
            // Tạo response mới với location đã fix
            const fixedResponse = NextResponse.redirect(fixedLocation, {
              status: response.status,
            })
            
            // Copy các headers khác từ response gốc
            response.headers.forEach((value, key) => {
              if (key.toLowerCase() !== "location") {
                fixedResponse.headers.set(key, value)
              }
            })
            
            logger.info("NextAuth redirect URL fixed", {
              originalLocation: location,
              fixedLocation: fixedLocation,
              pathname,
              isCallback,
              isSignIn,
            })
            
            return fixedResponse
          } else {
            logger.debug("NextAuth redirect URL is correct", {
              location,
              host: redirectUrl.host,
              pathname,
            })
          }
        } catch (error) {
          logger.error("Failed to fix redirect URL", {
            error: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
            location,
            pathname,
          })
        }
      } else {
        logger.warn("NextAuth redirect response missing location or NEXTAUTH_URL", {
          hasLocation: !!location,
          hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
          status: response.status,
          pathname,
        })
      }
      
      return response
    }
    
    const isJson = responseContentType?.includes("application/json")
    
    // Nếu là JSON response, kiểm tra body có rỗng không
    if (isJson) {
      try {
        // Clone response để đọc body mà không consume original response
        const clonedResponse = response.clone()
        const bodyText = await clonedResponse.text()
        const isEmpty = bodyText.trim().length === 0
        
        // Log JSON body nếu là signin request (có thể chứa redirect URL)
        if (isSignIn && !isEmpty) {
          try {
            const bodyJson = JSON.parse(bodyText)
            logger.debug("NextAuth signin JSON response", {
              body: bodyJson,
              pathname,
              hasUrl: !!bodyJson.url,
              url: bodyJson.url,
            })
            
            // Nếu có URL trong body và domain không khớp, fix nó
            // URL này có thể là OAuth authorization URL với redirect_uri parameter
            if (bodyJson.url && process.env.NEXTAUTH_URL) {
              try {
                const bodyUrl = new URL(bodyJson.url)
                const nextAuthUrl = new URL(process.env.NEXTAUTH_URL.replace(/\/$/, ""))
                
                logger.debug("NextAuth signin URL analysis", {
                  bodyUrlHost: bodyUrl.host,
                  bodyUrlProtocol: bodyUrl.protocol,
                  bodyUrlPath: bodyUrl.pathname,
                  bodyUrlSearch: bodyUrl.search,
                  nextAuthUrlHost: nextAuthUrl.host,
                  nextAuthUrlProtocol: nextAuthUrl.protocol,
                  hostsMatch: bodyUrl.host === nextAuthUrl.host,
                })
                
                // Fix redirect_uri trong query params nếu có
                const searchParams = bodyUrl.searchParams
                const redirectUri = searchParams.get("redirect_uri")
                
                if (redirectUri) {
                  try {
                    const redirectUriUrl = new URL(redirectUri)
                    const expectedCallbackUrl = `${nextAuthUrl.origin}/api/auth/callback/google`
                    
                    logger.debug("NextAuth redirect_uri analysis", {
                      redirectUri,
                      redirectUriHost: redirectUriUrl.host,
                      expectedCallbackUrl,
                      hostsMatch: redirectUriUrl.host === nextAuthUrl.host,
                    })
                    
                    if (redirectUriUrl.host !== nextAuthUrl.host) {
                      logger.warn("NextAuth redirect_uri mismatch", {
                        originalRedirectUri: redirectUri,
                        expectedHost: nextAuthUrl.host,
                        actualHost: redirectUriUrl.host,
                        pathname,
                      })
                      
                      // Fix redirect_uri
                      searchParams.set("redirect_uri", expectedCallbackUrl)
                      bodyUrl.search = searchParams.toString()
                      bodyJson.url = bodyUrl.toString()
                      
                      logger.info("NextAuth redirect_uri fixed", {
                        originalRedirectUri: redirectUri,
                        fixedRedirectUri: expectedCallbackUrl,
                        fixedUrl: bodyJson.url,
                        pathname,
                      })
                    }
                  } catch (redirectUriError) {
                    logger.error("Failed to parse redirect_uri", {
                      error: redirectUriError instanceof Error ? redirectUriError.message : String(redirectUriError),
                      redirectUri,
                    })
                  }
                }
                
                // Nếu URL host không khớp (không phải OAuth provider URL), fix nó
                if (bodyUrl.host !== nextAuthUrl.host && !bodyUrl.host.includes("google.com") && !bodyUrl.host.includes("accounts.google.com")) {
                  logger.warn("NextAuth signin response URL mismatch", {
                    originalUrl: bodyJson.url,
                    expectedHost: nextAuthUrl.host,
                    actualHost: bodyUrl.host,
                    pathname,
                  })
                  
                  // Fix URL trong body - chỉ fix host và protocol, giữ nguyên path và query
                  const originalPath = bodyUrl.pathname + bodyUrl.search
                  bodyUrl.host = nextAuthUrl.host
                  bodyUrl.protocol = nextAuthUrl.protocol
                  
                  // Đảm bảo path và query được giữ nguyên
                  const fixedUrl = `${nextAuthUrl.protocol}//${nextAuthUrl.host}${originalPath}`
                  bodyJson.url = fixedUrl
                  
                  logger.info("NextAuth signin response URL fixed", {
                    originalUrl: bodyJson.url,
                    fixedUrl: fixedUrl,
                    pathname,
                  })
                } else {
                  logger.debug("NextAuth signin response URL is correct", {
                    url: bodyJson.url,
                    host: bodyUrl.host,
                    hasRedirectUri: !!redirectUri,
                  })
                }
                
                // Nếu đã fix redirect_uri hoặc URL, trả về response mới
                if (redirectUri && searchParams.get("redirect_uri") !== redirectUri) {
                  return NextResponse.json(bodyJson, {
                    status: response.status,
                    headers: response.headers,
                  })
                }
              } catch (urlError) {
                logger.error("Failed to fix URL in signin response", {
                  error: urlError instanceof Error ? urlError.message : String(urlError),
                  errorStack: urlError instanceof Error ? urlError.stack : undefined,
                  url: bodyJson.url,
                  pathname,
                })
              }
            }
          } catch (parseError) {
            logger.debug("Failed to parse JSON body for signin", {
              error: parseError instanceof Error ? parseError.message : String(parseError),
              pathname,
            })
          }
        }
        
        // Nếu JSON response rỗng, trả về JSON hợp lệ
        if (isEmpty) {
          logger.warn("NextAuth returned empty JSON response", {
            status: response.status,
            pathname,
          })
          
          return NextResponse.json(
            response.status >= 400
              ? { error: "InternalServerError", message: "Authentication service error" }
              : { ok: true },
            { status: response.status || 200 }
          )
        }
        
        // Nếu JSON không rỗng, trả về response gốc (body vẫn còn nguyên)
        return response
      } catch (error) {
        // Nếu không đọc được body, log và trả về JSON error nếu là error status
        logger.warn("Failed to read response body", {
          error: error instanceof Error ? error.message : String(error),
          status: response.status,
        })
        
        if (response.status >= 400) {
          return NextResponse.json(
            {
              error: "InternalServerError",
              message: "Authentication service error",
            },
            { status: response.status || 500 }
          )
        }
        
        // Nếu không phải error, trả về response gốc
        return response
      }
    }
    
    // Nếu không phải JSON response
    if (response.status >= 400) {
      // Error response không phải JSON - chuyển đổi thành JSON
      // Đặc biệt xử lý cho error endpoint
      const pathname = new URL(req.url).pathname
      const isErrorEndpoint = pathname.includes("/error")
      
      if (isErrorEndpoint) {
        // Lấy error type từ query params
        const queryParams = new URL(req.url).searchParams
        const errorType = queryParams.get("error") || "UnknownError"
        
        logger.error("NextAuth error endpoint called", {
          status: response.status,
          contentType: responseContentType,
          errorType,
          pathname,
          requestHost: req.headers.get("host"),
          nextAuthUrl: process.env.NEXTAUTH_URL,
        })
        
        // Trả về JSON error response với thông tin chi tiết
        return NextResponse.json(
          {
            error: errorType,
            message: errorType === "Configuration" 
              ? "Authentication configuration error. Please check NEXTAUTH_SECRET, NEXTAUTH_URL, and OAuth provider credentials."
              : "Authentication service error",
            details: errorType === "Configuration" ? {
              possibleCauses: [
                "NEXTAUTH_SECRET không đúng hoặc chưa set",
                "NEXTAUTH_URL không khớp với domain hiện tại",
                "Google OAuth credentials không đúng",
                "Callback URL trong Google Cloud Console không khớp",
                "Domain mismatch trong callback request",
              ],
              hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
              hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
              nextAuthUrl: process.env.NEXTAUTH_URL,
              hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
              hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
            } : undefined,
          },
          { status: response.status || 500 }
        )
      }
      
      logger.error("NextAuth returned non-JSON error response", {
        status: response.status,
        contentType: responseContentType,
        pathname,
      })
      
      return NextResponse.json(
        {
          error: "InternalServerError",
          message: "Authentication service error",
        },
        { status: response.status || 500 }
      )
    }
    
    // Success response không phải JSON - trả về nguyên bản (có thể là redirect, HTML, etc.)
    return response
  } catch (error) {
    logger.error("Error in NextAuth handler", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      pathname: req.url ? new URL(req.url).pathname : "unknown",
    })
    
    // Kiểm tra nếu là error endpoint và có error trong query
    try {
      const url = new URL(req.url)
      const isErrorEndpoint = url.pathname.includes("/error")
      const errorType = url.searchParams.get("error")
      
      if (isErrorEndpoint && errorType) {
        return NextResponse.json(
          {
            error: errorType,
            message: errorType === "Configuration" 
              ? "Authentication configuration error. Please check NEXTAUTH_SECRET, NEXTAUTH_URL, and OAuth provider credentials."
              : "Authentication service error",
          },
          { status: 500 }
        )
      }
    } catch {
      // Ignore URL parsing errors
    }
    
    return NextResponse.json(
      {
        error: "InternalServerError",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  return handleRequest(handlers.GET, req)
}

export async function POST(req: NextRequest) {
  return handleRequest(handlers.POST, req)
}
