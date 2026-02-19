package com.example.springdemo.config;

import com.example.springdemo.service.UserAccountService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DefaultUserInitializer implements CommandLineRunner {
    private final UserAccountService userAccountService;

    public DefaultUserInitializer(UserAccountService userAccountService) {
        this.userAccountService = userAccountService;
    }

    @Override
    public void run(String... args) {
        userAccountService.ensureDefaultAdminUser();
    }
}
