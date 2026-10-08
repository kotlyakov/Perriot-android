# Pierrot Android build plan

1. Keep the repository private.
2. Add Android WebView app source and assets.
3. Build using GitHub Actions with Android SDK Build Tools.
4. Run `zipalign` and `apksigner verify --verbose --print-certs` on release artifacts.
5. Store signing keys only as GitHub Actions encrypted secrets; never commit keystores.
6. Publish APK as a workflow artifact for installation testing.

The existing APK should not be manually repacked with an unverified custom signer.
