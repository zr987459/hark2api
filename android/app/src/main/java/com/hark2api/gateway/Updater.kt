package com.hark2api.gateway

import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.widget.Toast
import androidx.core.content.FileProvider
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

/** 检查更新：读总后台 /api/app/version，有新版就下载并调起安装 */
object Updater {
    const val HOME = "https://antigravity-gateway-2.onrender.com"
    @Volatile private var busy = false

    fun check(act: Activity, manual: Boolean) {
        if (busy) return
        busy = true
        if (manual) Toast.makeText(act, "正在检查更新…", Toast.LENGTH_SHORT).show()
        Thread {
            try {
                val c = URL("$HOME/api/app/version").openConnection() as HttpURLConnection
                c.connectTimeout = 40000; c.readTimeout = 40000
                val j = JSONObject(c.inputStream.bufferedReader().readText())
                val code = j.optInt("versionCode", 0)
                val name = j.optString("versionName", "")
                val notes = j.optString("notes", "")
                act.runOnUiThread {
                    busy = false
                    if (code > BuildConfig.VERSION_CODE) {
                        AlertDialog.Builder(act)
                            .setTitle("发现新版本 $name")
                            .setMessage(if (notes.isNotEmpty()) notes else "当前 ${BuildConfig.VERSION_NAME}，更新后账号和设置都会保留。")
                            .setPositiveButton("更新") { _, _ -> download(act) }
                            .setNegativeButton("以后", null)
                            .show()
                    } else if (manual) {
                        Toast.makeText(act, "已经是最新版 ${BuildConfig.VERSION_NAME}", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                busy = false
                if (manual) act.runOnUiThread { Toast.makeText(act, "检查失败，稍后再试", Toast.LENGTH_SHORT).show() }
            }
        }.start()
    }

    private fun download(act: Activity) {
        if (Build.VERSION.SDK_INT >= 26 && !act.packageManager.canRequestPackageInstalls()) {
            Toast.makeText(act, "请允许安装未知应用，然后再点一次更新", Toast.LENGTH_LONG).show()
            try { act.startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:${act.packageName}"))) } catch (e: Exception) {}
            return
        }
        val dlg = AlertDialog.Builder(act).setTitle("正在下载").setMessage("0%").setCancelable(false).show()
        Thread {
            try {
                val dir = File(act.cacheDir, "updates").apply { mkdirs() }
                val out = File(dir, "Antigravity.apk")
                val c = URL("$HOME/app.apk").openConnection() as HttpURLConnection
                c.connectTimeout = 40000; c.readTimeout = 60000
                val total = c.contentLengthLong
                var done = 0L; var last = -1
                c.inputStream.use { input ->
                    out.outputStream().use { o ->
                        val buf = ByteArray(64 * 1024)
                        while (true) {
                            val n = input.read(buf); if (n < 0) break
                            o.write(buf, 0, n); done += n
                            val pct = if (total > 0) (done * 100 / total).toInt() else 0
                            if (pct != last) { last = pct; act.runOnUiThread { dlg.setMessage("$pct%") } }
                        }
                    }
                }
                act.runOnUiThread {
                    dlg.dismiss()
                    val uri = FileProvider.getUriForFile(act, "${act.packageName}.files", out)
                    act.startActivity(Intent(Intent.ACTION_VIEW).apply {
                        setDataAndType(uri, "application/vnd.android.package-archive")
                        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
                    })
                }
            } catch (e: Exception) {
                act.runOnUiThread { dlg.dismiss(); Toast.makeText(act, "下载失败，稍后再试", Toast.LENGTH_SHORT).show() }
            }
        }.start()
    }
}
