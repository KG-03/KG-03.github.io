//===== Today =====
const today = document.querySelector(".today");

//===== Calendar =====
const calendarGrid = document.querySelector(".calendar-grid");
const currentDateText = document.querySelector(".current-date-text");
const weekRow = document.querySelector(".week-row");
const prevMonthBtn = document.querySelector(".prev-month-btn");
const nextMonthBtn = document.querySelector(".next-month-btn");
const calendarTooltip = document.querySelector(".calendar-tooltip");
const todayBtn = document.querySelector("#todayBtn");
const jumpDate = document.querySelector("#jumpDate");
const jumpDateBtn = document.querySelector("#jumpDateBtn");

//===== Input ======
const titleInput = document.querySelector(".title-input");
const timeInput = document.querySelector(".time-input");
const categorySelect = document.querySelector(".category-select");
const prioritySelect = document.querySelector(".priority-select");
const repeatSelect = document.querySelector(".repeat-select");
const descriptionInput = document.querySelector(".description-input");
const addBtn = document.querySelector(".add-btn");
const cancelEditBtn = document.querySelector(".cancel-edit-btn");
const selectedDate = document.querySelector(".selected-date");
const repeatEndArea = document.querySelector(".repeat-end-area");
const repeatEndDateInput = document.querySelector(".repeat-end-date-input");
const reminderArea = document.querySelector(".reminder-area");
const reminderSelect = document.querySelector(".reminder-select");

//===== Filter =====
const searchInput = document.querySelector(".search-input");
const categoryFilter = document.querySelector(".category-filter");
const priorityFilter = document.querySelector(".priority-filter");
const completedFilter = document.querySelector(".completed-filter");
const sortFilter = document.querySelector(".sort-filter");
const deletedFilter = document.querySelector(".deleted-filter");

//===== Util =====
const deleteAllBtn = document.querySelector(".delete-all-btn");
const bulkCompleteBtn = document.querySelector("#bulk-complete-btn");
const bulkDeleteBtn = document.querySelector("#bulk-delete-btn");
const bulkCancelBtn = document.querySelector("#bulk-cancel-btn");
const bulkAllSelectBtn = document.querySelector("#bulk-all-select-btn");
const bulkSelectedNumber = document.querySelector(".bulk-selected-number");
const deleteDateBtn = document.querySelector(".delete-date-btn");

//===== Schedule List =====
const scheduleList = document.querySelector(".schedule-list");

const statsList = document.querySelector(".stats-list");

//===== Complete =====
const completionRateArea = document.querySelector(".completion-rate-area");
const completionRateText = document.querySelector(".completion-rate-text");
const completionProgress = document.querySelector(".completion-progress");

//===== Storage =====
const exportBtn = document.querySelector(".export-btn");
const importBtn = document.querySelector(".import-btn");
const importInput = document.querySelector(".import-input");

//===== Toast =====
const toast = document.querySelector(".toast");

//===== Top Tool =====
const themeToggleBtn = document.querySelector(".theme-toggle-btn");
const helper = document.querySelector(".helper");
const helperTooltip = document.querySelector(".helper-tooltip");


const WEEK_NAMES = [ "일", "월", "화", "수", "목", "금", "토" ];

const CATEGORY_OPTIONS = {
    study: "공부",
    work: "업무",
    personal: "개인",
    exercise: "운동",
    etc: "기타"
};

const CATEGORY_ICON = {
    study: "📚",
    work: "💼",
    personal: "👤",
    exercise: "⚽",
    etc: "📂"    
};

const PRIORITY_OPTIONS = {
    high: "높음",
    medium: "보통",
    low: "낮음"
};

const PRIORITY_VALUE = {
    high: 3,
    medium: 2,
    low: 1
};

const REPEAT_OPTIONS = {
    none: "반복 안 함",
    daily: "매일",
    weekly: "매주",
    monthly: "매월",
    yearly: "매년"
};

const CSV = {
    ID: 0,
    TITLE: 1,
    CATEGORY: 2,
    PRIORITY: 3,
    DESCRIPTION: 4,
    DATE: 5,
    TIME: 6,
    REMINDER: 7,
    REPEAT: 8,
    REPEAT_END_DATE: 9,
    DELETED: 10,
    COMPLETED_DATES: 11,
    DELETED_DATES: 12,
    EXCEPTIONS: 13,
    CREATED_AT: 14,
    UPDATED_AT: 15
};

const CSV_LENGTH = Object.values(CSV).length;


let schedules = JSON.parse(localStorage.getItem("schedules")) || [];

schedules = schedules.map(schedule => ({
    ...schedule,
    reminder: schedule.reminder ?? "",
    repeat: schedule.repeat ?? "none",
    repeatEndDate: schedule.repeatEndDate ?? "",
    deleted: schedule.deleted ?? false,
    completedDates: schedule.completedDates ?? [],
    deletedDates: schedule.deletedDates ?? [],
    exceptions: schedule.exceptions ?? {}
}));

const todayDate = new Date();
let currentDateData = normalizeDate(new Date());
let selectedDateData = normalizeDate(new Date());

let currentCategory = "all";
let currentPriority = "all";
let currentCompleted = "all";
let currentSort = "latest";
let currentKeyword = "";
let currentCell = null;
let currentTheme = localStorage.getItem("theme") || "light";

let showDeleted = false;

let isEditing = false;
let editingId = null;
let editingMode = "all";
let editRepeatDate = "";

let toastTimer = null;
let toastRemoveTimer = null;

const notifiedSchedules = new Set();
const selectedScheduleIds = new Set();


prevMonthBtn.addEventListener("click", () => {
    currentDateData.setMonth(currentDateData.getMonth() - 1);

    if(currentCell) resetCell();
    renderCalendar();
});

nextMonthBtn.addEventListener("click", () => {
    currentDateData.setMonth(currentDateData.getMonth() + 1);

    if(currentCell) resetCell();
    renderCalendar();
});

addBtn.addEventListener("click", () => {
    if(!selectedDateData) {
        alert("날짜를 선택해 주십시오.");
        return;
    }

    if (isEditing) {
        updateSchedule();
    } else {
        addSchedule();
    }
});

cancelEditBtn.addEventListener("click", cancelEdit);

categoryFilter.addEventListener("change", () => {
    currentCategory = categoryFilter.value;
    renderSchedules();
});

priorityFilter.addEventListener("change", () => {
    currentPriority = priorityFilter.value;
    renderSchedules();
});

completedFilter.addEventListener("change", () => {
    currentCompleted = completedFilter.value;
    renderSchedules();
});

searchInput.addEventListener("input", () => {
    currentKeyword = searchInput.value.trim().toLowerCase();
    renderSchedules();
});

sortFilter.addEventListener("change", () => {
    currentSort = sortFilter.value;
    renderSchedules();
});

exportBtn.addEventListener("click", exportCSV);

importBtn.addEventListener("click", () => {
    importInput.click();
});

importInput.addEventListener("change", importCSV);

descriptionInput.addEventListener("keydown", (e) => {
    if(e.key === "Enter") {
        e.preventDefault();
    }

});

themeToggleBtn.addEventListener("click", () => {
    currentTheme = currentTheme === "light" ? "dark" : "light";

    localStorage.setItem("theme", currentTheme);

    applyTheme(currentTheme);
    updateThemeButton();
});

deletedFilter.addEventListener("change", () => {
    showDeleted = deletedFilter.checked;
    renderSchedules();
    updateBulkActionButton();

    if (showDeleted) {
        deleteAllBtn.textContent = "휴지통 비우기";
        deleteDateBtn.style.display = "none";
    }
    else {
        deleteAllBtn.textContent = "전체 삭제";
        deleteDateBtn.style.display = "inline-block";
    }
});

deleteAllBtn.addEventListener("click", () => {
    if(!showDeleted) {
        if(confirm("모든 일정을 휴지통으로 보내시겠습니까?")) {
            deleteAllSchedule();
        }
    } else {
        if(confirm("모든 날짜의 휴지통을 완전히 비우시겠습니까?\n비운 후에는 복구할 수 없습니다.")) {
            emptyTrash();
        }
    }
});

todayBtn.addEventListener("click", () => {
    moveToDate(new Date());
});

jumpDateBtn.addEventListener("click", () => {
    if(!jumpDate.value) return;

    const [year, month, date] = jumpDate.value.split("-").map(Number);

    moveToDate(new Date(year, month - 1, date));
});

bulkCompleteBtn.addEventListener("click", () => {
    const key = getDateKey(selectedDateData);

    selectedScheduleIds.forEach(id => {
        const schedule = schedules.find(schedule => schedule.id === id);

        if(!schedule) return;

        const original = schedule.originalSchedule || schedule;

        if(!original.completedDates.includes(key)) original.completedDates.push(key);
    });

    selectedScheduleIds.clear();

    refreshSchedules();
    updateBulkActionButton();
    updateSelectedScheduleCount();

    showToast("선택한 일정을 완료시켰습니다.");
});

bulkDeleteBtn.addEventListener("click", () => {
    if(!confirm("선택한 일정을 휴지통으로 보내시겠습니까?")) return;

    const key = getDateKey(selectedDateData);    
    
    selectedScheduleIds.forEach(id => {
        const schedule = schedules.find(schedule => schedule.id === id);

        if(!schedule) return;

        if(schedule.repeat === "none") {
            schedule.deleted = true;
            return;
        }

        if(schedule.deleted) return;

        if(!schedule.deletedDates.includes(key)) schedule.deletedDates.push(key);
    });

    selectedScheduleIds.clear();

    refreshSchedules();
    updateBulkActionButton();
    updateSelectedScheduleCount();

    showToast("선택한 일정을 완료시켰습니다.");
});

bulkCancelBtn.addEventListener("click", () => {
    resetBulkAction();
    updateSelectedScheduleCount();
});

bulkAllSelectBtn.addEventListener("click", () => {
    const visibleSchedules = getVisibleSchedulesForDate(selectedDateData, showDeleted);

    visibleSchedules.forEach(schedule => selectedScheduleIds.add(schedule.id));

    renderSchedules();
    updateBulkActionButton();
    updateSelectedScheduleCount();
})

repeatSelect.addEventListener("change", () => {
    if(repeatSelect.value === "none") {
        repeatEndArea.style.display = "none";
        repeatEndDateInput.value = "";
    } else {
        repeatEndArea.style.display = "block";
    }
})

timeInput.addEventListener("change", () => {
    if(timeInput.value === "") {
        reminderArea.style.display = "none";
        reminderSelect.value = "";
    } else {
        reminderArea.style.display = "block";
    }
});

helper.addEventListener("mouseenter", () => {
    const rect = helper.getBoundingClientRect();

    helperTooltip.style.left = rect.left + window.scrollX + "px";
    helperTooltip.style.top = rect.bottom + window.scrollY + 5 + "px";

    helperTooltip.style.display = "block";
});

helper.addEventListener("mouseleave", () => {
    helperTooltip.style.display = "none";
});

deleteDateBtn.addEventListener("click", () => {
    if(confirm("오늘 일정을 휴지통으로 보내시겠습니까?")) {
        deleteDateSchedule();
    }
})

document.addEventListener("keydown", function(e) {    
    if(e.key === "Escape" && (titleInput.value !== "" ||
                            timeInput.value !== "" ||
                            categorySelect.value !== "study" ||
                            prioritySelect.value !== "high" ||
                            repeatSelect.value !== "none" ||
                            descriptionInput.value !== "" ||
                            isEditing)) {
        cancelEdit();
        return;
    }

    //이 아래로는 입력창 바깥에서만 사용 가능한 단축키
    if(e.target.matches("input, textarea, select")) return;

    if(e.key === "PageUp") {
        e.preventDefault();
        prevMonthBtn.click();
        return;
    }
    if(e.key === "PageDown") {
        e.preventDefault();
        nextMonthBtn.click();
        return;
    }

    if(e.key.toLowerCase() === "t") {
        moveToDate(new Date());
        return;
    }

    //이 아래로는 입력 날짜가 필요한 단축키
    if(!selectedDateData) return;

    if(e.key === "ArrowLeft") {
        e.preventDefault();

        const previousDate = new Date(selectedDateData);
        previousDate.setDate(previousDate.getDate() - 1);

        moveToDate(previousDate);
        return;
    }
    if(e.key === "ArrowRight") {
        e.preventDefault();
        const nextDate = new Date(selectedDateData);
        nextDate.setDate(nextDate.getDate() + 1);

        moveToDate(nextDate);
        return;
    }

    if(e.key.toLowerCase() === "r") {
        refreshSchedules();
        return;
    }

    if(e.key.toLowerCase() === "a" && !showDeleted) {
        bulkAllSelectBtn.click();
        return;
    }
    if(e.key.toLowerCase() === "x") {
        bulkCancelBtn.click();
        return;
    }
    if(selectedScheduleIds.size > 0 && e.ctrlKey && e.key === "Delete") bulkDeleteBtn.click();

    if(e.ctrlKey && e.key === "Enter") {
        if(selectedScheduleIds.size > 0) bulkCompleteBtn.click();
        else if(!isEditing) addSchedule();
        else updateSchedule();

        return;
    }

    if(e.key.toLowerCase() === "d") {
        themeToggleBtn.click();
        return;
    }
});


function addSchedule() {
    if(!selectedDateData) return;

    const title = titleInput.value.trim();

    if(title === "") {
        alert("제목을 입력해 주십시오.");
        return;
    }

    const category = categorySelect.value;
    const priority = prioritySelect.value;
    const description = descriptionInput.value.trim();

    const scheduleDate = new Date(
        selectedDateData.getFullYear(),
        selectedDateData.getMonth(),
        selectedDateData.getDate()
    );

    const schedule = {
        id: Date.now(),
        title,
        category,
        priority,
        description,

        date: scheduleDate.getTime(),
        time: timeInput.value,
        reminder: reminderSelect.value === "" ? null : Number(reminderSelect.value),

        repeat: repeatSelect.value,
        repeatEndDate: repeatEndDateInput.value || "",
        deleted: false,

        completedDates: [],
        deletedDates: [],
        exceptions: {},

        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    schedules.push(schedule);

    refreshSchedules();
    resetScheduleForm();
    titleInput.focus();

    showToast("일정이 추가되었습니다.");
}

function startEdit(schedule, editMode = "all") {
    const originalSchedule = schedule.originalSchedule || schedule;

    if(!originalSchedule) return;

    isEditing = true;
    editingId = originalSchedule.id;
    editingMode = editMode;
    editRepeatDate = "";

    if(editingMode === "single") {
        titleInput.value = schedule.title;
        categorySelect.value = schedule.category;
        prioritySelect.value = schedule.priority;
        descriptionInput.value = schedule.description;
        timeInput.value = schedule.time;
        reminderSelect.value = schedule.reminder == null ? "" : String(schedule.reminder);
        repeatSelect.value = originalSchedule.repeat;

        repeatSelect.style.display = "none";

        repeatEndArea.style.display = "none";
        repeatEndDateInput.value = "";
    }
    else {
        titleInput.value = originalSchedule.title;
        categorySelect.value = originalSchedule.category;
        prioritySelect.value = originalSchedule.priority;
        descriptionInput.value = originalSchedule.description;
        timeInput.value = originalSchedule.time;
        reminderSelect.value = originalSchedule.reminder == null ? "" : String(originalSchedule.reminder);
        repeatSelect.value = originalSchedule.repeat;

        repeatSelect.style.display = "block";

        if(originalSchedule.repeat === "none") {
            repeatEndArea.style.display = "none";
            repeatEndDateInput.value = "";
        } else {
            repeatEndArea.style.display = "block";
            repeatEndDateInput.value = originalSchedule.repeatEndDate || "";
        }


        //반복 일정은 '최초 만들었던 일정'을 수정하는 게 아닌 이상, Date 수정 불가
        const repeatOriginDate = new Date(originalSchedule.date);
        repeatOriginDate.setHours(0, 0, 0, 0);
        if(getDateKey(repeatOriginDate) === getDateKey(selectedDateData)) {
            editRepeatDate = new Date(originalSchedule.date);
        }
    }

    if(timeInput.value === "") {
        reminderArea.style.display = "none";
        reminderSelect.value = "";
    } else {
        reminderArea.style.display = "block";
    }

    addBtn.textContent = "수정 완료";
    cancelEditBtn.style.display = "inline-block";

    titleInput.focus();
}

function updateSchedule() {
    const editSchedule = schedules.find(schedule => schedule.id === editingId);

    if(!editSchedule) return;

    const repeatEndDateData = repeatEndDateInput.value || null;
    const reminderData = timeInput.value === "" ? null : (
                        reminderSelect.value === "" ? null : Number(reminderSelect.value));

    const isChanged = editSchedule.title !== titleInput.value.trim() ||
                      editSchedule.category !== categorySelect.value ||
                      editSchedule.priority !== prioritySelect.value ||
                      editSchedule.reminder !== reminderData ||
                      editSchedule.repeat !== repeatSelect.value ||
                      editSchedule.repeatEndDate !== repeatEndDateData ||
                      editSchedule.description !== descriptionInput.value.trim() ||
                      (editRepeatDate !== "" && editSchedule.date !== selectedDateData.getTime()) ||
                      editSchedule.time !== timeInput.value;

    if(!isChanged) {
        refreshSchedules();
        resetScheduleForm();
        titleInput.focus();

        showToast("수정된 일정이 없습니다.");
        return;
    }

    if(titleInput.value.trim() === "") {
        alert("제목을 입력해 주십시오.");
        return;
    }

    if(editingMode === "single") {
        const key = getDateKey(selectedDateData);

        editSchedule.exceptions[key] = {
            ...editSchedule.exceptions[key],
            title: titleInput.value.trim(),
            category: categorySelect.value,
            priority: prioritySelect.value,
            description: descriptionInput.value.trim(),
            time: timeInput.value,
            reminder: reminderData,
            updatedAt: Date.now()
        }
    } else {
        editSchedule.title = titleInput.value.trim();
        editSchedule.category = categorySelect.value;
        editSchedule.priority = prioritySelect.value;
        editSchedule.repeat = repeatSelect.value;
        editSchedule.repeatEndDate = repeatEndDateData;
        editSchedule.description = descriptionInput.value.trim();
        editSchedule.time = timeInput.value;
        editSchedule.reminder = reminderData,
        editSchedule.updatedAt = Date.now();

        if(editRepeatDate !== "") {
            shiftRepeatSchedule(editSchedule, editRepeatDate, selectedDateData);
        }
    }

    isEditing = false;
    editingId = null;
    editRepeatDate = "";

    refreshSchedules();
    resetScheduleForm();
    titleInput.focus();

    showToast("일정이 수정되었습니다.");
}

function cancelEdit() {
    isEditing = false;
    editingId = null;
    editRepeatDate = "";

    resetScheduleForm();
    titleInput.focus();

    showToast("취소되었습니다.");
}

function copySchedule(id, targetDate) {
    const copySchedule = schedules.find(schedule => schedule.id === id);

    if(!copySchedule) return;
    if(!targetDate) return;

    const newSchedule = {
        ...copySchedule,

        id: Date.now(),
        title: copySchedule.title + " (복사)",

        date: targetDate.getTime(),

        deleted: false,
        completedDates: [],
        deletedDates: [],
        exceptions: {},
        
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    schedules.push(newSchedule);

    refreshSchedules();
    resetScheduleForm();
    titleInput.focus();

    showToast("일정이 복제되었습니다.");
}

function deleteSchedule(id) {
    const delTargetSchedule = schedules.find(schedule => schedule.id === id);

    if(!delTargetSchedule) return;

    if(delTargetSchedule.repeat === "none") {
        deleteNormalSchedule(id);
        return;
    }

    const answer = prompt("이번 일정만 삭제하시겠습니까?\n1: 이번 날짜만 삭제\n2: 반복 일정 전체 삭제\n그 외: 취소");

    if(answer === "1") {
        deleteRepeatOccurrence(delTargetSchedule, selectedDateData);
    }
    
    if(answer === "2") {
        delTargetSchedule.deleted = true;
        refreshSchedules();
        showToast(`반복 일정 전체를 휴지통으로 보냈습니다.`);
    }
}

function deleteNormalSchedule(id) {
    if(!confirmMessage("일정을 휴지통으로 보내겠습니까?")) return;

    const schedule = schedules.find(s => s.id === id);

    if(!schedule) return;
    
    schedule.deleted = true;

    refreshSchedules();

    showToast("일정을 휴지통으로 보냈습니다.");
}

function deleteRepeatOccurrence(schedule, targetDate) {
    const key = getDateKey(targetDate);

    if(!schedule.deletedDates.includes(key)) {
        schedule.deletedDates.push(key);
    }

    refreshSchedules();

    showToast("이번 일정만 삭제되었습니다.");
}

function permanentDeleteSchedule(schedule, targetDate = null) {
    if(!confirm("완전히 삭제하시겠습니까?\n삭제한 일정은 복구할 수 없습니다.")) return;

    if(targetDate) {
        const key = getDateKey(targetDate);
        schedule.deletedDates = schedule.deletedDates.filter(date => date !== key);
        console.log("반복 일정 삭제");
    } else {
        schedules = schedules.filter(s => s.id !== schedule.id);
        console.log("일반 일정 삭제");
    }

    refreshSchedules();
    showToast("일정을 완전히 삭제되었습니다.");
}

function deleteAllSchedule() {
    schedules.forEach(schedule => {
        schedule.deleted = true;
    });

    refreshSchedules();

    showToast("모든 일정이 휴지통으로 이동되었습니다.");
}

function deleteDateSchedule() {
    const dateSchedules = getVisibleSchedulesForDate(selectedDateData, false);

    dateSchedules.forEach(schedule => {
        const original = schedule.originalSchedule || schedule;

        if(original.repeat === "none") original.deleted = true;
        else {
            const key = getDateKey(selectedDateData);

            if(!original.deletedDates.includes(key)) original.deletedDates.push(key);
        }
    });

    refreshSchedules();

    showToast("선택한 날짜의 일정이 휴지통으로 이동되었습니다.");
}

function emptyTrash() {
    schedules = schedules.filter(schedule => {
        return !schedule.deleted;
    });

    refreshSchedules();
    showToast("휴지통을 비웠습니다.");
}

function restoreSchedule(schedule, targetDate = null) {
    if(targetDate) {
        const key = getDateKey(targetDate);
        schedule.deletedDates = schedule.deletedDates.filter(date => date !== key);
    } else {
        schedule.deleted = false;
        console.log("일반 일정 복구");
    }

    refreshSchedules();
    showToast("일정이 복구되었습니다.");
}

function restoreException(schedule, targetDate) {
    const key = getDateKey(targetDate);

    if(!schedule.exceptions[key]) return;

    delete schedule.exceptions[key];

    saveSchedules();
    refreshSchedules();

    showToast("원래 반복 일정으로 복구되었습니다.");
}

function saveSchedules() {
    localStorage.setItem("schedules", JSON.stringify(schedules));
}

function createScheduleCard(schedule) {
    const card = document.createElement("div");
    card.classList.add("schedule-card");

    if(isCompleted(schedule, selectedDateData)) {
        card.classList.add("completed");
    }

    const header = document.createElement("div");
    header.classList.add("card-header");

        if(!showDeleted) {
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = isCompleted(schedule, selectedDateData);
            checkbox.addEventListener("change", () => {
                checkboxToggle(schedule, checkbox);

                if(isCompleted(schedule, selectedDateData)) {
                    card.classList.add("completed");
                } else {
                    card.classList.remove("completed");
                }

                refreshSchedules();
            });
            header.append(checkbox); 
        } else {
            card.classList.remove("complete");
        }
    
        const title = document.createElement("h4");
        title.textContent = `${schedule.title}`;
        header.append(title);

    card.append(header);

    if(schedule.time) {
        const time = document.createElement("p");
        time.textContent = `🕒 ${schedule.time}`;
        card.append(time);

        if(schedule.reminder) {
            const reminder = document.createElement("p");
            reminder.textContent = `🔔 ${schedule.reminder}분 전 알림`;
            card.append(reminder);
        }

        if(isExpiredSchedule(schedule, selectedDateData)) {
            card.classList.add("expired-schedule");
        }
    }

    const classification = document.createElement("div");
    classification.classList.add("card-classification");

        const category = document.createElement("p");
        category.textContent = `카테고리: ${CATEGORY_OPTIONS[schedule.category]}`;
        category.addEventListener("click", () => {
            const select = document.createElement("select");

            Object.entries(CATEGORY_OPTIONS).forEach(([value, label]) => {
                const option = document.createElement("option");

                option.value = value;
                option.textContent = label;

                if (value === schedule.category) option.selected = true;

                select.append(option);
            });

            const changeCancelBtn = document.createElement("button");
            changeCancelBtn.textContent = "취소";

            const wrapper = document.createElement("div");
            wrapper.append(select, changeCancelBtn);

            category.replaceWith(wrapper);
            select.focus();

            select.addEventListener("change", () => {
                changeScheduleField(schedule, "category", select.value);
            });

            changeCancelBtn.addEventListener("click", () => {
                wrapper.replaceWith(category);
            });

            select.addEventListener("keydown", (e) => {
                if(e.key === "Escape") wrapper.replaceWith(category);
            });
        });
        classification.append(category);
        
        const priority = document.createElement("p");
        priority.textContent = `우선순위: ${PRIORITY_OPTIONS[schedule.priority]}`;
        priority.addEventListener("click", () => {
            const select = document.createElement("select");

            Object.entries(PRIORITY_OPTIONS).forEach(([value, label]) => {
                const option = document.createElement("option");

                option.value = value;
                option.textContent = label;

                if (value === schedule.priority) option.selected = true;

                select.append(option);
            });

            const changeCancelBtn = document.createElement("button");
            changeCancelBtn.textContent = "취소";

            const wrapper = document.createElement("div");
            wrapper.append(select, changeCancelBtn);

            priority.replaceWith(wrapper);
            select.focus();

            select.addEventListener("change", () => {
                changeScheduleField(schedule, "priority", select.value);
            });

            changeCancelBtn.addEventListener("click", () => {
                wrapper.replaceWith(priority);
            });

            select.addEventListener("keydown", (e) => {
                if(e.key === "Escape") wrapper.replaceWith(priority);
            });
        });
        classification.append(priority);

        const repeat = document.createElement("p");
        repeat.textContent = `🔁 ${REPEAT_OPTIONS[schedule.repeat]}`;
        classification.append(repeat);

    card.append(classification);

    if(schedule.description) {
        const description = document.createElement("p");
        description.textContent = `${schedule.description}`;
        card.append(description);
    }

    const date = document.createElement("p");
    date.classList.add("card-date-text");
    date.textContent = `생성일: ${formatDate(schedule.createdAt)}`;
    if(schedule.createdAt !== schedule.updatedAt) {
        date.textContent += `\n수정일: ${formatDate(schedule.updatedAt)}`;
    }
    card.append(date);

    const selectedCheckbox = document.createElement("input");
    selectedCheckbox.type = "checkbox";
    selectedCheckbox.classList.add("schedule.select");
    selectedCheckbox.checked = selectedScheduleIds.has(schedule.id);
    selectedCheckbox.addEventListener("change", () => {
        if(selectedCheckbox.checked) selectedScheduleIds.add(schedule.id);
        else selectedScheduleIds.delete(schedule.id);

        updateBulkActionButton();
        updateSelectedScheduleCount();
    });
    card.append(selectedCheckbox);

    if(showDeleted) {
        const restoreBtn = document.createElement("button");
        restoreBtn.textContent = "♻️ 복구";
        restoreBtn.addEventListener("click", () => {
            const targetSchedule = schedule.originalSchedule || schedule;

            if(targetSchedule.deleted) {
                restoreSchedule(targetSchedule);
            } else {
                restoreSchedule(targetSchedule, selectedDateData);
            }
        });
        card.append(restoreBtn);

        const isRepeatOccurrenceDeleted = schedule.repeat !== "none" && !schedule.deleted;
        if(!isRepeatOccurrenceDeleted) {
            const permanentDelBtn = document.createElement("button");
            permanentDelBtn.textContent = "❌ 완전 삭제";
            permanentDelBtn.addEventListener("click", () => {
                const targetSchedule = schedule.originalSchedule || schedule;

                if(targetSchedule.deleted) {
                    permanentDeleteSchedule(targetSchedule);
                } else {
                    permanentDeleteSchedule(targetSchedule, selectedDateData);
                }
            })
            card.append(permanentDelBtn);
        }

    } else{
        const editBtn = document.createElement("button");
        editBtn.textContent = "✏️ 수정";
        editBtn.addEventListener("click", () => {
            if(schedule.repeat === "none") {
                startEdit(schedule, "all");
                return;
            }

            const answer = prompt("반복 일정입니다.\n이번 날짜의 일정만 수정하시겠습니까?\n1: 이번 일정만 수정\n2: 반복 일정 전체 수정\n그 외: 취소");

            if(answer === "1") startEdit(schedule, "single");
            if(answer === "2") startEdit(schedule, "all");
        });
        card.append(editBtn);

        if (schedule.repeat !== "none" &&
            hasException(schedule, selectedDateData)) {
                const restoreRepeatBtn = document.createElement("button");
                restoreRepeatBtn.textContent = "↩ 원래 일정 복원";

                restoreRepeatBtn.addEventListener("click", () => {
                    restoreException(schedule, selectedDateData);
                });

            card.append(restoreRepeatBtn);
        }

        const copyBtn = document.createElement("button");
        copyBtn.textContent = "📋 복제";
        copyBtn.addEventListener("click", () => {
            if(card.querySelector(".copy-date-area")) return;

            const copyDateArea = document.createElement("div");
            copyDateArea.classList.add("copy-date-area");

            const copyDateInput = document.createElement("input");
            copyDateInput.type = "date";

            const copyConfirmBtn = document.createElement("button");
            copyConfirmBtn.textContent = "복제";

            copyConfirmBtn.addEventListener("click", () => {
                if(!copyDateInput.value) {
                    alert("복제할 날짜를 선택해 주세요.");
                    return;
                }

                const [year, month, date] = copyDateInput.value.split("-").map(Number);

                const targetDate = new Date(year, month - 1, date);
                targetDate.setHours(0, 0, 0, 0);

                copySchedule(schedule.id, targetDate);
            });

            copyDateArea.append(copyDateInput, copyConfirmBtn);
            card.append(copyDateArea);
        });
        card.append(copyBtn);

        const delBtn = document.createElement("button");
        delBtn.textContent = "🗑️ 삭제"
        delBtn.addEventListener("click", () => {
            deleteSchedule(schedule.id);
        });
        card.append(delBtn);
    }

    return card;
}

function checkboxToggle(schedule, checkbox) {
    //originalSchedule는 getVisibleSchedulesForDate()에서부터 받을 수 있다.
    const original = schedule.originalSchedule || schedule;
    const key = getDateKey(selectedDateData);

    if(checkbox.checked) {
        if(!original.completedDates.includes(key)) {
            original.completedDates.push(key);
        }
    } else {
        original.completedDates = original.completedDates.filter(date => date !== key);
    }

    saveSchedules();
}

function isExpiredSchedule(schedule, targetDate) {
    if (!schedule.time) return false;
    if (!targetDate) return false;

    const now = new Date();

    const [hour, minute] = schedule.time.split(":");
    
    const scheduleCardDate = new Date(targetDate);
    scheduleCardDate.setHours(Number(hour));
    scheduleCardDate.setMinutes(Number(minute));
    scheduleCardDate.setSeconds(0);
    scheduleCardDate.setMilliseconds(0);

    return scheduleCardDate < now && !isCompleted(schedule, targetDate);
}

//===== Render ======
function renderCalendar() {
    calendarGrid.innerHTML = "";
    weekRow.innerHTML = "";

    const year = currentDateData.getFullYear();
    const month = currentDateData.getMonth();
    
    currentDateText.textContent = `${year}년 ${String(month + 1).padStart(2, "0")}월`;
    
    WEEK_NAMES.forEach(day => {
        const cell = document.createElement("div");
        cell.textContent = day;

        weekRow.append(cell);
    });

    const lastDate = new Date(year, month + 1, 0).getDate();

    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay();

    for(let i = 0; i < firstDayOfWeek; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.classList.add("empty-cell");
        calendarGrid.append(emptyCell);
    }

    for (let date = 1; date <= lastDate; date++) {
        const dateCell = document.createElement("div");
        dateCell.classList.add("date-cell");
        dateCell.dataset.year = year;
        dateCell.dataset.month = month;
        dateCell.dataset.date = date;

            const dateNumber = document.createElement("span");
            dateNumber.textContent = date;
            dateCell.append(dateNumber);

            const dayDate = new Date(year, month, date);
            const completeStats = getDayScheduleCompleteStats(dayDate);
            
            const badgeArea = document.createElement("div");
            badgeArea.classList.add("schedule-badge-area");

                if (completeStats.incomplete > 0) {
                    const incompleteBadge = document.createElement("span");
                    incompleteBadge.classList.add("schedule-badge", "incomplete-badge");
                    incompleteBadge.textContent = completeStats.incomplete;
                    badgeArea.append(incompleteBadge);
                }

                if(completeStats.completed > 0) {
                    const completeBadge = document.createElement("span");
                    completeBadge.classList.add("schedule-badge", "complete-badge");
                    completeBadge.textContent = completeStats.completed;
                    badgeArea.append(completeBadge);
                }

            dateCell.append(badgeArea);

        dateCell.addEventListener("mouseenter", () => {
            showTooltip(dateCell, year, month, date);
        });

        dateCell.addEventListener("mouseleave", () => {
            hideTooltip();
        });            

        dateCell.addEventListener("click", () => {
            selectCalendarCell(year, month, date, dateCell);
            resetBulkAction();
            updateSelectedScheduleCount();
        });
        
        calendarGrid.append(dateCell);

        if(year === todayDate.getFullYear() &&
        month === todayDate.getMonth() &&
        date === todayDate.getDate()) {
            dateCell.classList.add("today-cell");
        }
    }
}

function getDayScheduleCompleteStats(date) {
    const schedule = getVisibleSchedulesForDate(date, false);

    const completed = schedule.filter(s => isCompleted(s, date)).length;

    return {
        total: schedule.length,
        completed,
        incomplete: schedule.length - completed
    };
}

function renderSchedules() {
    scheduleList.innerHTML = "";
    statsList.innerHTML = "";

    if(!selectedDateData) {
        scheduleList.textContent = "날짜를 선택해 주세요.";
        renderCompletionRate([]);
        return;
    }

    if(!schedules.length) {
        scheduleList.textContent = `📅 등록된 일정이 아무 것도 없습니다.
            달력에서 날짜를 선택해서 새 일정을 등록해 보세요.`;
        renderCompletionRate([]);
        return;
    }

    const visibleSchedules = getVisibleSchedulesForDate(selectedDateData, false);
    renderCompletionRate(visibleSchedules);

    let filteredSchedule = [...schedules];

    filteredSchedule = getVisibleSchedulesForDate(selectedDateData, showDeleted);
    filteredSchedule = filterByCategory(filteredSchedule);
    filteredSchedule = filterByPriority(filteredSchedule);
    filteredSchedule = filterByCompleted(filteredSchedule);
    filteredSchedule = filterByKeyword(filteredSchedule);
    filteredSchedule = sortSchedules(filteredSchedule);

    if(filteredSchedule.length === 0 &&
        currentCategory === "all" &&
        currentPriority === "all" &&
        currentCompleted === "all" &&
        currentKeyword === "") {
        scheduleList.textContent = `📅 오늘 날짜에 등록된 일정이 없습니다. 새 일정을 등록해 보세요.`;
        return;
    } else if (filteredSchedule.length === 0 && currentCategory !== "all") {
        scheduleList.textContent = `📅 해당 카테고리에 해당하는 일정이 없습니다.`;
        return;
    } else if (filteredSchedule.length === 0 && currentPriority !== "all") {
        scheduleList.textContent = `📅 해당 우선순위에 해당하는 일정이 없습니다.`;
        return;
    } else if (filteredSchedule.length === 0 && currentCompleted !== "all") {
        scheduleList.textContent = `📅 해당 완료 상황에 해당하는 일정이 없습니다.`;
        return;
    } else if (filteredSchedule.length === 0 && currentCompleted !== "all") {
        scheduleList.textContent = `📅 해당 완료 상황에 해당하는 일정이 없습니다.`;
        return;
    } else if (filteredSchedule.length === 0 &&  currentKeyword !== "") {
        scheduleList.textContent = `📅 해당 키워드에 해당하는 일정이 없습니다.`;
        return;
    }
    
    filteredSchedule.forEach(schedule => {
        scheduleList.append(createScheduleCard(schedule));
    });

    if(!showDeleted) renderStatistics(filteredSchedule);
}

function renderTodaysDate() {
    const year = todayDate.getFullYear();
    const month = String(todayDate.getMonth() + 1).padStart(2, "0");
    const day = String(todayDate.getDate()).padStart(2, "0");
    today.innerHTML = `Today: ${year}년 ${month}월 ${day}일`;
}

function renderStatistics(schedules) {
    const stats = getStatistics(schedules);

    statsList.innerHTML = "";
    statsList.classList.add("statistics-area");

    renderStatisticsSection("전체 일정", stats.total);
    renderStatisticsSection("완료", stats.complete);
    renderStatisticsSection("미완료", stats.incomplete);

    renderStatisticsSection("공부", stats.category.study);
    renderStatisticsSection("업무", stats.category.work);
    renderStatisticsSection("개인", stats.category.personal);
    renderStatisticsSection("운동", stats.category.exercise);
    renderStatisticsSection("기타", stats.category.etc);    
}

function renderStatisticsSection(title, count) {
    const stats = document.createElement("p");
    stats.textContent = `${title} : ${count}`;
    stats.classList.add("statistics-box");
    statsList.append(stats);
}

function selectCalendarCell(year, month, date, cell = null) {
    if (currentCell) {
        currentCell.classList.remove("click-cell");
    }

    if(cell === null) {
        cell = document.querySelector(`.date-cell[data-year="${year}"][data-month="${month}"][data-date="${date}"]`);

    }

    currentCell = cell;

    if(currentCell) {
        currentCell.classList.add("click-cell");
    }

    selectedDateData = new Date(year, month, date);
    selectedDate.textContent = `선택 날짜: ${year}년 ${month + 1}월 ${date}일`;

    renderSchedules();
}

function showTooltip(dateCell, year, month, date) {
    const daySchedules = getVisibleSchedulesForDate(new Date(year, month, date));

    if(daySchedules.length === 0) return;

    daySchedules.sort((a,b) => {
        if(!a.time && !b.time) return 0;
        if(!a.time) return 1;
        if(!b.time) return -1;

        return a.time.localeCompare(b.time);
    });

    calendarTooltip.innerHTML = "";

    const title = document.createElement("storng");
    title.textContent = `${month + 1}월 ${date}일`;
    calendarTooltip.append(title);

    const previewSchedules = daySchedules.slice(0, 4);

    previewSchedules.forEach(schedule => {
        const p = document.createElement("p");
        const previewTargetDate = new Date(year, month, date);
        const repeat = schedule.repeat !== "none" ? "[반복]" : "";
        p.textContent = `🕒${schedule.time || "--:--"} ${CATEGORY_ICON[schedule.category]} ${repeat} ${schedule.title.length > 10 ? schedule.title.slice(0,10) + "..." : schedule.title} ${isCompleted(schedule, previewTargetDate) === true ? "✔️" : ""} `;
        calendarTooltip.append(p);
    });

    const remainCount = daySchedules.length - previewSchedules.length;
    if(remainCount > 0) {
        const p = document.createElement("p");
        p.textContent = `+${remainCount}개의 일정`;
        calendarTooltip.append(p);
    }

    const rect = dateCell.getBoundingClientRect();
    calendarTooltip.style.left = rect.left + window.scrollX + "px";
    calendarTooltip.style.top = rect.bottom + window.scrollY + 5 + "px";

    calendarTooltip.style.display = "block";
}

function hideTooltip() {
    calendarTooltip.style.display = "none";
}

function renderCompletionRate(schedule) {
    if(showDeleted) {
        completionRateText.textContent = "";
        completionProgress.style.width = "0%";
        completionRateArea.style.display = "none";
        return;
    } else {
        completionRateArea.style.display = "block";
    }
    
    const total = schedule.length;

    if (total === 0) {
        completionRateText.textContent = "0%";
        completionProgress.style.width = "0%";
        return;
    }

    const complete = schedule.filter(s => {
        return isCompleted(s, selectedDateData);
    }).length;

    const rate = Math.round((complete / total) * 100);

    completionRateText.textContent = `${rate}%`;
    completionProgress.style.width = `${rate}%`;
}

//===== Reset =====
function resetCell() {
    if(!currentCell) return; 
    
    currentCell.classList.remove("click-cell");

    selectedDateData = null;
    currentCell = null;
    
    selectedDate.textContent = `선택 날짜:`

    renderSchedules();
}

function resetScheduleForm() {
    repeatSelect.style.display = "block";
    
    titleInput.value = "";
    descriptionInput.value = "";
    categorySelect.value = "study";
    prioritySelect.value = "high";

    timeInput.value = "";

    reminderSelect.value = "";
    reminderArea.style.display = "none";
    
    repeatSelect.value = "none";
    repeatEndDateInput.value = "";
    repeatEndArea.style.display = "none";
    
    addBtn.textContent = "✓ 추가";
    cancelEditBtn.style.display = "none";
}

//===== Filter =====
function getVisibleSchedulesForDate(targetDate, includeDeleted = false) {
    const key = getDateKey(targetDate);

    return schedules.filter(schedule => {

        if(!isRepeatSchedule(schedule, targetDate)) return false;

        //일반
        if(schedule.repeat === "none") return includeDeleted ? schedule.deleted : !schedule.deleted;

        //반복일정 전체삭제
        if(schedule.deleted) return includeDeleted;
        
        //반복일정 특정날짜삭제
        const deleted = schedule.deletedDates.includes(key);
        return includeDeleted ? deleted : !deleted;
    }).map(schedule => {
        if(schedule.exceptions[key]) {
            return {
                ...schedule,
                ...schedule.exceptions[key],

                originalSchedule: schedule
            };
        }

        return schedule;
    });
}

function isRepeatSchedule(schedule, targetDate) {
    if(!targetDate) return false;
    targetDate.setHours(0, 0, 0, 0);
    
    const scheduleDate = new Date(schedule.date);

    if(schedule.repeat !== "none" && schedule.repeatEndDate) {
        const endDate = new Date(schedule.repeatEndDate);
        endDate.setHours(0, 0, 0, 0);

        if(targetDate > endDate) return false;
    }

    switch(schedule.repeat) {
        case "none":
            return getDateKey(scheduleDate) === getDateKey(targetDate);

        case "daily":
            return targetDate >= scheduleDate;

        case "weekly":
            return (
                targetDate >= scheduleDate &&
                targetDate.getDay() === scheduleDate.getDay()
            );

        case "monthly":
            return (
                targetDate >= scheduleDate &&
                targetDate.getDate() === scheduleDate.getDate()
            );

        case "yearly":
            return (
                targetDate >= scheduleDate &&
                targetDate.getMonth() === scheduleDate.getMonth() &&
                targetDate.getDate() === scheduleDate.getDate()
            );

        default:
            return false;
    }

    return false;
}

function filterByCategory(filteredSchedule) {
    if(currentCategory !== "all") {
        filteredSchedule = filteredSchedule.filter(schedule => schedule.category === currentCategory);
    }

    return filteredSchedule;
}

function filterByPriority(filteredSchedule) {
    if(currentPriority !== "all") {
        filteredSchedule = filteredSchedule.filter(schedule => schedule.priority === currentPriority);
    }
    return filteredSchedule;
}

function filterByCompleted(filteredSchedule) {
    if(currentCompleted === "completed") {
        filteredSchedule = filteredSchedule.filter(schedule => isCompleted(schedule, selectedDateData));
    } else if (currentCompleted === "uncompleted") {
        filteredSchedule = filteredSchedule.filter(schedule => !isCompleted(schedule, selectedDateData));
    }

    return filteredSchedule;
}

function filterByKeyword(filteredSchedule) {
    if(currentKeyword === "") return filteredSchedule;

    return filteredSchedule.filter(schedule => {
        const titleMatch = (schedule.title || "").toLowerCase().includes(currentKeyword);
        const descriptionMatch = (schedule.description || "").toLowerCase().includes(currentKeyword);

        return titleMatch || descriptionMatch;
    });
}

function sortSchedules(filteredSchedule) {
    return [...filteredSchedule].sort((a,b) => {
        const completedA = isCompleted(a, selectedDateData);
        const completedB = isCompleted(b, selectedDateData);

        if(completedA !== completedB) {
            return completedA - completedB;
        }

        switch(currentSort) {
            case "time-desc":
                if(!a.time && !b.time) return 0;
                if(!a.time) return 1;
                if(!b.time) return -1;

                return a.time.localeCompare(b.time);

            case "time-asc":
                if(!a.time && !b.time) return 0;
                if(!a.time) return 1;
                if(!b.time) return -1;

                return b.time.localeCompare(a.time);

            case "latest":
                return b.createdAt - a.createdAt;

            case "oldest":
                return a.createdAt - b.createdAt;

            case "priority-desc":
                return PRIORITY_VALUE[b.priority] - PRIORITY_VALUE[a.priority];

            case "priority-asc":
                return PRIORITY_VALUE[a.priority] - PRIORITY_VALUE[b.priority];
        }

        return 0;
    })
}

//===== Storage(CSV) =====
function exportCSV() {
    if(!schedules.length) {
        alert("내보낼 일정이 없습니다.");
        return;
    }

    const rows = [
        [
            "id",
            "title",
            "category",
            "priority",
            "description",
            "date",
            "time",
            "reminder",
            "repeat",
            "repeatEndDate",
            "deleted",
            "completedDates",
            "deletedDates",
            "exceptions",
            "createdAt",
            "updatedAt"
        ]
    ];

    schedules.forEach(schedule => {
        rows.push([
            schedule.id,
            escapeCSV(schedule.title),
            escapeCSV(schedule.category),
            escapeCSV(schedule.priority),
            escapeCSV(schedule.description),
            schedule.date,
            escapeCSV(schedule.time),
            escapeCSV(schedule.reminder ?? ""),
            escapeCSV(schedule.repeat),
            escapeCSV(schedule.repeatEndDate ?? ""),
            escapeCSV(schedule.deleted),
            escapeCSV(schedule.completedDates.join("|")),
            escapeCSV(schedule.deletedDates.join("|")),
            escapeCSV(JSON.stringify(schedule.exceptions)),
            schedule.createdAt,
            schedule.updatedAt
        ])
    });

    const csv = "\uFEFF" + rows.map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `schedule-${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, "0")}-${String(todayDate.getDate()).padStart(2, "0")}.csv`;
    a.click();

    URL.revokeObjectURL(url);

    showToast("CSV를 내보냈습니다.")
}

function importCSV(event) {
    const file = event.target.files[0];

    if(!file) {
        alert("파일이 선택되지 않았습니다.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        const csv = e.target.result;

        const lines = csv.split(/\r?\n/);
        lines.shift();
        
        if (!validateCSV(lines)) {
            return;
        }

        const importedSchedules = [];

        lines.forEach(line => {
            if(!line.trim()) return;

            const values = parseCSVLine(line);

            importedSchedules.push({
                id: Number(values[CSV.ID]),
                title: unescapeCSV(values[CSV.TITLE]),
                category: unescapeCSV(values[CSV.CATEGORY]),
                priority: unescapeCSV(values[CSV.PRIORITY]),
                description: unescapeCSV(values[CSV.DESCRIPTION]),
                date: Number(values[CSV.DATE]),
                time: unescapeCSV(values[CSV.TIME]) === "0" ? null : unescapeCSV(values[CSV.TIME]),
                reminder: values[CSV.REMINDER] === "" ? null : Number(unescapeCSV(values[CSV.REMINDER])),
                repeat: unescapeCSV(values[CSV.REPEAT]),
                repeatEndDate: unescapeCSV(values[CSV.REPEAT_END_DATE]) || "",
                deleted: unescapeCSV(values[CSV.DELETED]).toLowerCase() === "true",
                completedDates: unescapeCSV(values[CSV.COMPLETED_DATES]).split("|").filter(Boolean),
                deletedDates: unescapeCSV(values[CSV.DELETED_DATES]).split("|").filter(Boolean),
                exceptions: values[CSV.EXCEPTIONS] ? JSON.parse(values[CSV.EXCEPTIONS]) : {},
                createdAt: Number(values[CSV.CREATED_AT]),
                updatedAt: Number(values[CSV.UPDATED_AT])
            });
        });

        schedules = importedSchedules;
        refreshSchedules();
    };

    reader.readAsText(file, "utf-8");

    showToast("CSV를 불러왔습니다.")
}

function parseCSVLine(line) {
    const values = [];

    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];

        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }

            continue;
        }

        if (ch === "," && !inQuotes) {
            values.push(current);
            current = "";
            continue;
        }

        current += ch;
    }

    values.push(current);

    return values;
}

function escapeCSV(value) {
    return `"${String(value ?? "")
        .replace(/\r\n/g, "\\n")
        .replace(/\n/g, "\\n")
        .replace(/"/g, '""')}"`
}

function unescapeCSV(value) {
    value = value.trim();

    if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
    }

    return value
        .replace(/""/g, '"')
        .replace(/\\n/g, "\n");
}

function validateCSV(lines) {
    for (const line of lines) {
        if (!line.trim()) continue;

        const values = parseCSVLine(line);

        if (values.length !== Object.values(CSV).length) {
            console.log(values);
            console.log(values.length);

            alert("CSV 형식이 올바르지 않습니다.");
            return false;
        }

        if (values.length !== CSV_LENGTH) {
            alert("CSV 형식이 올바르지 않습니다.");
            return false;
        }

        if (!values[CSV.ID].trim()) {
            alert("ID가 비어 있습니다.");
            return false;
        }

        if (isNaN(Number(values[CSV.ID]))) {
            alert("ID 형식이 잘못되었습니다.");
            return false;
        }

        if (!values[CSV.TITLE].trim()) {
            alert("제목이 비어 있습니다.");
            return false;
        }

        if (!(unescapeCSV(values[CSV.CATEGORY]) in CATEGORY_OPTIONS)) {
            alert("카테고리 값이 올바르지 않습니다.");
            return false;
        }

        if (!(unescapeCSV(values[CSV.PRIORITY]) in PRIORITY_OPTIONS)) {
            alert("우선순위 값이 올바르지 않습니다.");
            return false;
        }

        if (isNaN(Number(values[CSV.DATE]))) {
            alert("날짜 형식이 올바르지 않습니다.");
            return false;
        }

        try {
            const importCompletedDates = unescapeCSV(values[CSV.COMPLETED_DATES]).split("|").filter(Boolean);
            
            if(!Array.isArray(importCompletedDates)) {
                alert("completedDates 형식이 올바르지 않습니다.");
                return false;
            }
        } catch {
            alert("completedDates 형식이 올바르지 않습니다.");
            return false;
        }

        try {
            JSON.parse(values[CSV.EXCEPTIONS] || "{}");
        } catch {
            alert("exceptions 형식이 올바르지 않습니다.");
            return false;
        }

        if (isNaN(Number(values[CSV.CREATED_AT]))) {
            alert("createdAt 값이 올바르지 않습니다.");
            return false;
        }

        if (isNaN(Number(values[CSV.UPDATED_AT]))) {
            alert("updatedAt 값이 올바르지 않습니다.");
            return false;
        }
    }

    return true;
}

//===== Theme =====
function applyTheme(theme) {
    document.body.classList.remove("light-theme", "dark-theme");
    document.body.classList.add(`${theme}-theme`);
}

function updateThemeButton() {
    themeToggleBtn.textContent = currentTheme === "light" ? "🌙" : "☀️";
}

//===== Utils =====
function formatDate(timestamp) {
    if(!timestamp) return "";

    const date = new Date(timestamp);

    return date.toLocaleString("ko-KR");
}

function confirmMessage(message) {
    return confirm(message);
}

function hasException(schedule, targetDate) {
    const key = getDateKey(targetDate);

    return !!schedule.exceptions[key];
}

function getStatistics(schedules) {
    const stats = {
        total: schedules.length,
        complete: 0,
        incomplete: 0,
        category: {
            study: 0,
            work: 0,
            personal: 0,
            exercise: 0,
            etc: 0
        }
    };

    schedules.forEach(schedule => {
        if(isCompleted(schedule, selectedDateData)) {
            stats.complete++;
        } else {
            stats.incomplete++;
        }

        if(stats.category[schedule.category] !== undefined) {
            stats.category[schedule.category]++;
        }
    });

    return stats;
}

function checkScheduleNotifications() {
    const now = new Date();

    const currentHour = String(now.getHours()).padStart(2, "0");
    const currentMinute = String(now.getMinutes()).padStart(2, "0");

    const currentTime = `${currentHour}:${currentMinute}`;
    const todayKey = getDateKey(now);

    const todaySchedules = getTodayScheduleForNotification();

    todaySchedules.forEach(schedule => {
        if(!schedule.time) return;
        if(schedule.reminder == null) return;
        if(isCompleted(schedule, now)) return;

        const [hour, minute] = schedule.time.split(":").map(Number);

        const scheduleTime = new Date(now);
        scheduleTime.setHours(hour);
        scheduleTime.setMinutes(minute);
        scheduleTime.setSeconds(0);
        scheduleTime.setMilliseconds(0);

        const reminderTime = new Date(scheduleTime.getTime() - schedule.reminder * 60 * 1000);
        const reminderHour = String(reminderTime.getHours()).padStart(2, "0");
        const reminderMinute = String(reminderTime.getMinutes()).padStart(2, "0");
        const reminderTimeString = `${reminderHour}:${reminderMinute}`;

        if(currentTime !== reminderTimeString) return;

        const notificationKey = `${todayKey}_${schedule.id}_${schedule.time}_${schedule.reminder}`;
        if(notifiedSchedules.has(notificationKey)) return;

        notifiedSchedules.add(notificationKey);

        showToast(`🔔 ${schedule.reminder}분 후, ${schedule.time} [${schedule.title}] 일정이 있습니다.`);
    });
}

function normalizeDate(date) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
}

function changeScheduleField(schedule, field, value) {
    if(schedule.repeat === "none") {
        schedule[field] = value;
        schedule.updatedAt = Date.now();

        refreshSchedules();
        return;
    }

    const answer = prompt("반복 일정입니다.\n" +
                    "1: 이번 날짜의 일정만 변경\n" + 
                    "2. 반복 일정 전체 변경\n" +
                    "그 외: 취소");
    
    if (answer === "1") {
        const original = schedule.originalSchedule || schedule;
        const key = getDateKey(selectedDateData);

        original.exceptions[key] = {
            ...original.exceptions[key],
            [field]: value,
            updatedAt: Date.now()
        };

        refreshSchedules();
        return;
    }

    if(answer === "2") {
        const original = schedule.originalSchedule || schedule;

        original[field] = value;
        original.updatedAt = Date.now();

        refreshSchedules();
        return;
    }
}

//===== Shift =====
function moveToDate(targetDate) {
    const date = new Date(targetDate);
    date.setHours(0, 0, 0, 0);

    currentDateData = new Date(date);
    selectedDateData = new Date(date);

    renderCalendar();
    selectCalendarCell(date.getFullYear(), date.getMonth(), date.getDate());
}

function shiftDateKey(dateKey, diffDays) {
    const date = new Date(`${dateKey}T00:00:00`);

    date.setDate(date.getDate() + diffDays);

    return getDateKey(date);
}

function shiftDateKeys(dateKeys, diffDays) {
    return dateKeys.map(dateKey => {
        return shiftDateKey(dateKey, diffDays);
    });
}

function shiftExceptions(exceptions, diffDays) {
    const shiftedExceptions = {};

    Object.entries(exceptions).forEach(([dateKey, exception]) => {
        const newDateKey = shiftDateKey(dateKey, diffDays);

        shiftedExceptions[newDateKey] = exception;
    });

    return shiftedExceptions;
}

function shiftRepeatSchedule(schedule, oldDate, newDate) {
    const oldDay = new Date(oldDate);
    oldDay.setHours(0, 0, 0, 0);

    const newDay = new Date(newDate);
    newDay.setHours(0, 0, 0, 0);

    const diffDays = Math.round((newDay - oldDay) / (1000 * 60 * 60 * 24));

    schedule.completedDates = shiftDateKeys(schedule.completedDates, diffDays);
    schedule.deletedDates = shiftDateKeys(schedule.deletedDates, diffDays);
    schedule.exceptions = shiftExceptions(schedule.exceptions, diffDays);

    if(schedule.repeatEndDate) {
        schedule.repeatEndDate = shiftDateKey(schedule.repeatEndDate, diffDays);
    }

    schedule.date = newDay.getTime();
}

//==== Bulk =====
function updateBulkActionButton() {
    const hasSelection = selectedScheduleIds.size > 0;

    bulkCancelBtn.style.display = hasSelection ? "inline-block" : "none";

    if(showDeleted) {
        bulkCompleteBtn.style.display = "none";
        bulkDeleteBtn.style.display = "none";
        bulkAllSelectBtn.style.display = "none";
        return;
    }

    bulkCompleteBtn.style.display = "inline-block";
    bulkDeleteBtn.style.display = "inline-block";
    bulkAllSelectBtn.style.display = "inline-block";

    bulkCompleteBtn.disabled = !hasSelection;
    bulkDeleteBtn.disabled = !hasSelection;
}

function resetBulkAction() {
    selectedScheduleIds.clear();

    renderSchedules();
    updateBulkActionButton();
}

function updateSelectedScheduleCount() {
    if(selectedScheduleIds.size > 0) bulkSelectedNumber.textContent = `선택된 일정: ${selectedScheduleIds.size}개`;
    else bulkSelectedNumber.textContent = "";
}

//===== ETC =====
function preventComma(input) {
    input.addEventListener("keydown", (e) => {
        if(e.key === ",") {
            alert("쉼표(,)는 사용할 수 없습니다.");
            e.preventDefault();
        }
    });

    input.addEventListener("input", () => {
        input.value = input.value.replace(/,/g, "");
    });
}

function refreshSchedules() {
    saveSchedules();
    renderCalendar();
    selectCalendarCell(selectedDateData.getFullYear(), selectedDateData.getMonth(), selectedDateData.getDate());
}

function showToast(message) {
    clearTimeout(toastTimer);
    clearTimeout(toastRemoveTimer);

    toast.classList.remove("show");

    void toast.offsetWidth;

    toast.textContent = message;
    toast.classList.add("show");

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");

        toastRemoveTimer = setTimeout(() => {
            toast.textContent = "";
        }, 300);
    }, 3000);
}

function getDateKey(date) {
    if(!date) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function isCompleted(schedule, targetDate) {
    const key = getDateKey(targetDate);

    return (schedule.completedDates ?? []).includes(key);
}

function getTodayScheduleForNotification() {
    const nowDay = new Date();
    nowDay.setHours(0, 0, 0, 0);

    return getVisibleSchedulesForDate(nowDay, false);
}


preventComma(titleInput);
preventComma(descriptionInput);
updateBulkActionButton();

renderTodaysDate();
renderCalendar();
selectCalendarCell(selectedDateData.getFullYear(), selectedDateData.getMonth(), selectedDateData.getDate());

applyTheme(currentTheme);
updateThemeButton();

checkScheduleNotifications();
setInterval(checkScheduleNotifications, 10000);
