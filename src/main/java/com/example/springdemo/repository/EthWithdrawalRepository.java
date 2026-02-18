package com.example.springdemo.repository;

import com.example.springdemo.domain.EthWithdrawal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EthWithdrawalRepository extends JpaRepository<EthWithdrawal, Long> {
    List<EthWithdrawal> findByUidOrderByCreateTimeDesc(Long uid);

    Optional<EthWithdrawal> findByIdAndUid(Long id, Long uid);
}
