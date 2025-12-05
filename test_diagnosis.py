#!/usr/bin/env python3
"""
API 诊断脚本 - 测试不同的 Content-Type 和数据格式
用于定位 415 错误的根本原因
"""
import os
import requests
import json

# 禁用代理
os.environ['NO_PROXY'] = '*'
os.environ['no_proxy'] = '*'
os.environ['HTTP_PROXY'] = ''
os.environ['HTTPS_PROXY'] = ''
os.environ['http_proxy'] = ''
os.environ['https_proxy'] = ''

BASE_URL = "http://47.104.72.198:3000/task_conductor"

def test_case_1_form_urlencoded():
    """测试 1: application/x-www-form-urlencoded 格式"""
    print("\n" + "="*60)
    print("测试 1: application/x-www-form-urlencoded (表单格式)")
    print("="*60)

    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    data = "conductor=1"

    try:
        session = requests.Session()
        session.proxies = {'http': None, 'https': None}
        session.trust_env = False

        response = session.post(BASE_URL, data=data, headers=headers, timeout=10)

        print(f"状态码: {response.status_code}")
        print(f"响应头: {dict(response.headers)}")
        print(f"响应内容: {response.text}")

        return response.status_code == 200

    except Exception as e:
        print(f"❌ 错误: {e}")
        return False
    finally:
        session.close()

def test_case_2_json():
    """测试 2: application/json 格式"""
    print("\n" + "="*60)
    print("测试 2: application/json (JSON格式)")
    print("="*60)

    headers = {
        'Content-Type': 'application/json'
    }
    data = json.dumps({"conductor": "1"})

    try:
        session = requests.Session()
        session.proxies = {'http': None, 'https': None}
        session.trust_env = False

        response = session.post(BASE_URL, data=data, headers=headers, timeout=10)

        print(f"状态码: {response.status_code}")
        print(f"响应头: {dict(response.headers)}")
        print(f"响应内容: {response.text}")

        return response.status_code == 200

    except Exception as e:
        print(f"❌ 错误: {e}")
        return False
    finally:
        session.close()

def test_case_3_json_method():
    """测试 3: 使用 requests 的 json 参数"""
    print("\n" + "="*60)
    print("测试 3: 使用 requests.json 参数 (自动设置 Content-Type)")
    print("="*60)

    payload = {"conductor": "1"}

    try:
        session = requests.Session()
        session.proxies = {'http': None, 'https': None}
        session.trust_env = False

        response = session.post(BASE_URL, json=payload, timeout=10)

        print(f"状态码: {response.status_code}")
        print(f"请求头: Content-Type={response.request.headers.get('Content-Type')}")
        print(f"响应头: {dict(response.headers)}")
        print(f"响应内容: {response.text}")

        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ 成功! 返回数据:")
            print(json.dumps(result, indent=2, ensure_ascii=False))

        return response.status_code == 200

    except Exception as e:
        print(f"❌ 错误: {e}")
        return False
    finally:
        session.close()

def test_case_4_get_with_params():
    """测试 4: GET 请求带查询参数"""
    print("\n" + "="*60)
    print("测试 4: GET 请求 (URL查询参数)")
    print("="*60)

    params = {"conductor": "1"}

    try:
        session = requests.Session()
        session.proxies = {'http': None, 'https': None}
        session.trust_env = False

        response = session.get(BASE_URL, params=params, timeout=10)

        print(f"请求URL: {response.url}")
        print(f"状态码: {response.status_code}")
        print(f"响应头: {dict(response.headers)}")
        print(f"响应内容: {response.text}")

        return response.status_code == 200

    except Exception as e:
        print(f"❌ 错误: {e}")
        return False
    finally:
        session.close()

def main():
    print("""
╔══════════════════════════════════════════════════════════════╗
║           API Content-Type 诊断测试脚本                      ║
║                                                              ║
║  目的: 测试服务器支持哪些 Content-Type                       ║
║  地址: http://47.104.72.198:3000/task_conductor             ║
╚══════════════════════════════════════════════════════════════╝
    """)

    results = {
        "application/x-www-form-urlencoded (表单)": test_case_1_form_urlencoded(),
        "application/json (JSON字符串)": test_case_2_json(),
        "application/json (requests.json)": test_case_3_json_method(),
        "GET 请求 (URL参数)": test_case_4_get_with_params()
    }

    print("\n" + "="*60)
    print("测试结果汇总")
    print("="*60)

    for test_name, success in results.items():
        status = "✅ 成功" if success else "❌ 失败"
        print(f"{test_name}: {status}")

    print("\n" + "="*60)
    print("诊断结论")
    print("="*60)

    if results["application/json (requests.json)"]:
        print("✅ 服务器支持 application/json 格式")
        print("💡 建议: 使用 JSON 格式发送请求")
    elif results["GET 请求 (URL参数)"]:
        print("✅ 服务器支持 GET 请求")
        print("💡 建议: 使用 GET 请求传递参数")

    if not results["application/x-www-form-urlencoded (表单)"]:
        print("❌ 服务器不支持 application/x-www-form-urlencoded")
        print("💡 原因: Fastify 未安装 @fastify/formbody 插件")

    print("\n")

if __name__ == "__main__":
    main()
