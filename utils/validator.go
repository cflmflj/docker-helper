package utils

import (
	"fmt"
	"regexp"
	"strings"
)

// ValidateImageName 验证镜像名称格式
func ValidateImageName(image string) error {
	if image == "" {
		return fmt.Errorf("镜像名称不能为空")
	}

	// 基本格式检查：允许 nginx, nginx:tag, registry.com/namespace/image:tag
	pattern := `^([a-zA-Z0-9\-\.]+([:\d+])?/)?([a-zA-Z0-9\-\_\.]+/)?[a-zA-Z0-9\-\_\.]+(:[\w\-\.]+)?$`
	matched, err := regexp.MatchString(pattern, image)
	if err != nil {
		return fmt.Errorf("镜像名称格式验证失败: %v", err)
	}
	if !matched {
		return fmt.Errorf("镜像名称格式不正确")
	}

	return nil
}

// ParseImageName 解析镜像名称
func ParseImageName(image string) (registry, namespace, repository, tag string) {
	// 默认值
	registry = "docker.io"
	namespace = "library"
	tag = "latest"

	// 分离tag
	parts := strings.Split(image, ":")
	imagePart := parts[0]
	if len(parts) > 1 {
		tag = parts[1]
	}

	// 分析镜像路径
	pathParts := strings.Split(imagePart, "/")

	switch len(pathParts) {
	case 1:
		// nginx -> docker.io/library/nginx
		repository = pathParts[0]
	case 2:
		if strings.Contains(pathParts[0], ".") || strings.Contains(pathParts[0], ":") {
			// registry.com/nginx -> registry.com/library/nginx
			registry = pathParts[0]
			repository = pathParts[1]
		} else {
			// username/nginx -> docker.io/username/nginx
			namespace = pathParts[0]
			repository = pathParts[1]
		}
	case 3:
		// registry.com/namespace/nginx
		registry = pathParts[0]
		namespace = pathParts[1]
		repository = pathParts[2]
	default:
		// 处理更复杂的路径，合并中间部分为namespace
		registry = pathParts[0]
		namespace = strings.Join(pathParts[1:len(pathParts)-1], "/")
		repository = pathParts[len(pathParts)-1]
	}

	return
}

// NormalizeImageName 标准化镜像名称
func NormalizeImageName(image string) string {
	registry, namespace, repository, tag := ParseImageName(image)

	if registry == "docker.io" && namespace == "library" {
		return fmt.Sprintf("%s:%s", repository, tag)
	} else if registry == "docker.io" {
		return fmt.Sprintf("%s/%s:%s", namespace, repository, tag)
	} else {
		return fmt.Sprintf("%s/%s/%s:%s", registry, namespace, repository, tag)
	}
}

// BuildTargetImageName 构建目标镜像名称
func BuildTargetImageName(sourceImage, targetHost string) string {
	registry, namespace, repository, tag := ParseImageName(sourceImage)

	// 构建目标路径
	if registry == "docker.io" && namespace == "library" {
		// nginx:latest -> harbor.com/transform/nginx:latest
		return fmt.Sprintf("%s/transform/%s:%s", targetHost, repository, tag)
	} else if registry == "docker.io" {
		// user/nginx:latest -> harbor.com/transform/user/nginx:latest
		return fmt.Sprintf("%s/transform/%s/%s:%s", targetHost, namespace, repository, tag)
	} else {
		// gcr.io/google/nginx:latest -> harbor.com/transform/gcr.io/google/nginx:latest
		return fmt.Sprintf("%s/transform/%s/%s/%s:%s", targetHost, registry, namespace, repository, tag)
	}
}
