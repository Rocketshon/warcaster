#!/bin/bash
echo "=== NPM Audit ==="
npm audit --production 2>&1
echo ""
echo "=== Checking for hardcoded secrets ==="
grep -rn "sk-ant-api\|service_role\|password.*=.*['\"]" src/ --include="*.ts" --include="*.tsx" | grep -v "test\|\.d\.ts\|node_modules" || echo "No hardcoded secrets found"
echo ""
echo "=== Checking for eval/innerHTML ==="
grep -rn "eval(\|innerHTML\|dangerouslySetInnerHTML" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" || echo "No eval/innerHTML found"
