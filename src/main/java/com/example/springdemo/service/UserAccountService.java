package com.example.springdemo.service;

import com.example.springdemo.domain.AppUser;
import com.example.springdemo.repository.AppUserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserAccountService {
    private static final String DEFAULT_ADMIN_USERNAME = "admin";
    private static final String DEFAULT_ADMIN_PASSWORD = "123456";

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    public UserAccountService(AppUserRepository appUserRepository, PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public void ensureDefaultAdminUser() {
        if (appUserRepository.existsByUsernameIgnoreCase(DEFAULT_ADMIN_USERNAME)) {
            return;
        }
        AppUser admin = new AppUser(
            DEFAULT_ADMIN_USERNAME,
            passwordEncoder.encode(DEFAULT_ADMIN_PASSWORD),
            Boolean.TRUE
        );
        appUserRepository.save(admin);
    }

    public AppUser register(String username, String password, String confirmPassword) {
        String normalizedUsername = normalizeUsername(username);
        String normalizedPassword = validatePassword(password);
        validateConfirmPassword(normalizedPassword, confirmPassword);

        if (appUserRepository.existsByUsernameIgnoreCase(normalizedUsername)) {
            throw new IllegalArgumentException("username already exists");
        }

        AppUser user = new AppUser(
            normalizedUsername,
            passwordEncoder.encode(normalizedPassword),
            Boolean.TRUE
        );
        return appUserRepository.save(user);
    }

    private String normalizeUsername(String username) {
        if (username == null) {
            throw new IllegalArgumentException("username is required");
        }
        String normalized = username.trim();
        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("username is required");
        }
        if (normalized.length() < 3 || normalized.length() > 32) {
            throw new IllegalArgumentException("username length must be between 3 and 32");
        }
        if (!normalized.matches("^[a-zA-Z0-9_]+$")) {
            throw new IllegalArgumentException("username only supports letters, numbers and underscore");
        }
        return normalized;
    }

    private String validatePassword(String password) {
        if (password == null || password.isEmpty()) {
            throw new IllegalArgumentException("password is required");
        }
        if (password.length() < 6 || password.length() > 64) {
            throw new IllegalArgumentException("password length must be between 6 and 64");
        }
        return password;
    }

    private void validateConfirmPassword(String password, String confirmPassword) {
        if (confirmPassword == null || confirmPassword.isEmpty()) {
            throw new IllegalArgumentException("confirmPassword is required");
        }
        if (!password.equals(confirmPassword)) {
            throw new IllegalArgumentException("password and confirmPassword do not match");
        }
    }
}
