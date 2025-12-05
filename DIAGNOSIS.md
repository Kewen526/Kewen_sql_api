# API 415 错误诊断指南

## 问题概述

你的 API 返回 **415 Unsupported Media Type** 错误，具体信息：
```
{"statusCode":415,"code":"FST_ERR_CTP_INVALID_MEDIA_TYPE","error":"Unsupported Media Type","message":"Unsupported Media Type: application/x-www-form-urlencoded"}
```

## 初步分析

经过代码分析，发现以下问题：

1. **服务端配置问题**: `src/server.js` 中没有注册支持 `application/x-www-form-urlencoded` 的插件
2. **Fastify 默认行为**: Fastify 默认只支持 `application/json` 和 `text/plain`
3. **缺失插件**: 需要安装 `@fastify/formbody` 插件才能支持表单格式

## 诊断步骤

### 方法1: 使用 Python 诊断脚本（推荐）

```bash
# 进入项目目录
cd /home/user/Kewen_sql_api

# 运行 Python 诊断脚本
python3 test_diagnosis.py
```

这个脚本会自动测试 4 种不同的请求方式：
1. ❌ `application/x-www-form-urlencoded` (表单格式) - 预计失败
2. ✅ `application/json` (JSON字符串) - 预计成功
3. ✅ `application/json` (requests.json) - 预计成功
4. ❓ `GET` 请求 (URL参数) - 取决于API配置

### 方法2: 使用 Curl 脚本

```bash
# 进入项目目录
cd /home/user/Kewen_sql_api

# 运行 Curl 测试脚本
./test_curl.sh
```

### 方法3: 手动测试（单个命令）

#### 测试 JSON 格式（预计成功）
```bash
curl -X POST "http://47.104.72.198:3000/task_conductor" \
  -H "Content-Type: application/json" \
  -d '{"conductor":"1"}' \
  --noproxy "*"
```

#### 测试表单格式（预计失败 - 415错误）
```bash
curl -X POST "http://47.104.72.198:3000/task_conductor" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "conductor=1" \
  --noproxy "*"
```

## 预期结果

根据代码分析，预期结果应该是：

- ❌ **application/x-www-form-urlencoded**: 返回 415 错误（当前问题）
- ✅ **application/json**: 正常返回 200（推荐使用）

## 下一步

运行诊断脚本后：

1. **如果 JSON 格式测试成功**:
   - 说明问题确实是 Content-Type 不匹配
   - 需要修改服务端配置或客户端代码

2. **如果 JSON 格式也失败**:
   - 可能有其他问题
   - 需要查看详细错误信息

## 运行诊断并反馈

请在服务器上运行：
```bash
cd /home/user/Kewen_sql_api
python3 test_diagnosis.py
```

然后把完整的输出结果发给我，我会根据实际结果给出解决方案。
