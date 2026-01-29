# 生产环境风险评估与整改清单

> 目标：汇总当前系统上线风险点，按优先级给出可执行整改清单，并标注涉及文件/表/函数。

## 风险分级
- **P0（阻断上线）**：安全或资金/库存一致性风险，必须先修复。
- **P1（高优先级）**：上线后可能造成事故/合规问题，需尽快修复。
- **P2（优化）**：稳定性/体验问题，建议排期处理。

---

## P0 阻断项（必须修复）

### 1) 前端仍存在 mock 数据与本地回退逻辑
- **问题**：生产环境不应在 API 失败或数据为空时回退到本地假数据。
- **证据**：
  - [`src/components/merchant/ProductManagement.tsx`](../src/components/merchant/ProductManagement.tsx:29) 使用 `mockProducts` 直接渲染管理端商品。
  - [`src/pages/Products.tsx`](../src/pages/Products.tsx:17) 在 `products` 为空或报错时回退 `localProducts`。
  - [`src/data/products.ts`](../src/data/products.ts:1) 保留完整示例商品/分类/尺码数据。
- **影响**：数据源混乱、对账与库存不可控、误导真实库存。
- **整改**：
  1. 移除 `localProducts/localCategories` 回退逻辑，仅展示空态。
  2. 管理端 `ProductManagement` 改为读取 Supabase `products` 表。
  3. 删除 `src/data/products.ts` 或迁移到测试用例目录。

### 2) 支付与订单状态一致性边界未完整覆盖
- **问题**：Webhook 仅处理“成功/待处理”映射，未覆盖失败/退款/过期的订单状态流转与库存回滚。
- **证据**：[`supabase/functions/nowpayments-webhook/index.ts`](../supabase/functions/nowpayments-webhook/index.ts:17)
- **影响**：失败或退款场景订单状态不一致、库存长期占用。
- **整改**：
  1. 明确状态机规则：`failed/expired/refunded` → 订单 `cancelled`，并释放库存。
  2. 对“部分支付/少付/超付”设置订单处理策略（拒单或人工确认）。
  3. 引入幂等 + 最终一致的库存回滚逻辑。

### 3) RLS 与 Edge Functions 权限边界需复核
- **问题**：RLS 只允许管理员/商家访问 `payments/refunds/coupons`；前端用户无法查询自己的订单支付记录。
- **证据**：[`supabase/migrations/20260127120000_ecommerce_core.sql`](../supabase/migrations/20260127120000_ecommerce_core.sql:88)
- **影响**：用户无法查询订单支付状态，前端依赖 Edge Functions 绕过。
- **整改**：
  1. 为用户订单/支付视图增加只读策略（按 `auth.uid()` 或 `guest_email`）。
  2. 统一前端读取路径，避免直接暴露高权限表。

---

## P1 高优先级

### 4) 订单管理页存在调试日志
- **证据**：[`src/components/merchant/OrderManagement.tsx`](../src/components/merchant/OrderManagement.tsx:80)
- **影响**：日志泄露敏感数据（订单、邮箱）。
- **整改**：移除 `console.log`，统一日志策略。

### 5) 支付功能文档与现状严重不一致
- **问题**：文档仍描述未实现功能、旧文件结构与旧迁移。
- **证据**：已删除旧文档（`IMPLEMENTATION_SUMMARY.md / PROGRESS.md / QUICK_START.md / CRYPTO_PAYMENT_SETUP.md`）。
- **影响**：部署人员误操作、错误配置。
- **整改**：使用最新文档统一上线流程与配置。

### 6) 支付边界场景缺少监控告警
- **问题**：仅写入 `system_events`，无告警策略与阈值。
- **证据**：[`supabase/migrations/20260127143000_monitoring.sql`](../supabase/migrations/20260127143000_monitoring.sql:1)
- **整改**：
  1. 对 Webhook 验签失败、支付失败、对账差异设置告警。
  2. 建立监控看板（失败率、Webhook 处理耗时、订单超时）。

---

## P2 优化项

### 7) 业务文档缺少统一入口与部署清单
- **整改**：新增一份生产部署指南，集中环境变量、迁移、函数部署、Webhook 配置。

### 8) 测试与演练不足
- **整改**：补充支付失败/退款/库存并发测试，定期演练恢复流程。

---

## 可执行整改清单（按优先级排序）

### P0
1. 移除前端 mock 数据与本地回退逻辑（`Products` / `ProductManagement` / `data/products`）。
2. 补齐 Webhook 对失败/退款/过期的订单状态更新与库存释放。
3. 调整 RLS：允许用户/游客只读查询自己的订单/支付状态。

### P1
4. 移除生产日志与调试输出。
5. 统一文档：替换为最新“生产部署指南 + 支付/库存/合规说明”。
6. 建立告警与监控策略（webhook 失败率、支付对账异常）。

### P2
7. 补足测试覆盖：支付异常、库存并发、对账异常场景。
8. 定期备份与恢复演练（结合 [`docs/OPS_BACKUP.md`](./OPS_BACKUP.md:1)）。

---

## 参考文档
- 备份与恢复演练：[`docs/OPS_BACKUP.md`](./OPS_BACKUP.md:1)
- 合规与政策：[`docs/LEGAL_COMPLIANCE.md`](./LEGAL_COMPLIANCE.md:1)
