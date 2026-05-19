package com.ayham.hanijar.ui.auth

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.ayham.hanijar.databinding.ActivityLoginBinding
import com.ayham.hanijar.data.api.RetrofitClient
import com.ayham.hanijar.data.local.SharedPreferencesManager
import com.ayham.hanijar.data.models.LoginRequest
import com.ayham.hanijar.ui.main.MainActivity
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {
    private lateinit var binding: ActivityLoginBinding
    private lateinit var prefsManager: SharedPreferencesManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        prefsManager = SharedPreferencesManager(this)

        setupUI()
    }

    private fun setupUI() {
        binding.loginButton.setOnClickListener { login() }
        binding.registerLink.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }
    }

    private fun login() {
        val email = binding.emailInput.text.toString().trim()
        val password = binding.passwordInput.text.toString().trim()

        if (email.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "جميع الحقول مطلوبة", Toast.LENGTH_SHORT).show()
            return
        }

        binding.progressBar.visibility = View.VISIBLE

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.login(
                    LoginRequest(email, password)
                )
                prefsManager.saveToken(response.token)
                prefsManager.saveUser(response.user)
                prefsManager.setLoggedIn(true)

                Toast.makeText(this@LoginActivity, "مرحباً بك", Toast.LENGTH_SHORT).show()
                startActivity(Intent(this@LoginActivity, MainActivity::class.java))
                finish()
            } catch (e: Exception) {
                Toast.makeText(
                    this@LoginActivity,
                    "خطأ: ${e.message}",
                    Toast.LENGTH_SHORT
                ).show()
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }
}
