package ru.cardcascade.game

import android.annotation.SuppressLint
import android.app.Activity
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import java.io.ByteArrayInputStream
import java.io.FileNotFoundException

class MainActivity : Activity() {
    private lateinit var web: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        web = WebView(this)
        web.settings.apply {
            javaScriptEnabled = true
            // Honour width=device-width and fit initial content to the WebView viewport.
            useWideViewPort = true
            loadWithOverviewMode = true
            domStorageEnabled = false
            allowFileAccess = false
            allowContentAccess = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            javaScriptCanOpenWindowsAutomatically = false
            setSupportMultipleWindows(false)
            setSupportZoom(false)
        }
        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean =
                request.url.toString() != START_URL

            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse {
                val path = assetPath(request.url)
                if (path == null || request.method != "GET") return response(403, "Forbidden")
                return try {
                    val mime = when (path.substringAfterLast('.')) {
                        "html" -> "text/html"
                        "css" -> "text/css"
                        "js" -> "text/javascript"
                        "json" -> "application/json"
                        "svg" -> "image/svg+xml"
                        "png" -> "image/png"
                        "webp" -> "image/webp"
                        "woff2" -> "font/woff2"
                        "ttf" -> "font/ttf"
                        else -> return response(403, "Forbidden")
                    }
                    WebResourceResponse(mime, "UTF-8", 200, "OK", mapOf(
                        "Content-Security-Policy" to "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'",
                        "X-Content-Type-Options" to "nosniff",
                        "Cache-Control" to "no-store"
                    ), assets.open(path))
                } catch (_: FileNotFoundException) {
                    response(404, "Not Found")
                } catch (_: java.io.IOException) {
                    response(500, "Asset Error")
                }
            }
        }
        web.addJavascriptInterface(CardStorage(filesDir), "CardStorage")
        setContentView(web)
        hideSystemBars()
        web.loadUrl(START_URL)
    }

    private fun assetPath(uri: Uri): String? {
        if (uri.scheme != "https" || uri.host != "appassets.androidplatform.net" ||
            uri.port != -1 || uri.userInfo != null || uri.query != null) return null
        val path = uri.path?.removePrefix("/") ?: return null
        if (path.isEmpty() || path.split('/').any { it.isEmpty() || it == "." || it == ".." } ||
            !path.matches(Regex("[A-Za-z0-9_./-]+"))) return null
        return path
    }

    private fun response(status: Int, reason: String) = WebResourceResponse(
        "text/plain", "UTF-8", status, reason, emptyMap(), ByteArrayInputStream(reason.toByteArray())
    )

    @Suppress("DEPRECATION")
    private fun hideSystemBars() {
        if (android.os.Build.VERSION.SDK_INT >= 30) {
            window.insetsController?.apply {
                hide(WindowInsets.Type.systemBars())
                systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_FULLSCREEN or
                View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideSystemBars()
    }

    @Deprecated("Legacy callback delegates to the offline game")
    override fun onBackPressed() {
        web.evaluateJavascript("typeof window.cardGameBack === 'function' && window.cardGameBack()") { handled ->
            if (handled != "true") finish()
        }
    }

    override fun onPause() {
        web.evaluateJavascript("if (typeof window.cardGamePause === 'function') window.cardGamePause()", null)
        super.onPause()
    }

    override fun onResume() {
        super.onResume()
        if (::web.isInitialized) web.evaluateJavascript("if (typeof window.cardGameResume === 'function') window.cardGameResume()", null)
    }

    override fun onDestroy() {
        web.removeJavascriptInterface("CardStorage")
        web.destroy()
        super.onDestroy()
    }

    companion object { private const val START_URL = "https://appassets.androidplatform.net/index.html" }
}
