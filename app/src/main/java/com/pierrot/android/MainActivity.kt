package com.pierrot.android

import android.app.Activity
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebView
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse

class MainActivity : Activity() {
    private lateinit var game: WebView
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.decorView.systemUiVisibility = (
            4 or 1024 or 4096 or 512 or 2
        )
        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()
        game = WebView(this)
        game.settings.javaScriptEnabled = true
        game.settings.domStorageEnabled = true
        game.webChromeClient = WebChromeClient()
        game.webViewClient = object : WebViewClientCompat() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                loader.shouldInterceptRequest(request.url)
        }
        setContentView(game)
        game.loadUrl("https://appassets.androidplatform.net/web/index.html")
    }
    override fun onDestroy() {
        game.destroy()
        super.onDestroy()
    }
}
