"""Static packaging/security checks; not a substitute for Android compilation."""
from pathlib import Path
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parents[1]
ns = '{http://schemas.android.com/apk/res/android}'
manifest = ET.parse(root / 'app/src/main/AndroidManifest.xml').getroot()
assert not manifest.findall('uses-permission'), 'No network/storage permissions expected'
app = manifest.find('application')
assert app.get(ns + 'allowBackup') == 'false'
assert app.get(ns + 'usesCleartextTraffic') == 'false'
assert app.find('activity').get(ns + 'screenOrientation') == 'landscape'
activity = (root / 'app/src/main/java/ru/cardcascade/game/MainActivity.kt').read_text()
assert 'https://appassets.androidplatform.net/index.html' in activity
assert 'useWideViewPort = true' in activity and 'loadWithOverviewMode = true' in activity, 'WebView must honour device viewport and fit initial content'
assert app.get(ns + 'label') == 'Пьеро', 'User selected app name'
assert 'namespace = "ru.cardcascade.game"' in (root / 'app/build.gradle.kts').read_text()
assert 'applicationId = "ru.cardcascade.game.preview"' in (root / 'app/build.gradle.kts').read_text()
assert 'allowFileAccess = false' in activity and 'allowContentAccess = false' in activity
assert '"ttf" -> "font/ttf"' in activity, 'Bundled Cyrillic font must be loadable offline'
assert 'frame-src \'none\'' in activity and 'connect-src \'none\'' in activity
storage = (root / 'app/src/main/java/ru/cardcascade/game/CardStorage.kt').read_text()
assert 'AtomicFile' in storage and 'store.finishWrite(output)' in storage and 'store.failWrite(output)' in storage
assert 'CodingErrorAction.REPORT' in storage and '2 * 1024 * 1024' in storage
ET.parse(root / 'app/src/main/res/values/styles.xml')
print('Android XML/security configuration checked; compilation/device tests still required.')
