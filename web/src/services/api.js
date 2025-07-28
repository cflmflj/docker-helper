import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 300000, // 5分钟超时，因为镜像转换可能需要较长时间
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // 使用标准的Bearer格式
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token过期或无效，清除本地存储并跳转到登录页
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// =============== 异步任务管理相关API接口 ===============

// 获取任务列表（当前+队列+最近）
// GET /api/tasks
export const getTasks = () => {
  return api.get('/tasks');
};

// 获取任务统计
// GET /api/tasks/stats
export const getTaskStats = () => {
  return api.get('/tasks/stats');
};

// 创建异步任务（替代原来的同步转换）
// POST /api/tasks
export const createTask = async (taskData) => {
  return api.post('/tasks', taskData);
};

// 获取单个任务状态和进度
// GET /api/tasks/{id}
export const getTaskStatus = (taskId) => {
  return api.get(`/tasks/${taskId}`);
};

// 取消任务
// DELETE /api/tasks/{id}
export const cancelTask = (taskId) => {
  return api.delete(`/tasks/${taskId}`);
};

// =============== 兼容性接口 ===============

// 创建转换任务（兼容原有接口，现在异步执行）
// POST /api/transform/start
export const createTransformTask = async (taskData) => {
  return api.post('/transform/start', taskData);
};

// 向后兼容的接口别名
export const getTaskProgress = getTaskStatus; // 别名，保持兼容性

// 调整任务优先级 - 暂未实现
export const changePriority = (taskId, direction) => {
  console.warn('任务优先级调整功能暂未实现');
  return Promise.resolve({
    data: {
      success: true,
      message: "优先级调整功能暂未实现"
    }
  });
};

export default api; 