# ============================================================
# BRS Backend Dockerfile
# Multi-stage build for optimized image size
# ============================================================

# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build. JWT keys are mounted only at runtime.
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests -B

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine

# Install additional tools
RUN apk add --no-cache \
    curl \
    bash \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -S brs && adduser -S brs -G brs

WORKDIR /app

# Copy the built artifact
COPY --from=builder /app/target/*.jar app.jar

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create logs directory
RUN mkdir -p /app/logs && chown -R brs:brs /app

# Switch to non-root user
USER brs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# Expose port
EXPOSE 8080

# Entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]
