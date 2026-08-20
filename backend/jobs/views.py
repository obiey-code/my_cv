import os
from pathlib import Path
from django.conf import settings
from rest_framework import status, permissions, generics
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import JobOffer, ApplicationPackage
from .serializers import JobOfferSerializer, ApplicationPackageSerializer
from profile_manager.models import Profile
from subscriptions.models import UserSubscription
from ai_engine.service import AIEngineService

def check_resultat_folder_overrides(package, user):
    """
    If Jules has placed generated application deliverables in /resultat/<USER_ID>/<SITE>/<POSTE>/,
    override package deliverable URLs accordingly for paid users.
    Calculate processing_status in real-time:
    - 'finalized' if deliverables (CV/LM) are ready
    - 'inprocess' if payment is approved but deliverables are building
    - 'pending' if payment is pending
    """
    base_dir = Path(settings.BASE_DIR).parent if hasattr(settings, 'BASE_DIR') else Path.cwd()
    res_dir = base_dir / "resultat" / str(user.id)

    if package.payment_status == 'approuved' and res_dir.exists():
        for site_dir in res_dir.iterdir():
            if site_dir.is_dir():
                for poste_dir in site_dir.iterdir():
                    if poste_dir.is_dir():
                        for f in poste_dir.iterdir():
                            fname = f.name.upper()
                            if "-CV.PDF" in fname:
                                package.cv_pdf = f"/media/resultat/{user.id}/{site_dir.name}/{poste_dir.name}/{f.name}"
                            elif "-LM.PDF" in fname:
                                package.cover_letter_pdf = f"/media/resultat/{user.id}/{site_dir.name}/{poste_dir.name}/{f.name}"
                            elif "-EMAIL.TXT" in fname:
                                package.email_txt = f"/media/resultat/{user.id}/{site_dir.name}/{poste_dir.name}/{f.name}"
                            elif "-OFFRE.PDF" in fname:
                                package.offer_pdf = f"/media/resultat/{user.id}/{site_dir.name}/{poste_dir.name}/{f.name}"

    # Real-time processing status evaluation
    if package.cv_pdf and package.cover_letter_pdf:
        package.processing_status = 'finalized'
    elif package.payment_status == 'approuved':
        package.processing_status = 'inprocess'
    else:
        package.processing_status = 'pending'

    package.save(update_fields=['processing_status'])
    return package


class JobOfferListCreateView(generics.ListCreateAPIView):
    serializer_class = JobOfferSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        return JobOffer.objects.filter(user=self.request.user).order_by('-created_at')

    def create(self, request, *args, **kwargs):
        sub, _ = UserSubscription.objects.get_or_create(user=request.user)
        if sub.credits_remaining <= 0:
            return Response({"error": "Crédits insuffisants. Veuillez souscrire à un forfait d'abonnement."}, status=status.HTTP_402_PAYMENT_REQUIRED)

        raw_text = request.data.get('raw_text', '')
        source_url = request.data.get('source_url', '')

        extracted = AIEngineService.extract_job_details(raw_text, source_url)

        job_offer = JobOffer.objects.create(
            user=request.user,
            source_type=request.data.get('source_type', 'TEXT'),
            source_url=source_url,
            raw_text=raw_text,
            title=request.data.get('title') or extracted['title'],
            company=request.data.get('company') or extracted['company'],
            site_category=extracted['site_category'],
            abbreviation=extracted['abbreviation'],
            cleaned_description=extracted['cleaned_description']
        )

        profile, _ = Profile.objects.get_or_create(user=request.user)

        pkg_data = AIEngineService.generate_custom_application(profile, job_offer)

        package = ApplicationPackage.objects.create(
            user=request.user,
            job_offer=job_offer,
            cv_pdf=pkg_data['cv_pdf'],
            cover_letter_pdf=pkg_data['cover_letter_pdf'],
            email_txt=pkg_data['email_txt'],
            offer_pdf=pkg_data['offer_pdf'],
            zip_package=pkg_data['zip_package'],
            email_subject=pkg_data['email_subject'],
            email_body=pkg_data['email_body'],
            folder_path=pkg_data['folder_path']
        )

        sub.credits_remaining = max(0, sub.credits_remaining - 1)
        sub.save()

        package = check_resultat_folder_overrides(package, request.user)

        return Response({
            'job_offer': JobOfferSerializer(job_offer).data,
            'package': ApplicationPackageSerializer(package).data,
            'credits_remaining': sub.credits_remaining
        }, status=status.HTTP_201_CREATED)


class ApplicationPackageListView(generics.ListAPIView):
    serializer_class = ApplicationPackageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        pkgs = ApplicationPackage.objects.filter(user=self.request.user).order_by('-created_at')
        return [check_resultat_folder_overrides(pkg, self.request.user) for pkg in pkgs]
