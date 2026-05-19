package com.ayham.hanijar.data.models

import com.google.gson.annotations.SerializedName

data class User(
    @SerializedName("user_id")
    val userId: Int,
    val username: String,
    val lastName: String,
    val email: String,
    val country: String,
    val age: Int,
    val gender: String,
    val coins: Int,
    val diamonds: Int,
    @SerializedName("vip_level")
    val vipLevel: Int,
    @SerializedName("supportPoints")
    val supportPoints: Int,
    val avatarUrl: String,
    val coverUrl: String,
    @SerializedName("createdAt")
    val createdAt: String
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val username: String,
    val lastName: String,
    val email: String,
    val password: String,
    val country: String,
    val birthDate: String,
    val age: Int,
    val gender: String
)

data class AuthResponse(
    val success: Boolean,
    val token: String,
    val user: User
)