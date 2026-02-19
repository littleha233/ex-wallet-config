package com.example.springdemo.controller;

import com.example.springdemo.service.UserAccountService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class AuthController {
    private final UserAccountService userAccountService;

    public AuthController(UserAccountService userAccountService) {
        this.userAccountService = userAccountService;
    }

    @GetMapping("/login")
    public String loginPage(
        @RequestParam(required = false) Boolean error,
        @RequestParam(required = false) Boolean logout,
        @RequestParam(required = false) Boolean registered,
        Model model
    ) {
        model.addAttribute("showError", Boolean.TRUE.equals(error));
        model.addAttribute("showLogoutSuccess", Boolean.TRUE.equals(logout));
        model.addAttribute("showRegisterSuccess", Boolean.TRUE.equals(registered));
        return "login";
    }

    @GetMapping("/register")
    public String registerPage(Model model) {
        if (!model.containsAttribute("username")) {
            model.addAttribute("username", "");
        }
        return "register";
    }

    @PostMapping("/register")
    public String register(
        @RequestParam String username,
        @RequestParam String password,
        @RequestParam String confirmPassword,
        RedirectAttributes redirectAttributes
    ) {
        try {
            userAccountService.register(username, password, confirmPassword);
            return "redirect:/login?registered=true";
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
            redirectAttributes.addFlashAttribute("username", username == null ? "" : username.trim());
            return "redirect:/register";
        }
    }
}
