#!/usr/bin/env bash
# Compare a target server against a baseline captured from old prod.
# See docs/PROD_MIGRATION_TEST_PLAN.md.
#
#   bin/verify-migration.sh capture                      # old prod -> tmp/baseline
#   bin/verify-migration.sh verify --target <ip|url>     # replay baseline, exit 1 on diff
#   bin/verify-migration.sh db-counts <ssh-host>         # table row counts, via ssh
#   bin/verify-migration.sh files <ssh-host>             # images/imgs inventory, via ssh
#   bin/verify-migration.sh tls [--target <ip>]          # cert SAN, expiry, :80 ACME path
#
# Env: SITE (default www.ynotradio.net), BASELINE_DIR (default tmp/baseline),
#      DIFF_MAX (changed body lines tolerated per route, default 40),
#      INSECURE=1 to skip TLS verification (new box before the cert is copied).
set -euo pipefail

SITE="${SITE:-www.ynotradio.net}"
BASELINE_DIR="${BASELINE_DIR:-tmp/baseline}"
DIFF_MAX="${DIFF_MAX:-40}"

ROUTES=(
  / /index /aboutus /cdoftheweek /concerts /contact /contests /deejays /donate
  /madness /mobile /music /nerds /ondemand /quarantine /recordstoreday /rodney
  /schedule /shows /top1000 /top11 /y100 /y100rocks /yearendpoll
  /yearendstaffpicks /ymail /loggedoff /does-not-exist
  /Schedule /schedule/ /schedule.php /top11.php
)

curl_base=(curl -sS -m 30 --max-redirs 0)
[ "${INSECURE:-}" = 1 ] && curl_base+=(-k)

target_args() {
  local target="${1:-}"
  [ -z "$target" ] && return 0
  if [[ "$target" =~ ^[0-9.]+$ ]]; then
    printf -- '--resolve\n%s:443:%s\n--resolve\n%s:80:%s\n' "$SITE" "$target" "$SITE" "$target"
  fi
}

# Drop things that change per request so body diffs show real changes.
normalize() {
  sed -E 's/[[:space:]]+$//; s/(nonce|csrf[_-]?token|_token)="[^"]*"/\1="X"/g' | grep -v '^$' || true
}

slug() { echo "${1//\//_}" | sed 's/^_//; s/^$/root/'; }

fetch_routes() {
  local out="$1" target="${2:-}"
  local -a extra=()
  while IFS= read -r a; do [ -n "$a" ] && extra+=("$a"); done < <(target_args "$target")
  mkdir -p "$out/bodies"
  : > "$out/routes.tsv"
  for r in "${ROUTES[@]}"; do
    local s; s="$(slug "$r")"
    for scheme in https http; do
      local meta
      meta="$("${curl_base[@]}" ${extra[@]+"${extra[@]}"} -o "$out/bodies/$scheme.$s.raw" \
        -w '%{http_code}|%{redirect_url}|%{content_type}' "$scheme://$SITE$r" || echo "000||")"
      normalize < "$out/bodies/$scheme.$s.raw" > "$out/bodies/$scheme.$s.body"
      rm -f "$out/bodies/$scheme.$s.raw"
      printf '%s|%s|%s\n' "$scheme" "$r" "$meta" >> "$out/routes.tsv"
    done
  done
  printf 'apex-redirect|%s\n' "$("${curl_base[@]}" ${extra[@]+"${extra[@]}"} -o /dev/null -w '%{http_code} %{redirect_url}' "https://${SITE#www.}/" 2>/dev/null || echo 000)" >> "$out/routes.tsv"
}

cmd_capture() {
  rm -rf "$BASELINE_DIR"
  fetch_routes "$BASELINE_DIR"
  echo "Captured $(wc -l < "$BASELINE_DIR/routes.tsv") rows into $BASELINE_DIR"
}

cmd_verify() {
  local target=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --target) target="$2"; shift 2 ;;
      *) echo "Unknown arg: $1" >&2; exit 2 ;;
    esac
  done
  [ -d "$BASELINE_DIR" ] || { echo "No baseline in $BASELINE_DIR; run capture first" >&2; exit 2; }
  local tmp; tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT
  fetch_routes "$tmp" "$target"

  local fail=0 warn=0
  while IFS='|' read -r scheme route code redirect ctype; do
    [ "$scheme" = "apex-redirect" ] && continue
    local s; s="$(slug "$route")"
    local got; got="$(awk -F'|' -v sc="$scheme" -v r="$route" '$1==sc && $2==r {print $3"|"$4"|"$5}' "$tmp/routes.tsv")"
    local want="$code|$redirect|$ctype"
    if [[ "$code" == 3* ]]; then
      got="${got%|*}"
      want="$code|$redirect"
    fi
    if [ "$got" != "$want" ]; then
      echo "FAIL $scheme $route: baseline [$code $redirect $ctype] target [$got]"
      fail=1
      continue
    fi
    [ -f "$BASELINE_DIR/bodies/$scheme.$s.body" ] || continue
    local changed
    changed="$(diff "$BASELINE_DIR/bodies/$scheme.$s.body" "$tmp/bodies/$scheme.$s.body" | grep -c '^[<>]' || true)"
    if [ "$changed" -gt "$DIFF_MAX" ]; then
      echo "WARN $scheme $route: $changed body lines differ (max $DIFF_MAX)"
      warn=1
    fi
  done < "$BASELINE_DIR/routes.tsv"

  local base_apex got_apex
  base_apex="$(awk -F'|' '$1=="apex-redirect"{print $2}' "$BASELINE_DIR/routes.tsv")"
  got_apex="$(awk -F'|' '$1=="apex-redirect"{print $2}' "$tmp/routes.tsv")"
  [ "$base_apex" = "$got_apex" ] || { echo "FAIL apex redirect: baseline [$base_apex] target [$got_apex]"; fail=1; }

  if [ "$fail" = 0 ]; then
    echo "OK: status/redirect/content-type match on $(wc -l < "$BASELINE_DIR/routes.tsv" | tr -d ' ') rows"
    [ "$warn" = 0 ] || echo "(body warnings above)"
  fi
  exit "$fail"
}

cmd_tls() {
  local target="" host="$SITE"
  [ "${1:-}" = "--target" ] && target="$2"
  local connect="${target:-$host}"
  local cert
  cert="$(echo | openssl s_client -connect "$connect:443" -servername "$host" 2>/dev/null | openssl x509 -noout -enddate -ext subjectAltName 2>/dev/null)"
  echo "$cert"
  echo "$cert" | grep -q "DNS:${host#www.}" || { echo "FAIL: apex missing from SAN"; exit 1; }
  echo "$cert" | grep -q "DNS:www.${host#www.}" || { echo "FAIL: www missing from SAN"; exit 1; }
  local end; end="$(echo "$cert" | sed -n 's/^notAfter=//p')"
  local end_epoch; end_epoch="$(date -d "$end" +%s 2>/dev/null || date -j -f '%b %e %T %Y %Z' "$end" +%s)"
  [ $(( (end_epoch - $(date +%s)) / 86400 )) -ge 30 ] || { echo "FAIL: cert expires in under 30 days"; exit 1; }
  local acme
  acme="$(curl -sS -m 15 -o /dev/null -w '%{http_code}' ${target:+--resolve "$host:80:$target"} "http://$host/.well-known/acme-challenge/x")"
  [ "$acme" != "301" ] && [ "$acme" != "302" ] || { echo "FAIL: ACME path redirects ($acme)"; exit 1; }
  echo "OK: SAN, expiry, ACME path ($acme)"
}

# DB creds are read on the remote host from the deployed .env and passed via MYSQL_PWD.
remote_mysql() {
  local host="$1" sql="$2"
  ssh -o BatchMode=yes "$host" "
    get() { grep -E \"^\$1=\" ~/htdocs/.env | head -1 | cut -d= -f2- | tr -d \"'\\\"\"; }
    MYSQL_PWD=\"\$(get DB_PASSWORD)\" mysql -h \"\$(get DB_HOST)\" -P \"\$(get DB_PORT)\" -u \"\$(get DB_USER)\" \"\$(get DB_NAME)\" -N -B -e \"$sql\"
  "
}

cmd_db_counts() {
  local host="${1:?ssh host required}"
  local tables
  tables="$(remote_mysql "$host" "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY 1")"
  for t in $tables; do
    printf '%s\t%s\n' "$t" "$(remote_mysql "$host" "SELECT COUNT(*) FROM \\\`$t\\\`")"
  done
}

cmd_files() {
  local host="${1:?ssh host required}"
  ssh -o BatchMode=yes "$host" 'cd ~/htdocs && find images imgs -type f -print0 | sort -z | xargs -0 sha256sum'
}

main() {
  local cmd="${1:-}"; shift || true
  case "$cmd" in
    capture) cmd_capture "$@" ;;
    verify) cmd_verify "$@" ;;
    tls) cmd_tls "$@" ;;
    db-counts) cmd_db_counts "$@" ;;
    files) cmd_files "$@" ;;
    *) sed -n '2,13p' "$0" >&2; exit 2 ;;
  esac
}

main "$@"
