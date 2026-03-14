(function () {
	const STORAGE_KEY = "classScheduleData.v2";
	const DAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
	const WEEKEND_VIEW_ORDER = [5, 6, 0, 1, 2, 3, 4];

	const appState = {
		normalized: null,
		midnightTimer: null,
		displayDateOverride: null
	};

	const elements = {
		emptyState: document.getElementById("emptyState"),
		scheduleSection: document.getElementById("scheduleSection"),
		table: document.getElementById("scheduleTable"),
		currentDate: document.getElementById("currentDate"),
		topUploadHost: document.getElementById("topUploadHost"),
		bottomUploadHost: document.getElementById("bottomUploadHost"),
		uploadControls: document.getElementById("uploadControls"),
		file: document.getElementById("jsonFile"),
		uploadBtn: document.getElementById("uploadBtn"),
		themeToggle: document.getElementById("themeToggle")
	};

	initTheme();
	bindEvents();
	init();
	exposeDateController();
	scheduleMidnightRefresh();

	function bindEvents() {
		elements.uploadBtn.addEventListener("click", handleUpload);
	}

	function init() {
		updateCurrentDate();
		const cached = readCache();
		if (!cached) {
			toggleLayout(false);
			return;
		}

		try {
			appState.normalized = normalizeData(cached);
			renderFromState();
		} catch (error) {
			localStorage.removeItem(STORAGE_KEY);
			toggleLayout(false);
			window.alert("缓存数据不可用，请重新导入");
		}
	}

	async function handleUpload() {
		const file = elements.file.files[0];
		if (!file) {
			window.alert("请先选择 JSON 文件");
			return;
		}

		try {
			const text = await file.text();
			const raw = JSON.parse(text);
			const normalized = normalizeData(raw);
			appState.normalized = normalized;
			saveCache(normalized);
			elements.file.value = "";
			renderFromState();
		} catch (error) {
			window.alert("导入失败：" + error.message);
		}
	}

	function toggleLayout(hasData) {
		if (hasData) {
			elements.emptyState.style.display = "none";
			elements.scheduleSection.style.display = "grid";
			elements.bottomUploadHost.appendChild(elements.uploadControls);
		} else {
			elements.scheduleSection.style.display = "none";
			elements.emptyState.style.display = "flex";
			elements.topUploadHost.appendChild(elements.uploadControls);
		}
	}

	function renderFromState() {
		updateCurrentDate();
		if (!appState.normalized) {
			toggleLayout(false);
			return;
		}

		const normalized = appState.normalized;
		const today = getTodayDate();
		const todayDayIndex = getWeekdayIndex(today);
		const currentWeek = getCurrentWeekNumber(normalized.firstWeekStartDate, today);
		const columns = buildRenderColumns(currentWeek, todayDayIndex);
		const matrix = buildRenderMatrix(normalized.timeSlots, normalized.courses, columns);
		renderTable(normalized.timeSlots, matrix, columns);
		toggleLayout(true);
	}

	function buildRenderColumns(currentWeek, todayDayIndex) {
		const isWeekend = todayDayIndex === 5 || todayDayIndex === 6;
		const order = isWeekend ? WEEKEND_VIEW_ORDER : [0, 1, 2, 3, 4, 5, 6];

		return order.map(function (dayIndex) {
			const isNextWeekWeekday = isWeekend && dayIndex <= 4;
			const targetWeekNumber = currentWeek === null ? null : (isNextWeekWeekday ? currentWeek + 1 : currentWeek);
			const suffix = isWeekend ? (isNextWeekWeekday ? "(下周)" : "(本周)") : "";
			return {
				dayIndex: dayIndex,
				label: DAYS[dayIndex] + suffix,
				targetWeekNumber: targetWeekNumber,
				isTodayColumn: dayIndex === todayDayIndex
			};
		});
	}

	function buildRenderMatrix(timeSlots, courses, columns) {
		const matrix = Array.from({ length: timeSlots.length }, function () {
			return Array.from({ length: columns.length }, function () {
				return [];
			});
		});

		courses.forEach(function (course) {
			if (course.timeIndex < 0 || course.timeIndex >= timeSlots.length) {
				return;
			}
			if (course.dayIndex < 0 || course.dayIndex > 6) {
				return;
			}

			columns.forEach(function (column, colIndex) {
				if (course.dayIndex !== column.dayIndex) {
					return;
				}
				if (!isCourseInWeek(course, column.targetWeekNumber)) {
					return;
				}
				matrix[course.timeIndex][colIndex].push(course);
			});
		});

		return matrix;
	}

	function renderTable(timeSlots, matrix, columns) {
		const table = elements.table;
		table.innerHTML = "";

		const thead = document.createElement("thead");
		const headRow = document.createElement("tr");
		const firstHead = document.createElement("th");
		firstHead.textContent = "时间段";
		headRow.appendChild(firstHead);

		columns.forEach(function (column) {
			const th = document.createElement("th");
			th.textContent = column.label;
			if (column.isTodayColumn) {
				th.classList.add("today-col");
			}
			headRow.appendChild(th);
		});

		thead.appendChild(headRow);
		table.appendChild(thead);

		const tbody = document.createElement("tbody");
		timeSlots.forEach(function (slot, timeIndex) {
			const row = document.createElement("tr");
			const timeCell = document.createElement("th");
			timeCell.innerHTML = "<span class='slot-index'>第 " + (timeIndex + 1) + " 节</span>" + escapeHtml(slot.start) + " - " + escapeHtml(slot.end);
			row.appendChild(timeCell);

			for (let colIndex = 0; colIndex < columns.length; colIndex += 1) {
				const td = document.createElement("td");
				if (columns[colIndex].isTodayColumn) {
					td.classList.add("today-col");
				}

				const stack = document.createElement("div");
				stack.className = "cell-stack";
				const classes = matrix[timeIndex][colIndex];

				if (!classes.length) {
					const empty = document.createElement("div");
					empty.className = "empty-cell";
					empty.textContent = "无课程";
					stack.appendChild(empty);
				} else {
					classes.forEach(function (course) {
						const card = document.createElement("article");
						card.className = "course-card";
						card.innerHTML =
							"<div class='course-name'>" + escapeHtml(course.name) + "</div>" +
							"<div class='course-meta'>" +
							"<div class='course-teacher'>" + escapeHtml(course.teacher) + "</div>" +
							"<div class='course-location'>" + escapeHtml(course.location) + "</div>" +
							"</div>";
						stack.appendChild(card);
					});
				}

				td.appendChild(stack);
				row.appendChild(td);
			}

			tbody.appendChild(row);
		});

		table.appendChild(tbody);
	}

	function triggerDaySwitchAnimation() {
		elements.scheduleSection.classList.remove("day-refreshing");
		void elements.scheduleSection.offsetWidth;
		elements.scheduleSection.classList.add("day-refreshing");
		window.setTimeout(function () {
			elements.scheduleSection.classList.remove("day-refreshing");
		}, 820);
	}

	function scheduleMidnightRefresh() {
		if (appState.midnightTimer !== null) {
			window.clearTimeout(appState.midnightTimer);
		}

		const now = new Date();
		const nextMidnight = new Date(now);
		nextMidnight.setHours(24, 0, 0, 0);
		const delay = nextMidnight.getTime() - now.getTime() + 120;

		appState.midnightTimer = window.setTimeout(function () {
			if (appState.displayDateOverride === null) {
				renderFromState();
			}
			if (appState.normalized && appState.displayDateOverride === null) {
				triggerDaySwitchAnimation();
			}
			scheduleMidnightRefresh();
		}, delay);
	}

	function exposeDateController() {
		window.scheduleDateControl = {
			help: function () {
				console.log("scheduleDateControl.setDate('2026-03-14')");
				console.log("scheduleDateControl.resetDate()");
				console.log("scheduleDateControl.getDate()");
			},
			setDate: function (dateText) {
				const parsed = parseDateString(dateText);
				if (!parsed) {
					console.warn("日期格式错误，应为 YYYY-MM-DD");
					return false;
				}
				appState.displayDateOverride = parsed;
				renderFromState();
				if (appState.normalized) {
					triggerDaySwitchAnimation();
				}
				return true;
			},
			resetDate: function () {
				appState.displayDateOverride = null;
				renderFromState();
				if (appState.normalized) {
					triggerDaySwitchAnimation();
				}
			},
			getDate: function () {
				if (appState.displayDateOverride === null) {
					return "system";
				}
				return formatDate(appState.displayDateOverride);
			}
		};
	}

	function normalizeData(raw) {
		if (!raw || typeof raw !== "object") {
			throw new Error("JSON 根节点必须是对象");
		}

		const firstWeekStartDateRaw = getByKeys(raw, ["firstWeekStartDate", "termStartDate", "firstWeekDate"]);
		const firstWeekStartDate = normalizeDate(firstWeekStartDateRaw);
		const timeSlotsRaw = raw.timeSlots || raw.scheduleTimes;
		const coursesRaw = raw.courses || raw.classInfos;

		if (!Array.isArray(timeSlotsRaw) || timeSlotsRaw.length === 0) {
			throw new Error("timeSlots 必须是非空数组");
		}
		if (!Array.isArray(coursesRaw)) {
			throw new Error("courses 必须是数组");
		}

		const timeSlots = timeSlotsRaw.map(function (item, index) {
			const start = getByKeys(item, ["startTime", "start"]);
			const end = getByKeys(item, ["endTime", "end"]);
			if (!isValidTime(start) || !isValidTime(end)) {
				throw new Error("timeSlots 第 " + (index + 1) + " 项时间格式错误，应为 HH:MM");
			}
			return { start: String(start), end: String(end) };
		});

		const courses = coursesRaw.map(function (item, index) {
			const name = getByKeys(item, ["courseName", "name"]);
			const teacher = getByKeys(item, ["teacherName", "teacher"]);
			const location = getByKeys(item, ["location", "classroom"]);
			const weeksRaw = getByKeys(item, ["weeks", "weekNumbers"]);
			const position = getByKeys(item, ["position", "coord", "coords"]);

			const parsedPosition = parsePosition(position, item);
			const weeks = parseWeeks(weeksRaw, index);

			if (parsedPosition.timeIndex < 0 || parsedPosition.timeIndex >= timeSlots.length) {
				throw new Error("courses 第 " + (index + 1) + " 项 timeIndex 超出 timeSlots 范围");
			}
			if (parsedPosition.dayIndex < 0 || parsedPosition.dayIndex >= 7) {
				throw new Error("courses 第 " + (index + 1) + " 项 dayIndex 必须在 0-6 之间");
			}

			return {
				name: String(name || "未命名课程"),
				teacher: String(teacher || "未填写教师"),
				location: String(location || "未填写地点"),
				weeks: weeks,
				timeIndex: parsedPosition.timeIndex,
				dayIndex: parsedPosition.dayIndex
			};
		});

		return {
			timeSlots: timeSlots,
			courses: courses,
			firstWeekStartDate: firstWeekStartDate
		};
	}

	function parseWeeks(value, index) {
		if (value === undefined || value === null || value === "") {
			return [];
		}

		let rawList = [];
		if (Array.isArray(value)) {
			rawList = value;
		} else if (typeof value === "string") {
			rawList = expandWeekText(value);
		} else {
			throw new Error("courses 第 " + (index + 1) + " 项 weeks 格式错误，应为数组或字符串");
		}

		const unique = new Set();
		rawList.forEach(function (item) {
			const num = Number(item);
			if (!Number.isInteger(num) || num <= 0) {
				throw new Error("courses 第 " + (index + 1) + " 项 weeks 只能包含正整数");
			}
			unique.add(num);
		});

		return Array.from(unique).sort(function (a, b) {
			return a - b;
		});
	}

	function expandWeekText(text) {
		const normalized = String(text)
			.replace(/第|周/g, "")
			.replace(/[，、；]/g, ",")
			.trim();
		if (!normalized) {
			return [];
		}

		const result = [];
		normalized.split(",").forEach(function (partRaw) {
			const part = partRaw.trim();
			if (!part) {
				return;
			}

			let mode = "all";
			if (part.indexOf("单") !== -1 || /odd/i.test(part)) {
				mode = "odd";
			} else if (part.indexOf("双") !== -1 || /even/i.test(part)) {
				mode = "even";
			}

			const nums = part.match(/\d+/g);
			if (!nums || nums.length === 0) {
				return;
			}

			if (part.indexOf("-") !== -1 && nums.length >= 2) {
				let start = Number(nums[0]);
				let end = Number(nums[1]);
				if (start > end) {
					const tmp = start;
					start = end;
					end = tmp;
				}
				for (let i = start; i <= end; i += 1) {
					if (mode === "odd" && i % 2 === 0) {
						continue;
					}
					if (mode === "even" && i % 2 === 1) {
						continue;
					}
					result.push(i);
				}
				return;
			}

			nums.forEach(function (n) {
				const valueNum = Number(n);
				if (mode === "odd" && valueNum % 2 === 0) {
					return;
				}
				if (mode === "even" && valueNum % 2 === 1) {
					return;
				}
				result.push(valueNum);
			});
		});

		return result;
	}

	function parsePosition(position, sourceItem) {
		if (Array.isArray(position) && position.length >= 2) {
			return {
				timeIndex: parseInteger(position[0]),
				dayIndex: parseInteger(position[1])
			};
		}

		if (position && typeof position === "object") {
			return {
				timeIndex: parseInteger(getByKeys(position, ["timeIndex", "row", "slot", "time"])),
				dayIndex: parseInteger(getByKeys(position, ["dayIndex", "column", "col", "day", "weekday"]))
			};
		}

		return {
			timeIndex: parseInteger(getByKeys(sourceItem, ["timeIndex", "row", "slot", "time"])),
			dayIndex: parseInteger(getByKeys(sourceItem, ["dayIndex", "column", "col", "day", "weekday"]))
		};
	}

	function normalizeDate(value) {
		if (value === undefined || value === null || value === "") {
			return null;
		}
		const text = String(value).trim();
		if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
			throw new Error("firstWeekStartDate 格式错误，应为 YYYY-MM-DD");
		}
		const date = new Date(text + "T00:00:00");
		if (Number.isNaN(date.getTime())) {
			throw new Error("firstWeekStartDate 不是有效日期");
		}
		return text;
	}

	function getCurrentWeekNumber(firstWeekStartDate, today) {
		if (!firstWeekStartDate) {
			return null;
		}
		const start = new Date(firstWeekStartDate + "T00:00:00");
		if (Number.isNaN(start.getTime())) {
			return null;
		}
		const diff = today.getTime() - start.getTime();
		const dayDiff = Math.floor(diff / (24 * 60 * 60 * 1000));
		const week = Math.floor(dayDiff / 7) + 1;
		return week < 1 ? null : week;
	}

	function isCourseInWeek(course, currentWeek) {
		if (currentWeek === null) {
			return true;
		}
		if (!Array.isArray(course.weeks) || course.weeks.length === 0) {
			return true;
		}
		return course.weeks.indexOf(currentWeek) !== -1;
	}

	function updateCurrentDate() {
		const today = getTodayDate();
		const y = today.getFullYear();
		const m = String(today.getMonth() + 1).padStart(2, "0");
		const d = String(today.getDate()).padStart(2, "0");
		const day = DAYS[getWeekdayIndex(today)];
		const suffix = appState.displayDateOverride ? " (手动)" : "";
		elements.currentDate.textContent = y + "-" + m + "-" + d + " " + day + suffix;
	}

	function getTodayDate() {
		const source = appState.displayDateOverride || new Date();
		const now = new Date(source);
		now.setHours(0, 0, 0, 0);
		return now;
	}

	function getWeekdayIndex(date) {
		const day = date.getDay();
		return day === 0 ? 6 : day - 1;
	}

	function parseDateString(text) {
		if (typeof text !== "string") {
			return null;
		}
		const value = text.trim();
		if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
			return null;
		}
		const date = new Date(value + "T00:00:00");
		if (Number.isNaN(date.getTime())) {
			return null;
		}
		date.setHours(0, 0, 0, 0);
		return date;
	}

	function formatDate(date) {
		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, "0");
		const d = String(date.getDate()).padStart(2, "0");
		return y + "-" + m + "-" + d;
	}

	function saveCache(normalized) {
		const payload = {
			firstWeekStartDate: normalized.firstWeekStartDate,
			timeSlots: normalized.timeSlots.map(function (slot) {
				return {
					startTime: slot.start,
					endTime: slot.end
				};
			}),
			courses: normalized.courses.map(function (course) {
				return {
					courseName: course.name,
					teacherName: course.teacher,
					location: course.location,
					weeks: course.weeks,
					position: {
						timeIndex: course.timeIndex,
						dayIndex: course.dayIndex
					}
				};
			})
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
	}

	function readCache() {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			return null;
		}
		try {
			return JSON.parse(raw);
		} catch (error) {
			return null;
		}
	}

	function isValidTime(value) {
		return typeof value === "string" && /^([01]\d|2[0-3]):([0-5]\d)$/.test(value.trim());
	}

	function parseInteger(value) {
		const num = Number(value);
		if (!Number.isInteger(num)) {
			throw new Error("课程位置必须是整数索引");
		}
		return num;
	}

	function getByKeys(obj, keys) {
		if (!obj || typeof obj !== "object") {
			return undefined;
		}
		for (let i = 0; i < keys.length; i += 1) {
			if (Object.prototype.hasOwnProperty.call(obj, keys[i])) {
				return obj[keys[i]];
			}
		}
		return undefined;
	}

	function escapeHtml(text) {
		return String(text)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/\"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	function initTheme() {
		const root = document.documentElement;
		const stored = localStorage.getItem("theme-mode");
		if (stored === "light") {
			root.classList.add("light");
		}

		const toggle = elements.themeToggle;
		const icon = toggle ? toggle.querySelector(".theme-icon") : null;
		const text = toggle ? toggle.querySelector(".theme-text") : null;

		function updateLabel() {
			const isLight = root.classList.contains("light");
			if (icon) {
				icon.textContent = isLight ? "◖" : "◗";
			}
			if (text) {
				text.textContent = isLight ? "浅色" : "深色";
			}
			if (toggle) {
				toggle.setAttribute("aria-label", isLight ? "当前浅色主题，点击切换深色" : "当前深色主题，点击切换浅色");
				toggle.setAttribute("title", isLight ? "切换为深色" : "切换为浅色");
			}
		}

		updateLabel();
		if (toggle) {
			toggle.addEventListener("click", function () {
				root.classList.toggle("light");
				localStorage.setItem("theme-mode", root.classList.contains("light") ? "light" : "dark");
				updateLabel();
			});
		}
	}
})();
