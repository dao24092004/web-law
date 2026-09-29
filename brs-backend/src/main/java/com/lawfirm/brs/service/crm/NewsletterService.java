package com.lawfirm.brs.service.crm;

import com.lawfirm.brs.dto.request.NewsletterSubscribeRequest;
import com.lawfirm.brs.entity.NewsletterSubscriber;
import com.lawfirm.brs.exception.BusinessException;
import com.lawfirm.brs.exception.ResourceNotFoundException;
import com.lawfirm.brs.repository.NewsletterSubscriberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Service for newsletter subscriptions.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class NewsletterService {

    private final NewsletterSubscriberRepository subscriberRepository;

    @Transactional
    public NewsletterSubscriber subscribe(NewsletterSubscribeRequest request, String ipAddress) {
        log.info("Processing newsletter subscription for: {}", request.email());

        // Re-subscription path: if the email already exists but was unsubscribed,
        // reactivate it in-place and return. Without the early return the code
        // would continue to the "create new record" branch below and insert a
        // duplicate row that violates the email unique constraint.
        var existing = subscriberRepository.findByEmail(request.email());
        if (existing.isPresent()) {
            NewsletterSubscriber subscriber = existing.get();
            if (subscriber.getUnsubscribedAt() != null) {
                subscriber.setUnsubscribedAt(null);
                subscriber.setStatus("PENDING");
                subscriber.setVerificationToken(UUID.randomUUID().toString());
                return subscriberRepository.save(subscriber);
            }
            throw new BusinessException("NEWSLETTER_ALREADY_SUBSCRIBED",
                "Email is already subscribed");
        }

        NewsletterSubscriber subscriber = NewsletterSubscriber.builder()
            .email(request.email())
            .name(request.name())
            .status("PENDING")
            .verificationToken(UUID.randomUUID().toString())
            .source(request.source() != null ? request.source() : "WEBSITE")
            .ipAddress(ipAddress)
            .build();

        return subscriberRepository.save(subscriber);
    }

    @Transactional
    public void confirmSubscription(String token) {
        log.info("Confirming newsletter subscription with token");
        NewsletterSubscriber subscriber = subscriberRepository.findByVerificationToken(token)
            .orElseThrow(() -> new ResourceNotFoundException("Invalid verification token"));

        subscriber.setStatus("ACTIVE");
        subscriber.setVerifiedAt(Instant.now());
        subscriber.setVerificationToken(null);
        subscriberRepository.save(subscriber);
    }

    @Transactional
    public void unsubscribe(String email) {
        log.info("Unsubscribing: {}", email);
        NewsletterSubscriber subscriber = subscriberRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("Email not found"));

        subscriber.setStatus("UNSUBSCRIBED");
        subscriber.setUnsubscribedAt(Instant.now());
        subscriberRepository.save(subscriber);
    }

    public Page<NewsletterSubscriber> getSubscribers(int page, int size) {
        log.debug("Fetching newsletter subscribers: page={}, size={}", page, size);
        return subscriberRepository.findByStatus("ACTIVE", PageRequest.of(page, size));
    }

    public long getSubscriberCount() {
        return subscriberRepository.countByStatus("ACTIVE");
    }
}
