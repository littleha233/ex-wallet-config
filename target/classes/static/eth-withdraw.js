const uidInput = document.getElementById('uid');
const fromWalletSelect = document.getElementById('fromWalletId');
const toAddressInput = document.getElementById('toAddress');
const amountEthInput = document.getElementById('amountEth');
const withdrawalIdInput = document.getElementById('withdrawalId');
const loadAddressBtn = document.getElementById('loadAddressBtn');
const buildBtn = document.getElementById('buildBtn');
const signBtn = document.getElementById('signBtn');
const broadcastBtn = document.getElementById('broadcastBtn');
const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
const messageBox = document.getElementById('message');
const latestBox = document.getElementById('latest');
const historyTbody = document.getElementById('historyTbody');

function showMessage(text) {
    messageBox.textContent = text || '';
}

async function extractErrorMessage(response, fallbackMessage) {
    try {
        const body = await response.json();
        if (body && typeof body.message === 'string' && body.message.trim()) {
            return body.message;
        }
        if (body && typeof body.detail === 'string' && body.detail.trim()) {
            return body.detail;
        }
    } catch (e) {
        // ignore json parsing error
    }

    try {
        const text = await response.text();
        if (text && text.trim()) {
            return text;
        }
    } catch (e) {
        // ignore text parsing error
    }

    return fallbackMessage;
}

function validUid() {
    const uidText = uidInput.value.trim();
    const uid = Number(uidText);
    if (!uidText || !Number.isInteger(uid) || uid <= 0) {
        return null;
    }
    return uid;
}

function validWithdrawalId() {
    const idText = withdrawalIdInput.value.trim();
    const id = Number(idText);
    if (!idText || !Number.isInteger(id) || id <= 0) {
        return null;
    }
    return id;
}

function renderLatest(withdrawal) {
    if (!withdrawal) {
        latestBox.innerHTML = '<div class="k">No withdrawal yet.</div>';
        return;
    }

    latestBox.innerHTML = `
        <div><span class="k">ID</span> <span class="v">${withdrawal.id}</span></div>
        <div><span class="k">UID</span> <span class="v">${withdrawal.uid}</span></div>
        <div><span class="k">From</span> <span class="v">${withdrawal.fromAddress}</span></div>
        <div><span class="k">To</span> <span class="v">${withdrawal.toAddress}</span></div>
        <div><span class="k">Amount Wei</span> <span class="v">${withdrawal.amountWei}</span></div>
        <div><span class="k">Tx Hash</span> <span class="v">${withdrawal.txHash || '-'}</span></div>
        <div><span class="k">Status</span> <span class="v">${withdrawal.status}</span></div>
        <div><span class="k">Create Time</span> <span class="v">${new Date(withdrawal.createTime).toLocaleString()}</span></div>
    `;
}

function renderHistory(withdrawals) {
    historyTbody.innerHTML = '';
    if (!withdrawals || withdrawals.length === 0) {
        historyTbody.innerHTML = '<tr><td colspan="8">No data.</td></tr>';
        return;
    }

    withdrawals.forEach((item) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${item.uid}</td>
            <td>${item.fromAddress}</td>
            <td>${item.toAddress}</td>
            <td>${item.amountWei}</td>
            <td>${item.txHash || '-'}</td>
            <td>${item.status}</td>
            <td>${new Date(item.createTime).toLocaleString()}</td>
        `;
        tr.style.cursor = 'pointer';
        tr.title = 'Click to use this withdrawalId';
        tr.addEventListener('click', () => {
            withdrawalIdInput.value = String(item.id);
            renderLatest(item);
        });
        historyTbody.appendChild(tr);
    });
}

async function loadAddressList() {
    const uid = validUid();
    if (!uid) {
        showMessage('Please enter a valid positive integer uid.');
        return;
    }

    const response = await fetch(`/api/eth-addresses?uid=${uid}`);
    if (!response.ok) {
        throw new Error(await extractErrorMessage(response, 'Failed to load address list'));
    }

    const wallets = await response.json();
    fromWalletSelect.innerHTML = '';
    if (!wallets || wallets.length === 0) {
        fromWalletSelect.innerHTML = '<option value="">No available addresses for this uid</option>';
        return;
    }

    wallets.forEach((wallet) => {
        const option = document.createElement('option');
        option.value = wallet.id;
        option.textContent = `#${wallet.id} | ${wallet.address}`;
        fromWalletSelect.appendChild(option);
    });
}

async function loadHistory() {
    const uid = validUid();
    if (!uid) {
        historyTbody.innerHTML = '<tr><td colspan="8">Please input uid first.</td></tr>';
        return;
    }

    const response = await fetch(`/api/eth-withdrawals?uid=${uid}`);
    if (!response.ok) {
        throw new Error(await extractErrorMessage(response, 'Failed to load withdrawal history'));
    }

    const list = await response.json();
    renderHistory(list);
}

async function sendWithdrawal() {
    const uid = validUid();
    if (!uid) {
        showMessage('Please enter a valid positive integer uid.');
        return;
    }

    const fromWalletId = Number(fromWalletSelect.value);
    if (!Number.isInteger(fromWalletId) || fromWalletId <= 0) {
        showMessage('Please select a valid from address.');
        return;
    }

    const toAddress = toAddressInput.value.trim();
    const amountEth = amountEthInput.value.trim();
    if (!toAddress) {
        showMessage('Please input a target toAddress.');
        return;
    }
    if (!amountEth || Number(amountEth) <= 0) {
        showMessage('Please input a positive withdrawal amount.');
        return;
    }

    buildBtn.disabled = true;
    showMessage('');
    try {
        const response = await fetch('/api/eth-withdrawals/build', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uid,
                fromWalletId,
                toAddress,
                amountEth
            })
        });

        if (!response.ok) {
            throw new Error(await extractErrorMessage(response, 'Failed to send withdrawal transaction'));
        }

        const result = await response.json();
        withdrawalIdInput.value = String(result.id);
        renderLatest(result);
        await loadHistory();
        showMessage(`Build completed, withdrawalId=${result.id}.`);
    } catch (error) {
        showMessage(error.message || 'Request failed');
    } finally {
        buildBtn.disabled = false;
    }
}

async function signWithdrawal() {
    const uid = validUid();
    if (!uid) {
        showMessage('Please enter a valid positive integer uid.');
        return;
    }
    const withdrawalId = validWithdrawalId();
    if (!withdrawalId) {
        showMessage('Please enter a valid withdrawalId.');
        return;
    }

    signBtn.disabled = true;
    showMessage('');
    try {
        const response = await fetch('/api/eth-withdrawals/sign', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ uid, withdrawalId })
        });
        if (!response.ok) {
            throw new Error(await extractErrorMessage(response, 'Failed to sign transaction'));
        }

        const result = await response.json();
        renderLatest(result);
        await loadHistory();
        showMessage(`Sign completed for withdrawalId=${result.id}.`);
    } catch (error) {
        showMessage(error.message || 'Request failed');
    } finally {
        signBtn.disabled = false;
    }
}

async function broadcastWithdrawal() {
    const uid = validUid();
    if (!uid) {
        showMessage('Please enter a valid positive integer uid.');
        return;
    }
    const withdrawalId = validWithdrawalId();
    if (!withdrawalId) {
        showMessage('Please enter a valid withdrawalId.');
        return;
    }

    broadcastBtn.disabled = true;
    showMessage('');
    try {
        const response = await fetch('/api/eth-withdrawals/broadcast', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ uid, withdrawalId })
        });
        if (!response.ok) {
            throw new Error(await extractErrorMessage(response, 'Failed to broadcast transaction'));
        }

        const result = await response.json();
        renderLatest(result);
        await loadHistory();
        showMessage(`Broadcast completed, txHash=${result.txHash || '-'}`);
    } catch (error) {
        showMessage(error.message || 'Request failed');
    } finally {
        broadcastBtn.disabled = false;
    }
}

loadAddressBtn.addEventListener('click', async () => {
    showMessage('');
    try {
        await loadAddressList();
        await loadHistory();
    } catch (error) {
        showMessage(error.message || 'Request failed');
    }
});

refreshHistoryBtn.addEventListener('click', async () => {
    showMessage('');
    try {
        await loadHistory();
    } catch (error) {
        showMessage(error.message || 'Request failed');
    }
});

buildBtn.addEventListener('click', sendWithdrawal);
signBtn.addEventListener('click', signWithdrawal);
broadcastBtn.addEventListener('click', broadcastWithdrawal);
