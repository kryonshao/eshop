# 多语言支持状态

## ✅ 已完成的翻译

### 支持的语言
1. **中文（简体）** - zh-CN ✅ 完整
2. **英文（美国）** - en-US ✅ 完整
3. **西班牙语** - es-ES
4. **法语** - fr-FR
5. **德语** - de-DE

### 已翻译的模块

#### 1. 通用模块 (common)
- 加载、错误、成功等状态提示
- 按钮文本（取消、确认、保存等）
- 操作文本（搜索、筛选、排序等）

#### 2. 导航模块 (nav)
- 主导航菜单
- 商品分类导航
- 用户相关导航
- 帮助页面导航

#### 3. 支付模块 (payment)
- 加密货币支付
- 支付状态
- 支付说明
- NOWPayments 集成

#### 4. 商品模块 (product)
- 商品信息展示
- 商品分类
- 商品操作
- 商品列表

#### 5. 购物车模块 (cart)
- 购物车操作
- 结账流程
- 价格计算

#### 6. 订单模块 (order)
- 订单信息
- 订单状态
- 订单操作

#### 7. 用户模块 (user)
- 个人资料
- 偏好设置
- 账户信息

#### 8. 尺码指南 (sizeGuide)
- 尺码表
- 测量说明
- 选购建议

#### 9. 配送信息 (shipping)
- 配送方式
- 配送地区
- 配送流程
- 运费说明
- 物流追踪

#### 10. 退换政策 (returns)
- 退换条件
- 退换流程
- 运费说明
- 注意事项

#### 11. 常见问题 (faq)
- 订单相关
- 配送相关
- 支付相关
- 退换货相关
- 商品相关

#### 12. 首页 (home)
- 英雄区文案
- 特色功能
- 订阅表单

#### 13. 页脚 (footer)
- 品牌描述
- 导航链接
- 订阅表单
- 版权信息

---

## 📝 翻译覆盖率

| 语言 | 覆盖率 | 状态 |
|------|--------|------|
| 中文（简体）| 100% | ✅ 完整 |
| 英文（美国）| 100% | ✅ 完整 |
| 西班牙语 | ~80% | ⚠️ 部分缺失 |
| 法语 | ~80% | ⚠️ 部分缺失 |
| 德语 | ~80% | ⚠️ 部分缺失 |

---

## 🔍 需要补充的翻译

### 西班牙语、法语、德语缺失的部分

以下模块在西班牙语、法语、德语中可能缺失或不完整：

1. **尺码指南详细说明**
   - 测量方法描述
   - 选购建议

2. **配送信息详细说明**
   - 配送流程步骤
   - 物流追踪方法

3. **退换政策详细说明**
   - 退换流程步骤
   - 注意事项

4. **常见问题详细内容**
   - 20个问答对
   - 联系方式说明

5. **首页营销文案**
   - 英雄区描述
   - 特色功能描述
   - 订阅表单文案

---

## 🚀 如何使用多语言

### 在组件中使用

```tsx
import { useTranslation } from "react-i18next";

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t("product.title")}</h1>
      <p>{t("product.description")}</p>
    </div>
  );
}
```

### 切换语言

```tsx
import { useTranslation } from "react-i18next";

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };
  
  return (
    <select onChange={(e) => changeLanguage(e.target.value)}>
      <option value="zh-CN">中文</option>
      <option value="en-US">English</option>
      <option value="es-ES">Español</option>
      <option value="fr-FR">Français</option>
      <option value="de-DE">Deutsch</option>
    </select>
  );
}
```

---

## 📂 翻译文件位置

```
src/i18n/locales/
├── zh-CN.json  ✅ 完整
├── en-US.json  ✅ 完整
├── es-ES.json  ⚠️ 需要补充
├── fr-FR.json  ⚠️ 需要补充
└── de-DE.json  ⚠️ 需要补充
```

---

## 🎯 翻译原则

1. **保持一致性**
   - 同一术语在整个应用中使用相同的翻译
   - 例如："商品" 统一翻译为 "Product"

2. **符合本地习惯**
   - 使用目标语言的自然表达
   - 考虑文化差异

3. **简洁明了**
   - 避免冗长的翻译
   - 保持界面简洁

4. **专业术语**
   - 电商术语使用行业标准翻译
   - 技术术语保持准确性

---

## 🔧 如何添加新翻译

### 1. 添加新的翻译键

在 `zh-CN.json` 中添加：
```json
{
  "newModule": {
    "newKey": "新文本"
  }
}
```

在 `en-US.json` 中添加：
```json
{
  "newModule": {
    "newKey": "New Text"
  }
}
```

### 2. 在组件中使用

```tsx
const { t } = useTranslation();
<div>{t("newModule.newKey")}</div>
```

### 3. 更新其他语言文件

确保在所有语言文件中添加相同的键。

---

## ✅ 当前状态总结

### 优点
- ✅ 中文和英文翻译完整
- ✅ 覆盖所有主要功能模块
- ✅ 翻译结构清晰，易于维护
- ✅ 支持5种语言

### 待改进
- ⚠️ 西班牙语、法语、德语需要补充详细翻译
- ⚠️ 部分新功能的翻译可能需要更新
- ⚠️ 商家后台的翻译可以进一步完善

---

## 📞 需要帮助？

如需添加新语言或补充翻译，请：
1. 复制 `en-US.json` 作为模板
2. 翻译所有文本
3. 保存为新的语言文件（如 `ja-JP.json`）
4. 在 `src/i18n/config.ts` 中注册新语言
