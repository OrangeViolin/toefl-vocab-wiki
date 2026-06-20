# route-map — 路线地图插件

渲染 `:::route` 块：将地点序列渲染为带箭头的 Leaflet 路线地图。

## 语法

使用 YAML 格式定义路线：

```
::: route
title: 征战路线
places: 地点A → 地点B → 地点C
:::
```

### 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `title` | 否 | 路线标题，显示在地图上方 |
| `places` | **是** | 地点序列，用 `→` 分隔。每个地点名必须在 `place_coords.json` 中有对应坐标条目，否则该地点在图例中显示为「无坐标」 |
| `height` | 否 | 地图高度（默认 260px），可设 `square` 使长宽比 1:1 |
| `width` | 否 | 地图宽度（默认 100%） |

> **注意**：正文自由文本不会被解析。`places` 字段必须通过 YAML 键显式声明。`::: route title=X\n正文\n:::` 的内联格式不会生效。

## 脚本依赖

无。

## 数据依赖

| 文件 | 说明 | 缺失时影响 |
|------|------|------------|
| `data/place_coords.json` | 地名 → `[lon, lat]` 坐标映射 | 所有地点显示为「无坐标」，地图为空 |

`place_coords.json` 结构：

```json
{ "北京": [116.4, 39.9], "上海": [121.5, 31.2], ... }
```

**外部 CDN 依赖（运行时）：**

| 库 | URL |
|----|-----|
| Leaflet CSS | `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css` |
| Leaflet JS | `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js` |

## 更新坐标数据

`place_coords.json` 由 `wiki/scripts/build_place_coords.py` 从各页面的 frontmatter `coords` 字段自动生成。

### 前置条件

地名类页面（type: place / regime 等）的 frontmatter 需含有 `coords: [经度, 纬度]` 字段（WGS84 格式）。示例：

```yaml
---
id: beijing
type: place
label: 北京
coords: [116.4, 39.9]
---
```

### 重建命令

```bash
python3 wiki/scripts/build_place_coords.py docs/wiki/pages \
  --out docs/wiki/data/place_coords.json
```

### 自动重建

已集成到 `publish.sh` Step 6。每次发布时自动从 pages/ 提取坐标、重建 `place_coords.json`，无需手动操作。

### 数据消费

生成后在浏览器端由本插件（route-map）和 geomap 插件通过 `data/place_coords.json` 路径按需 fetch。

## local config 必须项

文件：`local/config/route-map.js`（可选）

| 导出名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `COORDS_URL` | `string` | `'data/place_coords.json'` | 坐标文件的相对 URL |

示例：

```js
// local/config/route-map.js（可省略）
export const COORDS_URL = 'data/place_coords.json';
```
