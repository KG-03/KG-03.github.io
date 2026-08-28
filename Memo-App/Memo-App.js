//========================================
//State
//========================================
let notes = [];
let archivedNotes = [];

try {
    const saved = localStorage.getItem("notes");
    notes = saved ? JSON.parse(saved) : [];
} catch {
    notes = [];
}

try {
    const savedArchived = localStorage.getItem("archivedNotes");
    archivedNotes = savedArchived ? JSON.parse(savedArchived) : [];
} catch {
    archivedNotes = [];
}

notes = notes.map(note => ({
    ...note,
    pinned: note.pinned ?? false,
    category: note.category ?? "general",
    createdAt: note.createdAt ?? note.id,
    updatedAt: note.updatedAt ?? note.createdAt ?? note.id,
    expanded: note.expanded ?? true
}));


//========================================
//DOM Elements
//========================================
const titleInput = document.querySelector(".title-input");
const contentInput = document.querySelector(".content-input");
const addBtn = document.querySelector(".add-btn");
const noteList = document.querySelector(".note-list");
const searchInput = document.querySelector(".search-input");
const pinButtons = document.querySelectorAll("[data-pin]");
const themeToggleBtn = document.querySelector(".theme-toggle-btn");
const categorySelect = document.querySelector(".category-select");
const categoryFilter = document.querySelector(".category-filter");
const noteStatus = document.querySelector(".note-status");
const sortSelectFilter = document.querySelector(".sort-select-filter");
const titleCount = document.querySelector(".title-count");
const contentCount = document.querySelector(".content-count");
const appMessage = document.querySelector(".app-message");
const exportBtn = document.querySelector(".export-btn");
const importInput = document.querySelector(".import-input");
const saveStatus = document.querySelector(".save-status");
const cancelEditBtn = document.querySelector(".cancel-edit-btn");
const helpBtn = document.querySelector(".help-btn");
const archiveViewBtn = document.querySelector(".archive-view-btn");

//지금 수정 중인지, 수정중인 메모는 어떤 것인지.
let isEditing = false;
let editingId = null;

let searchText = "";

//pin       : 전체, 고정, 일반
//Category  : 전체, 일반, 공부, 작업, 아이디어
let currentPin = "all";
let currentTheme = localStorage.getItem("theme") || "light";
let currentCategory = "all";
let currentSort = "latest";
let currentView = "notes";

//마지막으로 제거한 데이터, 복구 가능 시간
let lastDeletedNote = null;
let undoTimer = null;

let messageTimer = null;


//========================================
//Event Listeners
//========================================
addBtn.addEventListener("click", addNote);

searchInput.addEventListener("input", function() {
    searchText = searchInput.value.trim().toLowerCase();

    if(currentView === "notes") renderNotes();
    else if (currentView === "archive") renderArchivedNotes();
});

pinButtons.forEach(button => {   
    button.addEventListener("click", function() {
        currentPin = button.dataset.pin;
        currentView = "notes";
        localStorage.setItem("currentPin", currentPin);

        clearActiveButton();
        pinButtons.forEach(btn => {
            if(btn.dataset.pin === currentPin) {
                btn.classList.add("active");
            }
        });

        renderNotes();
    });
});

themeToggleBtn.addEventListener("click", function() {
    currentTheme = currentTheme === "light" ? "dark" : "light";

    applyTheme(currentTheme);
    localStorage.setItem("theme", currentTheme);

    updateThemeButton();
});

categoryFilter.addEventListener("change", function() {
    currentCategory = categoryFilter.value;
    localStorage.setItem("currentCategory", currentCategory);

    if (currentView === "notes") renderNotes();
    else if (currentView === "archive") renderArchivedNotes();
});

sortSelectFilter.addEventListener("change", function() {
    currentSort = sortSelectFilter.value;
    localStorage.setItem("currentSort", currentSort);

    if (currentView === "notes") renderNotes();
    else if (currentView === "archive") renderArchivedNotes();
});

titleInput.addEventListener("input", function() {
    saveDraft();
    updateInputCounts();
    if(!isEditing) updateSaveStatus("✏️ 작성 중...");
});
contentInput.addEventListener("input", function() {
    saveDraft();
    updateInputCounts();
    autoResizeContentarea();
    if(!isEditing) updateSaveStatus("✏️ 작성 중...");
});
categorySelect.addEventListener("change", saveDraft);

exportBtn.addEventListener("click", exportNotes);

importInput.addEventListener("change", importNotes);

cancelEditBtn.addEventListener("click", cancelEdit);

helpBtn.addEventListener("click", () => {
    alert(`
        Ctrl + Enter : 저장
        / : 검색 입력
        Esc : 취소
        Ctrl + Shift + E : 내보내기
        Ctrl + Shift + I : 불러오기
    `);
});

archiveViewBtn.addEventListener("click", () => {
    currentPin = "all";
    currentView = "archive";

    localStorage.setItem("currentPin", currentPin);

    clearActiveButton();
    archiveViewBtn.classList.add("active");
    renderArchivedNotes();
});

document.addEventListener("keydown", function(e) {
    //저장 단축
    if(e.ctrlKey && e.key === "Enter") {
        addNote();
    }

    //검색 단축
    if (e.key === "/") {
        e.preventDefault();
        searchInput.focus();
    }

    //입력 취소 단축
    if(e.key === "Escape" && document.activeElement === searchInput) {
        searchInput.value = "";
        searchText = "";

        renderNotes();
    }

    if(e.key === "Escape") {
        cancelEdit();
    }

    //textarea 입력중 막는 것.
    const active = document.activeElement;

    if(active === titleInput || active === contentInput) return;

    //삭제 undo. (기본 입력 undo에 영향가지 않게)
    if(e.ctrlKey && e.key.toLowerCase() === "z" && document.activeElement !== contentInput) {
        e.preventDefault();
        if(lastDeletedNote) {
            restoreDeletedNote();
        }
    }

    //다크모드 단축
    if(e.ctrlKey && e.key.toLowerCase() === "d") {
        e.preventDefault();

        currentTheme = currentTheme === "light" ? "dark" : "light";
        applyTheme(currentTheme);

        localStorage.setItem("theme", currentTheme);
        updateThemeButton();
    }

    //export 단축
    if(e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        exportNotes();
    }

    //import 단축
    if(e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "i") {
        //importInput을 누른 결과를 전달을 해야하는디
        e.preventDefault();
        importInput.click();

        titleInput.focus();
    }
});


//========================================
//note CRUD
//========================================
function addNote() {
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    //비어있으면
    if (!title && !content) return;

    if (isEditing) {
        notes = notes.map (note => {
            if(note.id === editingId) {
                const isChanged =
                    note.title !== title ||
                    note.content !== content ||
                    note.category !== categorySelect.value;
                
                if (isChanged) {
                    showMessage("메모가 수정되었습니다.");
                }

                return {
                     ...note,
                     title,
                     content,
                     category: categorySelect.value,
                     updatedAt: isChanged ?
                        Date.now() :
                        note.updatedAt
                };
            }
            return note;
        });

        isEditing = false;
        editingId = null;
        cancelEditBtn.style.display = "none";
    } else {
        const note = {
            id: Date.now(),
            title,
            content,
            pinned: false,
            category: categorySelect.value,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            expanded: true
        };

        notes.push(note);
        showMessage("메모가 저장되었습니다.");  
    }

    saveNotes();
    renderNotes();

    localStorage.removeItem("noteDraft");
    titleInput.value = "";
    contentInput.value = "";
    categorySelect.value = "general";
    addBtn.textContent = "추가";
    
    updateInputCounts();
    autoResizeContentarea();

    titleInput.focus();
}

function editNote(note) {
    titleInput.value = note.title;
    contentInput.value = note.content;
    categorySelect.value = note.category || "general";

    isEditing = true;
    editingId = note.id;
    addBtn.textContent = "수정 완료";
    cancelEditBtn.style.display = "inline-block";

    updateInputCounts();
    updateSaveStatus("✏️ 수정 중...");
    autoResizeContentarea();

    titleInput.focus();
}

function cancelEdit() {
    isEditing = false;
    editingId = null;

    titleInput.value = "";
    contentInput.value = "";
    categorySelect.value = "general";

    addBtn.textContent = "추가";
    cancelEditBtn.style.display = "none";
    localStorage.removeItem("noteDraft");

    showMessage("입력이 취소되었습니다.");
    titleInput.focus();
}

function deleteNote(id) {
    lastDeletedNote = notes.find(note => note.id === id);

    notes = notes.filter(note => note.id !== id);

    if (editingId === id) {
        cancelEdit();
    }
    
    saveNotes();
    renderNotes();
    showMessage(`
        메모가 삭제되었습니다.
        <button class="undo-btn">실행 취소</button>
    `);

    setupUndoHandler();
}

function setupUndoHandler() {
    const undoBtn = document.querySelector(".undo-btn");
    if(undoBtn) {
        undoBtn.addEventListener("click", restoreDeletedNote);
    }

    clearTimeout(undoTimer);
    undoTimer = null;
    undoTimer = setTimeout(() => {
        lastDeletedNote = null;
    }, 3000);
}

function restoreDeletedNote() {
    if(!lastDeletedNote) return;

    notes.push(lastDeletedNote);

    saveNotes();
    renderNotes();

    clearTimeout(undoTimer);

    lastDeletedNote = null;
    showMessage("메모가 복구되었습니다.");
}

function duplicateNote(id) {
    const originalNote = notes.find(note => note.id === id);

    if(!originalNote) return;

    const duplicateNote = {
        ...originalNote,
        id: Date.now(),
        title: `${originalNote.title} (복사본)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        expanded: true
    };

    notes.push(duplicateNote);

    saveNotes();
    renderNotes();
}

function togglePin(id) {
    notes = notes.map(note => {
        if (note.id === id) {
            return {...note, pinned: !note.pinned};
        }
        return note;
    })

    saveNotes();
    renderNotes();
}

//========================================
//Archive
//========================================
function archiveNote(id) {
    const targetNote = notes.find(note => note.id === id);

    if(!targetNote) return;

    archivedNotes.push(targetNote);

    notes = notes.filter(note => note.id !== id);

    if(editingId === id) cancelEdit();

    saveNotes();
    saveArchivedNotes();

    renderNotes();
}

function restoreArchivedNote(id) {
    const targetNote = archivedNotes.find(note => note.id === id);

    if(!targetNote) return;

    notes.push(targetNote);

    archivedNotes = archivedNotes.filter(note => note.id !== id);

    saveNotes();
    saveArchivedNotes();

    renderArchivedNotes();
    showMessage("메모가 복구되었습니다.");
}

function permanentDeleteNote(id) {
    archivedNotes = archivedNotes.filter(note => note.id !== id);

    saveArchivedNotes();
    renderArchivedNotes();
    showMessage("메모가 영구 삭제되었습니다.");
}

function renderArchivedNotes() {
    noteList.innerHTML = "";

    if(!archivedNotes.length) {
        renderArchivedStatus([]);
        renderEmptyMessage("📦 보관된 메모가 없습니다.");
        return;
    }

    const searchedArchivedNotes = filterBySearch(archivedNotes);

    const categoryFilteredArchivedNotes = filterByCategory(searchedArchivedNotes);

    renderArchivedStatus(categoryFilteredArchivedNotes);

    if(!categoryFilteredArchivedNotes.length) {
        renderEmptyMessage("📦 보관된 메모가 없습니다.");
        return;
    }

    const sortedArchivedNotes = sortNotes(categoryFilteredArchivedNotes);

    sortedArchivedNotes.forEach(note => {
        const card = createArchivedCard(note);

        noteList.appendChild(card);
    });
}

function renderArchivedStatus(filteredNotes) {
    noteStatus.textContent = `[${getCategoryIcon(currentCategory)} ${getCategoryLabel(currentCategory)}] 🔄${getSortLabel(currentSort)} 📦 보관 메모 ${filteredNotes.length}개`;
}

function archiveToggleExpanded(id) {
    archivedNotes = archivedNotes.map (note => {
        if(note.id === id) {
            return {
                ...note,
                expanded: !note.expanded
            };
        }

        return note;
    });

    saveArchivedNotes();
    renderArchivedNotes();
}

//========================================
//Filter & Sort
//========================================
function filterBySearch(notes) {
    return notes.filter(note => {
        const titleMatch = (note.title || "").toLowerCase().includes(searchText);
        const contentMatch = (note.content || "").toLowerCase().includes(searchText);

        return titleMatch || contentMatch;
    });
}

function filterByCategory(notes) {
    return notes.filter(note => {
        if (currentCategory === "all") return true;

        return note.category === currentCategory;
    });
}

function filterByPin(notes) {
    return notes.filter(note => {
        if (currentPin === "pinned") {
            return note.pinned;
        }

        if (currentPin === "normal") {
            return !note.pinned;
        }

        return true;
    });
}

function sortNotes(notes) {
    return [...notes].sort((a, b) => {
        if(b.pinned !== a.pinned) {
            //핀 기준 정렬
            return b.pinned - a.pinned;
        }

        //최신순 정렬 (05/18: id에서 createdAt으로 변경.)
        if (currentSort === "latest") {
            return b.createdAt - a.createdAt;
        }

        //오래된순 정렬
        if (currentSort === "oldest") {
            return a.createdAt - b.createdAt;
        }

        //제목순 정렬
        if (currentSort === "title") {
            return (a.title || "").localeCompare(b.title || "");
        }

        //최근 수정순 정렬
        if(currentSort === "updated") {
            return b.updatedAt - a.updatedAt;
        }

        return 0;
    });
}

function getSortLabel(sort) {
    if(sort === "latest") return "최신순";
    if(sort === "oldest") return "오래된순";
    if(sort === "title") return "제목순";
    if(sort === "updated") return "최근 수정순";
}

//========================================
//Rendering
//========================================
function renderNotes() {
    noteList.innerHTML = "";

    if(!notes.length) {
        renderStatus([]);
        renderEmptyMessage("메모가 없습니다!");
        return;
    }

    const searchedNotes = filterBySearch(notes);

    const categoryFilteredNotes = filterByCategory(searchedNotes);

    const pinnedNotes = filterByPin(categoryFilteredNotes);

    renderStatus(pinnedNotes);

    if(!pinnedNotes.length) {
        if (currentPin === "pinned" && searchText === "") {
            renderEmptyMessage("고정된 메모가 없습니다!");
        } else if (currentPin === "normal" && searchText === "") {
            renderEmptyMessage("일반 메모가 없습니다!");
        } else {
            renderEmptyMessage("검색 결과가 없습니다!");
        }

        return;
    }

    const sortedNotes = sortNotes(pinnedNotes);

    sortedNotes.forEach(note => {
        const card = createNoteCard(note);

        noteList.appendChild(card);
    });
}

function createNoteCard(note) {
    const card = document.createElement("div");
    card.classList.add("note-card");

    const isModified = note.updatedAt !== note.createdAt;

    card.innerHTML = `
        <h3>${note.title || "(제목 없음)"}</h3>

        <p class="note-card-category">카테고리: ${getCategoryLabel(note.category)}</p>

        ${note.expanded ? `<p>${note.content || "(내용 없음)"}</p>` : ""}
        <button class="child-btn expand-btn">${note.expanded ? "접기" : "펼치기"}</button>

        <p class="note-card-date">생성: ${formatDate(note.createdAt)}</p>
        
        ${
            isModified ?
            `<p class="note-card-date modified">✏️ 수정됨: ${formatDate(note.updatedAt)}</p>` :
            ""
        }

        <button class="child-btn pin-btn">${note.pinned ? "★" : "☆"}</button>

        <button class="child-btn edit-btn">수정</button>

        <button class="child-btn duplicate-btn">복제</button>

        <button class="child-btn archive-btn">보관</button>

        <button class="child-btn delete-btn">삭제</button>
    `;

    const delBtn = card.querySelector(".delete-btn");
    delBtn.addEventListener("click", () => deleteNote(note.id));

    const editBtn = card.querySelector(".edit-btn");
    editBtn.addEventListener("click", () => editNote(note));

    const pinBtn = card.querySelector(".pin-btn");
    pinBtn.addEventListener("click", () => togglePin(note.id));

    const expandBtn = card.querySelector(".expand-btn");
    expandBtn.addEventListener("click", () => toggleExpanded(note.id));

    const duplicateBtn = card.querySelector(".duplicate-btn");
    duplicateBtn.addEventListener("click", () => duplicateNote(note.id));

    const archiveBtn = card.querySelector(".archive-btn");
    archiveBtn.addEventListener("click", () => archiveNote(note.id));

    return card;
}

function createArchivedCard(note) {
    const card = document.createElement("div");
    card.classList.add("note-card");

    const isModified = note.updatedAt !== note.createdAt;

    card.innerHTML = `
        <h3>${note.title || "(제목 없음)"}</h3>

        <p class="note-card-category">카테고리: ${getCategoryLabel(note.category)}</p>

        ${note.expanded ? `<p>${note.content || "(내용 없음)"}</p>` : ""}
        <button class="child-btn expand-btn">${note.expanded ? "접기" : "펼치기"}</button>

        <p class="note-card-date">생성: ${formatDate(note.createdAt)}</p>
        
        ${
            isModified ?
            `<p class="note-card-date modified">✏️ 수정됨: ${formatDate(note.updatedAt)}</p>` :
            ""
        }

        <button class="child-btn restore-btn">복구</button>

        <button class="child-btn permanent-delete-btn">영구 삭제</button>
    `;

    const expandBtn = card.querySelector(".expand-btn");
    expandBtn.addEventListener("click", () => archiveToggleExpanded(note.id));

    const restoreBtn = card.querySelector(".restore-btn");
    restoreBtn.addEventListener("click", () => restoreArchivedNote(note.id));

    const permanentDelBtn = card.querySelector(".permanent-delete-btn");
    permanentDelBtn.addEventListener("click", () => permanentDeleteNote(note.id));

    return card;  
}

function renderEmptyMessage(message) {
    noteList.innerHTML = `
        <div class="empty-message">
            <p>${message}</p>
        </div>
    `;
}

function renderStatus(filteredNotes) {
    const pinnedCount = filteredNotes.filter(note => note.pinned).length;
    const archivedCount = archivedNotes.length;

    noteStatus.textContent = `[${getCategoryIcon(currentCategory)} ${getCategoryLabel(currentCategory)}] 🔄${getSortLabel(currentSort)} `;
    if(currentPin === "pinned" ) {
        noteStatus.textContent += ` 📌 고정 ${filteredNotes.length}개`;
    } else if (currentPin === "normal") {
        noteStatus.textContent += ` 📝 메모 ${filteredNotes.length}개`;
    } else if (currentPin === "all") {
        noteStatus.textContent += ` 📝 메모 ${filteredNotes.length}개 / 📌 고정 ${pinnedCount}개 / 📦 보관 ${archivedCount}개`;
    }
}

function toggleExpanded(id) {
    notes = notes.map (note => {
        if(note.id === id) {
            return {
                ...note,
                expanded: !note.expanded
            };
        }

        return note;
    });

    saveNotes();
    renderNotes();
}

//========================================
//Storage
//========================================
function saveNotes() {
    localStorage.setItem("notes", JSON.stringify(notes));

    updateSaveStatus("💾 저장되었습니다.");
}

function saveArchivedNotes() {
    localStorage.setItem("archivedNotes", JSON.stringify(archivedNotes));

    updateSaveStatus("📦 보관함에 추가되었습니다.");
}

function saveDraft() {
    const draft = {
        title: titleInput.value,
        content: contentInput.value,
        category: categorySelect.value,

        isEditing,
        editingId
    };

    localStorage.setItem("noteDraft", JSON.stringify(draft));
}

function loadDraft() {
    try {
        const saved = localStorage.getItem("noteDraft");

        if(!saved) return;

        const draft = JSON.parse(saved);

        titleInput.value = draft.title || "";
        contentInput.value = draft.content || "";
        categorySelect.value = draft.category || "general";

        if(draft.isEditing) {
            isEditing = true;
            editingId = draft.editingId;

            addBtn.textContent = "수정 완료";
            cancelEditBtn.style.display = "inline-block";
        }

        autoResizeContentarea();
    } catch {
        localStorage.removeItem("noteDraft");
    }
    
}

//========================================
//Import / Export
//========================================
function exportNotes() {
    if (!notes.length && !archivedNotes.length) {
        showMessage("저장할 메모가 없습니다.");
        return;
    }

    const isConfirmed = confirm("현재 메모를 내보내시겠습니까?");

    if(!isConfirmed) return;

    const exportData = {
        notes,
        archivedNotes
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: "application/json"});

    const url = URL.createObjectURL(blob);

    const date = new Date().toISOString().split("T")[0];
    const a = document.createElement("a");
    a.href = url;
    a.download = `note-${date}.json`;
    a.click();

    URL.revokeObjectURL(url);
    showMessage("메모를 내보냈습니다.");
    updateSaveStatus("📤 내보내기가 완료되었습니다.");
}

function importNotes(e) {
    const file = e.target.files[0];

    if (!file) return;

    const isConfirmed = confirm("현재 메모를 덮어쓰시겠습니까?");

    if (!isConfirmed) {
        importInput.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const importedNotes = JSON.parse(event.target.result);

            //importedNote가 객체인지 검증(null도 객체로 판정하기 때문에 함께 검증)
            if(typeof importedNotes !== "object" || importedNotes === null) throw new Error;

            //배열 검증
            if(!Array.isArray(importedNotes.notes)) throw new Error();
            if(!Array.isArray(importedNotes.archivedNotes)) throw new Error();

            //객체 구조 검증
            const notesValid = importedNotes.notes.every(note => {
                return (typeof note === "object" &&
                    note !== null &&
                    typeof note.id === "number" &&
                    typeof note.title === "string" &&
                    typeof note.content === "string"
                );
            });

            const archivedValid = importedNotes.archivedNotes.every(note => {
                return (typeof note === "object" &&
                    note !== null &&
                    typeof note.id === "number" &&
                    typeof note.title === "string" &&
                    typeof note.content === "string"
                );
            });

            if (!notesValid || !archivedValid) throw new Error();

            //기존 메모 덮어쓰기
            notes = importedNotes.notes.map(note => ({
                ...note,
                pinned: note.pinned ?? false,
                category: note.category ?? "general",
                createdAt: note.createdAt ?? note.id,
                updatedAt: note.updatedAt ?? note.createdAt ?? note.id,
                expanded: note.expanded ?? true
            }));

            archivedNotes = importedNotes.archivedNotes.map(note => ({
                ...note,
                pinned: note.pinned ?? false,
                category: note.category ?? "general",
                createdAt: note.createdAt ?? note.id,
                updatedAt: note.updatedAt ?? note.createdAt ?? note.id,
                expanded: note.expanded ?? true
            }));

            isEditing = false;
            editingId = null;
            cancelEditBtn.style.display = "none";
            
            localStorage.removeItem("noteDraft");
            titleInput.value = "";
            contentInput.value = "";
            addBtn.textContent = "추가";

            saveNotes();
            saveArchivedNotes();

            clearActiveButton();
            document.querySelector('[data-pin="all"]').classList.add("active");

            currentView = "notes";
            currentSort = "latest";
            currentCategory = "all";
            currentPin = "all";

            categoryFilter.value = currentCategory;
            sortSelectFilter.value = currentSort;

            localStorage.setItem("currentSort", currentSort);
            localStorage.setItem("currentCategory", currentCategory);
            localStorage.setItem("currentPin", currentPin);
            
            renderNotes();

            showMessage("메모를 불러왔습니다.");
            updateSaveStatus("📂 불러오기가 완료되었습니다.");
        } catch {
            showMessage("올바른 메모 파일이 아닙니다.");
        }

        //같은 파일 재선택 가능
        importInput.value = "";
    };
    reader.readAsText(file);
}

//========================================
//UI Helpers
//========================================
function showMessage(message) {
    clearTimeout(messageTimer);

    appMessage.innerHTML = message;
    appMessage.classList.add("show");

    messageTimer = setTimeout(() => {
        appMessage.classList.remove("show");
        setTimeout(() => {appMessage.innerHTML = ""}, 2000);
    }, 3000);
}

function updateInputCounts() {
    titleCount.textContent = `${titleInput.value.length} / 50`;
    contentCount.textContent = `${contentInput.value.length} / 500`;

    if(titleInput.value.length > 45) titleCount.classList.add("warning");
    else titleCount.classList.remove("warning");

    if(contentInput.value.length > 490) contentCount.classList.add("warning");
    else contentCount.classList.remove("warning");
}

function autoResizeContentarea() {
    //줄 삭제 후 높이가 줄어들지 않는 문제가 생길 수 있어, auto부터 대입.
    contentInput.style.height = "auto";
    contentInput.style.height = contentInput.scrollHeight + "px";
}

function applyTheme(theme) {
    document.body.classList.remove("light-theme", "dark-theme");

    document.body.classList.add(`${theme}-theme`);
}

function updateThemeButton() {
    themeToggleBtn.textContent = currentTheme === "light" ? "🌙 다크모드" : "☀️ 라이트모드";
}

function updateSaveStatus(message) {
    const time = new Date().toLocaleTimeString();

    saveStatus.textContent = `${message} (${time})`;
}

function clearActiveButton() {
    pinButtons.forEach(btn => {
        btn.classList.remove("active");
    });

    archiveViewBtn.classList.remove("active");
}

//========================================
//Utilities
//========================================
function formatDate(timestamp) {
    const date = new Date(timestamp);

    return date.toLocaleString();
}

function getCategoryLabel(category) {
    if(category === "general") return "일반";
    if(category === "study") return "공부";
    if(category === "work") return "작업";
    if(category === "idea") return "아이디어";

    return "전체";
}

function getCategoryIcon(category) {
    if(category === "general") return "📝";
    if(category === "study") return "📚";
    if(category === "work") return "💼";
    if(category === "idea") return "💡";

    return "📂";
}


//========================================
//Initialization
//홈페이지 실행 즉시 보여져야 하는 것.
//========================================
document.querySelector('[data-pin="all"]').classList.add("active");

currentSort = localStorage.getItem("currentSort") || "latest";
sortSelectFilter.value = currentSort;

currentCategory = localStorage.getItem("currentCategory") || "all";
categoryFilter.value = currentCategory;

currentPin = localStorage.getItem("currentPin") || "all";
clearActiveButton();
const activePinButton = document.querySelector(`[data-pin="${currentPin}"]`);
if(activePinButton) activePinButton.classList.add("active");

applyTheme(currentTheme);
updateThemeButton();
loadDraft();
updateInputCounts();
autoResizeContentarea();
renderNotes();
