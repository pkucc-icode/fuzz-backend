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
result_file="scan-result.json"

cp $json_file joern/
cd joern/

if ! python3 joern.py "$json_file"; then
    # 如果命令执行失败，则打印错误信息
    echo "Error: Failed to execute python3 joern.py $json_file"
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

