"""Validate the release identity, permissions and Android/store icon assets."""
from pathlib import Path
import struct,xml.etree.ElementTree as ET

root=Path(__file__).resolve().parents[1]
res=root/'android/app/src/main/res'
ns='{http://schemas.android.com/apk/res/android}'
manifest=ET.parse(root/'android/app/src/main/AndroidManifest.xml').getroot()
app=manifest.find('application')
assert not manifest.findall('uses-permission'),'Game needs no Android permissions'
assert app.get(ns+'icon')=='@mipmap/ic_launcher'
assert app.get(ns+'roundIcon')=='@mipmap/ic_launcher_round'
assert app.get(ns+'allowBackup')=='false'
gradle=(root/'android/app/build.gradle.kts').read_text()
assert 'versionName = "0.4.62"' in gradle and 'versionCode = 76' in gradle
assert 'release {' in gradle and 'isDebuggable = false' in gradle
assert 'setWebContentsDebuggingEnabled(false)' in (root/'android/app/src/main/java/ru/cardcascade/game/MainActivity.kt').read_text()
def png_size(path):
 data=path.read_bytes();assert data[:8]==b'\x89PNG\r\n\x1a\n';return struct.unpack('>II',data[16:24])
for density,size in [('mdpi',48),('hdpi',72),('xhdpi',96),('xxhdpi',144),('xxxhdpi',192)]:
 assert png_size(res/('mipmap-'+density)/'ic_launcher.png')==(size,size)
assert png_size(res/'mipmap-xxxhdpi/ic_launcher_foreground.png')==(432,432)
for name in ['ic_launcher','ic_launcher_round']:
 icon=ET.parse(res/'mipmap-anydpi-v26'/f'{name}.xml').getroot()
 assert icon.tag=='adaptive-icon'
 assert icon.find('background').get(ns+'drawable')=='@color/launcher_background'
 assert icon.find('foreground').get(ns+'drawable')=='@mipmap/ic_launcher_foreground'
icon=root/'rustore/media/icon-512.png'
assert png_size(icon)==(512,512) and icon.stat().st_size<3*1024*1024
assert (root/'rustore/signing/release-certificate.pem').read_text().startswith('-----BEGIN CERTIFICATE-----')
print('Release identity, zero permissions, debug disabled, adaptive/density/store icons PASS')
