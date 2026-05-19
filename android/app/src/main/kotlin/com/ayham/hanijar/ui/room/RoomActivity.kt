package com.ayham.hanijar.ui.room

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.LinearLayoutManager
import com.ayham.hanijar.databinding.ActivityRoomBinding
import com.ayham.hanijar.data.api.RetrofitClient
import com.ayham.hanijar.data.local.SharedPreferencesManager
import com.ayham.hanijar.data.models.Gift
import com.ayham.hanijar.data.models.SendGiftRequest
import kotlinx.coroutines.launch

class RoomActivity : AppCompatActivity() {
    private lateinit var binding: ActivityRoomBinding
    private lateinit var prefsManager: SharedPreferencesManager
    private lateinit var giftAdapter: GiftAdapter
    private var roomId: Int = 0
    private var receiverId: Int = 0 // ID المستقبل (مالك الغرفة مثلاً)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRoomBinding.inflate(layoutInflater)
        setContentView(binding.root)
        prefsManager = SharedPreferencesManager(this)

        roomId = intent.getIntExtra("room_id", 0)
        receiverId = intent.getIntExtra("owner_id", 0) // ID صاحب الغرفة

        if (roomId == 0) {
            Toast.makeText(this, "خطأ: الغرفة غير موجودة", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        setupUI()
        loadGifts()
    }

    private fun setupUI() {
        binding.sendButton.setOnClickListener { sendMessage() }
        
        giftAdapter = GiftAdapter { gift -> sendGift(gift) }
        binding.giftsRecyclerView.layoutManager = 
            GridLayoutManager(this, 3)
        binding.giftsRecyclerView.adapter = giftAdapter
    }

    private fun loadGifts() {
        binding.progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val gifts = RetrofitClient.apiService.getGifts()
                giftAdapter.submitList(gifts)
            } catch (e: Exception) {
                Toast.makeText(this@RoomActivity, "خطأ تحميل الهدايا: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }

    private fun sendMessage() {
        val message = binding.messageInput.text.toString().trim()
        if (message.isEmpty()) {
            Toast.makeText(this, "اكتب رسالة", Toast.LENGTH_SHORT).show()
            return
        }

        // إرسال الرسالة عبر Socket.io
        binding.messageInput.text?.clear()
        Toast.makeText(this, "✓ الرسالة: $message", Toast.LENGTH_SHORT).show()
    }

    private fun sendGift(gift: Gift) {
        binding.progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val token = "Bearer ${prefsManager.getToken()}"
                val user = prefsManager.getUser()
                
                if (user != null && receiverId > 0) {
                    val response = RetrofitClient.apiService.sendGift(
                        token,
                        SendGiftRequest(receiverId, gift.giftId, roomId)
                    )
                    Toast.makeText(
                        this@RoomActivity,
                        "✓ تم إرسال ${gift.name} بنجاح!",
                        Toast.LENGTH_SHORT
                    ).show()
                } else {
                    Toast.makeText(this@RoomActivity, "خطأ: بيانات ناقصة", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(
                    this@RoomActivity,
                    "خطأ: ${e.message}",
                    Toast.LENGTH_LONG
                ).show()
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }
}
