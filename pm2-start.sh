# callback 回调失败，报错502，绑定所有IP地址解决
# pnpm run dev --host 0.0.0.0

pm2 start pnpm --name fuzz-api -- run start --host 0.0.0.0