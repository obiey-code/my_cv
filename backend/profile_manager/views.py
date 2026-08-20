from PIL import Image
from django.core.files.base import ContentFile
from io import BytesIO
from rest_framework import status, permissions, generics, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Profile, UserProfileInfo, Experience, Certification, Education, Project
from .serializers import (
    ProfileSerializer, UserProfileInfoSerializer,
    ExperienceSerializer, CertificationSerializer,
    EducationSerializer, ProjectSerializer
)
from .gdrive_service import GoogleDriveService
from .commandes_service import CommandesSyncService


class ProfileDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, created = Profile.objects.get_or_create(user=self.request.user)
        CommandesSyncService.sync_user_commandes(self.request.user)
        return profile


class PhotoCropView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def delete(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        if profile.cropped_photo:
            profile.cropped_photo.delete(save=False)
            profile.cropped_photo = None
        if profile.original_photo:
            profile.original_photo.delete(save=False)
            profile.original_photo = None
        profile.save()
        CommandesSyncService.sync_user_commandes(request.user)
        return Response(ProfileSerializer(profile).data, status=status.HTTP_200_OK)

    def post(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)

        if 'photo' in request.FILES:
            photo_file = request.FILES['photo']
            profile.original_photo = photo_file
            profile.save()
            img = Image.open(photo_file)
        elif profile.original_photo:
            img = Image.open(profile.original_photo.path)
        else:
            return Response({"error": "Aucune photo fournie ou enregistrée."}, status=status.HTTP_400_BAD_REQUEST)

        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')

        width, height = img.size
        min_dim = min(width, height)
        left = (width - min_dim) / 2
        top = (height - min_dim) / 2
        right = (width + min_dim) / 2
        bottom = (height + min_dim) / 2

        img_cropped = img.crop((left, top, right, bottom))
        img_cropped = img_cropped.resize((600, 600), Image.Resampling.LANCZOS)

        buffer = BytesIO()
        img_cropped.save(buffer, format='PNG')
        file_name = f"profile_cropped_{request.user.id}.png"

        profile.cropped_photo.save(file_name, ContentFile(buffer.getvalue()), save=True)
        CommandesSyncService.sync_user_commandes(request.user)

        return Response(ProfileSerializer(profile).data, status=status.HTTP_200_OK)


class UserProfileInfoView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileInfoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        user = self.request.user
        info, created = UserProfileInfo.objects.get_or_create(
            user=user,
            defaults={
                'first_name': user.first_name or 'Christ Dany',
                'last_name': user.last_name or 'Obiey',
                'primary_phone': '+242 06 613 01 18',
                'professional_summary': 'Consultant IT & Expert Fullstack.'
            }
        )
        return info

    def perform_update(self, serializer):
        serializer.save()
        CommandesSyncService.sync_user_commandes(self.request.user)


class ExperienceViewSet(viewsets.ModelViewSet):
    serializer_class = ExperienceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Experience.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        CommandesSyncService.sync_user_commandes(self.request.user)

    def perform_update(self, serializer):
        serializer.save()
        CommandesSyncService.sync_user_commandes(self.request.user)


class CertificationViewSet(viewsets.ModelViewSet):
    serializer_class = CertificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Certification.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        cert = serializer.save(user=self.request.user)
        if 'pdf_file' in self.request.FILES:
            file_obj = self.request.FILES['pdf_file']
            drive_url = GoogleDriveService.upload_pdf_file(file_obj, "certifications")
            if drive_url:
                cert.pdf_url = drive_url
                cert.save()
        CommandesSyncService.sync_user_commandes(self.request.user)

    def perform_update(self, serializer):
        cert = serializer.save()
        if 'pdf_file' in self.request.FILES:
            file_obj = self.request.FILES['pdf_file']
            drive_url = GoogleDriveService.upload_pdf_file(file_obj, "certifications")
            if drive_url:
                cert.pdf_url = drive_url
                cert.save()
        CommandesSyncService.sync_user_commandes(self.request.user)


class EducationViewSet(viewsets.ModelViewSet):
    serializer_class = EducationSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Education.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        edu = serializer.save(user=self.request.user)
        if 'pdf_file' in self.request.FILES:
            file_obj = self.request.FILES['pdf_file']
            drive_url = GoogleDriveService.upload_pdf_file(file_obj, "educations")
            if drive_url:
                edu.pdf_url = drive_url
                edu.save()
        CommandesSyncService.sync_user_commandes(self.request.user)

    def perform_update(self, serializer):
        edu = serializer.save()
        if 'pdf_file' in self.request.FILES:
            file_obj = self.request.FILES['pdf_file']
            drive_url = GoogleDriveService.upload_pdf_file(file_obj, "educations")
            if drive_url:
                edu.pdf_url = drive_url
                edu.save()
        CommandesSyncService.sync_user_commandes(self.request.user)


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        CommandesSyncService.sync_user_commandes(self.request.user)

    def perform_update(self, serializer):
        serializer.save()
        CommandesSyncService.sync_user_commandes(self.request.user)
