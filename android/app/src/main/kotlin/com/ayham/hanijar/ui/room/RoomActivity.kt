package com.ayham.hanijar.ui.room

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.ayham.hanijar.databinding.ActivityRoomBinding
import com.ayham.hanijar.data.api.RetrofitClient
import com.ayham.hanijar.data.local.SharedPreferencesManager
import com.ayham.hanijar.data.models.Gift
import com.ayham.hanijar.data.models.SendGiftRequest
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.launch

class RoomActivity : AppCompatActivity() {
    private lateinit var binding: ActivityRoomBinding
    private lateinit var prefsManager: SharedPreferencesManager
    private lateinit var giftAdapter: GiftAdapter
    private var roomId: Int = 0
    private var socket: Socket? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRoomBinding.inflate(layoutInflater)
        setContentView(binding.root)
        prefsManager = SharedPreferencesManager(this)

        roomId = intent.getIntExtra("room_id", 0)
        if (roomId == 0) {
            finish()
            return
        }

        setupUI()
        loadGifts()
    }

    private fun setupUI() {
        binding.sendButton.setOnClickListener { sendMessage() }
        giftAdapter = GiftAdapter { gift -> sendGift(gift) }
        binding.giftsRecyclerView.layoutManager = LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false)
        binding.giftsRecyclerView.adapter = giftAdapter
    }

    private fun loadGifts() {
        binding.progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val gifts = RetrofitClient.apiService.getGifts()
                giftAdapter.submitList(gifts)
            } catch (e: Exception) {
                Toast.makeText(this@RoomActivity, "خطأ: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }

    private fun sendMessage() {
        val message = binding.messageInput.text.toString().trim()
        if (message.isEmpty()) return

        binding.messageInput.text?.clear()
        // Socket.io implementation will be added
        Toast.makeText(this, "الرسالة: $message", Toast.LENGTH_SHORT).show()
    }

    private fun sendGift(gift: Gift) {
        binding.progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val token = "Bearer ${prefsManager.getToken()}"
                val user = prefsManager.getUser()
                if (user != null) {
                    val response = RetrofitClient.apiService.sendGift(
                        token,
                        SendGiftRequest(user.userId, gift.giftId, roomId)
                    )
                    Toast.makeText(this@RoomActivity, "تم إرسال الهدية", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@RoomActivity, "خطأ: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        socket?.disconnect()
    }
}
