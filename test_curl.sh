#!/bin/bash
# API Content-Type 诊断脚本 (Curl 版本)
# 用于快速测试不同的 Content-Type

URL="http://47.104.72.198:3000/task_conductor"

echo "======================================================================"
echo "           API Content-Type 诊断测试脚本 (Curl版)"
echo "======================================================================"
echo ""

# 测试 1: application/x-www-form-urlencoded
echo "======================================================================"
echo "测试 1: application/x-www-form-urlencoded (表单格式)"
echo "======================================================================"
curl -X POST "$URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "conductor=1" \
  --noproxy "*" \
  -w "\n状态码: %{http_code}\n" \
  -v
echo ""
echo ""

# 测试 2: application/json
echo "======================================================================"
echo "测试 2: application/json (JSON格式)"
echo "======================================================================"
curl -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"conductor":"1"}' \
  --noproxy "*" \
  -w "\n状态码: %{http_code}\n" \
  -v
echo ""
echo ""

# 测试 3: GET 请求
echo "======================================================================"
echo "测试 3: GET 请求 (URL参数)"
echo "======================================================================"
curl -X GET "$URL?conductor=1" \
  --noproxy "*" \
  -w "\n状态码: %{http_code}\n" \
  -v
echo ""
echo ""

echo "======================================================================"
echo "测试完成"
echo "======================================================================"
