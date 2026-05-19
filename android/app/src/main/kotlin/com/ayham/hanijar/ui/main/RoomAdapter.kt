package com.ayham.hanijar.ui.main

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.ayham.hanijar.databinding.ItemRoomBinding
import com.ayham.hanijar.data.models.Room

class RoomAdapter(private val onRoomClick: (Room) -> Unit) :
    ListAdapter<Room, RoomAdapter.RoomViewHolder>(RoomDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RoomViewHolder {
        val binding = ItemRoomBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return RoomViewHolder(binding, onRoomClick)
    }

    override fun onBindViewHolder(holder: RoomViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class RoomViewHolder(
        private val binding: ItemRoomBinding,
        private val onRoomClick: (Room) -> Unit
    ) : RecyclerView.ViewHolder(binding.root) {
        fun bind(room: Room) {
            binding.roomName.text = room.name
            binding.usersCount.text = "${room.users.size} مستخدم"
            binding.root.setOnClickListener { onRoomClick(room) }
        }
    }

    class RoomDiffCallback : DiffUtil.ItemCallback<Room>() {
        override fun areItemsTheSame(oldItem: Room, newItem: Room): Boolean {
            return oldItem.roomId == newItem.roomId
        }

        override fun areContentsTheSame(oldItem: Room, newItem: Room): Boolean {
            return oldItem == newItem
        }
    }
}
