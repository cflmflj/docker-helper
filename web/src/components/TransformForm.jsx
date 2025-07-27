import React, { useState } from 'react';
import { Form, Input, Button, Space, message, Tooltip } from 'antd';
import { SendOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import api from '../services/api';

const TransformForm = ({ onStatusChange, onComplete }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [parsedImage, setParsedImage] = useState('');

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

  // 开始转换
  const handleStartTransform = async (values) => {
    setLoading(true);
    
    try {
      onStatusChange({
        status: 'running',
        message: '准备开始转换...',
        progress: ''
      });

      const transformData = {
        source_image: parsedImage || values.source_image,
        target_host: values.target_host,
        target_username: values.target_username,
        target_password: values.target_password,
        target_image: values.target_image
      };

      const response = await api.post('/transform/start', transformData);
      
      if (response.data.success) {
        onStatusChange({
          status: 'success',
          message: '转换成功!',
          progress: '',
          result: {
            target_image: response.data.data.target_image || response.data.data.TargetImage,
            duration: response.data.data.duration || response.data.data.Duration
          }
        });
        message.success('镜像转换成功!');
        onComplete();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || '转换失败';
      onStatusChange({
        status: 'error',
        message: errorMsg,
        progress: ''
      });
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleStartTransform}
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
        <Space.Compact style={{ display: 'flex' }}>
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
        </Space.Compact>
        
        <Space style={{ marginTop: 8, width: '100%' }}>
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
          icon={<SendOutlined />}
          loading={loading}
          size="large"
          block
          style={{ height: '48px', borderRadius: '8px', fontSize: '16px', fontWeight: '500' }}
        >
          🚀 开始转换
        </Button>
      </Form.Item>
    </Form>
  );
};

export default TransformForm; 