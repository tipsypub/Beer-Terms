-- 检查categories相关问题（不修改现有数据）
-- 只验证数据完整性和权限

-- 1. 检查categories表结构
SELECT '=== Categories表结构 ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'categories'
ORDER BY ordinal_position;

-- 2. 检查categories表中的所有数据
SELECT '=== Categories所有数据 ===' as info;
SELECT id, name_en, name_zh, description, sort_order
FROM categories 
ORDER BY sort_order;

-- 3. 检查terms表中使用的category_id是否都有效
SELECT '=== Terms使用的category_id检查 ===' as info;
SELECT 
    t.category_id,
    c.name_zh as category_name,
    COUNT(*) as terms_count
FROM terms t
LEFT JOIN categories c ON t.category_id = c.id
GROUP BY t.category_id, c.name_zh
ORDER BY terms_count DESC;

-- 4. 验证所有category_id都有效（应该没有NULL）
SELECT '=== 无效category_id检查 ===' as info;
SELECT COUNT(*) as invalid_terms_count
FROM terms t
LEFT JOIN categories c ON t.category_id = c.id
WHERE c.id IS NULL;

-- 5. 获取第一个有效的category_id用于测试
SELECT '=== 测试用category_id ===' as info;
SELECT id as test_category_id, name_zh 
FROM categories 
ORDER BY sort_order 
LIMIT 1;