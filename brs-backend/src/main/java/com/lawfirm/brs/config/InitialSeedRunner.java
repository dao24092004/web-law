package com.lawfirm.brs.config;

import com.lawfirm.brs.service.seed.InitialSeedService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Runs the initial seed at application start.
 * Wrapped in try/catch so the application can still start if seeding fails
 * (e.g. when the database already contains user-provided data).
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(100)
public class InitialSeedRunner implements ApplicationRunner {

    private final InitialSeedService initialSeedService;

    @Override
    public void run(ApplicationArguments args) {
        try {
            initialSeedService.runOnce();
        } catch (RuntimeException exception) {
            log.warn("Initial seed failed but application will continue: {}", exception.getMessage());
        }
    }
}
