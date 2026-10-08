plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}
android {
    namespace = "com.pierrot.android"
    compileSdk = 35
    defaultConfig {
        applicationId = "com.pierrot.android"
        minSdk = 26
        targetSdk = 28
        versionCode = 45
        versionName = "0.4.5-ci"
    }
    buildTypes { getByName("release") { isMinifyEnabled = false } }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}
dependencies {
    implementation("androidx.webkit:webkit:1.12.1")
}
