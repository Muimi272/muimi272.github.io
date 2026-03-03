# Muimi Blog

个人静态博客仓库，部署在 GitHub Pages。

- 线上访问地址：https://muimi.club
- GitHub Pages 仓库：https://github.com/Muimi272/Muimi272.github.io

## 功能概览

- 多页面静态站点（首页、文章列表、文章详情、仓库页）
- 深浅色主题切换
- 文章关键词搜索
- 首页精选文章展示
- 仓库卡片展示并跳转到 GitHub

## 目录结构

```
.
├── index.html
├── posts.html
├── post.html
├── repos.html
├── CNAME
├── LICENSE
├── articles/
│   ├── index.json
│   └── *.json
└── assets/
    ├── styles.css
    ├── main.js
    └── data.js
```

## 新增文章

文章采用“独立文件 + 索引”模式：

1. 在 `articles/` 目录新增文章文件（例如 `my-post.json`）
2. 在 `articles/index.json` 中追加该文件路径（例如 `"articles/my-post.json"`）

文章 JSON 示例：

```json
{
  "id": "my-post",
  "title": "我的新文章",
  "date": "2026-03-03",
  "summary": "一句简短摘要",
  "content": "<p>这里是正文 HTML。</p>"
}
```

## 本地预览

可使用任意静态服务器（示例）：

```bash
python -m http.server 8000
```

然后访问 `http://localhost:8000`。

## 许可协议

本项目使用仓库内 `LICENSE` 文件所述协议。