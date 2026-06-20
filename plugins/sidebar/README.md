# sidebar — 侧边栏插件

渲染页面右侧栏的图片区（`#sidebar-portrait`）与地图区（`#sidebar-map`），并控制 `#sidebar` 整体可见性。

## 功能

在 `core` 上挂载 `core.renderSidebar(front, ibEl)`，由 `renderer.js` 在页面渲染后调用。

- **图片区**：读取 frontmatter `image`（单图）或 `images`（多图数组），渲染人物/实体图片
- **地图区**：读取 frontmatter `coords: [lon, lat]`，嵌入 OpenStreetMap iframe（无需 Leaflet）
- 当 infobox、图片区、地图区均不显示时，自动隐藏整个侧边栏

## 脚本依赖

无。

## 数据依赖

无。数据来自页面 frontmatter。

## local config 必须项

无。本插件无 `local/config/sidebar.js`。
