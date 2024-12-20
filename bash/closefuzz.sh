echo "start do close fuzz"
url="http://192.168.220.11:5330/api/fuzz/callback-closefuzz"

# 发送 HTTP 请求函数
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

result="[]"


do_send "$1" "SUCCESS" "$result"


echo "callback executed."