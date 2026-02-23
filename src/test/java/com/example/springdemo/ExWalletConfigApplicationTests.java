package com.example.springdemo;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(
    classes = ExWalletConfigApplication.class,
    properties = "app.bootstrap.seed-default-config-data=false"
)
class ExWalletConfigApplicationTests {

    @Test
    void contextLoads() {
    }
}
