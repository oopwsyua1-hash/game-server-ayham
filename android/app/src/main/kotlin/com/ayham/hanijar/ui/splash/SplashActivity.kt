package com.ayham.hanijar.ui.splash

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity
import com.ayham.hanijar.R
import com.ayham.hanijar.data.local.SharedPreferencesManager
import com.ayham.hanijar.ui.auth.LoginActivity
import com.ayham.hanijar.ui.main.MainActivity

class SplashActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)

        val prefsManager = SharedPreferencesManager(this)

        Handler(Looper.getMainLooper()).postDelayed({
            val intent = if (prefsManager.isLoggedIn()) {
                Intent(this, MainActivity::class.java)
            } else {
                Intent(this, LoginActivity::class.java)
            }
            startActivity(intent)
            finish()
        }, 2000)
    }
}
