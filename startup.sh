#!/bin/sh
set -e
cd /home/rayan/como-cafe
if ! curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://127.0.0.1:8080/ 2>/dev/null | grep -q "200"; then
  nohup sh -c 'exec node scripts/with-app-env.mjs vite dev --host 0.0.0.0 --port 8080' >/tmp/como-cafe-dev.log 2>&1 &
  sleep 1
fi
echo "done"
