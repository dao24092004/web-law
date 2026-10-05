package com.lawfirm.brs.service.upload;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Service for storing uploaded files on the local filesystem under {@code base-dir}.
 * Files are served publicly via Spring's static resource handler at {@code /files/**}
 * (configured in {@code WebMvcConfig}).
 */
@Service
@Slf4j
public class FileStorageService {

    private static final Set<String> ALLOWED_IMAGE_TYPES = new HashSet<>(Arrays.asList(
        "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    ));

    private static final Set<String> ALLOWED_DOCUMENT_TYPES = new HashSet<>(Arrays.asList(
        "application/pdf", "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ));

    /**
     * Phần mở rộng được phép lưu, ánh xạ đúng từ MIME type ở trên.
     *
     * <p>Phần mở rộng KHÔNG được lấy từ tên file do client gửi lên: nếu lấy,
     * kẻ tấn công gửi tên {@code shell.html} kèm {@code Content-Type:
     * image/jpeg} sẽ lưu được file .html. File đó sau đó được
     * {@code PublicFileController} phục vụ với {@code Content-Type: text/html},
     * biến thành stored XSS chạy trên cùng origin với trang web — đủ để đọc
     * nội dung trang và gọi API thay nạn nhân.
     */
    private static final Set<String> ALLOWED_IMAGE_EXT = Set.of(
        ".jpg", ".jpeg", ".png", ".gif", ".webp"
    );

    private static final Set<String> ALLOWED_DOCUMENT_EXT = Set.of(
        ".pdf", ".doc", ".docx", ".xls", ".xlsx"
    );

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;  // 10MB
    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024;  // 5MB

    private static final String PUBLIC_URL_PREFIX = "/files/";

    @Value("${app.upload.base-dir:/app/uploads}")
    private String baseDir;

    private Path basePath;

    @PostConstruct
    void init() throws IOException {
        this.basePath = Paths.get(baseDir).toAbsolutePath().normalize();
        Files.createDirectories(this.basePath);
        log.info("File storage base directory initialized at {}", this.basePath);
    }

    /**
     * Upload an image file (validated as image, max 5MB).
     */
    public FileUploadResult upload(MultipartFile file, String folder) {
        validateImageFile(file);
        return doUpload(file, folder, "image");
    }

    /**
     * Upload a raw document file (validated as document, max 10MB).
     */
    public FileUploadResult uploadRaw(MultipartFile file, String folder) {
        validateDocumentFile(file);
        return doUpload(file, folder, "raw");
    }

    /**
     * Upload with auto type detection.
     */
    public FileUploadResult uploadAuto(MultipartFile file, String folder) {
        validateFile(file);
        String resourceType = ALLOWED_IMAGE_TYPES.contains(getMimeType(file)) ? "image" : "raw";
        return doUpload(file, folder, resourceType);
    }

    private FileUploadResult doUpload(MultipartFile file, String folder, String resourceType) {
        try {
            String safeFolder = sanitizeFolder(folder);
            String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));
            // Phần mở rộng do server quyết định, không lấy từ tên file của
            // client — xem ALLOWED_IMAGE_EXT / ALLOWED_DOCUMENT_EXT.
            String ext = resolveExtension(resourceType, file.getOriginalFilename());
            String storedName = UUID.randomUUID().toString() + ext;

            Path relative = Paths.get(safeFolder, datePath, storedName);
            Path target = basePath.resolve(relative).normalize();
            ensureInsideBase(target);

            Files.createDirectories(target.getParent());
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            String url = PUBLIC_URL_PREFIX + relative.toString().replace('\\', '/');
            log.info("File stored: relative={}, url={}", relative, url);

            return FileUploadResult.builder()
                .publicId(relative.toString().replace('\\', '/'))
                .url(url)
                .format(stripDot(ext))
                .bytes(file.getSize())
                .build();
        } catch (IOException e) {
            throw new UncheckedIOException("File upload failed: " + e.getMessage(), e);
        }
    }

    /**
     * Delete a file by its stored relative path (e.g. {@code images/2026/07/abc.jpg}).
     */
    public boolean delete(String publicId) {
        if (publicId == null || publicId.isBlank()) {
            return false;
        }
        try {
            Path target = basePath.resolve(publicId).normalize();
            ensureInsideBase(target);
            boolean removed = Files.deleteIfExists(target);
            log.info("Delete file: relative={}, removed={}", publicId, removed);
            return removed;
        } catch (IOException e) {
            log.error("Failed to delete file: {}", publicId, e);
            return false;
        }
    }

    /**
     * Delete file by public URL such as {@code /files/images/2026/07/abc.jpg}.
     * Non-local URLs (e.g. legacy Cloudinary links) are logged and ignored.
     */
    public boolean deleteByUrl(String url) {
        String relative = extractRelativeFromUrl(url);
        if (relative == null) {
            log.warn("Skip delete (not a local /files/ URL): {}", url);
            return false;
        }
        return delete(relative);
    }

    /**
     * Resolve a stored relative path to its absolute filesystem location.
     */
    public Path resolveLocalPath(String publicIdOrUrl) {
        String relative = extractRelativeFromUrl(publicIdOrUrl);
        if (relative == null) {
            relative = publicIdOrUrl;
        }
        Path target = basePath.resolve(relative).normalize();
        ensureInsideBase(target);
        return target;
    }

    public String getBaseDir() {
        return basePath != null ? basePath.toString() : baseDir;
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum allowed size of 10MB");
        }
    }

    private void validateImageFile(MultipartFile file) {
        validateFile(file);
        String mimeType = getMimeType(file);
        if (!ALLOWED_IMAGE_TYPES.contains(mimeType)) {
            throw new IllegalArgumentException(
                "Invalid image type. Allowed types: JPEG, PNG, GIF, WebP");
        }
        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new IllegalArgumentException("Image size exceeds maximum allowed size of 5MB");
        }
    }

    private void validateDocumentFile(MultipartFile file) {
        validateFile(file);
        String mimeType = getMimeType(file);
        if (!ALLOWED_DOCUMENT_TYPES.contains(mimeType)) {
            throw new IllegalArgumentException(
                "Invalid document type. Allowed types: PDF, DOC, DOCX, XLS, XLSX");
        }
    }

    private String getMimeType(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType != null) {
            return contentType;
        }
        try {
            return new org.apache.tika.Tika().detect(file.getInputStream());
        } catch (IOException e) {
            log.warn("Failed to detect MIME type, using application/octet-stream", e);
            return "application/octet-stream";
        }
    }

    private String sanitizeFolder(String folder) {
        if (folder == null || folder.isBlank()) {
            return "misc";
        }
        String cleaned = folder.replace('\\', '/');
        while (cleaned.startsWith("/")) {
            cleaned = cleaned.substring(1);
        }
        if (cleaned.contains("..") || cleaned.contains("\0")) {
            throw new IllegalArgumentException("Invalid folder name");
        }
        return cleaned;
    }

    private String extractExtension(String filename) {
        if (filename == null) {
            return "";
        }
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot == filename.length() - 1) {
            return "";
        }
        return filename.substring(dot).toLowerCase();
    }

    /**
     * Chọn phần mở rộng lưu trữ.
     *
     * <p>Chỉ chấp nhận phần mở rộng nằm trong danh sách trắng tương ứng với
     * nhóm đã kiểm tra MIME. Nhờ vậy file HTML/SVG/JS/PHP dù được đặt tên tùy ý
     * vẫn bị từ chối, và file hợp lệ vẫn giữ đúng đuôi.
     */
    private String resolveExtension(String resourceType, String originalFilename) {
        Set<String> allowed = "image".equals(resourceType)
            ? ALLOWED_IMAGE_EXT
            : ALLOWED_DOCUMENT_EXT;

        String ext = extractExtension(originalFilename);
        if (allowed.contains(ext)) {
            return ext;
        }

        // Tên file không hợp lệ: dùng phần mở rộng mặc định an toàn của nhóm.
        // Vẫn an toàn vì Content-Type lúc phục vụ được suy ra từ đuôi này.
        String fallback = "image".equals(resourceType) ? ".jpg" : ".pdf";
        log.warn("Rejected extension '{}' from uploaded file, using {}. Allowed: {}",
                ext, fallback, allowed);
        return fallback;
    }

    private String stripDot(String ext) {
        return ext == null || ext.isEmpty() ? ext : ext.substring(1);
    }

    private String extractRelativeFromUrl(String url) {
        if (url == null) {
            return null;
        }
        int idx = url.indexOf(PUBLIC_URL_PREFIX);
        if (idx < 0) {
            return null;
        }
        String rel = url.substring(idx + PUBLIC_URL_PREFIX.length());
        if (rel.contains("..") || rel.contains("\0")) {
            return null;
        }
        return rel;
    }

    private void ensureInsideBase(Path target) {
        if (!target.startsWith(basePath)) {
            throw new IllegalArgumentException("Path traversal detected: " + target);
        }
    }

    /**
     * Result of file upload operation.
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class FileUploadResult {
        private String publicId;
        private String url;
        private String format;
        private Integer width;
        private Integer height;
        private Long bytes;
    }
}