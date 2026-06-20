# place-map — 地名地图插件

当页面 `type` 为 `place` 或 `state` 且 frontmatter 有 `coords: [lon, lat]` 时，在 sidebar 的 `#sidebar-map` 区块中渲染 Leaflet 地图。

## 功能

- 读取 frontmatter `coords: [lon, lat]` 渲染单点图钉地图
- 地图底图使用 OpenStreetMap，通过 CDN 加载 Leaflet

## 脚本依赖

无。

## 数据依赖

无静态文件依赖。坐标数据来自页面 frontmatter `coords` 字段。

**外部 CDN 依赖（运行时）：**

| 库 | URL |
|----|-----|
| Leaflet CSS | `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css` |
| Leaflet JS | `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js` |

## local config 必须项

无。本插件无 `local/config/place-map.js`。
