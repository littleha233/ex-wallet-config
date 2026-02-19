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
        chainCode: config.chainCode,
        chainName: config.chainName || (chainFromMap ? chainFromMap.chainName : ''),
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
        chainNameInput.value = '';
        return;
    }
    const chain = blockchainMap.get(selectedCode.toUpperCase());
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

function getJsonPreview(config) {
    try {
        const compact = objectToCompactJsonText(parseConfigExtraJsonObject(config));
        if (compact === '{}') {
            return '<code>{}</code>';
        }
        const text = compact.length > 80 ? `${compact.slice(0, 80)}...` : compact;
        return `<code title="${escapeHtml(compact)}">${escapeHtml(text)}</code>`;
    } catch (e) {
        const raw = String(config.extraJson ?? '');
        const text = raw.length > 80 ? `${raw.slice(0, 80)}...` : raw;
        return `<code title="${escapeHtml(raw)}">${escapeHtml(text || '{}')}</code>`;
    }
}

function renderTable() {
    chainTableBody.innerHTML = '';
    if (!filteredChainConfigs.length) {
        chainTableBody.innerHTML = '<tr><td colspan="10">暂无数据</td></tr>';
        return;
    }

    const fragments = filteredChainConfigs.map((config) => `
        <tr>
            <td>${config.id}</td>
            <td>${escapeHtml(coinLabel(config.coinId))}</td>
            <td>${escapeHtml(config.chainCode)}</td>
            <td>${escapeHtml(config.chainName || '-')}</td>
            <td>${escapeHtml(config.rpcUrl)}</td>
            <td>${escapeHtml(config.minWithdrawAmount)} / ${config.withdrawPrecision}</td>
            <td>${escapeHtml(config.minDepositAmount)} / ${config.depositPrecision}</td>
            <td>${getJsonPreview(config)}</td>
            <td>${config.enabled ? '启用' : '禁用'}</td>
            <td>
                <button type="button" data-action="edit" data-id="${config.id}">编辑</button>
                <button type="button" class="ghost" data-action="open-row-kv" data-id="${config.id}">展开KV</button>
            </td>
        </tr>
    `);

    chainTableBody.innerHTML = fragments.join('');
}

function clearForm() {
    currentEditId = null;
    currentEditSnapshot = null;
    formCoinSelect.value = '';
    chainCodeInput.value = '';
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
    chainNameInput.value = config.chainName || chainNameInput.value;
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
        await Promise.all([loadCoins(), loadBlockchains()]);
        await loadChainConfigs();
    } catch (error) {
        showMsg(pageMsg, error.message || '初始化失败');
    }
})();
