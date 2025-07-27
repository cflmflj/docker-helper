import React, { useState } from 'react';
import { Form, Input, Button, Space, message, Tooltip, Radio, Divider } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import api from '../services/api';
import RegistrySelector from './RegistrySelector';
import RegistryConfigModal from './RegistryConfigModal';
import ConnectionTestButton from './ConnectionTestButton';

const TaskCreateForm = ({ onTaskSubmit }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [parsedImage, setParsedImage] = useState('');
  
  // 仓库配置相关状态
  const [configMode, setConfigMode] = useState('saved'); // 'saved' | 'manual'
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [configModalVisible, setConfigModalVisible] = useState(false);

  // 解析镜像名称
  const parseImage = async (imageValue) => {
    if (!imageValue || !imageValue.trim()) {
      setParsedImage('');
      return;
    }

    try {
      const response = await api.post('/image/parse', { image: imageValue.trim() });
      if (response.data.success) {
        setParsedImage(response.data.parsed_image);
        // 自动生成目标镜像名称
        const targetHost = form.getFieldValue('target_host');
        if (targetHost) {
          generateTargetImage(response.data.parsed_image, targetHost);
        }
      }
    } catch (error) {
      console.error('Parse image error:', error);
      setParsedImage(imageValue.trim());
    }
  };

  // 生成目标镜像名称
  const generateTargetImage = (sourceImage, targetHost) => {
    if (!sourceImage || !targetHost) return;
    
    // 移除源镜像中的registry部分（如果有）
    let imageName = sourceImage;
    if (sourceImage.includes('/') && !sourceImage.startsWith('library/')) {
      // 如果包含registry，保留完整路径
      const targetImage = `${targetHost}/transform/${sourceImage}`;
      form.setFieldsValue({ target_image: targetImage });
    } else {
      // 标准镜像，只保留名称和标签
      const targetImage = `${targetHost}/transform/${imageName}`;
      form.setFieldsValue({ target_image: targetImage });
    }
  };

  // 处理源镜像输入变化
  const handleSourceImageChange = (e) => {
    const value = e.target.value;
    parseImage(value);
  };

  // 处理目标仓库地址变化
  const handleTargetHostChange = (e) => {
    const targetHost = e.target.value;
    if (parsedImage && targetHost) {
      generateTargetImage(parsedImage, targetHost);
    }
  };

  // 处理配置模式变化
  const handleConfigModeChange = (e) => {
    setConfigMode(e.target.value);
    if (e.target.value === 'saved' && selectedConfig) {
      // 使用已保存配置填充表单
      fillFormWithConfig(selectedConfig);
    }
  };

  // 使用配置填充表单
  const fillFormWithConfig = (config) => {
    if (!config) return;
    
    form.setFieldsValue({
      target_host: config.registry_url,
      target_username: config.username,
      // 注意：不设置密码字段，密码在后端处理时会从配置中获取
    });
    
    // 更新目标镜像
    if (parsedImage) {
      generateTargetImage(parsedImage, config.registry_url);
    }
  };

  // 处理配置选择变化
  const handleConfigChange = (config) => {
    setSelectedConfig(config);
    if (configMode === 'saved' && config) {
      fillFormWithConfig(config);
    }
  };

  // 处理配置变化（新建、编辑、删除后的回调）
  const handleConfigModalChange = () => {
    // 这里可以刷新配置列表，RegistrySelector内部会自动处理
  };

  // 创建任务
  const handleCreateTask = async (values) => {
    setLoading(true);
    
    try {
      let taskData;
      
      if (configMode === 'saved' && selectedConfig) {
        // 使用已保存配置
        taskData = {
          source_image: parsedImage || values.source_image,
          target_image: values.target_image,
          config_id: selectedConfig.id  // 传递配置ID，后端会解密密码
        };
      } else {
        // 手动输入模式
        taskData = {
          source_image: parsedImage || values.source_image,
          target_host: values.target_host,
          target_username: values.target_username,
          target_password: values.target_password,
          target_image: values.target_image
        };
      }

      // 调用父组件的任务提交函数
      await onTaskSubmit(taskData);
      
      // 重置表单
      form.resetFields();
      setParsedImage('');
      setSelectedConfig(null);
    } catch (error) {
      const errorMsg = error.response?.data?.message || '创建任务失败';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleCreateTask}
      autoComplete="off"
    >
      <Form.Item
        label="📦 源镜像"
        name="source_image"
        rules={[
          { required: true, message: '请输入源镜像名称!' }
        ]}
      >
        <Input
          placeholder="例如: nginx:latest, gcr.io/google-containers/pause:3.2"
          onChange={handleSourceImageChange}
          size="large"
        />
      </Form.Item>

      {parsedImage && parsedImage !== form.getFieldValue('source_image') && (
        <div style={{ marginTop: -16, marginBottom: 16, color: '#52c41a', fontSize: '12px' }}>
          解析后的镜像: {parsedImage}
        </div>
      )}

      <Form.Item label="🏠 目标仓库配置">
        {/* 配置模式选择 */}
        <div style={{ marginBottom: 16 }}>
          <Radio.Group 
            value={configMode} 
            onChange={handleConfigModeChange}
            size="small"
          >
            <Radio value="saved">使用已保存配置</Radio>
            <Radio value="manual">手动输入</Radio>
          </Radio.Group>
        </div>

        {configMode === 'saved' ? (
          /* 已保存配置模式 */
          <RegistrySelector
            value={selectedConfig}
            onChange={handleConfigChange}
            onManageConfigs={() => setConfigModalVisible(true)}
            onCreateNew={() => {
              setConfigModalVisible(true);
            }}
          />
        ) : (
          /* 手动输入模式 */
          <div>
            <Space.Compact style={{ display: 'flex', marginBottom: 8 }}>
              <Form.Item
                name="target_host"
                rules={[{ required: true, message: '请输入仓库地址!' }]}
                style={{ flex: 1, marginBottom: 0 }}
              >
                <Input
                  placeholder="harbor.example.com"
                  onChange={handleTargetHostChange}
                  size="large"
                />
              </Form.Item>
              <ConnectionTestButton
                registryURL={form.getFieldValue('target_host')}
                username={form.getFieldValue('target_username')}
                password={form.getFieldValue('target_password')}
                size="large"
              />
            </Space.Compact>
            
            <Space style={{ width: '100%' }}>
              <Form.Item
                name="target_username"
                rules={[{ required: true, message: '请输入用户名!' }]}
                style={{ flex: 1, marginBottom: 0 }}
              >
                <Input placeholder="用户名" size="large" />
              </Form.Item>
              <Form.Item
                name="target_password"
                rules={[{ required: true, message: '请输入密码!' }]}
                style={{ flex: 1, marginBottom: 0 }}
              >
                <Input.Password placeholder="密码" size="large" />
              </Form.Item>
            </Space>
          </div>
        )}
      </Form.Item>

      <Form.Item
        label={
          <span>
            🏷️ 目标镜像
            <Tooltip title="目标镜像名称将自动生成，您也可以手动修改">
              <ExclamationCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} />
            </Tooltip>
          </span>
        }
        name="target_image"
        rules={[{ required: true, message: '请输入目标镜像名称!' }]}
      >
        <Input
          placeholder="harbor.example.com/transform/nginx:latest"
          size="large"
        />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          icon={<PlusOutlined />}
          loading={loading}
          size="large"
          block
          style={{ height: '48px', borderRadius: '8px', fontSize: '16px', fontWeight: '500' }}
        >
          🚀 开始转换
        </Button>
      </Form.Item>

      {/* 仓库配置管理弹窗 */}
      <RegistryConfigModal
        visible={configModalVisible}
        onClose={() => setConfigModalVisible(false)}
        onConfigChange={handleConfigModalChange}
      />
    </Form>
  );
};

export default TaskCreateForm; 