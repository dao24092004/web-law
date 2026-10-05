#!/bin/bash
# ============================================================
# Deploy tu dong cho CI (GitHub Actions)
#
# Script nay CHAY TREN VPS, duoc GitHub Actions goi qua SSH sau khi
# da push code len. No khac deploy.sh o cho: dung cho cap nhat len
# mot ban da co chay production, nen khong kiem tra port 80/443
# dang trong (nginx dang chiem san), va co co rollback.
#
# Gọi tay duoc:
#   ./ci-deploy.sh              # deploy commit dang co tren remote
#   ./ci-deploy.sh <sha>        # deploy dung mot commit
# ============================================================

set -euo pipefail

APP_DIR="${APP_DIR:-/root/brs-app}"
BRANCH="${BRANCH:-main}"
COMPOSE_DIR="$APP_DIR/brs-backend/docker"
COMPOSE="docker compose --env-file .env.production -f docker-compose.prod.yml"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-420}"

GREEN='\033[0.32m'; RED='\033[0.31m'; YELLOW='\033[0.33m'; BLUE='\033[0.34m'; NC='\033[0m'
ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
fail()  { echo -e "${RED}[FAIL]${NC}  $1"; }
die()   { fail "$1"; exit 1; }

START_TS=$(date +%s)
elapsed() { echo $(( $(date +%s) - START_TS )); }

echo "=========================================="
echo "  BRS - Deploy tu dong (CI)"
echo "=========================================="

[ "$(id -u)" = "0" ] || die "Phai chay voi quyen root"
cd "$APP_DIR" 2>/dev/null || die "Khong tim thay $APP_DIR. Can clone repo truoc."

cd "$COMPOSE_DIR" || die "Khong tim thay $COMPOSE_DIR"

# ---------- 1. File bat buoc tren server ----------
# Cac file nay khong nam trong git (chi co tren VPS). Pipeline lay truc
# tiep tren server, khong lay tu repo.
echo ""
info "1. Kiem tra file cau hinh tren server"
for f in .env.production keys/jwt-private.pem keys/jwt-public.pem \
         nginx/ssl/fullchain.pem nginx/ssl/privkey.pem; do
    [ -f "$f" ] || die "Thieu $f tren server. File nay khong nam trong git, phai duoc tao tren VPS."
done
ok "Da co day du .env.production, key JWT, cert SSL"

# ---------- 2. Lay code moi ----------
echo ""
info "2. Lay code moi tu remote"

if [ $# -ge 1 ]; then
    git fetch --depth=1 origin "$1" 2>/dev/null || git fetch origin
    git checkout -f "$1"
else
    git fetch origin "$BRANCH" --depth=1 || git fetch origin
    git checkout -f "origin/$BRANCH"
    git reset --hard "origin/$BRANCH"
fi
git clean -fd -q
SHA=$(git rev-parse --short HEAD)
ok "Dang deploy commit $SHA ($(git log -1 --pretty=%s | cut -c1-60))"

# File bi .gitignore xoa mat di khi reset --hard (vi git clean khong xoa
# file ignored nen .env.production/keys/ssl van con, nhung de chắc):
for f in .env.production keys/jwt-private.pem keys/jwt-public.pem \
         nginx/ssl/fullchain.pem nginx/ssl/privkey.pem; do
    [ -f "$f" ] || die "Sau khi pull, thieu $f"
done

# ---------- 3. Luu image hien tai de rollback ----------
echo ""
info "3. Luu image hien tai de rollback"

ROLLBACK_OK=0
if docker image inspect brs-backend:latest >/dev/null 2>&1; then
    docker tag brs-backend:latest brs-backend:rollback
    ok "Da luu brs-backend:rollback"
    ROLLBACK_OK=1
fi
if docker image inspect brs-frontend:latest >/dev/null 2>&1; then
    docker tag brs-frontend:latest brs-frontend:rollback
    ok "Da luu brs-frontend:rollback"
fi

rollback() {
    echo ""
    fail "Deploy that bai - dang rollback ve commit truoc"
    if [ "$ROLLBACK_OK" = "1" ]; then
        docker tag brs-backend:rollback brs-backend:latest
        [ -f nginx/ssl/privkey.pem ] || true
        $COMPOSE up -d --no-build --remove-orphans 2>&1 | tail -20 || true
        warn "Da khoi dong lai image cu. Kiem tra lai bang:"
        warn "  cd $COMPOSE_DIR && $COMPOSE ps"
    else
        warn "Chua co image de rollback (lan deploy dau tien)"
    fi
    exit 1
}

# ---------- 4. Build ----------
# VPS chi co 2GB RAM nen build TUAN TU, khong chay song song:
# Maven + Next.js cung luc se lam docker daemon bi OOM kill.
echo ""
info "4. Build image (luan tu, vi VPS chi co 2GB RAM)"

info "   4a. Backend (Maven + Spring Boot) - co the mat 5-15 phut"
if ! $COMPOSE build backend; then
    fail "Build backend that bai"
    docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail 50 backend || true
    rollback
fi
ok "Backend build xong ($(elapsed)s)"

info "   4b. Frontend (Next.js)"
if ! $COMPOSE build frontend; then
    fail "Build frontend that bai"
    rollback
fi
ok "Frontend build xong ($(elapsed)s)"

# ---------- 5. Bat dau chay ----------
echo ""
info "5. Khoi dong container phien ban moi"
$COMPOSE up -d --remove-orphans
ok "Container da len ($(elapsed)s)"

# ---------- 6. Cho healthy ----------
echo ""
info "6. Cho container healthy (toi da $((HEALTH_TIMEOUT / 60)) phut)"

for i in $(seq 1 $((HEALTH_TIMEOUT / 5))); do
    PENDING=$($COMPOSE ps --format '{{.Name}} {{.Health}}' 2>/dev/null \
        | awk '$2 != "healthy" && NF==2 {print $1}')
    if [ -z "$PENDING" ]; then
        ok "Tat ca container healthy ($(elapsed)s)"
        break
    fi
    sleep 5
    if [ $((i % 12)) -eq 0 ]; then
        echo "     ... van cho: $(echo $PENDING | tr '\n' ' ')"
    fi
done

UNHEALTHY=$($COMPOSE ps --format '{{.Name}} {{.Health}}' 2>/dev/null \
    | awk '$2 != "healthy" && NF==2 {print $1}')

if [ -n "$UNHEALTHY" ]; then
    fail "Container khong healthy: $UNHEALTHY"
    for c in $UNHEALTHY; do
        echo "----- $c -----"
        docker logs --tail 60 "$c" 2>&1 | tail -60
    done
    rollback
fi

# ---------- 7. Kiem tra chay thu ----------
echo ""
info "7. Kiem tra HTTP"

set -a; . ./.env.production; set +a
check() {
    local name="$1" url="$2" expect="$3" code
    code=$(curl -sk -o /dev/null -w '%{http_code}' --max-time 20 "$url" 2>/dev/null || echo "000")
    if [ "$code" = "$expect" ]; then ok "$name -> HTTP $code"
    else fail "$name -> HTTP $code (mong doi $expect)"; return 1; fi
}

RC=0
check "nginx-health" "http://localhost/nginx-health" "200" || RC=1
check "trang chu"    "https://${DOMAIN}/" "200" || RC=1
check "API public"   "https://${DOMAIN}/api/public/services" "200" || RC=1

# Endpoint nhay cam phai fail-closed
for p in /v3/api-docs /actuator/metrics /actuator/prometheus; do
    code=$(curl -sk -o /dev/null -w '%{http_code}' --max-time 15 "https://${DOMAIN}${p}" 2>/dev/null || echo "000")
    if [ "$code" = "200" ]; then fail "$p dang tra 200 - bi lo"; RC=1
    else ok "$p bi chan (HTTP $code)"; fi
done

[ "$RC" = "0" ] || rollback

# ---------- 8. Xong ----------
# Xoa image rollback cu de tiet cho dia bang (diem anh Docker 20GB)
docker rmi -f brs-backend:rollback brs-frontend:rollback >/dev/null 2>&1 || true
docker image prune -f --filter "dangling=true" >/dev/null 2>&1 || true

echo ""
echo "=========================================="
echo -e "${GREEN}  Deploy thanh cong${NC} - commit ${SHA} ($(elapsed)s)"
echo "=========================================="
$COMPOSE ps
echo ""
echo "  Trang chu : https://${DOMAIN}"
echo "  Log       : cd $COMPOSE_DIR && $COMPOSE logs -f --tail 100"
echo "=========================================="
