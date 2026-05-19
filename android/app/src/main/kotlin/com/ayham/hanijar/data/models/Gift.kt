package com.ayham.hanijar.data.models

import com.google.gson.annotations.SerializedName

data class Gift(
    val giftId: String,
    val name: String,
    val price: Int,
    val animation: String,
    val svgaUrl: String,
    val category: String,
    val vipOnly: Boolean,
    val isHot: Boolean
)

data class SendGiftRequest(
    @SerializedName("receiver_id")
    val receiverId: Int,
    val giftId: String,
    @SerializedName("room_id")
    val roomId: Int
)

data class GiftResponse(
    val success: Boolean,
    val newBalance: Int,
    val receiver: User
)