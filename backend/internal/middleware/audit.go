package middleware

import (
	"bytes"
	"io/ioutil"

	"cloudweave/internal/services"

	"github.com/gin-gonic/gin"
)

// AuditLogMiddleware creates a middleware for logging audit trails.
func AuditLog(auditService *services.AuditService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Read the request body
		var requestBody []byte
		if c.Request.Body != nil {
			requestBody, _ = ioutil.ReadAll(c.Request.Body)
			// Restore the body for further processing
			c.Request.Body = ioutil.NopCloser(bytes.NewBuffer(requestBody))
		}

		c.Next()

		// Don't log on authentication failures
		if c.IsAborted() {
			return
		}

		details := gin.H{
			"method":      c.Request.Method,
			"path":        c.Request.URL.Path,
			"ip_address":  c.ClientIP(),
			"user_agent":  c.Request.UserAgent(),
			"status_code": c.Writer.Status(),
		}

		// Include request body for relevant methods
		if c.Request.Method == "POST" || c.Request.Method == "PUT" || c.Request.Method == "PATCH" {
			details["request_body"] = string(requestBody)
		}

		// Asynchronously log the audit record
		go func() {
			// Create a new context for the goroutine
			ctx := c.Copy()
			auditService.Record(ctx, "api_request", "", "", details)
		}()
	}
}
