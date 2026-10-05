package com.lawfirm.brs.security;

import com.lawfirm.brs.exception.RateLimitExceededException;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter for rate limiting requests.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitConfig rateLimitConfig;
    private final ClientIpResolver clientIpResolver;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String clientId = "ip:" + clientIpResolver.resolve(request);

        Bucket bucket = selectBucket(path, clientId);

        if (bucket != null) {
            if (!bucket.tryConsume(1)) {
                log.warn("Rate limit exceeded for {} on {}", clientId, path);
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"RATE_LIMIT_EXCEEDED\",\"message\":\"Too many requests. Please try again later.\"}");
                return;
            }

            long availableTokens = bucket.getAvailableTokens();
            response.addHeader("X-Rate-Limit-Remaining", String.valueOf(availableTokens));
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Chọn bucket rate limit theo IP thật của client.
     *
     * <p>Trước đây hàm này ưu tiên header {@code X-Session-Id} do client tự gửi.
     * Kẻ tấn công chỉ cần đổi giá trị header này ở mỗi request là nhận được
     * bucket mới, bỏ qua hoàn toàn giới hạn — kể cả giới hạn 5 lần/phút của
     * {@code /api/auth/login} dùng để chống dò mật khẩu. Header do client kiểm
     * soát tuyệt đối không được dùng làm khoá.
     */
    private Bucket selectBucket(String path, String clientId) {
        if (path.startsWith("/api/auth/login") || path.startsWith("/api/auth/refresh")) {
            return rateLimitConfig.authBucket(clientId);
        }
        if (path.startsWith("/api/bookings")) {
            return rateLimitConfig.bookingBucket(clientId);
        }
        if (path.startsWith("/api/crm/leads")) {
            return rateLimitConfig.leadBucket(clientId);
        }
        if (path.startsWith("/api/public/search")) {
            return rateLimitConfig.searchBucket(clientId);
        }
        if (path.startsWith("/api/chatbot")) {
            return rateLimitConfig.chatbotBucket(clientId);
        }
        return null;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/swagger-ui") || 
               path.startsWith("/v3/api-docs") || 
               path.startsWith("/actuator");
    }
}
