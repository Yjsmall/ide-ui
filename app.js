/**
 * ZCode IDE - Interactive Logic
 */

// Default initial project list: only one folder and one corresponding task
const DEFAULT_PROJECTS = [
  {
    id: "proj_reader",
    name: "reader",
    active: true,
    tasks: [
      {
        iconType: "sparkle",
        title: "我现在使用脑图过程中，它现...",
        time: "now"
      }
    ]
  }
];

// State
let projectsData = [];
let isSidebarExpanded = true;
let activeProjectId = "proj_reader";

// DOM Elements
const ideContainer = document.getElementById("ideContainer");
const btnToggleSidebar = document.getElementById("btnToggleSidebar");
const btnNavNewTask = document.getElementById("btnNavNewTask");
const btnSidebarNewTask = document.getElementById("btnSidebarNewTask");
const projectsListEl = document.getElementById("projectsList");
const folderInput = document.getElementById("folderInput");
const btnUploadFolder = document.getElementById("btnUploadFolder");
const btnQuickAddProject = document.getElementById("btnQuickAddProject");
const activeProjectNameEl = document.getElementById("activeProjectName");
const promptInput = document.getElementById("promptInput");
const btnSendPrompt = document.getElementById("btnSendPrompt");
const toast = document.getElementById("toast");
const floatingWindow = document.getElementById("floatingWindow");
const dropZoneOverlay = document.getElementById("dropZoneOverlay");

// Mac traffic light buttons
const btnMacClose = document.getElementById("btnMacClose");
const btnMacMin = document.getElementById("btnMacMin");
const btnMacMax = document.getElementById("btnMacMax");
const appWindow = document.getElementById("appWindow");

// Model and mode selectors
const btnModelSelect = document.getElementById("btnModelSelect");
const modelNameText = document.getElementById("modelNameText");
const btnAccessControl = document.getElementById("btnAccessControl");

// Toast helper
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

// Load from LocalStorage
function loadProjects() {
  try {
    const saved = localStorage.getItem("zcode_ide_projects_v3");
    if (saved) {
      projectsData = JSON.parse(saved);
      const active = projectsData.find(p => p.active);
      if (active) {
        activeProjectId = active.id;
        if (activeProjectNameEl) activeProjectNameEl.textContent = active.name;
      }
      return;
    }
  } catch (e) {
    console.warn("Failed to load projects from storage", e);
  }
  projectsData = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
}

// Save to LocalStorage
function saveProjects() {
  try {
    localStorage.setItem("zcode_ide_projects_v3", JSON.stringify(projectsData));
  } catch (e) {
    console.warn("Failed to save projects to storage", e);
  }
}

// Render Projects List
function renderProjects() {
  projectsListEl.innerHTML = "";

  projectsData.forEach((project) => {
    const groupEl = document.createElement("div");
    groupEl.className = "project-group";
    groupEl.dataset.id = project.id;

    // Header (Folder Name + Actions)
    const headerEl = document.createElement("div");
    headerEl.className = `project-folder-header ${project.id === activeProjectId ? "active" : ""}`;
    headerEl.title = "点击选择项目，双击可重命名";

    // Left Title Wrap
    const titleWrap = document.createElement("div");
    titleWrap.className = "folder-title-wrap";

    // Folder Icon
    const folderIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    folderIcon.setAttribute("width", "13");
    folderIcon.setAttribute("height", "13");
    folderIcon.setAttribute("viewBox", "0 0 16 16");
    folderIcon.setAttribute("fill", "none");
    folderIcon.setAttribute("class", "folder-icon");
    folderIcon.innerHTML = `<path d="M1.5 3.5A1.5 1.5 0 0 1 3 2h3.5l1.5 1.5H13A1.5 1.5 0 0 1 14.5 5v7A1.5 1.5 0 0 1 13 13.5H3A1.5 1.5 0 0 1 1.5 12V3.5z" stroke="currentColor" stroke-width="1.2"/>`;

    // Folder Name Span
    const nameSpan = document.createElement("span");
    nameSpan.className = "folder-name";
    nameSpan.textContent = project.name;

    titleWrap.appendChild(folderIcon);
    titleWrap.appendChild(nameSpan);

    // Right Action Buttons (Rename, Delete)
    const actionsWrap = document.createElement("div");
    actionsWrap.className = "folder-actions";

    // Rename Button
    const btnRename = document.createElement("button");
    btnRename.className = "folder-action-btn";
    btnRename.title = "重命名文件夹";
    btnRename.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
      </svg>
    `;
    btnRename.addEventListener("click", (e) => {
      e.stopPropagation();
      startRenaming(project.id, nameSpan);
    });

    // Delete Button
    const btnDelete = document.createElement("button");
    btnDelete.className = "folder-action-btn";
    btnDelete.title = "移除文件夹";
    btnDelete.innerHTML = `
      <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
        <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      </svg>
    `;
    btnDelete.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteProject(project.id);
    });

    actionsWrap.appendChild(btnRename);
    actionsWrap.appendChild(btnDelete);

    headerEl.appendChild(titleWrap);
    headerEl.appendChild(actionsWrap);

    // Click to activate project
    headerEl.addEventListener("click", () => {
      selectProject(project.id);
    });

    // Double click to rename
    headerEl.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      startRenaming(project.id, nameSpan);
    });

    groupEl.appendChild(headerEl);

    // Task items
    if (project.tasks && project.tasks.length > 0) {
      const tasksList = document.createElement("div");
      tasksList.className = "project-tasks-list";

      project.tasks.forEach((t) => {
        const taskItem = document.createElement("div");
        taskItem.className = "task-item";
        taskItem.title = t.title;

        const titleGroup = document.createElement("div");
        titleGroup.className = "task-title-group";

        if (t.iconType === "sparkle") {
          const spark = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          spark.setAttribute("width", "13");
          spark.setAttribute("height", "13");
          spark.setAttribute("viewBox", "0 0 18 18");
          spark.setAttribute("fill", "none");
          spark.setAttribute("class", "task-sparkle-icon");
          spark.innerHTML = `
            <path d="M9 2v3M9 13v3M2 9h3M13 9h3M4 4l2 2M12 12l2 2M4 14l2-2M12 6l2-2" stroke="#d58f3b" stroke-width="1.4" stroke-linecap="round"/>
          `;
          titleGroup.appendChild(spark);
        }

        const taskText = document.createElement("span");
        taskText.className = "task-text";
        taskText.textContent = t.title;
        titleGroup.appendChild(taskText);

        const timeSpan = document.createElement("span");
        timeSpan.className = "task-time";
        timeSpan.textContent = t.time;

        taskItem.appendChild(titleGroup);
        taskItem.appendChild(timeSpan);

        taskItem.addEventListener("click", () => {
          if (promptInput) {
            promptInput.value = t.title;
            promptInput.focus();
          }
        });

        tasksList.appendChild(taskItem);
      });

      // Subtasks (like epub_design)
      if (project.subtasks && project.subtasks.length > 0) {
        project.subtasks.forEach((sub) => {
          const subItem = document.createElement("div");
          subItem.className = "task-item";
          subItem.title = sub.title;

          const titleGroup = document.createElement("div");
          titleGroup.className = "task-title-group";

          const bullet = document.createElement("span");
          bullet.className = "task-bullet";

          const taskText = document.createElement("span");
          taskText.className = "task-text";
          taskText.textContent = sub.title;

          titleGroup.appendChild(bullet);
          titleGroup.appendChild(taskText);

          const timeSpan = document.createElement("span");
          timeSpan.className = "task-time";
          timeSpan.textContent = sub.time;

          subItem.appendChild(titleGroup);
          subItem.appendChild(timeSpan);

          subItem.addEventListener("click", () => {
            if (promptInput) {
              promptInput.value = sub.title;
              promptInput.focus();
            }
          });

          tasksList.appendChild(subItem);
        });

        if (project.showMore) {
          const showMore = document.createElement("div");
          showMore.className = "show-more-tasks";
          showMore.textContent = "Show more";
          showMore.addEventListener("click", () => {
            showToast("已展开全部子任务");
          });
          tasksList.appendChild(showMore);
        }
      }

      groupEl.appendChild(tasksList);
    }

    projectsListEl.appendChild(groupEl);
  });
}

// Select Project
function selectProject(id) {
  activeProjectId = id;
  projectsData.forEach(p => {
    p.active = (p.id === id);
  });
  const selected = projectsData.find(p => p.id === id);
  if (selected) {
    if (activeProjectNameEl) activeProjectNameEl.textContent = selected.name;
    showToast(`当前切换至项目: ${selected.name}`);
  }
  saveProjects();
  renderProjects();
}

// Inline Rename Project
function startRenaming(id, nameSpan) {
  const currentName = nameSpan.textContent;
  const input = document.createElement("input");
  input.type = "text";
  input.className = "folder-name-input";
  input.value = currentName;

  nameSpan.replaceWith(input);
  input.focus();
  input.select();

  let committed = false;

  function commitRename() {
    if (committed) return;
    committed = true;
    const newName = input.value.trim() || currentName;
    const proj = projectsData.find(p => p.id === id);
    if (proj) {
      proj.name = newName;
      if (proj.id === activeProjectId && activeProjectNameEl) {
        activeProjectNameEl.textContent = newName;
      }
      saveProjects();
      showToast(`项目已重命名为: "${newName}"`);
    }
    renderProjects();
  }

  input.addEventListener("blur", commitRename);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      commitRename();
    } else if (e.key === "Escape") {
      committed = true;
      renderProjects();
    }
  });
}

// Delete Project
function deleteProject(id) {
  const proj = projectsData.find(p => p.id === id);
  const name = proj ? proj.name : "";
  projectsData = projectsData.filter(p => p.id !== id);
  if (activeProjectId === id && projectsData.length > 0) {
    activeProjectId = projectsData[0].id;
    projectsData[0].active = true;
    if (activeProjectNameEl) activeProjectNameEl.textContent = projectsData[0].name;
  }
  saveProjects();
  renderProjects();
  showToast(`已移除项目: "${name}"`);
}

// Folder Upload Handler
function handleFolderUpload(files) {
  if (!files || files.length === 0) return;

  // Extract folder name from webkitRelativePath
  let folderName = "uploaded_folder";
  const firstFile = files[0];
  if (firstFile.webkitRelativePath) {
    const parts = firstFile.webkitRelativePath.split("/");
    if (parts.length > 1) {
      folderName = parts[0];
    }
  } else if (firstFile.name) {
    folderName = firstFile.name.replace(/\.[^/.]+$/, "");
  }

  // Count files
  const fileCount = files.length;
  const newProjId = "proj_" + Date.now();

  const newProject = {
    id: newProjId,
    name: folderName,
    active: true,
    tasks: [
      {
        iconType: "sparkle",
        title: `已上传 ${fileCount} 个文件，准备就绪`,
        time: "now"
      }
    ]
  };

  // Add to top of projects list
  projectsData.unshift(newProject);
  selectProject(newProjId);
  showToast(`成功上传文件夹 "${folderName}" (${fileCount} 个文件)`);
}

// Set up Folder Input trigger
btnUploadFolder.addEventListener("click", () => {
  folderInput.value = "";
  folderInput.click();
});

btnQuickAddProject.addEventListener("click", () => {
  const name = prompt("请输入新项目/文件夹名称:", "new_project");
  if (name && name.trim()) {
    const trimmed = name.trim();
    const newProjId = "proj_" + Date.now();
    projectsData.unshift({
      id: newProjId,
      name: trimmed,
      active: true,
      tasks: [
        {
          iconType: "none",
          title: "新建项目任务",
          time: "now"
        }
      ]
    });
    selectProject(newProjId);
    showToast(`已创建项目: "${trimmed}"`);
  }
});

folderInput.addEventListener("change", (e) => {
  handleFolderUpload(e.target.files);
});

// Drag and drop folder upload onto window / floating window
window.addEventListener("dragover", (e) => {
  e.preventDefault();
  if (dropZoneOverlay) dropZoneOverlay.classList.add("drag-active");
});

window.addEventListener("dragleave", (e) => {
  if (e.relatedTarget === null || e.clientX === 0 || e.clientY === 0) {
    if (dropZoneOverlay) dropZoneOverlay.classList.remove("drag-active");
  }
});

window.addEventListener("drop", (e) => {
  e.preventDefault();
  if (dropZoneOverlay) dropZoneOverlay.classList.remove("drag-active");

  const items = e.dataTransfer.items;
  if (items && items.length > 0) {
    const entry = items[0].webkitGetAsEntry ? items[0].webkitGetAsEntry() : null;
    if (entry && entry.isDirectory) {
      const folderName = entry.name;
      const newProjId = "proj_" + Date.now();
      projectsData.unshift({
        id: newProjId,
        name: folderName,
        active: true,
        tasks: [
          {
            iconType: "sparkle",
            title: `拖拽添加的文件夹，包含多个源文件`,
            time: "now"
          }
        ]
      });
      selectProject(newProjId);
      showToast(`成功导入文件夹: "${folderName}"`);
      return;
    }
  }

  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    handleFolderUpload(e.dataTransfer.files);
  }
});

// Sidebar Toggle Functionality
function toggleSidebar(forceState) {
  if (typeof forceState === "boolean") {
    isSidebarExpanded = forceState;
  } else {
    isSidebarExpanded = !isSidebarExpanded;
  }

  if (isSidebarExpanded) {
    ideContainer.classList.remove("sidebar-collapsed");
    ideContainer.classList.add("sidebar-expanded");
    btnToggleSidebar.classList.add("active");
  } else {
    ideContainer.classList.remove("sidebar-expanded");
    ideContainer.classList.add("sidebar-collapsed");
    btnToggleSidebar.classList.remove("active");
  }
}

// Bind Sidebar Toggle
btnToggleSidebar.addEventListener("click", () => {
  toggleSidebar();
});

// Clicking on empty floating space when sidebar is expanded can optionally collapse sidebar
floatingWindow.addEventListener("click", (e) => {
  // If user clicks on the floating card background itself (not prompt box or buttons)
  if (e.target === floatingWindow && isSidebarExpanded) {
    toggleSidebar(false);
  }
});

// New Task buttons
btnNavNewTask.addEventListener("click", () => {
  if (promptInput) {
    promptInput.value = "";
    promptInput.focus();
  }
  showToast("已创建新会话");
});

btnSidebarNewTask.addEventListener("click", () => {
  if (promptInput) {
    promptInput.value = "";
    promptInput.focus();
  }
  showToast("开始新任务");
});

// Quick Action Chips
document.querySelectorAll(".chip-btn").forEach((chip) => {
  chip.addEventListener("click", () => {
    const text = chip.getAttribute("data-prompt") || chip.textContent.trim();
    if (promptInput) {
      promptInput.value = text;
      promptInput.focus();
    }
  });
});

// Send Prompt
function submitPrompt() {
  if (!promptInput) return;
  const query = promptInput.value.trim();
  if (!query) {
    promptInput.focus();
    return;
  }

  const activeProj = projectsData.find(p => p.id === activeProjectId);
  if (activeProj) {
    activeProj.tasks.unshift({
      iconType: "sparkle",
      title: query,
      time: "now"
    });
    saveProjects();
    renderProjects();
  }

  showToast(`已发送任务: "${query.substring(0, 18)}..."`);
  promptInput.value = "";
}

if (btnSendPrompt) {
  btnSendPrompt.addEventListener("click", submitPrompt);
}

if (promptInput) {
  promptInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitPrompt();
    }
  });
}

// Model selector quick switch
const models = ["GLM-5.3-Flash", "Claude-3.7-Sonnet", "Gemini-2.5-Pro", "DeepSeek-V3", "GPT-4o"];
let currentModelIndex = 0;
if (btnModelSelect) {
  btnModelSelect.addEventListener("click", () => {
    currentModelIndex = (currentModelIndex + 1) % models.length;
    if (modelNameText) modelNameText.textContent = models[currentModelIndex];
    showToast(`已切换模型: ${models[currentModelIndex]}`);
  });
}

// Access control toggle
let isFullAccess = true;
if (btnAccessControl) {
  btnAccessControl.addEventListener("click", () => {
    isFullAccess = !isFullAccess;
    const label = btnAccessControl.querySelector("span");
    if (label) {
      label.textContent = isFullAccess ? "Full access" : "Read only";
    }
    showToast(`权限已切换为: ${isFullAccess ? "Full access (完全读写)" : "Read only (只读)"}`);
  });
}

// Mode selector (Max, Fast, Thinking)
const btnModeSelect = document.getElementById("btnModeSelect");
const modes = ["Max", "Fast", "Reasoning", "Thinking"];
let currentModeIndex = 0;
if (btnModeSelect) {
  btnModeSelect.addEventListener("click", () => {
    currentModeIndex = (currentModeIndex + 1) % modes.length;
    const modeSpan = btnModeSelect.querySelector("span");
    if (modeSpan) modeSpan.textContent = modes[currentModeIndex];
    showToast(`计算模式已切换为: ${modes[currentModeIndex]}`);
  });
}

// Current Folder Pill Click - Quick Switch Project
const currentFolderPill = document.getElementById("currentFolderPill");
if (currentFolderPill) {
  currentFolderPill.addEventListener("click", () => {
    if (projectsData.length === 0) return;
    const currentIndex = projectsData.findIndex(p => p.id === activeProjectId);
    const nextIndex = (currentIndex + 1) % projectsData.length;
    selectProject(projectsData[nextIndex].id);
  });
}

// Branch Pill Click - Quick Branch Switch
const currentBranchPill = document.getElementById("currentBranchPill");
const branches = ["codex/arkts-...", "main", "dev", "feature/floating-window"];
let currentBranchIndex = 0;
if (currentBranchPill) {
  currentBranchPill.addEventListener("click", () => {
    currentBranchIndex = (currentBranchIndex + 1) % branches.length;
    const branchSpan = currentBranchPill.querySelector("span");
    if (branchSpan) branchSpan.textContent = branches[currentBranchIndex];
    showToast(`已切换分支: ${branches[currentBranchIndex]}`);
  });
}

// Attachment Button
const btnAddAttachment = document.getElementById("btnAddAttachment");
if (btnAddAttachment) {
  btnAddAttachment.addEventListener("click", () => {
    showToast("添加上下文文件或附件");
    folderInput.click();
  });
}

// Mac window buttons (if present)
if (btnMacClose) {
  btnMacClose.addEventListener("click", () => {
    showToast("Mac 窗口关闭按钮已点击");
  });
}

if (btnMacMin) {
  let isMinimized = false;
  btnMacMin.addEventListener("click", () => {
    isMinimized = !isMinimized;
    if (isMinimized) {
      appWindow.style.transform = "scale(0.85) translateY(40px)";
      appWindow.style.opacity = "0.6";
      appWindow.style.transition = "all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)";
      showToast("Mac 窗口已最小化 (再次点击还原)");
    } else {
      appWindow.style.transform = "none";
      appWindow.style.opacity = "1";
      showToast("Mac 窗口已还原");
    }
  });
}

if (btnMacMax) {
  btnMacMax.addEventListener("click", () => {
    document.body.classList.toggle("windowed-preview");
    const isWindowed = document.body.classList.contains("windowed-preview");
    showToast(isWindowed ? "切换为 macOS 窗口化演示模式" : "切换为全屏铺满模式");
  });
}

// Keyboard Shortcuts
window.addEventListener("keydown", (e) => {
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const modifier = isMac ? e.metaKey : e.ctrlKey;

  if (modifier && (e.key === "n" || e.key === "N")) {
    e.preventDefault();
    btnSidebarNewTask.click();
  } else if (modifier && (e.key === "k" || e.key === "K")) {
    e.preventDefault();
    if (promptInput) promptInput.focus();
    showToast("搜索 / 输入命令 (⌘K)");
  } else if (modifier && (e.key === "b" || e.key === "B")) {
    e.preventDefault();
    toggleSidebar();
  }
});

// Initialize on DOM load or immediate execution
function initApp() {
  loadProjects();
  renderProjects();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

