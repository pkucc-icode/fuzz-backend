#!/bin/bash
cd afl_fuzz

# 检查是否提供了参数
if [ -z "$1" ]; then
    echo "Error: No configuration file name provided."
    exit 1
fi

json_file="config-$1.json"
result_file="code_result-$1.json"
if ! python3 agent_weggli.py "$json_file"; then
    # 如果命令执行失败，则打印错误信息
    echo "Error: Failed to execute python3 agent_weggli.py $json_file"
    exit 1
fi

callback_url="http://192.168.200.146:5330/api/scan/callback"

callback() {
    id_value=$1
    type=$2
    report=$3
    codeText=$4

    payload=$(jq -n --arg id "$id_value" --arg type "$type" --arg codeText "$codeText" --arg report "$report" \
        '{id: $id, type: $type, codeText: $codeText, report:$report}')

    response=$(curl -s -o /dev/null -w "%{http_code}" -H "Content-Type: application/json" \
        -d "$payload" "$callback_url")

    if [[ $response -eq 200 ]]; then
        return 1
    else
        return 0
    fi
}

jq -c '.[] | .[]' "$result_file" | while read -r error; do
    # 解析type、code_line和code字段
    type=$(echo "$error" | jq -r '.type')
    code_line=$(echo "$error" | jq -r '.code_line')
    code=$(echo "$error" | jq -r '.code')

    callback "$1" "$type" "$code_line" "$code"
done

