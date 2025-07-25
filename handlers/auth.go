package handlers

import (
	"database/sql"
	"net/http"

	"docker-transformer/database"
	"docker-transformer/models"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct{}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{}
}

// Login 用户登录
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Success: false,
			Message: "请求参数无效: " + err.Error(),
		})
		return
	}

	// 从数据库获取当前Token
	var storedToken string
	query := "SELECT value FROM config WHERE key = 'token'"
	err := database.DB.QueryRow(query).Scan(&storedToken)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusInternalServerError, models.Response{
				Success: false,
				Message: "系统配置错误，请联系管理员",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "验证失败: " + err.Error(),
		})
		return
	}

	// 验证Token
	if req.Token != storedToken {
		c.JSON(http.StatusUnauthorized, models.Response{
			Success: false,
			Message: "Token验证失败，请检查输入",
		})
		return
	}

	// 登录成功，设置会话（简单实现，实际应用中可以使用JWT）
	c.SetCookie("auth_token", req.Token, 3600*24, "/", "", false, true)

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "登录成功",
	})
}

// Logout 用户退出
func (h *AuthHandler) Logout(c *gin.Context) {
	// 清除Cookie
	c.SetCookie("auth_token", "", -1, "/", "", false, true)

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "已退出登录",
	})
}

// ChangeToken 修改Token
func (h *AuthHandler) ChangeToken(c *gin.Context) {
	var req struct {
		OldToken string `json:"old_token" binding:"required"`
		NewToken string `json:"new_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Success: false,
			Message: "请求参数无效: " + err.Error(),
		})
		return
	}

	// 验证旧Token
	var storedToken string
	query := "SELECT value FROM config WHERE key = 'token'"
	err := database.DB.QueryRow(query).Scan(&storedToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "获取当前Token失败: " + err.Error(),
		})
		return
	}

	if req.OldToken != storedToken {
		c.JSON(http.StatusUnauthorized, models.Response{
			Success: false,
			Message: "当前Token验证失败",
		})
		return
	}

	// 更新Token
	updateQuery := "UPDATE config SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = 'token'"
	_, err = database.DB.Exec(updateQuery, req.NewToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "更新Token失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "Token修改成功",
	})
}
