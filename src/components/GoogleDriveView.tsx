import React, { useEffect, useState } from 'react';
import { 
  Folder, 
  FileText, 
  Upload, 
  Plus, 
  Trash2, 
  ExternalLink, 
  RefreshCw, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  LogOut, 
  File, 
  FileCode, 
  Image, 
  Music,
  FolderPlus,
  X
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { 
  googleSignIn, 
  googleLogout, 
  driveApi, 
  DriveFile, 
  initAuth 
} from '../services/googleAuth.ts';
import type { ClinicalNote } from '../types/index.ts';

interface GoogleDriveViewProps {
  clinicalNotes: ClinicalNote[];
  currentUserName?: string;
}

export const GoogleDriveView: React.FC<GoogleDriveViewProps> = ({ clinicalNotes, currentUserName }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Upload file modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('Clinical_Consultation_Summary.txt');
  const [uploadContent, setUploadContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // New folder state
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('Patient_Clinical_Records');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Export note to Drive state
  const [selectedNoteToExport, setSelectedNoteToExport] = useState<string>(clinicalNotes[0]?.id || '');

  // Delete confirmation modal state (MANDATORY per skill instructions)
  const [fileToDelete, setFileToDelete] = useState<DriveFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        loadDriveFiles(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
        setFiles([]);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMsg(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        await loadDriveFiles(result.accessToken);
        setSuccessMsg('Connected to Google Drive successfully!');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      console.error('Google Sign in error:', err);
      setErrorMsg(err.message || 'Failed to authenticate with Google Drive');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await googleLogout();
      setUser(null);
      setToken(null);
      setFiles([]);
      setSuccessMsg('Disconnected from Google Drive.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const loadDriveFiles = async (accessToken = token) => {
    if (!accessToken) return;
    setIsLoadingFiles(true);
    setErrorMsg(null);
    try {
      const q = searchQuery.trim() 
        ? `trashed = false and name contains '${searchQuery.replace(/'/g, "\\'")}'` 
        : 'trashed = false';
      const fileList = await driveApi.listFiles(accessToken, q);
      setFiles(fileList);
    } catch (err: any) {
      console.error('Failed to list files:', err);
      setErrorMsg(err.message || 'Error fetching files from Google Drive');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Upload or Export handler
  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !uploadTitle.trim() || isUploading) return;

    setIsUploading(true);
    setErrorMsg(null);
    try {
      await driveApi.uploadFile(token, uploadTitle, uploadContent, 'text/plain');
      setSuccessMsg(`File "${uploadTitle}" saved to Google Drive!`);
      setIsUploadModalOpen(false);
      setUploadTitle('');
      setUploadContent('');
      await loadDriveFiles(token);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleExportSelectedClinicalNote = async () => {
    if (!token) return;
    const note = clinicalNotes.find(n => n.id === selectedNoteToExport);
    if (!note) return;

    setIsUploading(true);
    setErrorMsg(null);
    try {
      const fileName = `SOAP_Note_${note.patientName.replace(/\s+/g, '_')}_${note.consultDate}.txt`;
      const docContent = [
        `======================================================`,
        `AURA CLINICAL INTELLIGENCE — CONSULTATION SUMMARY`,
        `======================================================`,
        `Patient Name: ${note.patientName}`,
        `MRN: ${note.patientMrn}`,
        `Encounter Type: ${note.encounterType}`,
        `Consultation Date: ${note.consultDate}`,
        `Physician: ${currentUserName || 'Dr. S. N. Reddy, MD'}`,
        ``,
        `--- SUBJECTIVE ---`,
        note.soap.subjective,
        ``,
        `--- OBJECTIVE ---`,
        note.soap.objective,
        ``,
        `--- ASSESSMENT ---`,
        note.soap.assessment,
        ``,
        `--- PLAN ---`,
        note.soap.plan,
        ``,
        `--- PRESCRIPTIONS ---`,
        note.prescriptions.map(p => `• ${p}`).join('\n'),
        ``,
        `--- DIET & LIFESTYLE ORDERS ---`,
        note.dietAndLifestyleOrders,
        ``,
        `--- RECOMMENDED FOLLOW-UP ---`,
        `${note.recommendedFollowUpWeeks} weeks`,
        `======================================================`,
        `Stored via Aura HIPAA-Compliant Gateway · End-to-End Encrypted`
      ].join('\n');

      await driveApi.uploadFile(token, fileName, docContent, 'text/plain');
      setSuccessMsg(`Exported "${fileName}" to Google Drive!`);
      await loadDriveFiles(token);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Export to Drive failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newFolderName.trim() || isCreatingFolder) return;

    setIsCreatingFolder(true);
    try {
      await driveApi.createFolder(token, newFolderName);
      setSuccessMsg(`Folder "${newFolderName}" created in Google Drive!`);
      setIsNewFolderModalOpen(false);
      setNewFolderName('');
      await loadDriveFiles(token);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Folder creation failed');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // Explicit confirmation dialog handler for deleting file from Drive
  const confirmDeleteFile = async () => {
    if (!token || !fileToDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      await driveApi.deleteFile(token, fileToDelete.id);
      setSuccessMsg(`Deleted "${fileToDelete.name}" from Google Drive.`);
      setFileToDelete(null);
      await loadDriveFiles(token);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete file from Google Drive');
    } finally {
      setIsDeleting(false);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('folder')) return <Folder className="w-4 h-4 text-amber-400" />;
    if (mimeType.includes('pdf')) return <FileText className="w-4 h-4 text-red-400" />;
    if (mimeType.includes('document') || mimeType.includes('text')) return <FileText className="w-4 h-4 text-indigo-400" />;
    if (mimeType.includes('image')) return <Image className="w-4 h-4 text-emerald-400" />;
    if (mimeType.includes('audio')) return <Music className="w-4 h-4 text-cyan-400" />;
    return <File className="w-4 h-4 text-slate-400" />;
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return '—';
    const num = parseInt(bytes, 10);
    if (isNaN(num)) return '—';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#4285F4]/20 border border-[#4285F4]/40 flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M12.01 1.54l-8.6 14.88 4.29 7.44 8.6-14.88z" />
                <path fill="#34A853" d="M23.63 16.42H6.43l4.29 7.44h17.2z" />
                <path fill="#FBBC05" d="M19.34 8.98L15.05 1.54H6.46l4.29 7.44z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Google Drive Clinical Vault</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/40">
              Workspace OAuth 2.0
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Directly browse, organize, and export patient clinical documentation, lab PDFs, and consultation transcripts to Google Drive with permission from the app's users.
          </p>
        </div>

        {/* User Account / Sign In */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-1.5 px-3 rounded-xl text-xs">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-6 h-6 rounded-full border border-slate-700" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                  {user.displayName?.[0] || 'U'}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate max-w-[140px]">{user.displayName || 'Google User'}</p>
                <p className="text-[10px] font-mono text-slate-400 truncate max-w-[140px]">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1 text-slate-400 hover:text-red-400 transition-colors ml-1"
                title="Disconnect Google Account"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* OFFICIAL GSI MATERIAL BUTTON (Strictly per skill specification) */
            <button 
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="flex items-center gap-2.5 bg-white hover:bg-slate-100 text-slate-800 font-medium px-4 py-2 rounded-lg text-xs shadow-md transition-all cursor-pointer border border-slate-300 active:scale-95 disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isLoggingIn ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Content */}
      {!user ? (
        <div className="p-12 rounded-2xl bg-[#0a0e17] border border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400">
            <Folder className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-white">Connect Google Drive to Aura</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Review and sign in with Google to enable Google Drive APIs for your app. With permission from your Google account, you can store consultation notes, browse medical records, and synchronize clinical documentation.
            </p>
          </div>
          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="inline-flex items-center gap-2.5 bg-white hover:bg-slate-100 text-slate-800 font-medium px-5 py-2.5 rounded-lg text-xs shadow-lg transition-all cursor-pointer border border-slate-300 active:scale-95"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="p-4 rounded-xl bg-[#0a0e17] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadDriveFiles()}
                placeholder="Search Google Drive files..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Export Clinical Note Dropdown */}
              {clinicalNotes.length > 0 && (
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
                  <select
                    value={selectedNoteToExport}
                    onChange={(e) => setSelectedNoteToExport(e.target.value)}
                    className="bg-transparent text-slate-300 text-xs px-2 py-1 outline-none max-w-[150px] truncate"
                  >
                    {clinicalNotes.map(n => (
                      <option key={n.id} value={n.id} className="bg-slate-900 text-white">
                        {n.patientName} ({n.consultDate})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleExportSelectedClinicalNote}
                    disabled={isUploading}
                    className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    <span>Export Note</span>
                  </button>
                </div>
              )}

              {/* Upload Document Button */}
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span>+ Upload / New File</span>
              </button>

              {/* New Folder Button */}
              <button
                onClick={() => setIsNewFolderModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 cursor-pointer transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
                <span>+ New Folder</span>
              </button>

              {/* Refresh Files */}
              <button
                onClick={() => loadDriveFiles()}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                title="Refresh Drive files"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Drive Files List / Table */}
          <div className="bg-[#0a0e17] rounded-xl border border-slate-800/90 overflow-hidden shadow-sm">
            <div className="p-3.5 border-b border-slate-800 bg-[#0e1320] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">Google Drive Files</span>
                <span className="text-[10px] font-mono text-slate-400">({files.length} items)</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Verified OAuth Token
              </span>
            </div>

            {isLoadingFiles ? (
              <div className="py-16 text-center text-xs text-indigo-300 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                <span>Loading files from Google Drive...</span>
              </div>
            ) : files.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 space-y-2">
                <Folder className="w-8 h-8 text-slate-600 mx-auto" />
                <p>No files found in Google Drive matching the query.</p>
                <p className="text-[11px] text-slate-500">
                  Click "+ Upload / New File" or "Export Note" above to add your first clinical record!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-[10px] uppercase font-mono text-slate-400">
                      <th className="py-2.5 px-4">Name</th>
                      <th className="py-2.5 px-3">Size</th>
                      <th className="py-2.5 px-3">Last Modified</th>
                      <th className="py-2.5 px-3">Owner</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-xs">
                    {files.map((file) => (
                      <tr key={file.id} className="hover:bg-slate-900/60 transition-colors group">
                        <td className="py-3 px-4 flex items-center gap-2.5 max-w-sm truncate">
                          {getFileIcon(file.mimeType)}
                          <span className="font-medium text-slate-200 truncate group-hover:text-indigo-300">
                            {file.name}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                          {formatFileSize(file.size)}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </td>
                        <td className="py-3 px-3 text-[11px] text-slate-400 truncate max-w-[120px]">
                          {file.owners?.[0]?.displayName || 'Me'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 transition-colors"
                                title="Open in Google Drive"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => setFileToDelete(file)}
                              className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-red-400 transition-colors"
                              title="Delete from Google Drive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* MANDATORY CONFIRMATION MODAL FOR DELETING FILES FROM GOOGLE DRIVE */}
      {/* ----------------------------------------------------------- */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border border-red-800/80 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2 rounded-lg bg-red-950/80 border border-red-800">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Delete File from Google Drive?</h4>
                <p className="text-[11px] text-slate-400">Action requires explicit user confirmation</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-white">"{fileToDelete.name}"</strong> from your Google Drive account? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteFile}
                disabled={isDeleting}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Confirm & Delete</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload File / Note Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border border-slate-800 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-white">Upload File to Google Drive</h4>
              </div>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">File Name</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  required
                  placeholder="e.g. Lab_Results_David_Chen.txt"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">File Content / Notes</label>
                <textarea
                  value={uploadContent}
                  onChange={(e) => setUploadContent(e.target.value)}
                  rows={6}
                  placeholder="Type or paste medical documentation content here..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadTitle.trim()}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Upload to Drive</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {isNewFolderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border border-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-white">Create Folder in Drive</h4>
              </div>
              <button onClick={() => setIsNewFolderModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Folder Name</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  required
                  placeholder="e.g. Clinical_Consultations_2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewFolderModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingFolder || !newFolderName.trim()}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  {isCreatingFolder ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Create Folder</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
