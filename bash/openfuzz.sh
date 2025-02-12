#!/bin/bash
cd work

# 检查目标目录是否存在，如果不存在则创建
if [ ! -d "$1" ]; then
  mkdir -p "$1" || { echo "Failed to create directory $1"; exit 1; }
fi

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
# if ! python3 start.py "$json_file"; then
#     # 如果命令执行失败，则打印错误信息
#     echo "Error: Failed to execute python3 start.py $json_file"
# fi


result_file="report.json"

# 检查文件是否存在
if [[ -f "$result_file" ]]; then
    # 读取文件内容到 result 变量中
    echo "成功：文件 $result_file 存在"
    result=$(<"$result_file")
else
    echo "错误：文件 $result_file 不存在"
    result=""
fi

cd ../../bash/
npx ts-node callback.ts "$1" "$result"
echo "成功：任务执行完毕."