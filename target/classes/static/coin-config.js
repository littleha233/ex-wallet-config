const filterCoinId = document.getElementById('filterCoinId');
const filterSymbol = document.getElementById('filterSymbol');
const filterEnabled = document.getElementById('filterEnabled');
const searchBtn = document.getElementById('searchBtn');
const resetFilterBtn = document.getElementById('resetFilterBtn');
const addCoinBtn = document.getElementById('addCoinBtn');
const pageMsg = document.getElementById('pageMsg');
const coinTableBody = document.getElementById('coinTableBody');

const coinModalMask = document.getElementById('coinModalMask');
const coinModalTitle = document.getElementById('coinModalTitle');
const closeModalBtn = document.getElementById('closeModalBtn');
const coinIdInput = document.getElementById('coinIdInput');
const coinSymbolInput = document.getElementById('coinSymbolInput');
const coinFullNameInput = document.getElementById('coinFullNameInput');
const coinPrecisionInput = document.getElementById('coinPrecisionInput');
const coinIconFileInput = document.getElementById('coinIconFileInput');
const uploadCoinIconBtn = document.getElementById('uploadCoinIconBtn');
const coinIconUrlInput = document.getElementById('coinIconUrlInput');
const iconPreview = document.getElementById('iconPreview');
const iconPreviewImage = document.getElementById('iconPreviewImage');
const coinEnabledInput = document.getElementById('coinEnabledInput');
const saveCoinBtn = document.getElementById('saveCoinBtn');
const resetFormBtn = document.getElementById('resetFormBtn');
const modalMsg = document.getElementById('modalMsg');

let coins = [];
let filteredCoins = [];
let currentEditId = null;

function showMsg(el, text) {
    el.textContent = text || '';
}

function formatTime(value) {
    if (!value) {
        return '-';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return date.toLocaleString('zh-CN', { hour12: false });
}

function setIconPreview(url) {
    if (!url) {
        iconPreviewImage.removeAttribute('src');
        iconPreview.classList.remove('show');
        return;
    }
    iconPreviewImage.src = url;
    iconPreview.classList.add('show');
}

async function parseError(response, fallback) {
    try {
        const body = await response.json();
        if (body && body.message) {
            return body.message;
        }
    } catch (e) {
        // ignore
    }
    return fallback;
}

async function loadCoins() {
    const response = await fetch('/api/coins');
    if (!response.ok) {
        throw new Error(await parseError(response, '加载币种失败'));
    }
    coins = await response.json();
    applyFilter();
}

function applyFilter() {
    const coinIdKeyword = filterCoinId.value.trim();
    const symbolKeyword = filterSymbol.value.trim().toUpperCase();
    const enabledValue = filterEnabled.value;

    filteredCoins = coins.filter((coin) => {
        if (coinIdKeyword && String(coin.coinId) !== coinIdKeyword) {
            return false;
        }
        if (symbolKeyword && !String(coin.symbol || '').toUpperCase().includes(symbolKeyword)) {
            return false;
        }
        if (enabledValue !== 'all' && String(coin.enabled) !== enabledValue) {
            return false;
        }
        return true;
    });

    renderTable();
}

function renderTable() {
    coinTableBody.innerHTML = '';
    if (!filteredCoins.length) {
        coinTableBody.innerHTML = '<tr><td colspan="9">暂无数据</td></tr>';
        return;
    }

    filteredCoins.forEach((coin) => {
        const tr = document.createElement('tr');
        const iconHtml = coin.iconUrl
            ? `<img src="${coin.iconUrl}" alt="${coin.symbol} icon" class="icon-cell">`
            : '-';
        tr.innerHTML = `
            <td>${coin.id}</td>
            <td>${coin.coinId}</td>
            <td>${coin.symbol}</td>
            <td>${coin.fullName}</td>
            <td>${coin.coinPrecision}</td>
            <td>${iconHtml}</td>
            <td>${coin.enabled ? '启用' : '禁用'}</td>
            <td>${formatTime(coin.updateTime || coin.createTime)}</td>
            <td>
                <button type="button" data-action="edit" data-id="${coin.id}">编辑</button>
            </td>
        `;
        coinTableBody.appendChild(tr);
    });
}

function clearForm() {
    currentEditId = null;
    coinIdInput.value = '';
    coinSymbolInput.value = '';
    coinFullNameInput.value = '';
    coinPrecisionInput.value = '';
    coinIconFileInput.value = '';
    coinIconUrlInput.value = '';
    coinEnabledInput.value = 'true';
    setIconPreview('');
    showMsg(modalMsg, '');
}

function openCreateModal() {
    clearForm();
    coinModalTitle.textContent = '新增币种';
    coinModalMask.classList.add('show');
}

function openEditModal(coin) {
    clearForm();
    currentEditId = coin.id;
    coinModalTitle.textContent = '编辑币种';
    coinIdInput.value = String(coin.coinId);
    coinSymbolInput.value = coin.symbol || '';
    coinFullNameInput.value = coin.fullName || '';
    coinPrecisionInput.value = String(coin.coinPrecision);
    coinIconUrlInput.value = coin.iconUrl || '';
    coinEnabledInput.value = coin.enabled ? 'true' : 'false';
    setIconPreview(coin.iconUrl || '');
    coinModalMask.classList.add('show');
}

function closeModal() {
    coinModalMask.classList.remove('show');
    showMsg(modalMsg, '');
}

async function uploadIcon() {
    const file = coinIconFileInput.files && coinIconFileInput.files[0];
    if (!file) {
        showMsg(modalMsg, '请先选择图片文件');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    uploadCoinIconBtn.disabled = true;
    showMsg(modalMsg, '');
    try {
        const response = await fetch('/api/coins/icon', {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            throw new Error(await parseError(response, '上传图标失败'));
        }
        const data = await response.json();
        coinIconUrlInput.value = data.iconUrl || '';
        setIconPreview(coinIconUrlInput.value);
    } catch (error) {
        showMsg(modalMsg, error.message || '上传失败');
    } finally {
        uploadCoinIconBtn.disabled = false;
    }
}

async function saveCoin() {
    const coinIdRaw = coinIdInput.value.trim();
    const coinId = Number(coinIdRaw);
    const payload = {
        coinId,
        symbol: coinSymbolInput.value.trim(),
        fullName: coinFullNameInput.value.trim(),
        coinPrecision: Number(coinPrecisionInput.value),
        iconUrl: coinIconUrlInput.value.trim(),
        enabled: coinEnabledInput.value === 'true'
    };

    if (!coinIdRaw || !Number.isInteger(coinId) || coinId < 0) {
        showMsg(modalMsg, 'coinId 必须是大于等于 0 的整数');
        return;
    }
    if (!payload.symbol || !payload.fullName) {
        showMsg(modalMsg, 'symbol 和 fullName 不能为空');
        return;
    }
    if (!Number.isInteger(payload.coinPrecision) || payload.coinPrecision < 0) {
        showMsg(modalMsg, 'coinPrecision 必须是非负整数');
        return;
    }

    saveCoinBtn.disabled = true;
    showMsg(modalMsg, '');
    try {
        const isUpdate = currentEditId !== null;
        const response = await fetch(isUpdate ? `/api/coins/${currentEditId}` : '/api/coins', {
            method: isUpdate ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error(await parseError(response, '保存币种失败'));
        }

        closeModal();
        await loadCoins();
        showMsg(pageMsg, '保存成功');
    } catch (error) {
        showMsg(modalMsg, error.message || '请求失败');
    } finally {
        saveCoinBtn.disabled = false;
    }
}

coinTableBody.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) {
        return;
    }
    const action = button.dataset.action;
    const id = Number(button.dataset.id);
    if (action === 'edit' && Number.isInteger(id)) {
        const coin = coins.find((item) => item.id === id);
        if (coin) {
            openEditModal(coin);
        }
    }
});

searchBtn.addEventListener('click', () => {
    showMsg(pageMsg, '');
    applyFilter();
});

resetFilterBtn.addEventListener('click', () => {
    filterCoinId.value = '';
    filterSymbol.value = '';
    filterEnabled.value = 'all';
    showMsg(pageMsg, '');
    applyFilter();
});

addCoinBtn.addEventListener('click', openCreateModal);
closeModalBtn.addEventListener('click', closeModal);
coinModalMask.addEventListener('click', (event) => {
    if (event.target === coinModalMask) {
        closeModal();
    }
});
uploadCoinIconBtn.addEventListener('click', uploadIcon);
saveCoinBtn.addEventListener('click', saveCoin);
resetFormBtn.addEventListener('click', () => {
    const currentId = currentEditId;
    if (currentId === null) {
        clearForm();
        return;
    }
    const coin = coins.find((item) => item.id === currentId);
    if (coin) {
        openEditModal(coin);
    }
});

(async function bootstrap() {
    try {
        await loadCoins();
    } catch (error) {
        showMsg(pageMsg, error.message || '初始化失败');
    }
})();
