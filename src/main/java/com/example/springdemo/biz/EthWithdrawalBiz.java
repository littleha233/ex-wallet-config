package com.example.springdemo.biz;

import com.example.springdemo.domain.EthWithdrawal;

import java.math.BigDecimal;
import java.util.List;

public interface EthWithdrawalBiz {
    EthWithdrawal build(Long uid, Long fromWalletId, String toAddress, BigDecimal amountEth);

    EthWithdrawal sign(Long uid, Long withdrawalId);

    EthWithdrawal broadcast(Long uid, Long withdrawalId);

    EthWithdrawal withdraw(Long uid, Long fromWalletId, String toAddress, BigDecimal amountEth);

    List<EthWithdrawal> listByUid(Long uid);
}
