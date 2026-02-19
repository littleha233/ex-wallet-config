package com.example.springdemo.service;

import com.example.springdemo.domain.AppUser;
import com.example.springdemo.repository.AppUserRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AuthUserDetailsService implements UserDetailsService {
    private final AppUserRepository appUserRepository;

    public AuthUserDetailsService(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        AppUser appUser = appUserRepository.findByUsernameIgnoreCase(username)
            .orElseThrow(() -> new UsernameNotFoundException("user not found"));

        return User.withUsername(appUser.getUsername())
            .password(appUser.getPassword())
            .roles("USER")
            .disabled(Boolean.FALSE.equals(appUser.getEnabled()))
            .build();
    }
}
