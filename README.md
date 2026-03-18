# Muimi Blog

个人静态博客仓库，部署在 GitHub Pages。

- 线上地址：https://muimi.club
- GitHub Pages 仓库：https://github.com/Muimi272/Muimi272.github.io

## 项目概览

- 多页面静态站点：首页、文章、工具、仓库、404
- 深浅色主题切换（状态持久化）
- 文章全文关键词搜索（含标题、摘要、正文）
- 工具列表搜索（名称、描述、标签）
- 文章与工具详情页动态 SEO（description / keywords / canonical / JSON-LD）
- 首页精选文章与仓库列表展示
- 移动端适配（含 404 居中与行内代码长文本换行）

## 页面路由

- `/`：首页（index.html）
- `/posts.html`：文章列表
- `/post.html?id=<postId>`：文章详情
- `/tools.html`：工具列表
- `/tool.html?id=<toolId>`：工具详情
- `/repos.html`：GitHub 仓库列表
- `/404.html`：404 页面

## 数据与内容维护

### 文章数据

文章采用“独立文件 + 索引”模式：

1. 在 `articles/` 中新增文章 JSON 文件（例如 `my-post.json`）
2. 在 `articles/index.json` 追加该文件路径（例如 `"articles/my-post.json"`）

文章 JSON 示例：

```json
{
  "id": "my-post",
  "title": "我的新文章",
  "date": "2026-03-03",
  "summary": "一句简短摘要",
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "content": "<p>这里是正文 HTML。</p>"
}
```

字段说明：

- `id`：文章唯一标识，用于详情页参数
- `date`：建议使用 `YYYY-MM-DD`
- `keywords`：用于文章页 SEO
- `content`：文章 HTML 内容

### 工具与仓库数据

- 工具数据在 `assets/data.js` 的 `TOOL_ITEMS`
- 仓库数据在 `assets/data.js` 的 `GITHUB_REPOS`

新增工具时至少需要：

1. 在 `TOOL_ITEMS` 中添加 `id`、`name`、`summary`、`tags`、`page`
2. 创建对应工具页面（如 `tools/xxx.html`）
3. 确认 `tool.html?id=<id>` 能正确打开详情并跳转

## 目录结构

```text
.
├── 404.html
├── index.html
├── posts.html
├── post.html
├── tools.html
├── tool.html
├── repos.html
├── CNAME
├── robots.txt
├── sitemap.xml
├── BingSiteAuth.xml
├── LICENSE
├── articles/
│   ├── index.json
│   ├── 1.json
│   ├── 2.json
│   └── 3.json
├── assets/
│   ├── styles.css
│   ├── main.js
│   └── data.js
├── resources/
└── tools/
    ├── snake.html
    ├── class_schedule.html
    ├── realtime_weather_map.html
    ├── realtime_weather_map/
    │   ├── styles.css
    │   └── script.js
    └── class_schedule_assets/
        ├── class_schedule.css
        └── class_schedule.js
```

## 本地预览

可使用任意静态服务器（示例）：

```bash
python -m http.server 8000
```

打开：`http://localhost:8000`

## 发布检查清单

1. 文章新增后，确认 `articles/index.json` 已更新
2. 检查 `post.html?id=...` 和 `tool.html?id=...` 可正常访问
3. 检查移动端显示（尤其 404 页面、长行内代码、工具页）
4. 检查 `sitemap.xml` 与 `robots.txt` 是否需要同步更新

## 许可协议

本项目采用 `CC BY-NC-ND 4.0`（署名-非商业性使用-禁止演绎 4.0 国际）许可协议。
详细条款见仓库根目录 `LICENSE` 文件。