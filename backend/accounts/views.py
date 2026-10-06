from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie

from .serializers import RegisterSerializer, UserSerializer


User = get_user_model()


def custom_exception_handler(exc, context):
    from rest_framework.views import exception_handler

    response = exception_handler(exc, context)
    if response is not None:
        return Response({
            "error": response.data,
            "status_code": response.status_code,
        }, status=response.status_code)
    return response


@method_decorator(ensure_csrf_cookie, name="dispatch")
class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        login(request, user)
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        identifier = str(request.data.get("username") or request.data.get("email") or "").strip()
        password = request.data.get("password") or ""
        if not identifier or not password:
            return Response(
                {"error": {"credentials": ["Username and password are required."]}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        login_identifier = identifier
        if "@" in identifier and not User.objects.filter(username__iexact=identifier).exists():
            match = User.objects.filter(email__iexact=identifier).only("username").first()
            login_identifier = match.username if match else identifier

        user = authenticate(request, username=login_identifier, password=password)
        if user is None:
            return Response(
                {"error": {"credentials": ["Incorrect username or password."]}},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if not user.is_active:
            return Response(
                {"error": {"credentials": ["This account is inactive."]}},
                status=status.HTTP_403_FORBIDDEN,
            )
        login(request, user)
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class MeView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if not request.user.is_authenticated:
            return Response({"error": {"credentials": ["Not authenticated."]}}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(UserSerializer(request.user).data)
