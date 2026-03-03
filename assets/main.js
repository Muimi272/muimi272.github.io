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

let postsCachePromise;

function stripHtml(text) {
  return String(text || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
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
    content
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

async function renderPostList() {
  const postList = document.getElementById("postList");
  if (!postList) return;

  const posts = await getPosts();

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
          <a class="card-link" href="post.html?id=${encodeURIComponent(post.id)}">阅读全文 →</a>
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
}

async function renderPostDetail() {
  const container = document.getElementById("postDetail");
  if (!container) return;

  const posts = await getPosts();

  const params = new URLSearchParams(window.location.search);
  const postId = params.get("id");
  const post = posts.find((item) => item.id === postId);

  if (!post) {
    container.innerHTML = `
      <h1>文章未找到</h1>
      <p>请从文章列表页重新选择文章。</p>
    `;
    return;
  }

  document.title = `${post.title} | Muimi`;
  container.innerHTML = `
    <p class="meta">${post.date}</p>
    <h1>${post.title}</h1>
    <section class="article-body">${post.content}</section>
  `;
}

function renderRepoList() {
  const repoList = document.getElementById("repoList");
  if (!repoList || typeof GITHUB_REPOS === "undefined") return;

  repoList.innerHTML = GITHUB_REPOS.map(
    (repo) => `
      <article class="card repo-card">
        <h2>${repo.name}</h2>
        <p>${repo.description || "暂无仓库描述。"}</p>
        <a class="card-link" href="${repo.url}" target="_blank" rel="noopener noreferrer">打开 GitHub 仓库 ↗</a>
      </article>
    `
  ).join("");
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
        <a class="card-link" href="${repo.url}" target="_blank" rel="noopener noreferrer">查看仓库 →</a>
      </article>
    `
  ).join("");
}

initTheme();
renderPostList();
renderPostDetail();
renderRepoList();
renderHomeFeaturedPost();
renderHomeRepoList();
