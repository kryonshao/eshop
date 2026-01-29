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

async function runSQL() {
  try {
    // 直接尝试查询 orders 表的列信息
    console.log('检查 orders 表结构...');
    const { data, error } = await supabase.rpc('pg_typeof', {
      relname: 'orders',
      attname: 'guest_id'
    });
    
    if (error) {
      console.log('guest_id 字段不存在，尝试查询所有列：', error);
      
      // 尝试查询所有列
      try {
        const { data: columns, error: columnError } = await supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_name', 'orders');
          
        if (columnError) {
          console.log('无法查询列信息:', columnError);
        } else {
          console.log('表 orders 存在，现有列:', columns.map(col => col.column_name));
        }
      } catch (e) {
        console.log('查询列信息失败:', e);
      }
    } else {
      console.log('guest_id 字段已存在');
    }
    
    // 尝试直接使用 Postgres 驱动连接（需要额外配置）
    // 这需要数据库连接字符串，可能包含密码
    console.log('');
    console.log('注意：需要使用 SQL 客户端（如 psql、DBeaver 或 Supabase Dashboard）来直接运行以下 SQL：');
    console.log('');
    console.log('-- 添加 guest_id 字段');
    console.log('ALTER TABLE orders ADD COLUMN guest_id TEXT;');
    console.log('');
    console.log('-- 创建索引');
    console.log('CREATE INDEX IF NOT EXISTS idx_orders_guest_id ON orders(guest_id);');
    console.log('');
    console.log('您可以通过以下方式运行：');
    console.log('1. 登录 Supabase Dashboard');
    console.log('2. 进入 SQL Editor');
    console.log('3. 粘贴并运行上述 SQL');
  } catch (error) {
    console.error('执行过程中出错:', error);
  }
}

runSQL();