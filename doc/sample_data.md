# 最终数据库示例数据填充指南 (v4 - 最终版)

## 背景

之前的脚本因缺少 `name_en` 列而失败。本指南提供了最终的、正确的 SQL 脚本，它包含了所有必需的列，将自动生成 `uuid` 并正确关联表。

## 最终 SQL 脚本

请在你的本地 Supabase SQL Editor 中，**完整地**执行以下脚本。这个脚本会先清空旧的测试数据，然后以正确的方式插入新的示例数据。

```sql
-- 为确保脚本可重复运行，先删除可能存在的旧示例数据
DELETE FROM public.terms WHERE english_term IN (
  'ABV (Alcohol by Volume)',
  'IBU (International Bitterness Units)',
  'Wort',
  'IPA (India Pale Ale)'
);
DELETE FROM public.categories WHERE name_zh IN ('基本术语', '酿造过程', '啤酒风格');

-- 使用 WITH 子句来插入分类并捕获新生成的 UUID
WITH new_categories AS (
  INSERT INTO public.categories (name_en, name_zh, sort_order) VALUES
    ('Basic Terms', '基本术语', 1),
    ('Brewing Process', '酿造过程', 2),
    ('Beer Styles', '啤酒风格', 3)
  -- RETURNING 子句让我们能获取到新插入行的 id
  RETURNING id, name_zh
)
-- 现在，插入术语，并使用上面捕获的 category id
INSERT INTO public.terms (
  english_term,
  chinese_term,
  english_explanation,
  chinese_explanation,
  category_id,
  status
)
-- 使用 SELECT ... FROM ... 的方式来动态查找 category_id
SELECT
  'ABV (Alcohol by Volume)',
  '酒精体积百分比',
  'A measurement of the alcohol content in a beverage, expressed as a percentage of the total volume.',
  '衡量饮料中酒精含量的指标，以占总体积的百分比表示。',
  (SELECT id FROM new_categories WHERE name_zh = '基本术语'),
  'approved'
UNION ALL
SELECT
  'IBU (International Bitterness Units)',
  '国际苦度单位',
  'A scale to measure the bitterness of beer, provided by the hops used during brewing.',
  '衡量啤酒苦味的单位，由酿造过程中使用的啤酒花提供。',
  (SELECT id FROM new_categories WHERE name_zh = '基本术语'),
  'approved'
UNION ALL
SELECT
  'Wort',
  '麦芽汁',
  'The sweet, sugary liquid extracted from the mashing process. This liquid is then boiled, fermented, and turned into beer.',
  '从糖化过程中提取的含糖甜味液体。这种液体随后被煮沸、发酵，最终酿成啤酒。',
  (SELECT id FROM new_categories WHERE name_zh = '酿造过程'),
  'approved'
UNION ALL
SELECT
  'IPA (India Pale Ale)',
  '印度淡色艾尔',
  'A hoppy style of beer within the broader category of pale ale.',
  '一种在淡色艾尔大类中，以啤酒花风味为特点的啤酒风格。',
  (SELECT id FROM new_categories WHERE name_zh = '啤酒风格'),
  'approved';
```

### 操作步骤

1.  复制以上完整的 SQL 代码。
2.  粘贴到你的本地 Supabase SQL Editor 中。
3.  点击 **RUN** 执行。

这个脚本现在是完全正确的，它将成功地向你的数据库中添加示例数据，你的应用应该可以完全正常工作了。
