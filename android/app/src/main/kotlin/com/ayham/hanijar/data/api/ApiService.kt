package com.ayham.hanijar.data.api

import com.ayham.hanijar.data.models.*
import retrofit2.http.*

interface ApiService {
    // Auth
    @POST("/api/register")
    suspend fun register(@Body request: RegisterRequest): AuthResponse

    @POST("/api/login")
    suspend fun login(@Body request: LoginRequest): AuthResponse

    // Profile
    @GET("/api/profile")
    suspend fun getProfile(@Header("Authorization") token: String): User

    @PUT("/api/profile/update")
    suspend fun updateProfile(
        @Header("Authorization") token: String,
        @Body body: Map<String, String>
    ): Map<String, Any>

    // Rooms
    @GET("/api/rooms")
    suspend fun getRooms(): List<Room>

    @POST("/api/create-room")
    suspend fun createRoom(
        @Header("Authorization") token: String,
        @Body request: CreateRoomRequest
    ): RoomResponse

    @GET("/api/room-support/{room_id}")
    suspend fun getRoomSupport(@Path("room_id") roomId: Int): Map<String, Any>

    // Gifts
    @GET("/api/gifts")
    suspend fun getGifts(): List<Gift>

    @POST("/api/send-gift")
    suspend fun sendGift(
        @Header("Authorization") token: String,
        @Body request: SendGiftRequest
    ): GiftResponse
}
