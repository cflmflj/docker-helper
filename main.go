package main

import (
	"embed"
	"fmt"
	"io"
	"io/fs"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"

	"docker-transformer/config"
	"docker-transformer/database"
	"docker-transformer/handlers"
	"docker-transformer/middlewares"
	"docker-transformer/utils"

	"github.com/gin-gonic/gin"
)

//go:embed all:web/dist
var webAssets embed.FS

// setupStaticAssets 配置嵌入的静态文件服务
func setupStaticAssets(r *gin.Engine, logger *utils.Logger) {
	// 获取嵌入的文件系统
	distFS, err := fs.Sub(webAssets, "web/dist")
	if err != nil {
		logger.Errorf("获取嵌入文件系统失败: %v", err)
		return
	}

	// 处理所有静态资源文件（包括assets目录）
	r.GET("/assets/*filepath", func(c *gin.Context) {
		filePath := c.Param("filepath")
		filePath = strings.TrimPrefix(filePath, "/")

		file, err := distFS.Open("assets/" + filePath)
		if err != nil {
			c.Status(http.StatusNotFound)
			return
		}
		defer file.Close()

		// 设置适当的Content-Type
		ext := filepath.Ext(filePath)
		var contentType string
		switch ext {
		case ".js", ".mjs":
			contentType = "application/javascript; charset=utf-8"
		case ".css":
			contentType = "text/css; charset=utf-8"
		case ".png":
			contentType = "image/png"
		case ".jpg", ".jpeg":
			contentType = "image/jpeg"
		case ".svg":
			contentType = "image/svg+xml"
		case ".woff":
			contentType = "font/woff"
		case ".woff2":
			contentType = "font/woff2"
		case ".ttf":
			contentType = "font/ttf"
		case ".eot":
			contentType = "application/vnd.ms-fontobject"
		default:
			contentType = "application/octet-stream"
		}

		c.Header("Content-Type", contentType)
		c.Header("Cache-Control", "public, max-age=31536000")

		content, err := io.ReadAll(file)
		if err != nil {
			c.Status(http.StatusInternalServerError)
			return
		}

		c.Data(http.StatusOK, contentType, content)
	})

	// 处理静态资源文件（兼容性）
	r.GET("/static/*filepath", func(c *gin.Context) {
		filePath := c.Param("filepath")
		filePath = strings.TrimPrefix(filePath, "/")

		file, err := distFS.Open("static/" + filePath)
		if err != nil {
			c.Status(http.StatusNotFound)
			return
		}
		defer file.Close()

		// 设置适当的Content-Type
		ext := filepath.Ext(filePath)
		var contentType string
		switch ext {
		case ".js", ".mjs":
			contentType = "application/javascript; charset=utf-8"
		case ".css":
			contentType = "text/css; charset=utf-8"
		case ".png":
			contentType = "image/png"
		case ".jpg", ".jpeg":
			contentType = "image/jpeg"
		case ".svg":
			contentType = "image/svg+xml"
		default:
			contentType = "application/octet-stream"
		}

		c.Header("Content-Type", contentType)
		c.Header("Cache-Control", "public, max-age=31536000")

		content, err := io.ReadAll(file)
		if err != nil {
			c.Status(http.StatusInternalServerError)
			return
		}

		c.Data(http.StatusOK, contentType, content)
	})

	// 处理其他静态文件
	staticFiles := []string{"favicon.ico", "manifest.json", "robots.txt", "sitemap.xml"}
	for _, filename := range staticFiles {
		filename := filename // 闭包变量
		r.GET("/"+filename, func(c *gin.Context) {
			file, err := distFS.Open(filename)
			if err != nil {
				c.Status(http.StatusNotFound)
				return
			}
			defer file.Close()

			// 设置适当的Content-Type
			var contentType string
			switch filename {
			case "manifest.json":
				contentType = "application/json; charset=utf-8"
			case "robots.txt":
				contentType = "text/plain; charset=utf-8"
			case "sitemap.xml":
				contentType = "application/xml; charset=utf-8"
			case "favicon.ico":
				contentType = "image/x-icon"
			default:
				contentType = "application/octet-stream"
			}

			c.Header("Content-Type", contentType)

			content, err := io.ReadAll(file)
			if err != nil {
				c.Status(http.StatusInternalServerError)
				return
			}

			c.Data(http.StatusOK, contentType, content)
		})
	}
}

// serveIndexHTML 提供React应用的index.html文件
func serveIndexHTML(c *gin.Context) {
	distFS, err := fs.Sub(webAssets, "web/dist")
	if err != nil {
		c.String(http.StatusInternalServerError, "Failed to load web assets")
		return
	}

	file, err := distFS.Open("index.html")
	if err != nil {
		c.String(http.StatusNotFound, "Frontend not found")
		return
	}
	defer file.Close()

	c.Header("Content-Type", "text/html; charset=utf-8")
	c.Header("Cache-Control", "no-cache, no-store, must-revalidate")

	content, err := io.ReadAll(file)
	if err != nil {
		c.String(http.StatusInternalServerError, "Failed to read index.html")
		return
	}

	c.Data(http.StatusOK, "text/html; charset=utf-8", content)
}

func main() {
	// 加载配置
	cfg := config.Load()

	// 初始化日志
	logger := utils.NewLogger(cfg.LogLevel)
	logger.Info("启动Docker镜像转换服务...")

	// 初始化数据库
	if err := database.InitDB(cfg.DBPath); err != nil {
		logger.Errorf("数据库初始化失败: %v", err)
		os.Exit(1)
	}
	defer database.Close()
	logger.Info("数据库初始化成功")

	// 设置Gin模式
	gin.SetMode(cfg.GinMode)

	// 创建Gin路由器
	r := gin.New()

	// 添加中间件
	r.Use(gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		return fmt.Sprintf("%s - [%s] \"%s %s %s %d %s \"%s\" %s\"\n",
			param.ClientIP,
			param.TimeStamp.Format("2006/01/02 - 15:04:05"),
			param.Method,
			param.Path,
			param.Request.Proto,
			param.StatusCode,
			param.Latency,
			param.Request.UserAgent(),
			param.ErrorMessage,
		)
	}))
	r.Use(gin.Recovery())
	r.Use(middlewares.CORSMiddleware())

	// 创建处理器
	logger.Info("初始化API处理器...")

	authHandler := handlers.NewAuthHandler()
	logger.Info("认证处理器初始化完成")

	historyHandler := handlers.NewHistoryHandler()
	logger.Info("历史记录处理器初始化完成")

	transformHandler, err := handlers.NewTransformHandler()
	if err != nil {
		logger.Errorf("创建转换处理器失败: %v", err)
		os.Exit(1)
	}
	defer transformHandler.Close()
	logger.Info("转换处理器初始化完成")

	imageHandler, err := handlers.NewImageHandler()
	if err != nil {
		logger.Errorf("创建镜像处理器失败: %v", err)
		os.Exit(1)
	}
	defer imageHandler.Close()
	logger.Info("镜像处理器初始化完成")

	registryHandler := handlers.NewRegistryHandler()
	logger.Info("仓库配置处理器初始化完成")

	// 注册API路由
	logger.Info("注册API路由...")

	// API路由组
	api := r.Group("/api")
	{
		// 认证相关路由
		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/logout", authHandler.Logout)
			auth.POST("/change-token", middlewares.AuthMiddleware(), authHandler.ChangeToken)
		}

		// 需要认证的路由
		authenticated := api.Group("")
		authenticated.Use(middlewares.AuthMiddleware())
		{
			// 镜像转换相关
			authenticated.POST("/transform/start", transformHandler.StartTransform)

			// 镜像解析相关
			authenticated.POST("/image/parse", imageHandler.ParseImage)
			authenticated.POST("/image/build-target", imageHandler.BuildTargetImage)

			// 历史记录相关
			authenticated.GET("/history", historyHandler.GetHistory)
			authenticated.GET("/history/stats", historyHandler.GetHistoryStats)
			authenticated.DELETE("/history", historyHandler.ClearHistory)

			// 仓库配置管理相关
			authenticated.GET("/registry/configs", registryHandler.GetConfigs)
			authenticated.POST("/registry/configs", registryHandler.CreateConfig)
			authenticated.PUT("/registry/configs/:id", registryHandler.UpdateConfig)
			authenticated.DELETE("/registry/configs/:id", registryHandler.DeleteConfig)
			authenticated.POST("/registry/test", registryHandler.TestConnection)
			authenticated.POST("/registry/configs/:id/test", registryHandler.TestConfigConnection)
		}
	}

	logger.Info("API路由注册完成")

	// 配置嵌入的静态文件服务
	logger.Info("配置前端静态文件服务...")
	setupStaticAssets(r, logger)

	// 处理React路由的catch-all规则
	r.NoRoute(func(c *gin.Context) {
		path := c.Request.URL.Path
		// API路由返回404
		if len(path) >= 4 && path[:4] == "/api" {
			c.JSON(http.StatusNotFound, map[string]interface{}{
				"success": false,
				"message": "API接口不存在",
			})
			return
		}
		// 其他路由返回React应用
		serveIndexHTML(c)
	})

	// 健康检查端点
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, map[string]interface{}{
			"status":  "ok",
			"message": "Docker镜像转换服务运行正常",
		})
	})

	// 启动服务器
	port := cfg.Port
	logger.Infof("服务器启动在端口: %s", port)
	logger.Infof("健康检查: http://localhost:%s/health", port)
	logger.Infof("前端界面: http://localhost:%s", port)

	// 创建服务器
	srv := &http.Server{
		Addr:    ":" + port,
		Handler: r,
	}

	// 在协程中启动服务器
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Errorf("服务器启动失败: %v", err)
			os.Exit(1)
		}
	}()

	// 等待中断信号
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	logger.Info("正在关闭服务器...")

	// 优雅关闭
	if err := srv.Shutdown(nil); err != nil {
		logger.Errorf("服务器关闭失败: %v", err)
	}

	logger.Info("服务器已停止")
}
