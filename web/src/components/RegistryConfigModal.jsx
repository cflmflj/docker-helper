import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Button, 
  List, 
  Space, 
  Tag, 
  Popconfirm,
  message,
  Switch,
  Divider,
  Empty,
  Spin
} from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  StarOutlined,
  WifiOutlined,
  PlusOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone
} from '@ant-design/icons';
import ConnectionTestButton from './ConnectionTestButton';
import api from '../services/api';

const RegistryConfigModal = ({ visible, onClose, onConfigChange }) => {
  const [configs, setConfigs] = useState([]);
  const [editingConfig, setEditingConfig] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchConfigs();
      // 清除编辑状态
      setEditingConfig(null);
      form.resetFields();
    }
  }, [visible]);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/registry/configs');
      if (response.data.success) {
        setConfigs(response.data.data || []);
      }
    } catch (error) {
      console.error('获取配置失败:', error);
      if (error.response?.status !== 404) {
        message.error('获取配置失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values) => {
    setSubmitting(true);
    try {
      if (editingConfig) {
        // 更新配置
        await api.put(`/registry/configs/${editingConfig.id}`, values);
        message.success('配置更新成功');
      } else {
        // 新建配置
        await api.post('/registry/configs', values);
        message.success('配置创建成功');
      }
      
      // 重置表单和状态
      form.resetFields();
      setEditingConfig(null);
      
      // 刷新配置列表
      await fetchConfigs();
      
      // 通知父组件配置变化
      onConfigChange && onConfigChange();
    } catch (error) {
      const errorMsg = error.response?.data?.message || '保存失败';
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (configId) => {
    try {
      await api.delete(`/registry/configs/${configId}`);
      message.success('删除成功');
      await fetchConfigs();
      onConfigChange && onConfigChange();
    } catch (error) {
      const errorMsg = error.response?.data?.message || '删除失败';
      message.error(errorMsg);
    }
  };

  const handleTestConfig = async (config) => {
    try {
      const response = await api.post(`/registry/configs/${config.id}/test`);
      if (response.data.success) {
        const result = response.data.data;
        if (result.success) {
          message.success(`${config.name} 连接测试成功`);
        } else {
          message.error(`${config.name} 连接测试失败: ${result.error}`);
        }
        // 刷新配置列表以更新状态
        await fetchConfigs();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || '测试失败';
      message.error(errorMsg);
    }
  };

  const handleEdit = (config) => {
    setEditingConfig(config);
    form.setFieldsValue({
      name: config.name,
      registry_url: config.registry_url,
      username: config.username,
      // 不设置密码，让用户选择是否更新
      is_default: config.is_default
    });
  };

  const handleCancel = () => {
    form.resetFields();
    setEditingConfig(null);
  };

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

  const formatLastTestTime = (lastTestTime) => {
    if (!lastTestTime) return '从未测试';
    
    const date = new Date(lastTestTime);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return '刚刚';
    if (diffMinutes < 60) return `${diffMinutes}分钟前`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}小时前`;
    
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <Modal
      title="仓库配置管理"
      open={visible}
      onCancel={onClose}
      width={900}
      footer={null}
      destroyOnClose
    >
      <div style={{ display: 'flex', gap: 24, height: '500px' }}>
        {/* 左侧：配置列表 */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Button 
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingConfig(null);
                  form.resetFields();
                }}
              >
                新建配置
              </Button>
              <Button onClick={fetchConfigs} loading={loading}>
                刷新
              </Button>
            </Space>
          </div>

          <div style={{ height: '420px', overflow: 'auto' }}>
            <Spin spinning={loading}>
              {configs.length === 0 ? (
                <Empty
                  description="暂无仓库配置"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                  <Button type="primary" onClick={() => {
                    setEditingConfig(null);
                    form.resetFields();
                  }}>
                    创建第一个配置
                  </Button>
                </Empty>
              ) : (
                <List
                  dataSource={configs}
                  renderItem={(config) => {
                    const statusTag = getStatusTag(config.status);
                    return (
                      <List.Item
                        className={editingConfig?.id === config.id ? 'selected' : ''}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: editingConfig?.id === config.id ? '#e6f7ff' : 'transparent',
                          border: editingConfig?.id === config.id ? '1px solid #1890ff' : '1px solid transparent',
                          borderRadius: '4px',
                          margin: '4px 0',
                          padding: '12px'
                        }}
                        onClick={() => handleEdit(config)}
                        actions={[
                          <Button 
                            size="small" 
                            icon={<WifiOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTestConfig(config);
                            }}
                            title="测试连接"
                          />,
                          <Popconfirm
                            title="确定删除此配置？"
                            onConfirm={(e) => {
                              e?.stopPropagation();
                              handleDelete(config.id);
                            }}
                            onClick={(e) => e?.stopPropagation()}
                          >
                            <Button 
                              size="small" 
                              danger 
                              icon={<DeleteOutlined />}
                              title="删除配置"
                            />
                          </Popconfirm>
                        ]}
                      >
                        <List.Item.Meta
                          title={
                            <Space>
                              <span>{config.name}</span>
                              {config.is_default && <Tag color="blue">默认</Tag>}
                              <Tag color={statusTag.color} size="small">
                                {statusTag.text}
                              </Tag>
                            </Space>
                          }
                          description={
                            <div>
                              <div>{config.registry_url}</div>
                              <div style={{ fontSize: '11px', color: '#999' }}>
                                用户: {config.username} • {formatLastTestTime(config.last_test_time)}
                              </div>
                            </div>
                          }
                        />
                      </List.Item>
                    );
                  }}
                />
              )}
            </Spin>
          </div>
        </div>

        <Divider type="vertical" style={{ height: '100%' }} />

        {/* 右侧：编辑表单 */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 16 }}>
            <h4>{editingConfig ? `编辑配置: ${editingConfig.name}` : '新建配置'}</h4>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            disabled={submitting}
          >
            <Form.Item
              label="配置名称"
              name="name"
              rules={[{ required: true, message: '请输入配置名称' }]}
            >
              <Input placeholder="例如: 生产Harbor" />
            </Form.Item>

            <Form.Item
              label="仓库地址"
              name="registry_url"
              rules={[{ required: true, message: '请输入仓库地址' }]}
            >
              <Input placeholder="registry.example.com" />
            </Form.Item>

            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="admin" />
            </Form.Item>

            <Form.Item
              label={editingConfig ? "密码 (留空则不修改)" : "密码"}
              name="password"
              rules={editingConfig ? [] : [{ required: true, message: '请输入密码' }]}
            >
              <Input.Password 
                placeholder={editingConfig ? "不修改密码请留空" : "请输入密码"}
                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              />
            </Form.Item>

            <Form.Item
              name="is_default"
              valuePropName="checked"
            >
              <Space>
                <Switch />
                <span>设为默认配置</span>
              </Space>
            </Form.Item>

            <Form.Item>
              <Space>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={submitting}
                >
                  {editingConfig ? '更新配置' : '创建配置'}
                </Button>
                <Button onClick={handleCancel}>
                  取消
                </Button>
                <ConnectionTestButton
                  registryURL={form.getFieldValue('registry_url')}
                  username={form.getFieldValue('username')}
                  password={form.getFieldValue('password')}
                  size="default"
                />
              </Space>
            </Form.Item>
          </Form>
        </div>
      </div>
    </Modal>
  );
};

export default RegistryConfigModal; 