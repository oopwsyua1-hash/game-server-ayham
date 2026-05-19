package com.ayham.hanijar.data.models

import com.google.gson.annotations.SerializedName

data class Room(
    @SerializedName("room_id")
    val roomId: Int,
    @SerializedName("owner_id")
    val ownerId: Int,
    val name: String,
    val users: List<Int>,
    val mics: List<Int?>,
    @SerializedName("top_gifts_today")
    val topGiftsToday: Int,
    @SerializedName("createdAt")
    val createdAt: String
)

data class CreateRoomRequest(
    val name: String
)

data class RoomResponse(
    val success: Boolean,
    val room: Room
)

data class RoomListResponse(
    val data: List<Room>
)