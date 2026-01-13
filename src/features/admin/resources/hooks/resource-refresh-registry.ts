import type { QueryKey } from "@tanstack/react-query"
import { logger } from "@/utils"

/**
 * Global registry để đăng ký refresh callbacks cho các resource tables
 * Cho phép trigger refresh từ bất kỳ đâu sau khi queries được invalidate
 */
type RefreshCallback = () => void

interface RefreshRegistration {
  queryKey: QueryKey
  callback: RefreshCallback
  resourceName: string
}

class ResourceRefreshRegistry {
  private registrations = new Map<string, RefreshRegistration[]>()
  private lastTriggerTime = new Map<string, number>()
  private readonly DEBOUNCE_MS = 50 // Giảm debounce xuống 50ms để tránh block các refresh hợp lệ từ bulk actions

  /**
   * Đăng ký refresh callback cho một query key
   */
  register(queryKey: QueryKey, callback: RefreshCallback, resourceName: string): () => void {
    const key = this.getKeyString(queryKey)
    
    if (!this.registrations.has(key)) {
      this.registrations.set(key, [])
    }

    const registration: RefreshRegistration = {
      queryKey,
      callback,
      resourceName,
    }

    this.registrations.get(key)!.push(registration)

    logger.debug("Registered refresh callback", {
      resourceName,
      queryKey: queryKey.slice(0, 3),
      totalCallbacks: this.registrations.get(key)!.length,
    })

    // Return unregister function
    return () => {
      const callbacks = this.registrations.get(key)
      if (callbacks) {
        const index = callbacks.indexOf(registration)
        if (index > -1) {
          callbacks.splice(index, 1)
          logger.debug("Unregistered refresh callback", {
            resourceName,
            queryKey: queryKey.slice(0, 3),
            remainingCallbacks: callbacks.length,
          })
        }
        if (callbacks.length === 0) {
          this.registrations.delete(key)
        }
      }
    }
  }

  /**
   * Trigger refresh cho tất cả callbacks đăng ký cho query key này hoặc prefix của nó
   */
  triggerRefresh(invalidateKey: QueryKey): void {
    if (!Array.isArray(invalidateKey) || invalidateKey.length === 0) {
      logger.warn("Invalid query key for refresh trigger", { invalidateKey })
      return
    }

    // Debounce để tránh trigger nhiều lần trong thời gian ngắn
    const keyString = this.getKeyString(invalidateKey)
    const now = Date.now()
    const lastTrigger = this.lastTriggerTime.get(keyString) || 0
    
    if (now - lastTrigger < this.DEBOUNCE_MS) {
      logger.debug("Skipping refresh trigger (debounced)", {
        invalidateKey: invalidateKey.slice(0, 3),
        timeSinceLastTrigger: now - lastTrigger,
        debounceMs: this.DEBOUNCE_MS,
      })
      return
    }
    
    this.lastTriggerTime.set(keyString, now)

    // Tìm tất cả registrations có query key match với invalidate key
    const matchingRegistrations: RefreshRegistration[] = []
    
    logger.debug("Triggering refresh for query key", {
      invalidateKey: invalidateKey.slice(0, 3),
      invalidateKeyFull: JSON.stringify(invalidateKey),
      totalRegistrations: this.registrations.size,
      registeredKeys: Array.from(this.registrations.keys()).map(k => {
        const parsed = this.parseKeyString(k)
        return {
          key: parsed.slice(0, 3),
          full: JSON.stringify(parsed),
        }
      }),
    })

    // Nếu không có registrations nào, log warning nhưng vẫn tiếp tục để trigger fallback
    if (this.registrations.size === 0) {
      logger.warn("No refresh callbacks registered - table may not be mounted yet, will try fallback", {
        invalidateKey: invalidateKey.slice(0, 3),
      })
    }

    for (const [registeredKey, registrations] of this.registrations.entries()) {
      const registeredQueryKey = this.parseKeyString(registeredKey)
      
      // Check if keys match (either direction - prefix match)
      // invalidateKey: ["adminUsers"] should match registeredKey: ["adminUsers", {...}]
      // registeredKey: ["adminUsers"] should match invalidateKey: ["adminUsers", {...}]
      const matches = this.keysMatch(invalidateKey, registeredQueryKey)
      logger.debug("Checking key match", {
        invalidateKey: invalidateKey.slice(0, 3),
        registeredKey: registeredQueryKey.slice(0, 3),
        matches,
      })
      
      if (matches) {
        matchingRegistrations.push(...registrations)
        logger.debug("Found matching registration", {
          invalidateKey: invalidateKey.slice(0, 3),
          registeredKey: registeredQueryKey.slice(0, 3),
          callbackCount: registrations.length,
        })
      }
    }

    if (matchingRegistrations.length === 0) {
      logger.warn("No exact refresh callbacks found for query key - trying prefix match", {
        queryKey: invalidateKey.slice(0, 3),
        queryKeyFull: JSON.stringify(invalidateKey),
        availableKeys: Array.from(this.registrations.keys()).map(k => {
          const parsed = this.parseKeyString(k)
          return {
            key: parsed.slice(0, 3),
            full: JSON.stringify(parsed),
          }
        }),
        totalRegistrations: this.registrations.size,
      })
      // Trigger tất cả callbacks có query key prefix match để đảm bảo refresh được trigger
      // Điều này đảm bảo refresh vẫn được trigger ngay cả khi registry không tìm thấy exact match
      let foundPrefixMatch = false
      for (const [registeredKey, registrations] of this.registrations.entries()) {
        const registeredQueryKey = this.parseKeyString(registeredKey)
        // Check if invalidateKey is a prefix of registeredQueryKey
        if (invalidateKey.length > 0 && registeredQueryKey.length >= invalidateKey.length) {
          const isPrefix = invalidateKey.every((key, index) => {
            return JSON.stringify(registeredQueryKey[index]) === JSON.stringify(key)
          })
          if (isPrefix) {
            foundPrefixMatch = true
            logger.debug("Found prefix match, triggering refresh callbacks", {
              invalidateKey: invalidateKey.slice(0, 3),
              registeredKey: registeredQueryKey.slice(0, 3),
            })
            for (const registration of registrations) {
              try {
                registration.callback()
                logger.debug("Prefix match refresh callback executed successfully", {
                  resourceName: registration.resourceName,
                })
              } catch (error) {
                logger.error(
                  `Failed to trigger refresh callback for ${registration.resourceName}`,
                  error as Error,
                )
              }
            }
          }
        }
        // Also check if registeredQueryKey is a prefix of invalidateKey (reverse match)
        if (registeredQueryKey.length > 0 && invalidateKey.length >= registeredQueryKey.length) {
          const isReversePrefix = registeredQueryKey.every((key, index) => {
            return JSON.stringify(invalidateKey[index]) === JSON.stringify(key)
          })
          if (isReversePrefix) {
            foundPrefixMatch = true
            logger.debug("Found reverse prefix match, triggering refresh callbacks", {
              invalidateKey: invalidateKey.slice(0, 3),
              registeredKey: registeredQueryKey.slice(0, 3),
            })
            for (const registration of registrations) {
              try {
                registration.callback()
                logger.debug("Reverse prefix match refresh callback executed successfully", {
                  resourceName: registration.resourceName,
                })
              } catch (error) {
                logger.error(
                  `Failed to trigger refresh callback for ${registration.resourceName}`,
                  error as Error,
                )
              }
            }
          }
        }
      }
      if (!foundPrefixMatch) {
        logger.warn("No prefix match found - triggering all callbacks as fallback", {
          queryKey: invalidateKey.slice(0, 3),
          totalCallbacks: Array.from(this.registrations.values()).flat().length,
        })
        // Fallback: Trigger tất cả callbacks nếu không tìm thấy match nào
        // Điều này đảm bảo refresh luôn được trigger, ngay cả khi query key không match
        for (const registrations of this.registrations.values()) {
          for (const registration of registrations) {
            try {
              registration.callback()
              logger.debug("Fallback refresh callback executed successfully", {
                resourceName: registration.resourceName,
              })
            } catch (error) {
              logger.error(
                `Failed to trigger fallback refresh callback for ${registration.resourceName}`,
                error as Error,
              )
            }
          }
        }
      }
      return
    }

    logger.debug("Triggering refresh callbacks", {
      queryKey: invalidateKey.slice(0, 3),
      callbackCount: matchingRegistrations.length,
      resources: matchingRegistrations.map(r => r.resourceName),
    })

    // Trigger all matching callbacks ngay lập tức
    // Queries đã được invalidate và refetch trong mutation onSuccess trước khi trigger refresh
    // Gọi callback trực tiếp để đảm bảo UI cập nhật ngay lập tức
    // Sử dụng flushSync trong callback để đảm bảo state update ngay lập tức
    for (const registration of matchingRegistrations) {
      try {
        logger.debug("Triggering refresh callback", {
          resourceName: registration.resourceName,
          queryKey: registration.queryKey.slice(0, 3),
          queryKeyFull: JSON.stringify(registration.queryKey),
          hasCallback: !!registration.callback,
        })
        // Gọi callback ngay lập tức - callback sử dụng flushSync để đảm bảo state update ngay lập tức
        if (registration.callback) {
          registration.callback()
          logger.debug("Refresh callback executed successfully", {
            resourceName: registration.resourceName,
          })
        } else {
          logger.warn("Refresh callback is null or undefined", {
            resourceName: registration.resourceName,
          })
        }
      } catch (error) {
        logger.error(
          `Failed to trigger refresh callback for ${registration.resourceName}`,
          error as Error,
        )
      }
    }
  }

  /**
   * Convert query key to string for Map key
   */
  private getKeyString(queryKey: QueryKey): string {
    return JSON.stringify(queryKey)
  }

  /**
   * Parse key string back to query key
   */
  private parseKeyString(keyString: string): QueryKey {
    return JSON.parse(keyString) as QueryKey
  }

  /**
   * Check if two query keys match (prefix match)
   * key1: ["notifications", "admin"] should match key2: ["notifications", "admin", "all", 1, 10, ...]
   * key2: ["notifications", "admin"] should match key1: ["notifications", "admin", "all", 1, 10, ...]
   * 
   * Logic:
   * - If same length: deep equality check for all elements
   * - If different lengths: shorter key must be a prefix of longer key
   */
  private keysMatch(key1: QueryKey, key2: QueryKey): boolean {
    if (!Array.isArray(key1) || !Array.isArray(key2)) {
      return false
    }

    if (key1.length === 0 || key2.length === 0) {
      return false
    }

    // If both keys have same length, they must be exactly equal (deep equality)
    if (key1.length === key2.length) {
      for (let i = 0; i < key1.length; i++) {
        if (JSON.stringify(key1[i]) !== JSON.stringify(key2[i])) {
          return false
        }
      }
      return true
    }

    // If different lengths, check if shorter is prefix of longer
    const shorter = key1.length < key2.length ? key1 : key2
    const longer = key1.length < key2.length ? key2 : key1

    // Check if shorter key is a prefix of longer key
    // Compare all elements of shorter key with corresponding elements of longer key
    for (let i = 0; i < shorter.length; i++) {
      if (JSON.stringify(shorter[i]) !== JSON.stringify(longer[i])) {
        return false
      }
    }
    return true
  }

  /**
   * Clear all registrations (useful for testing)
   */
  clear(): void {
    this.registrations.clear()
    logger.debug("Cleared all refresh registrations")
  }
}

// Singleton instance
export const resourceRefreshRegistry = new ResourceRefreshRegistry()

