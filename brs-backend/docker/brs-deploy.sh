#!/bin/bash
# ============================================================
# Deploy tu dong cho CI (GitHub Actions)
#
# Script nay CHAY TREN VPS. GitHub Actions goi qua SSH:
#   brs-deploy <backend-image-ref> <frontend-image-ref> <sha>
#
# Image da duoc build tren may chay GitHub va push len ghcr.io.
# VPS chi "docker pull" roi khoi dong lai -> nhanh hon nhieu lan so
# voi build tai cho, va khong lam chet may (VPS chi co 2GB RAM).
#
# Co rollback: luu image dang chay truoc khi thay the, neu container
# moi khong healthy hoac HTTP check fail thi tra ve ban cu.
#
# Goi tay duoc (dung khi can deploy lai dung commit da build san):
#   ./brs-deploy ghcr.io/dao24092004/brs-backend:<sha> \
#                ghcr.io/dao24092004/brs-frontend:<sha> <sha>
# ============================================================

set -euo pipefail

BACKEND_REF="${1:?Thieu image backend, vi du: ghcr.io/owner/brs-backend:<sha>}"
FRONTEND_REF="${2:?Thieu image frontend}"
EXPECT_SHA="${3:-unknown}"

APP_DIR="${APP_DIR:-/root/brs-app}"
COMPOSE_DIR="$APP_DIR/brs-backend/docker"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-420}"

GREEN='\033[0;32m'; RED='\033[0.31m'; YELLOW='\033[0.33m'; BLUE='\033[0.34m'; NC='\033[0m'
ok()   { echo -e "${GREEN}[OK]${NC}    $1"; }
info() { echo -e "${BLUE}[INFO]${NC}  $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $1"; }
fail() { echo -e "${RED}[FAIL]${NC}  $1"; }
die()  { fail "$1"; exit 1; }

START_TS=$(date +%s)
elapsed() { echo $(( $(date +%s) - START_TS )); }

echo "=========================================="
echo "  BRS - Deploy tu dong"
echo "  Commit: $EXPECT_SHA"
echo "=========================================="

cd "$COMPOSE_DIR" 2>/dev/null || die "Khong tim thay $COMPOSE_DIR"
COMPOSE="docker compose --env-file .env.production -f docker-compose.prod.yml"

# ---------- 1. File cau hinh ----------
# Khong nam trong git, chi co tren VPS. Pipeline lay truc tiep tren
# server chu khong lay tu repo.
info "1. Kiem tra file cau hinh tren VPS"
for f in .env.production keys/jwt-private.pem keys/jwt-public.pem \
         nginx/ssl/fullchain.pem nginx/ssl/privkey.pem; do
    [ -f "$f" ] || die "Thieu $f. File nay khong nam trong git, phai co tren VPS."
done
ok "Day du .env.production, key JWT, cert SSL"

# ---------- 2. Docker login GHCR ----------
# Token do GitHub Actions truyen qua moi lan deploy.
info "2. Dang nhap GitHub Container Registry"
if [ -n "${GHCR_USER:-}" ] && [ -n "${GHCR_TOKEN:-}" ]; then
    printf '%s' "$GHCR_TOKEN" \
        | docker login ghcr.io -u "$GHCR_USER" --password-stdin >/dev/null
    ok "Dang nhap GHCR thanh cong"
else
    warn "Khong co token GHCR. Neu image la public thi van pull duoc."
fi

# ---------- 3. Luu image hien tai de rollback ----------
info "3. Luu image dang chay de rollback"
HAVE_ROLLBACK=0
CUR_BACKEND=$(docker inspect --format '{{.Config.Image}}' brs-backend 2>/dev/null || echo "")
CUR_FRONTEND=$(docker inspect --format '{{.Config.Image}}' brs-frontend 2>/dev/null || echo "")
if [ -n "$CUR_BACKEND" ] && [ "$CUR_BACKEND" != "$BACKEND_REF" ]; then
    ok "Image backend hien tai: $CUR_BACKEND"
    HAVE_ROLLBACK=1
fi
if [ -n "$CUR_FRONTEND" ] && [ "$CUR_FRONTEND" != "$FRONTEND_REF" ]; then
    ok "Image frontend hien tai: $CUR_FRONTEND"
    HAVE_ROLLBACK=1
fi
[ "$HAVE_ROLLBACK" = "1" ] || warn "Lan deploy dau tien, khong co ban de rollback."

rollback() {
    echo ""
    fail "Deploy that bai - dang tra ve image cu"
    if [ "$HAVE_ROLLBACK" = "1" ] && [ -n "$CUR_BACKEND" ] && [ -n "$CUR_FRONTEND" ]; then
        $COMPOSE up -d --no-build --remove-orphans 2>&1 | tail -20 || true
        warn "Da khoi dong lai ban cu. Kiem tra:"
        warn "  cd $COMPOSE_DIR && $COMPOSE ps"
    else
        warn "Khong co ban cu de rollback."
    fi
    exit 1
}

# ---------- 4. Pull image moi ----------
info "4. Pull image moi tu registry"
docker pull "$BACKEND_REF" || { fail "Pull backend that bai"; rollback; }
docker pull "$FRONTEND_REF" || { fail "Pull frontend that bai"; rollback; }
ok "Pull xong ($(elapsed)s)"

# ---------- 5. Tro compose sang image moi ----------
# File compose da commit tro toi "brs-backend:latest". Ghi de bang image
# co tag theo SHA de biet dang chay phien ban nao.
info "5. Cap nhat file compose tro toi image moi"
sed -i "s|image: brs-backend:.*|image: ${BACKEND_REF}|" docker-compose.prod.yml
sed -i "s|image: brs-frontend:.*|image: ${FRONTEND_REF}|" docker-compose.prod.yml
grep -n 'image:.*brs-' docker-compose.prod.yml

# ---------- 6. Khoi dong ----------
info "6. Khoi dong container phien ban moi"
$COMPOSE up -d --remove-orphans
ok "Container da len ($(elapsed)s)"

# ---------- 7. Cho healthy ----------
info "7. Cho container healthy (toi da $((HEALTH_TIMEOUT / 60)) phut)"
HEALTHY=0
for i in $(seq 1 $((HEALTH_TIMEOUT / 5))); do
    PENDING=$($COMPOSE ps --format '{{.Name}} {{.Health}}' 2>/dev/null \
        | awk '$2 != "healthy" && NF==2 {print $1}')
    if [ -z "$PENDING" ]; then
        ok "Tat ca container healthy ($(elapsed)s)"
        HEALTHY=1
        break
    fi
    sleep 5
    if [ $((i % 12)) -eq 0 ]; then
        echo "     ... van cho: $(echo $PENDING | tr '\n' ' ')"
    fi
done

if [ "$HEALTHY" != "1" ]; then
    UNHEALTHY=$($COMPOSE ps --format '{{.Name}} {{.Health}}' 2>/dev/null \
        | awk '$2 != "healthy" && NF==2 {print $1}')
    fail "Container khong healthy: $UNHEALTHY"
    for c in $UNHEALTHY; do
        echo "----- log $c -----"
        docker logs --tail 60 "$c" 2>&1 | tail -60
    done
    rollback
fi

# ---------- 8. Kiem tra HTTP ----------
info "8. Kiem tra HTTP"
set -a; . ./.env.production; set +a
RC=0
check() {
    local name="$1" url="$2" code
    code=$(curl -sk -o /dev/null -w '%{http_code}' --max-time 20 "$url" 2>/dev/null || echo "000")
    if [ "$code" = "200" ]; then ok "$name -> HTTP 200"
    else fail "$name -> HTTP $code"; RC=1; fi
}
check "nginx-health" "http://localhost/nginx-health"
check "trang chu"    "https://${DOMAIN}/"
check "API public"   "https://${DOMAIN}/api/public/services"

# Endpoint nhay cam phai fail-closed
for p in /v3/api-docs /actuator/metrics /actuator/prometheus; do
    code=$(curl -sk -o /dev/null -w '%{http_code}' --max-time 15 "https://${DOMAIN}${p}" 2>/dev/null || echo "000")
    if [ "$code" = "200" ]; then fail "$p dang tra 200 - bi lo"; RC=1
    else ok "$p bi chan (HTTP $code)"; fi
done
[ "$RC" = "0" ] || rollback

# ---------- 9. Don dep ----------
# Xoa image cu de tiet dia (diem anh Docker chi 20GB)
docker image prune -f --filter "dangling=true" >/dev/null 2>&1 || true

echo ""
echo "=========================================="
echo -e "${GREEN}  Deploy thanh cong${NC} - commit ${EXPECT_SHA} ($(elapsed)s)"
echo "=========================================="
$COMPOSE ps
echo ""
echo "  Trang chu : https://${DOMAIN}"
echo "  Log       : cd $COMPOSE_DIR && $COMPOSE logs -f --tail 100"
echo "=========================================="
