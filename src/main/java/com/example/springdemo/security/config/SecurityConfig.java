package com.example.springdemo.security.config;

import com.example.springdemo.security.filter.LoginValidationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

@Configuration
public class SecurityConfig {
    private final LoginValidationFilter loginValidationFilter;

    public SecurityConfig(LoginValidationFilter loginValidationFilter) {
        this.loginValidationFilter = loginValidationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .addFilterBefore(loginValidationFilter, UsernamePasswordAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/login",
                    "/register",
                    "/error",
                    "/favicon.ico",
                    "/config-layout.css",
                    "/coin-config.js",
                    "/coin-chain-config.js",
                    "/blockchain-config.js",
                    "/uploads/**"
                ).permitAll()
                .requestMatchers("/api/facade/**").permitAll()
                .requestMatchers(
                    "/",
                    "/coin-config",
                    "/coin-chain-config",
                    "/blockchain-config"
                ).authenticated()
                .requestMatchers("/api/coins/**", "/api/coin-chain-configs/**", "/api/blockchain-configs/**", "/api/system-addresses/**").authenticated()
                .anyRequest().authenticated()
            )
            .formLogin(form -> form
                .loginPage("/login")
                .defaultSuccessUrl("/", false)
                .failureUrl("/login?error=true")
                .permitAll()
            )
            .logout(logout -> logout
                .logoutRequestMatcher(new AntPathRequestMatcher("/logout", "GET"))
                .logoutSuccessUrl("/login?logout=true")
                .permitAll()
            );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
