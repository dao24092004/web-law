#!/bin/bash
# ============================================================
# BRS Backend Docker Entrypoint
# ============================================================

set -e

echo "=========================================="
echo "  BRS Backend - Starting"
echo "  Profile: ${SPRING_PROFILES_ACTIVE:-prod}"
echo "  JAR: /app/app.jar"
echo "=========================================="

# Ensure writable dirs exist (log path differs between base and prod profile)
mkdir -p /app/logs /app/uploads /var/log/brs 2>/dev/null || true

# Container-aware JVM sizing: use 75% of the container memory limit.
# JAVA_OPTS may override these values when set in the environment.
DEFAULT_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=25.0 -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -Djava.security.egd=file:/dev/./urandom -Dfile.encoding=UTF-8"

# Prod profile logs to /var/log/brs; force it onto the mounted volume so
# logs survive container restarts.
LOG_OPTS="-Dlogging.file.name=/app/logs/brs-backend.log"

exec java $DEFAULT_OPTS $LOG_OPTS $JAVA_OPTS \
    -Dspring.profiles.active="${SPRING_PROFILES_ACTIVE:-prod}" \
    -jar /app/app.jar
