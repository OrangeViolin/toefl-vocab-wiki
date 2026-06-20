# geomap — 地理概览地图插件

渲染 `:::geomap` 块：多地点图钉地图，适合分布等地理概览（无路线连线）。

## 语法

```
::: geomap
title: 各大学AI实验室分布
places: 麻省理工:MIT, 斯坦福:Stanford, 卡内基梅隆:CMU
:::
```

`places` 格式：`地名:标签, 地名:标签, ...`；无标签时直接写地名。

## 脚本依赖

无。

## 数据依赖

| 文件 | 说明 | 缺失时影响 |
|------|------|------------|
| `data/place_coords.json` | 地名 → `[lon, lat]` 坐标映射 | 所有地点显示在图例中但不在地图上绘制 |

`place_coords.json` 结构：

```json
{ "麻省理工": [-71.09, 42.36], "斯坦福": [-122.17, 37.43], ... }
```

**外部 CDN 依赖（运行时）：**

| 库 | URL |
|----|-----|
| Leaflet CSS | `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css` |
| Leaflet JS | `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js` |

## local config 必须项

文件：`local/config/geomap.js`（可选）

| 导出名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `COORDS_URL` | `string` | `'data/place_coords.json'` | 坐标文件的相对 URL |

示例：

```js
// local/config/geomap.js（可省略）
export const COORDS_URL = 'data/place_coords.json';
```
