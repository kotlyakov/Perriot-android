#!/usr/bin/env bash
# Private keys stay outside the repository; only the certificate is public.
set -euo pipefail
if [ "$#" -ne 4 ]; then
  echo 'Usage: sign-release.sh unsigned.apk ci-tools-directory private-key-directory output.apk' >&2
  exit 2
fi
input_apk=$1
sign_tools=$2
key_dir=$3
output_apk=$4
script_dir=$(cd "$(dirname "$0")" && pwd)
expected_cert=$(openssl x509 -in "$script_dir/signing/release-certificate.pem" -noout -fingerprint -sha256 | cut -d= -f2 | tr -d ':' | tr '[:upper:]' '[:lower:]')
"${JAVA_BIN:-java}" -jar "$sign_tools/lib/apksigner.jar" sign \
  --ks "$key_dir/pierrot-release.p12" --ks-type PKCS12 --ks-key-alias pierrot-release \
  --ks-pass "file:$key_dir/pierrot-release.pass" \
  --v1-signing-enabled false --v2-signing-enabled true --v3-signing-enabled true \
  --out "$output_apk" "$input_apk"
"${JAVA_BIN:-java}" -jar "$sign_tools/lib/apksigner.jar" verify --verbose --print-certs "$output_apk" > "$output_apk.signature.txt"
grep -Fq "Signer #1 certificate SHA-256 digest: $expected_cert" "$output_apk.signature.txt"
grep -Fq 'Verified using v2 scheme (APK Signature Scheme v2): true' "$output_apk.signature.txt"
grep -Fq 'Verified using v3 scheme (APK Signature Scheme v3): true' "$output_apk.signature.txt"
LD_LIBRARY_PATH="$sign_tools/lib64${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}" "$sign_tools/zipalign" -c -P 16 -v 4 "$output_apk" > "$output_apk.alignment.txt"
sha256sum "$output_apk" > "$output_apk.sha256"
printf 'Signed with pinned permanent release certificate; v2/v3 and zipalign verified.\n'
