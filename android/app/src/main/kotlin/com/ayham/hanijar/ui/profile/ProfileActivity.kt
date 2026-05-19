package com.ayham.hanijar.ui.profile

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.ayham.hanijar.databinding.ActivityProfileBinding
import com.ayham.hanijar.data.api.RetrofitClient
import com.ayham.hanijar.data.local.SharedPreferencesManager
import com.bumptech.glide.Glide
import kotlinx.coroutines.launch

class ProfileActivity : AppCompatActivity() {
    private lateinit var binding: ActivityProfileBinding
    private lateinit var prefsManager: SharedPreferencesManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityProfileBinding.inflate(layoutInflater)
        setContentView(binding.root)
        prefsManager = SharedPreferencesManager(this)

        loadProfile()
    }

    private fun loadProfile() {
        val user = prefsManager.getUser()
        if (user != null) {
            binding.username.text = user.username
            binding.email.text = user.email
            binding.coins.text = "${user.coins} عملة"
            binding.vipLevel.text = "المستوى: ${user.vipLevel}"
            binding.supportPoints.text = "نقاط الدعم: ${user.supportPoints}"

            if (user.avatarUrl.isNotEmpty()) {
                Glide.with(this)
                    .load(user.avatarUrl)
                    .into(binding.avatar)
            }
        } else {
            Toast.makeText(this, "خطأ في تحميل البيانات", Toast.LENGTH_SHORT).show()
        }
    }
}
