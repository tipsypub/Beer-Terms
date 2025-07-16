import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log('🔍 开始基础Supabase连接测试...\n');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey.substring(0, 20) + '...');

// 创建客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testBasicConnection() {
  console.log('\n📡 测试基础连接...');
  
  try {
    // 测试1: 检查数据库是否可访问
    console.log('1. 测试数据库连接...');
    const { data, error } = await supabase
      .from('pg_tables')
      .select('tablename')
      .limit(1);
    
    if (error) {
      console.log('   尝试pg_tables失败:', error.message);
      
      // 测试2: 尝试查询系统表
      console.log('2. 尝试查询系统信息...');
      const { data: versionData, error: versionError } = await supabase
        .rpc('version');
      
      if (versionError) {
        console.log('   尝试version()失败:', versionError.message);
        
        // 测试3: 尝试获取用户会话
        console.log('3. 尝试获取用户会话...');
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.log('   获取用户失败:', userError.message);
        } else {
          console.log('   ✅ 用户认证正常:', userData);
        }
        
        // 测试4: 尝试列出所有表
        console.log('4. 尝试列出所有表...');
        const { data: tables, error: tablesError } = await supabase
          .from('information_schema.tables')
          .select('table_name, table_schema')
          .limit(10);
        
        if (tablesError) {
          console.log('   列出表失败:', tablesError.message);
        } else {
          console.log('   ✅ 找到表:', tables);
        }
        
      } else {
        console.log('   ✅ 数据库版本:', versionData);
      }
    } else {
      console.log('   ✅ 数据库连接成功, 找到表:', data);
    }
    
    return true;
  } catch (error) {
    console.error('❌ 连接错误:', error.message);
    return false;
  }
}

async function testSchemaAccess() {
  console.log('\n🏗️  测试Schema访问...');
  
  try {
    // 检查beer-terms schema是否存在
    const { data, error } = await supabase
      .from('information_schema.schemata')
      .select('schema_name')
      .eq('schema_name', 'beer-terms');
    
    if (error) {
      console.log('❌ 查询schema失败:', error.message);
      
      // 尝试查询所有schema
      const { data: allSchemas, error: schemaError } = await supabase
        .from('information_schema.schemata')
        .select('schema_name')
        .limit(20);
      
      if (schemaError) {
        console.log('❌ 无法获取schema列表:', schemaError.message);
      } else {
        console.log('📋 可用schemas:', allSchemas.map(s => s.schema_name));
      }
      
      return false;
    }
    
    if (data && data.length > 0) {
      console.log('✅ beer-terms schema已存在');
    } else {
      console.log('ℹ️  beer-terms schema不存在，需要创建');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Schema测试错误:', error.message);
    return false;
  }
}

async function runBasicTests() {
  console.log('🚀 开始基础连接测试...\n');
  
  await testBasicConnection();
  await testSchemaAccess();
  
  console.log('\n✅ 基础测试完成');
}

runBasicTests()
  .then(() => {
    console.log('测试完成');
  })
  .catch(error => {
    console.error('测试运行失败:', error);
  });
