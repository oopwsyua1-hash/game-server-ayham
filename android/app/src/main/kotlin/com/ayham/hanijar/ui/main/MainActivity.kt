package com.ayham.hanijar.ui.main

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.ayham.hanijar.databinding.ActivityMainBinding
import com.ayham.hanijar.data.api.RetrofitClient
import com.ayham.hanijar.data.local.SharedPreferencesManager
import com.ayham.hanijar.data.models.CreateRoomRequest
import com.ayham.hanijar.ui.profile.ProfileActivity
import com.ayham.hanijar.ui.room.RoomActivity
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private lateinit var prefsManager: SharedPreferencesManager
    private lateinit var roomAdapter: RoomAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        prefsManager = SharedPreferencesManager(this)

        setupUI()
        loadRooms()
    }

    private fun setupUI() {
        roomAdapter = RoomAdapter { room ->
            val intent = Intent(this, RoomActivity::class.java)
            intent.putExtra("room_id", room.roomId)
            startActivity(intent)
        }
        binding.roomsRecyclerView.layoutManager = LinearLayoutManager(this)
        binding.roomsRecyclerView.adapter = roomAdapter

        binding.createRoomButton.setOnClickListener { createRoom() }
        binding.profileButton.setOnClickListener {
            startActivity(Intent(this, ProfileActivity::class.java))
        }
    }

    private fun loadRooms() {
        binding.progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val rooms = RetrofitClient.apiService.getRooms()
                roomAdapter.submitList(rooms)
            } catch (e: Exception) {
                Toast.makeText(this@MainActivity, "خطأ: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }

    private fun createRoom() {
        val roomName = binding.roomNameInput.text.toString().trim()
        if (roomName.isEmpty()) {
            Toast.makeText(this, "أدخل اسم الغرفة", Toast.LENGTH_SHORT).show()
            return
        }

        binding.progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val token = "Bearer ${prefsManager.getToken()}"
                val response = RetrofitClient.apiService.createRoom(
                    token,
                    CreateRoomRequest(roomName)
                )
                Toast.makeText(this@MainActivity, "تم إنشاء الغرفة", Toast.LENGTH_SHORT).show()
                binding.roomNameInput.text?.clear()
                loadRooms()
            } catch (e: Exception) {
                Toast.makeText(this@MainActivity, "خطأ: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }
}
