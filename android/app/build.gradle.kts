plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}
android {
    namespace = "ru.cardcascade.game"
    compileSdk = 36
    buildToolsVersion = "35.0.0"
    defaultConfig {
        applicationId = "ru.cardcascade.game.preview"
        minSdk = 26
        targetSdk = 36
        versionCode = 76
        versionName = "0.4.62"
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    buildTypes { release {
        isDebuggable = false
        isMinifyEnabled = false
    } }
}
kotlin { jvmToolchain(17) }


