import React, { useState, useEffect } from 'react';
import { Select, Button, Space, Tag, message } from 'antd';
import { PlusOutlined, SettingOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../services/api';

const RegistrySelector = ({ 
  value, 
  onChange, 
  onManageConfigs,
  onCreateNew 
}) => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/registry/configs');
      if (response.data.success) {
        const configList = response.data.data || [];
        setConfigs(configList);
        
        // 自动选择默认配置
        if (!value && configList.length > 0) {
          const defaultConfig = configList.find(c => c.is_default);
          if (defaultConfig) {
            onChange(defaultConfig);
          } else {
            // 如果没有默认配置，选择第一个
            onChange(configList[0]);
          }
        }
      }
    } catch (error) {
      console.error('获取仓库配置失败:', error);
      if (error.response?.status !== 404) {
        message.error('获取仓库配置失败');
      }
    } finally {
      setLoading(false);
    }
  };

  // 获取状态标签的颜色和文本
  const getStatusTag = (status) => {
    switch (status) {
      case 'verified':
        return { color: 'green', text: '已验证' };
      case 'failed':
        return { color: 'red', text: '失败' };
      default:
        return { color: 'orange', text: '未测试' };
    }
  };

  // 格式化最后测试时间
  const formatLastTestTime = (lastTestTime) => {
    if (!lastTestTime) return '';
    
    const date = new Date(lastTestTime);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return '刚刚测试';
    if (diffMinutes < 60) return `${diffMinutes}分钟前测试`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}小时前测试`;
    
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }) + ' 测试';
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Select
          style={{ flex: 1 }}
          placeholder="选择仓库配置"
          loading={loading}
          value={value?.id}
          onChange={(configId) => {
            const config = configs.find(c => c.id === configId);
            onChange(config);
          }}
          notFoundContent={
            loading ? '加载中...' : 
            configs.length === 0 ? '暂无配置，请先创建' : '未找到配置'
          }
        >
          {configs.map(config => {
            const statusTag = getStatusTag(config.status);
            return (
              <Select.Option key={config.id} value={config.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space size="small">
                    <span>{config.name}</span>
                    <Tag color={statusTag.color} size="small">
                      {statusTag.text}
                    </Tag>
                    {config.is_default && (
                      <Tag color="blue" size="small">默认</Tag>
                    )}
                  </Space>
                </div>
              </Select.Option>
            );
          })}
        </Select>
        
        <Button 
          icon={<ReloadOutlined />}
          onClick={fetchConfigs}
          loading={loading}
          title="刷新配置列表"
        />
        
        <Button 
          icon={<PlusOutlined />} 
          onClick={onCreateNew}
          title="新建配置"
        />
        
        <Button 
          icon={<SettingOutlined />} 
          onClick={onManageConfigs}
          title="管理配置"
        />
      </div>

      {value && (
        <div style={{ 
          fontSize: '12px', 
          color: '#666', 
          padding: '8px 12px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          border: '1px solid #d9d9d9'
        }}>
          <div style={{ marginBottom: 2 }}>
            <strong>仓库地址:</strong> {value.registry_url}
          </div>
          <div style={{ marginBottom: 2 }}>
            <strong>用户名:</strong> {value.username}
          </div>
          {value.last_test_time && (
            <div style={{ color: '#999' }}>
              {formatLastTestTime(value.last_test_time)}
            </div>
          )}
        </div>
      )}

      {configs.length === 0 && !loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '16px',
          color: '#999',
          fontSize: '12px',
          border: '1px dashed #d9d9d9',
          borderRadius: '4px'
        }}>
          暂无仓库配置，请点击 
          <Button type="link" size="small" onClick={onCreateNew}>
            新建配置
          </Button>
        </div>
      )}
    </Space>
  );
};

export default RegistrySelector; 