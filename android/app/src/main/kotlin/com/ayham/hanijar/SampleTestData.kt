package com.ayham.hanijar

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.ayham.hanijar.data.api.RetrofitClient
import com.ayham.hanijar.data.local.SharedPreferencesManager
import com.ayham.hanijar.data.models.LoginRequest
import com.ayham.hanijar.ui.auth.LoginActivity
import com.ayham.hanijar.ui.main.MainActivity
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * في البداية: جرب بيانات الاختبار
 * Email: test@example.com
 * Password: test123
 */
class SampleTestData {
    companion object {
        // بيانات تجريب سريعة
        val testLogin = LoginRequest(
            email = "test@example.com",
            password = "test123"
        )

        // أو اختبر من التطبيق:
        val newUser = mapOf(
            "username" to "أحمد",
            "lastName" to "السبع",
            "email" to "user@example.com",
            "password" to "user123",
            "country" to "Syria",
            "birthDate" to "2000-01-01",
            "age" to 24,
            "gender" to "ذكر"
        )
    }
}
