#!/bin/bash
cd work

# 检查目标目录是否存在，如果不存在则创建
if [ ! -d "$1" ]; then
  mkdir -p "$1" || { echo "Failed to create directory $1"; exit 1; }
fi

cp -r scan/* $1/


cd $1

# 检查是否提供了参数
if [ -z "$1" ]; then
    echo "Error: No configuration file name provided."
    exit 1
fi

json_file="scan-config.json"
result_file="result-config.json"

cp $json_file ./

echo "开始执行codescan.py"

if ! python3 codescan.py "$json_file"; then
    # 如果命令执行失败，则打印错误信息
    echo "Error: Failed to execute python3 joern.py $json_file"
    exit 1
fi

if [[ -f "$result_file" ]]; then
    # 读取文件内容到 result 变量中
    echo "成功：文件 $result_file 存在"
    result=$(<"$result_file")
    result_file_abs_path=$(realpath "$result_file")
else
    echo "错误：文件 $result_file 不存在"
    result=""
    result_file_abs_path=""
fi

cd ../../bash/
npx ts-node callback.ts "$1" "$result_file_abs_path"
echo "成功：任务执行完毕."