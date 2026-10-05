#!/bin/bash
# ============================================================
# Triển khai lên server production
# Chạy trên server, trong thư mục brs-backend/docker/
#
#   ./deploy.sh
#
# Script kiểm tra đầy đủ trước khi build: nếu thiếu cấu hình bắt buộc
# thì dừng ngay, không để tạo ra container hỏng.
# ============================================================

set -euo pipefail

cd "$(dirname "$0")"

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[0;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}[OK]${NC}   $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
die()  { fail "$1"; exit 1; }

echo "=========================================="
echo "  BRS - Triển khai production"
echo "=========================================="

# ---------- 1. Kiem tra moi truong ----------
echo ""
echo "1. Kiem tra moi truong"

command -v docker >/dev/null || die "Khong tim thay docker"
docker compose version >/dev/null 2>&1 || die "Khong co docker compose v2"
ok "docker: $(docker --version)"
ok "compose: $(docker compose version --short)"

docker info >/dev/null 2>&1 || die "Khong co quyen truy cap docker daemon (thu: sudo ./deploy.sh)"
ok "Co quyen docker"

# ---------- 2. Kiem tra cau hinh ----------
echo ""
echo "2. Kiem tra cau hinh"

[ -f .env.production ] || die "Thieu file .env.production. Chay: cp .env.production.example .env.production"
ok ".env.production ton tai"

set -a
# shellcheck disable=SC1091
. ./.env.production
set +a

REQUIRED_VARS="DB_PASSWORD REDIS_PASSWORD WEBHOOK_SECRET WEBHOOKS_SMS_SECRET WEBHOOKS_OTP_SECRET DOMAIN"
MISSING=""
for v in $REQUIRED_VARS; do
    val="${!v:-}"
    if [ -z "$val" ]; then
        MISSING="$MISSING $v"
    fi
done
if [ -n "$MISSING" ]; then
    die "Thieu gia tri cho bien bat buoc:$MISSING"
fi
ok "Tat ca bien bat buoc da duoc dat"

# Phat hien secret yeu
check_weak() {
    local name="$1" val="$2"
    case "$val" in
        *"change"*|*"changeme"*|*"your-"*|*"example"*|*"password"*|*"12345678"*)
            fail "$name trong nhu gia tri mau, phai thay bang secret that"; exit 1 ;;
    esac
    if [ "${#val}" -lt 16 ]; then
        warn "$name chi co ${#val} ky tu, nen dung it nhat 16"
    else
        ok "$name da dat (${#val} ky tu)"
    fi
}
check_weak "DB_PASSWORD"          "$DB_PASSWORD"
check_weak "REDIS_PASSWORD"       "$REDIS_PASSWORD"
check_weak "WEBHOOKS_SMS_SECRET" "$WEBHOOKS_SMS_SECRET"
check_weak "WEBHOOKS_OTP_SECRET" "$WEBHOOKS_OTP_SECRET"
if [ -n "${OPENAI_API_KEY:-}" ]; then ok "OPENAI_API_KEY da dat"; else warn "OPENAI_API_KEY trong (chatbot se khong dung duoc)"; fi

# ---------- 3. Kiem tra SSL ----------
echo ""
echo "3. Kiem tra chung thu SSL"

if [ -f nginx/ssl/fullchain.pem ] && [ -f nginx/ssl/privkey.pem ]; then
    if openssl x509 -in nginx/ssl/fullchain.pem -noout -checkend 604800 >/dev/null 2>&1; then
        ok "SSL cert hop le, con han tren 7 ngay"
        openssl x509 -in nginx/ssl/fullchain.pem -noout -subject -enddate | sed 's/^/     /'
    else
        die "SSL cert da het han hoac khong hop le"
    fi
    C=$(openssl x509 -in nginx/ssl/fullchain.pem -noout -pubkey 2>/dev/null | openssl md5)
    K=$(openssl pkey -in nginx/ssl/privkey.pem -pubout 2>/dev/null | openssl md5)
    [ "$C" = "$K" ] || die "privkey.pem khong khop voi fullchain.pem"
    ok "private key khop certificate"
else
    die "Thieu nginx/ssl/fullchain.pem va nginx/ssl/privkey.pem - nginx se khong khoi dong duoc"
fi

# ---------- 4. Kiem tra JWT key ----------
echo ""
echo "4. Kiem tra JWT key"

[ -f keys/jwt-private.pem ] || die "Thieu keys/jwt-private.pem"
[ -f keys/jwt-public.pem ]  || die "Thieu keys/jwt-public.pem"

# Container chay uid 100 (user brs). Key 600 thuoc uid khac se khong doc duoc,
# ung dung se im lang tao tam key moi va token hong moi lan restart.
PERM=$(stat -c '%a' keys/jwt-private.pem 2>/dev/null || echo "600")
if [ "$PERM" = "600" ]; then
    warn "jwt-private.pem dang mode 600 - chay: chmod 644 keys/jwt-private.pem"
    warn "Neu khong, container se khong doc duoc key"
else
    ok "jwt-private.pem mode $PERM (doc duoc trong container)"
fi

# ---------- 5. Kiem tra cong ----------
echo ""
echo "5. Kiem tra cong 80/443"
PORT_BUSY=""
for P in 80 443; do
    if command -v ss >/dev/null 2>&1 && ss -tln 2>/dev/null | grep -q ":$P "; then
        PORT_BUSY="$PORT_BUSY $P"
    fi
done
if [ -n "$PORT_BUSY" ]; then
    die "Cong dang bi chiem:$PORT_BUSY. Dung dich vu khac hoac doi cong trong compose"
fi
ok "Cong 80 va 443 dang trong"

# ---------- 6. Build ----------
echo ""
echo "6. Build image"
echo "   (lan dau co the mat 5-15 phut)"
docker compose --env-file .env.production -f docker-compose.prod.yml build
ok "Build xong"

# ---------- 7. Khoi dong ----------
echo ""
echo "7. Khoi dong dich vu"
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --remove-orphans
ok "Cac container da khoi dong"

# ---------- 8. Cho healthy ----------
echo ""
echo "8. Cho cac container bao healthy (toi da 3 phut)"

for i in $(seq 1 36); do
    PENDING=$(docker compose --env-file .env.production -f docker-compose.prod.yml ps \
        --format '{{.Name}} {{.Health}}' 2>/dev/null \
        | awk '$2 != "healthy" && NF==2 {print $1}')

    if [ -z "$PENDING" ]; then
        ok "Tat ca container da healthy"
        break
    fi
    sleep 5
    if [ $((i % 6)) -eq 0 ]; then echo "   ... dang cho: $PENDING"; fi
done

UNHEALTHY=$(docker compose --env-file .env.production -f docker-compose.prod.yml ps \
    --format '{{.Name}} {{.Health}}' 2>/dev/null \
    | awk '$2 != "healthy" && NF==2 {print $1}')

if [ -n "$UNHEALTHY" ]; then
    echo ""
    fail "Cac container sau khong healthy: $UNHEALTHY"
    echo ""
    echo "Xem log:"
    for c in $UNHEALTHY; do
        echo "  docker logs --tail 50 $c"
    done
    exit 1
fi

# ---------- 9. Kiem tra sau deploy ----------
echo ""
echo "9. Kiem tra sau deploy"

if curl -sf "http://localhost/nginx-health" >/dev/null 2>&1; then
    ok "nginx phan hoi"
else
    warn "Khong truy cap duoc http://localhost/nginx-health"
fi

# Bao mat: cac endpoint nhay cam phai khong lo
check_blocked() {
    local path="$1" code
    code=$(curl -sk -o /dev/null -w '%{http_code}' "https://${DOMAIN}${path}" 2>/dev/null || echo "000")
    if [ "$code" = "200" ]; then
        fail "$path dang tra 200 - endpoint nhay cam bi lo"
    else
        ok "$path bi chan (HTTP $code)"
    fi
}
check_blocked "/v3/api-docs"
check_blocked "/actuator/metrics"
check_blocked "/actuator/prometheus"

SITE=$(curl -sk -o /dev/null -w '%{http_code}' "https://${DOMAIN}/" 2>/dev/null || echo "000")
if [ "$SITE" = "200" ]; then ok "Trang chu phan hoi 200"; else warn "Trang chu tra HTTP $SITE"; fi

API=$(curl -sk -o /dev/null -w '%{http_code}' "https://${DOMAIN}/api/public/services" 2>/dev/null || echo "000")
if [ "$API" = "200" ]; then ok "API phan hoi 200"; else warn "API tra HTTP $API"; fi

# ---------- 10. Ket qua ----------
echo ""
echo "=========================================="
echo -e "${GREEN}  Trien khai thanh cong${NC}"
echo "=========================================="
echo "  Trang chu : https://${DOMAIN}"
echo "  API       : https://${DOMAIN}/api"
echo ""
echo "  Theo doi  : docker compose -f docker-compose.prod.yml logs -f"
echo "  Dung      : docker compose -f docker-compose.prod.yml down"
echo "  Cap nhat  : ./deploy.sh   (chay lai de trien khai phien ban moi)"
echo "=========================================="
