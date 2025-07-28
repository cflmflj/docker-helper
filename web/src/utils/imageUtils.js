/**
 * 镜像名称解析和自动生成工具函数
 */

/**
 * 解析镜像名称为各个组成部分
 * @param {string} imageName - 镜像名称
 * @returns {object} 解析结果
 */
export function parseImageName(imageName) {
  if (!imageName || typeof imageName !== 'string') {
    return null;
  }

  const trimmed = imageName.trim();
  if (!trimmed) {
    return null;
  }

  try {
    // 处理tag部分
    let imageWithoutTag, tag;
    const tagSeparatorIndex = trimmed.lastIndexOf(':');
    
    // 检查是否有tag，且不是端口号
    if (tagSeparatorIndex > 0 && !trimmed.substring(tagSeparatorIndex + 1).includes('/')) {
      imageWithoutTag = trimmed.substring(0, tagSeparatorIndex);
      tag = trimmed.substring(tagSeparatorIndex + 1);
    } else {
      imageWithoutTag = trimmed;
      tag = 'latest'; // 默认tag
    }

    // 处理registry和namespace/repository部分
    const parts = imageWithoutTag.split('/');
    let registry, namespace, repository;

    if (parts.length === 1) {
      // 格式: nginx
      registry = 'docker.io';
      namespace = 'library';
      repository = parts[0];
    } else if (parts.length === 2) {
      // 可能是: user/nginx 或 registry.com/nginx
      const firstPart = parts[0];
      
      // 判断第一部分是否为registry（包含点号或端口号）
      if (firstPart.includes('.') || firstPart.includes(':')) {
        registry = firstPart;
        namespace = 'library'; // 默认命名空间
        repository = parts[1];
      } else {
        registry = 'docker.io';
        namespace = firstPart;
        repository = parts[1];
      }
    } else if (parts.length >= 3) {
      // 格式: registry.com/namespace/repository 或更深层次
      registry = parts[0];
      namespace = parts.slice(1, -1).join('/'); // 支持多层命名空间
      repository = parts[parts.length - 1];
    }

    return {
      original: imageName,
      registry,
      namespace,
      repository,
      tag,
      fullName: `${registry}/${namespace}/${repository}:${tag}`
    };
  } catch (error) {
    console.warn('Failed to parse image name:', imageName, error);
    return null;
  }
}

/**
 * 根据源镜像和目标仓库生成目标镜像名称
 * @param {string} sourceImage - 源镜像名称
 * @param {string} targetRegistry - 目标仓库地址
 * @returns {string|null} 生成的目标镜像名称
 */
export function generateTargetImageName(sourceImage, targetRegistry) {
  if (!sourceImage || !targetRegistry) {
    return null;
  }

  const parsed = parseImageName(sourceImage);
  if (!parsed) {
    return null;
  }

  const cleanTargetRegistry = targetRegistry.trim().replace(/\/$/, ''); // 移除末尾斜杠

  // 检查是否已经是目标仓库的镜像
  if (parsed.registry === cleanTargetRegistry) {
    return sourceImage; // 保持不变
  }

  // 根据源仓库类型生成目标镜像名称
  if (parsed.registry === 'docker.io') {
    // Docker Hub镜像
    if (parsed.namespace === 'library') {
      // Docker Hub官方镜像
      return `${cleanTargetRegistry}/library/${parsed.repository}:${parsed.tag}`;
    } else {
      // Docker Hub用户镜像
      return `${cleanTargetRegistry}/${parsed.namespace}/${parsed.repository}:${parsed.tag}`;
    }
  } else {
    // 第三方仓库镜像，保留完整路径
    return `${cleanTargetRegistry}/${parsed.registry}/${parsed.namespace}/${parsed.repository}:${parsed.tag}`;
  }
}

/**
 * 验证镜像名称格式是否正确
 * @param {string} imageName - 镜像名称
 * @returns {object} 验证结果
 */
export function validateImageName(imageName) {
  if (!imageName || typeof imageName !== 'string') {
    return { valid: false, error: '镜像名称不能为空' };
  }

  const trimmed = imageName.trim();
  if (!trimmed) {
    return { valid: false, error: '镜像名称不能为空' };
  }

  // 基本格式检查
  const invalidChars = /[^a-zA-Z0-9._\-/:]/;
  if (invalidChars.test(trimmed)) {
    return { valid: false, error: '镜像名称包含无效字符' };
  }

  // 尝试解析
  const parsed = parseImageName(trimmed);
  if (!parsed) {
    return { valid: false, error: '镜像名称格式无效' };
  }

  return { valid: true, parsed };
}

/**
 * 格式化镜像信息用于显示
 * @param {object} parsed - 解析后的镜像信息
 * @returns {string} 格式化的描述
 */
export function formatImageInfo(parsed) {
  if (!parsed) {
    return '';
  }

  const parts = [];
  
  if (parsed.registry === 'docker.io') {
    if (parsed.namespace === 'library') {
      parts.push('Docker Hub官方镜像');
    } else {
      parts.push(`Docker Hub用户镜像 (${parsed.namespace})`);
    }
  } else {
    parts.push(`第三方仓库 (${parsed.registry})`);
  }

  parts.push(`${parsed.repository}:${parsed.tag}`);
  
  return parts.join(' - ');
}

/**
 * 获取镜像的建议命名规则说明
 * @param {string} sourceImage - 源镜像
 * @param {string} targetRegistry - 目标仓库
 * @returns {string} 说明文本
 */
export function getGenerationExplanation(sourceImage, targetRegistry) {
  const parsed = parseImageName(sourceImage);
  if (!parsed || !targetRegistry) {
    return '';
  }

  if (parsed.registry === 'docker.io') {
    if (parsed.namespace === 'library') {
      return '检测到Docker Hub官方镜像，将添加 "library" 命名空间';
    } else {
      return `检测到Docker Hub用户镜像，将保留 "${parsed.namespace}" 命名空间`;
    }
  } else {
    return `检测到第三方仓库镜像，将保留完整路径 "${parsed.registry}/${parsed.namespace}"`;
  }
} 