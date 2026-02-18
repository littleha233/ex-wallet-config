const filterCoinSelect = document.getElementById('filterCoinSelect');
const filterChainCode = document.getElementById('filterChainCode');
const filterEnabled = document.getElementById('filterEnabled');
const searchBtn = document.getElementById('searchBtn');
const resetFilterBtn = document.getElementById('resetFilterBtn');
const addConfigBtn = document.getElementById('addConfigBtn');
const pageMsg = document.getElementById('pageMsg');
const chainTableBody = document.getElementById('chainTableBody');

const chainModalMask = document.getElementById('chainModalMask');
const chainModalTitle = document.getElementById('chainModalTitle');
const closeModalBtn = document.getElementById('closeModalBtn');
const formCoinSelect = document.getElementById('formCoinSelect');
const chainCodeInput = document.getElementById('chainCodeInput');
const rpcUrlInput = document.getElementById('rpcUrlInput');
const collectionAddressInput = document.getElementById('collectionAddressInput');
const withdrawAddressInput = document.getElementById('withdrawAddressInput');
const minWithdrawAmountInput = document.getElementById('minWithdrawAmountInput');
const withdrawPrecisionInput = document.getElementById('withdrawPrecisionInput');
const minDepositAmountInput = document.getElementById('minDepositAmountInput');
const depositPrecisionInput = document.getElementById('depositPrecisionInput');
const formEnabledInput = document.getElementById('formEnabledInput');
const saveConfigBtn = document.getElementById('saveConfigBtn');
const resetFormBtn = document.getElementById('resetFormBtn');
const modalMsg = document.getElementById('modalMsg');

let coins = [];
let coinMap = new Map();
let chainConfigs = [];
let filteredChainConfigs = [];
let currentEditId = null;
let currentEditSnapshot = null;
const expandedIds = new Set();
const extrasCache = new Map();

function showMsg(el, text) {
    el.textContent = text || '';
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
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

function coinLabel(coinPkId) {
    const coin = coinMap.get(coinPkId);
    if (!coin) {
        return `coin#${coinPkId}`;
    }
    return `${coin.symbol} (#${coin.coinId})`;
}

function renderCoinSelects() {
    const previousFilterValue = filterCoinSelect.value;
    const previousFormValue = formCoinSelect.value;

    filterCoinSelect.innerHTML = '<option value="">全部币种</option>';
    formCoinSelect.innerHTML = '<option value="">请选择币种</option>';

    coins.forEach((coin) => {
        const text = `${coin.symbol} (#${coin.coinId}) ${coin.fullName}`;

        const optionFilter = document.createElement('option');
        optionFilter.value = String(coin.id);
        optionFilter.textContent = text;
        filterCoinSelect.appendChild(optionFilter);

        const optionForm = document.createElement('option');
        optionForm.value = String(coin.id);
        optionForm.textContent = text;
        formCoinSelect.appendChild(optionForm);
    });

    if (previousFilterValue && [...filterCoinSelect.options].some((item) => item.value === previousFilterValue)) {
        filterCoinSelect.value = previousFilterValue;
    }
    if (previousFormValue && [...formCoinSelect.options].some((item) => item.value === previousFormValue)) {
        formCoinSelect.value = previousFormValue;
    }
}

async function loadCoins() {
    const response = await fetch('/api/coins');
    if (!response.ok) {
        throw new Error(await parseError(response, '加载币种列表失败'));
    }
    coins = await response.json();
    coinMap = new Map(coins.map((coin) => [coin.id, coin]));
    renderCoinSelects();
}

async function loadChainConfigs() {
    const selectedCoin = filterCoinSelect.value;
    const query = selectedCoin ? `?coinId=${selectedCoin}` : '';
    const response = await fetch(`/api/coin-chain-configs${query}`);
    if (!response.ok) {
        throw new Error(await parseError(response, '加载扩展参数失败'));
    }
    chainConfigs = await response.json();
    applyFilter();
}

function applyFilter() {
    const chainKeyword = filterChainCode.value.trim().toUpperCase();
    const enabledValue = filterEnabled.value;

    filteredChainConfigs = chainConfigs.filter((config) => {
        if (chainKeyword && !String(config.chainCode || '').toUpperCase().includes(chainKeyword)) {
            return false;
        }
        if (enabledValue !== 'all' && String(config.enabled) !== enabledValue) {
            return false;
        }
        return true;
    });

    renderTable();
}

function renderExtraRow(configId) {
    const extras = extrasCache.get(configId);
    if (extras === undefined) {
        return `
            <tr>
                <td colspan="8">
                    <div class="extra-wrap">扩展字段加载中...</div>
                </td>
            </tr>
        `;
    }

    const rows = extras.length
        ? extras.map((extra) => `
            <tr>
                <td>${extra.id}</td>
                <td>${escapeHtml(extra.paramKey)}</td>
                <td>${escapeHtml(extra.paramValue)}</td>
                <td>
                    <button type="button" class="ghost" data-action="fill-extra" data-id="${configId}" data-key="${escapeHtml(extra.paramKey)}" data-value="${escapeHtml(extra.paramValue)}">填充</button>
                    <button type="button" class="danger" data-action="delete-extra" data-id="${configId}" data-extra-id="${extra.id}">删除</button>
                </td>
            </tr>
        `).join('')
        : '<tr><td colspan="4">暂无扩展字段</td></tr>';

    return `
        <tr>
            <td colspan="8">
                <div class="extra-wrap">
                    <div class="extra-head">
                        <strong>扩展字段（key/value）</strong>
                        <span style="color:#5f6b7a;font-size:12px;">chainConfigId=${configId}</span>
                    </div>
                    <div class="extra-grid">
                        <input id="extraKey-${configId}" type="text" placeholder="key, 例如 chainId">
                        <input id="extraValue-${configId}" type="text" placeholder="value, 例如 1">
                        <button type="button" data-action="save-extra" data-id="${configId}">保存字段</button>
                    </div>
                    <table class="extra-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Key</th>
                            <th>Value</th>
                            <th>操作</th>
                        </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </td>
        </tr>
    `;
}

function renderTable() {
    chainTableBody.innerHTML = '';
    if (!filteredChainConfigs.length) {
        chainTableBody.innerHTML = '<tr><td colspan="8">暂无数据</td></tr>';
        return;
    }

    const fragments = [];
    filteredChainConfigs.forEach((config) => {
        const expanded = expandedIds.has(config.id);
        fragments.push(`
            <tr>
                <td>${config.id}</td>
                <td>${escapeHtml(coinLabel(config.coinId))}</td>
                <td>${escapeHtml(config.chainCode)}</td>
                <td>${escapeHtml(config.rpcUrl)}</td>
                <td>${escapeHtml(config.minWithdrawAmount)} / ${config.withdrawPrecision}</td>
                <td>${escapeHtml(config.minDepositAmount)} / ${config.depositPrecision}</td>
                <td>${config.enabled ? '启用' : '禁用'}</td>
                <td>
                    <button type="button" data-action="edit" data-id="${config.id}">编辑</button>
                    <button type="button" class="ghost" data-action="toggle-extra" data-id="${config.id}">${expanded ? '收起字段' : '展开字段'}</button>
                </td>
            </tr>
        `);

        if (expanded) {
            fragments.push(renderExtraRow(config.id));
        }
    });

    chainTableBody.innerHTML = fragments.join('');
}

async function loadExtras(configId) {
    const response = await fetch(`/api/coin-chain-configs/${configId}/extras`);
    if (!response.ok) {
        throw new Error(await parseError(response, '加载扩展字段失败'));
    }
    const extras = await response.json();
    extrasCache.set(configId, extras);
}

async function toggleExtra(configId) {
    if (expandedIds.has(configId)) {
        expandedIds.delete(configId);
        renderTable();
        return;
    }

    expandedIds.add(configId);
    if (!extrasCache.has(configId)) {
        renderTable();
        try {
            await loadExtras(configId);
        } catch (error) {
            showMsg(pageMsg, error.message || '加载扩展字段失败');
        }
    }
    renderTable();
}

async function saveExtra(configId) {
    const keyInput = document.getElementById(`extraKey-${configId}`);
    const valueInput = document.getElementById(`extraValue-${configId}`);
    if (!keyInput || !valueInput) {
        return;
    }

    const paramKey = keyInput.value.trim();
    const paramValue = valueInput.value.trim();
    if (!paramKey || !paramValue) {
        showMsg(pageMsg, '扩展字段 key/value 不能为空');
        return;
    }

    const response = await fetch(`/api/coin-chain-configs/${configId}/extras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paramKey, paramValue })
    });
    if (!response.ok) {
        throw new Error(await parseError(response, '保存扩展字段失败'));
    }

    await loadExtras(configId);
    keyInput.value = '';
    valueInput.value = '';
    showMsg(pageMsg, '扩展字段已保存');
    renderTable();
}

async function deleteExtra(configId, extraId) {
    const response = await fetch(`/api/coin-chain-configs/${configId}/extras/${extraId}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        throw new Error(await parseError(response, '删除扩展字段失败'));
    }
    await loadExtras(configId);
    showMsg(pageMsg, '扩展字段已删除');
    renderTable();
}

function clearForm() {
    currentEditId = null;
    currentEditSnapshot = null;
    formCoinSelect.value = '';
    chainCodeInput.value = '';
    rpcUrlInput.value = '';
    collectionAddressInput.value = '';
    withdrawAddressInput.value = '';
    minWithdrawAmountInput.value = '';
    withdrawPrecisionInput.value = '';
    minDepositAmountInput.value = '';
    depositPrecisionInput.value = '';
    formEnabledInput.value = 'true';
    showMsg(modalMsg, '');
}

function openCreateModal() {
    clearForm();
    chainModalTitle.textContent = '新增扩展参数';
    if (filterCoinSelect.value) {
        formCoinSelect.value = filterCoinSelect.value;
    }
    chainModalMask.classList.add('show');
}

function openEditModal(config) {
    clearForm();
    currentEditId = config.id;
    currentEditSnapshot = { ...config };
    chainModalTitle.textContent = '编辑扩展参数';

    formCoinSelect.value = String(config.coinId);
    chainCodeInput.value = config.chainCode || '';
    rpcUrlInput.value = config.rpcUrl || '';
    collectionAddressInput.value = config.collectionAddress || '';
    withdrawAddressInput.value = config.withdrawAddress || '';
    minWithdrawAmountInput.value = config.minWithdrawAmount;
    withdrawPrecisionInput.value = config.withdrawPrecision;
    minDepositAmountInput.value = config.minDepositAmount;
    depositPrecisionInput.value = config.depositPrecision;
    formEnabledInput.value = config.enabled ? 'true' : 'false';

    chainModalMask.classList.add('show');
}

function closeModal() {
    chainModalMask.classList.remove('show');
    showMsg(modalMsg, '');
}

async function saveConfig() {
    const coinId = Number(formCoinSelect.value);
    const minWithdrawAmount = minWithdrawAmountInput.value.trim();
    const minDepositAmount = minDepositAmountInput.value.trim();

    const payload = {
        coinId,
        chainCode: chainCodeInput.value.trim(),
        rpcUrl: rpcUrlInput.value.trim(),
        collectionAddress: collectionAddressInput.value.trim(),
        withdrawAddress: withdrawAddressInput.value.trim(),
        minWithdrawAmount,
        withdrawPrecision: Number(withdrawPrecisionInput.value),
        minDepositAmount,
        depositPrecision: Number(depositPrecisionInput.value),
        enabled: formEnabledInput.value === 'true'
    };

    if (!Number.isInteger(coinId) || coinId <= 0) {
        showMsg(modalMsg, '请选择有效币种');
        return;
    }
    if (!payload.chainCode || !payload.rpcUrl || !payload.collectionAddress || !payload.withdrawAddress) {
        showMsg(modalMsg, 'chainCode/rpcUrl/collectionAddress/withdrawAddress 必填');
        return;
    }
    if (!minWithdrawAmount || !Number.isFinite(Number(minWithdrawAmount)) || Number(minWithdrawAmount) < 0) {
        showMsg(modalMsg, '最小提币数量必须大于等于 0');
        return;
    }
    if (!minDepositAmount || !Number.isFinite(Number(minDepositAmount)) || Number(minDepositAmount) < 0) {
        showMsg(modalMsg, '最小充值数量必须大于等于 0');
        return;
    }
    if (!Number.isInteger(payload.withdrawPrecision) || payload.withdrawPrecision < 0) {
        showMsg(modalMsg, '提币精度必须是非负整数');
        return;
    }
    if (!Number.isInteger(payload.depositPrecision) || payload.depositPrecision < 0) {
        showMsg(modalMsg, '充值精度必须是非负整数');
        return;
    }

    saveConfigBtn.disabled = true;
    showMsg(modalMsg, '');
    try {
        const isUpdate = currentEditId !== null;
        const response = await fetch(isUpdate ? `/api/coin-chain-configs/${currentEditId}` : '/api/coin-chain-configs', {
            method: isUpdate ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error(await parseError(response, '保存扩展参数失败'));
        }

        closeModal();
        await loadChainConfigs();
        showMsg(pageMsg, '保存成功');
    } catch (error) {
        showMsg(modalMsg, error.message || '请求失败');
    } finally {
        saveConfigBtn.disabled = false;
    }
}

chainTableBody.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) {
        return;
    }

    const action = button.dataset.action;
    const id = Number(button.dataset.id);
    if (!Number.isInteger(id) || id <= 0) {
        return;
    }

    showMsg(pageMsg, '');

    try {
        if (action === 'edit') {
            const config = chainConfigs.find((item) => item.id === id);
            if (config) {
                openEditModal(config);
            }
            return;
        }

        if (action === 'toggle-extra') {
            await toggleExtra(id);
            return;
        }

        if (action === 'save-extra') {
            await saveExtra(id);
            return;
        }

        if (action === 'delete-extra') {
            const extraId = Number(button.dataset.extraId);
            if (!Number.isInteger(extraId) || extraId <= 0) {
                return;
            }
            await deleteExtra(id, extraId);
            return;
        }

        if (action === 'fill-extra') {
            const keyInput = document.getElementById(`extraKey-${id}`);
            const valueInput = document.getElementById(`extraValue-${id}`);
            if (keyInput && valueInput) {
                keyInput.value = button.dataset.key || '';
                valueInput.value = button.dataset.value || '';
            }
        }
    } catch (error) {
        showMsg(pageMsg, error.message || '操作失败');
    }
});

searchBtn.addEventListener('click', async () => {
    showMsg(pageMsg, '');
    try {
        await loadChainConfigs();
    } catch (error) {
        showMsg(pageMsg, error.message || '查询失败');
    }
});

resetFilterBtn.addEventListener('click', async () => {
    filterCoinSelect.value = '';
    filterChainCode.value = '';
    filterEnabled.value = 'all';
    showMsg(pageMsg, '');
    try {
        await loadChainConfigs();
    } catch (error) {
        showMsg(pageMsg, error.message || '重置失败');
    }
});

addConfigBtn.addEventListener('click', openCreateModal);
closeModalBtn.addEventListener('click', closeModal);
chainModalMask.addEventListener('click', (event) => {
    if (event.target === chainModalMask) {
        closeModal();
    }
});
saveConfigBtn.addEventListener('click', saveConfig);

resetFormBtn.addEventListener('click', () => {
    if (!currentEditSnapshot) {
        clearForm();
        return;
    }
    openEditModal(currentEditSnapshot);
});

(async function bootstrap() {
    try {
        await loadCoins();
        await loadChainConfigs();
    } catch (error) {
        showMsg(pageMsg, error.message || '初始化失败');
    }
})();
