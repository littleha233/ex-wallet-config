const filterBlockchainId = document.getElementById('filterBlockchainId');
const filterChainCode = document.getElementById('filterChainCode');
const filterChainName = document.getElementById('filterChainName');
const filterEnabled = document.getElementById('filterEnabled');
const searchBtn = document.getElementById('searchBtn');
const resetFilterBtn = document.getElementById('resetFilterBtn');
const addChainBtn = document.getElementById('addChainBtn');
const pageMsg = document.getElementById('pageMsg');
const chainTableBody = document.getElementById('chainTableBody');

const chainModalMask = document.getElementById('chainModalMask');
const chainModalTitle = document.getElementById('chainModalTitle');
const closeModalBtn = document.getElementById('closeModalBtn');
const blockchainIdInput = document.getElementById('blockchainIdInput');
const chainCodeInput = document.getElementById('chainCodeInput');
const chainNameInput = document.getElementById('chainNameInput');
const enabledInput = document.getElementById('enabledInput');
const saveChainBtn = document.getElementById('saveChainBtn');
const resetFormBtn = document.getElementById('resetFormBtn');
const modalMsg = document.getElementById('modalMsg');

let blockchains = [];
let filteredBlockchains = [];
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

async function loadBlockchains() {
    const response = await fetch('/api/blockchain-configs');
    if (!response.ok) {
        throw new Error(await parseError(response, '加载区块链配置失败'));
    }
    blockchains = await response.json();
    applyFilter();
}

function applyFilter() {
    const blockchainIdKeyword = filterBlockchainId.value.trim();
    const chainCodeKeyword = filterChainCode.value.trim().toUpperCase();
    const chainNameKeyword = filterChainName.value.trim().toLowerCase();
    const enabledValue = filterEnabled.value;

    filteredBlockchains = blockchains.filter((item) => {
        if (blockchainIdKeyword && String(item.blockchainId ?? '') !== blockchainIdKeyword) {
            return false;
        }
        if (chainCodeKeyword && !String(item.chainCode || '').toUpperCase().includes(chainCodeKeyword)) {
            return false;
        }
        if (chainNameKeyword && !String(item.chainName || '').toLowerCase().includes(chainNameKeyword)) {
            return false;
        }
        if (enabledValue !== 'all' && String(item.enabled) !== enabledValue) {
            return false;
        }
        return true;
    });

    renderTable();
}

function renderTable() {
    chainTableBody.innerHTML = '';
    if (!filteredBlockchains.length) {
        chainTableBody.innerHTML = '<tr><td colspan="7">暂无数据</td></tr>';
        return;
    }

    filteredBlockchains.forEach((item) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${item.blockchainId ?? '-'}</td>
            <td>${item.chainCode}</td>
            <td>${item.chainName}</td>
            <td>${item.enabled ? '启用' : '禁用'}</td>
            <td>${formatTime(item.updateTime || item.createTime)}</td>
            <td><button type="button" data-action="edit" data-id="${item.id}">编辑</button></td>
        `;
        chainTableBody.appendChild(tr);
    });
}

function clearForm() {
    currentEditId = null;
    blockchainIdInput.value = '';
    chainCodeInput.value = '';
    chainNameInput.value = '';
    enabledInput.value = 'true';
    showMsg(modalMsg, '');
}

function openCreateModal() {
    clearForm();
    chainModalTitle.textContent = '新增区块链';
    chainModalMask.classList.add('show');
}

function openEditModal(item) {
    clearForm();
    currentEditId = item.id;
    chainModalTitle.textContent = '编辑区块链';
    blockchainIdInput.value = item.blockchainId ?? '';
    chainCodeInput.value = item.chainCode || '';
    chainNameInput.value = item.chainName || '';
    enabledInput.value = item.enabled ? 'true' : 'false';
    chainModalMask.classList.add('show');
}

function closeModal() {
    chainModalMask.classList.remove('show');
    showMsg(modalMsg, '');
}

async function saveChain() {
    const blockchainIdValue = blockchainIdInput.value.trim();
    const payload = {
        blockchainId: Number(blockchainIdValue),
        chainCode: chainCodeInput.value.trim(),
        chainName: chainNameInput.value.trim(),
        enabled: enabledInput.value === 'true'
    };

    if (!blockchainIdValue || !Number.isInteger(payload.blockchainId) || payload.blockchainId < 0) {
        showMsg(modalMsg, 'blockchainId 必须是非负整数');
        return;
    }
    if (!payload.chainCode || !payload.chainName) {
        showMsg(modalMsg, 'blockchainId、chainCode 和 chainName 不能为空');
        return;
    }

    saveChainBtn.disabled = true;
    showMsg(modalMsg, '');
    try {
        const isUpdate = currentEditId !== null;
        const response = await fetch(isUpdate ? `/api/blockchain-configs/${currentEditId}` : '/api/blockchain-configs', {
            method: isUpdate ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error(await parseError(response, '保存区块链配置失败'));
        }

        closeModal();
        await loadBlockchains();
        showMsg(pageMsg, '保存成功');
    } catch (error) {
        showMsg(modalMsg, error.message || '请求失败');
    } finally {
        saveChainBtn.disabled = false;
    }
}

chainTableBody.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) {
        return;
    }

    const id = Number(button.dataset.id);
    const action = button.dataset.action;
    if (action === 'edit' && Number.isInteger(id)) {
        const item = blockchains.find((blockchain) => blockchain.id === id);
        if (item) {
            openEditModal(item);
        }
    }
});

searchBtn.addEventListener('click', () => {
    showMsg(pageMsg, '');
    applyFilter();
});

resetFilterBtn.addEventListener('click', () => {
    filterBlockchainId.value = '';
    filterChainCode.value = '';
    filterChainName.value = '';
    filterEnabled.value = 'all';
    showMsg(pageMsg, '');
    applyFilter();
});

addChainBtn.addEventListener('click', openCreateModal);
closeModalBtn.addEventListener('click', closeModal);
chainModalMask.addEventListener('click', (event) => {
    if (event.target === chainModalMask) {
        closeModal();
    }
});

saveChainBtn.addEventListener('click', saveChain);
resetFormBtn.addEventListener('click', () => {
    if (currentEditId === null) {
        clearForm();
        return;
    }
    const item = blockchains.find((blockchain) => blockchain.id === currentEditId);
    if (item) {
        openEditModal(item);
    }
});

(async function bootstrap() {
    try {
        await loadBlockchains();
    } catch (error) {
        showMsg(pageMsg, error.message || '初始化失败');
    }
})();
