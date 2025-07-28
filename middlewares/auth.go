package middlewares

import (
	"database/sql"
	"net/http"

	"docker-transformer/database"
	"docker-transformer/models"
	"docker-transformer/utils"

	"github.com/gin-gonic/gin"
)

var authLogger = utils.NewLogger("info")

// AuthMiddleware 认证中间件
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 跳过登录接口的认证
		if c.Request.URL.Path == "/api/auth/login" {
			c.Next()
			return
		}

		clientIP := c.ClientIP()
		requestPath := c.Request.URL.Path

		// 使用轮询感知的日志记录
		authLogger.InfoPolling(requestPath, "认证检查: IP=%s, Path=%s", clientIP, requestPath)

		// 从Header获取Token
		authHeader := c.GetHeader("Authorization")
		var token string

		if authHeader != "" {
			// 检查是否是Bearer格式
			if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
				token = authHeader[7:] // 提取Bearer后面的token
			} else {
				token = authHeader // 向后兼容，直接使用原始值
			}
		}

		// 如果Header中没有token，尝试从Cookie获取
		if token == "" {
			token, _ = c.Cookie("auth_token")
		}

		if token == "" {
			authLogger.Errorf("认证失败: 缺少Token, IP=%s, Path=%s", clientIP, requestPath)
			c.JSON(http.StatusUnauthorized, models.Response{
				Success: false,
				Message: "未登录，请先登录",
			})
			c.Abort()
			return
		}

		// 验证Token
		var storedToken string
		query := "SELECT value FROM config WHERE key = 'token'"
		err := database.DB.QueryRow(query).Scan(&storedToken)
		if err != nil {
			if err == sql.ErrNoRows {
				c.JSON(http.StatusInternalServerError, models.Response{
					Success: false,
					Message: "系统配置错误",
				})
			} else {
				c.JSON(http.StatusInternalServerError, models.Response{
					Success: false,
					Message: "验证失败",
				})
			}
			c.Abort()
			return
		}

		if token != storedToken {
			authLogger.Errorf("认证失败: Token无效, IP=%s, Path=%s, Token前6位=%s",
				clientIP, requestPath, token[:min(6, len(token))])
			c.JSON(http.StatusUnauthorized, models.Response{
				Success: false,
				Message: "Token无效，请重新登录",
			})
			c.Abort()
			return
		}

		// 验证通过，使用轮询感知的日志记录
		authLogger.InfoPolling(requestPath, "认证成功: IP=%s, Path=%s", clientIP, requestPath)
		c.Next()
	}
}

// min 返回两个整数中的较小值
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
