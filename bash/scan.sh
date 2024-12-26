#!/bin/bash
cd work

cp -r scan/joern/ $1/
cp -r scan/weggli/ $1/

cd $1

# 检查是否提供了参数
if [ -z "$1" ]; then
    echo "Error: No configuration file name provided."
    exit 1
fi

json_file="scan-config.json"
result_file="result-config.json"

cp $json_file joern/
cd joern/

echo "开始执行joern.py"

if ! python3 joern.py "$json_file"; then
    # 如果命令执行失败，则打印错误信息
    echo "Error: Failed to execute python3 joern.py $json_file"
    exit 1
fi

callback_url="http://192.168.200.146:5330/api/scan/callback"

# 检查 JSON 文件是否存在
if [[ ! -f "$result_file" ]]; then
    echo "错误：文件 '$result_file' 不存在。"
    exit 1
fi

# 将 JSON 数组包裹到 { "scans": [] }
wrapped_json=$(jq -c --arg id "$1" '. | {scans: ., id: $id, status: "SUCCESS"}' "$result_file")


# 发送 POST 请求
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "$wrapped_json" "$callback_url")

# 检查响应状态码
if [[ "$response" -eq 200 ]]; then
    echo "成功发送数据：$wrapped_json"
else
    echo "发送失败，状态码：$response"
fi