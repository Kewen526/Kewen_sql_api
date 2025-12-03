/**
 * API 配置管理工具
 * 负责读取、修改、保存 api_config (1).json
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.join(__dirname, '../../api_config (1).json');

class ConfigManager {
  /**
   * 读取所有 API 配置
   */
  async getAllApis() {
    try {
      const content = await fs.readFile(CONFIG_PATH, 'utf-8');
      const config = JSON.parse(content);
      return config.api || [];
    } catch (error) {
      console.error('读取配置失败:', error);
      throw new Error('读取API配置失败');
    }
  }

  /**
   * 根据 ID 获取单个 API
   */
  async getApiById(id) {
    const apis = await this.getAllApis();
    return apis.find(api => api.id === id);
  }

  /**
   * 创建新的 API
   */
  async createApi(apiData) {
    const config = await this._readConfig();

    // 生成新的 ID
    const newId = this._generateId();

    const newApi = {
      id: newId,
      access: 1,
      alarmPlugins: null,
      cachePlugin: null,
      contentType: apiData.contentType || 'application/json',
      createTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      createUserId: 1,
      dagData: null,
      globalTransformPlugin: null,
      graphData: null,
      groupId: apiData.groupId,
      jsonParam: apiData.jsonParam || null,
      name: apiData.name,
      note: apiData.note || apiData.name,
      paramProcessPlugin: null,
      paramRules: null,
      params: JSON.stringify(apiData.params || []),
      paramsJson: null,
      path: apiData.path,
      status: 1,
      task: JSON.stringify([{
        taskType: 1,
        datasourceId: apiData.datasourceId,
        sqlList: [{
          transformPlugin: null,
          transformPluginParam: null,
          sqlText: apiData.sqlText,
          id: this._generateId()
        }],
        transaction: apiData.transaction || 0
      }]),
      taskJson: null,
      transformScript: null,
      type: null,
      updateTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    config.api.push(newApi);
    await this._saveConfig(config);

    return newApi;
  }

  /**
   * 更新 API
   */
  async updateApi(id, apiData) {
    const config = await this._readConfig();
    const index = config.api.findIndex(api => api.id === id);

    if (index === -1) {
      throw new Error('API不存在');
    }

    const existingApi = config.api[index];

    // 更新字段
    config.api[index] = {
      ...existingApi,
      name: apiData.name !== undefined ? apiData.name : existingApi.name,
      note: apiData.note !== undefined ? apiData.note : existingApi.note,
      path: apiData.path !== undefined ? apiData.path : existingApi.path,
      contentType: apiData.contentType !== undefined ? apiData.contentType : existingApi.contentType,
      groupId: apiData.groupId !== undefined ? apiData.groupId : existingApi.groupId,
      params: apiData.params !== undefined ? JSON.stringify(apiData.params) : existingApi.params,
      updateTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    // 更新 SQL
    if (apiData.sqlText || apiData.datasourceId !== undefined || apiData.transaction !== undefined) {
      const task = JSON.parse(existingApi.task);
      if (task && task[0]) {
        task[0].datasourceId = apiData.datasourceId !== undefined ? apiData.datasourceId : task[0].datasourceId;
        task[0].transaction = apiData.transaction !== undefined ? apiData.transaction : task[0].transaction;

        if (apiData.sqlText) {
          task[0].sqlList[0].sqlText = apiData.sqlText;
        }

        config.api[index].task = JSON.stringify(task);
      }
    }

    await this._saveConfig(config);

    return config.api[index];
  }

  /**
   * 删除 API
   */
  async deleteApi(id) {
    const config = await this._readConfig();
    const index = config.api.findIndex(api => api.id === id);

    if (index === -1) {
      throw new Error('API不存在');
    }

    const deletedApi = config.api.splice(index, 1)[0];
    await this._saveConfig(config);

    return deletedApi;
  }

  /**
   * 获取分组列表
   */
  getGroups() {
    return [
      { id: 'yTMWJ8W3', name: 'gocrm' },
      { id: 'H1BFe93S', name: '采购IW' },
      { id: 'j2pRZs0O', name: '跟单IW' }
    ];
  }

  /**
   * 获取数据源列表
   */
  getDatasources() {
    return [
      { id: 'YYKtG9Dv', name: 'gocrm数据库' },
      { id: 'ukG1SAgu', name: '采购IW数据库' },
      { id: 'q45gsAZj', name: '跟单IW数据库' }
    ];
  }

  /**
   * 读取完整配置
   */
  async _readConfig() {
    try {
      const content = await fs.readFile(CONFIG_PATH, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('读取配置失败:', error);
      throw new Error('读取API配置失败');
    }
  }

  /**
   * 保存配置
   */
  async _saveConfig(config) {
    try {
      const content = JSON.stringify(config, null, 2);
      await fs.writeFile(CONFIG_PATH, content, 'utf-8');
    } catch (error) {
      console.error('保存配置失败:', error);
      throw new Error('保存API配置失败');
    }
  }

  /**
   * 生成随机 ID
   */
  _generateId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }
}

export default new ConfigManager();
