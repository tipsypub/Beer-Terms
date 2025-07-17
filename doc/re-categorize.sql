-- =================================================================
-- 步骤 1: 清空并用新的20个分类重建 'categories' 表
-- =================================================================

-- 首先，清空现有所有分类
DELETE FROM public.categories;

-- 然后，插入新的20个分类（使用UUID格式）
INSERT INTO public.categories (id, name_en, name_zh, sort_order) VALUES
(gen_random_uuid(), 'History and Culture', '历史与文化', 1),
(gen_random_uuid(), 'Raw Materials', '原材料', 2),
(gen_random_uuid(), 'Brewing Equipment', '酿造设备', 3),
(gen_random_uuid(), 'Biochemistry', '生物化学', 4),
(gen_random_uuid(), 'Brewing Technology', '酿造技术', 5),
(gen_random_uuid(), 'Beer Styles', '啤酒风格', 6),
(gen_random_uuid(), 'Competition and Tasting', '比赛与品鉴', 7),
(gen_random_uuid(), 'Festivals and Exhibitions', '啤酒节与展览', 8),
(gen_random_uuid(), 'Beer Events', '啤酒活动', 9),
(gen_random_uuid(), 'Marketing and Communication', '市场与传播', 10),
(gen_random_uuid(), 'Brewery Brands', '啤酒厂牌', 11),
(gen_random_uuid(), 'Packaging and Transportation', '包装与运输', 12),
(gen_random_uuid(), 'Serving', '侍酒', 13),
(gen_random_uuid(), 'Food Pairing', '配餐', 14),
(gen_random_uuid(), 'On-Premise', '门店相关', 15),
(gen_random_uuid(), 'Beer People', '啤酒人物', 16),
(gen_random_uuid(), 'Beer Books', '啤酒书籍', 17),
(gen_random_uuid(), 'Beer Websites', '啤酒网站', 18),
(gen_random_uuid(), 'Beer Apps', '啤酒程序', 19),
(gen_random_uuid(), 'Other', '其他', 20);

-- 如果需要使用固定ID，可以创建一个新的分类表或使用字符串ID字段
-- 这里我们使用UUID作为主键，这是更标准的做法

-- =================================================================
-- 步骤 2: 将所有现有术语迁移到第一个分类
-- =================================================================

-- 获取第一个分类的ID
WITH first_category AS (
  SELECT id FROM public.categories 
  WHERE name_en = 'History and Culture' 
  LIMIT 1
)
UPDATE public.terms
SET category_id = (SELECT id FROM first_category)
WHERE category_id IS NULL;
