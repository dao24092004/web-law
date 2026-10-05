package com.lawfirm.brs.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * Xác định địa chỉ IP thật của client.
 *
 * <p>Backend chỉ được phép nhận request qua nginx (mạng nội bộ Docker, không
 * publish port ra host). Vì vậy {@code X-Forwarded-For} chỉ đáng tin khi người
 * gọi trực tiếp là một proxy trong mạng nội bộ.
 *
 * <p>Hai điều kiện phải đồng thời thoả mãn mới dùng giá trị trong header:
 * <ol>
 *   <li>Peer trực tiếp phải thuộc dải mạng nội bộ (chỉ proxy mới ở đây).</li>
 *   <li>nginx phải <b>ghi đè</b> header bằng {@code $remote_addr} chứ không
 *       dùng {@code $proxy_add_x_forwarded_for} — nếu dùng biến thứ hai, giá trị
 *       do client gửi vẫn còn nằm trong chuỗi và có thể bị lợi dụng.</li>
 * </ol>
 *
 * <p>Điều kiện 1 là lớp phòng thủ: nếu ai đó vô tình expose backend ra Internet
 * (ví dụ thêm {@code ports:} trong compose), request đến trực tiếp từ Internet
 * sẽ có peer là IP công cộng, nên header XFF bị bỏ qua hoàn toàn.
 */
@Component
public class ClientIpResolver {

    /**
     * Chỉ chấp nhận X-Forwarded-For khi peer trực tiếp thuộc dải private.
     * Mặc định đúng với Docker bridge và thông dụng với mọi hạ tầng.
     */
    private static final Set<String> TRUSTED_PROXY_PREFIXES = Set.of(
        "10.",              // 10.0.0.0/8
        "192.168.",         // 192.168.0.0/16
        "172.16.", "172.17.", "172.18.", "172.19.", "172.20.",
        "172.21.", "172.22.", "172.23.", "172.24.", "172.25.",
        "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.",
        "127.",             // localhost
        "::1",
        "fe80:"             // IPv6 link-local
    );

    /** Cho phép tắt kiểm tra dải mạng khi chạy ngoài Docker. */
    @Value("${app.trust-forwarded-for:true}")
    private boolean trustForwardedFor = true;

    /**
     * Trả về IP thật của client, không bao giờ lấy giá trị do client tự khai báo.
     */
    public String resolve(HttpServletRequest request) {
        String peer = request.getRemoteAddr();
        String peerNormalized = normalize(peer);

        if (trustForwardedFor && isTrustedProxy(peerNormalized)) {
            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                String[] parts = forwarded.split(",");
                // nginx đã ghi đè nên chuỗi chỉ còn một phần tử là IP client.
                // Lấy phần tử cuối phòng hờ có thêm tầng proxy phía trước.
                String candidate = normalize(parts[parts.length - 1].trim());
                if (!candidate.isEmpty() && !"invalid".equals(candidate)) {
                    return candidate;
                }
            }
        }
        return peerNormalized;
    }

    /** Peer có nằm trong dải mạng nội bộ (tức là proxy của ta) không. */
    private boolean isTrustedProxy(String ip) {
        if (ip == null || ip.isEmpty() || "invalid".equals(ip) || "unknown".equals(ip)) {
            return false;
        }
        for (String prefix : TRUSTED_PROXY_PREFIXES) {
            if (ip.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Chuẩn hoá IPv6-mapped-IPv4 ({@code ::ffff:127.0.0.1}) về dạng IPv4 và
     * loại bỏ ký tự lạ để kẻ tấn công không "phân mảnh" khoá rate limit bằng
     * cách thêm ký tự vô nghĩa vào header.
     */
    private String normalize(String ip) {
        if (ip == null || ip.isBlank()) {
            return "unknown";
        }
        String value = ip.trim().toLowerCase();
        if (value.startsWith("::ffff:")) {
            value = value.substring("::ffff:".length());
        }
        if (!value.matches("[0-9a-f:.%]+")) {
            return "invalid";
        }
        return value;
    }
}
