import { useState, useEffect } from 'react';
import { CreditCard, Calendar, Bell, Download, Search, Plus, Trash2, Edit, Clock, MapPin, Sparkles, Shield, User, CheckCircle, XCircle, FileText, Upload } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const processDashboardChartData = (donationsList, filterType) => {
  const successDonations = donationsList.filter(d => 
    d.payment?.transaction_status === 'success' || 
    d.payment?.transaction_status === 'settlement'
  );
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  if (filterType === 'weekly') {
    // Get Monday of the current week
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + distanceToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    return dayNames.map((name, index) => {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + index);
      const dateString = dayDate.toDateString();
      
      const totalAmount = successDonations
        .filter(d => new Date(d.createdAt).toDateString() === dateString)
        .reduce((sum, curr) => sum + Number(curr.amount), 0);
        
      return { name, amount: totalAmount };
    });
  }
  
  if (filterType === 'monthly') {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysData = [];
    
    for (let i = 1; i <= daysInMonth; i++) {
      const totalAmount = successDonations
        .filter(d => {
          const dDate = new Date(d.createdAt);
          return dDate.getDate() === i && 
                 dDate.getMonth() === currentMonth && 
                 dDate.getFullYear() === currentYear;
        })
        .reduce((sum, curr) => sum + Number(curr.amount), 0);
        
      daysData.push({ name: `${i}`, amount: totalAmount });
    }
    return daysData;
  }
  
  if (filterType === 'yearly') {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return monthNames.map((name, index) => {
      const totalAmount = successDonations
        .filter(d => {
          const dDate = new Date(d.createdAt);
          return dDate.getMonth() === index && 
                 dDate.getFullYear() === currentYear;
        })
        .reduce((sum, curr) => sum + Number(curr.amount), 0);
        
      return { name, amount: totalAmount };
    });
  }
  
  return [{ name: 'Belum ada data', amount: 0 }];
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [donations, setDonations] = useState([]);
  const [totalPunia, setTotalPunia] = useState(0);
  const [puraCount, setPuraCount] = useState(0);
  const [user, setUser] = useState(null);
  const [chartFilter, setChartFilter] = useState('monthly');
  
  // User/Application States
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [isLoadingAppStatus, setIsLoadingAppStatus] = useState(false);

  // Superadmin States
  const [applications, setApplications] = useState([]);
  const [adminsList, setAdminsList] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [superadminStats, setSuperadminStats] = useState({ totalIncome: 0, totalIncomeNet: 0, totalPuras: 0, totalAdmins: 0 });

  // Admin Pura States
  const [managedPuras, setManagedPuras] = useState([]);
  const [showAddPura, setShowAddPura] = useState(false);
  const [editingPura, setEditingPura] = useState(null); // stores the pura object if editing
  const [newPura, setNewPura] = useState({ name: '', address: '', description: '', image_url: '' });
  const [isSubmittingPura, setIsSubmittingPura] = useState(false);
  const [totalPuniaNet, setTotalPuniaNet] = useState(0);

  // Admin Pura Withdrawal States
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [newWithdrawal, setNewWithdrawal] = useState({ amount: '', bank_name: 'BCA', account_number: '', account_name: '', admin_notes: '' });
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);
  const [isFetchingWithdrawals, setIsFetchingWithdrawals] = useState(false);

  // Superadmin Review Notes Modal State
  const [reviewNote, setReviewNote] = useState('');
  const [selectedWithdrawalForReview, setSelectedWithdrawalForReview] = useState(null);
  const [reviewStatus, setReviewStatus] = useState(''); // 'approved' or 'rejected'
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Admin Event States
  const [events, setEvents] = useState([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null); // stores the event object if editing
  const [newEvent, setNewEvent] = useState({ pura_id: '', name: '', date: '', time: '', description: '', image_url: '' });
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = async (file, type) => {
    if (!file) return;
    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const url = res.data.secure_url;
      if (type === 'new') {
        setNewPura(prev => ({ ...prev, image_url: url }));
      } else if (type === 'edit') {
        setEditingPura(prev => ({ ...prev, image_url: url }));
      }
      alert('Gambar berhasil diunggah!');
    } catch (error) {
      console.error('Error uploading image', error);
      alert('Gagal mengunggah gambar: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsUploadingImage(false);
    }
  };

  const calculateNetPunia = (amount, paymentType) => {
    const numAmount = Number(amount);
    if (!paymentType) return numAmount;
    
    const type = paymentType.toLowerCase();
    if (type.includes('qris')) {
      return numAmount * 0.993; // 0.7% MDR
    } else if (type.includes('gopay') || type.includes('shopeepay') || type.includes('qris_gopay')) {
      return numAmount * 0.98; // 2% MDR
    } else if (type.includes('bank_transfer') || type.includes('va') || type.includes('echannel') || type.includes('bca') || type.includes('mandiri') || type.includes('bni') || type.includes('bri') || type.includes('permata')) {
      return Math.max(0, numAmount - 4000); // Rp4.000 flat VA fee
    }
    return numAmount;
  };

  useEffect(() => {
    const activeWithdrawalsSum = withdrawalRequests
      .filter(w => w.status === 'pending' || w.status === 'approved')
      .reduce((sum, w) => sum + Number(w.amount), 0);
    setAvailableBalance(Math.max(0, totalPuniaNet - activeWithdrawalsSum));
  }, [totalPuniaNet, withdrawalRequests]);

  const fetchWithdrawalData = async () => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.role === 'admin') {
      try {
        setIsFetchingWithdrawals(true);
        const res = await api.get('/withdrawals/history');
        setWithdrawalRequests(res.data);
        const approved = res.data.filter(w => w.status === 'approved').reduce((sum, w) => sum + Number(w.amount), 0);
        setTotalWithdrawn(approved);
      } catch (error) {
        console.error('Failed to fetch withdrawal history', error);
      } finally {
        setIsFetchingWithdrawals(false);
      }
    } else if (userData.role === 'superadmin') {
      try {
        setIsFetchingWithdrawals(true);
        const res = await api.get('/superadmin/withdrawals');
        setWithdrawalRequests(res.data);
      } catch (error) {
        console.error('Failed to fetch platform withdrawals', error);
      } finally {
        setIsFetchingWithdrawals(false);
      }
    }
  };

  const handleAddWithdrawal = async (e) => {
    e.preventDefault();
    if (Number(newWithdrawal.amount) <= 0) {
      alert('Nominal penarikan harus lebih besar dari Rp 0.');
      return;
    }
    if (Number(newWithdrawal.amount) > availableBalance) {
      alert(`Gagal: Nominal penarikan melebihi saldo tersedia (Rp ${Math.round(availableBalance).toLocaleString('id-ID')})`);
      return;
    }
    setIsSubmittingWithdrawal(true);
    try {
      await api.post('/withdrawals', newWithdrawal);
      alert('Pengajuan penarikan dana berhasil diajukan!');
      setNewWithdrawal(prev => ({ ...prev, amount: '', admin_notes: '' }));
      fetchWithdrawalData();
    } catch (error) {
      console.error('Failed to submit withdrawal request', error);
      alert('Gagal mengajukan penarikan: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  const handleReviewWithdrawal = async (e) => {
    e.preventDefault();
    if (!selectedWithdrawalForReview) return;
    try {
      const res = await api.post(`/superadmin/withdrawals/${selectedWithdrawalForReview.id}/review`, {
        status: reviewStatus,
        superadmin_notes: reviewNote
      });
      alert(res.data.message);
      setShowReviewModal(false);
      setSelectedWithdrawalForReview(null);
      setReviewNote('');
      fetchWithdrawalData();
    } catch (error) {
      console.error('Failed to review withdrawal', error);
      alert('Gagal memproses pengajuan: ' + (error.response?.data?.message || error.message));
    }
  };

  const fetchSuperAdminData = async () => {
    try {
      // 1. Applications
      const appsRes = await api.get('/superadmin/applications');
      setApplications(appsRes.data);

      // 2. Admins & Puras
      const adminsRes = await api.get('/superadmin/admins');
      setAdminsList(adminsRes.data);

      // 3. Transactions
      const txRes = await api.get('/superadmin/transactions');
      const txData = txRes.data;
      setAllTransactions(txData);

      // Calculate stats
      const successTx = txData.filter(t => t.payment?.transaction_status === 'success' || t.payment?.transaction_status === 'settlement');
      const totalIncome = successTx.reduce((sum, item) => sum + Number(item.amount), 0);
      const totalIncomeNet = successTx.reduce((sum, item) => {
        const payType = item.payment?.payment_type;
        return sum + calculateNetPunia(item.amount, payType);
      }, 0);
      
      const adminCount = adminsRes.data.length;
      
      const purasRes = await api.get('/puras');
      const totalPuras = purasRes.data.length;

      setSuperadminStats({
        totalIncome,
        totalIncomeNet,
        totalPuras,
        totalAdmins: adminCount
      });
    } catch (error) {
      console.error('Failed to fetch superadmin data', error);
    }
  };

  const handleReviewApplication = async (appId, status) => {
    if (!confirm(`Apakah Anda yakin ingin ${status === 'approved' ? 'menyetujui' : 'menolak'} pengajuan pengurus ini?`)) return;
    try {
      const res = await api.post(`/superadmin/applications/${appId}/review`, { status });
      alert(res.data.message);
      fetchSuperAdminData();
    } catch (error) {
      console.error('Failed to review application', error);
      alert('Gagal meninjau pengajuan: ' + (error.response?.data?.message || error.message));
    }
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);

    const fetchDonations = async () => {
      try {
        let res;
        if (userData.role === 'admin') {
          const purasRes = await api.get('/puras');
          const myPuras = purasRes.data.filter(p => p.admin_id === userData.id);
          if (myPuras.length > 0) {
            res = await api.get(`/donations/pura/${myPuras[0].id}`);
          } else {
            setDonations([]);
            setTotalPunia(0);
            setTotalPuniaNet(0);
            setPuraCount(0);
            return;
          }
        } else {
          res = await api.get('/donations/history');
        }
        const data = res.data;
        setDonations(data);
        
        // Filter only success transactions for total stats
        const successDonations = data.filter(d => 
          d.payment?.transaction_status === 'success' || 
          d.payment?.transaction_status === 'settlement'
        );
        
        // Calculate stats using only success donations
        const total = successDonations.reduce((acc, curr) => acc + Number(curr.amount), 0);
        setTotalPunia(total);

        const totalNet = successDonations.reduce((acc, curr) => {
          const payType = curr.payment?.payment_type;
          return acc + calculateNetPunia(curr.amount, payType);
        }, 0);
        setTotalPuniaNet(totalNet);
        
        if (userData.role === 'admin') {
          setPuraCount(successDonations.length);
        } else {
          const uniquePuras = new Set(data.map(d => d.pura_id));
          setPuraCount(uniquePuras.size);
        }
      } catch (error) {
        console.error('Failed to fetch donations', error);
      }
    };

    const fetchAdminData = async () => {
      if (userData.role === 'admin') {
        try {
          // Fetch puras
          const purasRes = await api.get('/puras');
          const myPuras = purasRes.data.filter(p => p.admin_id === userData.id);
          setManagedPuras(myPuras);
          
          if (myPuras.length > 0) {
            setNewEvent(prev => ({ ...prev, pura_id: myPuras[0].id }));
          }

          // Fetch all events
          const eventsRes = await api.get('/events');
          const myPurasIds = new Set(myPuras.map(p => p.id));
          const myEvents = eventsRes.data.filter(e => myPurasIds.has(e.pura_id));
          setEvents(myEvents);
        } catch (error) {
          console.error('Failed to fetch admin data', error);
        }
      }
    };

    const fetchAppStatus = async () => {
      if (userData.role === 'user') {
        try {
          setIsLoadingAppStatus(true);
          const res = await api.get('/admin-applications/status');
          setApplicationStatus(res.data);
          
          // Auto-promote if application was approved
          if (res.data && res.data.status === 'approved') {
            const updatedUser = { ...userData, role: 'admin' };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            window.dispatchEvent(new Event('storage'));
            alert('Pengajuan Anda telah disetujui! Memuat ulang dashboard Anda...');
            window.location.reload();
          }
        } catch (error) {
          console.error('Failed to fetch application status', error);
        } finally {
          setIsLoadingAppStatus(false);
        }
      }
    };

    if (userData.role === 'superadmin') {
      fetchSuperAdminData();
      fetchWithdrawalData();
    } else {
      fetchDonations();
      fetchAdminData();
      fetchAppStatus();
      if (userData.role === 'admin') {
        fetchWithdrawalData();
      }
    }
  }, []);

  // --- PURA CRUD HANDLERS ---
  const handleAddPura = async (e) => {
    e.preventDefault();
    setIsSubmittingPura(true);
    try {
      const res = await api.post('/puras', newPura);
      alert('Pura berhasil ditambahkan!');
      
      // Update managed puras list
      const updatedPuras = [...managedPuras, res.data.pura];
      setManagedPuras(updatedPuras);
      
      // Pre-select this new pura in the event form if it's the first one
      if (updatedPuras.length === 1) {
        setNewEvent(prev => ({ ...prev, pura_id: res.data.pura.id }));
      }
      
      setShowAddPura(false);
      setNewPura({ name: '', address: '', description: '', image_url: '' });
    } catch (error) {
      console.error('Failed to add pura', error);
      alert('Gagal menambahkan pura.');
    } finally {
      setIsSubmittingPura(false);
    }
  };

  const handleEditPura = async (e) => {
    e.preventDefault();
    setIsSubmittingPura(true);
    try {
      const res = await api.put(`/puras/${editingPura.id}`, editingPura);
      alert('Data Pura berhasil diperbarui!');
      
      // Update local state
      setManagedPuras(prev => prev.map(p => p.id === editingPura.id ? res.data.pura : p));
      setEditingPura(null);
    } catch (error) {
      console.error('Failed to update pura', error);
      alert('Gagal memperbarui data pura: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmittingPura(false);
    }
  };

  // --- EVENT CRUD HANDLERS ---
  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.pura_id) {
      alert('Silakan pilih Pura terlebih dahulu');
      return;
    }
    setIsSubmittingEvent(true);
    try {
      await api.post('/events', newEvent);
      alert('Acara Pura berhasil ditambahkan!');
      
      // Refresh events list
      const eventsRes = await api.get('/events');
      const myPurasIds = new Set(managedPuras.map(p => p.id));
      const myEvents = eventsRes.data.filter(e => myPurasIds.has(e.pura_id));
      setEvents(myEvents);
      
      setShowAddEvent(false);
      setNewEvent({ pura_id: managedPuras[0]?.id || '', name: '', date: '', time: '', description: '', image_url: '' });
    } catch (error) {
      console.error('Failed to add event', error);
      alert('Gagal menambahkan acara: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const handleEditEvent = async (e) => {
    e.preventDefault();
    setIsSubmittingEvent(true);
    try {
      const res = await api.put(`/events/${editingEvent.id}`, editingEvent);
      alert('Acara Pura berhasil diperbarui!');
      
      // Update local state
      setEvents(prev => prev.map(e => e.id === editingEvent.id ? res.data.event : e));
      setEditingEvent(null);
    } catch (error) {
      console.error('Failed to update event', error);
      alert('Gagal memperbarui acara: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus acara ini?')) return;
    try {
      await api.delete(`/events/${eventId}`);
      alert('Acara berhasil dihapus!');
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('Failed to delete event', error);
      alert('Gagal menghapus acara');
    }
  };

  return (
    <div className="py-8">
      {/* Welcome Header */}
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-start gap-4 bg-white p-6 rounded-3xl border border-gray-50 shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-dark mb-2">Om Swastyastu, {user?.name || 'Umat'}!</h1>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-gray-500 font-medium">Peran Saat Ini:</p>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              user?.role === 'superadmin' ? 'bg-purple-100 text-purple-705 border border-purple-200' :
              user?.role === 'admin' ? 'bg-green-100 text-green-705 border border-green-200' :
              'bg-orange-100 text-primary border border-orange-200'
            }`}>
              {user?.role === 'superadmin' ? 'Superadmin Platform' :
               user?.role === 'admin' ? 'Pengurus Pura (Admin)' :
               'Donatur / Umat'}
            </span>
          </div>
        </div>

        {/* User Application Status Banners */}
        {user?.role === 'user' && (
          <div className="flex-1 max-w-xl md:text-right">
            {isLoadingAppStatus ? (
              <div className="animate-pulse bg-gray-100 h-10 w-full rounded-xl"></div>
            ) : applicationStatus ? (
              <div className={`p-4 rounded-2xl border text-left flex items-start gap-3 ${
                applicationStatus.status === 'pending' ? 'bg-yellow-50/50 border-yellow-100 text-yellow-805' :
                applicationStatus.status === 'approved' ? 'bg-green-50/50 border-green-100 text-green-805' :
                'bg-red-50/50 border-red-100 text-red-805'
              }`}>
                {applicationStatus.status === 'pending' && (
                  <>
                    <Clock className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider">Status Pengajuan: Menunggu Verifikasi</p>
                      <p className="text-xs text-gray-600 mt-0.5">Berkas kepengurusan Pura <strong>{applicationStatus.pura_name}</strong> sedang ditinjau oleh Superadmin.</p>
                    </div>
                  </>
                )}
                {applicationStatus.status === 'rejected' && (
                  <>
                    <XCircle className="text-red-650 flex-shrink-0 mt-0.5" size={18} />
                    <div className="flex-grow">
                      <p className="text-xs font-bold uppercase tracking-wider">Status Pengajuan: Ditolak</p>
                      <p className="text-xs text-gray-600 mt-0.5 mb-2">Mohon maaf, berkas pengajuan kepengurusan Pura Anda belum dapat kami verifikasi.</p>
                      <button
                        onClick={() => navigate('/apply-admin')}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-2xs font-bold transition-all shadow-sm"
                      >
                        Ajukan Ulang Berkas
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-2xl text-left flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-dark uppercase tracking-wider">Mengelola Pura Anda?</h4>
                  <p className="text-xs text-gray-600 mt-0.5">Ajukan diri Anda sebagai pengurus resmi Pura untuk mulai menerima dana punia online.</p>
                </div>
                <button
                  onClick={() => navigate('/apply-admin')}
                  className="px-4 py-2 bg-primary hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all whitespace-nowrap shadow-md shadow-orange-100"
                >
                  Ajukan Pengurus
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Superadmin Tab Switcher */}
      {user?.role === 'superadmin' && (
        <div className="flex gap-1 border-b border-gray-200 mb-8 overflow-x-auto scrollbar-none">
          {[
            { id: 'overview', label: 'Ringkasan Platform', icon: CreditCard },
            { id: 'applications', label: 'Persetujuan Admin', icon: Shield },
            { id: 'admins', label: 'Pengurus & Pura', icon: User },
            { id: 'transactions', label: 'Log Transaksi', icon: FileText },
            { id: 'withdrawal_approvals', label: 'Persetujuan Tarik Dana', icon: Download },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-primary hover:border-gray-300'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Admin Tab Switcher */}
      {user?.role === 'admin' && (
        <div className="flex gap-1 border-b border-gray-200 mb-8 overflow-x-auto scrollbar-none">
          {[
            { id: 'overview', label: 'Ringkasan', icon: CreditCard },
            { id: 'pura_management', label: 'Kelola Pura', icon: MapPin },
            { id: 'event_management', label: 'Kelola Acara', icon: Calendar },
            { id: 'withdrawal_management', label: 'Tarik Dana', icon: Download },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setShowAddPura(false);
                  setEditingPura(null);
                  setShowAddEvent(false);
                  setEditingEvent(null);
                }}
                className={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-primary hover:border-gray-300'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ========================================================
          TAB 1: OVERVIEW
          ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          {/* Stats Cards */}
          {user?.role === 'superadmin' ? (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-primary to-orange-400 p-6 rounded-2xl text-white shadow-lg shadow-orange-100 transition-all hover:scale-[1.01]">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-orange-50 mb-1 font-medium text-xs">Total Dana Punia Platform</p>
                    <h2 className="text-2xl font-extrabold">Rp {superadminStats.totalIncome.toLocaleString('id-ID')}</h2>
                    <div className="mt-2 pt-2 border-t border-white/20">
                      <p className="text-orange-100/90 text-2xs font-medium">Dana Bersih (Setelah Midtrans):</p>
                      <p className="text-sm font-bold text-white">Rp {superadminStats.totalIncomeNet ? Math.round(superadminStats.totalIncomeNet).toLocaleString('id-ID') : 0}</p>
                    </div>
                  </div>
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <CreditCard size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:scale-[1.01]">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-gray-500 mb-1 font-medium">Total Pura Terdaftar</p>
                    <h2 className="text-3xl font-extrabold text-dark">{superadminStats.totalPuras}</h2>
                  </div>
                  <div className="p-2 bg-orange-50 text-primary rounded-xl">
                    <MapPin size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:scale-[1.01]">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-gray-500 mb-1 font-medium">Total Admin (Pengurus)</p>
                    <h2 className="text-3xl font-extrabold text-dark">{superadminStats.totalAdmins}</h2>
                  </div>
                  <div className="p-2 bg-orange-50 text-primary rounded-xl">
                    <User size={24} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-primary to-orange-400 p-6 rounded-2xl text-white shadow-lg shadow-orange-100 transition-all hover:scale-[1.01]">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-orange-50 mb-1 font-medium text-xs">
                      {user?.role === 'admin' ? 'Total Dana Punia Pura' : 'Total Dana Punia'}
                    </p>
                    <h2 className="text-2xl font-extrabold">Rp {totalPunia.toLocaleString('id-ID')}</h2>
                    {user?.role === 'admin' && (
                      <div className="mt-2 pt-2 border-t border-white/20">
                        <p className="text-orange-100/90 text-2xs font-medium">Dana Bersih (Setelah Midtrans):</p>
                        <p className="text-sm font-bold text-white">Rp {Math.round(totalPuniaNet).toLocaleString('id-ID')}</p>
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <CreditCard size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:scale-[1.01]">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-gray-500 mb-1 font-medium text-xs">
                      {user?.role === 'admin' ? 'Transaksi Sukses' : 'Pura Dibantu'}
                    </p>
                    <h2 className="text-3xl font-extrabold text-dark">{puraCount}</h2>
                  </div>
                  <div className="p-2 bg-orange-50 text-primary rounded-xl">
                    <MapPin size={24} />
                  </div>
                </div>
              </div>
              
              {user?.role === 'admin' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:scale-[1.01]">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-gray-500 mb-1 font-medium">Acara Keagamaan</p>
                      <h2 className="text-3xl font-extrabold text-dark">{events.length}</h2>
                    </div>
                    <div className="p-2 bg-orange-50 text-primary rounded-xl">
                      <Calendar size={24} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chart Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <h3 className="text-lg font-bold text-dark">Grafik Dana Punia</h3>
              
              {/* Filter Buttons */}
              <div className="flex bg-gray-50 border border-gray-100 rounded-xl p-1 self-start sm:self-center">
                {[
                  { id: 'weekly', label: 'Mingguan' },
                  { id: 'monthly', label: 'Bulanan' },
                  { id: 'yearly', label: 'Tahunan' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setChartFilter(opt.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${chartFilter === opt.id ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-primary'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processDashboardChartData(user?.role === 'superadmin' ? allTransactions : donations, chartFilter)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `Rp${value/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`Rp ${value.toLocaleString()}`, 'Punia']}
                  />
                  <Bar dataKey="amount" fill="#F97316" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* History Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-dark">
                {user?.role === 'superadmin' ? 'Recent Transactions (Platform-Wide)' : 'Riwayat Transaksi'}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-sm text-gray-500">
                    <th className="pb-3 font-medium">Pura</th>
                    <th className="pb-3 font-medium">Tanggal</th>
                    <th className="pb-3 font-medium text-right">Nominal</th>
                    <th className="pb-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(user?.role === 'superadmin' ? allTransactions : donations).length === 0 ? (
                    <tr><td colSpan="4" className="py-4 text-center text-gray-500">Belum ada riwayat donasi</td></tr>
                  ) : (user?.role === 'superadmin' ? allTransactions.slice(0, 10) : donations).map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-55 hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 text-dark font-medium">{tx.pura?.name || 'Pura'}</td>
                      <td className="py-4 text-gray-500 text-sm">{new Date(tx.createdAt).toLocaleDateString('id-ID')}</td>
                      <td className="py-4 text-dark font-bold text-right">Rp {Number(tx.amount).toLocaleString('id-ID')}</td>
                      <td className="py-4 text-right">
                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${tx.payment?.transaction_status === 'success' || tx.payment?.transaction_status === 'settlement' ? 'bg-green-50 text-green-600' : tx.payment?.transaction_status === 'pending' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>
                          {tx.payment?.transaction_status || 'pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUPERADMIN TAB 2: PERSETUJUAN ADMIN
          ======================================================== */}
      {activeTab === 'applications' && user?.role === 'superadmin' && (
        <div className="space-y-8 animate-fade-in">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-dark">Daftar Pengajuan Pengurus Pura</h3>
          </div>

          <div className="grid gap-6">
            {applications.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-150 shadow-sm">
                Tidak ada pengajuan verifikasi pengurus Pura saat ini.
              </div>
            ) : (
              applications.map((app) => (
                <div key={app.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm p-6 space-y-6">
                  {/* Title & Status */}
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 border-b border-gray-50 pb-4">
                    <div>
                      <h4 className="font-extrabold text-dark text-lg">{app.pura_name}</h4>
                      <p className="text-gray-500 text-xs mt-0.5">Diajukan oleh: <span className="font-bold text-primary">{app.full_name}</span> ({app.jabatan})</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider self-start ${
                      app.status === 'pending' ? 'bg-yellow-100 text-yellow-805' :
                      app.status === 'approved' ? 'bg-green-100 text-green-805' :
                      'bg-red-100 text-red-805'
                    }`}>
                      {app.status === 'pending' ? 'Pending (Ditinjau)' :
                       app.status === 'approved' ? 'Disetujui' :
                       'Ditolak'}
                    </span>
                  </div>

                  {/* Two Column details */}
                  <div className="grid md:grid-cols-2 gap-6 text-sm">
                    {/* Personal Info */}
                    <div className="space-y-2">
                      <h5 className="font-bold text-dark border-b border-gray-50 pb-1 flex items-center gap-1.5 text-xs text-primary uppercase tracking-wider">
                        <User size={14} />
                        <span>Informasi Personal</span>
                      </h5>
                      <p><span className="text-gray-500 font-medium">Nama Lengkap:</span> <strong className="text-dark">{app.full_name}</strong></p>
                      <p><span className="text-gray-500 font-medium">WhatsApp HP:</span> <strong className="text-dark">{app.phone}</strong></p>
                      <p><span className="text-gray-500 font-medium">Email:</span> <strong className="text-dark">{app.email}</strong></p>
                      <p><span className="text-gray-500 font-medium">Jabatan:</span> <strong className="text-dark">{app.jabatan}</strong></p>
                    </div>

                    {/* Pura Info */}
                    <div className="space-y-2">
                      <h5 className="font-bold text-dark border-b border-gray-50 pb-1 flex items-center gap-1.5 text-xs text-primary uppercase tracking-wider">
                        <MapPin size={14} />
                        <span>Informasi Pura</span>
                      </h5>
                      <p><span className="text-gray-500 font-medium">Nama Pura:</span> <strong className="text-dark">{app.pura_name}</strong></p>
                      <p><span className="text-gray-500 font-medium">Alamat:</span> <strong className="text-dark">{app.pura_address}, Desa {app.pura_desa}, Kec. {app.pura_kecamatan}, {app.pura_kabupaten}, Prov. {app.pura_provinsi}</strong></p>
                      <p><span className="text-gray-500 font-medium">Tahun Berdiri:</span> <strong className="text-dark">{app.pura_established_year || '-'}</strong></p>
                      <p className="text-gray-600 italic text-xs leading-relaxed mt-1">"{app.pura_description}"</p>
                    </div>
                  </div>

                  {/* Verification Documents */}
                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-4">
                    <h5 className="font-bold text-dark text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <FileText size={14} className="text-primary" />
                      <span>Dokumen Lampiran Pengaju</span>
                    </h5>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* SK */}
                      <div className="bg-white p-3 border border-gray-150 rounded-xl flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-dark">Surat Keputusan (SK) Pengurus</p>
                          <p className="text-2xs text-gray-500 font-medium uppercase mt-0.5">{app.sk_document_type.replace('_', ' ')}</p>
                        </div>
                        <a
                          href={app.sk_document_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-orange-50 hover:bg-primary hover:text-white text-primary text-2xs font-bold rounded-lg border border-orange-100 transition-all flex items-center gap-1"
                        >
                          <span>Buka Berkas</span>
                        </a>
                      </div>

                      {/* Identity */}
                      <div className="bg-white p-3 border border-gray-150 rounded-xl flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-dark">Identitas Pengenal (KTP / SIM)</p>
                          <p className="text-2xs text-gray-500 font-medium uppercase mt-0.5">{app.identity_type}</p>
                        </div>
                        <a
                          href={app.identity_document_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-orange-50 hover:bg-primary hover:text-white text-primary text-2xs font-bold rounded-lg border border-orange-100 transition-all flex items-center gap-1"
                        >
                          <span>Buka Berkas</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Review Actions */}
                  {app.status === 'pending' && (
                    <div className="flex gap-2 pt-4 border-t border-gray-50 justify-end">
                      <button
                        onClick={() => handleReviewApplication(app.id, 'approved')}
                        className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-md shadow-green-100 transition-all flex items-center gap-1"
                      >
                        <CheckCircle size={14} />
                        <span>Setujui (Promosikan & Registrasi Pura)</span>
                      </button>
                      <button
                        onClick={() => handleReviewApplication(app.id, 'rejected')}
                        className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-100 transition-all flex items-center gap-1"
                      >
                        <XCircle size={14} />
                        <span>Tolak Pengajuan</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          SUPERADMIN TAB 3: PENGURUS & PURA LIST
          ======================================================== */}
      {activeTab === 'admins' && user?.role === 'superadmin' && (
        <div className="space-y-8 animate-fade-in bg-white p-6 rounded-3xl border border-gray-50 shadow-sm">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-xl font-bold text-dark">Daftar Pengurus & Pura Terkait</h3>
            <p className="text-gray-500 text-xs mt-0.5">Daftar akun admin yang memegang hak pengelolaan Pura secara legal.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-sm text-gray-500">
                  <th className="pb-3 font-medium">Nama Pengurus</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Pura yang Dikelola</th>
                  <th className="pb-3 font-medium">Lokasi Pura</th>
                  <th className="pb-3 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {adminsList.length === 0 ? (
                  <tr><td colSpan="5" className="py-4 text-center text-gray-500">Belum ada admin terdaftar</td></tr>
                ) : adminsList.map((adm) => {
                  const pura = adm.managedPuras && adm.managedPuras[0];
                  return (
                    <tr key={adm.id} className="border-b border-gray-55 hover:bg-gray-50/50 transition-colors text-sm">
                      <td className="py-4 text-dark font-bold">{adm.name}</td>
                      <td className="py-4 text-gray-655">{adm.email}</td>
                      <td className="py-4 text-dark font-semibold">{pura ? pura.name : <span className="text-gray-400 italic">Belum dikaitkan</span>}</td>
                      <td className="py-4 text-gray-500 max-w-xs truncate">{pura ? pura.address : '-'}</td>
                      <td className="py-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 text-2xs font-bold rounded-full border ${
                          pura ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          {pura ? 'Verified' : 'Unassigned'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          SUPERADMIN TAB 4: SYSTEM TRANSACTIONS LOG
          ======================================================== */}
      {activeTab === 'transactions' && user?.role === 'superadmin' && (
        <div className="space-y-8 animate-fade-in bg-white p-6 rounded-3xl border border-gray-50 shadow-sm">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-xl font-bold text-dark">Log Transaksi Sistem (Lengkap)</h3>
            <p className="text-gray-500 text-xs mt-0.5">Daftar rekapan seluruh penyaluran dana punia umat ke seluruh Pura.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-sm text-gray-500">
                  <th className="pb-3 font-medium">Donatur</th>
                  <th className="pb-3 font-medium">Target Pura</th>
                  <th className="pb-3 font-medium">Tanggal</th>
                  <th className="pb-3 font-medium">Metode</th>
                  <th className="pb-3 font-medium text-right">Nominal</th>
                  <th className="pb-3 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {allTransactions.length === 0 ? (
                  <tr><td colSpan="6" className="py-4 text-center text-gray-500">Belum ada transaksi di platform</td></tr>
                ) : allTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-55 hover:bg-gray-50/50 transition-colors text-sm">
                    <td className="py-4 text-dark font-bold">
                      {tx.is_anonymous ? 'Anonim' : (tx.donatur ? tx.donatur.name : 'Anonim')}
                    </td>
                    <td className="py-4 text-gray-700 font-semibold">{tx.pura?.name || 'Pura'}</td>
                    <td className="py-4 text-gray-500">{new Date(tx.createdAt).toLocaleDateString('id-ID')} {new Date(tx.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    <td className="py-4 text-gray-550 uppercase font-medium text-xs">{tx.payment?.payment_type || 'pending'}</td>
                    <td className="py-4 text-dark font-extrabold text-right">Rp {Number(tx.amount).toLocaleString('id-ID')}</td>
                    <td className="py-4 text-center">
                      <span className={`inline-block px-3 py-1 text-2xs font-bold rounded-full ${
                        tx.payment?.transaction_status === 'success' || tx.payment?.transaction_status === 'settlement' ? 'bg-green-50 text-green-700' : 
                        tx.payment?.transaction_status === 'pending' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {tx.payment?.transaction_status || 'pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: KELOLA PURA (Admin Only)
          ======================================================== */}
      {activeTab === 'pura_management' && user?.role === 'admin' && (
        <div className="space-y-8">
          {/* Header Actions */}
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-dark">Pura yang Anda Kelola</h3>
            {/* Constraint: 1 Pura per admin. Disable adding new pura if they already manage one */}
            {!editingPura && managedPuras.length === 0 && (
              <button 
                onClick={() => setShowAddPura(!showAddPura)}
                className="bg-primary text-white px-4 py-2 rounded-xl font-semibold hover:bg-orange-600 transition-all flex items-center gap-2 text-sm shadow-md shadow-orange-100"
              >
                {showAddPura ? 'Batal' : (
                  <>
                    <Plus size={16} />
                    <span>Tambah Pura Baru</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Form Tambah Pura (Constraint Fallback) */}
          {showAddPura && managedPuras.length === 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 animate-fade-in">
              <h4 className="text-lg font-bold text-dark mb-4">Form Tambah Pura Baru</h4>
              <form onSubmit={handleAddPura} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pura</label>
                    <input required type="text" value={newPura.name} onChange={e => setNewPura({...newPura, name: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="e.g. Pura Agung Besakih" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                    <input required type="text" value={newPura.address} onChange={e => setNewPura({...newPura, address: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="e.g. Rendang, Karangasem, Bali" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Foto Pura</label>
                  {newPura.image_url ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 h-48 bg-gray-50 flex items-center justify-center">
                      <img src={newPura.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNewPura(prev => ({ ...prev, image_url: '' }))}
                        className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-all shadow-md"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-gray-300 hover:border-primary rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all bg-gray-50/50 hover:bg-orange-50/10">
                      <Upload className="text-gray-400" size={28} />
                      <div className="text-center">
                        <span className="text-sm font-semibold text-primary block">Pilih File Foto Pura</span>
                        <span className="text-xs text-gray-500 block mt-0.5">PNG, JPG, JPEG sampai 5MB</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleImageUpload(e.target.files[0], 'new')}
                        disabled={isUploadingImage}
                      />
                    </label>
                  )}
                  {isUploadingImage && (
                    <div className="mt-2 text-xs text-primary flex items-center gap-1.5 font-medium animate-pulse">
                      <span>Sedang mengunggah foto ke Cloudinary...</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Pura</label>
                  <textarea required value={newPura.description} onChange={e => setNewPura({...newPura, description: e.target.value})} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="Ceritakan sejarah, piodalan, atau informasi detail Pura..." />
                </div>
                <button type="submit" disabled={isSubmittingPura} className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-orange-600 transition-all text-sm shadow-md shadow-orange-100">
                  {isSubmittingPura ? 'Menyimpan...' : 'Simpan Data Pura'}
                </button>
              </form>
            </div>
          )}

          {/* Form Edit Pura */}
          {editingPura && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 animate-fade-in">
              <h4 className="text-lg font-bold text-dark mb-4">Edit Data Pura: {editingPura.name}</h4>
              <form onSubmit={handleEditPura} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pura</label>
                    <input required type="text" value={editingPura.name} onChange={e => setEditingPura({...editingPura, name: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                    <input required type="text" value={editingPura.address} onChange={e => setEditingPura({...editingPura, address: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Foto Pura</label>
                  {editingPura.image_url ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 h-48 bg-gray-50 flex items-center justify-center">
                      <img src={editingPura.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditingPura(prev => ({ ...prev, image_url: '' }))}
                        className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-all shadow-md"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-gray-300 hover:border-primary rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all bg-gray-50/50 hover:bg-orange-50/10">
                      <Upload className="text-gray-400" size={28} />
                      <div className="text-center">
                        <span className="text-sm font-semibold text-primary block">Pilih File Foto Pura</span>
                        <span className="text-xs text-gray-500 block mt-0.5">PNG, JPG, JPEG sampai 5MB</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleImageUpload(e.target.files[0], 'edit')}
                        disabled={isUploadingImage}
                      />
                    </label>
                  )}
                  {isUploadingImage && (
                    <div className="mt-2 text-xs text-primary flex items-center gap-1.5 font-medium animate-pulse">
                      <span>Sedang mengunggah foto ke Cloudinary...</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Pura</label>
                  <textarea required value={editingPura.description || ''} onChange={e => setEditingPura({...editingPura, description: e.target.value})} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={isSubmittingPura} className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-orange-600 transition-all text-sm shadow-md">
                    {isSubmittingPura ? 'Menyimpan...' : 'Perbarui Pura'}
                  </button>
                  <button type="button" onClick={() => setEditingPura(null)} className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition-all text-sm">
                    Batal
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List Pura yang Dikelola */}
          <div className="grid md:grid-cols-2 gap-6">
            {managedPuras.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">
                Anda belum memiliki Pura yang diverifikasi. Tunggu persetujuan pengaju pengurus Pura Anda.
              </div>
            ) : managedPuras.map((pura) => (
              <div key={pura.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                <div className="h-40 bg-gray-100 relative">
                  <img src={pura.image_url || 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&q=80&w=600'} alt={pura.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&q=80&w=600'; }} />
                  <div className="absolute top-3 right-3 bg-white/95 px-3 py-1 rounded-full text-xs font-semibold text-primary shadow-sm backdrop-blur-sm">
                    {pura.is_verified ? 'Terverifikasi' : 'Proses Verifikasi'}
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-dark text-lg mb-1">{pura.name}</h4>
                    <p className="text-gray-500 text-sm flex items-center gap-1 mb-3">
                      <MapPin size={14} className="text-primary flex-shrink-0" />
                      <span className="truncate">{pura.address}</span>
                    </p>
                    <p className="text-gray-655 text-sm line-clamp-2 mb-4">{pura.description}</p>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-gray-50">
                    <button onClick={() => { setEditingPura(pura); setEditingEvent(null); setShowAddPura(false); }} className="flex-1 bg-orange-50 text-primary py-2 rounded-lg font-semibold hover:bg-primary hover:text-white transition-all text-xs flex items-center justify-center gap-1">
                      <Edit size={14} />
                      <span>Edit Info Pura</span>
                    </button>
                    <a href={`/pura/${pura.id}`} target="_blank" rel="noopener noreferrer" className="px-3 bg-gray-50 text-gray-650 hover:bg-gray-100 py-2 rounded-lg font-semibold transition-all text-xs flex items-center justify-center">
                      Lihat Halaman
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: KELOLA ACARA (Admin Only)
          ======================================================== */}
      {activeTab === 'event_management' && user?.role === 'admin' && (
        <div className="space-y-8">
          {/* Header Actions */}
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-dark">Jadwal Acara / Piodalan Pura</h3>
            {!editingEvent && managedPuras.length > 0 && (
              <button 
                onClick={() => setShowAddEvent(!showAddEvent)}
                className="bg-primary text-white px-4 py-2 rounded-xl font-semibold hover:bg-orange-600 transition-all flex items-center gap-2 text-sm shadow-md shadow-orange-100"
              >
                {showAddEvent ? 'Batal' : (
                  <>
                    <Plus size={16} />
                    <span>Tambah Acara Baru</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Form Tambah Acara Baru */}
          {showAddEvent && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 animate-fade-in">
              <div className="flex items-center gap-2 mb-4 text-primary">
                <Sparkles size={20} />
                <h4 className="text-lg font-bold text-dark">Form Tambah Acara Baru</h4>
              </div>
              <form onSubmit={handleAddEvent} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Pura</label>
                    <select required value={newEvent.pura_id} onChange={e => setNewEvent({...newEvent, pura_id: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white transition-all">
                      {managedPuras.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Acara / Upacara</label>
                    <input required type="text" value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="e.g. Pujawali / Piodalan Alit" />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Acara</label>
                    <input required type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Waktu / Jam (Opsional)</label>
                    <input type="text" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="e.g. 09:00 WITA - Selesai" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Gambar Banner (Opsional)</label>
                  <input type="text" value={newEvent.image_url} onChange={e => setNewEvent({...newEvent, image_url: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi / Rangkaian Acara</label>
                  <textarea required value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="Jelaskan detail upacara, imbauan busana adat, atau runtutan prosesi acara..." />
                </div>
                <button type="submit" disabled={isSubmittingEvent} className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-orange-600 transition-all text-sm shadow-md shadow-orange-100">
                  {isSubmittingEvent ? 'Menyimpan...' : 'Jadwalkan Acara'}
                </button>
              </form>
            </div>
          )}

          {/* Form Edit Acara */}
          {editingEvent && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 animate-fade-in">
              <div className="flex items-center gap-2 mb-4 text-primary">
                <Edit size={20} />
                <h4 className="text-lg font-bold text-dark">Edit Acara: {editingEvent.name}</h4>
              </div>
              <form onSubmit={handleEditEvent} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pura Terkait</label>
                    <select required value={editingEvent.pura_id} onChange={e => setEditingEvent({...editingEvent, pura_id: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white transition-all">
                      {managedPuras.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Acara / Upacara</label>
                    <input required type="text" value={editingEvent.name} onChange={e => setEditingEvent({...editingEvent, name: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Acara</label>
                    <input required type="date" value={editingEvent.date} onChange={e => setEditingEvent({...editingEvent, date: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Waktu / Jam</label>
                    <input type="text" value={editingEvent.time || ''} onChange={e => setEditingEvent({...editingEvent, time: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Gambar Banner</label>
                  <input type="text" value={editingEvent.image_url || ''} onChange={e => setEditingEvent({...editingEvent, image_url: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi / Rangkaian Acara</label>
                  <textarea required value={editingEvent.description || ''} onChange={e => setEditingEvent({...editingEvent, description: e.target.value})} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={isSubmittingEvent} className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-orange-600 transition-all text-sm shadow-md">
                    {isSubmittingEvent ? 'Menyimpan...' : 'Perbarui Acara'}
                  </button>
                  <button type="button" onClick={() => setEditingEvent(null)} className="bg-gray-100 text-gray-605 px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition-all text-sm">
                    Batal
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List Acara Keagamaan */}
          <div className="space-y-4">
            {managedPuras.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">
                Anda belum memiliki Pura yang terverifikasi.
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">
                Belum ada acara keagamaan terjadwal. Klik "+ Tambah Acara Baru" untuk membuat acara pertama Anda.
              </div>
            ) : (
              events.map((event) => {
                const eventPura = event.pura || managedPuras.find(p => p.id === event.pura_id);
                const eventDate = new Date(event.date);
                const day = eventDate.getDate();
                const month = eventDate.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase();
                const fullDate = eventDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

                return (
                  <div key={event.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-5 items-start md:items-center">
                    {/* Calendar Badge */}
                    <div className="flex-shrink-0 w-16 h-16 bg-orange-50 border border-orange-100 text-primary rounded-2xl flex flex-col items-center justify-center font-bold">
                      <span className="text-2xl leading-none">{day}</span>
                      <span className="text-xs tracking-wider">{month}</span>
                    </div>

                    {/* Event Detail */}
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-dark text-lg">{event.name}</h4>
                        <span className="text-xs bg-gray-50 text-gray-500 border border-gray-100 px-2 py-0.5 rounded-full font-medium">
                          {eventPura?.name || 'Pura'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-3 mb-2 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-primary" />
                          {fullDate}
                        </span>
                        {event.time && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-primary" />
                            {event.time}
                          </span>
                        )}
                      </p>
                      <p className="text-gray-600 text-sm line-clamp-2">{event.description}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex gap-2 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0">
                      <button onClick={() => { setEditingEvent(event); setEditingPura(null); setShowAddEvent(false); }} className="flex-1 md:flex-none px-4 py-2 border border-gray-150 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5">
                        <Edit size={14} />
                        <span>Edit</span>
                      </button>
                      <button onClick={() => handleDeleteEvent(event.id)} className="flex-1 md:flex-none px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-1.5">
                        <Trash2 size={14} />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: KELOLA PENARIKAN (Admin Pura Only)
          ======================================================== */}
      {activeTab === 'withdrawal_management' && user?.role === 'admin' && (
        <div className="space-y-8 animate-fade-in">
          <div className="border-b border-gray-150 pb-4 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-dark">Simulasi Penarikan Dana Pura</h3>
              <p className="text-gray-500 text-xs mt-0.5">Ajukan penarikan dana punia bersih yang telah terhimpun ke rekening Pura.</p>
            </div>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between gap-4">
              <div>
                <p className="text-2xs text-gray-400 font-bold uppercase tracking-wider">Total Kas Bersih</p>
                <h3 className="text-2xl font-extrabold text-dark mt-1">Rp {Math.round(totalPuniaNet).toLocaleString('id-ID')}</h3>
              </div>
              <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                <CreditCard size={20} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between gap-4">
              <div>
                <p className="text-2xs text-gray-400 font-bold uppercase tracking-wider">Dana Sudah Ditarik</p>
                <h3 className="text-2xl font-extrabold text-dark mt-1">Rp {totalWithdrawn.toLocaleString('id-ID')}</h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <CheckCircle size={20} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary to-orange-400 p-6 rounded-2xl text-white shadow-lg shadow-orange-100 flex items-center justify-between gap-4">
              <div>
                <p className="text-2xs text-orange-100 font-bold uppercase tracking-wider">Saldo Tersedia Ditarik</p>
                <h3 className="text-2xl font-extrabold mt-1">Rp {Math.round(availableBalance).toLocaleString('id-ID')}</h3>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Download size={20} />
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Form Request Withdrawal */}
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <h4 className="font-bold text-dark text-lg border-b border-gray-50 pb-2 flex items-center gap-2">
                <Download size={18} className="text-primary" />
                <span>Form Pengajuan</span>
              </h4>

              <form onSubmit={handleAddWithdrawal} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pilih Bank</label>
                  <select
                    required
                    value={newWithdrawal.bank_name}
                    onChange={e => setNewWithdrawal({ ...newWithdrawal, bank_name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white transition-all text-sm"
                  >
                    {['BCA', 'Mandiri', 'BNI', 'BRI', 'Permata', 'BPD Bali'].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nomor Rekening</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. 1234567890"
                    value={newWithdrawal.account_number}
                    onChange={e => setNewWithdrawal({ ...newWithdrawal, account_number: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nama Pemilik Rekening</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Ketut Suardika"
                    value={newWithdrawal.account_name}
                    onChange={e => setNewWithdrawal({ ...newWithdrawal, account_name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nominal Penarikan</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">Rp</span>
                    <input
                      required
                      type="number"
                      placeholder="e.g. 50000"
                      value={newWithdrawal.amount}
                      onChange={e => setNewWithdrawal({ ...newWithdrawal, amount: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Catatan Tambahan (Opsional)</label>
                  <textarea
                    rows={2}
                    placeholder="Keperluan renovasi, pembelian banten, piodalan..."
                    value={newWithdrawal.admin_notes || ''}
                    onChange={e => setNewWithdrawal({ ...newWithdrawal, admin_notes: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingWithdrawal || availableBalance <= 0}
                  className="w-full bg-primary hover:bg-orange-600 disabled:bg-gray-200 text-white font-bold py-2.5 rounded-xl transition-all shadow-md text-sm shadow-orange-100 flex items-center justify-center gap-1.5"
                >
                  {isSubmittingWithdrawal ? 'Mengirim...' : 'Ajukan Penarikan'}
                </button>
              </form>
            </div>

            {/* History Table */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <h4 className="font-bold text-dark text-lg border-b border-gray-50 pb-2">Riwayat Penarikan Dana Pura</h4>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase">
                      <th className="pb-3">Tanggal</th>
                      <th className="pb-3">Tujuan</th>
                      <th className="pb-3 text-right">Nominal</th>
                      <th className="pb-3 text-center">Status</th>
                      <th className="pb-3">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawalRequests.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-gray-500 text-sm italic">Belum ada riwayat pengajuan penarikan dana</td>
                      </tr>
                    ) : (
                      withdrawalRequests.map(w => (
                        <tr key={w.id} className="border-b border-gray-50 text-sm hover:bg-gray-55/50 transition-colors">
                          <td className="py-4 text-gray-500 text-xs">{new Date(w.createdAt).toLocaleDateString('id-ID')}</td>
                          <td className="py-4">
                            <span className="font-bold text-dark text-xs block">{w.bank_name}</span>
                            <span className="text-2xs text-gray-505 block mt-0.5">{w.account_number} a.n. {w.account_name}</span>
                          </td>
                          <td className="py-4 font-bold text-right text-dark">Rp {Number(w.amount).toLocaleString('id-ID')}</td>
                          <td className="py-4 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-2xs font-bold uppercase ${
                              w.status === 'pending' ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' :
                              w.status === 'approved' ? 'bg-green-50 text-green-600 border border-green-100' :
                              'bg-red-50 text-red-600 border border-red-100'
                            }`}>
                              {w.status === 'pending' ? 'Pending' : w.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                            </span>
                          </td>
                          <td className="py-4 max-w-xs">
                            {w.admin_notes && <p className="text-2xs text-gray-500 italic">"Admin: {w.admin_notes}"</p>}
                            {w.superadmin_notes && (
                              <p className={`text-2xs font-semibold mt-1 ${w.status === 'approved' ? 'text-green-600' : 'text-red-505'}`}>
                                "Superadmin: {w.superadmin_notes}"
                              </p>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 5: PERSETUJUAN PENARIKAN (Superadmin Only)
          ======================================================== */}
      {activeTab === 'withdrawal_approvals' && user?.role === 'superadmin' && (
        <div className="space-y-8 animate-fade-in bg-white p-6 rounded-3xl border border-gray-50 shadow-sm">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-xl font-bold text-dark">Persetujuan Penarikan Dana Pura</h3>
            <p className="text-gray-500 text-xs mt-0.5">Validasi pengajuan transfer penarikan dana kas yang diajukan oleh pengurus Pura.</p>
          </div>

          <div className="space-y-6">
            {withdrawalRequests.filter(w => w.status === 'pending').length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-gray-55 rounded-2xl border border-dashed border-gray-200 text-sm">
                Tidak ada pengajuan penarikan dana pending saat ini.
              </div>
            ) : (
              withdrawalRequests.filter(w => w.status === 'pending').map((w) => (
                <div key={w.id} className="p-5 rounded-2xl border border-orange-100 bg-orange-50/10 space-y-4 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-sm transition-all duration-300">
                  <div className="space-y-2 flex-grow">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-dark text-base">{w.pura?.name || 'Nama Pura'}</h4>
                      <span className="text-2xs bg-primary text-white px-2 py-0.5 rounded-full font-bold">Pending</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Diajukan oleh: <span className="font-bold text-dark">{w.admin?.name || 'Admin'}</span> ({w.admin?.email})
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4 text-xs mt-2 pt-2 border-t border-gray-100">
                      <div>
                        <span className="text-gray-400 font-medium block uppercase text-2xs tracking-wider">Rekening Tujuan:</span>
                        <strong className="text-dark block mt-0.5">{w.bank_name} - {w.account_number}</strong>
                        <span className="text-gray-500 font-medium block">a.n. {w.account_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-medium block uppercase text-2xs tracking-wider">Keterangan Pengaju:</span>
                        <span className="text-gray-600 block mt-0.5 italic">"{w.admin_notes || '-'}"</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right flex flex-col items-end gap-3 justify-between">
                    <div>
                      <span className="text-2xs text-gray-400 font-bold block uppercase tracking-wider">Jumlah Penarikan:</span>
                      <strong className="text-2xl font-black text-primary block mt-0.5">Rp {Number(w.amount).toLocaleString('id-ID')}</strong>
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto mt-2">
                      <button
                        onClick={() => {
                          setSelectedWithdrawalForReview(w);
                          setReviewStatus('approved');
                          setShowReviewModal(true);
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-md shadow-green-100 transition-all flex items-center justify-center gap-1"
                      >
                        <CheckCircle size={13} />
                        <span>Setujui & Transfer</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedWithdrawalForReview(w);
                          setReviewStatus('rejected');
                          setShowReviewModal(true);
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-100 transition-all flex items-center justify-center gap-1"
                      >
                        <XCircle size={13} />
                        <span>Tolak</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Historical Processed Withdrawals */}
          <div className="pt-8 border-t border-gray-100 mt-8 space-y-4">
            <h4 className="font-bold text-dark text-base flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              <span>Riwayat Proses Penarikan Dana (Platform)</span>
            </h4>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase">
                    <th className="pb-3">Pura</th>
                    <th className="pb-3">Tujuan Transfer</th>
                    <th className="pb-3 text-right">Nominal</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3">Keterangan Review</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawalRequests.filter(w => w.status !== 'pending').length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-500 text-sm italic">Belum ada riwayat pemrosesan penarikan dana</td>
                    </tr>
                  ) : (
                    withdrawalRequests.filter(w => w.status !== 'pending').map(w => (
                      <tr key={w.id} className="border-b border-gray-50 text-sm hover:bg-gray-50/50 transition-colors">
                        <td className="py-4">
                          <span className="font-bold text-dark text-xs block">{w.pura?.name || 'Pura'}</span>
                          <span className="text-2xs text-gray-500 block mt-0.5">{w.admin?.name} ({new Date(w.updatedAt).toLocaleDateString('id-ID')})</span>
                        </td>
                        <td className="py-4">
                          <span className="font-bold text-dark text-xs block">{w.bank_name}</span>
                          <span className="text-2xs text-gray-500 block">{w.account_number} a.n. {w.account_name}</span>
                        </td>
                        <td className="py-4 font-bold text-right text-dark">Rp {Number(w.amount).toLocaleString('id-ID')}</td>
                        <td className="py-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-2xs font-bold uppercase ${
                            w.status === 'approved' ? 'bg-green-50 text-green-700 border border-green-100' :
                            'bg-red-50 text-red-700 border border-red-100'
                          }`}>
                            {w.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                          </span>
                        </td>
                        <td className="py-4 max-w-xs">
                          {w.admin_notes && <p className="text-2xs text-gray-500 italic">"Admin: {w.admin_notes}"</p>}
                          {w.superadmin_notes && (
                            <p className={`text-2xs font-semibold mt-1 ${w.status === 'approved' ? 'text-green-600' : 'text-red-500'}`}>
                              "Superadmin: {w.superadmin_notes}"
                            </p>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Superadmin Review Notes Modal */}
      {showReviewModal && selectedWithdrawalForReview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4 animate-scale-up">
            <div>
              <h3 className="text-lg font-bold text-dark">
                {reviewStatus === 'approved' ? 'Setujui & Konfirmasi Transfer' : 'Tolak Pengajuan Penarikan'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Pura: <span className="font-bold text-primary">{selectedWithdrawalForReview.pura?.name}</span> <br />
                Nominal: <span className="font-bold text-dark">Rp {Number(selectedWithdrawalForReview.amount).toLocaleString('id-ID')}</span>
              </p>
            </div>

            <form onSubmit={handleReviewWithdrawal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  {reviewStatus === 'approved' ? 'Catatan Transfer / Bukti Referensi' : 'Alasan Penolakan'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                  placeholder={reviewStatus === 'approved' ? 'e.g. Transfer sukses via BNI. Ref: TRX-987654321.' : 'Tuliskan alasan penolakan agar pengurus Pura mengetahui kendala pengajuan...'}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm transition-all"
                />
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedWithdrawalForReview(null);
                    setReviewNote('');
                  }}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-semibold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 text-white rounded-xl text-xs font-bold shadow-md transition-all ${
                    reviewStatus === 'approved' ? 'bg-green-600 hover:bg-green-700 shadow-green-100' : 'bg-red-600 hover:bg-red-700 shadow-red-100'
                  }`}
                >
                  {reviewStatus === 'approved' ? 'Konfirmasi Setuju' : 'Konfirmasi Tolak'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
