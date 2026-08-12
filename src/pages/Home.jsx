import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  CheckSquare, 
  ClipboardList, 
  Settings, 
  LogOut, 
  ArrowLeft,
  Home as HomeIcon,
  Loader2,
  FileCheck,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LoginForm from '../components/auth/LoginForm';
import MissionForm from '../components/mission/MissionForm';
import MissionList from '../components/mission/MissionList';
import MissionDetails from '../components/mission/MissionDetails';
import ValidationActions from '../components/mission/ValidationActions';
import PrintableMission from '../components/mission/PrintableMission';
import UserManagement from '../components/admin/UserManagement';
import BeneficiaryUpload from '../components/admin/BeneficiaryUpload';
import BeneficiaryFileList from '../components/admin/BeneficiaryFileList';
import RefacturationManagement from '../components/mission/RefacturationManagement';
import DemandeurDashboard from '../components/dashboard/DemandeurDashboard';
import ValideurDashboard from '../components/dashboard/ValideurDashboard';
import RHDashboard from '../components/dashboard/RHDashboard';

const CAN_CREATE_PROFILES = ['RO', 'Directeur', 'Directeur des opérations', 'DGA'];

const isReturnedToRequester = (mission) =>
  mission.status === 'Demande de modification' &&
  mission.current_validator_level === mission.demandeur_profile;

export default function Home() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [myMissions, setMyMissions] = useState([]);
  const [pendingMissions, setPendingMissions] = useState([]);
  const [validatedMissions, setValidatedMissions] = useState([]);
  const [allMissions, setAllMissions] = useState([]);
  const [selectedMission, setSelectedMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'detail', or 'edit'
  const [refreshKey, setRefreshKey] = useState(0);
  const [beneficiaryFiles, setBeneficiaryFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [myRequestsStatusFilter, setMyRequestsStatusFilter] = useState('all');

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUserProfile');
    if (savedUser) {
      setUserProfile(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const loadMissions = useCallback(async (profile) => {
    if (!profile) return;
    const allMissionsData = await base44.entities.MissionOrder.list('-created_date');
    setAllMissions(allMissionsData);
    const mine = allMissionsData.filter(m => m.demandeur_email === profile.user_email);
    setMyMissions(mine);
    
    const pending = allMissionsData.filter(m => 
      (m.status === 'En cours de validation' || m.status === 'Demande de modification') && 
      m.current_validator_level === profile.currentProfile
    );
    setPendingMissions(pending);
    
    if (profile.currentProfile === 'RH') {
      const validated = allMissionsData.filter(m => m.status === 'Validée');
      setValidatedMissions(validated);
    }
  }, []);

  useEffect(() => {
    if (userProfile) {
      loadMissions(userProfile);
    }
  }, [userProfile, activeTab, refreshKey, loadMissions]);

  const loadBeneficiaryFiles = useCallback(async () => {
    setLoadingFiles(true);
    const files = await base44.entities.EmployeeBeneficiary.list('-created_date');
    setBeneficiaryFiles(files);
    setLoadingFiles(false);
  }, []);

  const goToDashboard = useCallback(async () => {
    setSelectedMission(null);
    setViewMode('list');
    setActiveTab('dashboard');
    setRefreshKey(k => k + 1);
  }, []);

  const handleLogin = (profile) => {
    setUserProfile(profile);
    setCurrentUser({ email: profile.user_email, name: profile.user_name });
    localStorage.setItem('currentUserProfile', JSON.stringify(profile));
  };

  const handleProfileSelect = (profile) => {
    const updated = { ...userProfile, currentProfile: profile };
    setUserProfile(updated);
    localStorage.setItem('currentUserProfile', JSON.stringify(updated));
  };

  const handleLogout = () => {
    setUserProfile(null);
    setCurrentUser(null);
    localStorage.removeItem('currentUserProfile');
    setActiveTab('dashboard');
  };

  const handleMissionSelect = (mission) => {
    setSelectedMission(mission);
    setViewMode(isReturnedToRequester(mission) ? 'edit' : 'detail');
  };

  const handleBackToList = () => {
    setSelectedMission(null);
    setViewMode('list');
    setRefreshKey(k => k + 1);
  };

  const canCreate = CAN_CREATE_PROFILES.includes(userProfile?.currentProfile);
  const isAdmin = userProfile?.currentProfile === 'Admin';
  const isRH = userProfile?.currentProfile === 'RH';
  const isValidator = !isAdmin;

  useEffect(() => {
    if (isRH && activeTab === 'files') {
      loadBeneficiaryFiles();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!userProfile) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">Gestion des Ordres de Mission</h1>
                <p className="text-xs text-slate-500">Système de workflow automatisé</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-700">{userProfile.user_name}</p>
                {userProfile.profiles.length > 1 ? (
                  <Select value={userProfile.currentProfile} onValueChange={handleProfileSelect}>
                    <SelectTrigger className="h-7 w-auto min-w-[100px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {userProfile.profiles.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                    {userProfile.currentProfile}
                  </Badge>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleLogout}
                className="text-slate-500 hover:text-red-600"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'edit' && selectedMission ? (
          <div className="space-y-6">
            <Button 
              variant="ghost" 
              onClick={handleBackToList}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la liste
            </Button>

            <MissionForm 
              currentUser={userProfile}
              editingMission={selectedMission}
              onSuccess={goToDashboard}
            />
          </div>
        ) : viewMode === 'detail' && selectedMission ? (
          <div className="space-y-6">
            <Button 
              variant="ghost" 
              onClick={handleBackToList}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la liste
            </Button>
            
            <MissionDetails mission={selectedMission} />
            
            {/* Bouton impression pour RH sur demandes validées */}
            {isRH && selectedMission.status === 'Validée' && (
              <div className="mt-6">
                <PrintableMission mission={selectedMission} />
              </div>
            )}
            
            {/* Actions de validation */}
            {!isReturnedToRequester(selectedMission) &&
             selectedMission.current_validator_level === userProfile.currentProfile && (
              <ValidationActions
                mission={selectedMission}
                currentUser={userProfile}
                onActionComplete={goToDashboard}
              />
            )}
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white/80 backdrop-blur-sm border border-slate-200 p-1 h-auto flex-wrap">
              <TabsTrigger
                value="dashboard"
                className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
              >
                <HomeIcon className="w-4 h-4 mr-2" />
                Tableau de bord
              </TabsTrigger>
              {!isAdmin && (
                <>
                  {canCreate && (
                    <TabsTrigger 
                      value="new"
                      className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Nouvelle demande
                    </TabsTrigger>
                  )}
                  <TabsTrigger 
                    value="my-requests"
                    className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
                  >
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Mes demandes
                    {myMissions.length > 0 && (
                      <Badge className="ml-2 bg-slate-200 text-slate-700">{myMissions.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="validation"
                    className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
                  >
                    <CheckSquare className="w-4 h-4 mr-2" />
                    À valider
                    {pendingMissions.length > 0 && (
                      <Badge className="ml-2 bg-amber-500 text-white">{pendingMissions.length}</Badge>
                    )}
                  </TabsTrigger>
                  {isRH && (
                    <>
                      <TabsTrigger 
                        value="validated"
                        className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
                      >
                        <FileCheck className="w-4 h-4 mr-2" />
                        Validées RH
                        {validatedMissions.length > 0 && (
                          <Badge className="ml-2 bg-green-600 text-white">{validatedMissions.length}</Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="files"
                        className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
                      >
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Fichiers
                      </TabsTrigger>
                      <TabsTrigger 
                        value="refacturation"
                        className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refacturation
                      </TabsTrigger>
                    </>
                  )}
                </>
              )}
              {isAdmin && (
                <TabsTrigger 
                  value="admin"
                  className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Administration
                </TabsTrigger>
              )}
            </TabsList>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : (
              <>
                <TabsContent value="dashboard" className="mt-6">
                  {userProfile.currentProfile === 'RO' && (
                    <DemandeurDashboard
                      myMissions={myMissions}
                      allMissions={allMissions}
                      onSelectMission={handleMissionSelect}
                      onGoToTab={setActiveTab}
                    />
                  )}
                  {['Directeur', 'Directeur des opérations', 'DGA'].includes(userProfile.currentProfile) && (
                    <ValideurDashboard
                      allMissions={allMissions}
                      pendingMissions={pendingMissions}
                      userProfile={userProfile}
                      onSelectMission={handleMissionSelect}
                      onGoToTab={setActiveTab}
                    />
                  )}
                  {['RH', 'Admin'].includes(userProfile.currentProfile) && (
                    <RHDashboard
                      allMissions={allMissions}
                      onSelectMission={handleMissionSelect}
                      onGoToTab={setActiveTab}
                    />
                  )}
                </TabsContent>

                <TabsContent value="new" className="mt-6">
                  <MissionForm 
                    currentUser={userProfile}
                    onSuccess={goToDashboard}
                  />
                </TabsContent>

                <TabsContent value="my-requests" className="mt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <h2 className="text-xl font-semibold text-slate-800">Mes demandes</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">Filtrer par statut :</span>
                      <Select value={myRequestsStatusFilter} onValueChange={setMyRequestsStatusFilter}>
                        <SelectTrigger className="w-[200px] h-9 border-slate-200">
                          <SelectValue placeholder="Tous les statuts" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les statuts</SelectItem>
                          <SelectItem value="En attente">En attente</SelectItem>
                          <SelectItem value="En cours de validation">En cours de validation</SelectItem>
                          <SelectItem value="Validée">Validée</SelectItem>
                          <SelectItem value="Rejetée">Rejetée</SelectItem>
                          <SelectItem value="Demande de modification">Demande de modification</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <MissionList
                    missions={myRequestsStatusFilter === 'all' ? myMissions : myMissions.filter(m => m.status === myRequestsStatusFilter)}
                    onSelect={(mission) => {
                      if (isReturnedToRequester(mission)) {
                        setSelectedMission(mission);
                        setViewMode('edit');
                      } else {
                        handleMissionSelect(mission);
                      }
                    }}
                    emptyMessage="Vous n'avez pas encore soumis de demande"
                  />
                </TabsContent>

                <TabsContent value="validation" className="mt-6">
                  <h2 className="text-xl font-semibold text-slate-800 mb-4">
                    Demandes à valider ({userProfile.currentProfile})
                  </h2>
                  <MissionList 
                    missions={pendingMissions}
                    onSelect={handleMissionSelect}
                    emptyMessage="Aucune demande en attente de votre validation"
                  />
                </TabsContent>

                <TabsContent value="validated" className="mt-6">
                  <h2 className="text-xl font-semibold text-slate-800 mb-4">
                    Demandes validées RH
                  </h2>
                  <MissionList 
                    missions={validatedMissions}
                    onSelect={handleMissionSelect}
                    emptyMessage="Aucune demande validée"
                  />
                </TabsContent>

                <TabsContent value="files" className="mt-6">
                  <div className="space-y-6">
                    <BeneficiaryUpload 
                      currentUser={userProfile} 
                      onUploaded={loadBeneficiaryFiles}
                    />
                    <BeneficiaryFileList files={beneficiaryFiles} loading={loadingFiles} onDelete={loadBeneficiaryFiles} />
                  </div>
                </TabsContent>

                <TabsContent value="refacturation" className="mt-6">
                  <RefacturationManagement currentUser={userProfile} />
                </TabsContent>

                <TabsContent value="admin" className="mt-6">
                  <UserManagement />
                </TabsContent>
              </>
            )}
          </Tabs>
        )}
      </main>
    </div>
  );
}