from django.shortcuts import render
from rest_framework import generics, permissions, parsers, status, viewsets
from rest_framework.decorators import action
from .models import User
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.response import Response
from FashionStore import serializers, perms, paginators


# Create your views here.
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = serializers.UserSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = [parsers.MultiPartParser]


class LoginView(TokenObtainPairView):
    serializer_class = serializers.LoginSerializer


class LogoutView(generics.GenericAPIView):
    serializer_class = serializers.LogoutSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({"detail": "Logout successful."}, status=status.HTTP_200_OK)


class ProfileViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=["get", "patch"], url_path="profile")
    def profile(self, request):

        if request.method.__eq__("GET"):
            serializer = serializers.ProfileSerializer(request.user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        serializer = serializers.ProfileSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            serializers.ProfileSerializer(request.user).data, status=status.HTTP_200_OK
        )

    @action(detail=False, methods=["patch"], url_path="change-password")
    def change_password(self, request):
        serializer = serializers.ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["newPassword"])
        request.user.save()

        return Response(
            {"message": "Password changed successfully."}, status=status.HTTP_200_OK
        )


class UserViewSet(viewsets.ViewSet):
    permission_classes = [perms.Isadmin]

    def list(self, request):
        users = User.objects.filter(role=User.Role.CUSTOMER)
        p = paginators.UserPagination()
        page = p.paginate_queryset(users, request)
        if page is not None:
            serializer = serializers.UserSerializer(page, many=True)
            return p.get_paginated_response(serializer.data)
        serializer = serializers.UserSerializer(users, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def retrieve(self, request, pk=None):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND
            )
        s = serializers.UserSerializer(user)
        return Response(s.data, status=status.HTTP_200_OK)

    @action(methods=["patch"], detail=True, url_path="active")
    def active(self, request, pk=None):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = serializers.UserActiveSerializer(
            user, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)


class StaffViewset(viewsets.ViewSet):
    permission_classes = [perms.Isadmin]

    def create(self, resquest):
        serializer = serializers.StaffSerializer(data=resquest.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def list(self, request):
        users = User.objects.filter(role=User.Role.STAFF)
        p = paginators.UserPagination()
        page = p.paginate_queryset(users, request)
        if page is not None:
            serializer = serializers.StaffSerializer(page, many=True)
            return p.get_paginated_response(serializer.data)
        serializer = serializers.StaffSerializer(users, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=["get"], detail=False, url_path="pending")
    def pending(self, request):
        staffs = User.objects.filter(role=User.Role.STAFF, is_approved=False)
        serializer = serializers.StaffSerializer(staffs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=["patch"], detail=True, url_path="reject")
    def approve(self, request, pk):
        try:
            staff = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "Staff not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = serializers.UserActiveSerializer(staff, data=request.data, partial=True, context={"request": request})
        staff.is_approved = False
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)



