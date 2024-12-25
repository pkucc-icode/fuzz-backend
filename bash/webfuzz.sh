echo "start do web fuzz"
cd work
cp -r webfuzz/* $1
cd $1

# 检查是否提供了参数
if [ -z "$1" ]; then
    echo "Error: No configuration file name provided."
    exit 1
fi

# 构造JSON文件名
json_file="config.json"

# 执行Python脚本并捕获错误
if ! python3 RestlerFuzzStart.py --jsonfile "$json_file"; then
    # 如果命令执行失败，则打印错误信息
    echo "Error: Failed to execute python3 RestlerFuzzStart.py $json_file"
    exit 1
fi


url="http://192.168.200.146:5330/api/fuzz/callback-webfuzz"

do_send() {
    id_value=$1
    status_value=$2
    result=$3

    payload=$(jq -n --arg id "$id_value" --arg status "$status_value" --argjson result "$result" \
        '{id: $id, status: $status, result: $result}')

    response=$(curl -s -o /dev/null -w "%{http_code}" -H "Content-Type: application/json" \
        -d "$payload" "$url")

    if [[ $response -eq 200 ]]; then
        echo "Update project status successfully."
    else
        echo "URL: $url, Payload: $payload"
        echo "Update project status failed. Response code: $response"
    fi
}

project_name = $2
cd TestDir/$project_name_$1

result_file = "FuzzAnalyzerResult.json"

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