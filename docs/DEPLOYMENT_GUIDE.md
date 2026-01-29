# 生产部署指南（Supabase + Vercel）

> 目标：提供统一的生产部署步骤与配置清单，覆盖数据库迁移、Edge Functions、Webhook 与环境变量。

## 1. 环境变量清单

### 前端（Vercel / Vite）
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

### Supabase Edge Functions
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NOWPAYMENTS_API_KEY`
- `NOWPAYMENTS_IPN_SECRET`
- `NOTIFY_FUNCTION_URL`
- `NOTIFY_FUNCTION_KEY`
- `NOTIFY_ORDER_STATUS_URL`
- `NOTIFY_ORDER_STATUS_KEY`

## 2. 数据库迁移

运行全部迁移文件（顺序执行）：
- `supabase/migrations/20260127120000_ecommerce_core.sql`
- `supabase/migrations/20260127130000_inventory_core.sql`
- `supabase/migrations/20260127140000_nowpayments_webhook_events.sql`
- `supabase/migrations/20260127141000_order_status_machine.sql`
- `supabase/migrations/20260127142000_payment_reconciliation.sql`
- `supabase/migrations/20260127143000_monitoring.sql`

## 3. Edge Functions 部署清单

需要部署的 Functions：
- `create-payment`
- `payment-status`
- `nowpayments-webhook`
- `refund`
- `order-timeout`
- `order-status-notify`
- `notify`
- `payment-reconcile`
- `audit-metrics`

## 4. Webhook 配置

NOWPayments Webhook URL：
- `https://<your-supabase-project>.functions.supabase.co/nowpayments-webhook`
- Header：`x-nowpayments-sig` (HMAC SHA-512)

## 5. 定时任务

建议配置（Supabase Scheduler / 外部 Cron）：
- `order-timeout`：每 5-10 分钟
- `payment-reconcile`：每小时
- `audit-metrics`：每日

## 6. 上线前检查

- [ ] 生产环境变量已配置
- [ ] 迁移全部执行成功
- [ ] Webhook 验签通过
- [ ] 测试支付/退款/订单超时流程
- [ ] RLS 策略验证（用户/游客查询订单）
- [ ] 监控与告警已配置

## 7. 相关说明

- 备份与恢复演练：[`docs/OPS_BACKUP.md`](./OPS_BACKUP.md:1)
- 合规与政策：[`docs/LEGAL_COMPLIANCE.md`](./LEGAL_COMPLIANCE.md:1)
