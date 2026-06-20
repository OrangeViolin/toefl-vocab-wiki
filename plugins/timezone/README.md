# timezone — 时区插件

在设置页面提供时区选择器，所有时间按本地时区显示。

## 功能

- **时区选择**：设置页面下拉框，可选 IANA 常用时区
- **自动检测**：默认使用浏览器自动检测的本地时区
- **BIRTH 集成**：可从 `local/config.md` 读取 `TIMEZONE` 配置作为默认值
- **格式化工具**：导出 `core.timezone.format()` 供其他插件调用

## 对其他插件的改造

| 插件 | 改动 |
|------|------|
| recent | 时间列使用 `core.timezone.format(timestamp)` |
| diff | 版本时间使用 `core.timezone.format(iso)` |
| semantic-history | 时间戳使用 `core.timezone.format(timestamp)` |

## 开发

```js
// 格式化时间戳
core.timezone.format(1716800000, { format: 'full' });
// → "2026-05-27 14:30:00"

// 仅显示日期
core.timezone.format(1716800000, { format: 'date' });
// → "2026-05-27"

// 相对时间
core.timezone.format(1716800000, { format: 'relative' });
// → "3 小时前"
```
