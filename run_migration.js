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
    // 首先尝试创建一个存储过程来执行 SQL（如果不存在）
    // 注意：这可能需要 SUPERUSER 权限
    const createFunction = `
      CREATE OR REPLACE FUNCTION public.execute_sql(sql TEXT)
      RETURNS TEXT AS $$
      DECLARE
        result TEXT;
      BEGIN
        EXECUTE sql;
        RETURN 'Success';
      EXCEPTION
        WHEN OTHERS THEN
          RETURN SQLERRM;
      END;
      $$ LANGUAGE plpgsql VOLATILE
      SECURITY DEFINER;
    `;

    // 尝试创建函数
    try {
      const { error } = await supabase.rpc('execute_sql', { sql: createFunction });
      if (error) {
        console.log('函数可能已存在:', error.message);
      } else {
        console.log('函数创建成功');
      }
    } catch (error) {
      console.log('尝试直接执行 SQL');
    }

    // 尝试直接通过 API 执行 SQL（使用自定义方法）
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        sql: 'ALTER TABLE orders ADD COLUMN guest_id TEXT;'
      })
    });

    if (response.ok) {
      console.log('字段添加成功');
    } else {
      const text = await response.text();
      console.log('字段添加失败:', text);
    }

    // 创建索引
    const indexResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        sql: 'CREATE INDEX IF NOT EXISTS idx_orders_guest_id ON orders(guest_id);'
      })
    });

    if (indexResponse.ok) {
      console.log('索引创建成功');
    } else {
      const text = await indexResponse.text();
      console.log('索引创建失败:', text);
    }
  } catch (error) {
    console.error('执行过程中出错:', error);
  }
}

runSQL();