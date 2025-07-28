import React, { useState } from 'react';
import { Form, Input, Button, Space, message, Tooltip, Radio, Divider, Tag, Typography } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons';
import api from '../services/api';
import RegistrySelector from './RegistrySelector';
import RegistryConfigModal from './RegistryConfigModal';
import ConnectionTestButton from './ConnectionTestButton';
import { 
  parseImageName, 
  generateTargetImageName, 
  validateImageName, 
  formatImageInfo, 
  getGenerationExplanation 
} from '../utils/imageUtils';

const { Text } = Typography;

const TaskCreateForm = ({ onTaskSubmit }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  // 镜像解析相关状态
  const [sourceImageInfo, setSourceImageInfo] = useState(null); // 解析后的镜像信息
  const [targetImageGenerated, setTargetImageGenerated] = useState(false); // 是否自动生成
  const [generationExplanation, setGenerationExplanation] = useState(''); // 生成说明
  const [copied, setCopied] = useState(false); // 复制状态
  
  // 仓库配置相关状态
  const [configMode, setConfigMode] = useState('saved'); // 'saved' | 'manual'
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [configModalVisible, setConfigModalVisible] = useState(false);

  // 解析镜像名称
  const parseAndGenerateImage = (sourceImage, targetRegistry) => {
    if (!sourceImage || !sourceImage.trim()) {
      setSourceImageInfo(null);
      setTargetImageGenerated(false);
      setGenerationExplanation('');
      return;
    }

    // 解析源镜像
    const parsed = parseImageName(sourceImage.trim());
    setSourceImageInfo(parsed);

    // 如果有目标仓库，自动生成目标镜像
    if (parsed && targetRegistry) {
      const targetImage = generateTargetImageName(sourceImage.trim(), targetRegistry);
      if (targetImage) {
        form.setFieldsValue({ target_image: targetImage });
        setTargetImageGenerated(true);
        setGenerationExplanation(getGenerationExplanation(sourceImage.trim(), targetRegistry));
      }
    }
  };

  // 获取当前的目标仓库地址
  const getCurrentTargetRegistry = () => {
    if (configMode === 'saved' && selectedConfig) {
      return selectedConfig.registry_url;
    } else {
      return form.getFieldValue('target_host');
    }
  };

  // 处理源镜像输入变化
  const handleSourceImageChange = (e) => {
    const sourceImage = e.target.value;
    const targetRegistry = getCurrentTargetRegistry();
    parseAndGenerateImage(sourceImage, targetRegistry);
  };

  // 处理目标仓库地址变化
  const handleTargetHostChange = (e) => {
    const targetHost = e.target.value;
    const sourceImage = form.getFieldValue('source_image');
    if (sourceImage) {
      parseAndGenerateImage(sourceImage, targetHost);
    }
  };

  // 复制目标镜像名称
  const copyTargetImage = () => {
    const targetImage = form.getFieldValue('target_image');
    if (targetImage) {
      navigator.clipboard.writeText(targetImage).then(() => {
        setCopied(true);
        message.success('目标镜像名称已复制');
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        message.error('复制失败');
      });
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
    const sourceImage = form.getFieldValue('source_image');
    if (sourceImage) {
      parseAndGenerateImage(sourceImage, config.registry_url);
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
          source_image: sourceImageInfo?.original || values.source_image,
          target_image: values.target_image,
          config_id: selectedConfig.id  // 传递配置ID，后端会解密密码
        };
      } else {
        // 手动输入模式
        taskData = {
          source_image: sourceImageInfo?.original || values.source_image,
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
      setSourceImageInfo(null);
      setTargetImageGenerated(false);
      setGenerationExplanation('');
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
          { required: true, message: '请输入源镜像名称!' },
          {
            validator: (_, value) => {
              if (!value) return Promise.resolve();
              const validation = validateImageName(value);
              if (!validation.valid) {
                return Promise.reject(new Error(validation.error));
              }
              return Promise.resolve();
            }
          }
        ]}
      >
        <Input
          placeholder="例如: nginx:latest, gcr.io/google-containers/pause:3.2"
          onChange={handleSourceImageChange}
          size="large"
        />
      </Form.Item>

      {/* 镜像解析信息 */}
      {sourceImageInfo && (
        <div style={{ marginTop: -16, marginBottom: 16 }}>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <div style={{ fontSize: '12px' }}>
              <Text type="secondary">镜像信息: </Text>
              <Tag color="blue" size="small">{formatImageInfo(sourceImageInfo)}</Tag>
            </div>
            {sourceImageInfo.registry !== 'docker.io' && (
              <div style={{ fontSize: '11px', color: '#999' }}>
                Registry: {sourceImageInfo.registry} | Namespace: {sourceImageInfo.namespace} | Repository: {sourceImageInfo.repository}:{sourceImageInfo.tag}
              </div>
            )}
          </Space>
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
            <Tooltip title="目标镜像名称将根据源镜像和目标仓库自动生成，您也可以手动修改">
              <ExclamationCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} />
            </Tooltip>
          </span>
        }
        name="target_image"
        rules={[{ required: true, message: '请输入目标镜像名称!' }]}
      >
        <Input
          placeholder="harbor.example.com/library/nginx:latest"
          size="large"
          suffix={
            form.getFieldValue('target_image') && (
              <Tooltip title="复制目标镜像名称">
                <Button
                  type="text"
                  size="small"
                  icon={copied ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CopyOutlined />}
                  onClick={copyTargetImage}
                />
              </Tooltip>
            )
          }
        />
      </Form.Item>

      {/* 自动生成说明 */}
      {targetImageGenerated && generationExplanation && (
        <div style={{ marginTop: -16, marginBottom: 16 }}>
          <Space size={4}>
            <CheckOutlined style={{ color: '#52c41a', fontSize: '12px' }} />
            <Text style={{ fontSize: '12px', color: '#52c41a' }}>
              已自动生成
            </Text>
            <Text style={{ fontSize: '11px', color: '#999' }}>
              {generationExplanation}
            </Text>
          </Space>
        </div>
      )}

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