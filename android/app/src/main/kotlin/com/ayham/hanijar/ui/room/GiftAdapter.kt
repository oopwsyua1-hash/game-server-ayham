package com.ayham.hanijar.ui.room

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.ayham.hanijar.databinding.ItemGiftBinding
import com.ayham.hanijar.data.models.Gift
import com.bumptech.glide.Glide

class GiftAdapter(private val onGiftClick: (Gift) -> Unit) :
    ListAdapter<Gift, GiftAdapter.GiftViewHolder>(GiftDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): GiftViewHolder {
        val binding = ItemGiftBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return GiftViewHolder(binding, onGiftClick)
    }

    override fun onBindViewHolder(holder: GiftViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class GiftViewHolder(
        private val binding: ItemGiftBinding,
        private val onGiftClick: (Gift) -> Unit
    ) : RecyclerView.ViewHolder(binding.root) {
        fun bind(gift: Gift) {
            binding.giftName.text = gift.name
            binding.giftPrice.text = "${gift.price} عملة"
            Glide.with(binding.root.context)
                .load(gift.animation)
                .into(binding.giftImage)
            binding.root.setOnClickListener { onGiftClick(gift) }
        }
    }

    class GiftDiffCallback : DiffUtil.ItemCallback<Gift>() {
        override fun areItemsTheSame(oldItem: Gift, newItem: Gift): Boolean {
            return oldItem.giftId == newItem.giftId
        }

        override fun areContentsTheSame(oldItem: Gift, newItem: Gift): Boolean {
            return oldItem == newItem
        }
    }
}
