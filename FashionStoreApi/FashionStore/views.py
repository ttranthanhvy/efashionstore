from django.shortcuts import render
from rest_framework import generics, permissions, parsers, status, viewsets
from rest_framework.decorators import action
from .models import User
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    LogoutSerializer,
    ProfileSerializer,
    ProfileUpdateSerializer,
    ChangePasswordSerializer
)
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.response import Response


# Create your views here.
class RegisterView(generics.CreateAPIView):

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = [parsers.MultiPartParser]


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer


class LogoutView(generics.GenericAPIView):
    serializer_class = LogoutSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response({"detail": "Logout successful."}, status=status.HTTP_200_OK)

class ProfileViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=["get", "patch"], url_path="profile")
    def profile(self, request):

        if request.method == "GET":
            serializer = ProfileSerializer(request.user)

            return Response(serializer.data, status=status.HTTP_200_OK)

        serializer = ProfileUpdateSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(ProfileSerializer(request.user).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["patch"], url_path="change-password")
    def change_password(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )

        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["newPassword"])
        request.user.save()

        return Response(
            {"message": "Password changed successfully."}, status=status.HTTP_200_OK
        )
