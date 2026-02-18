const coinIdInput = document.getElementById('coinIdInput');
const coinSymbolInput = document.getElementById('coinSymbolInput');
const coinFullNameInput = document.getElementById('coinFullNameInput');
const coinPrecisionInput = document.getElementById('coinPrecisionInput');
const coinIconFileInput = document.getElementById('coinIconFileInput');
const uploadCoinIconBtn = document.getElementById('uploadCoinIconBtn');
const coinIconUrlInput = document.getElementById('coinIconUrlInput');
const coinIconPreviewBox = document.getElementById('coinIconPreviewBox');
const coinIconPreviewImage = document.getElementById('coinIconPreviewImage');
const coinEnabledInput = document.getElementById('coinEnabledInput');
const saveCoinBtn = document.getElementById('saveCoinBtn');
const resetCoinBtn = document.getElementById('resetCoinBtn');
const coinMsg = document.getElementById('coinMsg');
const coinTableBody = document.getElementById('coinTableBody');

const selectedCoinInput = document.getElementById('selectedCoinInput');
const chainCodeInput = document.getElementById('chainCodeInput');
const rpcUrlInput = document.getElementById('rpcUrlInput');
const collectionAddressInput = document.getElementById('collectionAddressInput');
const withdrawAddressInput = document.getElementById('withdrawAddressInput');
const minWithdrawAmountInput = document.getElementById('minWithdrawAmountInput');
const withdrawPrecisionInput = document.getElementById('withdrawPrecisionInput');
const minDepositAmountInput = document.getElementById('minDepositAmountInput');
const depositPrecisionInput = document.getElementById('depositPrecisionInput');
const chainEnabledInput = document.getElementById('chainEnabledInput');
const saveChainConfigBtn = document.getElementById('saveChainConfigBtn');
const resetChainConfigBtn = document.getElementById('resetChainConfigBtn');
const refreshChainConfigBtn = document.getElementById('refreshChainConfigBtn');
const chainMsg = document.getElementById('chainMsg');
const chainTableBody = document.getElementById('chainTableBody');

const extraPanel = document.getElementById('extraPanel');
const extraPanelHint = document.getElementById('extraPanelHint');
const extraKeyInput = document.getElementById('extraKeyInput');
const extraValueInput = document.getElementById('extraValueInput');
const saveExtraBtn = document.getElementById('saveExtraBtn');
const resetExtraBtn = document.getElementById('resetExtraBtn');
const extraMsg = document.getElementById('extraMsg');
const extraTableBody = document.getElementById('extraTableBody');

let coins = [];
let chainConfigs = [];
let currentEditCoinId = null;
let currentEditChainConfigId = null;
let currentExtraChainConfigId = null;

function showMessage(el, text) {
    el.textContent = text || '';
}

async function parseError(response, fallback) {
    try {
        const body = await response.json();
        if (body && typeof body.message === 'string' && body.message.trim()) {
            return body.message;
        }
        if (body && typeof body.detail === 'string' && body.detail.trim()) {
            return body.detail;
        }
    } catch (e) {
        // ignore
    }
    try {
        const text = await response.text();
        if (text && text.trim()) {
            return text;
        }
    } catch (e) {
        // ignore
    }
    return fallback;
}

function clearCoinForm() {
    currentEditCoinId = null;
    coinIdInput.value = '';
    coinSymbolInput.value = '';
    coinFullNameInput.value = '';
    coinPrecisionInput.value = '';
    coinIconFileInput.value = '';
    coinIconUrlInput.value = '';
    setCoinIconPreview('');
    coinEnabledInput.value = 'true';
}

function clearChainForm() {
    currentEditChainConfigId = null;
    chainCodeInput.value = '';
    rpcUrlInput.value = '';
    collectionAddressInput.value = '';
    withdrawAddressInput.value = '';
    minWithdrawAmountInput.value = '';
    withdrawPrecisionInput.value = '';
    minDepositAmountInput.value = '';
    depositPrecisionInput.value = '';
    chainEnabledInput.value = 'true';
}

function clearExtraForm() {
    extraKeyInput.value = '';
    extraValueInput.value = '';
}

function setCoinIconPreview(url) {
    if (!url) {
        coinIconPreviewImage.removeAttribute('src');
        coinIconPreviewBox.classList.add('hidden');
        return;
    }
    coinIconPreviewImage.src = url;
    coinIconPreviewBox.classList.remove('hidden');
}

async function loadCoins() {
    const response = await fetch('/api/coins');
    if (!response.ok) {
        throw new Error(await parseError(response, 'Failed to load coins'));
    }
    coins = await response.json();
    renderCoinTable();
    renderCoinSelect();
}

function renderCoinTable() {
    coinTableBody.innerHTML = '';
    if (!coins || coins.length === 0) {
        coinTableBody.innerHTML = '<tr><td colspan="8">No coin config yet.</td></tr>';
        return;
    }

    coins.forEach((coin) => {
        const tr = document.createElement('tr');
        const iconCell = coin.iconUrl
            ? `<img src="${coin.iconUrl}" alt="${coin.symbol} icon" style="width:24px;height:24px;border-radius:6px;border:1px solid #dbe4ef;object-fit:cover;">`
            : '-';
        tr.innerHTML = `
            <td>${coin.id}</td>
            <td>${coin.coinId}</td>
            <td>${coin.symbol}</td>
            <td>${coin.fullName}</td>
            <td>${coin.coinPrecision}</td>
            <td>${iconCell}</td>
            <td>${coin.enabled ? 'Y' : 'N'}</td>
            <td>
                <button type="button" data-action="edit-coin" data-id="${coin.id}">Edit</button>
                <button type="button" class="ghost" data-action="select-coin" data-id="${coin.id}">Use In Chain Config</button>
            </td>
        `;
        coinTableBody.appendChild(tr);
    });
}

async function uploadCoinIcon() {
    const file = coinIconFileInput.files && coinIconFileInput.files[0];
    if (!file) {
        showMessage(coinMsg, 'Please choose an image file first.');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    uploadCoinIconBtn.disabled = true;
    showMessage(coinMsg, '');
    try {
        const response = await fetch('/api/coins/icon', {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            throw new Error(await parseError(response, 'Failed to upload coin icon'));
        }
        const data = await response.json();
        coinIconUrlInput.value = data.iconUrl || '';
        setCoinIconPreview(coinIconUrlInput.value);
        showMessage(coinMsg, 'Icon uploaded successfully.');
    } catch (error) {
        showMessage(coinMsg, error.message || 'Upload failed');
    } finally {
        uploadCoinIconBtn.disabled = false;
    }
}

function renderCoinSelect() {
    const previousValue = selectedCoinInput.value;
    selectedCoinInput.innerHTML = '';
    if (!coins || coins.length === 0) {
        selectedCoinInput.innerHTML = '<option value="">No coin yet</option>';
        return;
    }

    coins.forEach((coin) => {
        const option = document.createElement('option');
        option.value = String(coin.id);
        option.textContent = `${coin.coinId} | ${coin.symbol} | ${coin.fullName}`;
        selectedCoinInput.appendChild(option);
    });

    if (previousValue && coins.some((coin) => String(coin.id) === previousValue)) {
        selectedCoinInput.value = previousValue;
    } else {
        selectedCoinInput.selectedIndex = 0;
    }
}

async function saveCoin() {
    const payload = {
        coinId: coinIdInput.value.trim(),
        symbol: coinSymbolInput.value.trim(),
        fullName: coinFullNameInput.value.trim(),
        coinPrecision: Number(coinPrecisionInput.value),
        iconUrl: coinIconUrlInput.value.trim(),
        enabled: coinEnabledInput.value === 'true'
    };

    if (!payload.coinId || !payload.symbol || !payload.fullName || !Number.isInteger(payload.coinPrecision) || payload.coinPrecision < 0) {
        showMessage(coinMsg, 'coinId/symbol/fullName/coinPrecision are required, and precision must be >= 0.');
        return;
    }

    saveCoinBtn.disabled = true;
    showMessage(coinMsg, '');
    try {
        const isUpdate = currentEditCoinId !== null;
        const response = await fetch(isUpdate ? `/api/coins/${currentEditCoinId}` : '/api/coins', {
            method: isUpdate ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error(await parseError(response, 'Failed to save coin'));
        }
        await loadCoins();
        clearCoinForm();
        showMessage(coinMsg, 'Coin saved successfully.');
    } catch (error) {
        showMessage(coinMsg, error.message || 'Request failed');
    } finally {
        saveCoinBtn.disabled = false;
    }
}

async function loadChainConfigs() {
    const coinId = Number(selectedCoinInput.value);
    if (!Number.isInteger(coinId) || coinId <= 0) {
        chainConfigs = [];
        renderChainConfigTable();
        return;
    }
    const response = await fetch(`/api/coin-chain-configs?coinId=${coinId}`);
    if (!response.ok) {
        throw new Error(await parseError(response, 'Failed to load chain configs'));
    }
    chainConfigs = await response.json();
    renderChainConfigTable();
}

function renderChainConfigTable() {
    chainTableBody.innerHTML = '';
    if (!chainConfigs || chainConfigs.length === 0) {
        chainTableBody.innerHTML = '<tr><td colspan="7">No chain config for selected coin.</td></tr>';
        return;
    }

    chainConfigs.forEach((config) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${config.id}</td>
            <td>${config.chainCode}</td>
            <td>${config.rpcUrl}</td>
            <td>${config.minWithdrawAmount} / ${config.withdrawPrecision}</td>
            <td>${config.minDepositAmount} / ${config.depositPrecision}</td>
            <td>${config.enabled ? 'Y' : 'N'}</td>
            <td>
                <button type="button" data-action="edit-chain" data-id="${config.id}">Edit</button>
                <button type="button" class="ghost" data-action="open-extra" data-id="${config.id}" data-chain="${config.chainCode}">
                    Expand Extra
                </button>
            </td>
        `;
        chainTableBody.appendChild(tr);
    });
}

async function saveChainConfig() {
    const coinId = Number(selectedCoinInput.value);
    const minWithdrawAmount = minWithdrawAmountInput.value.trim();
    const minDepositAmount = minDepositAmountInput.value.trim();
    const minWithdrawAmountNum = Number(minWithdrawAmount);
    const minDepositAmountNum = Number(minDepositAmount);
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
        enabled: chainEnabledInput.value === 'true'
    };

    if (!Number.isInteger(coinId) || coinId <= 0) {
        showMessage(chainMsg, 'Please select a valid coin first.');
        return;
    }
    if (!payload.chainCode || !payload.rpcUrl || !payload.collectionAddress || !payload.withdrawAddress) {
        showMessage(chainMsg, 'chainCode/rpcUrl/collectionAddress/withdrawAddress are required.');
        return;
    }
    if (!payload.minWithdrawAmount || !Number.isFinite(minWithdrawAmountNum) || minWithdrawAmountNum < 0 || !Number.isInteger(payload.withdrawPrecision) || payload.withdrawPrecision < 0) {
        showMessage(chainMsg, 'minWithdrawAmount must be >= 0 and withdrawPrecision must be >= 0.');
        return;
    }
    if (!payload.minDepositAmount || !Number.isFinite(minDepositAmountNum) || minDepositAmountNum < 0 || !Number.isInteger(payload.depositPrecision) || payload.depositPrecision < 0) {
        showMessage(chainMsg, 'minDepositAmount must be >= 0 and depositPrecision must be >= 0.');
        return;
    }

    saveChainConfigBtn.disabled = true;
    showMessage(chainMsg, '');
    try {
        const isUpdate = currentEditChainConfigId !== null;
        const response = await fetch(isUpdate ? `/api/coin-chain-configs/${currentEditChainConfigId}` : '/api/coin-chain-configs', {
            method: isUpdate ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error(await parseError(response, 'Failed to save chain config'));
        }

        await loadChainConfigs();
        clearChainForm();
        showMessage(chainMsg, 'Chain config saved successfully.');
    } catch (error) {
        showMessage(chainMsg, error.message || 'Request failed');
    } finally {
        saveChainConfigBtn.disabled = false;
    }
}

async function openExtraPanel(chainConfigId, chainCode) {
    currentExtraChainConfigId = chainConfigId;
    extraPanel.classList.remove('hidden');
    extraPanelHint.textContent = `Current chain config id=${chainConfigId}, chain=${chainCode}`;
    clearExtraForm();
    showMessage(extraMsg, '');
    await loadExtras();
}

async function loadExtras() {
    if (!currentExtraChainConfigId) {
        extraTableBody.innerHTML = '<tr><td colspan="4">Select chain config first.</td></tr>';
        return;
    }
    const response = await fetch(`/api/coin-chain-configs/${currentExtraChainConfigId}/extras`);
    if (!response.ok) {
        throw new Error(await parseError(response, 'Failed to load extras'));
    }
    const extras = await response.json();
    renderExtraTable(extras);
}

function renderExtraTable(extras) {
    extraTableBody.innerHTML = '';
    if (!extras || extras.length === 0) {
        extraTableBody.innerHTML = '<tr><td colspan="4">No key/value extra config yet.</td></tr>';
        return;
    }

    extras.forEach((extra) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${extra.id}</td>
            <td>${extra.paramKey}</td>
            <td>${extra.paramValue}</td>
            <td>
                <button type="button" data-action="fill-extra" data-id="${extra.id}">Fill</button>
                <button type="button" class="danger" data-action="delete-extra" data-id="${extra.id}">Delete</button>
            </td>
        `;
        tr.dataset.extraKey = extra.paramKey;
        tr.dataset.extraValue = extra.paramValue;
        extraTableBody.appendChild(tr);
    });
}

async function saveExtra() {
    if (!currentExtraChainConfigId) {
        showMessage(extraMsg, 'Please choose a chain config first.');
        return;
    }
    const paramKey = extraKeyInput.value.trim();
    const paramValue = extraValueInput.value.trim();
    if (!paramKey || !paramValue) {
        showMessage(extraMsg, 'paramKey and paramValue are required.');
        return;
    }

    saveExtraBtn.disabled = true;
    showMessage(extraMsg, '');
    try {
        const response = await fetch(`/api/coin-chain-configs/${currentExtraChainConfigId}/extras`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paramKey, paramValue })
        });
        if (!response.ok) {
            throw new Error(await parseError(response, 'Failed to save extra param'));
        }
        await loadExtras();
        clearExtraForm();
        showMessage(extraMsg, 'Extra param saved successfully.');
    } catch (error) {
        showMessage(extraMsg, error.message || 'Request failed');
    } finally {
        saveExtraBtn.disabled = false;
    }
}

async function deleteExtra(extraId) {
    if (!currentExtraChainConfigId) {
        showMessage(extraMsg, 'Please choose a chain config first.');
        return;
    }
    const response = await fetch(`/api/coin-chain-configs/${currentExtraChainConfigId}/extras/${extraId}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        throw new Error(await parseError(response, 'Failed to delete extra param'));
    }
    await loadExtras();
    showMessage(extraMsg, 'Extra param deleted.');
}

coinTableBody.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) {
        return;
    }
    const action = button.dataset.action;
    const id = Number(button.dataset.id);
    if (!Number.isInteger(id) || id <= 0) {
        return;
    }

    if (action === 'edit-coin') {
        const coin = coins.find((item) => item.id === id);
        if (!coin) {
            return;
        }
        currentEditCoinId = id;
        coinIdInput.value = coin.coinId;
        coinSymbolInput.value = coin.symbol;
        coinFullNameInput.value = coin.fullName;
        coinPrecisionInput.value = String(coin.coinPrecision);
        coinIconFileInput.value = '';
        coinIconUrlInput.value = coin.iconUrl || '';
        setCoinIconPreview(coin.iconUrl || '');
        coinEnabledInput.value = coin.enabled ? 'true' : 'false';
    } else if (action === 'select-coin') {
        selectedCoinInput.value = String(id);
        showMessage(chainMsg, '');
        loadChainConfigs().catch((error) => {
            showMessage(chainMsg, error.message || 'Failed to load chain configs');
        });
    }
});

chainTableBody.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) {
        return;
    }
    const action = button.dataset.action;
    const row = button.closest('tr');
    const id = Number(button.dataset.id);
    if (!Number.isInteger(id) || id <= 0 || !row) {
        return;
    }

    if (action === 'edit-chain') {
        currentEditChainConfigId = id;
        const target = chainConfigs.find((item) => item.id === id);
        if (!target) {
            showMessage(chainMsg, 'Current chain config not found, please refresh list.');
            return;
        }
        chainCodeInput.value = target.chainCode;
        rpcUrlInput.value = target.rpcUrl;
        collectionAddressInput.value = target.collectionAddress;
        withdrawAddressInput.value = target.withdrawAddress;
        minWithdrawAmountInput.value = target.minWithdrawAmount;
        withdrawPrecisionInput.value = target.withdrawPrecision;
        minDepositAmountInput.value = target.minDepositAmount;
        depositPrecisionInput.value = target.depositPrecision;
        chainEnabledInput.value = target.enabled ? 'true' : 'false';
    } else if (action === 'open-extra') {
        const chainCode = button.dataset.chain || '';
        openExtraPanel(id, chainCode).catch((error) => {
            showMessage(extraMsg, error.message || 'Failed to open extra panel');
        });
    }
});

extraTableBody.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) {
        return;
    }
    const action = button.dataset.action;
    const id = Number(button.dataset.id);
    const row = button.closest('tr');
    if (action === 'fill-extra' && row) {
        extraKeyInput.value = row.dataset.extraKey || '';
        extraValueInput.value = row.dataset.extraValue || '';
    } else if (action === 'delete-extra' && Number.isInteger(id) && id > 0) {
        deleteExtra(id).catch((error) => {
            showMessage(extraMsg, error.message || 'Failed to delete');
        });
    }
});

saveCoinBtn.addEventListener('click', saveCoin);
uploadCoinIconBtn.addEventListener('click', uploadCoinIcon);
resetCoinBtn.addEventListener('click', () => {
    clearCoinForm();
    showMessage(coinMsg, '');
});
selectedCoinInput.addEventListener('change', () => {
    showMessage(chainMsg, '');
    clearChainForm();
    loadChainConfigs().catch((error) => {
        showMessage(chainMsg, error.message || 'Failed to load chain configs');
    });
});
saveChainConfigBtn.addEventListener('click', saveChainConfig);
resetChainConfigBtn.addEventListener('click', () => {
    clearChainForm();
    showMessage(chainMsg, '');
});
refreshChainConfigBtn.addEventListener('click', () => {
    showMessage(chainMsg, '');
    loadChainConfigs().catch((error) => {
        showMessage(chainMsg, error.message || 'Failed to load chain configs');
    });
});
saveExtraBtn.addEventListener('click', saveExtra);
resetExtraBtn.addEventListener('click', () => {
    clearExtraForm();
    showMessage(extraMsg, '');
});

async function bootstrap() {
    try {
        await loadCoins();
        await loadChainConfigs();
    } catch (error) {
        showMessage(coinMsg, error.message || 'Initialization failed');
    }
}

bootstrap();
