const amountInput = document.querySelector(".amount-input");
const categorySelect = document.querySelector(".category-select");
const typeSelect = document.querySelector(".type-select");
const addBtn = document.querySelector(".add-btn");
const budgetList = document.querySelector(".budget-list");
const incomeTotal = document.querySelector(".income-total");
const expenseTotal = document.querySelector(".expense-total");
const balanceTotal = document.querySelector(".balance-total");
const categoryFilter = document.querySelector(".category-filter");
const sortSelect = document.querySelector(".sort-select");
const typeFilter = document.querySelector(".type-filter");
const cancelEditBtn = document.querySelector(".cancel-edit-btn");
const dateFilter = document.querySelector(".date-filter");
const descriptionInput = document.querySelector(".description-input");
const transactionCount = document.querySelector(".transaction-count");
const statsList = document.querySelector(".stats-list");
const exportBtn = document.querySelector(".export-btn");
const themeToggleBtn = document.querySelector(".theme-toggle-btn");
const searchInput = document.querySelector(".search-input");
const toast = document.querySelector(".toast");
const delAllBtn = document.querySelector(".delete-all-btn");
const importBtn = document.querySelector(".import-btn");
const importInput = document.querySelector(".import-input");

const CATEGORY_OPTIONS = {
    income: [
        {value: "salary", label: "급여"},
        {value: "etc", label: "기타"}
    ],

    expense: [
        {value: "food", label: "식비"},
        {value: "traffic", label: "교통"},
        {value: "shopping", label: "쇼핑"},
        {value: "etc", label: "기타"}
    ]
};

const CATEGORY_FILTER_OPTIONS = {
    all: [
        {value: "all", label: "전체"},
        {value: "food", label: "식비"},
        {value: "traffic", label: "교통"},
        {value: "shopping", label: "쇼핑"},
        {value: "salary", label: "급여"},
        {value: "etc", label: "기타"}
    ],

    income: [
        {value: "all", label: "전체"},
        {value: "salary", label: "급여"},
        {value: "etc", label: "기타"}
    ],

    expense: [
        {value: "all", label: "전체"},
        {value: "food", label: "식비"},
        {value: "traffic", label: "교통"},
        {value: "shopping", label: "쇼핑"},
        {value: "etc", label: "기타"}
    ]
};

const EXPENSE_ORDER = [
    "food",
    "traffic",
    "shopping",
    "etc"
];

const INCOME_ORDER = [
    "salary",
    "etc"
];

const CATEGORY_LABEL = {
    food: "식비",
    traffic: "교통",
    shopping: "쇼핑",
    salary: "급여",
    etc: "기타"
};

const IMPORT_CATEGORY = {
    식비: "food",
    교통: "traffic",
    쇼핑: "shopping",
    급여: "salary",
    기타: "etc"
};

const EXPORT_TYPE = {
    income: "수입",
    expense: "지출"
};

const IMPORT_TYPE = {
    수입: "income",
    지출: "expense"
};

const CSV_DATE = 0;
const CSV_TYPE = 1;
const CSV_CATEGORY = 2;
const CSV_AMOUNT = 3;
const CSV_DESCRIPTION = 4;

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

transactions = transactions.map(transaction => ({
    ...transaction,
    description: transaction.description ?? "",
    updatedAt: transaction.updatedAt ?? transaction.createdAt
}));

let currentCategory = "all";
let currentSort = "latest";
let currentType = "all";
let currentDateFilter = "all";
let currentTheme = localStorage.getItem("theme") || "light";
let currentKeyword = "";

let isEditing = false;
let editingId = null;

let toastTimer = null;


amountInput.addEventListener("input", () => {
    maxLengthCheck(amountInput);
});

addBtn.addEventListener("click", () => {
    if(isEditing) {
        updateTransaction();
    } else {
        addTransaction();
    }
});

typeSelect.addEventListener("change", () => {
    renderCategorySelectOptions();
});

cancelEditBtn.addEventListener("click", () => {
    cancelEdit();
});

typeFilter.addEventListener("change", () => {
    currentType = typeFilter.value;

    renderCategoryFilterOptions();
    renderTransactions();
});

categoryFilter.addEventListener("change", () => {
    currentCategory = categoryFilter.value;

    renderTransactions();
});

sortSelect.addEventListener("change", () => {
    currentSort = sortSelect.value;

    renderTransactions();
});

dateFilter.addEventListener("change", () => {
    currentDateFilter = dateFilter.value;

    renderTransactions();
});

searchInput.addEventListener("input", () => {
    currentKeyword = searchInput.value.trim().toLowerCase();
    renderTransactions();
});

exportBtn.addEventListener("click", exportCSV);

themeToggleBtn.addEventListener("click", () => {
    currentTheme = currentTheme === "light" ? "dark" : "light";

    localStorage.setItem("theme", currentTheme);
    applyTheme(currentTheme);
    updateThemeButton();
});

delAllBtn.addEventListener("click", () => {
    const isConfirmed = confirm(`현재 거래 ${transactions.length}건을 모두 삭제 하시겠습니까?`);
    if (!isConfirmed) return;

    transactions = [];
    saveTransactions();

    cancelEdit();
    renderTransactions();

    showToast("모든 거래가 삭제되었습니다.");
});

importBtn.addEventListener("click", () => {
    importInput.click();
});

importInput.addEventListener("change", () => {
    const file = importInput.files[0];
    const reader = new FileReader();

    if (!file) {
        showToast("불러오기가 취소되었습니다.");
        return;
    }

    const isReplace = confirm("기존 거래를 모두 삭제하고 불러오시겠습니까?\n취소를 누르면 기존 거래에 추가됩니다.");

    if(isReplace) { transactions = []; }
    
    reader.onload = () => {
        const csv = reader.result;
        const rows = csv.split("\n");
        rows.shift();

        let importedCount = 0;

        rows.forEach(row => {
            if(row.trim() === "") return;

            const columns = row.split(",");
            if(columns.length < 5) return;

            const amount = Number(columns[CSV_AMOUNT]);
            if (Number.isNaN(amount)) return;

            const transaction = {
                id: formatImportDate(columns[CSV_DATE]) + Math.random(),
                amount: amount,
                category: IMPORT_CATEGORY[columns[CSV_CATEGORY]],
                type: IMPORT_TYPE[columns[CSV_TYPE]],
                description: columns[CSV_DESCRIPTION].replaceAll('"', ""),
                createdAt: formatImportDate(columns[CSV_DATE]),
                updatedAt: formatImportDate(columns[CSV_DATE])
            };

            transactions.push(transaction);
            importedCount++;
        });

        saveTransactions();
        renderTransactions();
        showToast(`${importedCount}건의 거래를 불러왔습니다.`);
    };

    reader.readAsText(file, "utf-8");
    importInput.value = "";
});


document.addEventListener("keydown", function(e) {
    if(e.ctrlKey && e.key === "Enter") {
        if(!isEditing) addTransaction();
        else updateTransaction();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    renderCategorySelectOptions();
    renderCategoryFilterOptions();
    
    renderTransactions();

    applyTheme(currentTheme);
    updateThemeButton();
});


//===== Transaction =====
function addTransaction() {
    const amount = Number(amountInput.value);
    const category = categorySelect.value;
    const type = typeSelect.value;
    const description = descriptionInput.value.trim();

    if(!validateTransaction(amount)) return;

    const transaction = {
        id: Date.now(),
        amount,
        category,
        type,
        description,
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    transactions.push(transaction);
    saveTransactions();

    resetTransactionForm();
    renderTransactions();

    showToast("거래가 추가되었습니다.");
    amountInput.focus();
}

function deleteTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);

    if(editingId === id) cancelEdit();

    saveTransactions();
    renderTransactions();

    showToast("거래가 삭제되었습니다.");
}

function startEdit(id) {
    const editTransaction = transactions.find(transaction => transaction.id === id);

    if(!editTransaction) return;

    fillForm(editTransaction);

    isEditing = true;
    editingId = id;

    addBtn.textContent = "수정 완료";
    cancelEditBtn.style.display = "inline-block";

    amountInput.focus();
}

function updateTransaction() {
    const editTransaction = transactions.find(transaction => transaction.id === editingId);

    if (!editTransaction) return;

    if (!validateTransaction(Number(amountInput.value))) return;

    editTransaction.amount = Number(amountInput.value);
    editTransaction.category = categorySelect.value;
    editTransaction.type = typeSelect.value;
    editTransaction.description = descriptionInput.value.trim();
    editTransaction.updatedAt = Date.now();

    saveTransactions();

    isEditing = false;
    editingId = null;

    resetTransactionForm();
    renderTransactions();

    showToast("거래가 수정되었습니다.");
    amountInput.focus();
}

function cancelEdit() {
    isEditing = false;
    editingId = null;

    resetTransactionForm();

    showToast("수정이 취소되었습니다.");
    amountInput.focus();
}

function fillForm(transaction) {
    amountInput.value = transaction.amount;
    typeSelect.value = transaction.type;
    renderCategorySelectOptions();
    categorySelect.value = transaction.category;
    descriptionInput.value = transaction.description;
}

function createTransactionCard(transaction) {
    const card = document.createElement("div");
    card.classList.add("budget-card");

    const typeLable = transaction.type === "income" ? "➕" : "➖";
    const amount = document.createElement("p");
    amount.textContent = `${typeLable} ${getCategoryIcon(transaction.category)} ${CATEGORY_LABEL[transaction.category]} ${transaction.amount.toLocaleString()}원`;
    card.append(amount);

    if(transaction.description) {
        const description = document.createElement("p");
        description.classList.add("card-description-text")
        description.textContent = `${transaction.description}`;

        card.append(description);
    }

    const date = document.createElement("p");
    date.classList.add("card-date-text");
    date.textContent = `생성: ${formatDate(transaction.createdAt)}`;

    if(transaction.updatedAt !== transaction.createdAt) {
        date.textContent += `\n(수정: ${formatDate(transaction.updatedAt)})`;
    }
    card.append(date);

    const delBtn = document.createElement("button");
    delBtn.textContent = "삭제";
    delBtn.addEventListener("click", () => {
        deleteTransaction(transaction.id);
    });
    card.append(delBtn);

    const editBtn = document.createElement("button");
    editBtn.textContent = "수정";
    editBtn.addEventListener("click", () => {
        startEdit(transaction.id);
    });
    card.append(editBtn);

    const copyBtn = document.createElement("button");
    copyBtn.textContent = "복사";
    copyBtn.addEventListener("click", () => {
        fillForm(transaction);
        amountInput.focus();
        showToast("거래가 입력창에 복사되었습니다.");
    })
    card.append(copyBtn);

    return card;
}

//===== filter =====
function sortTransactions(transaction) {
    switch(currentSort) {
        case "latest":
            transaction.sort((a,b) => {
                return b.createdAt - a.createdAt;
            });
            break;

        case "oldest":
            transaction.sort((a,b) => {
                return a.createdAt - b.createdAt;
            });
            break;

        case "amount-desc":
            transaction.sort((a,b) => {
                return b.amount - a.amount;
            });
            break;

        case "amount-asc":
            transaction.sort((a,b) => {
                return a.amount - b.amount;
            });
            break;
    }

    return transaction;
}

function filterByType (transaction) {
    if(currentType !== "all") {
        transaction = transaction.filter(transac => transac.type === currentType);
    }

    return transaction;
}

function filterByCategory(transaction) {
    if(currentCategory !== "all") {
        transaction = transaction.filter(transac => transac.category === currentCategory);
    }

    return transaction;
}

function filterByDate(transaction) {
    if(currentDateFilter === "all") {
        return transaction;
    }

    const now = new Date();

    switch(currentDateFilter) {
        case "today":
            return transaction.filter(transac => {
                const date = new Date(transac.createdAt);

                return (
                    date.getFullYear() === now.getFullYear() &&
                    date.getMonth() === now.getMonth() &&
                    date.getDate() === now.getDate()
                );
            });
            break;

        case "week":
            const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

            return transaction.filter(transac => transac.createdAt >= weekAgo);
            break;

        case "mount":
            return transaction.filter(transac => {
                const date = new Date(transac.createdAt);

                return (
                    date.getFullYear() === now.getFullYear() &&
                    date.getMonth() === now.getMonth()
                );
            });
            break;
    }

    return transaction;
}

function filterByKeyword(transaction) {
    if(currentKeyword === "") return transaction;

    return transaction.filter(transac => {
        const descriptionMatch = (transac.description || "").toLowerCase().includes(currentKeyword);
        const amountMatch = String(transac.amount).includes(currentKeyword.replaceAll(",", ""));

        return descriptionMatch || amountMatch;
    });
}

//===== Storage(CSV) =====
function saveTransactions() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

function exportCSV() {
    if(!transactions.length) {
        alert("내보낼 데이터가 없습니다.");
        return;
    }

    const isConfirmed = confirm("내보내시겠습니까?");
    if(!isConfirmed) return;

    let csv = "날짜,타입,카테고리,금액,메모\n";
    transactions.forEach(transaction => {
        const date = `${formatExportDate(transaction.createdAt)}`;
        const type = `${EXPORT_TYPE[transaction.type]}`;
        const category = `${CATEGORY_LABEL[transaction.category]}`;
        const amount = `${transaction.amount}`;
        const memo = `"${(transaction.description.replace(/\n/g, " ") ?? "")}"`;

        csv += `${date},${type},${category},${amount},${memo}` + "\n";
    });

    const blob = new Blob([csv], {type: "text/csv;charset-utf-8;"});

    const url = URL.createObjectURL(blob);

    const date = new Date().toISOString().split("T")[0];
    const a = document.createElement("a");
    a.href = url;
    a.download = `budget-book-${date}.csv`;
    a.click();

    URL.revokeObjectURL(url);

    showToast("CSV로 내보내기가 성공했습니다.");
}

//===== Render ======
function renderTransactions() {
    budgetList.innerHTML = "";

    let filteredTransactions = [...transactions];

    filteredTransactions = filterByType(filteredTransactions);

    filteredTransactions = filterByCategory(filteredTransactions);

    filteredTransactions = filterByDate(filteredTransactions);

    filteredTransactions = filterByKeyword(filteredTransactions);

    filteredTransactions = sortTransactions(filteredTransactions);

    renderTransactionList(filteredTransactions);

    transactionCount.textContent = `현재 표시 중 : ${filteredTransactions.length}건`;

    updateSummary(filteredTransactions);
    renderStatistics(filteredTransactions);
}

function renderTransactionList(filteredTransactions) {
    if(filteredTransactions.length === 0) {
        const message = currentKeyword !== ""
            ? "검색 결과가 없습니다."
            : "아직 등록된 거래가 없습니다.";

        budgetList.innerHTML = `<p class="empty-message">${message}</p>`

        return;
    }

    filteredTransactions.forEach(transaction => {
        budgetList.append(createTransactionCard(transaction));
    });
}

function renderCategoryOption(selectElement, option) {
    selectElement.innerHTML = "";
    option.forEach(optionData => {
        const categoryoption = document.createElement("option");
        categoryoption.value = optionData.value;
        categoryoption.textContent = optionData.label;

        selectElement.append(categoryoption);
    })
}

function renderCategorySelectOptions() {
    renderCategoryOption(categorySelect, CATEGORY_OPTIONS[typeSelect.value]);
}

function renderCategoryFilterOptions() {
    renderCategoryOption(categoryFilter, CATEGORY_FILTER_OPTIONS[typeFilter.value]);

    currentCategory = categoryFilter.value;
}

function renderStatistics(transaction) {
    const incomeStats = {};
    const expenseStats = {};

    transaction.forEach(transactionStats => {
        const target = transactionStats.type === "income" ? incomeStats : expenseStats;

        const category = transactionStats.category;

        if(target[category]) {
            target[category] += transactionStats.amount;
        } else {
            target[category] = transactionStats.amount;
        }
    });

    statsList.innerHTML = "";
    
    renderStatisticsSection("지출 통계", EXPENSE_ORDER, expenseStats);
    renderStatisticsSection("수입 통계", INCOME_ORDER, incomeStats);
}

function renderStatisticsSection(title, order, stats) {
    const sectionTitle = document.createElement("h4");
    sectionTitle.textContent = title;
    statsList.append(sectionTitle);

    order.forEach(category => {
        if(stats[category] === undefined) return;

        const item = document.createElement("p");

        item.textContent = `${getCategoryIcon(category)} ${CATEGORY_LABEL[category]} : ${stats[category].toLocaleString()}원`;
        statsList.append(item);
    })
}

function updateSummary(transactionsSummary) {
    const totalIncome = transactionsSummary.reduce((sum, transaction) => {
        if(transaction.type === "income") {
            return sum + transaction.amount;
        }

        return sum;
    }, 0);

    const totalExpense = transactionsSummary.reduce((sum, transaction) => {
        if(transaction.type === "expense") {
            return sum + transaction.amount;
        }

        return sum;
    }, 0);

    const totalBalance = totalIncome - totalExpense;

    incomeTotal.textContent = `수입 : ${totalIncome.toLocaleString()}원`;
    expenseTotal.textContent = `지출 : ${totalExpense.toLocaleString()}원`;
    balanceTotal.textContent = `잔액 : ${totalBalance.toLocaleString()}원`;
}

//===== Theme =====
function applyTheme(theme) {
    document.body.classList.remove("light-theme", "dark-theme");
    document.body.classList.add(`${theme}-theme`);
}

function updateThemeButton() {
    themeToggleBtn.textContent = currentTheme === "light" ? "🌙" : "☀️";
}

//===== Validation =====
function validateTransaction(amount) {
    if (Number.isNaN(amount)) {
        alert("금액을 입력해 주세요.");
        return false;
    }

    if (amount <= 0) {
        alert("올바른 금액이 아닙니다.");
        return false;
    }

    if (!Number.isInteger(amount)) {
        alert("금액은 정수만 입력할 수 있습니다.");
        return false;
    }

    return true;
}

//===== Date ======
function formatDate(timestamp) {
    if(!timestamp) return "";

    const date = new Date(timestamp);

    return date.toLocaleString("ko-KR");
}

function formatExportDate(timestamp) {
    if(!timestamp) return "";

    const date = new Date(timestamp);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    const second = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

function formatImportDate(dateString) {
    return new Date(dateString).getTime();
}

//===== etc =====
function getCategoryIcon(category) {
    switch(category) {
        case "food": return "🍚";
        case "traffic": return "🚌";
        case "shopping": return "🛍";
        case "salary": return "💰";
    }

    return "📦";
}

function maxLengthCheck(input) {
    if(input.value.length > input.maxLength) {
        input.value = input.value.slice(0, input.maxLength);
    }
}

function resetTransactionForm() {
    amountInput.value = "";
    descriptionInput.value = "";

    addBtn.textContent = "추가";
    cancelEditBtn.style.display = "none";
    typeSelect.value = "expense";
    renderCategorySelectOptions();
    categorySelect.value = "food";
}

function showToast(message) {
    clearTimeout(toastTimer);

    toast.innerHTML = message;
    toast.classList.add("show");

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {toast.innerHTML = "";}, 2000);
    }, 3000);
}
