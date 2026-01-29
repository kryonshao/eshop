# 设计文档：跨境电商平台功能增强

## 概述

本设计文档描述了跨境电商平台功能增强的技术实现方案。该平台基于 React + TypeScript + Supabase 架构，本次增强将添加加密货币支付系统、多语言支持、库存管理、物流配送、营销功能、客户服务和数据分析等核心模块。

设计遵循以下原则：
- **模块化**：各功能模块独立设计，低耦合高内聚
- **可扩展性**：支持未来添加新的加密货币、物流商、语言等
- **安全性**：敏感数据加密，符合 GDPR 等合规要求
- **性能**：优化数据库查询，使用缓存减少 API 调用
- **用户体验**：响应式设计，实时反馈，多语言支持
- **加密货币优先**：所有商品以 USD 定价，支付时实时转换为加密货币金额

## 架构

### 整体架构

系统采用三层架构：

```
┌─────────────────────────────────────────────────────────┐
│                    前端层 (React + TS)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ 商品展示 │ │ 购物车   │ │ 订单管理 │ │ 用户中心 │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ 支付界面 │ │ 商家后台 │ │ 客服系统 │ │ 数据分析 │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              业务逻辑层 (Supabase Edge Functions)         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │加密支付  │ │ 库存服务 │ │ 物流服务 │ │ 通知服务 │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ 税务服务 │ │ 分析服务 │ │ 审计服务 │ │ 多语言   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                数据层 (Supabase PostgreSQL)               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ 用户数据 │ │ 商品数据 │ │ 订单数据 │ │ 支付数据 │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ 库存数据 │ │ 物流数据 │ │ 营销数据 │ │ 分析数据 │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   外部服务集成                            │
│  ┌──────────┐ ┌──────────┐                              │
│  │NOWPayments│ │ 物流API  │                              │
│  └──────────┘ └──────────┘                              │
└─────────────────────────────────────────────────────────┘
```

### 技术栈

**前端**：
- React 18 + TypeScript
- Vite（构建工具）
- TanStack Query（数据获取和缓存）
- Zustand（状态管理）
- i18next（国际化）
- Tailwind CSS（样式）
- Recharts（图表）

**后端**：
- Supabase（BaaS 平台）
- PostgreSQL（数据库）
- Edge Functions（Deno 运行时）
- Supabase Realtime（实时通信）
- Supabase Storage（文件存储）

**第三方服务**：
- NOWPayments API（加密货币支付，支持 BTC、ETH、USDT、USDC 等）
- 物流商 API（物流跟踪）

## 组件和接口

### 1. 支付系统

#### 1.1 支付服务 (PaymentService)

负责处理加密货币支付流程和退款。

**接口**：

```typescript
interface PaymentService {
  // 创建加密货币支付
  createCryptoPayment(params: CreateCryptoPaymentParams): Promise<CryptoPaymentIntent>
  
  // 确认支付
  confirmPayment(paymentIntentId: string): Promise<PaymentResult>
  
  // 处理退款
  processRefund(params: RefundParams): Promise<RefundResult>
  
  // 获取支付状态
  getPaymentStatus(paymentIntentId: string): Promise<PaymentStatus>
  
  // 获取可用的加密货币列表
  getAvailableCryptoCurrencies(): Promise<CryptoCurrency[]>
  
  // 获取加密货币价格估算
  estimateCryptoPrice(params: PriceEstimateParams): Promise<CryptoPriceEstimate>
}

interface CreateCryptoPaymentParams {
  orderId: string
  amountUSD: number  // 商品价格始终以 USD 计价
  cryptoCurrency: 'BTC' | 'ETH' | 'USDT' | 'USDC' | string
  customerId: string
}

interface CryptoPaymentIntent {
  id: string
  paymentId: string  // NOWPayments payment ID
  payAddress: string  // 加密货币支付地址
  payAmount: number   // 需要支付的加密货币数量
  payCurrency: string // 加密货币类型
  priceAmount: number // USD 金额
  paymentUrl: string  // 支付页面 URL
  qrCodeUrl?: string  // 二维码 URL
  expirationDate: Date
  status: PaymentStatus
}

interface PaymentResult {
  success: boolean
  paymentId: string
  transactionId?: string
  actuallyPaid?: number  // 实际支付的加密货币数量
  error?: string
}

interface RefundParams {
  paymentId: string
  amountUSD: number
  reason: string
}

interface RefundResult {
  success: boolean
  refundId: string
  amountUSD: number
  cryptoAmount: number
  cryptoCurrency: string
  status: 'pending' | 'completed' | 'failed'
}

interface CryptoCurrency {
  code: string  // 'BTC', 'ETH', 'USDT'
  name: string
  network?: string  // 'ERC20', 'TRC20' for USDT
  minAmount: number
  maxAmount: number
}

interface PriceEstimateParams {
  amountUSD: number
  cryptoCurrency: string
}

interface CryptoPriceEstimate {
  amountUSD: number
  cryptoAmount: number
  cryptoCurrency: string
  exchangeRate: number
  estimatedAt: Date
}

type PaymentStatus = 
  | 'pending' 
  | 'processing' 
  | 'succeeded' 
  | 'failed' 
  | 'canceled'
  | 'expired'
```

#### 1.2 NOWPayments 加密货币支付适配器

使用 NOWPayments API 处理加密货币支付。所有商品以 USD 定价，支付时实时转换为加密货币金额。

```typescript
interface CryptoPaymentGateway {
  createPayment(params: CryptoPaymentParams): Promise<CryptoPaymentResponse>
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>
  getAvailableCurrencies(): Promise<CryptoCurrency[]>
  getEstimatedPrice(params: PriceEstimateParams): Promise<CryptoPriceEstimate>
  getMinPaymentAmount(currency: string): Promise<number>
}

interface CryptoPaymentParams {
  orderId: string
  priceAmount: number  // 始终以 USD 计价
  priceCurrency: 'USD'  // 固定为 USD
  payCurrency: string   // 'BTC', 'ETH', 'USDT', 'USDC'
  ipnCallbackUrl: string
  orderDescription: string
}

interface CryptoPaymentResponse {
  paymentId: string
  paymentStatus: string
  payAddress: string
  payAmount: number
  payCurrency: string
  priceAmount: number
  priceCurrency: 'USD'
  paymentUrl: string
  expirationEstimateDate: string
}

class NOWPaymentsAdapter implements CryptoPaymentGateway {
  private apiKey: string
  private baseUrl = 'https://api.nowpayments.io/v1'
  
  constructor(apiKey: string) {
    this.apiKey = apiKey
  }
  
  async createPayment(params: CryptoPaymentParams): Promise<CryptoPaymentResponse> {
    const response = await fetch(`${this.baseUrl}/payment`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...params,
        priceCurrency: 'USD'  // 强制使用 USD
      })
    })
    
    if (!response.ok) {
      throw new Error(`NOWPayments API error: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data
  }
  
  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    const response = await fetch(`${this.baseUrl}/payment/${paymentId}`, {
      headers: { 'x-api-key': this.apiKey }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to get payment status: ${response.statusText}`)
    }
    
    const data = await response.json()
    return this.mapStatus(data.payment_status)
  }
  
  async getAvailableCurrencies(): Promise<CryptoCurrency[]> {
    const response = await fetch(`${this.baseUrl}/currencies`, {
      headers: { 'x-api-key': this.apiKey }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to get currencies: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // 过滤并返回主流加密货币
    const mainCurrencies = ['BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'LTC', 'DOGE']
    return data.currencies
      .filter((code: string) => mainCurrencies.includes(code))
      .map((code: string) => ({
        code,
        name: this.getCurrencyName(code),
        network: code === 'USDT' ? 'ERC20' : undefined,
        minAmount: 0,
        maxAmount: 0
      }))
  }
  
  async getEstimatedPrice(params: PriceEstimateParams): Promise<CryptoPriceEstimate> {
    const response = await fetch(
      `${this.baseUrl}/estimate?amount=${params.amountUSD}&currency_from=usd&currency_to=${params.cryptoCurrency.toLowerCase()}`,
      { headers: { 'x-api-key': this.apiKey } }
    )
    
    if (!response.ok) {
      throw new Error(`Failed to estimate price: ${response.statusText}`)
    }
    
    const data = await response.json()
    return {
      amountUSD: params.amountUSD,
      cryptoAmount: data.estimated_amount,
      cryptoCurrency: params.cryptoCurrency,
      exchangeRate: data.estimated_amount / params.amountUSD,
      estimatedAt: new Date()
    }
  }
  
  async getMinPaymentAmount(currency: string): Promise<number> {
    const response = await fetch(
      `${this.baseUrl}/min-amount?currency_from=usd&currency_to=${currency.toLowerCase()}`,
      { headers: { 'x-api-key': this.apiKey } }
    )
    
    if (!response.ok) {
      throw new Error(`Failed to get min amount: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.min_amount
  }
  
  private mapStatus(nowpaymentsStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      'waiting': 'pending',
      'confirming': 'processing',
      'confirmed': 'processing',
      'sending': 'processing',
      'partially_paid': 'processing',
      'finished': 'succeeded',
      'failed': 'failed',
      'refunded': 'canceled',
      'expired': 'expired'
    }
    return statusMap[nowpaymentsStatus] || 'pending'
  }
  
  private getCurrencyName(code: string): string {
    const names: Record<string, string> = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'USDT': 'Tether',
      'USDC': 'USD Coin',
      'BNB': 'Binance Coin',
      'LTC': 'Litecoin',
      'DOGE': 'Dogecoin'
    }
    return names[code] || code
  }
}

interface PriceEstimateParams {
  amountUSD: number
  cryptoCurrency: string
}
```

### 2. 多语言系统

#### 2.1 国际化服务 (I18nService)

管理多语言内容和用户语言偏好。

**接口**：

```typescript
interface I18nService {
  // 获取翻译
  translate(key: string, locale: Locale, params?: Record<string, any>): string
  
  // 获取商品翻译
  getProductTranslation(productId: string, locale: Locale): Promise<ProductTranslation>
  
  // 保存商品翻译
  saveProductTranslation(translation: ProductTranslation): Promise<void>
  
  // 检测用户语言
  detectUserLocale(request: Request): Locale
  
  // 获取支持的语言列表
  getSupportedLocales(): Locale[]
}

type Locale = 'zh-CN' | 'en-US' | 'es-ES' | 'fr-FR' | 'de-DE'

interface ProductTranslation {
  productId: string
  locale: Locale
  title: string
  description: string
  specifications?: Record<string, string>
}
```

#### 2.2 前端国际化配置

使用 i18next 进行前端国际化。

```typescript
// i18n.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': { translation: zhCN },
      'en-US': { translation: enUS },
      // ... 其他语言
    },
    fallbackLng: 'en-US',
    interpolation: {
      escapeValue: false
    }
  })

export default i18n
```

### 3. 库存管理系统

#### 3.1 库存服务 (InventoryService)

管理商品库存、SKU 和仓库。

**接口**：

```typescript
interface InventoryService {
  // 检查库存
  checkStock(skuId: string, quantity: number): Promise<boolean>
  
  // 预留库存
  reserveStock(skuId: string, quantity: number, orderId: string): Promise<boolean>
  
  // 释放库存
  releaseStock(skuId: string, quantity: number, orderId: string): Promise<void>
  
  // 扣减库存
  deductStock(skuId: string, quantity: number): Promise<void>
  
  // 更新库存
  updateStock(skuId: string, quantity: number, reason: string): Promise<void>
  
  // 获取库存信息
  getStockInfo(skuId: string): Promise<StockInfo>
  
  // 检查库存预警
  checkStockAlerts(): Promise<StockAlert[]>
  
  // 仓库间调拨
  transferStock(params: TransferParams): Promise<void>
}

interface StockInfo {
  skuId: string
  warehouseId: string
  available: number
  reserved: number
  total: number
  alertThreshold: number
}

interface StockAlert {
  skuId: string
  productName: string
  currentStock: number
  threshold: number
  warehouseId: string
}

interface TransferParams {
  skuId: string
  fromWarehouse: string
  toWarehouse: string
  quantity: number
  reason: string
}
```

#### 3.2 SKU 管理服务 (SKUService)

管理商品变体和 SKU。

**接口**：

```typescript
interface SKUService {
  // 创建 SKU
  createSKU(params: CreateSKUParams): Promise<SKU>
  
  // 获取商品的所有 SKU
  getProductSKUs(productId: string): Promise<SKU[]>
  
  // 更新 SKU
  updateSKU(skuId: string, updates: Partial<SKU>): Promise<SKU>
  
  // 生成 SKU 代码
  generateSKUCode(productId: string, attributes: VariantAttribute[]): string
}

interface SKU {
  id: string
  productId: string
  skuCode: string
  attributes: VariantAttribute[]
  price: number
  stock: number
  image?: string
  isActive: boolean
}

interface VariantAttribute {
  name: string  // 例如: "颜色", "尺码"
  value: string // 例如: "红色", "L"
}

interface CreateSKUParams {
  productId: string
  attributes: VariantAttribute[]
  price: number
  initialStock: number
  warehouseId: string
}
```

### 4. 物流配送系统

#### 4.1 物流服务 (ShippingService)

管理物流商集成和运费计算。

**接口**：

```typescript
interface ShippingService {
  // 计算运费
  calculateShippingFee(params: ShippingCalculationParams): Promise<ShippingOption[]>
  
  // 创建运单
  createShipment(params: CreateShipmentParams): Promise<Shipment>
  
  // 获取物流跟踪信息
  trackShipment(trackingNumber: string): Promise<TrackingInfo>
  
  // 更新物流状态
  updateShipmentStatus(shipmentId: string): Promise<void>
  
  // 预估送达时间
  estimateDeliveryTime(params: DeliveryEstimateParams): Promise<DeliveryEstimate>
}

interface ShippingCalculationParams {
  items: Array<{
    weight: number
    volume: number
    quantity: number
  }>
  origin: Address
  destination: Address
}

interface ShippingOption {
  providerId: string
  providerName: string
  serviceName: string
  fee: number
  currency: 'USD'  // 固定为 USD
  estimatedDays: number
}

interface CreateShipmentParams {
  orderId: string
  providerId: string
  origin: Address
  destination: Address
  items: ShipmentItem[]
}

interface Shipment {
  id: string
  trackingNumber: string
  providerId: string
  status: ShipmentStatus
  createdAt: Date
}

interface TrackingInfo {
  trackingNumber: string
  status: ShipmentStatus
  events: TrackingEvent[]
  estimatedDelivery?: Date
}

interface TrackingEvent {
  timestamp: Date
  location: string
  description: string
  status: ShipmentStatus
}

type ShipmentStatus = 
  | 'pending'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'

interface DeliveryEstimate {
  minDays: number
  maxDays: number
  estimatedDate: Date
}

interface Address {
  country: string
  state: string
  city: string
  postalCode: string
  addressLine1: string
  addressLine2?: string
}
```

#### 4.2 物流商适配器

统一不同物流商的 API 接口。

```typescript
interface LogisticsProvider {
  createShipment(params: any): Promise<{ trackingNumber: string }>
  getTracking(trackingNumber: string): Promise<TrackingInfo>
  calculateRate(params: any): Promise<number>
}

class DHLAdapter implements LogisticsProvider {
  // DHL 特定实现
}

class FedExAdapter implements LogisticsProvider {
  // FedEx 特定实现
}

class ChinaPostAdapter implements LogisticsProvider {
  // 中国邮政特定实现
}
```


### 5. 营销系统

#### 5.1 促销服务 (PromotionService)

管理促销活动和优惠券。

**接口**：

```typescript
interface PromotionService {
  // 创建促销活动
  createPromotion(params: CreatePromotionParams): Promise<Promotion>
  
  // 获取有效促销
  getActivePromotions(productId?: string): Promise<Promotion[]>
  
  // 应用促销
  applyPromotion(orderId: string, promotionId: string): Promise<DiscountResult>
  
  // 验证促销资格
  validatePromotion(promotionId: string, userId: string): Promise<boolean>
}

interface Promotion {
  id: string
  name: string
  type: 'discount' | 'buy_x_get_y' | 'free_shipping'
  discountType: 'percentage' | 'fixed_amount'
  discountValue: number
  minPurchase?: number
  startDate: Date
  endDate: Date
  usageLimit?: number
  usageCount: number
  applicableProducts?: string[]
}

interface CreatePromotionParams {
  name: string
  type: Promotion['type']
  discountType: Promotion['discountType']
  discountValue: number
  minPurchase?: number
  startDate: Date
  endDate: Date
  usageLimit?: number
  applicableProducts?: string[]
}

interface DiscountResult {
  originalAmount: number
  discountAmount: number
  finalAmount: number
  appliedPromotions: string[]
}
```

#### 5.2 优惠券服务 (CouponService)

管理优惠券的发放和使用。

**接口**：

```typescript
interface CouponService {
  // 创建优惠券
  createCoupon(params: CreateCouponParams): Promise<Coupon>
  
  // 发放优惠券
  issueCoupon(couponId: string, userId: string): Promise<UserCoupon>
  
  // 使用优惠券
  useCoupon(code: string, userId: string, orderId: string): Promise<CouponUsageResult>
  
  // 验证优惠券
  validateCoupon(code: string, userId: string, orderAmount: number): Promise<boolean>
  
  // 获取用户优惠券
  getUserCoupons(userId: string): Promise<UserCoupon[]>
  
  // 退还优惠券
  refundCoupon(usageId: string): Promise<void>
}

interface Coupon {
  id: string
  code: string
  type: 'fixed_amount' | 'percentage' | 'free_shipping'
  value: number
  minPurchase?: number
  maxDiscount?: number
  startDate: Date
  endDate: Date
  usageLimit: number
  usageCount: number
  perUserLimit: number
}

interface UserCoupon {
  id: string
  couponId: string
  userId: string
  code: string
  isUsed: boolean
  usedAt?: Date
  expiresAt: Date
}

interface CouponUsageResult {
  success: boolean
  discountAmount: number
  error?: string
}

interface CreateCouponParams {
  code: string
  type: Coupon['type']
  value: number
  minPurchase?: number
  maxDiscount?: number
  startDate: Date
  endDate: Date
  usageLimit: number
  perUserLimit: number
}
```

#### 5.3 会员服务 (MembershipService)

管理会员等级和积分。

**接口**：

```typescript
interface MembershipService {
  // 获取会员信息
  getMemberInfo(userId: string): Promise<MemberInfo>
  
  // 累积积分
  addPoints(userId: string, points: number, reason: string): Promise<void>
  
  // 扣减积分
  deductPoints(userId: string, points: number, reason: string): Promise<void>
  
  // 检查并升级会员等级
  checkAndUpgradeTier(userId: string): Promise<MemberTier>
  
  // 获取会员权益
  getMemberBenefits(tier: MemberTier): Promise<MemberBenefits>
}

interface MemberInfo {
  userId: string
  tier: MemberTier
  points: number
  totalSpent: number
  nextTierPoints: number
  joinedAt: Date
}

type MemberTier = 'regular' | 'silver' | 'gold' | 'platinum'

interface MemberBenefits {
  tier: MemberTier
  discountPercentage: number
  freeShippingThreshold: number
  exclusiveCoupons: string[]
  prioritySupport: boolean
}
```

### 6. 客户服务系统

#### 6.1 客服服务 (CustomerServiceService)

管理实时聊天和工单。

**接口**：

```typescript
interface CustomerServiceService {
  // 创建聊天会话
  createChatSession(userId: string): Promise<ChatSession>
  
  // 发送消息
  sendMessage(params: SendMessageParams): Promise<ChatMessage>
  
  // 获取聊天历史
  getChatHistory(sessionId: string): Promise<ChatMessage[]>
  
  // 创建工单
  createTicket(params: CreateTicketParams): Promise<Ticket>
  
  // 更新工单状态
  updateTicketStatus(ticketId: string, status: TicketStatus): Promise<void>
  
  // 回复工单
  replyToTicket(ticketId: string, reply: string, userId: string): Promise<void>
  
  // 获取用户工单
  getUserTickets(userId: string): Promise<Ticket[]>
}

interface ChatSession {
  id: string
  userId: string
  agentId?: string
  status: 'waiting' | 'active' | 'closed'
  createdAt: Date
}

interface ChatMessage {
  id: string
  sessionId: string
  senderId: string
  senderType: 'user' | 'agent' | 'system'
  content: string
  attachments?: string[]
  timestamp: Date
}

interface SendMessageParams {
  sessionId: string
  senderId: string
  senderType: ChatMessage['senderType']
  content: string
  attachments?: File[]
}

interface Ticket {
  id: string
  ticketNumber: string
  userId: string
  orderId?: string
  type: 'return' | 'exchange' | 'complaint' | 'inquiry'
  subject: string
  description: string
  status: TicketStatus
  priority: 'low' | 'medium' | 'high'
  assignedTo?: string
  createdAt: Date
  updatedAt: Date
  replies: TicketReply[]
}

type TicketStatus = 'pending' | 'in_progress' | 'resolved' | 'closed'

interface TicketReply {
  id: string
  ticketId: string
  userId: string
  userType: 'customer' | 'agent' | 'merchant'
  content: string
  attachments?: string[]
  timestamp: Date
}

interface CreateTicketParams {
  userId: string
  orderId?: string
  type: Ticket['type']
  subject: string
  description: string
  attachments?: File[]
}
```

#### 6.2 退换货服务 (ReturnService)

管理退换货流程。

**接口**：

```typescript
interface ReturnService {
  // 创建退货申请
  createReturnRequest(params: CreateReturnParams): Promise<ReturnRequest>
  
  // 审核退货申请
  reviewReturnRequest(requestId: string, approved: boolean, reason?: string): Promise<void>
  
  // 更新退货状态
  updateReturnStatus(requestId: string, status: ReturnStatus): Promise<void>
  
  // 确认收货并退款
  confirmReturnAndRefund(requestId: string): Promise<void>
  
  // 获取退货信息
  getReturnRequest(requestId: string): Promise<ReturnRequest>
}

interface ReturnRequest {
  id: string
  orderId: string
  userId: string
  items: ReturnItem[]
  reason: string
  description: string
  images: string[]
  status: ReturnStatus
  returnAddress?: Address
  trackingNumber?: string
  createdAt: Date
  reviewedAt?: Date
  completedAt?: Date
}

interface ReturnItem {
  orderItemId: string
  productId: string
  skuId: string
  quantity: number
  refundAmount: number
}

type ReturnStatus = 
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'shipping'
  | 'received'
  | 'refunded'
  | 'completed'

interface CreateReturnParams {
  orderId: string
  userId: string
  items: Array<{
    orderItemId: string
    quantity: number
  }>
  reason: string
  description: string
  images?: File[]
}
```

### 7. 数据分析系统

#### 7.1 分析服务 (AnalyticsService)

收集和分析用户行为数据。

**接口**：

```typescript
interface AnalyticsService {
  // 记录事件
  trackEvent(event: AnalyticsEvent): Promise<void>
  
  // 获取销售报表
  getSalesReport(params: ReportParams): Promise<SalesReport>
  
  // 获取商品分析
  getProductAnalytics(productId: string, params: ReportParams): Promise<ProductAnalytics>
  
  // 获取用户行为分析
  getUserBehaviorAnalytics(params: ReportParams): Promise<UserBehaviorAnalytics>
  
  // 获取转化率数据
  getConversionFunnel(params: ReportParams): Promise<ConversionFunnel>
  
  // 导出报表
  exportReport(reportType: string, params: ReportParams): Promise<Blob>
}

interface AnalyticsEvent {
  userId?: string
  sessionId: string
  eventType: 'page_view' | 'product_view' | 'add_to_cart' | 'purchase' | 'search'
  eventData: Record<string, any>
  timestamp: Date
}

interface ReportParams {
  startDate: Date
  endDate: Date
  groupBy?: 'day' | 'week' | 'month'
  filters?: Record<string, any>
}

interface SalesReport {
  period: { start: Date; end: Date }
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  refundAmount: number
  netRevenue: number
  topProducts: Array<{
    productId: string
    productName: string
    revenue: number
    quantity: number
  }>
  revenueByRegion: Record<string, number>
  revenueByCategory: Record<string, number>
  trends: Array<{
    date: Date
    revenue: number
    orders: number
  }>
}

interface ProductAnalytics {
  productId: string
  views: number
  addToCartRate: number
  conversionRate: number
  revenue: number
  unitsSold: number
  averageRating: number
  reviewCount: number
  returnRate: number
  inventoryTurnover: number
}

interface UserBehaviorAnalytics {
  totalUsers: number
  activeUsers: number
  newUsers: number
  returningUsers: number
  averageSessionDuration: number
  bounceRate: number
  retentionRate: Record<string, number> // day1, day7, day30
  topPages: Array<{
    path: string
    views: number
    uniqueVisitors: number
  }>
}

interface ConversionFunnel {
  stages: Array<{
    name: string
    users: number
    conversionRate: number
  }>
  dropOffPoints: Array<{
    from: string
    to: string
    dropOffRate: number
  }>
}
```

### 8. 安全和合规系统

#### 8.1 安全服务 (SecurityService)

处理数据加密和安全相关功能。

**接口**：

```typescript
interface SecurityService {
  // 加密敏感数据
  encrypt(data: string): Promise<string>
  
  // 解密数据
  decrypt(encryptedData: string): Promise<string>
  
  // 哈希密码
  hashPassword(password: string): Promise<string>
  
  // 验证密码
  verifyPassword(password: string, hash: string): Promise<boolean>
  
  // 生成 CSRF 令牌
  generateCSRFToken(sessionId: string): string
  
  // 验证 CSRF 令牌
  validateCSRFToken(token: string, sessionId: string): boolean
  
  // 检测异常活动
  detectAnomalousActivity(userId: string, activity: Activity): Promise<boolean>
}

interface Activity {
  type: string
  timestamp: Date
  ipAddress: string
  userAgent: string
  metadata: Record<string, any>
}
```

#### 8.2 审计服务 (AuditService)

记录和查询审计日志。

**接口**：

```typescript
interface AuditService {
  // 记录审计日志
  log(entry: AuditLogEntry): Promise<void>
  
  // 查询审计日志
  queryLogs(params: AuditQueryParams): Promise<AuditLog[]>
  
  // 导出审计日志
  exportLogs(params: AuditQueryParams): Promise<Blob>
}

interface AuditLogEntry {
  userId: string
  action: string
  resource: string
  resourceId: string
  changes?: Record<string, any>
  ipAddress: string
  userAgent: string
  timestamp: Date
}

interface AuditLog extends AuditLogEntry {
  id: string
}

interface AuditQueryParams {
  userId?: string
  action?: string
  resource?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}
```

#### 8.3 GDPR 合规服务 (GDPRService)

处理 GDPR 相关请求。

**接口**：

```typescript
interface GDPRService {
  // 导出用户数据
  exportUserData(userId: string): Promise<UserDataExport>
  
  // 删除用户数据
  deleteUserData(userId: string): Promise<void>
  
  // 记录同意
  recordConsent(userId: string, consentType: string): Promise<void>
  
  // 撤销同意
  revokeConsent(userId: string, consentType: string): Promise<void>
  
  // 获取同意状态
  getConsentStatus(userId: string): Promise<ConsentStatus>
}

interface UserDataExport {
  userId: string
  profile: any
  orders: any[]
  reviews: any[]
  addresses: any[]
  preferences: any
  exportedAt: Date
}

interface ConsentStatus {
  userId: string
  consents: Array<{
    type: string
    granted: boolean
    timestamp: Date
  }>
}
```

## 数据模型

### 核心数据表

#### payments（支付记录）

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  payment_method VARCHAR(20) NOT NULL DEFAULT 'crypto', -- 固定为 'crypto'
  nowpayments_payment_id VARCHAR(255) UNIQUE,
  pay_address VARCHAR(255), -- 加密货币支付地址
  pay_amount DECIMAL(20, 8), -- 加密货币支付金额（高精度）
  pay_currency VARCHAR(10), -- 'BTC', 'ETH', 'USDT', 'USDC'
  price_amount DECIMAL(10, 2) NOT NULL, -- USD 金额（所有商品以 USD 定价）
  price_currency VARCHAR(3) NOT NULL DEFAULT 'USD', -- 固定为 'USD'
  exchange_rate DECIMAL(20, 8), -- 支付时的汇率（1 USD = X crypto）
  status VARCHAR(20) NOT NULL, -- 'pending', 'processing', 'succeeded', 'failed', 'expired'
  payment_url TEXT, -- NOWPayments 支付页面URL
  expiration_date TIMESTAMP,
  actually_paid DECIMAL(20, 8), -- 实际支付的加密货币数量
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_nowpayments_id ON payments(nowpayments_payment_id);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
```

#### refunds（退款记录）

```sql
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL REFERENCES payments(id),
  amount_usd DECIMAL(10, 2) NOT NULL, -- 退款的 USD 金额
  crypto_amount DECIMAL(20, 8), -- 退款的加密货币数量
  crypto_currency VARCHAR(10), -- 退款的加密货币类型
  exchange_rate DECIMAL(20, 8), -- 退款时使用的汇率
  reason TEXT,
  status VARCHAR(20) NOT NULL, -- 'pending', 'completed', 'failed'
  refund_id VARCHAR(255), -- NOWPayments 退款 ID
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_refunds_created_at ON refunds(created_at DESC);
```

#### product_translations（商品翻译）

```sql
CREATE TABLE product_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  locale VARCHAR(10) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  specifications JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, locale)
);

CREATE INDEX idx_product_translations_product ON product_translations(product_id);
CREATE INDEX idx_product_translations_locale ON product_translations(locale);
```

#### inventory（库存）

```sql
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku_id UUID NOT NULL REFERENCES skus(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  available INTEGER NOT NULL DEFAULT 0,
  reserved INTEGER NOT NULL DEFAULT 0,
  alert_threshold INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(sku_id, warehouse_id)
);

CREATE INDEX idx_inventory_sku ON inventory(sku_id);
CREATE INDEX idx_inventory_warehouse ON inventory(warehouse_id);
CREATE INDEX idx_inventory_low_stock ON inventory(available) WHERE available <= alert_threshold;
```

#### skus（SKU）

```sql
CREATE TABLE skus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  sku_code VARCHAR(100) UNIQUE NOT NULL,
  attributes JSONB NOT NULL, -- [{"name": "颜色", "value": "红色"}]
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_skus_product ON skus(product_id);
CREATE INDEX idx_skus_code ON skus(sku_code);
```

#### warehouses（仓库）

```sql
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  address JSONB NOT NULL,
  contact_info JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### stock_movements（库存变动记录）

```sql
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku_id UUID NOT NULL REFERENCES skus(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  quantity INTEGER NOT NULL, -- 正数为入库，负数为出库
  type VARCHAR(50) NOT NULL, -- 'purchase', 'sale', 'transfer', 'adjustment'
  reference_id UUID, -- 关联的订单ID或调拨单ID
  reason TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_sku ON stock_movements(sku_id);
CREATE INDEX idx_stock_movements_warehouse ON stock_movements(warehouse_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at DESC);
```

#### shipments（运单）

```sql
CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  provider_id VARCHAR(50) NOT NULL,
  provider_name VARCHAR(100) NOT NULL,
  tracking_number VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL,
  origin_address JSONB NOT NULL,
  destination_address JSONB NOT NULL,
  shipping_fee DECIMAL(10, 2) NOT NULL,
  estimated_delivery DATE,
  actual_delivery TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shipments_order ON shipments(order_id);
CREATE INDEX idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX idx_shipments_status ON shipments(status);
```

#### tracking_events（物流跟踪事件）

```sql
CREATE TABLE tracking_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID NOT NULL REFERENCES shipments(id),
  status VARCHAR(50) NOT NULL,
  location VARCHAR(255),
  description TEXT,
  event_time TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tracking_events_shipment ON tracking_events(shipment_id);
CREATE INDEX idx_tracking_events_time ON tracking_events(event_time DESC);
```


#### promotions（促销活动）

```sql
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES profiles(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'discount', 'buy_x_get_y', 'free_shipping'
  discount_type VARCHAR(20), -- 'percentage', 'fixed_amount'
  discount_value DECIMAL(10, 2),
  min_purchase DECIMAL(10, 2),
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  applicable_products JSONB, -- 产品ID数组
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_promotions_merchant ON promotions(merchant_id);
CREATE INDEX idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX idx_promotions_active ON promotions(is_active) WHERE is_active = true;
```

#### coupons（优惠券）

```sql
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES profiles(id),
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'fixed_amount', 'percentage', 'free_shipping'
  value DECIMAL(10, 2) NOT NULL,
  min_purchase DECIMAL(10, 2),
  max_discount DECIMAL(10, 2),
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  usage_limit INTEGER NOT NULL,
  usage_count INTEGER DEFAULT 0,
  per_user_limit INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_merchant ON coupons(merchant_id);
CREATE INDEX idx_coupons_active ON coupons(is_active) WHERE is_active = true;
```

#### user_coupons（用户优惠券）

```sql
CREATE TABLE user_coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID NOT NULL REFERENCES coupons(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP,
  order_id UUID REFERENCES orders(id),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(coupon_id, user_id, created_at)
);

CREATE INDEX idx_user_coupons_user ON user_coupons(user_id);
CREATE INDEX idx_user_coupons_coupon ON user_coupons(coupon_id);
CREATE INDEX idx_user_coupons_unused ON user_coupons(user_id, is_used) WHERE is_used = false;
```

#### member_tiers（会员等级）

```sql
CREATE TABLE member_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  min_points INTEGER NOT NULL,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  free_shipping_threshold DECIMAL(10, 2),
  benefits JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO member_tiers (name, min_points, discount_percentage, free_shipping_threshold) VALUES
  ('regular', 0, 0, 100),
  ('silver', 1000, 5, 80),
  ('gold', 5000, 10, 50),
  ('platinum', 10000, 15, 0);
```

#### member_points（会员积分记录）

```sql
CREATE TABLE member_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  points INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'earn', 'spend', 'expire'
  reason TEXT NOT NULL,
  reference_id UUID, -- 订单ID或其他关联ID
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_member_points_user ON member_points(user_id);
CREATE INDEX idx_member_points_created_at ON member_points(created_at DESC);
```

#### user_memberships（用户会员信息）

```sql
CREATE TABLE user_memberships (
  user_id UUID PRIMARY KEY REFERENCES profiles(id),
  tier_id UUID NOT NULL REFERENCES member_tiers(id),
  total_points INTEGER DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  joined_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_memberships_tier ON user_memberships(tier_id);
```

#### referrals（推荐关系）

```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES profiles(id),
  referred_id UUID NOT NULL REFERENCES profiles(id),
  referral_code VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'rewarded'
  reward_amount DECIMAL(10, 2),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
```

#### chat_sessions（聊天会话）

```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  agent_id UUID REFERENCES profiles(id),
  status VARCHAR(20) DEFAULT 'waiting', -- 'waiting', 'active', 'closed'
  created_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP
);

CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_agent ON chat_sessions(agent_id);
CREATE INDEX idx_chat_sessions_status ON chat_sessions(status);
```

#### chat_messages（聊天消息）

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id),
  sender_id UUID NOT NULL REFERENCES profiles(id),
  sender_type VARCHAR(20) NOT NULL, -- 'user', 'agent', 'system'
  content TEXT NOT NULL,
  attachments JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
```

#### support_tickets（工单）

```sql
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id),
  order_id UUID REFERENCES orders(id),
  type VARCHAR(50) NOT NULL, -- 'return', 'exchange', 'complaint', 'inquiry'
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'resolved', 'closed'
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

CREATE INDEX idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_assigned ON support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_number ON support_tickets(ticket_number);
```

#### ticket_replies（工单回复）

```sql
CREATE TABLE ticket_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  user_type VARCHAR(20) NOT NULL, -- 'customer', 'agent', 'merchant'
  content TEXT NOT NULL,
  attachments JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ticket_replies_ticket ON ticket_replies(ticket_id);
CREATE INDEX idx_ticket_replies_created_at ON ticket_replies(created_at DESC);
```

#### return_requests（退货申请）

```sql
CREATE TABLE return_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  items JSONB NOT NULL, -- 退货商品列表
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  images JSONB,
  status VARCHAR(20) DEFAULT 'pending_review',
  return_address JSONB,
  tracking_number VARCHAR(255),
  refund_amount DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_return_requests_order ON return_requests(order_id);
CREATE INDEX idx_return_requests_user ON return_requests(user_id);
CREATE INDEX idx_return_requests_status ON return_requests(status);
```

#### faqs（常见问题）

```sql
CREATE TABLE faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(100) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  locale VARCHAR(10) DEFAULT 'en-US',
  view_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_faqs_category ON faqs(category);
CREATE INDEX idx_faqs_locale ON faqs(locale);
CREATE INDEX idx_faqs_published ON faqs(is_published) WHERE is_published = true;
```

#### audit_logs（审计日志）

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

#### analytics_events（分析事件）

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  session_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  page_url TEXT,
  referrer TEXT,
  device_type VARCHAR(20),
  browser VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);

-- 使用 TimescaleDB 的超表优化时序数据（可选）
-- SELECT create_hypertable('analytics_events', 'created_at');
```

#### user_consents（用户同意记录）

```sql
CREATE TABLE user_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  consent_type VARCHAR(50) NOT NULL, -- 'cookies', 'marketing', 'data_processing'
  granted BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP
);

CREATE INDEX idx_user_consents_user ON user_consents(user_id);
CREATE INDEX idx_user_consents_type ON user_consents(consent_type);
```

#### tax_rates（税率配置）

```sql
CREATE TABLE tax_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country VARCHAR(2) NOT NULL,
  state VARCHAR(100),
  tax_type VARCHAR(50) NOT NULL, -- 'VAT', 'sales_tax', 'GST'
  rate DECIMAL(5, 2) NOT NULL,
  effective_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(country, state, tax_type, effective_date)
);

CREATE INDEX idx_tax_rates_location ON tax_rates(country, state);
CREATE INDEX idx_tax_rates_effective ON tax_rates(effective_date DESC);
```

## 正确性属性

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的正式陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

