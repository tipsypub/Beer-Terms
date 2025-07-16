import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import https from 'https';
import http from 'http';

// 加载环境变量
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log('🔍 开始API连接测试...\n');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey.substring(0, 20) + '...');

// 测试网络连接
async function testNetworkConnection() {
  console.log('\n🌐 测试网络连接...');
  
  return new Promise((resolve) => {
    const url = new URL(supabaseUrl);
    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request({
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: '/',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      console.log(`✅ 网络连接成功: ${res.statusCode}`);
      resolve(true);
    });
    
    req.on('error', (error) => {
      console.error('❌ 网络连接失败:', error.message);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.error('❌ 网络连接超时');
      resolve(false);
    });
    
    req.end();
  });
}

// 测试Supabase REST API
async function testSupabaseAPI() {
  console.log('\n📡 测试Supabase REST API...');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // 测试1: 尝试获取auth信息
    console.log('1. 测试认证...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('   认证测试失败:', authError.message);
    } else {
      console.log('   ✅ 认证正常:', authData ? '有会话' : '无会话');
    }
    
    // 测试2: 尝试查询系统表
    console.log('2. 测试查询系统表...');
    try {
      const { data, error } = await supabase
        .from('pg_stat_activity')
        .select('count(*)')
        .limit(1);
      
      if (error) {
        console.log('   查询pg_stat_activity失败:', error.message);
      } else {
        console.log('   ✅ 查询成功:', data);
      }
    } catch (e) {
      console.log('   查询异常:', e.message);
    }
    
    // 测试3: 尝试REST API端点
    console.log('3. 测试REST API端点...');
    const restUrl = `${supabaseUrl}/rest/v1/`;
    
    try {
      const response = await fetch(restUrl, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      });
      
      console.log('   REST API响应:', response.status, response.statusText);
      
      if (response.ok) {
        console.log('   ✅ REST API可访问');
      } else {
        const text = await response.text();
        console.log('   REST API响应内容:', text.substring(0, 200));
      }
    } catch (e) {
      console.log('   REST API访问失败:', e.message);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Supabase API测试失败:', error.message);
    return false;
  }
}

// 测试数据库访问
async function testDatabaseAccess() {
  console.log('\n🗄️  测试数据库访问...');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // 尝试不同的查询方式
    const queries = [
      { name: '查询所有表', query: () => supabase.from('pg_tables').select('*').limit(5) },
      { name: '查询schema', query: () => supabase.from('pg_namespace').select('*').limit(5) },
      { name: '查询用户信息', query: () => supabase.from('auth.users').select('count').limit(1) },
      { name: '查询存储对象', query: () => supabase.from('storage.objects').select('count').limit(1) }
    ];
    
    for (const { name, query } of queries) {
      try {
        const { data, error } = await query();
        
        if (error) {
          console.log(`   ${name}: ❌ ${error.message}`);
        } else {
          console.log(`   ${name}: ✅ 成功 (${data ? data.length : 0} 条记录)`);
        }
      } catch (e) {
        console.log(`   ${name}: ⚠️ 异常 - ${e.message}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ 数据库访问测试失败:', error.message);
    return false;
  }
}

// 测试创建schema和表
async function testSchemaCreation() {
  console.log('\n🏗️  测试Schema和表创建...');
  
  try {
    const supabaseAdmin = createClient(
      supabaseUrl, 
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // 尝试创建schema
    console.log('1. 尝试创建beer-terms schema...');
    
    // 由于无法直接执行SQL，我们尝试使用Supabase的SQL编辑器功能
    // 这里我们尝试创建一个简单的表来测试
    
    const { data, error } = await supabaseAdmin
      .from('beer_terms')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('   查询beer_terms表失败:', error.message);
      
      // 尝试创建表
      console.log('   尝试创建beer_terms表...');
      
      // 由于Supabase JS客户端不能直接执行DDL，我们需要使用SQL
      console.log('   ⚠️  需要使用Supabase Dashboard或SQL编辑器创建表');
      
    } else {
      console.log('   ✅ beer_terms表已存在');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Schema创建测试失败:', error.message);
    return false;
  }
}

async function runAllAPITests() {
  console.log('🚀 开始完整的API连接测试...\n');
  
  await testNetworkConnection();
  await testSupabaseAPI();
  await testDatabaseAccess();
  await testSchemaCreation();
  
  console.log('\n✅ API测试完成');
  console.log('\n📋 下一步建议:');
  console.log('1. 访问Supabase Dashboard: http://156.245.201.244:8000');
  console.log('2. 使用SQL编辑器创建beer-terms schema');
  console.log('3. 创建必要的表结构');
  console.log('4. 配置RLS (Row Level Security) 策略');
}

runAllAPITests()
  .then(() => {
    console.log('测试完成');
  })
  .catch(error => {
    console.error('测试运行失败:', error);
  });
