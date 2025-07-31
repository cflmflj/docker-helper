package utils

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"io"
	"os"
)

// CryptoService 加密服务
type CryptoService struct {
	key []byte
}

// NewCryptoService 创建加密服务实例
func NewCryptoService() *CryptoService {
	// 从环境变量获取加密密钥，如果没有则使用默认密钥
	secretKey := os.Getenv("ENCRYPTION_KEY")
	if secretKey == "" {
		secretKey = "docker-helper-secret-key-2025"
	}

	// 使用SHA256生成32字节密钥
	hasher := sha256.New()
	hasher.Write([]byte(secretKey))
	key := hasher.Sum(nil)

	return &CryptoService{key: key}
}

// EncryptPassword 加密密码
func (c *CryptoService) EncryptPassword(password string) (string, error) {
	if password == "" {
		return "", errors.New("password cannot be empty")
	}

	// 创建AES cipher
	block, err := aes.NewCipher(c.key)
	if err != nil {
		return "", err
	}

	// 创建GCM
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	// 生成随机nonce
	nonce := make([]byte, gcm.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	// 加密
	ciphertext := gcm.Seal(nonce, nonce, []byte(password), nil)

	// 返回base64编码的结果
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// DecryptPassword 解密密码
func (c *CryptoService) DecryptPassword(encryptedPassword string) (string, error) {
	if encryptedPassword == "" {
		return "", errors.New("encrypted password cannot be empty")
	}

	// base64解码
	data, err := base64.StdEncoding.DecodeString(encryptedPassword)
	if err != nil {
		return "", err
	}

	// 创建AES cipher
	block, err := aes.NewCipher(c.key)
	if err != nil {
		return "", err
	}

	// 创建GCM
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	// 检查数据长度
	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", errors.New("ciphertext too short")
	}

	// 分离nonce和密文
	nonce, ciphertext := data[:nonceSize], data[nonceSize:]

	// 解密
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}

// EncryptPasswordSimple 简化的加密函数
func EncryptPasswordSimple(password string) (string, error) {
	crypto := NewCryptoService()
	return crypto.EncryptPassword(password)
}

// DecryptPasswordSimple 简化的解密函数
func DecryptPasswordSimple(encryptedPassword string) (string, error) {
	crypto := NewCryptoService()
	return crypto.DecryptPassword(encryptedPassword)
}
