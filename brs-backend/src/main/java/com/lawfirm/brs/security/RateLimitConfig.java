package com.lawfirm.brs.security;

import com.lawfirm.brs.config.AppProperties;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Cấu hình rate limiting bằng Bucket4j.
 *
 * <p>Buckets được lưu trong map theo khoá (IP của client). Map này phải được
 * dọn định kỳ: nếu không, kẻ tấn công gửi request từ hàng loạt IP khác nhau
 * (ví dụ qua mạng botnet, IPv6, hoặc chỉ cần dùng header đổi khoá) sẽ làm bản đồ
 * phình ra vô hạn và dần cạn bộ nhớ của ứng dụng.
 */
@Component
@RequiredArgsConstructor
public class RateLimitConfig {

    /** Số phần tử tối đa được giữ trong map. */
    private static final int MAX_BUCKETS = 50_000;

    /** Khoảng cách giữa hai lần dọn map. */
    private static final long CLEANUP_INTERVAL_MS = 60_000L;

    private final AppProperties appProperties;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private volatile long lastCleanupAt = 0;

    /**
     * Ngưỡng cảnh báo: khi map vượt mức này, việc dọn sẽ bị dồn dập hơn.
     */
    @Value("${app.rate-limit.max-buckets:50000}")
    private int maxBuckets = MAX_BUCKETS;

    public Bucket authBucket(String key) {
        return bucket("auth:" + key, appProperties.getRateLimit().getAuth());
    }

    public Bucket bookingBucket(String key) {
        return bucket("booking:" + key, appProperties.getRateLimit().getBooking());
    }

    public Bucket leadBucket(String key) {
        return bucket("lead:" + key, appProperties.getRateLimit().getLead());
    }

    public Bucket searchBucket(String key) {
        return bucket("search:" + key, appProperties.getRateLimit().getSearch());
    }

    public Bucket chatbotBucket(String key) {
        return bucket("chatbot:" + key, appProperties.getRateLimit().getChatbotPerSession());
    }

    private Bucket bucket(String key, long permitsPerMinute) {
        maybeCleanup();
        return buckets.computeIfAbsent(key, k ->
            Bucket.builder()
                .addLimit(Bandwidth.builder()
                    .capacity(permitsPerMinute)
                    .refillGreedy(permitsPerMinute, Duration.ofMinutes(1))
                    .build())
                .build()
        );
    }

    /**
     * Dọn các bucket đã hết hạn. Bucket4j cho phép hỏi token còn lại bằng
     * {@code getAvailableTokens()}; bucket đã refill đầy nghĩa là client đã
     * ngừng gọi, nên có thể xoá.
     *
     * <p>Dùng {@code remove(key, value)} để không vô tình xoá bucket mới tạo
     * bởi request đang chạy song song.
     */
    private void maybeCleanup() {
        long now = System.currentTimeMillis();
        if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) {
            return;
        }
        synchronized (this) {
            if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) {
                return;
            }
            lastCleanupAt = now;

            if (buckets.size() <= maxBuckets) {
                return;
            }
            // Xoá tới khi còn khoảng 80% ngưỡng cho phép.
            int target = (int) (maxBuckets * 0.8);
            buckets.entrySet().removeIf(entry -> {
                if (buckets.size() <= target) {
                    return false;
                }
                Bucket bucket = entry.getValue();
                // getAvailableTokens ném lỗi nếu bandwidth đã hết hạn, coi
                // như đã hết hạn thì xoá.
                try {
                    return bucket.getAvailableTokens() >= Long.MAX_VALUE;
                } catch (IllegalStateException e) {
                    return true;
                }
            });
        }
    }
}
