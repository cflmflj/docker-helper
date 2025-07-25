import React, { useState } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const TokenChangeModal = ({ visible, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { changeToken } = useAuth();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const success = await changeToken(values.newToken);
      if (success) {
        form.resetFields();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="修改Token"
      open={visible}
      onOk={() => form.submit()}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={400}
      okText="确定"
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        <Form.Item
          label="新Token"
          name="newToken"
          rules={[
            { required: true, message: '请输入新的Token!' },
            { min: 6, message: 'Token长度不能少于6位!' }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请输入新的Token"
            size="large"
          />
        </Form.Item>
        
        <Form.Item
          label="确认Token"
          name="confirmToken"
          dependencies={['newToken']}
          rules={[
            { required: true, message: '请确认新的Token!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newToken') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的Token不一致!'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请再次输入新的Token"
            size="large"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TokenChangeModal; 