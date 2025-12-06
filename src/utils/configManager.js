/**
 * API 配置管理工具
 * 负责读取、修改、保存 api_config (1).json
 * 支持 DBAPI 真实格式：多SQL、多Task
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import datasourceManager from './datasourceManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.join(__dirname, '../../api_config (1).json');
const GROUPS_PATH = path.join(__dirname, '../../groups.json');

class ConfigManager {
  /**
   * 读取所有 API 配置
   * 返回解析后的 API 列表（task 字段已解析）
   */
  async getAllApis() {
    try {
      const content = await fs.readFile(CONFIG_PATH, 'utf-8');
      const config = JSON.parse(content);

      // 解析每个 API 的 task 字段
      const apis = (config.api || []).map(api => {
        try {
          const parsedTask = api.task ? JSON.parse(api.task) : [];
          const parsedParams = api.params ? JSON.parse(api.params) : [];

          return {
            ...api,
            taskParsed: parsedTask,
            paramsParsed: parsedParams,
            // 兼容性：提取第一个 task 的信息作为主要信息
            datasourceId: parsedTask[0]?.datasourceId || null,
            transaction: parsedTask[0]?.transaction || 0,
            sqlList: parsedTask[0]?.sqlList || []
          };
        } catch (e) {
          console.error(`解析 API ${api.id} 失败:`, e);
          return api;
        }
      });

      return apis;
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
    const api = apis.find(api => api.id === id);

    if (api) {
      // 解析 testParams（如果存在）
      try {
        api.testParamsParsed = api.testParams ? JSON.parse(api.testParams) : {};
      } catch (e) {
        console.error(`解析 API ${api.id} 的 testParams 失败:`, e);
        api.testParamsParsed = {};
      }
    }

    return api;
  }

  /**
   * 创建新的 API
   * @param {Object} apiData - API 数据
   * @param {string} apiData.name - API 名称
   * @param {string} apiData.path - API 路径
   * @param {string} apiData.groupId - 分组 ID
   * @param {string} apiData.datasourceId - 数据源 ID
   * @param {Array} apiData.sqlList - SQL 列表 [{sqlText, id?}]
   * @param {number} apiData.transaction - 是否启用事务 (0/1)
   * @param {string} apiData.contentType - Content-Type
   * @param {string} apiData.note - 说明
   * @param {Array} apiData.params - 参数列表
   * @param {Object} apiData.testParams - 测试参数（JSON对象）
   */
  async createApi(apiData) {
    const config = await this._readConfig();

    // 检查路径是否已被占用
    const existingApi = config.api.find(api => api.path === apiData.path);
    if (existingApi) {
      throw new Error(`路径 "${apiData.path}" 已被 API "${existingApi.name}" 占用，请使用其他路径`);
    }

    // 生成新的 ID
    const newId = this._generateId();

    // 处理 SQL 列表
    const sqlList = (apiData.sqlList || []).map(sql => ({
      transformPlugin: null,
      transformPluginParam: null,
      sqlText: sql.sqlText || sql,
      id: sql.id || this._generateId()
    }));

    // 如果没有提供 sqlList，但提供了 sqlText，使用单个 SQL
    if (sqlList.length === 0 && apiData.sqlText) {
      sqlList.push({
        transformPlugin: null,
        transformPluginParam: null,
        sqlText: apiData.sqlText,
        id: this._generateId()
      });
    }

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
      jsonParam: null,
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
        sqlList: sqlList,
        transaction: apiData.transaction ? 1 : 0
      }]),
      taskJson: null,
      testParams: apiData.testParams ? JSON.stringify(apiData.testParams) : null,
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
   * @param {string} id - API ID
   * @param {Object} apiData - 更新的数据
   */
  async updateApi(id, apiData) {
    const config = await this._readConfig();
    const index = config.api.findIndex(api => api.id === id);

    if (index === -1) {
      throw new Error('API不存在');
    }

    // 如果要修改路径，检查新路径是否已被其他API占用
    if (apiData.path !== undefined) {
      const duplicateApi = config.api.find(api => api.path === apiData.path && api.id !== id);
      if (duplicateApi) {
        throw new Error(`路径 "${apiData.path}" 已被 API "${duplicateApi.name}" 占用，请使用其他路径`);
      }
    }

    const existingApi = config.api[index];
    const existingTask = existingApi.task ? JSON.parse(existingApi.task) : [{}];

    // 更新基本字段
    config.api[index] = {
      ...existingApi,
      name: apiData.name !== undefined ? apiData.name : existingApi.name,
      note: apiData.note !== undefined ? apiData.note : existingApi.note,
      path: apiData.path !== undefined ? apiData.path : existingApi.path,
      contentType: apiData.contentType !== undefined ? apiData.contentType : existingApi.contentType,
      groupId: apiData.groupId !== undefined ? apiData.groupId : existingApi.groupId,
      params: apiData.params !== undefined ? JSON.stringify(apiData.params) : existingApi.params,
      testParams: apiData.testParams !== undefined ? JSON.stringify(apiData.testParams) : existingApi.testParams,
      updateTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    // 更新 Task 和 SQL
    if (apiData.datasourceId !== undefined ||
        apiData.transaction !== undefined ||
        apiData.sqlList ||
        apiData.sqlText) {

      const task = existingTask[0] || { taskType: 1, sqlList: [] };

      // 更新数据源和事务
      task.datasourceId = apiData.datasourceId !== undefined ? apiData.datasourceId : task.datasourceId;
      task.transaction = apiData.transaction !== undefined ? (apiData.transaction ? 1 : 0) : task.transaction;

      // 更新 SQL 列表
      if (apiData.sqlList) {
        task.sqlList = apiData.sqlList.map(sql => ({
          transformPlugin: null,
          transformPluginParam: null,
          sqlText: sql.sqlText || sql,
          id: sql.id || this._generateId()
        }));
      } else if (apiData.sqlText) {
        // 兼容单个 SQL 的情况：更新第一个 SQL
        if (task.sqlList && task.sqlList[0]) {
          task.sqlList[0].sqlText = apiData.sqlText;
        } else {
          task.sqlList = [{
            transformPlugin: null,
            transformPluginParam: null,
            sqlText: apiData.sqlText,
            id: this._generateId()
          }];
        }
      }

      config.api[index].task = JSON.stringify([task]);
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
   * 添加 SQL 到现有 API
   * @param {string} apiId - API ID
   * @param {string} sqlText - SQL 语句
   * @returns {Object} 新增的 SQL 对象
   */
  async addSqlToApi(apiId, sqlText) {
    const config = await this._readConfig();
    const index = config.api.findIndex(api => api.id === apiId);

    if (index === -1) {
      throw new Error('API不存在');
    }

    const api = config.api[index];
    const task = api.task ? JSON.parse(api.task) : [{ taskType: 1, sqlList: [] }];

    const newSql = {
      transformPlugin: null,
      transformPluginParam: null,
      sqlText: sqlText,
      id: this._generateId()
    };

    if (!task[0].sqlList) {
      task[0].sqlList = [];
    }

    task[0].sqlList.push(newSql);
    config.api[index].task = JSON.stringify(task);
    config.api[index].updateTime = new Date().toISOString().replace('T', ' ').substring(0, 19);

    await this._saveConfig(config);

    return newSql;
  }

  /**
   * 更新特定 SQL
   * @param {string} apiId - API ID
   * @param {string} sqlId - SQL ID
   * @param {string} sqlText - 新的 SQL 语句
   */
  async updateSql(apiId, sqlId, sqlText) {
    const config = await this._readConfig();
    const index = config.api.findIndex(api => api.id === apiId);

    if (index === -1) {
      throw new Error('API不存在');
    }

    const api = config.api[index];
    const task = JSON.parse(api.task);
    const sqlIndex = task[0].sqlList.findIndex(sql => sql.id === sqlId);

    if (sqlIndex === -1) {
      throw new Error('SQL不存在');
    }

    task[0].sqlList[sqlIndex].sqlText = sqlText;
    config.api[index].task = JSON.stringify(task);
    config.api[index].updateTime = new Date().toISOString().replace('T', ' ').substring(0, 19);

    await this._saveConfig(config);

    return task[0].sqlList[sqlIndex];
  }

  /**
   * 删除特定 SQL
   * @param {string} apiId - API ID
   * @param {string} sqlId - SQL ID
   */
  async deleteSql(apiId, sqlId) {
    const config = await this._readConfig();
    const index = config.api.findIndex(api => api.id === apiId);

    if (index === -1) {
      throw new Error('API不存在');
    }

    const api = config.api[index];
    const task = JSON.parse(api.task);
    const sqlIndex = task[0].sqlList.findIndex(sql => sql.id === sqlId);

    if (sqlIndex === -1) {
      throw new Error('SQL不存在');
    }

    const deletedSql = task[0].sqlList.splice(sqlIndex, 1)[0];
    config.api[index].task = JSON.stringify(task);
    config.api[index].updateTime = new Date().toISOString().replace('T', ' ').substring(0, 19);

    await this._saveConfig(config);

    return deletedSql;
  }

  /**
   * 获取分组列表（从 groups.json 读取）
   */
  async getGroups() {
    try {
      const content = await fs.readFile(GROUPS_PATH, 'utf-8');
      const groups = JSON.parse(content);
      return groups.sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error) {
      console.error('读取分组配置失败:', error);
      // 返回默认分组
      return [
        { id: 'yTMWJ8W3', name: 'gocrm', description: 'gocrm 相关API接口', order: 1 },
        { id: 'H1BFe93S', name: '采购IW', description: '采购IW 相关API接口', order: 2 },
        { id: 'j2pRZs0O', name: '跟单IW', description: '跟单IW 相关API接口', order: 3 }
      ];
    }
  }

  /**
   * 保存分组列表
   */
  async saveGroups(groups) {
    try {
      await fs.writeFile(GROUPS_PATH, JSON.stringify(groups, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error('保存分组配置失败:', error);
      throw new Error('保存分组配置失败');
    }
  }

  /**
   * 添加新分组
   */
  async addGroup(group) {
    const groups = await this.getGroups();

    // 生成唯一ID
    const newId = this._generateId();
    const newGroup = {
      id: newId,
      name: group.name,
      description: group.description || '',
      order: group.order || groups.length + 1
    };

    groups.push(newGroup);
    await this.saveGroups(groups);

    return newGroup;
  }

  /**
   * 更新分组
   */
  async updateGroup(groupId, updates) {
    const groups = await this.getGroups();
    const index = groups.findIndex(g => g.id === groupId);

    if (index === -1) {
      throw new Error('分组不存在');
    }

    groups[index] = {
      ...groups[index],
      ...updates,
      id: groupId // 确保ID不被修改
    };

    await this.saveGroups(groups);
    return groups[index];
  }

  /**
   * 删除分组
   */
  async deleteGroup(groupId) {
    const groups = await this.getGroups();
    const filteredGroups = groups.filter(g => g.id !== groupId);

    if (filteredGroups.length === groups.length) {
      throw new Error('分组不存在');
    }

    await this.saveGroups(filteredGroups);
    return true;
  }

  /**
   * 获取数据源列表
   */
  async getDatasources() {
    try {
      const datasources = await datasourceManager.getDatasourcesList();
      return datasources.map(ds => ({
        id: ds.id,
        name: ds.name
      }));
    } catch (error) {
      console.error('获取数据源列表失败:', error);
      return [];
    }
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
   * 生成随机 ID (8位字母数字)
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
