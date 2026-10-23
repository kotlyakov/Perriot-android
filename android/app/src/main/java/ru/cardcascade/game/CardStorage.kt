package ru.cardcascade.game

import android.util.AtomicFile
import android.webkit.JavascriptInterface
import org.json.JSONObject
import java.io.File
import java.io.ByteArrayOutputStream
import java.io.FileNotFoundException
import java.io.FileOutputStream
import java.nio.ByteBuffer
import java.nio.charset.CodingErrorAction

/** Called only by bundled scripts. Full SaveData validation belongs to the JS codec. */
class CardStorage(private val directory: File) {
    private fun file(slot: String): AtomicFile {
        require(slot == "current" || slot == "backup") { "Unknown save slot" }
        return AtomicFile(File(directory, "$slot.json"))
    }

    @JavascriptInterface
    @Synchronized
    fun read(slot: String): String {
        val store = file(slot)
        val input = try { store.openRead() } catch (error: FileNotFoundException) {
            if (!store.baseFile.exists()) return ""
            throw IllegalStateException("Save read failed", error)
        }
        input.use {
            val buffer = ByteArray(8192)
            val collected = ByteArrayOutputStream()
            while (true) {
                val count = it.read(buffer)
                if (count == -1) break
                check(collected.size() + count <= PROFILE_LIMIT) { "Save exceeds profile limit" }
                collected.write(buffer, 0, count)
            }
            check(collected.size() > 0) { "Save file is empty" }
            val bytes = collected.toByteArray()
            return Charsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT).decode(ByteBuffer.wrap(bytes)).toString()
        }
    }

    @JavascriptInterface
    @Synchronized
    fun writeCurrent(text: String): Boolean = write("current", text)

    @JavascriptInterface
    @Synchronized
    fun writeBackup(text: String): Boolean = write("backup", text)

    private fun write(slot: String, text: String): Boolean {
        var output: FileOutputStream? = null
        val store = file(slot)
        return try {
            // Validate before startWrite: invalid envelope cannot replace existing data.
            require(text.isNotEmpty() && text.length <= PROFILE_LIMIT)
            val bytes = Charsets.UTF_8.newEncoder().onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT).encode(java.nio.CharBuffer.wrap(text))
            require(bytes.remaining() <= PROFILE_LIMIT)
            val envelope = JSONObject(text)
            val profiles = envelope.optJSONObject("account")
            require(envelope.getString("format") == "card-cascade-save" && envelope.getInt("version") == 1)
            if (profiles != null) {
                require(envelope.length() == 4 && profiles.getInt("version") == 1 &&
                    profiles.getString("activeId") in listOf("1", "2", "3") && profiles.getJSONObject("profiles").length() == 3)
                require(envelope.isNull("state") || envelope.getJSONObject("state").getInt("schemaVersion") == 1)
            } else {
                require(bytes.remaining() <= LIMIT && envelope.length() == 3 && envelope.getJSONObject("state").getInt("schemaVersion") == 1)
            }
            output = store.startWrite()
            while (bytes.hasRemaining()) output.channel.write(bytes)
            store.finishWrite(output)
            output = null
            true
        } catch (_: Exception) {
            if (output != null) {
                try { store.failWrite(output) } catch (_: Exception) { /* Keep failure explicit. */ }
            }
            false
        }
    }

    companion object {
        private const val LIMIT = 2 * 1024 * 1024
        private const val PROFILE_LIMIT = 16 * 1024 * 1024
    }
}
