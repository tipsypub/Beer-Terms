import { createClient } from '@supabase/supabase-js';
import { TermsService } from '../beer-terms-dictionary/src/services/termsService.ts';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 缺少 Supabase URL 或匿名密钥。请检查你的 .env 文件。');
  process.exit(1);
}

// 创建一个用于测试的 Supabase 客户端实例
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'beer_terms',
  },
});

async function runTests() {
  console.log('🚀 开始运行新的集成测试...');
  let termId; // 用于在测试之间传递新创建的术语ID

  try {
    // 1. 测试 getApprovedTerms 函数
    console.log('\n🧪 [1/4] 测试 getApprovedTerms...');
    const initialTerms = await TermsService.getApprovedTerms();
    if (Array.isArray(initialTerms)) {
      console.log(`✅ getApprovedTerms 成功，获取到 ${initialTerms.length} 个术语。`);
    } else {
      throw new Error('getApprovedTerms 返回的不是一个数组。');
    }

    // 2. 测试 addTerm 函数
    console.log('\n🧪 [2/4] 测试 addTerm...');
    const newTermData = {
      english_term: `Test Term ${Date.now()}`,
      chinese_term: `测试术语 ${Date.now()}`,
      english_explanation: 'This is a test definition.',
      chinese_explanation: '这是一个用于测试的定义。',
      status: 'approved', // 直接设置为 approved 以便测试
    };
    const addedTerm = await TermsService.addTerm(newTermData);
    if (addedTerm && addedTerm.english_term === newTermData.english_term) {
      console.log(`✅ addTerm 成功，创建了新术语: ${addedTerm.english_term}`);
      termId = addedTerm.id; // 保存ID以供后续测试使用
    } else {
      throw new Error('addTerm 未能返回创建的术语。');
    }

    // 3. 测试 updateTerm 函数
    console.log('\n🧪 [3/4] 测试 updateTerm...');
    const updatedDefinition = 'This is an updated test definition.';
    const updatedTerm = await TermsService.updateTerm(termId, { english_explanation: updatedDefinition });
    if (updatedTerm && updatedTerm.english_explanation === updatedDefinition) {
      console.log(`✅ updateTerm 成功，术语已更新。`);
    } else {
      throw new Error('updateTerm 未能返回更新后的术语。');
    }

    // 4. 测试 deleteTerm (直接操作)
    console.log('\n🧪 [4/4] 测试 deleteTerm...');
    const { error: deleteError } = await supabase
      .from('terms')
      .delete()
      .eq('id', termId);

    if (deleteError) {
      throw new Error(`deleteTerm 失败: ${deleteError.message}`);
    }
    
    // 验证是否已删除
    const { data: deletedTerm } = await supabase
      .from('terms')
      .select('*')
      .eq('id', termId)
      .single();
      
    if (!deletedTerm) {
      console.log(`✅ deleteTerm 成功，术语已删除。`);
    } else {
      throw new Error('deleteTerm 后术语仍然存在于数据库中。');
    }

    console.log('\n🎉 所有测试通过！');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    // 如果测试中途失败，尝试清理创建的测试数据
    if (termId) {
      console.log(`\n🧹 正在清理测试数据 (ID: ${termId})...`);
      await supabase.from('terms').delete().eq('id', termId);
    }
    process.exit(1);
  }
}

runTests();
