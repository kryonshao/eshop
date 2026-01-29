# 需求文档：跨境电商平台功能增强

## 简介

本文档定义了跨境电商平台的功能增强需求。该平台基于 React + TypeScript + Supabase 构建，目前已实现基础的用户认证、商品展示、订单管理等功能。本次增强将补充支付系统、多语言支持、库存管理、物流配送等核心跨境电商功能，以满足中小企业的国际贸易需求。

## 术语表

- **系统（System）**: 跨境电商平台的后端和前端应用
- **支付网关（Payment_Gateway）**: 第三方支付服务提供商（如 Stripe、PayPal）
- **库存系统（Inventory_System）**: 管理商品库存的子系统
- **物流服务商（Logistics_Provider）**: 提供物流配送服务的第三方公司
- **商家（Merchant）**: 在平台上销售商品的卖家
- **买家（Buyer）**: 在平台上购买商品的用户
- **SKU（Stock_Keeping_Unit）**: 库存量单位，商品的最小可售单元
- **订单（Order）**: 买家提交的购买请求
- **支付状态（Payment_Status）**: 订单的支付进度状态
- **库存预警（Stock_Alert）**: 当库存低于阈值时的通知
- **汇率（Exchange_Rate）**: 不同货币之间的兑换比率
- **优惠券（Coupon）**: 可用于折扣的促销凭证
- **会员等级（Membership_Tier）**: 用户的会员身份级别
- **审计日志（Audit_Log）**: 系统操作的记录

## 需求

### 需求 1：加密货币支付集成（P0）

**用户故事：** 作为买家，我希望通过加密货币支付完成交易，以便享受去中心化和低手续费的支付体验。

#### 验收标准

1. WHEN 买家提交订单 THEN THE 系统 SHALL 通过 NOWPayments 提供多种加密货币支付选项（BTC、ETH、USDT等）
2. WHEN 买家选择加密货币支付 THEN THE 系统 SHALL 生成支付地址和二维码供买家扫码支付
3. IF 支付失败或超时 THEN THE 系统 SHALL 保留订单并允许买家重新尝试支付
4. WHEN 支付成功确认 THEN THE 系统 SHALL 更新订单状态为"已支付"并发送确认邮件
5. WHEN 支付处理超过30分钟未确认 THEN THE 系统 SHALL 显示超时提示并允许买家查询支付状态
6. THE 系统 SHALL 使用 HTTPS 协议传输所有支付相关数据
7. THE 系统 SHALL 通过 NOWPayments webhook 接收支付状态更新通知
8. THE 系统 SHALL 支持至少 BTC、ETH、USDT、USDC 四种主流加密货币
9. THE 系统 SHALL 以 USD 作为商品定价的基准货币
10. WHEN 买家选择加密货币 THEN THE 系统 SHALL 实时显示该加密货币的支付金额


### 需求 2：退款处理系统（P0）

**用户故事：** 作为买家，我希望在需要时能够申请退款，以便在商品有问题时保护我的权益。

#### 验收标准

1. WHEN 买家申请退款 THEN THE 系统 SHALL 创建退款请求并通知商家
2. WHEN 商家批准退款 THEN THE 系统 SHALL 通过 NOWPayments 发起加密货币退款
3. WHEN 退款处理完成 THEN THE 系统 SHALL 更新订单状态为"已退款"并通知买家
4. IF 退款失败 THEN THE 系统 SHALL 记录失败原因并通知管理员
5. WHEN 部分商品退款 THEN THE 系统 SHALL 按比例计算退款金额
6. THE 系统 SHALL 在订单支付后180天内允许申请退款
7. WHEN 退款时 THEN THE 系统 SHALL 使用原订单支付时的加密货币和汇率进行退款

### 需求 3：多语言支持（P0）

**用户故事：** 作为国际买家，我希望使用我的母语浏览平台，以便更好地理解商品信息和完成购买。

#### 验收标准

1. WHEN 用户首次访问平台 THEN THE 系统 SHALL 根据浏览器语言设置自动选择界面语言
2. WHEN 用户切换语言 THEN THE 系统 SHALL 立即更新所有界面文本为目标语言
3. THE 系统 SHALL 支持中文、英文、西班牙文、法文、德文至少五种语言
4. WHEN 显示商品信息 THEN THE 系统 SHALL 显示对应语言的商品标题和描述
5. WHERE 某语言的翻译不存在 THEN THE 系统 SHALL 显示英文作为默认语言
6. WHEN 用户切换语言 THEN THE 系统 SHALL 保存语言偏好到用户配置
7. THE 系统 SHALL 在 URL 中包含语言代码以支持 SEO

### 需求 4：本地化内容管理（P1）

**用户故事：** 作为商家，我希望为不同地区的用户提供本地化的商品描述，以便提高转化率。

#### 验收标准

1. WHEN 商家创建商品 THEN THE 系统 SHALL 允许为每种支持的语言输入商品信息
2. WHEN 商家更新商品信息 THEN THE 系统 SHALL 允许单独更新特定语言的内容
3. THE 系统 SHALL 为每个商品存储多语言版本的标题、描述和规格
4. WHEN 买家查看商品 THEN THE 系统 SHALL 显示与买家语言设置匹配的内容
5. WHERE 商家未提供某语言的翻译 THEN THE 系统 SHALL 显示商家的默认语言内容并标注

### 需求 5：库存跟踪系统（P0）

**用户故事：** 作为商家，我希望实时跟踪商品库存，以便避免超卖和缺货情况。

#### 验收标准

1. WHEN 买家下单 THEN THE 库存系统 SHALL 立即扣减对应 SKU 的可用库存
2. WHEN 订单取消 THEN THE 库存系统 SHALL 恢复对应 SKU 的库存数量
3. WHEN 库存数量变更 THEN THE 系统 SHALL 记录变更时间、数量和原因
4. IF 库存不足 THEN THE 系统 SHALL 阻止买家将商品加入购物车
5. WHEN 多个买家同时购买同一商品 THEN THE 系统 SHALL 使用数据库锁机制防止超卖
6. THE 系统 SHALL 为每个 SKU 维护独立的库存计数
7. WHEN 库存更新失败 THEN THE 系统 SHALL 回滚订单创建操作

### 需求 6：库存预警系统（P1）

**用户故事：** 作为商家，我希望在库存不足时收到通知，以便及时补货。

#### 验收标准

1. WHEN 商家设置商品 THEN THE 系统 SHALL 允许为每个 SKU 设置库存预警阈值
2. WHEN SKU 库存低于预警阈值 THEN THE 系统 SHALL 向商家发送库存预警通知
3. WHEN 库存预警触发 THEN THE 系统 SHALL 在商家后台显示预警标记
4. THE 系统 SHALL 每天最多发送一次相同 SKU 的预警通知
5. WHEN 库存恢复到阈值以上 THEN THE 系统 SHALL 清除预警状态

### 需求 7：多仓库管理（P1）

**用户故事：** 作为商家，我希望管理多个仓库的库存，以便优化物流配送。

#### 验收标准

1. WHEN 商家创建仓库 THEN THE 系统 SHALL 记录仓库名称、地址和联系信息
2. WHEN 商家分配库存 THEN THE 系统 SHALL 允许为每个仓库设置 SKU 的库存数量
3. WHEN 买家下单 THEN THE 系统 SHALL 根据买家地址选择最近的仓库发货
4. WHEN 选定仓库库存不足 THEN THE 系统 SHALL 尝试从其他仓库调配
5. THE 系统 SHALL 显示每个仓库的总库存和可用库存
6. WHEN 仓库间调拨库存 THEN THE 系统 SHALL 记录调拨单并更新两个仓库的库存

### 需求 8：SKU 变体管理（P0）

**用户故事：** 作为商家，我希望管理商品的不同规格（如尺码、颜色），以便为买家提供多样选择。

#### 验收标准

1. WHEN 商家创建商品 THEN THE 系统 SHALL 允许定义变体属性（如颜色、尺码）
2. WHEN 商家添加变体 THEN THE 系统 SHALL 为每个变体组合生成唯一的 SKU
3. THE 系统 SHALL 为每个 SKU 存储独立的价格、库存和图片
4. WHEN 买家选择商品 THEN THE 系统 SHALL 显示所有可用的变体选项
5. WHEN 买家选择变体 THEN THE 系统 SHALL 更新显示的价格和库存状态
6. WHERE 某个变体缺货 THEN THE 系统 SHALL 禁用该变体选项并显示"缺货"标记

### 需求 9：物流商集成（P0）

**用户故事：** 作为商家，我希望集成多个物流服务商，以便为不同地区的买家提供最优配送方案。

#### 验收标准

1. WHEN 商家配置物流 THEN THE 系统 SHALL 支持集成至少三家国际物流服务商
2. WHEN 买家下单 THEN THE 系统 SHALL 根据收货地址显示可用的物流选项
3. WHEN 订单发货 THEN THE 系统 SHALL 调用物流商 API 创建运单并获取跟踪号
4. IF 物流 API 调用失败 THEN THE 系统 SHALL 允许商家手动输入跟踪号
5. THE 系统 SHALL 存储每个物流商的 API 密钥和配置信息
6. WHEN 物流商返回错误 THEN THE 系统 SHALL 记录错误日志并通知商家

### 需求 10：运费计算引擎（P0）

**用户故事：** 作为买家，我希望在下单前了解准确的运费，以便做出购买决策。

#### 验收标准

1. WHEN 买家查看购物车 THEN THE 系统 SHALL 根据商品重量、体积和目的地计算运费
2. WHEN 买家输入收货地址 THEN THE 系统 SHALL 实时更新运费金额
3. THE 系统 SHALL 支持基于重量、体积、距离的多种运费计算规则
4. WHERE 订单金额超过商家设置的阈值 THEN THE 系统 SHALL 提供免运费
5. WHEN 购物车包含多个商家的商品 THEN THE 系统 SHALL 分别计算每个商家的运费
6. THE 系统 SHALL 允许商家为不同地区设置不同的运费规则
7. WHEN 运费计算失败 THEN THE 系统 SHALL 显示预估运费并标注"最终运费以实际为准"

### 需求 11：物流跟踪集成（P1）

**用户故事：** 作为买家，我希望实时查看包裹的物流状态，以便了解配送进度。

#### 验收标准

1. WHEN 订单发货 THEN THE 系统 SHALL 定期调用物流商 API 获取最新物流状态
2. WHEN 物流状态更新 THEN THE 系统 SHALL 在订单详情页显示最新的物流信息
3. THE 系统 SHALL 显示物流轨迹的时间线视图
4. WHEN 包裹签收 THEN THE 系统 SHALL 自动更新订单状态为"已完成"
5. WHERE 物流商不支持 API 查询 THEN THE 系统 SHALL 提供物流商官网的跟踪链接
6. THE 系统 SHALL 每4小时自动更新一次物流信息


### 需求 12：配送时效预估（P1）

**用户故事：** 作为买家，我希望在下单前了解预计送达时间，以便安排收货。

#### 验收标准

1. WHEN 买家选择物流方式 THEN THE 系统 SHALL 显示预计送达日期范围
2. THE 系统 SHALL 根据发货地、目的地和物流商的时效数据计算配送时间
3. WHEN 订单发货 THEN THE 系统 SHALL 更新预计送达日期
4. WHERE 遇到节假日 THEN THE 系统 SHALL 自动延长预计送达时间
5. THE 系统 SHALL 在订单详情页显示预计送达日期

### 需求 13：商品管理系统（P0）

**用户故事：** 作为商家，我希望方便地管理我的商品信息，以便快速上架和更新商品。

#### 验收标准

1. WHEN 商家创建商品 THEN THE 系统 SHALL 要求输入商品标题、描述、价格、分类和至少一张图片
2. WHEN 商家上传商品图片 THEN THE 系统 SHALL 支持 JPG、PNG、WebP 格式且单张不超过5MB
3. WHEN 商家编辑商品 THEN THE 系统 SHALL 保存修改历史记录
4. WHEN 商家删除商品 THEN THE 系统 SHALL 软删除商品并保留历史订单数据
5. THE 系统 SHALL 允许商家批量导入商品（CSV 或 Excel 格式）
6. WHEN 商家上架商品 THEN THE 系统 SHALL 验证必填字段完整性
7. THE 系统 SHALL 允许商家设置商品的上架时间和下架时间

### 需求 14：销售数据分析（P1）

**用户故事：** 作为商家，我希望查看销售数据分析，以便了解经营状况并优化策略。

#### 验收标准

1. WHEN 商家访问数据分析页面 THEN THE 系统 SHALL 显示今日、本周、本月的销售额统计
2. THE 系统 SHALL 显示销售额趋势图表（折线图或柱状图）
3. THE 系统 SHALL 显示热销商品排行榜（前10名）
4. THE 系统 SHALL 显示订单数量、平均订单金额、退款率等关键指标
5. WHEN 商家选择日期范围 THEN THE 系统 SHALL 更新统计数据
6. THE 系统 SHALL 允许商家导出销售报表（PDF 或 Excel 格式）
7. THE 系统 SHALL 按商品分类显示销售分布

### 需求 15：财务报表系统（P1）

**用户故事：** 作为商家，我希望查看财务报表，以便了解收入和支出情况。

#### 验收标准

1. WHEN 商家查看财务报表 THEN THE 系统 SHALL 显示总收入、平台佣金、退款金额、净收入
2. THE 系统 SHALL 按月份生成财务汇总报表
3. THE 系统 SHALL 显示待结算金额和已结算金额
4. WHEN 订单完成 THEN THE 系统 SHALL 在结算周期后将款项标记为可结算
5. THE 系统 SHALL 记录每笔交易的手续费和税费
6. THE 系统 SHALL 支持按日期范围筛选财务数据
7. WHEN 商家申请提现 THEN THE 系统 SHALL 验证可提现余额并创建提现记录

### 需求 16：促销活动管理（P1）

**用户故事：** 作为商家，我希望创建促销活动，以便吸引买家并提高销量。

#### 验收标准

1. WHEN 商家创建促销活动 THEN THE 系统 SHALL 允许设置活动名称、时间范围和折扣规则
2. THE 系统 SHALL 支持满减、折扣、买赠三种促销类型
3. WHEN 促销活动生效 THEN THE 系统 SHALL 在商品页面显示促销标签和折后价
4. WHEN 买家下单 THEN THE 系统 SHALL 自动应用符合条件的促销优惠
5. WHERE 多个促销活动冲突 THEN THE 系统 SHALL 应用对买家最优惠的方案
6. WHEN 促销活动结束 THEN THE 系统 SHALL 自动恢复商品原价
7. THE 系统 SHALL 限制每个买家在同一活动中的参与次数

### 需求 17：优惠券系统（P1）

**用户故事：** 作为商家，我希望发放优惠券，以便激励买家购买和提高复购率。

#### 验收标准

1. WHEN 商家创建优惠券 THEN THE 系统 SHALL 允许设置优惠金额、使用条件和有效期
2. THE 系统 SHALL 支持满减券、折扣券、包邮券三种类型
3. WHEN 商家发放优惠券 THEN THE 系统 SHALL 生成唯一的优惠券代码
4. WHEN 买家领取优惠券 THEN THE 系统 SHALL 将优惠券添加到买家账户
5. WHEN 买家下单 THEN THE 系统 SHALL 显示可用的优惠券列表
6. WHEN 买家使用优惠券 THEN THE 系统 SHALL 验证优惠券有效性并扣减订单金额
7. THE 系统 SHALL 限制每张优惠券的使用次数和每个买家的领取次数
8. WHEN 订单取消 THEN THE 系统 SHALL 退还已使用的优惠券

### 需求 18：会员等级系统（P2）

**用户故事：** 作为买家，我希望通过消费累积会员等级，以便享受更多权益和优惠。

#### 验收标准

1. WHEN 买家注册 THEN THE 系统 SHALL 自动设置买家为普通会员
2. WHEN 买家完成订单 THEN THE 系统 SHALL 根据订单金额累积会员积分
3. WHEN 买家积分达到阈值 THEN THE 系统 SHALL 自动升级会员等级
4. THE 系统 SHALL 支持至少三个会员等级（普通、银卡、金卡）
5. WHERE 买家为高级会员 THEN THE 系统 SHALL 提供额外折扣或专属优惠券
6. THE 系统 SHALL 在买家个人中心显示当前等级、积分和升级进度
7. WHEN 买家退款 THEN THE 系统 SHALL 扣减相应的会员积分

### 需求 19：推荐奖励系统（P2）

**用户故事：** 作为买家，我希望推荐朋友注册并获得奖励，以便享受更多优惠。

#### 验收标准

1. WHEN 买家访问推荐页面 THEN THE 系统 SHALL 生成买家的专属推荐链接和推荐码
2. WHEN 新用户通过推荐链接注册 THEN THE 系统 SHALL 记录推荐关系
3. WHEN 被推荐用户完成首单 THEN THE 系统 SHALL 向推荐人发放奖励（积分或优惠券）
4. THE 系统 SHALL 在买家个人中心显示推荐人数和获得的奖励
5. THE 系统 SHALL 限制每个买家的推荐奖励上限
6. WHEN 被推荐用户退款 THEN THE 系统 SHALL 撤销推荐奖励

### 需求 20：在线客服系统（P1）

**用户故事：** 作为买家，我希望在遇到问题时能够联系客服，以便快速解决疑问。

#### 验收标准

1. WHEN 买家点击客服按钮 THEN THE 系统 SHALL 打开实时聊天窗口
2. WHEN 买家发送消息 THEN THE 系统 SHALL 立即将消息推送给在线客服
3. WHEN 客服回复消息 THEN THE 系统 SHALL 实时显示在买家的聊天窗口
4. WHERE 无客服在线 THEN THE 系统 SHALL 显示离线消息提示并允许留言
5. THE 系统 SHALL 保存聊天历史记录至少90天
6. THE 系统 SHALL 支持发送文字、图片和文件
7. WHEN 客服接入 THEN THE 系统 SHALL 显示买家的订单历史和基本信息

### 需求 21：工单系统（P1）

**用户故事：** 作为买家，我希望提交售后工单，以便系统化地处理退换货等问题。

#### 验收标准

1. WHEN 买家创建工单 THEN THE 系统 SHALL 要求选择工单类型（退货、换货、投诉、咨询）
2. WHEN 买家提交工单 THEN THE 系统 SHALL 生成唯一的工单号并通知相关商家
3. WHEN 商家或客服回复工单 THEN THE 系统 SHALL 通知买家并更新工单状态
4. THE 系统 SHALL 支持工单状态流转（待处理、处理中、已解决、已关闭）
5. WHEN 工单超过48小时未处理 THEN THE 系统 SHALL 发送提醒给商家和管理员
6. THE 系统 SHALL 允许买家上传图片作为工单附件
7. WHEN 工单解决 THEN THE 系统 SHALL 请求买家对处理结果进行评价

### 需求 22：FAQ 管理系统（P2）

**用户故事：** 作为买家，我希望查看常见问题解答，以便快速找到答案而无需联系客服。

#### 验收标准

1. WHEN 管理员创建 FAQ THEN THE 系统 SHALL 允许输入问题、答案和分类
2. WHEN 买家访问帮助中心 THEN THE 系统 SHALL 按分类显示所有 FAQ
3. THE 系统 SHALL 提供 FAQ 搜索功能
4. WHEN 买家搜索关键词 THEN THE 系统 SHALL 返回相关的 FAQ 列表
5. THE 系统 SHALL 支持多语言版本的 FAQ
6. THE 系统 SHALL 记录每个 FAQ 的查看次数
7. WHEN 买家查看 FAQ THEN THE 系统 SHALL 提供"是否有帮助"的反馈按钮

### 需求 23：退换货流程（P0）

**用户故事：** 作为买家，我希望便捷地申请退换货，以便在商品有问题时得到妥善处理。

#### 验收标准

1. WHEN 买家申请退货 THEN THE 系统 SHALL 要求选择退货原因并上传凭证图片
2. WHEN 商家审核退货申请 THEN THE 系统 SHALL 允许商家同意或拒绝并说明理由
3. WHEN 退货申请通过 THEN THE 系统 SHALL 生成退货地址和退货单号
4. WHEN 买家寄回商品 THEN THE 系统 SHALL 允许买家填写物流信息
5. WHEN 商家确认收货 THEN THE 系统 SHALL 触发退款流程
6. THE 系统 SHALL 在订单完成后7天内允许申请退货
7. WHERE 商品为定制商品 THEN THE 系统 SHALL 不允许申请退货


### 需求 24：数据加密和安全（P0）

**用户故事：** 作为买家，我希望我的个人信息和支付数据得到安全保护，以便防止信息泄露。

#### 验收标准

1. THE 系统 SHALL 使用 AES-256 加密算法存储敏感用户数据
2. THE 系统 SHALL 使用 HTTPS 协议传输所有数据
3. WHEN 用户登录 THEN THE 系统 SHALL 使用 bcrypt 或 Argon2 算法哈希存储密码
4. THE 系统 SHALL 不以明文形式记录或显示完整的信用卡号码
5. WHEN 用户访问敏感页面 THEN THE 系统 SHALL 要求重新验证身份
6. THE 系统 SHALL 实施 CSRF 令牌保护所有状态变更操作
7. THE 系统 SHALL 设置安全的 HTTP 头部（如 CSP、X-Frame-Options）

### 需求 25：GDPR 合规（P0）

**用户故事：** 作为欧盟用户，我希望平台遵守 GDPR 规定，以便我能控制自己的个人数据。

#### 验收标准

1. WHEN 用户首次访问 THEN THE 系统 SHALL 显示 Cookie 同意横幅
2. WHEN 用户注册 THEN THE 系统 SHALL 明确告知数据收集目的和使用方式
3. WHEN 用户请求数据导出 THEN THE 系统 SHALL 在30天内提供所有个人数据的副本
4. WHEN 用户请求删除账户 THEN THE 系统 SHALL 删除所有个人数据（保留法律要求的交易记录）
5. THE 系统 SHALL 允许用户查看和修改个人信息
6. THE 系统 SHALL 记录所有数据访问和处理活动
7. WHERE 发生数据泄露 THEN THE 系统 SHALL 在72小时内通知受影响用户

### 需求 26：审计日志系统（P1）

**用户故事：** 作为管理员，我希望查看系统操作日志，以便追踪问题和确保合规。

#### 验收标准

1. WHEN 用户执行关键操作 THEN THE 系统 SHALL 记录操作时间、用户、操作类型和相关数据
2. THE 审计日志 SHALL 记录登录、订单创建、支付、退款、数据修改等操作
3. THE 系统 SHALL 保存审计日志至少1年
4. WHEN 管理员查询日志 THEN THE 系统 SHALL 支持按用户、时间、操作类型筛选
5. THE 系统 SHALL 防止审计日志被篡改或删除
6. THE 系统 SHALL 定期备份审计日志到独立存储
7. WHERE 检测到异常操作模式 THEN THE 系统 SHALL 发送警报给管理员

### 需求 27：税务计算系统（P1）

**用户故事：** 作为商家，我希望系统自动计算税费，以便符合各地区的税务规定。

#### 验收标准

1. WHEN 买家下单 THEN THE 系统 SHALL 根据收货地址计算适用的税率
2. THE 系统 SHALL 支持增值税（VAT）、销售税（Sales Tax）等多种税制
3. WHEN 订单金额计算 THEN THE 系统 SHALL 在订单明细中单独显示税费
4. THE 系统 SHALL 允许商家配置不同地区的税率
5. WHERE 商品为免税商品 THEN THE 系统 SHALL 不计算税费
6. THE 系统 SHALL 在财务报表中汇总税费数据
7. WHEN 税率变更 THEN THE 系统 SHALL 仅对新订单应用新税率

### 需求 28：高级搜索功能（P1）

**用户故事：** 作为买家，我希望使用多种条件筛选商品，以便快速找到符合需求的商品。

#### 验收标准

1. WHEN 买家搜索商品 THEN THE 系统 SHALL 支持按价格区间、分类、品牌、评分筛选
2. THE 系统 SHALL 支持多个筛选条件的组合使用
3. WHEN 买家应用筛选条件 THEN THE 系统 SHALL 实时更新搜索结果
4. THE 系统 SHALL 显示每个筛选条件下的商品数量
5. WHEN 搜索结果为空 THEN THE 系统 SHALL 建议放宽筛选条件或推荐相关商品
6. THE 系统 SHALL 支持按价格、销量、评分、上架时间排序
7. THE 系统 SHALL 在搜索结果页显示已选择的筛选条件并允许快速清除

### 需求 29：智能推荐系统（P2）

**用户故事：** 作为买家，我希望看到个性化的商品推荐，以便发现感兴趣的商品。

#### 验收标准

1. WHEN 买家浏览商品 THEN THE 系统 SHALL 在商品详情页显示"相关商品"推荐
2. WHEN 买家访问首页 THEN THE 系统 SHALL 根据浏览历史推荐商品
3. THE 系统 SHALL 基于协同过滤算法生成个性化推荐
4. WHEN 买家加入购物车 THEN THE 系统 SHALL 推荐"经常一起购买"的商品
5. WHERE 买家为新用户 THEN THE 系统 SHALL 推荐热门商品和新品
6. THE 系统 SHALL 定期更新推荐模型以提高准确性
7. THE 系统 SHALL 避免重复推荐买家已购买的商品

### 需求 30：搜索历史记录（P2）

**用户故事：** 作为买家，我希望查看我的搜索历史，以便快速重复之前的搜索。

#### 验收标准

1. WHEN 买家搜索商品 THEN THE 系统 SHALL 保存搜索关键词到买家的搜索历史
2. WHEN 买家点击搜索框 THEN THE 系统 SHALL 显示最近的搜索历史（最多10条）
3. THE 系统 SHALL 允许买家删除单条或全部搜索历史
4. THE 系统 SHALL 自动去重搜索历史中的重复关键词
5. WHERE 买家未登录 THEN THE 系统 SHALL 使用浏览器本地存储保存搜索历史
6. THE 系统 SHALL 保存搜索历史最长30天

### 需求 31：热门搜索统计（P2）

**用户故事：** 作为买家，我希望看到热门搜索词，以便了解当前流行的商品。

#### 验收标准

1. WHEN 买家访问搜索页面 THEN THE 系统 SHALL 显示当前热门搜索词（前10名）
2. THE 系统 SHALL 基于搜索频率统计热门搜索词
3. THE 系统 SHALL 每小时更新一次热门搜索词列表
4. WHEN 买家点击热门搜索词 THEN THE 系统 SHALL 执行对应的搜索
5. THE 系统 SHALL 过滤掉无结果的搜索词
6. THE 系统 SHALL 在管理后台显示搜索词统计报表

### 需求 32：销售报表生成（P1）

**用户故事：** 作为商家，我希望生成详细的销售报表，以便分析经营数据。

#### 验收标准

1. WHEN 商家请求销售报表 THEN THE 系统 SHALL 生成包含订单数、销售额、退款额的报表
2. THE 系统 SHALL 支持按日、周、月、年生成报表
3. THE 系统 SHALL 在报表中显示同比和环比增长率
4. THE 系统 SHALL 支持导出 PDF 和 Excel 格式的报表
5. THE 系统 SHALL 在报表中包含商品销售排行
6. THE 系统 SHALL 显示不同地区的销售分布
7. WHEN 生成报表 THEN THE 系统 SHALL 在5秒内完成数据计算

### 需求 33：用户行为分析（P2）

**用户故事：** 作为管理员，我希望分析用户行为数据，以便优化平台体验。

#### 验收标准

1. WHEN 用户访问页面 THEN THE 系统 SHALL 记录页面浏览事件
2. THE 系统 SHALL 记录用户的点击、搜索、加购、下单等关键行为
3. WHEN 管理员查看分析报告 THEN THE 系统 SHALL 显示用户活跃度、留存率、跳出率
4. THE 系统 SHALL 显示用户行为漏斗（浏览→加购→下单→支付）
5. THE 系统 SHALL 识别用户流失的关键节点
6. THE 系统 SHALL 支持按用户群体（新用户、老用户、会员等级）分析
7. THE 系统 SHALL 保护用户隐私，仅存储匿名化的行为数据

### 需求 34：商品分析报表（P1）

**用户故事：** 作为商家，我希望分析商品表现，以便优化商品策略。

#### 验收标准

1. WHEN 商家查看商品分析 THEN THE 系统 SHALL 显示每个商品的浏览量、加购率、转化率
2. THE 系统 SHALL 显示商品的库存周转率
3. THE 系统 SHALL 识别滞销商品并提供优化建议
4. THE 系统 SHALL 显示商品的平均评分和评价数量
5. THE 系统 SHALL 比较同类商品的表现
6. THE 系统 SHALL 显示商品的退货率和退货原因分布
7. WHEN 商品表现异常 THEN THE 系统 SHALL 发送提醒给商家

### 需求 35：转化率追踪（P2）

**用户故事：** 作为管理员，我希望追踪各环节的转化率，以便识别优化机会。

#### 验收标准

1. WHEN 管理员查看转化率报告 THEN THE 系统 SHALL 显示访问→注册→首单的转化率
2. THE 系统 SHALL 显示购物车→下单→支付的转化率
3. THE 系统 SHALL 按流量来源（搜索、直接、推荐）分析转化率
4. THE 系统 SHALL 显示不同设备（PC、移动）的转化率差异
5. THE 系统 SHALL 识别转化率异常下降并发送警报
6. THE 系统 SHALL 支持 A/B 测试功能以优化转化率
7. THE 系统 SHALL 显示转化率的历史趋势图

## 优先级说明

- **P0（高优先级）**: 核心功能，必须实现才能支持跨境电商基本运营
  - 加密货币支付集成、退款处理
  - 多语言支持、库存跟踪、SKU 管理
  - 物流商集成、运费计算、退换货流程
  - 商品管理、数据加密、GDPR 合规

- **P1（中优先级）**: 重要功能，显著提升平台竞争力和用户体验
  - 本地化内容、库存预警、多仓库管理
  - 物流跟踪、配送时效、销售分析
  - 财务报表、促销活动、优惠券系统
  - 在线客服、工单系统、审计日志
  - 税务计算、高级搜索、商品分析

- **P2（低优先级）**: 增值功能，进一步完善平台生态
  - 会员等级、推荐奖励、FAQ 管理
  - 智能推荐、搜索历史、热门搜索
  - 用户行为分析、转化率追踪

## 实施建议

建议按以下阶段实施：

**第一阶段（P0 功能）**：
1. 加密货币支付系统（需求 1-2）
2. 多语言支持（需求 3）
3. 库存和 SKU 管理（需求 5、8）
4. 物流和配送（需求 9-10）
5. 商品管理（需求 13）
6. 退换货流程（需求 23）
7. 安全和合规（需求 24-25）

**第二阶段（P1 功能）**：
1. 本地化和仓库管理（需求 4、6-7）
2. 物流增强（需求 11-12）
3. 商家工具（需求 14-16）
4. 营销功能（需求 17）
5. 客户服务（需求 20-21）
6. 审计和税务（需求 26-27）
7. 搜索和分析（需求 28、32、34）

**第三阶段（P2 功能）**：
1. 会员和推荐（需求 18-19）
2. FAQ 系统（需求 22）
3. 智能推荐和搜索增强（需求 29-31）
4. 高级分析（需求 33、35）

## 技术栈建议

基于现有的 React + TypeScript + Supabase 架构，建议：

**支付集成**: NOWPayments API（加密货币支付，支持 BTC、ETH、USDT、USDC 等）
- **多语言**: i18next、react-i18next
- **状态管理**: Zustand 或 Redux Toolkit
- **图表**: Recharts 或 Chart.js
- **实时通信**: Supabase Realtime（客服系统）
- **文件上传**: Supabase Storage
- **任务队列**: Supabase Edge Functions + 定时任务
- **加密货币价格**: NOWPayments 内置汇率 API
- **物流 API**: 各物流商官方 API

## 数据库扩展建议

需要新增以下数据表：

- `payments`（加密货币支付记录）
- `refunds`（退款记录）
- `product_translations`（商品多语言）
- `inventory`（库存记录）
- `warehouses`（仓库信息）
- `skus`（SKU 变体）
- `shipping_providers`（物流商）
- `shipping_rates`（运费规则）
- `promotions`（促销活动）
- `coupons`（优惠券）
- `coupon_usage`（优惠券使用记录）
- `membership_tiers`（会员等级）
- `member_points`（会员积分）
- `referrals`（推荐关系）
- `support_tickets`（工单）
- `chat_messages`（客服消息）
- `faqs`（常见问题）
- `return_requests`（退货申请）
- `audit_logs`（审计日志）
- `tax_rates`（税率配置）
- `search_history`（搜索历史）
- `analytics_events`（分析事件）

## 总结

本需求文档涵盖了跨境电商平台的35个核心功能需求，从加密货币支付、物流、库存到营销、客服、分析等各个方面。所有需求均遵循 EARS 模式编写，具有明确的验收标准，可直接用于后续的设计和开发工作。

**核心特色**：
- 专注于加密货币支付（BTC、ETH、USDT等），使用 NOWPayments 集成
- 完整的跨境电商功能（多语言、国际物流、库存管理）
- 强大的营销和分析工具
- 所有商品以 USD 定价，支付时实时转换为加密货币金额

建议优先实现 P0 级别的核心功能，确保平台能够支持基本的跨境交易流程，然后逐步完善 P1 和 P2 功能，提升平台的竞争力和用户体验。
