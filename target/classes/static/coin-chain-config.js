const filterCoinSelect = document.getElementById('filterCoinSelect');
const filterChainCode = document.getElementById('filterChainCode');
const filterEnabled = document.getElementById('filterEnabled');
const searchBtn = document.getElementById('searchBtn');
const resetFilterBtn = document.getElementById('resetFilterBtn');
const addConfigBtn = document.getElementById('addConfigBtn');
const generateSystemAddressBtn = document.getElementById('generateSystemAddressBtn');
const pageMsg = document.getElementById('pageMsg');
const chainTableBody = document.getElementById('chainTableBody');
const tableScroll = document.querySelector('.table-scroll');
const selectAllRowsCheckbox = document.getElementById('selectAllRowsCheckbox');

const chainModalMask = document.getElementById('chainModalMask');
const chainModalTitle = document.getElementById('chainModalTitle');
const closeModalBtn = document.getElementById('closeModalBtn');
const formCoinSelect = document.getElementById('formCoinSelect');
const chainCodeInput = document.getElementById('chainCodeInput');
const blockchainIdInput = document.getElementById('blockchainIdInput');
const chainNameInput = document.getElementById('chainNameInput');
const rpcUrlInput = document.getElementById('rpcUrlInput');
const collectionAddressInput = document.getElementById('collectionAddressInput');
const withdrawAddressInput = document.getElementById('withdrawAddressInput');
const minWithdrawAmountInput = document.getElementById('minWithdrawAmountInput');
const withdrawPrecisionInput = document.getElementById('withdrawPrecisionInput');
const minDepositAmountInput = document.getElementById('minDepositAmountInput');
const depositPrecisionInput = document.getElementById('depositPrecisionInput');
const formEnabledInput = document.getElementById('formEnabledInput');
const extraJsonInput = document.getElementById('extraJsonInput');
const openKvEditorBtn = document.getElementById('openKvEditorBtn');
const formatJsonBtn = document.getElementById('formatJsonBtn');
const saveConfigBtn = document.getElementById('saveConfigBtn');
const resetFormBtn = document.getElementById('resetFormBtn');
const modalMsg = document.getElementById('modalMsg');

const kvModalMask = document.getElementById('kvModalMask');
const kvModalTitle = document.getElementById('kvModalTitle');
const closeKvModalBtn = document.getElementById('closeKvModalBtn');
const addKvRowBtn = document.getElementById('addKvRowBtn');
const applyKvBtn = document.getElementById('applyKvBtn');
const kvRowsBody = document.getElementById('kvRowsBody');
const kvMsg = document.getElementById('kvMsg');

let coins = [];
let coinMap = new Map();
let blockchains = [];
let blockchainMap = new Map();
let chainConfigs = [];
let filteredChainConfigs = [];
let currentEditId = null;
let currentEditSnapshot = null;
let kvContext = null;
let isTableDragging = false;
let dragStartX = 0;
let dragStartScrollLeft = 0;
let selectedConfigIds = new Set();

function showMsg(el, text) {
    el.textContent = text || '';
}

function initTableDragScroll() {
    if (!tableScroll) {
        return;
    }

    tableScroll.addEventListener('mousedown', (event) => {
        if (event.button !== 0) {
            return;
        }
        if (event.target.closest('button, a, input, select, textarea')) {
            return;
        }
        isTableDragging = true;
        dragStartX = event.pageX;
        dragStartScrollLeft = tableScroll.scrollLeft;
        tableScroll.classList.add('dragging');
    });

    window.addEventListener('mousemove', (event) => {
        if (!isTableDragging) {
            return;
        }
        event.preventDefault();
        const deltaX = event.pageX - dragStartX;
        tableScroll.scrollLeft = dragStartScrollLeft - deltaX;
    });

    window.addEventListener('mouseup', () => {
        if (!isTableDragging) {
            return;
        }
        isTableDragging = false;
        tableScroll.classList.remove('dragging');
    });

    tableScroll.addEventListener('dragstart', (event) => {
        event.preventDefault();
    });
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

function getVisibleConfigIds() {
    return filteredChainConfigs.map((config) => config.id);
}

function syncSelectedIdsWithCurrentData() {
    const validIds = new Set(chainConfigs.map((config) => config.id));
    selectedConfigIds.forEach((id) => {
        if (!validIds.has(id)) {
            selectedConfigIds.delete(id);
        }
    });
}

function updateSelectAllCheckboxState() {
    if (!selectAllRowsCheckbox) {
        return;
    }
    const visibleIds = getVisibleConfigIds();
    if (!visibleIds.length) {
        selectAllRowsCheckbox.checked = false;
        selectAllRowsCheckbox.indeterminate = false;
        selectAllRowsCheckbox.disabled = true;
        return;
    }

    selectAllRowsCheckbox.disabled = false;
    const selectedVisibleCount = visibleIds.filter((id) => selectedConfigIds.has(id)).length;
    selectAllRowsCheckbox.checked = selectedVisibleCount === visibleIds.length;
    selectAllRowsCheckbox.indeterminate = selectedVisibleCount > 0 && selectedVisibleCount < visibleIds.length;
}

function setSelectAllForVisibleRows(checked) {
    getVisibleConfigIds().forEach((id) => {
        if (checked) {
            selectedConfigIds.add(id);
        } else {
            selectedConfigIds.delete(id);
        }
    });

    chainTableBody.querySelectorAll('.row-select-checkbox').forEach((checkbox) => {
        checkbox.checked = checked;
        const row = checkbox.closest('tr.data-row');
        if (row) {
            row.classList.toggle('selected-row', checked);
        }
    });
    updateSelectAllCheckboxState();
}

function getSelectedCoinChainConfigs() {
    return chainConfigs.filter((config) => selectedConfigIds.has(config.id));
}

window.getSelectedCoinChainConfigs = getSelectedCoinChainConfigs;

async function generateSystemAddress() {
    const selected = getSelectedCoinChainConfigs();
    if (selected.length !== 1) {
        showMsg(pageMsg, '请先勾选且仅勾选一条配置记录，再生成系统地址');
        return;
    }

    const config = selected[0];
    const coin = coinMap.get(config.coinId);
    if (!coin) {
        showMsg(pageMsg, '所选配置关联的币种不存在，请刷新后重试');
        return;
    }
    if (!Number.isInteger(config.blockchainId) || config.blockchainId < 0) {
        showMsg(pageMsg, '所选配置缺少有效 blockchainId');
        return;
    }

    const payload = {
        coinId: coin.coinId,
        blockchainId: config.blockchainId
    };

    generateSystemAddressBtn.disabled = true;
    showMsg(pageMsg, '');
    try {
        const response = await fetch('/api/system-addresses/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error(await parseError(response, '生成系统地址失败'));
        }

        const data = await response.json();
        const address = data && data.address ? String(data.address) : '';
        if (!address) {
            throw new Error('地址服务未返回 address');
        }
        showMsg(pageMsg, `系统地址生成成功：${address}`);
    } catch (error) {
        showMsg(pageMsg, error.message || '生成系统地址失败');
    } finally {
        generateSystemAddressBtn.disabled = false;
    }
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

function parseJsonValueOrString(text) {
    const valueText = String(text ?? '').trim();
    if (!valueText) {
        return '';
    }
    try {
        return JSON.parse(valueText);
    } catch (e) {
        return String(text);
    }
}

function parseExtraJsonText(rawText) {
    const text = String(rawText ?? '').trim();
    if (!text) {
        return {};
    }

    let parsed;
    try {
        parsed = JSON.parse(text);
    } catch (e) {
        throw new Error('扩展字段 JSON 格式错误');
    }

    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
        throw new Error('扩展字段 JSON 必须是对象，例如 {"chainId":1}');
    }

    const normalized = {};
    Object.entries(parsed).forEach(([key, value]) => {
        const normalizedKey = String(key).trim();
        if (!normalizedKey) {
            throw new Error('扩展字段 key 不能为空');
        }
        normalized[normalizedKey] = value;
    });
    return normalized;
}

function objectToPrettyJsonText(objectValue) {
    return JSON.stringify(objectValue, null, 2);
}

function objectToCompactJsonText(objectValue) {
    return JSON.stringify(objectValue);
}

function parseConfigExtraJsonObject(config) {
    const raw = String(config.extraJson ?? '').trim();
    if (!raw) {
        return {};
    }
    const parsed = JSON.parse(raw);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
        throw new Error('extraJson is not object');
    }
    return parsed;
}

function configToUpdatePayload(config, extraJsonCompactText) {
    const chainFromMap = blockchainMap.get(String(config.chainCode || '').toUpperCase());
    return {
        coinId: config.coinId,
        blockchainId: chainFromMap ? chainFromMap.blockchainId : config.blockchainId,
        chainCode: config.chainCode,
        chainName: chainFromMap ? chainFromMap.chainName : config.chainName,
        rpcUrl: config.rpcUrl,
        collectionAddress: config.collectionAddress,
        withdrawAddress: config.withdrawAddress,
        minWithdrawAmount: config.minWithdrawAmount,
        withdrawPrecision: config.withdrawPrecision,
        minDepositAmount: config.minDepositAmount,
        depositPrecision: config.depositPrecision,
        extraJson: extraJsonCompactText,
        enabled: config.enabled
    };
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

function renderChainSelect() {
    const previousValue = chainCodeInput.value;
    chainCodeInput.innerHTML = '<option value="">请选择链简称</option>';

    blockchains.forEach((item) => {
        const option = document.createElement('option');
        option.value = item.chainCode;
        const chainIdText = item.blockchainId === undefined || item.blockchainId === null ? '-' : item.blockchainId;
        option.textContent = `#${chainIdText} ${item.chainCode} - ${item.chainName}${item.enabled ? '' : '（禁用）'}`;
        option.disabled = item.enabled === false;
        chainCodeInput.appendChild(option);
    });

    if (previousValue && [...chainCodeInput.options].some((item) => item.value === previousValue)) {
        chainCodeInput.value = previousValue;
    }
    syncChainNameByCode();
}

function syncChainNameByCode() {
    const selectedCode = chainCodeInput.value;
    if (!selectedCode) {
        blockchainIdInput.value = '';
        chainNameInput.value = '';
        return;
    }
    const chain = blockchainMap.get(selectedCode.toUpperCase());
    blockchainIdInput.value = chain && chain.blockchainId !== undefined && chain.blockchainId !== null ? chain.blockchainId : '';
    chainNameInput.value = chain ? chain.chainName : '';
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

async function loadBlockchains() {
    const response = await fetch('/api/blockchain-configs');
    if (!response.ok) {
        throw new Error(await parseError(response, '加载区块链配置失败'));
    }
    blockchains = await response.json();
    blockchainMap = new Map(blockchains.map((item) => [String(item.chainCode || '').toUpperCase(), item]));
    renderChainSelect();
}

async function loadChainConfigs() {
    const selectedCoin = filterCoinSelect.value;
    const query = selectedCoin ? `?coinId=${selectedCoin}` : '';
    const response = await fetch(`/api/coin-chain-configs${query}`);
    if (!response.ok) {
        throw new Error(await parseError(response, '加载扩展参数失败'));
    }
    chainConfigs = await response.json();
    syncSelectedIdsWithCurrentData();
    applyFilter();
}

function applyFilter() {
    const chainKeyword = filterChainCode.value.trim().toUpperCase();
    const enabledValue = filterEnabled.value;

    filteredChainConfigs = chainConfigs.filter((config) => {
        const code = String(config.chainCode || '').toUpperCase();
        const name = String(config.chainName || '').toUpperCase();
        if (chainKeyword && !code.includes(chainKeyword) && !name.includes(chainKeyword)) {
            return false;
        }
        if (enabledValue !== 'all' && String(config.enabled) !== enabledValue) {
            return false;
        }
        return true;
    });

    renderTable();
}

function getCompactExtraJson(config) {
    const raw = String(config.extraJson ?? '').trim();
    if (!raw) {
        return '{}';
    }
    try {
        return objectToCompactJsonText(JSON.parse(raw));
    } catch (e) {
        return raw;
    }
}

function renderTable() {
    chainTableBody.innerHTML = '';
    if (!filteredChainConfigs.length) {
        chainTableBody.innerHTML = '<tr><td class="empty-row" colspan="11">暂无数据</td></tr>';
        updateSelectAllCheckboxState();
        return;
    }

    const fragments = filteredChainConfigs.map((config) => {
        const rpcText = String(config.rpcUrl || '-');
        const compactExtraJson = getCompactExtraJson(config);
        const shortExtraJson = compactExtraJson.length > 100 ? `${compactExtraJson.slice(0, 100)}...` : compactExtraJson;
        const detailRowId = `detail-row-${config.id}`;
        const checkedAttr = selectedConfigIds.has(config.id) ? 'checked' : '';
        const selectedClass = selectedConfigIds.has(config.id) ? 'selected-row' : '';
        return `
            <tr class="data-row ${selectedClass}">
                <td class="select-cell">
                    <input class="row-select-checkbox" type="checkbox" data-id="${config.id}" ${checkedAttr} aria-label="选择配置 ${config.id}">
                </td>
                <td>${config.id}</td>
                <td><span class="cell-ellipsis" title="${escapeHtml(coinLabel(config.coinId))}">${escapeHtml(coinLabel(config.coinId))}</span></td>
                <td>${config.blockchainId ?? '-'}</td>
                <td>${escapeHtml(config.chainCode || '-')}</td>
                <td><span class="cell-ellipsis" title="${escapeHtml(config.chainName || '-')}">${escapeHtml(config.chainName || '-')}</span></td>
                <td><span class="cell-ellipsis rpc" title="${escapeHtml(rpcText)}">${escapeHtml(rpcText)}</span></td>
                <td><span class="cell-ellipsis extra" title="${escapeHtml(compactExtraJson)}">${escapeHtml(shortExtraJson)}</span></td>
                <td><span class="status-chip ${config.enabled ? '' : 'off'}">${config.enabled ? '启用' : '禁用'}</span></td>
                <td>${formatTime(config.updateTime || config.createTime)}</td>
                <td>
                    <div class="row-actions">
                        <button type="button" class="ghost" data-action="toggle-detail" data-id="${config.id}" data-target="${detailRowId}">详情</button>
                        <button type="button" data-action="edit" data-id="${config.id}">编辑</button>
                        <button type="button" class="ghost" data-action="open-row-kv" data-id="${config.id}">展开KV</button>
                    </div>
                </td>
            </tr>
            <tr id="${detailRowId}" class="detail-row" hidden>
                <td colspan="11">
                    <div class="detail-panel">
                        <div class="detail-item"><div class="detail-label">最小提币数量</div><div class="detail-value">${escapeHtml(config.minWithdrawAmount)}</div></div>
                        <div class="detail-item"><div class="detail-label">提币精度</div><div class="detail-value">${escapeHtml(config.withdrawPrecision)}</div></div>
                        <div class="detail-item"><div class="detail-label">最小充值数量</div><div class="detail-value">${escapeHtml(config.minDepositAmount)}</div></div>
                        <div class="detail-item"><div class="detail-label">充值精度</div><div class="detail-value">${escapeHtml(config.depositPrecision)}</div></div>
                        <div class="detail-item"><div class="detail-label">归集地址</div><div class="detail-value">${escapeHtml(config.collectionAddress || '-')}</div></div>
                        <div class="detail-item"><div class="detail-label">提币地址</div><div class="detail-value">${escapeHtml(config.withdrawAddress || '-')}</div></div>
                    </div>
                </td>
            </tr>
        `;
    });

    chainTableBody.innerHTML = fragments.join('');
    updateSelectAllCheckboxState();
}

function clearForm() {
    currentEditId = null;
    currentEditSnapshot = null;
    formCoinSelect.value = '';
    chainCodeInput.value = '';
    blockchainIdInput.value = '';
    chainNameInput.value = '';
    rpcUrlInput.value = '';
    collectionAddressInput.value = '';
    withdrawAddressInput.value = '';
    minWithdrawAmountInput.value = '';
    withdrawPrecisionInput.value = '';
    minDepositAmountInput.value = '';
    depositPrecisionInput.value = '';
    formEnabledInput.value = 'true';
    extraJsonInput.value = '{}';
    showMsg(modalMsg, '');
}

function closeModal() {
    chainModalMask.classList.remove('show');
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

async function openEditModal(config) {
    clearForm();
    currentEditId = config.id;
    currentEditSnapshot = { ...config };
    chainModalTitle.textContent = '编辑扩展参数';

    formCoinSelect.value = String(config.coinId);
    chainCodeInput.value = config.chainCode || '';
    syncChainNameByCode();
    const chainFromMap = blockchainMap.get(String(config.chainCode || '').toUpperCase());
    if (!chainFromMap) {
        blockchainIdInput.value = config.blockchainId ?? '';
        chainNameInput.value = config.chainName || '';
    }
    rpcUrlInput.value = config.rpcUrl || '';
    collectionAddressInput.value = config.collectionAddress || '';
    withdrawAddressInput.value = config.withdrawAddress || '';
    minWithdrawAmountInput.value = config.minWithdrawAmount;
    withdrawPrecisionInput.value = config.withdrawPrecision;
    minDepositAmountInput.value = config.minDepositAmount;
    depositPrecisionInput.value = config.depositPrecision;
    formEnabledInput.value = config.enabled ? 'true' : 'false';

    try {
        extraJsonInput.value = objectToPrettyJsonText(parseConfigExtraJsonObject(config));
    } catch (e) {
        extraJsonInput.value = String(config.extraJson ?? '{}');
    }

    chainModalMask.classList.add('show');
}

function renderKvRows(entries) {
    if (!entries.length) {
        kvRowsBody.innerHTML = `
            <tr>
                <td><input class="kv-key" type="text" placeholder="chainId"></td>
                <td><input class="kv-value" type="text" placeholder="1 或 \"ETH\""></td>
                <td><button type="button" class="danger" data-action="remove-kv-row">删除</button></td>
            </tr>
        `;
        return;
    }

    const rows = entries.map(({ key, value }) => `
        <tr>
            <td><input class="kv-key" type="text" value="${escapeHtml(key)}" placeholder="chainId"></td>
            <td><input class="kv-value" type="text" value="${escapeHtml(value)}" placeholder="1 或 \"ETH\""></td>
            <td><button type="button" class="danger" data-action="remove-kv-row">删除</button></td>
        </tr>
    `);
    kvRowsBody.innerHTML = rows.join('');
}

function kvObjectToRows(objectValue) {
    return Object.entries(objectValue).map(([key, value]) => ({
        key,
        value: typeof value === 'string' ? value : JSON.stringify(value)
    }));
}

function openKvModal(entries, context, title) {
    kvContext = context;
    kvModalTitle.textContent = title;
    renderKvRows(entries);
    showMsg(kvMsg, '');
    kvModalMask.classList.add('show');
}

function closeKvModal() {
    kvModalMask.classList.remove('show');
    showMsg(kvMsg, '');
}

function collectKvObjectFromRows() {
    const keys = [...kvRowsBody.querySelectorAll('.kv-key')];
    const values = [...kvRowsBody.querySelectorAll('.kv-value')];
    const objectValue = {};
    const lowerKeys = new Set();

    for (let i = 0; i < keys.length; i += 1) {
        const keyText = keys[i].value.trim();
        const valueText = values[i].value.trim();

        if (!keyText && !valueText) {
            continue;
        }
        if (!keyText) {
            throw new Error('KV 编辑器中存在空 key');
        }

        const lower = keyText.toLowerCase();
        if (lowerKeys.has(lower)) {
            throw new Error(`KV 编辑器存在重复 key: ${keyText}`);
        }
        lowerKeys.add(lower);

        objectValue[keyText] = parseJsonValueOrString(valueText);
    }
    return objectValue;
}

async function updateExtraJsonByRow(configId, objectValue) {
    const target = chainConfigs.find((item) => item.id === configId);
    if (!target) {
        throw new Error('未找到要更新的扩展参数记录');
    }

    const compactJson = objectToCompactJsonText(objectValue);
    const payload = configToUpdatePayload(target, compactJson);

    const response = await fetch(`/api/coin-chain-configs/${configId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        throw new Error(await parseError(response, '保存扩展字段失败'));
    }

    const saved = await response.json();
    const index = chainConfigs.findIndex((item) => item.id === configId);
    if (index > -1) {
        chainConfigs[index] = saved;
    }
    applyFilter();
}

async function saveConfig() {
    const coinId = Number(formCoinSelect.value);
    const minWithdrawAmount = minWithdrawAmountInput.value.trim();
    const minDepositAmount = minDepositAmountInput.value.trim();

    const payload = {
        coinId,
        blockchainId: Number(blockchainIdInput.value),
        chainCode: chainCodeInput.value.trim(),
        chainName: chainNameInput.value.trim(),
        rpcUrl: rpcUrlInput.value.trim(),
        collectionAddress: collectionAddressInput.value.trim(),
        withdrawAddress: withdrawAddressInput.value.trim(),
        minWithdrawAmount,
        withdrawPrecision: Number(withdrawPrecisionInput.value),
        minDepositAmount,
        depositPrecision: Number(depositPrecisionInput.value),
        extraJson: '{}',
        enabled: formEnabledInput.value === 'true'
    };

    if (!Number.isInteger(coinId) || coinId <= 0) {
        showMsg(modalMsg, '请选择有效币种');
        return;
    }
    if (!Number.isInteger(payload.blockchainId) || payload.blockchainId < 0) {
        showMsg(modalMsg, '请选择有效区块链，确保 blockchainId 自动带出');
        return;
    }
    if (!payload.chainCode || !payload.chainName) {
        showMsg(modalMsg, '请选择区块链简称并自动带出链全称');
        return;
    }
    if (!payload.rpcUrl || !payload.collectionAddress || !payload.withdrawAddress) {
        showMsg(modalMsg, 'rpcUrl/collectionAddress/withdrawAddress 必填');
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

    try {
        payload.extraJson = objectToCompactJsonText(parseExtraJsonText(extraJsonInput.value));
    } catch (error) {
        showMsg(modalMsg, error.message || '扩展字段 JSON 无效');
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
        if (action === 'toggle-detail') {
            const detailRowId = button.dataset.target;
            if (!detailRowId) {
                return;
            }
            const detailRow = document.getElementById(detailRowId);
            if (!detailRow) {
                return;
            }
            detailRow.hidden = !detailRow.hidden;
            button.textContent = detailRow.hidden ? '详情' : '收起详情';
            return;
        }

        if (action === 'edit') {
            const config = chainConfigs.find((item) => item.id === id);
            if (config) {
                await openEditModal(config);
            }
            return;
        }

        if (action === 'open-row-kv') {
            const config = chainConfigs.find((item) => item.id === id);
            if (!config) {
                throw new Error('未找到扩展参数记录');
            }
            let objectValue = {};
            try {
                objectValue = parseConfigExtraJsonObject(config);
            } catch (e) {
                objectValue = parseExtraJsonText(config.extraJson || '{}');
            }
            openKvModal(
                kvObjectToRows(objectValue),
                { mode: 'row', configId: id },
                `扩展字段 KV 编辑器（chainConfigId=${id}）`
            );
        }
    } catch (error) {
        showMsg(pageMsg, error.message || '操作失败');
    }
});

chainTableBody.addEventListener('change', (event) => {
    const checkbox = event.target.closest('.row-select-checkbox');
    if (!checkbox) {
        return;
    }
    const id = Number(checkbox.dataset.id);
    if (!Number.isInteger(id) || id <= 0) {
        return;
    }

    if (checkbox.checked) {
        selectedConfigIds.add(id);
    } else {
        selectedConfigIds.delete(id);
    }
    const row = checkbox.closest('tr.data-row');
    if (row) {
        row.classList.toggle('selected-row', checkbox.checked);
    }
    updateSelectAllCheckboxState();
});

if (selectAllRowsCheckbox) {
    selectAllRowsCheckbox.addEventListener('change', () => {
        setSelectAllForVisibleRows(selectAllRowsCheckbox.checked);
    });
}

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
generateSystemAddressBtn.addEventListener('click', generateSystemAddress);
closeModalBtn.addEventListener('click', closeModal);
chainCodeInput.addEventListener('change', syncChainNameByCode);
chainModalMask.addEventListener('click', (event) => {
    if (event.target === chainModalMask) {
        closeModal();
    }
});

openKvEditorBtn.addEventListener('click', () => {
    try {
        const objectValue = parseExtraJsonText(extraJsonInput.value);
        openKvModal(kvObjectToRows(objectValue), { mode: 'form' }, '扩展字段 KV 编辑器');
    } catch (error) {
        showMsg(modalMsg, error.message || '扩展字段 JSON 无效');
    }
});

formatJsonBtn.addEventListener('click', () => {
    try {
        const objectValue = parseExtraJsonText(extraJsonInput.value);
        extraJsonInput.value = objectToPrettyJsonText(objectValue);
        showMsg(modalMsg, 'JSON 校验通过');
    } catch (error) {
        showMsg(modalMsg, error.message || '扩展字段 JSON 无效');
    }
});

saveConfigBtn.addEventListener('click', saveConfig);
resetFormBtn.addEventListener('click', async () => {
    if (!currentEditSnapshot) {
        clearForm();
        return;
    }
    await openEditModal(currentEditSnapshot);
});

closeKvModalBtn.addEventListener('click', closeKvModal);
kvModalMask.addEventListener('click', (event) => {
    if (event.target === kvModalMask) {
        closeKvModal();
    }
});

addKvRowBtn.addEventListener('click', () => {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input class="kv-key" type="text" placeholder="chainId"></td>
        <td><input class="kv-value" type="text" placeholder="1 或 \"ETH\""></td>
        <td><button type="button" class="danger" data-action="remove-kv-row">删除</button></td>
    `;
    kvRowsBody.appendChild(row);
});

kvRowsBody.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) {
        return;
    }

    if (button.dataset.action === 'remove-kv-row') {
        const row = button.closest('tr');
        if (row) {
            row.remove();
        }
        if (!kvRowsBody.querySelector('tr')) {
            addKvRowBtn.click();
        }
    }
});

applyKvBtn.addEventListener('click', async () => {
    showMsg(kvMsg, '');
    try {
        const objectValue = collectKvObjectFromRows();

        if (!kvContext) {
            throw new Error('未找到 KV 上下文');
        }

        if (kvContext.mode === 'form') {
            extraJsonInput.value = objectToPrettyJsonText(objectValue);
            closeKvModal();
            return;
        }

        if (kvContext.mode === 'row') {
            await updateExtraJsonByRow(kvContext.configId, objectValue);
            closeKvModal();
            showMsg(pageMsg, '扩展字段已保存');
        }
    } catch (error) {
        showMsg(kvMsg, error.message || 'KV 编辑失败');
    }
});

(async function bootstrap() {
    try {
        initTableDragScroll();
        await Promise.all([loadCoins(), loadBlockchains()]);
        await loadChainConfigs();
    } catch (error) {
        showMsg(pageMsg, error.message || '初始化失败');
    }
})();
