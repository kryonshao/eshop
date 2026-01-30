import { Product } from "@/types/product";

export interface Review {
  id: string;
  userName: string;
  rating: number;
  date: string;
  comment: string;
  size: string;
  helpful: number;
}

export const productReviews: Record<string, Review[]> = {
  "1": [
    { id: "r1", userName: "小李", rating: 5, date: "2024-01-15", comment: "面料很舒适，版型也很好，非常满意这次购物体验！", size: "M", helpful: 12 },
    { id: "r2", userName: "Anna W.", rating: 4, date: "2024-01-10", comment: "质量不错，就是尺码偏大一点，建议选小一号", size: "L", helpful: 8 },
    { id: "r3", userName: "张先生", rating: 5, date: "2024-01-05", comment: "已经是第三次回购了，品质稳定，推荐！", size: "XL", helpful: 15 },
  ],
  "2": [
    { id: "r4", userName: "Mia Chen", rating: 5, date: "2024-01-12", comment: "保暖效果很好，穿着很舒服", size: "M", helpful: 6 },
    { id: "r5", userName: "王小姐", rating: 4, date: "2024-01-08", comment: "颜色和图片一致，好评", size: "S", helpful: 4 },
  ],
  "3": [
    { id: "r6", userName: "Lisa", rating: 5, date: "2024-01-14", comment: "版型超赞，显瘦效果很好！", size: "26", helpful: 20 },
    { id: "r7", userName: "小红", rating: 5, date: "2024-01-11", comment: "弹性好，穿着舒适，强烈推荐", size: "27", helpful: 11 },
  ],
};

export const products: Product[] = [
  {
    id: "1",
    name: "经典白色T恤",
    nameEn: "Classic White Tee",
    price: 29.99,
    originalPrice: 39.99,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
      "https://images.unsplash.com/photo-1622445275576-721325763afe?w=800&q=80",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80",
      "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&q=80",
    ],
    category: "T恤",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["白色", "黑色", "灰色"],
    description: "100%优质棉，舒适透气，经典百搭款",
    fullDescription: "采用100%精梳棉面料，经过预缩处理，不易变形。经典圆领设计，简约大方，适合日常穿着。面料柔软亲肤，透气性好，四季皆宜。",
    material: "100% 精梳棉",
    careInstructions: ["30°C以下水洗", "不可漂白", "低温熨烫", "悬挂晾干"],
    isNew: true,
  },
  {
    id: "2",
    name: "宽松休闲卫衣",
    nameEn: "Oversized Hoodie",
    price: 59.99,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80",
      "https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=800&q=80",
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80",
    ],
    category: "卫衣",
    sizes: ["S", "M", "L", "XL"],
    colors: ["黑色", "米色", "深灰"],
    description: "加绒保暖，宽松版型，时尚百搭",
    fullDescription: "内里加绒设计，保暖不厚重。宽松oversize版型，舒适自在。连帽设计搭配抽绳，休闲感十足。袖口和下摆采用罗纹收口，保暖效果更佳。",
    material: "65% 棉 / 35% 聚酯纤维",
    careInstructions: ["40°C以下水洗", "不可漂白", "中温熨烫", "可机洗"],
  },
  {
    id: "3",
    name: "高腰牛仔裤",
    nameEn: "High Waist Jeans",
    price: 79.99,
    originalPrice: 99.99,
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80",
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80",
      "https://images.unsplash.com/photo-1475178626620-a4d074967452?w=800&q=80",
    ],
    category: "裤装",
    sizes: ["24", "25", "26", "27", "28", "29", "30"],
    colors: ["深蓝", "浅蓝", "黑色"],
    description: "弹力面料，修身显瘦，经典直筒版型",
    fullDescription: "采用高弹力牛仔面料，舒适不紧绷。高腰设计拉长腿部线条，直筒版型经典百搭。精致金属纽扣和拉链，细节考究。",
    material: "98% 棉 / 2% 氨纶",
    careInstructions: ["冷水手洗", "不可漂白", "反面熨烫", "悬挂晾干"],
    isSale: true,
  },
  {
    id: "4",
    name: "针织开衫",
    nameEn: "Knit Cardigan",
    price: 69.99,
    image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80",
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80",
    ],
    category: "外套",
    sizes: ["S", "M", "L"],
    colors: ["奶白", "驼色", "墨绿"],
    description: "柔软针织面料，温柔气质，春秋必备",
    fullDescription: "精选优质羊毛混纺纱线，手感柔软细腻。V领设计修饰脸型，纽扣开衫方便穿脱。宽松版型不挑身材，春秋季节必备单品。",
    material: "50% 羊毛 / 50% 腈纶",
    careInstructions: ["手洗", "不可漂白", "平铺晾干", "低温熨烫"],
    isNew: true,
  },
  {
    id: "5",
    name: "简约连衣裙",
    nameEn: "Minimalist Dress",
    price: 89.99,
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80",
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80",
    ],
    category: "裙装",
    sizes: ["XS", "S", "M", "L"],
    colors: ["黑色", "卡其", "酒红"],
    description: "优雅剪裁，垂感面料，职场休闲两相宜",
    fullDescription: "采用高品质垂坠面料，穿着舒适不易皱。简约线条设计，彰显优雅气质。适合职场、约会等多种场合穿着。",
    material: "95% 聚酯纤维 / 5% 氨纶",
    careInstructions: ["冷水手洗", "不可漂白", "低温熨烫", "悬挂晾干"],
  },
  {
    id: "6",
    name: "条纹衬衫",
    nameEn: "Striped Shirt",
    price: 49.99,
    originalPrice: 69.99,
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80",
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&q=80",
    ],
    category: "衬衫",
    sizes: ["S", "M", "L", "XL"],
    colors: ["蓝白条", "黑白条"],
    description: "经典条纹设计，通勤百搭，舒适透气",
    fullDescription: "经典条纹设计，简约大方。优质棉质面料，透气舒适。精致领口和袖口设计，适合正式和休闲场合。",
    material: "100% 棉",
    careInstructions: ["40°C以下水洗", "可漂白", "中温熨烫", "可机洗"],
    isSale: true,
  },
  {
    id: "7",
    name: "羊毛混纺大衣",
    nameEn: "Wool Blend Coat",
    price: 199.99,
    image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=80",
      "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=800&q=80",
    ],
    category: "外套",
    sizes: ["S", "M", "L"],
    colors: ["驼色", "黑色", "灰色"],
    description: "羊毛混纺，保暖有型，经典长款设计",
    fullDescription: "精选优质羊毛混纺面料，保暖性能出色。经典翻领设计，显瘦显高。双排扣设计，时尚大气。内里光滑，穿脱方便。",
    material: "60% 羊毛 / 40% 聚酯纤维",
    careInstructions: ["干洗", "不可漂白", "低温熨烫", "悬挂保存"],
  },
  {
    id: "8",
    name: "休闲阔腿裤",
    nameEn: "Wide Leg Pants",
    price: 59.99,
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80",
    ],
    category: "裤装",
    sizes: ["S", "M", "L", "XL"],
    colors: ["黑色", "米白", "卡其"],
    description: "垂感面料，舒适阔腿版型，显瘦遮肉",
    fullDescription: "采用高垂坠感面料，穿着飘逸有型。高腰阔腿版型，遮肉显瘦。松紧腰设计，舒适自在。适合多种场合穿着。",
    material: "70% 聚酯纤维 / 30% 粘胶",
    careInstructions: ["冷水手洗", "不可漂白", "低温熨烫", "悬挂晾干"],
    isNew: true,
  },
];

export const categories = [
  { id: "all", name: "全部", nameEn: "All" },
  { id: "T恤", name: "T恤", nameEn: "T-Shirts" },
  { id: "卫衣", name: "卫衣", nameEn: "Hoodies" },
  { id: "裤装", name: "裤装", nameEn: "Pants" },
  { id: "外套", name: "外套", nameEn: "Outerwear" },
  { id: "裙装", name: "裙装", nameEn: "Dresses" },
  { id: "衬衫", name: "衬衫", nameEn: "Shirts" },
];

export const sizeGuide = {
  tops: {
    headers: ["尺码", "胸围(cm)", "肩宽(cm)", "衣长(cm)"],
    rows: [
      ["XS", "84-88", "38", "62"],
      ["S", "88-92", "40", "64"],
      ["M", "92-96", "42", "66"],
      ["L", "96-100", "44", "68"],
      ["XL", "100-104", "46", "70"],
    ],
  },
  bottoms: {
    headers: ["尺码", "腰围(cm)", "臀围(cm)", "裤长(cm)"],
    rows: [
      ["24/XS", "60-64", "84-88", "100"],
      ["25/S", "64-68", "88-92", "101"],
      ["26/S", "68-72", "92-96", "102"],
      ["27/M", "72-76", "96-100", "103"],
      ["28/M", "76-80", "100-104", "104"],
      ["29/L", "80-84", "104-108", "105"],
      ["30/L", "84-88", "108-112", "106"],
    ],
  },
};