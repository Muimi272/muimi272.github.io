function initTheme() {
  const root = document.documentElement;
  const stored = localStorage.getItem("theme-mode");
  if (stored === "light") {
    root.classList.add("light");
  }

  const toggle = document.getElementById("themeToggle");
  const icon = toggle ? toggle.querySelector(".theme-icon") : null;
  const text = toggle ? toggle.querySelector(".theme-text") : null;

  const updateToggleLabel = () => {
    const isLight = root.classList.contains("light");
    if (icon) icon.textContent = isLight ? "◖" : "◗";
    if (text) text.textContent = isLight ? "浅色" : "深色";
    if (toggle) {
      toggle.setAttribute("aria-label", isLight ? "当前浅色主题，点击切换深色" : "当前深色主题，点击切换浅色");
      toggle.setAttribute("title", isLight ? "切换为深色" : "切换为浅色");
    }
  };

  updateToggleLabel();

  if (toggle) {
    toggle.addEventListener("click", () => {
      root.classList.toggle("light");
      localStorage.setItem("theme-mode", root.classList.contains("light") ? "light" : "dark");
      updateToggleLabel();
    });
  }
}

const SITE_BASE_URL = "https://muimi.club";
const SITE_NAME = "Muimi";
const SITE_DESCRIPTION = "Muimi 的个人博客，记录 Java、Python、C# 与前端学习笔记、项目实践和生活灵感。";
const SITE_IMAGE = `${SITE_BASE_URL}/assets/og-image.svg`;
const SITE_AUTHOR = {
  name: "Muimi",
  email: "Muimi_mail@163.com",
  github: "https://github.com/Muimi272"
};

function setMetaTag(attribute, key, content) {
  if (!content) return;
  const selector = `meta[${attribute}="${key}"]`;
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setLinkTag(rel, href) {
  if (!href) return;
  let tag = document.head.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute("href", href);
}

function setStructuredData(data) {
  const scriptId = "structuredData";
  let script = document.getElementById(scriptId);
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = scriptId;
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: `${SITE_BASE_URL}/`,
    description: SITE_DESCRIPTION,
    inLanguage: "zh-CN",
    publisher: {
      "@type": "Person",
      name: SITE_AUTHOR.name,
      url: `${SITE_BASE_URL}/`,
      sameAs: [SITE_AUTHOR.github],
      email: SITE_AUTHOR.email
    }
  };
}

function formatIsoDate(dateString) {
  if (!dateString) return "";
  const date = new Date(`${dateString}T00:00:00+08:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

function buildPostCanonical(postId) {
  return `${SITE_BASE_URL}/post.html?id=${encodeURIComponent(postId)}`;
}

function buildToolCanonical(toolId) {
  return `${SITE_BASE_URL}/tool.html?id=${encodeURIComponent(toolId)}`;
}

function getPostKeywords(post) {
  const raw = post && post.keywords;
  let list = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (typeof raw === "string") {
    list = raw.split(/[,，;；]+/);
  }

  const normalized = list.map((item) => String(item).trim()).filter(Boolean);
  if (normalized.length) return normalized.slice(0, 12);

  const fallback = [];
  if (post && post.title) fallback.push(post.title);
  if (post && post.summary) {
    const firstSentence = String(post.summary).split(/[。.!?]/)[0].trim();
    if (firstSentence) fallback.push(firstSentence);
  }
  return fallback.slice(0, 6);
}

function updatePostSeo(post) {
  const summary = post.summary || stripHtml(post.content || "").slice(0, 160) || SITE_DESCRIPTION;
  const canonicalUrl = buildPostCanonical(post.id);
  const isoDate = formatIsoDate(post.date);
  const keywords = getPostKeywords(post);
  const keywordsContent = keywords.join(", ");

  document.title = `${post.title} | ${SITE_NAME}`;
  setMetaTag("name", "description", summary);
  setMetaTag("name", "keywords", keywordsContent);
  setMetaTag("name", "robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
  setMetaTag("name", "googlebot", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
  setMetaTag("property", "og:type", "article");
  setMetaTag("property", "og:title", `${post.title} | ${SITE_NAME}`);
  setMetaTag("property", "og:description", summary);
  setMetaTag("property", "og:url", canonicalUrl);
  setMetaTag("property", "og:image", SITE_IMAGE);
  setMetaTag("property", "article:published_time", isoDate);
  setMetaTag("property", "article:modified_time", isoDate);
  setMetaTag("property", "article:author", SITE_AUTHOR.github);
  setMetaTag("name", "twitter:title", `${post.title} | ${SITE_NAME}`);
  setMetaTag("name", "twitter:description", summary);
  setMetaTag("name", "twitter:image", SITE_IMAGE);
  setLinkTag("canonical", canonicalUrl);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: summary,
    keywords: keywordsContent,
    datePublished: isoDate,
    dateModified: isoDate,
    author: {
      "@type": "Person",
      name: SITE_AUTHOR.name,
      url: SITE_AUTHOR.github
    },
    publisher: {
      "@type": "Person",
      name: SITE_AUTHOR.name,
      url: SITE_AUTHOR.github
    },
    image: [SITE_IMAGE],
    mainEntityOfPage: canonicalUrl,
    inLanguage: "zh-CN"
  };

  setStructuredData([buildWebSiteJsonLd(), articleJsonLd]);
}

function updatePostNotFoundSeo() {
  document.title = `文章未找到 | ${SITE_NAME}`;
  setMetaTag("name", "description", "文章未找到，请返回文章列表重新选择。");
  setMetaTag("name", "robots", "noindex, nofollow");
  setLinkTag("canonical", `${SITE_BASE_URL}/post.html`);
  setStructuredData(buildWebSiteJsonLd());
}

function getToolKeywords(tool) {
  const raw = tool && tool.keywords;
  if (Array.isArray(raw)) {
    const list = raw.map((item) => String(item).trim()).filter(Boolean);
    if (list.length) return list.slice(0, 12);
  }

  const fallback = [];
  if (tool && tool.name) fallback.push(tool.name);
  if (tool && Array.isArray(tool.tags)) fallback.push(...tool.tags);
  return fallback.map((item) => String(item).trim()).filter(Boolean).slice(0, 12);
}

function updateToolSeo(tool) {
  const summary = tool.summary || tool.description || "工具详情页";
  const canonicalUrl = buildToolCanonical(tool.id);
  const keywordsContent = getToolKeywords(tool).join(", ");

  document.title = `${tool.name} | ${SITE_NAME}`;
  setMetaTag("name", "description", summary);
  setMetaTag("name", "keywords", keywordsContent);
  setMetaTag("name", "robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
  setMetaTag("name", "googlebot", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
  setMetaTag("property", "og:type", "website");
  setMetaTag("property", "og:title", `${tool.name} | ${SITE_NAME}`);
  setMetaTag("property", "og:description", summary);
  setMetaTag("property", "og:url", canonicalUrl);
  setMetaTag("property", "og:image", SITE_IMAGE);
  setMetaTag("name", "twitter:title", `${tool.name} | ${SITE_NAME}`);
  setMetaTag("name", "twitter:description", summary);
  setMetaTag("name", "twitter:image", SITE_IMAGE);
  setLinkTag("canonical", canonicalUrl);

  const toolJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: summary,
    url: canonicalUrl,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    inLanguage: "zh-CN"
  };

  setStructuredData([buildWebSiteJsonLd(), toolJsonLd]);
}

function updateToolNotFoundSeo() {
  document.title = `工具未找到 | ${SITE_NAME}`;
  setMetaTag("name", "description", "工具未找到，请返回工具列表重新选择。");
  setMetaTag("name", "robots", "noindex, nofollow");
  setLinkTag("canonical", `${SITE_BASE_URL}/tool.html`);
  setStructuredData(buildWebSiteJsonLd());
}

let postsCachePromise;

function stripHtml(text) {
  return String(text || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function enhanceRichContentTables(scope) {
  if (!scope) return;

  const tables = scope.querySelectorAll("table");
  tables.forEach((table) => {
    const parent = table.parentElement;
    if (parent && parent.classList.contains("article-table-wrap")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "article-table-wrap";
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });
}

function normalizePost(rawPost, sourcePath) {
  if (!rawPost || !rawPost.title) return null;

  const fileName = sourcePath.split("/").pop() || "";
  const fallbackId = fileName.replace(/\.json$/i, "");
  const content = String(rawPost.content || "");
  const summary = rawPost.summary || stripHtml(content).slice(0, 86) || "暂无摘要";

  return {
    id: rawPost.id || fallbackId,
    title: rawPost.title,
    date: rawPost.date || "1970-01-01",
    summary,
    content,
    keywords: rawPost.keywords
  };
}

function sortPostsByDateDesc(postList) {
  return [...postList].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

async function loadArticleFilesFromIndex() {
  const indexFile = (BLOG_CONTENT_CONFIG && BLOG_CONTENT_CONFIG.articleIndexFile) || "articles/index.json";

  try {
    const response = await fetch(indexFile, { cache: "no-store" });
    if (response.ok) {
      const indexData = await response.json();
      if (Array.isArray(indexData)) {
        return indexData;
      }
      if (indexData && Array.isArray(indexData.files)) {
        return indexData.files;
      }
    }
  } catch (_) {
  }

  if (typeof DEFAULT_ARTICLE_FILES !== "undefined" && Array.isArray(DEFAULT_ARTICLE_FILES)) {
    return DEFAULT_ARTICLE_FILES;
  }

  return [];
}

async function loadPosts() {
  const articleFiles = await loadArticleFilesFromIndex();
  const posts = await Promise.all(
    articleFiles.map(async (filePath) => {
      try {
        const response = await fetch(filePath, { cache: "no-store" });
        if (!response.ok) return null;
        const articleData = await response.json();
        return normalizePost(articleData, filePath);
      } catch (_) {
        return null;
      }
    })
  );

  return sortPostsByDateDesc(posts.filter(Boolean));
}

async function getPosts() {
  if (!postsCachePromise) {
    postsCachePromise = loadPosts();
  }
  return postsCachePromise;
}

function showContentLoader(container, message) {
  if (!container) return () => {};

  const startedAt = performance.now();
  container.setAttribute("aria-busy", "true");
  container.innerHTML = `
    <div class="content-loader" role="status" aria-live="polite">
      <span class="content-loader-ring" aria-hidden="true"></span>
      <p>${message}</p>
    </div>
  `;

  let finished = false;
  return () => {
    if (finished) return;
    finished = true;
    const elapsed = performance.now() - startedAt;
    const remain = Math.max(0, 180 - elapsed);
    window.setTimeout(() => {
      container.removeAttribute("aria-busy");
    }, remain);
  };
}

function getDebugLoadingDelay() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("debugLoading");
  if (!raw) return 0;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.min(parsed, 10000);
}

function waitMs(ms) {
  if (!ms) return Promise.resolve();
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function waitForDebugLoading() {
  const delay = getDebugLoadingDelay();
  if (delay > 0) {
    await waitMs(delay);
  }
}

async function renderPostList() {
  const postList = document.getElementById("postList");
  if (!postList) return;

  const stopLoading = showContentLoader(postList, "正在加载文章列表...");
  let posts = [];

  const searchInput = document.getElementById("postSearch");
  const statusText = document.getElementById("searchStatus");

  function updateSearchParam(keyword) {
    const url = new URL(window.location.href);
    if (keyword) {
      url.searchParams.set("q", keyword);
    } else {
      url.searchParams.delete("q");
    }
    window.history.replaceState({}, "", url.toString());
  }

  function getInitialKeyword() {
    const params = new URLSearchParams(window.location.search);
    return (params.get("q") || "").trim();
  }

  function drawList(posts) {
    if (!posts.length) {
      postList.innerHTML = `
        <article class="card">
          <h2>未找到匹配文章</h2>
        </article>
      `;
      return;
    }

    postList.innerHTML = posts.map(
      (post) => `
        <article class="card">
          <p class="meta">${post.date}</p>
          <h2>${post.title}</h2>
          <p>${post.summary}</p>
          <a class="card-link" href="post.html?id=${encodeURIComponent(post.id)}">阅读全文</a>
        </article>
      `
    ).join("");
  }

  const updateStatus = (count) => {
    if (!statusText) return;
    statusText.textContent = `已匹配 ${count} 篇文章`;
  };

  const filterAndRender = (keywordRaw) => {
    const keyword = keywordRaw.trim().toLowerCase();
    const filteredPosts = posts.filter((post) => {
      const contentText = stripHtml(post.content || "");
      const combinedText = `${post.title} ${post.summary} ${contentText}`.toLowerCase();
      return combinedText.includes(keyword);
    });

    drawList(filteredPosts);
    updateStatus(filteredPosts.length);
  };

  try {
    const [loadedPosts] = await Promise.all([getPosts(), waitForDebugLoading()]);
    posts = loadedPosts;

    if (!searchInput) {
      drawList(posts);
      updateStatus(posts.length);
      return;
    }

    const initialKeyword = getInitialKeyword();
    searchInput.value = initialKeyword;
    filterAndRender(initialKeyword);

    searchInput.addEventListener("input", (event) => {
      const keywordRaw = event.target.value;
      filterAndRender(keywordRaw);
      updateSearchParam(keywordRaw.trim());
    });
  } catch (_) {
    postList.innerHTML = `
      <article class="card">
        <h2>文章加载失败</h2>
        <p>请稍后刷新页面重试。</p>
      </article>
    `;
    if (statusText) {
      statusText.textContent = "加载失败";
    }
  } finally {
    stopLoading();
  }
}

async function renderPostDetail() {
  const container = document.getElementById("postDetail");
  if (!container) return;

  const stopLoading = showContentLoader(container, "正在加载文章内容...");

  try {
    const [posts] = await Promise.all([getPosts(), waitForDebugLoading()]);

    const params = new URLSearchParams(window.location.search);
    const postId = params.get("id");
    const post = posts.find((item) => item.id === postId);

    if (!post) {
      updatePostNotFoundSeo();
      container.innerHTML = `
        <h1>文章未找到</h1>
        <p>请从文章列表页重新选择文章。</p>
      `;
      return;
    }

    updatePostSeo(post);
    container.innerHTML = `
      <p class="meta">${post.date}</p>
      <h1>${post.title}</h1>
      <section class="article-body">${post.content}</section>
    `;
    enhanceRichContentTables(container.querySelector(".article-body"));
  } catch (_) {
    container.innerHTML = `
      <h1>文章加载失败</h1>
      <p>请稍后刷新页面重试。</p>
    `;
  } finally {
    stopLoading();
  }
}

function renderRepoList() {
  const repoList = document.getElementById("repoList");
  if (!repoList || typeof GITHUB_REPOS === "undefined") return;

  repoList.innerHTML = GITHUB_REPOS.map(
    (repo) => `
      <article class="card repo-card">
        <h2>${repo.name}</h2>
        <p>${repo.description || "暂无仓库描述。"}</p>
        <a class="card-link" href="${repo.url}" target="_blank" rel="noopener noreferrer">打开 GitHub 仓库</a>
      </article>
    `
  ).join("");
}

function normalizeToolItem(rawTool) {
  if (!rawTool || !rawTool.id || !rawTool.name || !rawTool.page) return null;
  return {
    id: String(rawTool.id),
    date: String(rawTool.date || ""),
    name: String(rawTool.name),
    description: String(rawTool.description || "暂无工具描述。"),
    summary: String(rawTool.summary || rawTool.description || ""),
    detail: String(rawTool.detail || ""),
    page: String(rawTool.page),
    keywords: Array.isArray(rawTool.keywords)
      ? rawTool.keywords.map((keyword) => String(keyword).trim()).filter(Boolean)
      : [],
    tags: Array.isArray(rawTool.tags) ? rawTool.tags.map((tag) => String(tag).trim()).filter(Boolean) : []
  };
}

async function renderToolList() {
  const toolList = document.getElementById("toolList");
  if (!toolList) return;

  const stopLoading = showContentLoader(toolList, "正在加载工具列表...");

  try {
    await waitForDebugLoading();

    if (typeof TOOL_ITEMS === "undefined" || !Array.isArray(TOOL_ITEMS)) {
      toolList.innerHTML = `
        <article class="card tool-card">
          <h2>工具加载失败</h2>
          <p>请稍后刷新页面重试。</p>
        </article>
      `;
      return;
    }

    const tools = TOOL_ITEMS.map(normalizeToolItem).filter(Boolean);
    const searchInput = document.getElementById("toolSearch");
    const statusText = document.getElementById("toolSearchStatus");

  function drawList(filteredTools) {
    if (!filteredTools.length) {
      toolList.innerHTML = `
        <article class="card tool-card">
          <h2>未找到匹配工具</h2>
        </article>
      `;
      return;
    }

    toolList.innerHTML = filteredTools.map((tool) => {
      const tagHtml = tool.tags.length
        ? `<p class="tool-tags">${tool.tags.map((tag) => `<span>${tag}</span>`).join("")}</p>`
        : "";

      return `
        <article class="card tool-card">
          <h2>${tool.name}</h2>
          <p>${tool.description}</p>
          ${tagHtml}
          <a class="card-link" href="tool.html?id=${encodeURIComponent(tool.id)}">查看详情</a>
        </article>
      `;
    }).join("");
  }

  function updateStatus(count) {
    if (!statusText) return;
    statusText.textContent = `已匹配 ${count} 个工具`;
  }

  function filterAndRender(keywordRaw) {
    const keyword = String(keywordRaw || "").trim().toLowerCase();
    const filtered = tools.filter((tool) => {
      const text = `${tool.name} ${tool.description} ${tool.summary} ${tool.tags.join(" ")} ${tool.keywords.join(" ")}`.toLowerCase();
      return text.includes(keyword);
    });
    drawList(filtered);
    updateStatus(filtered.length);
  }

    if (!searchInput) {
      drawList(tools);
      updateStatus(tools.length);
      return;
    }

    filterAndRender(searchInput.value || "");
    searchInput.addEventListener("input", (event) => {
      filterAndRender(event.target.value || "");
    });
  } finally {
    stopLoading();
  }
}

async function renderToolDetail() {
  const container = document.getElementById("toolDetail");
  if (!container) return;

  const stopLoading = showContentLoader(container, "正在加载工具详情...");

  try {
    await waitForDebugLoading();

    if (typeof TOOL_ITEMS === "undefined" || !Array.isArray(TOOL_ITEMS)) {
      container.innerHTML = `
        <h1>工具加载失败</h1>
        <p>请稍后刷新页面重试。</p>
      `;
      return;
    }

    const tools = TOOL_ITEMS.map(normalizeToolItem).filter(Boolean);
    const params = new URLSearchParams(window.location.search);
    const toolId = params.get("id");
    const tool = tools.find((item) => item.id === toolId);

    if (!tool) {
      updateToolNotFoundSeo();
      container.innerHTML = `
        <h1>工具未找到</h1>
        <p>请从工具列表页重新选择。</p>
      `;
      return;
    }

    updateToolSeo(tool);
    const tagsHtml = tool.tags.length
      ? `<p class="tool-tags">${tool.tags.map((tag) => `<span>${tag}</span>`).join("")}</p>`
      : "";

    container.innerHTML = `
      <p class="meta">${tool.date || ""}</p>
      <h1>${tool.name}</h1>
      <p>${tool.summary || tool.description}</p>
      ${tagsHtml}
      <section class="article-body">${tool.detail || `<p>${tool.description}</p>`}</section>
      <div class="button-row">
        <a class="btn btn-primary" href="${tool.page}">在线使用</a>
      </div>
    `;
    enhanceRichContentTables(container.querySelector(".article-body"));
  } finally {
    stopLoading();
  }
}

async function renderHomeFeaturedPost() {
  const container = document.getElementById("homeFeaturedPost");
  if (!container) return;

  const posts = await getPosts();

  const featuredId = typeof FEATURED_POST_ID === "string" ? FEATURED_POST_ID : "";
  const featuredPost = posts.find((post) => post.id === featuredId) || posts[0];

  if (!featuredPost) {
    container.innerHTML = `
      <article class="card">
        <h3>暂无文章</h3>
      </article>
    `;
    return;
  }

  container.innerHTML = `
    <article class="card featured-post-card">
      <p class="meta">${featuredPost.date}</p>
      <h3>${featuredPost.title}</h3>
      <p>${featuredPost.summary}</p>
      <div class="button-row">
        <a class="btn btn-secondary" href="post.html?id=${encodeURIComponent(featuredPost.id)}">查看这篇文章</a>
        <a class="btn btn-primary" href="posts.html">浏览全部文章</a>
      </div>
    </article>
  `;
}

function renderHomeRepoList() {
  const container = document.getElementById("homeRepoList");
  if (!container || typeof GITHUB_REPOS === "undefined") return;

  container.innerHTML = GITHUB_REPOS.map(
    (repo) => `
      <article class="card repo-compact-card">
        <h3>${repo.name}</h3>
        <p>${repo.description || "暂无仓库描述。"}</p>
        <a class="card-link" href="${repo.url}" target="_blank" rel="noopener noreferrer">查看仓库</a>
      </article>
    `
  ).join("");
}

initTheme();
renderPostList();
renderPostDetail();
renderRepoList();
renderToolList();
renderToolDetail();
renderHomeFeaturedPost();
renderHomeRepoList();

// Add mouse movement interactivity to glass elements
document.addEventListener("DOMContentLoaded", function() {
  // Get all glass elements
  const glassElements = document.querySelectorAll(".glass-card");

  // Add mousemove effect for each glass element
  glassElements.forEach((element) => {
    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);
  });

  const resetDuration = 320;

  function animateFilterScale(element, filter, targetScale) {
    const fromScale = parseFloat(filter.getAttribute("scale") || "77");
    const start = performance.now();

    if (element._glassResetFrame) {
      cancelAnimationFrame(element._glassResetFrame);
    }

    const step = (now) => {
      const progress = Math.min((now - start) / resetDuration, 1);
      const eased = progress * (2 - progress);
      const value = fromScale + (targetScale - fromScale) * eased;
      filter.setAttribute("scale", value.toFixed(2));

      if (progress < 1) {
        element._glassResetFrame = requestAnimationFrame(step);
      } else {
        element._glassResetFrame = null;
      }
    };

    element._glassResetFrame = requestAnimationFrame(step);
  }

  // Handle mouse movement over glass elements
  function handleMouseMove(e) {
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this._glassResetFrame) {
      cancelAnimationFrame(this._glassResetFrame);
      this._glassResetFrame = null;
    }

    // Update filter turbulence based on mouse position
    const filter = this.querySelector("filter feDisplacementMap");
    if (filter) {
      const scaleX = (x / rect.width) * 100;
      const scaleY = (y / rect.height) * 100;
      filter.setAttribute("scale", Math.min(scaleX, scaleY));
    }

    // Add highlight effect
    const specular = this.querySelector(".glass-specular");
    if (specular) {
      specular.style.background = `radial-gradient(
        circle at ${x}px ${y}px,
        rgba(255,255,255,0.15) 0%,
        rgba(255,255,255,0.05) 30%,
        rgba(255,255,255,0) 60%
      )`;
    }
  }

  // Reset effects when mouse leaves
  function handleMouseLeave() {
    const filter = this.querySelector("filter feDisplacementMap");
    if (filter) {
      animateFilterScale(this, filter, 77);
    }

    const specular = this.querySelector(".glass-specular");
    if (specular) {
      specular.style.background = "none";
    }
  }
});
