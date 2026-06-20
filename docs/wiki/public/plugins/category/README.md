# category — 分类页与全部页面列表插件

渲染 `#?type=<type>`、`#?tag=<tag>` 分类页和 `Special:AllPages` 简单列表（browse 插件未启用时的降级回退）。

## 功能

在 `core` 上挂载：

| 方法 | 说明 |
|------|------|
| `core.renderCategory(core, kind, value)` | 渲染类型/标签分类页 |
| `core.renderAllPagesList(core)` | 渲染 Special:AllPages 简单 A-Z 列表 |

- 页面列表按拼音首字母分组，首字母映射由 `PINYIN_INITIAL` 提供

## 脚本依赖

无。

## 数据依赖

无。数据来自 `core.registry`（内存）。

## local config 必须项

文件：`local/config/category.js`

| 导出名 | 类型 | 必须 | 说明 |
|--------|------|------|------|
| `PINYIN_INITIAL` | `object` | 是 | 拼音声母 → 常见汉字映射，用于首字母分组 |

`PINYIN_INITIAL` 结构：

```js
export const PINYIN_INITIAL = {
  A: '阿艾埃安奥',
  B: '巴贝伯比博布柏',
  C: '查程陈创',
  // …覆盖本 wiki 词条首字所需的全部声母
};
```

未覆盖首字的词条归入「其他」组。
