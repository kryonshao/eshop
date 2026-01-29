import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  try {
    console.log('连接到 Supabase...');
    console.log('项目 URL:', supabaseUrl);

    // 测试查询表是否存在
    console.log('');
    console.log('测试查询表是否存在:');
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tableError) {
      console.error('无法查询表信息:', tableError);
    } else {
      console.log('可用的公共表:', tables.map(t => t.table_name));
    }

    // 测试查询 orders 表的结构
    console.log('');
    console.log('测试查询 orders 表的结构:');
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .limit(5);

      if (ordersError) {
        console.error('无法查询 orders 表:', ordersError);
      } else {
        console.log('orders 表记录数量:', ordersData.length);
        if (ordersData.length > 0) {
          console.log('orders 表字段:', Object.keys(ordersData[0]));
        }
      }
    } catch (e) {
      console.error('查询 orders 表时出错:', e);
    }

    // 测试查询 products 表
    console.log('');
    console.log('测试查询 products 表:');
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .limit(5);

      if (productsError) {
        console.error('无法查询 products 表:', productsError);
      } else {
        console.log('products 表记录数量:', productsData.length);
        if (productsData.length > 0) {
          console.log('示例产品:', productsData[0].name);
        }
      }
    } catch (e) {
      console.error('查询 products 表时出错:', e);
    }

    console.log('');
    console.log('✅ 连接成功！');
  } catch (error) {
    console.error('❌ 连接失败:', error);
  }
}

testSupabase();