import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Briefcase, FileText, User, CreditCard, Upload, Download,
  Sparkles, ShieldCheck, Phone, Mail, MapPin,
  Eye, RefreshCw, LogOut, AlertCircle,
  Plus, Trash2, Edit, Award, GraduationCap, FolderGit2, Check, Camera, X,
  MoreVertical, FileUp, Image as ImageIcon, Calendar, Maximize2, Minimize2
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname.includes('onrender.com')
    ? 'https://luka-mosala-backend.onrender.com'
    : ''
);

axios.defaults.baseURL = API_BASE_URL;

interface ProfileData {
  title: string;
  phone: string;
  cities: string;
  readme_content: string;
  cropped_photo: string | null;
  original_photo: string | null;
}

interface UserInfo {
  first_name: string;
  last_name: string;
  gender: string;
  birth_date: string | null;
  primary_phone: string;
  secondary_phone: string;
  professional_summary: string;
  address: string;
  country: string;
  district: string;
  neighborhood: string;
}

interface Experience {
  id?: number;
  title: string;
  company: string;
  industry: string;
  location: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  skills_acquired: string;
}

interface Certification {
  id?: number;
  title: string;
  year: number;
  institution: string;
  location: string;
  start_date: string | null;
  end_date: string | null;
  description: string;
  pdf_url: string;
}

interface Education {
  id?: number;
  title: string;
  year: number;
  institution: string;
  degree_level: string;
  field_of_study: string;
  location: string;
  start_date: string | null;
  end_date: string | null;
  description: string;
  skills_acquired: string;
  pdf_url: string;
}

interface Project {
  id?: number;
  name: string;
  industry: string;
  beneficiary: string;
  link_url: string;
  description: string;
}

interface ApplicationPackage {
  id: number;
  job_offer: {
    title: string;
    company: string;
    site_category: string;
    abbreviation: string;
  };
  cv_pdf: string;
  cover_letter_pdf: string;
  email_txt: string;
  zip_package: string;
  payment_status: 'approuved' | 'pending' | 'failed';
  processing_status: 'finalized' | 'pending' | 'inprocess';
  created_at: string;
}

interface SubscriptionPlan {
  id: number;
  name: string;
  price_fcfa: number;
  applications_limit: number;
  duration_days: number;
  description: string;
}

interface SubscriptionData {
  credits_remaining: number;
  plan: {
    name: string;
  } | null;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'create' | 'plans'>('dashboard');
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin1234');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [profile, setProfile] = useState<ProfileData>({
    title: 'Consultant IT & Expert Fullstack',
    phone: '+242 06 613 01 18',
    cities: 'Brazzaville & Pointe-Noire, Congo',
    readme_content: '',
    cropped_photo: null,
    original_photo: null
  });

  const [userInfo, setUserInfo] = useState<UserInfo>({
    first_name: 'Christ Dany',
    last_name: 'Obiey',
    gender: 'MALE',
    birth_date: '1995-05-10',
    primary_phone: '+242 06 613 01 18',
    secondary_phone: '',
    professional_summary: 'Consultant IT & Expert Fullstack.',
    address: 'Avenue de l\'Indépendance',
    country: 'Congo',
    district: 'Poto-Poto',
    neighborhood: 'Centre'
  });

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);

  // Selected Package Modal State (Preview Modal)
  const [activePkgModal, setActivePkgModal] = useState<{ pkg: ApplicationPackage; type: 'CV' | 'LM' | 'EMAIL' } | null>(null);

  // Single Photo Contextual Menu Dropdown
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [showPhotoView, setShowPhotoView] = useState(false);

  // Modal Full Screen Toggles
  const [modalFullScreen, setModalFullScreen] = useState(false);

  // Modals / Form States
  const [showExpModal, setShowExpModal] = useState(false);
  const [expForm, setExpForm] = useState<Experience>({
    title: '', company: '', industry: 'Informatique', location: '',
    start_date: '2024-01-01', end_date: '', is_current: false, skills_acquired: ''
  });

  const [showCertModal, setShowCertModal] = useState(false);
  const [certForm, setCertForm] = useState<Certification>({
    title: '', year: 2025, institution: '', location: '',
    start_date: '2024-01-01', end_date: '2025-01-01', description: '', pdf_url: ''
  });
  const [certFile, setCertFile] = useState<File | null>(null);

  const [showEduModal, setShowEduModal] = useState(false);
  const [eduForm, setEduForm] = useState<Education>({
    title: '', year: 2024, institution: '', degree_level: 'Licence',
    field_of_study: '', location: '', start_date: '2020-10-01', end_date: '2024-06-30', description: '', skills_acquired: '', pdf_url: ''
  });
  const [eduFile, setEduFile] = useState<File | null>(null);

  const [showProjModal, setShowProjModal] = useState(false);
  const [projForm, setProjForm] = useState<Project>({
    name: '', industry: 'Informatique', beneficiary: '', link_url: '', description: ''
  });

  // Generate view inputs
  const [jobText, setJobText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [uploadedDocument, setUploadedDocument] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [packages, setPackages] = useState<ApplicationPackage[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionData>({ credits_remaining: 1, plan: null });

  const [selectedPlan, setSelectedPlan] = useState<number>(2);
  const [paymentMethod, setPaymentMethod] = useState<'AIRTEL_MONEY' | 'MTN_MOMO' | 'PAYDUNYA'>('AIRTEL_MONEY');
  const [phoneNumber, setPhoneNumber] = useState('+242066130118');
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchData();
    }
  }, [token, activeTab]);

  // Smart Client-side Cache Management to prevent redundant API calls
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const fetchData = async (forceRefresh = false) => {
    const now = Date.now();
    // Use cached state if fetched within last 15 seconds unless forced
    if (!forceRefresh && lastFetchTime && (now - lastFetchTime < 15000)) {
      return;
    }

    try {
      const [profRes, infoRes, subRes, pkgsRes, expRes, certRes, eduRes, projRes, plansRes] = await Promise.all([
        axios.get('/api/profile/'),
        axios.get('/api/profile/info/'),
        axios.get('/api/subscriptions/me/'),
        axios.get('/api/jobs/packages/'),
        axios.get('/api/profile/experiences/'),
        axios.get('/api/profile/certifications/'),
        axios.get('/api/profile/educations/'),
        axios.get('/api/profile/projects/'),
        axios.get('/api/subscriptions/plans/')
      ]);
      setProfile(profRes.data);
      if (infoRes.data) setUserInfo(infoRes.data);
      setSubscription(subRes.data);
      setPackages(pkgsRes.data);
      setExperiences(expRes.data);
      setCertifications(certRes.data);
      setEducations(eduRes.data);
      setProjects(projRes.data);
      if (plansRes.data && plansRes.data.length > 0) {
        setAvailablePlans(plansRes.data);
        setSelectedPlan(plansRes.data[0].id);
      }
      setLastFetchTime(now);
    } catch (e) {
      console.error("Error fetching data:", e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await axios.post('/api/auth/login/', { username, password });
      const accessToken = res.data.access;
      setToken(accessToken);
      localStorage.setItem('token', accessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      await fetchData();
    } catch (e: any) {
      try {
        const regRes = await axios.post('/api/auth/register/', {
          username,
          password,
          email: `${username}@lukamosala.cg`,
          first_name: username === 'admin' ? 'Admin' : 'Utilisateur',
          last_name: 'Luka Mosala'
        });
        const accessToken = regRes.data.access;
        setToken(accessToken);
        localStorage.setItem('token', accessToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        await fetchData();
      } catch (err: any) {
        setAuthError("Identifiants incorrects ou serveur indisponible.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await axios.post('/api/profile/crop-photo/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile(res.data);
      setShowPhotoMenu(false);
      alert("Photo de profil mise à jour !");
    } catch (e) {
      alert("Erreur lors du téléchargement de la photo.");
    }
  };

  const handlePhotoDelete = async () => {
    if (confirm("Supprimer la photo de profil ?")) {
      try {
        const res = await axios.delete('/api/profile/crop-photo/');
        setProfile(res.data);
        setShowPhotoMenu(false);
        alert("Photo de profil supprimée !");
      } catch (e) {
        alert("Erreur lors de la suppression de la photo.");
      }
    }
  };

  const handleSaveInfo = async () => {
    try {
      await axios.patch('/api/profile/info/', userInfo);
      alert("Informations enregistrées avec succès !");
    } catch (e) {
      alert("Erreur lors de l'enregistrement des informations.");
    }
  };

  const handleSaveExperience = async () => {
    try {
      if (expForm.id) {
        await axios.put(`/api/profile/experiences/${expForm.id}/`, expForm);
      } else {
        await axios.post('/api/profile/experiences/', expForm);
      }
      setShowExpModal(false);
      await fetchData();
    } catch (e) {
      alert("Erreur lors de la sauvegarde de l'expérience.");
    }
  };

  const handleDeleteExperience = async (id: number) => {
    if (confirm("Supprimer cette expérience ?")) {
      await axios.delete(`/api/profile/experiences/${id}/`);
      await fetchData();
    }
  };

  const handleSaveCertification = async () => {
    try {
      const formData = new FormData();
      Object.keys(certForm).forEach(key => {
        const val = (certForm as any)[key];
        if (val !== null && val !== undefined) formData.append(key, val);
      });
      if (certFile) formData.append('pdf_file', certFile);

      if (certForm.id) {
        await axios.put(`/api/profile/certifications/${certForm.id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post('/api/profile/certifications/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setShowCertModal(false);
      setCertFile(null);
      await fetchData();
    } catch (e) {
      alert("Erreur lors de la sauvegarde du certificat.");
    }
  };

  const handleDeleteCertification = async (id: number) => {
    if (confirm("Supprimer ce certificat ?")) {
      await axios.delete(`/api/profile/certifications/${id}/`);
      await fetchData();
    }
  };

  const handleSaveEducation = async () => {
    try {
      const formData = new FormData();
      Object.keys(eduForm).forEach(key => {
        const val = (eduForm as any)[key];
        if (val !== null && val !== undefined) formData.append(key, val);
      });
      if (eduFile) formData.append('pdf_file', eduFile);

      if (eduForm.id) {
        await axios.put(`/api/profile/educations/${eduForm.id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post('/api/profile/educations/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setShowEduModal(false);
      setEduFile(null);
      await fetchData();
    } catch (e) {
      alert("Erreur lors de la sauvegarde du diplôme.");
    }
  };

  const handleDeleteEducation = async (id: number) => {
    if (confirm("Supprimer ce diplôme ?")) {
      await axios.delete(`/api/profile/educations/${id}/`);
      await fetchData();
    }
  };

  const handleSaveProject = async () => {
    try {
      if (projForm.id) {
        await axios.put(`/api/profile/projects/${projForm.id}/`, projForm);
      } else {
        await axios.post('/api/profile/projects/', projForm);
      }
      setShowProjModal(false);
      await fetchData();
    } catch (e) {
      alert("Erreur lors de la sauvegarde du projet.");
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (confirm("Supprimer ce projet ?")) {
      await axios.delete(`/api/profile/projects/${id}/`);
      await fetchData();
    }
  };

  const handleGenerateApplication = async () => {
    if (!jobText && !sourceUrl && !uploadedDocument) {
      alert("Veuillez fournir une URL, coller un texte ou télécharger un document (PDF/Image).");
      return;
    }
    setIsGenerating(true);
    try {
      if (uploadedDocument) {
        const formData = new FormData();
        formData.append('document', uploadedDocument);
        formData.append('source_type', 'FILE');
        if (jobText) formData.append('raw_text', jobText);
        await axios.post('/api/jobs/offers/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post('/api/jobs/offers/', {
          source_type: sourceUrl ? 'URL' : 'TEXT',
          source_url: sourceUrl,
          raw_text: jobText
        });
      }
      setJobText('');
      setSourceUrl('');
      setUploadedDocument(null);
      await fetchData();
      setActiveTab('dashboard');
      alert("Candidature sur mesure générée avec succès !");
    } catch (e: any) {
      alert(e?.response?.data?.error || "Erreur lors de la génération de la candidature.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePayment = async () => {
    setPaymentSuccessMsg(null);
    try {
      await axios.post('/api/subscriptions/pay/', {
        plan_id: selectedPlan,
        payment_method: paymentMethod,
        phone_number: phoneNumber
      });
      setPaymentSuccessMsg(`Paiement réussi via ${paymentMethod} ! Vos crédits ont été rechargés.`);
      await fetchData();
    } catch (e: any) {
      alert("Échec de la transaction Fintech Mobile Money.");
    }
  };

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0A192F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
        <div style={{ width: '100%', maxWidth: '440px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', backgroundColor: '#185FA5', borderRadius: '14px', marginBottom: '12px' }}>
              <Briefcase style={{ width: '30px', height: '30px', color: '#ffffff' }} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0B1F3A', margin: 0 }}>AI JobApply SaaS</h1>
            <p style={{ fontSize: '13px', color: '#444441', fontWeight: '600', marginTop: '6px' }}>
              Générateur automatique de dossiers de candidature sur mesure (CV 1P & LM 1P).
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {authError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', color: '#991b1b', fontSize: '13px', fontWeight: '600' }}>
                <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#0B1F3A', marginBottom: '6px' }}>Nom d'utilisateur</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} style={{ width: '100%', padding: '12px', border: '2px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', fontWeight: '700', color: '#0B1F3A', boxSizing: 'border-box' }} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#0B1F3A', marginBottom: '6px' }}>Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '12px', border: '2px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', fontWeight: '700', color: '#0B1F3A', boxSizing: 'border-box' }} required />
            </div>

            <button type="submit" disabled={authLoading} style={{ width: '100%', backgroundColor: '#185FA5', color: '#ffffff', fontWeight: '900', fontSize: '15px', padding: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer', marginTop: '8px' }}>
              {authLoading ? 'Connexion...' : 'Se connecter / S\'inscrire'}
            </button>
          </form>

          <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '10px', fontSize: '12px', color: '#334155', fontWeight: '600', textAlign: 'center' }}>
            💡 Compte de test par défaut : <strong>admin</strong> / <strong>admin1234</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0B1F3A', fontFamily: 'sans-serif', width: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <header style={{ backgroundColor: '#0B1F3A', color: '#ffffff', borderBottom: '1px solid #1e293b', width: '100%' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: '#185FA5', padding: '8px', borderRadius: '10px' }}>
              <Briefcase style={{ width: '20px', height: '20px', color: '#ffffff' }} />
            </div>
            <span style={{ fontWeight: '900', fontSize: '18px', color: '#ffffff' }}>AI JobApply SaaS</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '6px 12px', borderRadius: '20px' }}>
              <Sparkles style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#ffffff' }}>{subscription.credits_remaining} Crédit(s)</span>
            </div>
            <button onClick={() => { setToken(null); localStorage.removeItem('token'); }} style={{ backgroundColor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#ffffff', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
              <LogOut style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        </div>
      </header>

      {/* Fully Responsive Navigation Bar with Overflow Scrolling */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', width: '100%', overflowX: 'auto' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px', display: 'flex', gap: '16px', whiteSpace: 'nowrap', minWidth: 'max-content', boxSizing: 'border-box' }}>
          {[
            { id: 'dashboard', label: 'Mes Candidatures', icon: Briefcase },
            { id: 'create', label: 'Générer un Dossier', icon: Sparkles },
            { id: 'profile', label: 'Profil Utilisateur', icon: User },
            { id: 'plans', label: 'Formules d\'Abonnement', icon: CreditCard },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); fetchData(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 0', border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid #185FA5' : '3px solid transparent',
                backgroundColor: 'transparent', color: activeTab === tab.id ? '#185FA5' : '#64748b',
                fontWeight: activeTab === tab.id ? '900' : '700', fontSize: '14px', cursor: 'pointer',
                transition: 'all 0.2s ease', flexShrink: 0
              }}
            >
              <tab.icon style={{ width: '18px', height: '18px' }} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px', boxSizing: 'border-box', width: '100%' }}>
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* PHOTO DE PROFIL WITH SINGLE CONTEXTUAL DROPDOWN BUTTON AND DELETION OPTION */}
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #185FA5', flexShrink: 0 }}>
                  {profile.cropped_photo ? (
                    <img src={profile.cropped_photo} alt="Photo profil" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <Camera style={{ width: '36px', height: '36px', color: '#64748b' }} />
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', margin: 0, color: '#0B1F3A' }}>Photo de Profil Professionnelle</h3>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', margin: 0 }}>Utilisée pour l'agent IA et l'exportation vers votre CV officiel.</p>
                  <span style={{ display: 'inline-block', marginTop: '8px', fontSize: '11px', fontWeight: '800', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px' }}>
                    Ratio & Orientation D'origine Conservés
                  </span>
                </div>
              </div>

              {/* SINGLE CONTEXTUAL ACTION BUTTON WITH DELETE OPTION */}
              <div style={{ position: 'relative' }}>
                <input type="file" accept="image/*" id="photo-input-single" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handlePhotoUpload(e.target.files[0]); }} />
                <button
                  onClick={() => setShowPhotoMenu(!showPhotoMenu)}
                  style={{ backgroundColor: '#185FA5', color: '#ffffff', fontWeight: '800', fontSize: '13px', padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(24, 95, 165, 0.2)' }}
                >
                  <Camera style={{ width: '16px', height: '16px' }} />
                  <span>Actions Photo</span>
                  <MoreVertical style={{ width: '16px', height: '16px' }} />
                </button>

                {showPhotoMenu && (
                  <div style={{ position: 'absolute', right: 0, top: '110%', width: '180px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0', zIndex: 50, overflow: 'hidden' }}>
                    <label htmlFor="photo-input-single" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#0B1F3A', cursor: 'pointer', boxSizing: 'border-box' }}>
                      <Edit style={{ width: '15px', height: '15px', color: '#185FA5' }} /> Modifier
                    </label>
                    <label htmlFor="photo-input-single" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#0B1F3A', cursor: 'pointer', borderTop: '1px solid #f1f5f9', boxSizing: 'border-box' }}>
                      <Upload style={{ width: '15px', height: '15px', color: '#0B1F3A' }} /> Uploader
                    </label>
                    <label htmlFor="photo-input-single" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#0B1F3A', cursor: 'pointer', borderTop: '1px solid #f1f5f9', boxSizing: 'border-box' }}>
                      <Camera style={{ width: '15px', height: '15px', color: '#0F6E56' }} /> Caméra
                    </label>
                    <button onClick={() => { setShowPhotoView(true); setShowPhotoMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#0B1F3A', backgroundColor: 'transparent', border: 'none', borderTop: '1px solid #f1f5f9', cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box' }}>
                      <Eye style={{ width: '15px', height: '15px', color: '#64748b' }} /> Voir Photo
                    </button>
                    <button onClick={handlePhotoDelete} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#ef4444', backgroundColor: '#fef2f2', border: 'none', borderTop: '1px solid #fee2e2', cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box' }}>
                      <Trash2 style={{ width: '15px', height: '15px', color: '#ef4444' }} /> Supprimer Photo
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 1. INFORMATIONS GENERALES RESPONSIVE */}
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0B1F3A', margin: 0 }}>1. Informations Générales</h3>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>Organisées en blocs logiques avec sélecteurs interactifs.</p>
                </div>
                <button onClick={handleSaveInfo} style={{ backgroundColor: '#0F6E56', color: '#ffffff', fontWeight: '800', padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                  <Check style={{ width: '16px', height: '16px' }} /> Enregistrer les modifications
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Bloc Identité */}
                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9', boxSizing: 'border-box' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', color: '#185FA5', margin: '0 0 12px' }}>Bloc Identité</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px', color: '#334155' }}>Nom *</label>
                      <input type="text" value={userInfo.last_name} onChange={e => setUserInfo({...userInfo, last_name: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px', color: '#334155' }}>Prénom *</label>
                      <input type="text" value={userInfo.first_name} onChange={e => setUserInfo({...userInfo, first_name: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px', color: '#334155' }}>Genre *</label>
                      <select value={userInfo.gender} onChange={e => setUserInfo({...userInfo, gender: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}>
                        <option value="MALE">Homme</option>
                        <option value="FEMALE">Femme</option>
                        <option value="OTHER">Autre</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px', color: '#334155' }}>Date de naissance *</label>
                      <input type="date" value={userInfo.birth_date || ''} onChange={e => setUserInfo({...userInfo, birth_date: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                </div>

                {/* Bloc Coordonnées */}
                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9', boxSizing: 'border-box' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', color: '#185FA5', margin: '0 0 12px' }}>Bloc Coordonnées & Localisation</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px', color: '#334155' }}>Numéro principal *</label>
                      <input type="text" value={userInfo.primary_phone} onChange={e => setUserInfo({...userInfo, primary_phone: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px', color: '#334155' }}>Numéro secondaire</label>
                      <input type="text" value={userInfo.secondary_phone} onChange={e => setUserInfo({...userInfo, secondary_phone: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px', color: '#334155' }}>Adresse</label>
                      <input type="text" value={userInfo.address} onChange={e => setUserInfo({...userInfo, address: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px', color: '#334155' }}>Pays</label>
                      <input type="text" value={userInfo.country} onChange={e => setUserInfo({...userInfo, country: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. EXPERIENCES PROFESSIONNELLES */}
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0B1F3A', margin: 0 }}>2. Expériences Professionnelles</h3>
                <button onClick={() => { setExpForm({ title: '', company: '', industry: 'Informatique', location: '', start_date: '2024-01-01', end_date: '', is_current: false, skills_acquired: '' }); setModalFullScreen(false); setShowExpModal(true); }} style={{ backgroundColor: '#185FA5', color: '#ffffff', fontWeight: '800', padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                  <Plus style={{ width: '16px', height: '16px' }} /> Ajouter une expérience
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {experiences.map(exp => (
                  <div key={exp.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', backgroundColor: '#fafafa', boxSizing: 'border-box' }}>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: '800', fontSize: '15px', color: '#0B1F3A' }}>{exp.title} - <span style={{ color: '#185FA5' }}>{exp.company}</span></h4>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                        {exp.industry} | {exp.location} | <span style={{ color: '#0F6E56' }}>Début: {exp.start_date}</span> | <span style={{ color: exp.is_current ? '#0F6E56' : '#64748b' }}>Fin: {exp.is_current ? 'Poste Actuel' : (exp.end_date || 'N/A')}</span>
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => { setExpForm(exp); setModalFullScreen(false); setShowExpModal(true); }} style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><Edit style={{ width: '16px', height: '16px', color: '#185FA5' }} /></button>
                      <button onClick={() => handleDeleteExperience(exp.id!)} style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><Trash2 style={{ width: '16px', height: '16px' }} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. CERTIFICATIONS AVEC CALENDRIER POUR LES DATES */}
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0B1F3A', margin: 0 }}>3. Certifications et Attestations</h3>
                <button onClick={() => { setCertForm({ title: '', year: 2025, institution: '', location: '', start_date: '2024-01-01', end_date: '2025-01-01', description: '', pdf_url: '' }); setModalFullScreen(false); setShowCertModal(true); }} style={{ backgroundColor: '#185FA5', color: '#ffffff', fontWeight: '800', padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                  <Plus style={{ width: '16px', height: '16px' }} /> Ajouter un certificat
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {certifications.map(cert => (
                  <div key={cert.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', backgroundColor: '#fafafa', boxSizing: 'border-box' }}>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: '800', fontSize: '15px', color: '#0B1F3A' }}>{cert.title} ({cert.year})</h4>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                        {cert.institution} | {cert.location} | <span style={{ color: '#0F6E56' }}>Du {cert.start_date || 'N/A'} au {cert.end_date || 'N/A'}</span>
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => { setCertForm(cert); setModalFullScreen(false); setShowCertModal(true); }} style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><Edit style={{ width: '16px', height: '16px', color: '#185FA5' }} /></button>
                      <button onClick={() => handleDeleteCertification(cert.id!)} style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><Trash2 style={{ width: '16px', height: '16px' }} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. DIPLOMES AVEC CALENDRIER POUR LES DATES */}
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0B1F3A', margin: 0 }}>4. Diplômes</h3>
                <button onClick={() => { setEduForm({ title: '', year: 2024, institution: '', degree_level: 'Licence', field_of_study: '', location: '', start_date: '2020-10-01', end_date: '2024-06-30', description: '', skills_acquired: '', pdf_url: '' }); setModalFullScreen(false); setShowEduModal(true); }} style={{ backgroundColor: '#185FA5', color: '#ffffff', fontWeight: '800', padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                  <Plus style={{ width: '16px', height: '16px' }} /> Ajouter un diplôme
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {educations.map(edu => (
                  <div key={edu.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', backgroundColor: '#fafafa', boxSizing: 'border-box' }}>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: '800', fontSize: '15px', color: '#0B1F3A' }}>{edu.title} - {edu.degree_level} ({edu.year})</h4>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                        {edu.institution} | <span style={{ color: '#0F6E56' }}>Du {edu.start_date || 'N/A'} au {edu.end_date || 'N/A'}</span>
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => { setEduForm(edu); setModalFullScreen(false); setShowEduModal(true); }} style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><Edit style={{ width: '16px', height: '16px', color: '#185FA5' }} /></button>
                      <button onClick={() => handleDeleteEducation(edu.id!)} style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><Trash2 style={{ width: '16px', height: '16px' }} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. PROJETS */}
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0B1F3A', margin: 0 }}>5. Projets</h3>
                <button onClick={() => { setProjForm({ name: '', industry: 'Informatique', beneficiary: '', link_url: '', description: '' }); setModalFullScreen(false); setShowProjModal(true); }} style={{ backgroundColor: '#185FA5', color: '#ffffff', fontWeight: '800', padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                  <Plus style={{ width: '16px', height: '16px' }} /> Ajouter un projet
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {projects.map(proj => (
                  <div key={proj.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', backgroundColor: '#fafafa', boxSizing: 'border-box' }}>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: '800', fontSize: '15px', color: '#0B1F3A' }}>{proj.name} ({proj.industry})</h4>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>{proj.description}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => { setProjForm(proj); setModalFullScreen(false); setShowProjModal(true); }} style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><Edit style={{ width: '16px', height: '16px', color: '#185FA5' }} /></button>
                      <button onClick={() => handleDeleteProject(proj.id!)} style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><Trash2 style={{ width: '16px', height: '16px' }} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PHOTO VIEW MODAL */}
        {showPhotoView && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 100, boxSizing: 'border-box' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', maxWidth: '440px', width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontWeight: '900', fontSize: '16px' }}>Aperçu Photo Profil</h3>
                <button onClick={() => setShowPhotoView(false)} style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}><X style={{ width: '20px', height: '20px' }} /></button>
              </div>
              {profile.cropped_photo ? (
                <img src={profile.cropped_photo} alt="Photo" style={{ width: '100%', maxHeight: '350px', borderRadius: '12px', objectFit: 'contain', backgroundColor: '#000' }} />
              ) : (
                <p style={{ color: '#64748b' }}>Aucune photo actuellement enregistrée.</p>
              )}
            </div>
          </div>
        )}

        {/* PREVIEW MODAL CV/LM/EMAIL WITH FULL-SCREEN TOGGLE BUTTON */}
        {activePkgModal && (
          <div style={{ position: 'fixed', inset: modalFullScreen ? 0 : 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: modalFullScreen ? '0' : '16px', zIndex: 100, boxSizing: 'border-box' }}>
            <div style={{ backgroundColor: '#ffffff', padding: modalFullScreen ? '24px' : '28px', borderRadius: modalFullScreen ? '0' : '20px', maxWidth: modalFullScreen ? '100vw' : '520px', width: '100%', height: modalFullScreen ? '100vh' : 'auto', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 8px', borderRadius: '4px' }}>
                    Aperçu Document {activePkgModal.type}
                  </span>
                  <h3 style={{ margin: '6px 0 0', fontWeight: '900', color: '#0B1F3A', fontSize: '18px' }}>{activePkgModal.pkg.job_offer.title}</h3>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setModalFullScreen(!modalFullScreen)} title="Basculer Plein Écran" style={{ border: 'none', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>
                    {modalFullScreen ? <Minimize2 style={{ width: '18px', height: '18px' }} /> : <Maximize2 style={{ width: '18px', height: '18px' }} />}
                  </button>
                  <button onClick={() => { setActivePkgModal(null); setModalFullScreen(false); }} style={{ border: 'none', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}><X style={{ width: '18px', height: '18px', color: '#64748b' }} /></button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: '800' }}>Status:</span>
                <span style={{ fontSize: '11px', fontWeight: '900', padding: '3px 10px', borderRadius: '6px', backgroundColor: activePkgModal.pkg.payment_status === 'approuved' ? '#dcfce7' : '#fef3c7', color: activePkgModal.pkg.payment_status === 'approuved' ? '#166534' : '#92400e' }}>
                  Paiement: {activePkgModal.pkg.payment_status}
                </span>
                <span style={{ fontSize: '11px', fontWeight: '900', padding: '3px 10px', borderRadius: '6px', backgroundColor: activePkgModal.pkg.processing_status === 'finalized' ? '#e0f2fe' : '#fef3c7', color: activePkgModal.pkg.processing_status === 'finalized' ? '#075985' : '#92400e', marginLeft: 'auto' }}>
                  Génération: {activePkgModal.pkg.processing_status}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
                <button onClick={() => window.open(activePkgModal.type === 'CV' ? activePkgModal.pkg.cv_pdf : activePkgModal.pkg.cover_letter_pdf, '_blank')} style={{ width: '100%', backgroundColor: '#0B1F3A', color: '#ffffff', fontWeight: '800', padding: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px' }}>
                  <Eye style={{ width: '18px', height: '18px' }} /> Consulter le Document
                </button>
                <button onClick={() => window.open(activePkgModal.type === 'CV' ? activePkgModal.pkg.cv_pdf : activePkgModal.pkg.cover_letter_pdf, '_blank')} style={{ width: '100%', border: '2px solid #0B1F3A', backgroundColor: '#ffffff', color: '#0B1F3A', fontWeight: '800', padding: '14px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px' }}>
                  <Download style={{ width: '18px', height: '18px' }} /> Télécharger le Document
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL EXPÉRIENCE WITH FULL-SCREEN TOGGLE AND CALENDARS */}
        {showExpModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: modalFullScreen ? '0' : '16px', zIndex: 100, boxSizing: 'border-box' }}>
            <div style={{ backgroundColor: '#ffffff', padding: modalFullScreen ? '24px' : '28px', borderRadius: modalFullScreen ? '0' : '16px', maxWidth: modalFullScreen ? '100vw' : '520px', width: '100%', height: modalFullScreen ? '100vh' : 'auto', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', boxSizing: 'border-box', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontWeight: '900', color: '#0B1F3A' }}>Expérience Professionnelle</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setModalFullScreen(!modalFullScreen)} title="Basculer Plein Écran" style={{ border: 'none', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>
                    {modalFullScreen ? <Minimize2 style={{ width: '18px', height: '18px' }} /> : <Maximize2 style={{ width: '18px', height: '18px' }} />}
                  </button>
                  <button onClick={() => setShowExpModal(false)} style={{ border: 'none', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}><X style={{ width: '18px', height: '18px' }} /></button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>Poste occupé *</label>
                  <input type="text" placeholder="ex: Lead Developer" value={expForm.title} onChange={e => setExpForm({...expForm, title: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>Structure / Entreprise *</label>
                  <input type="text" placeholder="ex: Noisim Engineering" value={expForm.company} onChange={e => setExpForm({...expForm, company: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>Secteur d'activité *</label>
                    <input type="text" placeholder="Informatique" value={expForm.industry} onChange={e => setExpForm({...expForm, industry: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>Lieu</label>
                    <input type="text" placeholder="Brazzaville" value={expForm.location} onChange={e => setExpForm({...expForm, location: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '800', color: '#0B1F3A', marginBottom: '4px' }}>
                        <Calendar style={{ width: '14px', height: '14px', color: '#185FA5' }} /> Date de début *
                      </label>
                      <input type="date" value={expForm.start_date} onChange={e => setExpForm({...expForm, start_date: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '800', color: '#0B1F3A', marginBottom: '4px' }}>
                        <Calendar style={{ width: '14px', height: '14px', color: '#185FA5' }} /> Date de fin
                      </label>
                      <input type="date" disabled={expForm.is_current} value={expForm.end_date || ''} onChange={e => setExpForm({...expForm, end_date: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', opacity: expForm.is_current ? 0.5 : 1, boxSizing: 'border-box' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="checkbox" id="is_current_chk" checked={expForm.is_current} onChange={e => setExpForm({...expForm, is_current: e.target.checked})} />
                    <label htmlFor="is_current_chk" style={{ fontSize: '12px', fontWeight: '800', color: '#0B1F3A', cursor: 'pointer' }}>Poste occupé actuellement</label>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>Compétences acquises</label>
                  <input type="text" placeholder="React, Django, Docker..." value={expForm.skills_acquired} onChange={e => setExpForm({...expForm, skills_acquired: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: 'auto' }}>
                <button onClick={() => setShowExpModal(false)} style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer', fontWeight: '700' }}>Annuler</button>
                <button onClick={handleSaveExperience} style={{ padding: '10px 18px', borderRadius: '8px', backgroundColor: '#185FA5', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '800' }}>Enregistrer</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL CERTIFICATION WITH FULL-SCREEN TOGGLE AND INTERACTIVE CALENDAR DATES */}
        {showCertModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: modalFullScreen ? '0' : '16px', zIndex: 100, boxSizing: 'border-box' }}>
            <div style={{ backgroundColor: '#ffffff', padding: modalFullScreen ? '24px' : '28px', borderRadius: modalFullScreen ? '0' : '16px', maxWidth: modalFullScreen ? '100vw' : '520px', width: '100%', height: modalFullScreen ? '100vh' : 'auto', display: 'flex', flexDirection: 'column', gap: '14px', boxSizing: 'border-box', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontWeight: '900', color: '#0B1F3A' }}>Certificat & Attestation</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setModalFullScreen(!modalFullScreen)} title="Basculer Plein Écran" style={{ border: 'none', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>
                    {modalFullScreen ? <Minimize2 style={{ width: '18px', height: '18px' }} /> : <Maximize2 style={{ width: '18px', height: '18px' }} />}
                  </button>
                  <button onClick={() => setShowCertModal(false)} style={{ border: 'none', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}><X style={{ width: '18px', height: '18px' }} /></button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>Libellé du certificat *</label>
                <input type="text" placeholder="ex: Certified Cloud Engineer" value={certForm.title} onChange={e => setCertForm({...certForm, title: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>Année *</label>
                  <input type="number" placeholder="2025" value={certForm.year} onChange={e => setCertForm({...certForm, year: parseInt(e.target.value) || 2025})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>Institution *</label>
                  <input type="text" placeholder="AWS / ESTAM" value={certForm.institution} onChange={e => setCertForm({...certForm, institution: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* SECTION 3 DATES VIA CALENDAR INPUTS */}
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '800', color: '#0B1F3A', marginBottom: '4px' }}>
                    <Calendar style={{ width: '14px', height: '14px', color: '#185FA5' }} /> Date de début
                  </label>
                  <input type="date" value={certForm.start_date || ''} onChange={e => setCertForm({...certForm, start_date: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '800', color: '#0B1F3A', marginBottom: '4px' }}>
                    <Calendar style={{ width: '14px', height: '14px', color: '#185FA5' }} /> Date de fin / Obtention
                  </label>
                  <input type="date" value={certForm.end_date || ''} onChange={e => setCertForm({...certForm, end_date: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>Document PDF Certificat (Optionnel)</label>
                <input type="file" accept="application/pdf" onChange={e => setCertFile(e.target.files ? e.target.files[0] : null)} style={{ width: '100%', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'auto' }}>
                <button onClick={() => setShowCertModal(false)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer' }}>Annuler</button>
                <button onClick={handleSaveCertification} style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: '#185FA5', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '800' }}>Enregistrer</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DIPLOME WITH FULL-SCREEN TOGGLE AND INTERACTIVE CALENDAR DATES */}
        {showEduModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: modalFullScreen ? '0' : '16px', zIndex: 100, boxSizing: 'border-box' }}>
            <div style={{ backgroundColor: '#ffffff', padding: modalFullScreen ? '24px' : '28px', borderRadius: modalFullScreen ? '0' : '16px', maxWidth: modalFullScreen ? '100vw' : '520px', width: '100%', height: modalFullScreen ? '100vh' : 'auto', display: 'flex', flexDirection: 'column', gap: '14px', boxSizing: 'border-box', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontWeight: '900', color: '#0B1F3A' }}>Diplôme</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setModalFullScreen(!modalFullScreen)} title="Basculer Plein Écran" style={{ border: 'none', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>
                    {modalFullScreen ? <Minimize2 style={{ width: '18px', height: '18px' }} /> : <Maximize2 style={{ width: '18px', height: '18px' }} />}
                  </button>
                  <button onClick={() => setShowEduModal(false)} style={{ border: 'none', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}><X style={{ width: '18px', height: '18px' }} /></button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>Libellé du diplôme *</label>
                <input type="text" placeholder="ex: Licence Systèmes Informatiques" value={eduForm.title} onChange={e => setEduForm({...eduForm, title: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>Niveau *</label>
                  <input type="text" placeholder="Licence / Master" value={eduForm.degree_level} onChange={e => setEduForm({...eduForm, degree_level: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>Institution *</label>
                  <input type="text" placeholder="Université ESTAM" value={eduForm.institution} onChange={e => setEduForm({...eduForm, institution: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* SECTION 4 DATES VIA CALENDAR INPUTS */}
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '800', color: '#0B1F3A', marginBottom: '4px' }}>
                    <Calendar style={{ width: '14px', height: '14px', color: '#185FA5' }} /> Date de début
                  </label>
                  <input type="date" value={eduForm.start_date || ''} onChange={e => setEduForm({...eduForm, start_date: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '800', color: '#0B1F3A', marginBottom: '4px' }}>
                    <Calendar style={{ width: '14px', height: '14px', color: '#185FA5' }} /> Date de fin / Obtention
                  </label>
                  <input type="date" value={eduForm.end_date || ''} onChange={e => setEduForm({...eduForm, end_date: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>Document PDF Diplôme (Optionnel)</label>
                <input type="file" accept="application/pdf" onChange={e => setEduFile(e.target.files ? e.target.files[0] : null)} style={{ width: '100%', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'auto' }}>
                <button onClick={() => setShowEduModal(false)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer' }}>Annuler</button>
                <button onClick={handleSaveEducation} style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: '#185FA5', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '800' }}>Enregistrer</button>
              </div>
            </div>
          </div>
        )}

        {showProjModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: modalFullScreen ? '0' : '16px', zIndex: 100, boxSizing: 'border-box' }}>
            <div style={{ backgroundColor: '#ffffff', padding: modalFullScreen ? '24px' : '28px', borderRadius: modalFullScreen ? '0' : '16px', maxWidth: modalFullScreen ? '100vw' : '520px', width: '100%', height: modalFullScreen ? '100vh' : 'auto', display: 'flex', flexDirection: 'column', gap: '12px', boxSizing: 'border-box', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontWeight: '900', color: '#0B1F3A' }}>Projet</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setModalFullScreen(!modalFullScreen)} title="Basculer Plein Écran" style={{ border: 'none', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>
                    {modalFullScreen ? <Minimize2 style={{ width: '18px', height: '18px' }} /> : <Maximize2 style={{ width: '18px', height: '18px' }} />}
                  </button>
                  <button onClick={() => setShowProjModal(false)} style={{ border: 'none', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}><X style={{ width: '18px', height: '18px' }} /></button>
                </div>
              </div>
              <input type="text" placeholder="Nom du projet *" value={projForm.name} onChange={e => setProjForm({...projForm, name: e.target.value})} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
              <input type="text" placeholder="Secteur d'activité *" value={projForm.industry} onChange={e => setProjForm({...projForm, industry: e.target.value})} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
              <input type="text" placeholder="Bénéficiaire" value={projForm.beneficiary} onChange={e => setProjForm({...projForm, beneficiary: e.target.value})} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
              <input type="url" placeholder="Lien d'hébergement" value={projForm.link_url} onChange={e => setProjForm({...projForm, link_url: e.target.value})} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
              <textarea placeholder="Description" value={projForm.description} onChange={e => setProjForm({...projForm, description: e.target.value})} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }}></textarea>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'auto' }}>
                <button onClick={() => setShowProjModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>Annuler</button>
                <button onClick={handleSaveProject} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#185FA5', color: '#fff', border: 'none' }}>Enregistrer</button>
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0B1F3A', margin: 0 }}>Tableau de Bord des Candidatures</h2>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginTop: '4px' }}>Gérez vos dossiers de candidature sur mesure synthétisés par l'agent IA.</p>
              </div>
              <button onClick={() => setActiveTab('create')} style={{ backgroundColor: '#185FA5', color: '#ffffff', fontWeight: '800', fontSize: '13px', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(24, 95, 165, 0.2)' }}>
                <Sparkles style={{ width: '16px', height: '16px' }} />
                <span>Nouvelle Candidature</span>
              </button>
            </div>

            {packages.length === 0 ? (
              <div style={{ backgroundColor: '#ffffff', padding: '48px 16px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <FileText style={{ width: '48px', height: '48px', color: '#94a3b8', margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0B1F3A' }}>Aucune candidature générée pour le moment</h3>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {packages.map((pkg) => (
                  <div key={pkg.id} style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: '900', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase' }}>
                          {pkg.job_offer.site_category || 'ACPE'}
                        </span>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0B1F3A', margin: '8px 0 2px' }}>{pkg.job_offer.title}</h3>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', margin: 0 }}>{pkg.job_offer.company}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', backgroundColor: pkg.payment_status === 'approuved' ? '#dcfce7' : '#fef3c7', color: pkg.payment_status === 'approuved' ? '#166534' : '#92400e' }}>
                          Paiement: {pkg.payment_status}
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', backgroundColor: pkg.processing_status === 'finalized' ? '#e0f2fe' : '#fef3c7', color: pkg.processing_status === 'finalized' ? '#075985' : '#92400e' }}>
                          Traitement: {pkg.processing_status}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                      <button onClick={() => { setActivePkgModal({ pkg, type: 'CV' }); setModalFullScreen(false); }} style={{ border: '1px solid #0B1F3A', backgroundColor: '#0B1F3A', color: '#ffffff', fontWeight: '800', fontSize: '12px', padding: '8px 4px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <Eye style={{ width: '14px', height: '14px' }} /> CV
                      </button>
                      <button onClick={() => { setActivePkgModal({ pkg, type: 'LM' }); setModalFullScreen(false); }} style={{ border: '1px solid #0B1F3A', backgroundColor: '#0B1F3A', color: '#ffffff', fontWeight: '800', fontSize: '12px', padding: '8px 4px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <Eye style={{ width: '14px', height: '14px' }} /> LM
                      </button>
                      <button onClick={() => { setActivePkgModal({ pkg, type: 'EMAIL' }); setModalFullScreen(false); }} style={{ border: '1px solid #185FA5', backgroundColor: '#185FA5', color: '#ffffff', fontWeight: '800', fontSize: '12px', padding: '8px 4px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <Eye style={{ width: '14px', height: '14px' }} /> EMAIL
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* GENERATE VIEW ACCEPTING URL, RAW TEXT OR DIRECT FILE UPLOAD (PDF/IMAGE) */}
        {activeTab === 'create' && (
          <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#ffffff', padding: '28px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0B1F3A', margin: '0 0 8px' }}>Générer un Dossier Sur Mesure</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px' }}>Fournissez l'offre via une URL, du texte brut ou en téléversant directement un document (PDF / Image d'offre).</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#0B1F3A', marginBottom: '6px' }}>Option A : Lien URL de l'offre d'emploi</label>
                <input type="url" placeholder="https://acpe.cg/emplois/developpeur-fullstack" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ textAlign: 'center', fontWeight: '800', fontSize: '12px', color: '#94a3b8' }}>OU</div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#0B1F3A', marginBottom: '6px' }}>Option B : Téléchargement direct (PDF ou Image d'offre)</label>
                <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '20px', textAlign: 'center', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}>
                  <input type="file" id="job-doc-input" accept="application/pdf,image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) setUploadedDocument(e.target.files[0]); }} />
                  <label htmlFor="job-doc-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ backgroundColor: '#e0f2fe', padding: '10px', borderRadius: '50%' }}>
                      <FileUp style={{ width: '24px', height: '24px', color: '#0284c7' }} />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0B1F3A' }}>
                      {uploadedDocument ? `Fichier sélectionné : ${uploadedDocument.name}` : 'Cliquer pour téléverser une offre PDF ou Image'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Formats supportés : PDF, PNG, JPG, JPEG</span>
                  </label>
                  {uploadedDocument && (
                    <button onClick={() => setUploadedDocument(null)} style={{ marginTop: '10px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', fontWeight: '700', fontSize: '11px', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
                      Supprimer le fichier
                    </button>
                  )}
                </div>
              </div>

              <div style={{ textAlign: 'center', fontWeight: '800', fontSize: '12px', color: '#94a3b8' }}>OU</div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#0B1F3A', marginBottom: '6px' }}>Option C : Texte brut de l'offre</label>
                <textarea rows={4} placeholder="Collez ici le texte intégral de l'annonce..." value={jobText} onChange={e => setJobText(e.target.value)} style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box' }}></textarea>
              </div>

              <button onClick={handleGenerateApplication} disabled={isGenerating} style={{ width: '100%', backgroundColor: '#185FA5', color: '#ffffff', fontWeight: '900', fontSize: '15px', padding: '14px', borderRadius: '12px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(24, 95, 165, 0.3)', marginTop: '6px' }}>
                {isGenerating ? 'Analyse et Génération IA par AGENT_IA_CV...' : 'Lancer la Génération (CV 1P & LM 1P & Email)'}
              </button>
            </div>
          </div>
        )}

        {/* SUBSCRIPTION PLANS WITH VISUAL BADGES / LOGOS FOR AIRTEL, MTN & BANK CARD */}
        {activeTab === 'plans' && (
          <div style={{ maxWidth: '1024px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0B1F3A', margin: 0 }}>Formules d'Abonnement & Modes de Paiement</h2>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Rechargez instantanément vos crédits de génération via nos passerelles sécurisées.</p>
            </div>

            {paymentSuccessMsg && (
              <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #6ee7b7', padding: '14px', borderRadius: '12px', color: '#065f46', fontWeight: '800', textAlign: 'center', fontSize: '13px' }}>
                {paymentSuccessMsg}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {availablePlans.map((planItem) => (
                <div
                  key={planItem.id}
                  onClick={() => setSelectedPlan(planItem.id)}
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '24px',
                    borderRadius: '20px',
                    border: selectedPlan === planItem.id ? '3px solid #185FA5' : '1px solid #e2e8f0',
                    boxShadow: selectedPlan === planItem.id ? '0 10px 15px -3px rgba(24, 95, 165, 0.15)' : '0 4px 6px -1px rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    position: 'relative',
                    boxSizing: 'border-box'
                  }}
                >
                  {selectedPlan === planItem.id && (
                    <span style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: '#185FA5', color: '#fff', fontSize: '10px', fontWeight: '900', padding: '4px 8px', borderRadius: '10px' }}>
                      SÉLECTIONNÉ
                    </span>
                  )}
                  <h3 style={{ margin: 0, fontWeight: '900', fontSize: '18px', color: '#0B1F3A' }}>{planItem.name}</h3>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#185FA5' }}>{planItem.price_fcfa.toLocaleString()} FCFA</div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>{planItem.description}</p>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F6E56', backgroundColor: '#f0fdf4', padding: '6px 10px', borderRadius: '8px', display: 'inline-block' }}>
                    Crédits inclus : {planItem.applications_limit} candidature(s)
                  </div>
                </div>
              ))}
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0B1F3A', margin: '0 0 16px', textAlign: 'center' }}>Modes de Paiement Acceptés</h3>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', backgroundColor: '#fff7ed', border: '2px solid #fdba74', borderRadius: '12px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ea580c' }}></div>
                  <span style={{ fontWeight: '900', fontSize: '12px', color: '#9a3412' }}>Airtel Money Congo</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', backgroundColor: '#fefce8', border: '2px solid #fde047', borderRadius: '12px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#eab308' }}></div>
                  <span style={{ fontWeight: '900', fontSize: '12px', color: '#854d0e' }}>MTN Mobile Money</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', backgroundColor: '#f0f9ff', border: '2px solid #7dd3fc', borderRadius: '12px' }}>
                  <CreditCard style={{ width: '14px', height: '14px', color: '#0284c7' }} />
                  <span style={{ fontWeight: '900', fontSize: '12px', color: '#075985' }}>Carte Bancaire</span>
                </div>
              </div>

              <div style={{ maxWidth: '440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px', boxSizing: 'border-box' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#0B1F3A', marginBottom: '6px' }}>Sélectionner le mode de paiement</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} style={{ width: '100%', padding: '10px', border: '2px solid #cbd5e1', borderRadius: '10px', fontSize: '13px', fontWeight: '700', boxSizing: 'border-box' }}>
                    <option value="AIRTEL_MONEY">Airtel Money Congo (+242 06 ...)</option>
                    <option value="MTN_MOMO">MTN Mobile Money Congo (+242 05 / 06 ...)</option>
                    <option value="PAYDUNYA">Carte Bancaire / PayDunya</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#0B1F3A', marginBottom: '6px' }}>Numéro de téléphone / Compte</label>
                  <input type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} style={{ width: '100%', padding: '10px', border: '2px solid #cbd5e1', borderRadius: '10px', fontSize: '13px', fontWeight: '700', boxSizing: 'border-box' }} />
                </div>

                <button onClick={handlePayment} style={{ width: '100%', backgroundColor: '#0F6E56', color: '#ffffff', fontWeight: '900', fontSize: '15px', padding: '14px', borderRadius: '12px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(15, 110, 86, 0.3)', marginTop: '4px' }}>
                  Procéder au paiement & Recharger
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
