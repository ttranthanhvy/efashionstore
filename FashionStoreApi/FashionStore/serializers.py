from rest_framework import serializers
from FashionStore.models import User, TokenBlacklist
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import (RefreshToken,AccessToken)
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import password_validation
from datetime import datetime, timezone


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "avatar",
            "password",
        ]
        extra_kwargs = {
            "password": {"write_only": True},
        }

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        user.role = User.Role.CUSTOMER
        user.save(update_fields=["role"])
        return user

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.avatar:
            data["avatar"] = instance.avatar.url
        return data


class LoginSerializer(TokenObtainPairSerializer):
    username = serializers.CharField(required=True, allow_blank=False)
    password = serializers.CharField(required=True, allow_blank=False, write_only=True)

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        if user.role == user.Role.STAFF and not user.is_approved:
            raise serializers.ValidationError("Your account is not approved.")

        data["user"] = {
            "id": user.id,
            "username": user.username,
            "role": user.role,
        }
        return data


class LogoutSerializer(serializers.Serializer):
    access = serializers.CharField()

    def validate(self, attrs):
        try:
            token = AccessToken(attrs["access"])
            jti = token["jti"]
            user_id = token["user_id"]
            exp = token["exp"]
            expires_at = datetime.fromtimestamp(exp, tz=timezone.utc)
            TokenBlacklist.objects.get_or_create(
                jti=jti,
                defaults={
                    "user_id": user_id,
                    "expires_at": expires_at,
                },
            )
        except Exception as e:
            print("LOGOUT ERROR:", repr(e))
            raise serializers.ValidationError({"access": "Invalid access token."})

        return attrs


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email", "avatar"]


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email", "avatar"]

    def validate_avatar(self, value):
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Avatar size must not exceed 5MB.")
        return value


class ChangePasswordSerializer(serializers.Serializer):
    oldPassword = serializers.CharField(write_only=True, required=True)

    newPassword = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        user = self.context["request"].user
        old_password = attrs["oldPassword"]
        new_password = attrs["newPassword"]

        if not old_password.strip():
            raise serializers.ValidationError(
                {"oldPassword": "Old password cannot be empty."}
            )
        if not new_password.strip():
            raise serializers.ValidationError(
                {"newPassword": "New password cannot be empty."}
            )
        if not user.check_password(old_password):
            raise serializers.ValidationError(
                {"oldPassword": "Old password is incorrect."}
            )
        if old_password == new_password:
            raise serializers.ValidationError(
                {"newPassword": "New password must different from old password."}
            )
        password_validation.validate_password(new_password, user)

        return attrs
