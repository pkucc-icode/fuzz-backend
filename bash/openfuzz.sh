#!/bin/bash
cd work
cp -r openfuzz/* $1
cd $1

rm -rf *output*
rm -rf crash_*
echo core | sudo tee /proc/sys/kernel/core_pattern

# 检查是否提供了参数
if [ -z "$1" ]; then
    echo "Error: No configuration file name provided."
    exit 1
fi

# 构造JSON文件名
json_file="config.json"

# 执行Python脚本并捕获错误
if ! python3 start.py "$json_file"; then
    # 如果命令执行失败，则打印错误信息
    echo "Error: Failed to execute python3 start.py $json_file"
    exit 1
fi

# if callback failure please check this url, i don't know why it not works
url="http://127.0.0.1:5330/api/fuzz/callback-openfuzz"




# 发送 HTTP 请求函数
do_send() {
    id_value=$1
    status_value=$2
    result=$3

    payload=$(jq -n --arg id "$id_value" --arg status "$status_value" --argjson result "$result" \
        '{id: $id, status: $status, result: $result}')

    # 打印 payload 内容以便调试
    echo "Generated Payload:"
    echo "$payload"
    echo "-------------------"

    # 构造 curl 命令
    curl_command="curl -s -o /dev/null -w \"%{http_code}\" -H \"Content-Type: application/json\" -d '$payload' \"$url\""

    # 打印 curl 命令
    echo "Executing curl command:"
    echo "$curl_command"
    echo "-------------------"

    # 执行 curl 命令并获取响应
    response=$(eval "$curl_command")

    if [[ $response -eq 200 ]]; then
        echo "Update project status successfully."
    else
        echo "URL: $url, Payload: $payload"
        echo "Update project status failed. Response code: $response"
    fi
}

# 访问 JSON 文件中 afl_fuzz_args 对象内的 fuzz_target 数组，并提取数组中的所有元素
# 将 jq 命令的输出赋值给变量 fuzz_target
# if [[ -f "$json_file" ]]; then
#     fuzz_target=$(jq -r '.afl_fuzz_args.fuzz_target[]' "$json_file")
# else
#     echo "错误：文件 '$json_file' 不存在。"
#     exit 1
# fi

# result="[]"

# for target in $fuzz_target; do
#     report="${target}_report.json"
    
#     if [[ -f "$report" ]]; then
#         rep_json=$(cat "$report")
#         result=$(echo "$result" | jq ". + [$rep_json]")
#     else
#         echo "错误：文件 '$report' 不存在。"
#         do_send "$1" "FAIL" "$result"
#         exit 1
#     fi
# done

result_file="report.json"

# 检查文件是否存在
if [[ -f "$result_file" ]]; then
    # 读取文件内容到 result 变量中
    result=$(<"$result_file")
else
    echo "错误：文件 $result_file 不存在"
    exit 1
fi

do_send "$1" "SUCCESS" "$result"

echo "callback executed."