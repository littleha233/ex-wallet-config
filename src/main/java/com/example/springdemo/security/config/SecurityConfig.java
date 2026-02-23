package com.example.springdemo.security.config;

import com.example.springdemo.security.filter.LoginValidationFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

import java.nio.charset.StandardCharsets;

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
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    if (isApiRequest(request.getRequestURI())) {
                        writeJsonError(response, HttpServletResponse.SC_UNAUTHORIZED, "UNAUTHORIZED", "登录状态已失效，请重新登录");
                        return;
                    }
                    response.sendRedirect("/login");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    if (isApiRequest(request.getRequestURI())) {
                        writeJsonError(response, HttpServletResponse.SC_FORBIDDEN, "FORBIDDEN", "当前账号无权限执行该操作");
                        return;
                    }
                    response.sendRedirect("/");
                })
            );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    private boolean isApiRequest(String uri) {
        return uri != null && uri.startsWith("/api/");
    }

    private void writeJsonError(HttpServletResponse response, int status, String errorCode, String message) throws java.io.IOException {
        response.setStatus(status);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        String payload = "{\"errorCode\":\"" + errorCode + "\",\"message\":\"" + message + "\"}";
        response.getWriter().write(payload);
    }
}
