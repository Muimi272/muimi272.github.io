const FEATURED_POST_ID = "hello-static-blog";

const BLOG_CONTENT_CONFIG = {
  articleIndexFile: "articles/index.json"
};

const DEFAULT_ARTICLE_FILES = [
  "articles/3.json"
];

const TOOL_ITEMS = [
  {
    id: "snake",
    name: "贪吃蛇",
    date: "2026-03-11",
    description: "经典贪吃蛇小游戏，支持键盘与触屏方向控制。",
    summary: "摸鱼小游戏",
    tags: ["游戏", "JavaScript", "Canvas"],
    keywords: ["贪吃蛇", "Snake", "小游戏", "在线工具", "Muimi"],
    detail: "<p>这是一个贪吃蛇小游戏，支持键盘方向键与移动端触控按钮。</p><p>游戏使用非线性加速机制，分数越高，蛇的速度会持续提升且没有固定上限。</p>",
    page: "tools/snake.html"
  },
  {
    id: "class-schedule",
    name: "课程表",
    date: "2026-03-14",
    description: "导入 JSON 课程数据后，自动生成可视化周课表，支持周末视图与深浅主题。",
    summary: "支持周末模式和移动端适配的可视化课程表工具。",
    tags: ["效率", "课程", "JSON", "课表"],
    keywords: ["课程表", "课表", "JSON", "导入", "时间管理", "Muimi"],
    detail: `
<h2>一、工具用途</h2>
<p>这个工具用于导入课程数据并生成可视化课表，默认按当前日期显示对应周课程。周末会自动切换为“周末在左、下周工作日在右”的视图，方便提前查看下周安排。</p>

<h2>二、快速开始</h2>
<ol>
  <li>打开课程表页面。</li>
  <li>点击底部导入区域，选择课程表 JSON 文件。</li>
  <li>导入成功后自动显示课表，导入区域会移动到表格下方。</li>
  <li>如需替换数据，直接再次导入新的 JSON 文件即可。</li>
</ol>

<h2>三、数据格式要求</h2>
<p>JSON 根对象应包含以下字段：</p>
<ol>
  <li><strong>firstWeekStartDate</strong>：第一周开始日期，格式为 YYYY-MM-DD。</li>
  <li><strong>timeSlots</strong>：时间段数组，每项包含 startTime 和 endTime。</li>
  <li><strong>courses</strong>：课程数组，每项包含课程信息与上课位置。</li>
</ol>
<p>课程项支持以下常见字段：</p>
<ol>
  <li>courseName 或 name：课程名。</li>
  <li>teacherName 或 teacher：教师名。</li>
  <li>location 或 classroom：地点。</li>
  <li>weeks 或 weekNumbers：上课周次（数组或字符串）。</li>
  <li>position：位置对象，包含 timeIndex 和 dayIndex。</li>
</ol>
<p>索引说明：</p>
<ol>
  <li>timeIndex：对应第几个时间段，从 0 开始。</li>
  <li>dayIndex：星期索引，周一到周日对应 0 到 6。</li>
</ol>

<h2>四、显示规则</h2>
<ol>
  <li>平日模式：按周一到周日顺序显示当前周课程。</li>
  <li>周末模式：将周六、周日排到左侧，并在右侧显示下周周一到周五课程。</li>
  <li>无课程单元格会显示“无课程”。</li>
  <li>右上角显示当前日期；若手动设置了显示日期，会标记“手动”。</li>
</ol>

<h2>五、主题与交互</h2>
<ol>
  <li>支持深色和浅色主题切换。</li>
  <li>移动端已适配，可横向滚动查看完整课表。</li>
  <li>每天零点会自动刷新课表并播放过渡动画。</li>
</ol>

<h2>六、控制台日期控制（高级）</h2>
<p>可在浏览器控制台使用以下方法切换显示日期：</p>
<ol>
  <li><code>scheduleDateControl.help()</code>：查看可用命令。</li>
  <li><code>scheduleDateControl.setDate("2026-03-14")</code>：设置显示日期。</li>
  <li><code>scheduleDateControl.getDate()</code>：获取当前显示日期。</li>
  <li><code>scheduleDateControl.resetDate()</code>：恢复系统日期。</li>
</ol>

<h2>七、使用AI导出课程表数据文件</h2>
<p>如果你手头是表格或图片课表，可以直接把原始内容交给 AI，按下面提示词转换为本工具支持的 JSON。</p>

<h3>提示词模板 A（表格文件转 JSON）</h3>
<pre><code>请将下面的课表数据转换为课程表 JSON，严格按目标结构输出，不要输出任何解释文字。

目标 JSON 结构：
{
  "firstWeekStartDate": "YYYY-MM-DD",
  "timeSlots": [
    { "startTime": "08:20", "endTime": "09:05" }
  ],
  "courses": [
    {
      "courseName": "课程名",
      "teacherName": "教师名",
      "location": "上课地点",
      "position": { "timeIndex": 0, "dayIndex": 0 },
      "weeks": [1,2,3]
    }
  ]
}

转换要求：
1. dayIndex 必须按周一到周日映射为 0 到 6。
2. timeIndex 从 0 开始，按时间段顺序编号。
3. weeks 必须是正整数数组，去重并升序。
4. 如果某门课周次未知，weeks 填 []。
5. 教师或地点缺失时，分别填“未填写教师”“未填写地点”。
6. 仅输出 JSON，不要使用 markdown，不要附加说明。

第一周开始日期是：这里替换为你的日期（例如 2026-03-02）

原始课表数据如下：
这里粘贴表格文本或 OCR 后文本</code></pre>

<h3>提示词模板 B（图片课表转 JSON）</h3>
<pre><code>你是课表结构化助手。请先从我提供的课表图片识别文字，再转换成课程表 JSON。严格按目标结构输出，不要输出解释，不要输出 markdown。

目标 JSON 结构：
{
  "firstWeekStartDate": "YYYY-MM-DD",
  "timeSlots": [
    { "startTime": "08:20", "endTime": "09:05" }
  ],
  "courses": [
    {
      "courseName": "课程名",
      "teacherName": "教师名",
      "location": "上课地点",
      "position": { "timeIndex": 0, "dayIndex": 0 },
      "weeks": [1,2,3]
    }
  ]
}

识别与转换规则：
1. 先识别每天每节课内容，再映射到 dayIndex 和 timeIndex。
2. dayIndex：周一=0，周二=1，周三=2，周四=3，周五=4，周六=5，周日=6。
3. 如果图片中时间不完整，请根据节次顺序生成 timeSlots；无法判断时按“第1节、第2节...”顺序保留。
4. 周次文字如“1-8周”“单周”“双周”要展开为整数数组并升序去重。
5. 字段缺失时使用默认值：
   courseName=未命名课程，teacherName=未填写教师，location=未填写地点，weeks=[]。
6. 如果识别不确定，请尽量保守，不要编造；无法确定的项保留默认值。
7. 仅输出 JSON。

第一周开始日期是：这里替换为你的日期（例如 2026-03-02）

图片内容如下：
这里上传图片或粘贴图片 OCR 文本</code></pre>

<h2>八、常见问题</h2>
<ol>
  <li>导入失败：请检查 JSON 格式是否有效，字段名是否正确。</li>
  <li>日期不生效：firstWeekStartDate 必须是 YYYY-MM-DD。</li>
  <li>课程不显示：检查 weeks 是否包含当前周次，或课程的 timeIndex/dayIndex 是否越界。</li>
</ol>
`,
    page: "tools/class_schedule.html"
  }
];

const GITHUB_REPOS = [
  {
    name: "Keyboard-Listener",
    description: "Keyboard listener utility project.",
    url: "https://github.com/Muimi272/Keyboard-Listener"
  },
  {
    name: "Kispha",
    description: "Kispha project repository.",
    url: "https://github.com/Muimi272/Kispha"
  },
  {
    name: "FileHider",
    description: "File hiding utility project.",
    url: "https://github.com/Muimi272/FileHider"
  },
  {
    name: "XLSXLoader",
    description: "一个轻量级的 Java XLSX 解析库，用于读取 .xlsx 文件中的工作表名称、工作表 ID，以及按工作表读取二维字符串数据。",
    url: "https://github.com/Muimi272/XLSXLoader"
  },
  {
    name: "bookmark",
    description: "一个收录 5000+ 标签和链接的导航页，精心整理各类优质网站资源，欢迎大家一起补充和修订。",
    url: "https://github.com/Muimi272/bookmark"
  },
  {
    name: "Calculator",
    description: "A simple calculator project.",
    url: "https://github.com/Muimi272/Calculator"
  },
  {
    name: "Audio-Metadata-Editor",
    description: "Audio metadata editor project.",
    url: "https://github.com/Muimi272/Audio-Metadata-Editor"
  },
  {
    name: "2048",
    description: "Classic 2048 game implemented with JavaFX.",
    url: "https://github.com/Muimi272/2048"
  },
  {
    name: "Muimi-Sound",
    description: "A Bilibili audio player based on C# and WebView2, providing a simple and elegant interface.",
    url: "https://github.com/Muimi272/Muimi-Sound"
  },
  {
    name: "Sudoku",
    description: "Sudoku related project implementation.",
    url: "https://github.com/Muimi272/Sudoku"
  },
  {
    name: "Markdown-Previewer",
    description: "A Markdown Previewer that can run offline on a webpage.",
    url: "https://github.com/Muimi272/Markdown-Previewer"
  },
  {
    name: "ToDoList",
    description: "A plan management page that can run offline on a webpage.",
    url: "https://github.com/Muimi272/ToDoList"
  },
  {
    name: "Snake-Game",
    description: "A snake game running on the console. 一个在控制台上运行的贪吃蛇游戏。",
    url: "https://github.com/Muimi272/Snake-Game"
  },
  {
    name: "Matrix",
    description: "A Java class for matrix operations, with rich linear algebra functions.",
    url: "https://github.com/Muimi272/Matrix"
  },
  {
    name: "Chat-Room",
    description: "A Java-based chat room running on the console. 一个在控制台上运行的基于 Java 的聊天室。",
    url: "https://github.com/Muimi272/Chat-Room"
  }
];
