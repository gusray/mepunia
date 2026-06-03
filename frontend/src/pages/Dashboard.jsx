import { useState, useEffect } from 'react';
import { CreditCard, Calendar, Bell, Download, Search, Plus, Trash2, Edit, Clock, MapPin, Sparkles } from 'lucide-react';
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
  
  // Admin Pura States
  const [managedPuras, setManagedPuras] = useState([]);
  const [showAddPura, setShowAddPura] = useState(false);
  const [editingPura, setEditingPura] = useState(null); // stores the pura object if editing
  const [newPura, setNewPura] = useState({ name: '', address: '', description: '', image_url: '' });
  const [isSubmittingPura, setIsSubmittingPura] = useState(false);

  // Admin Event States
  const [events, setEvents] = useState([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null); // stores the event object if editing
  const [newEvent, setNewEvent] = useState({ pura_id: '', name: '', date: '', time: '', description: '', image_url: '' });
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);

    const fetchDonations = async () => {
      try {
        const res = await api.get('/donations/history');
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
        
        const uniquePuras = new Set(data.map(d => d.pura_id));
        setPuraCount(uniquePuras.size);
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

    fetchDonations();
    fetchAdminData();
  }, []);

  // Removed mock chartData to use dynamic processDashboardChartData instead

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
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-dark mb-2">Om Swastyastu, {user?.name || 'Umat'}!</h1>
          <p className="text-gray-600">Selamat datang di dashboard {user?.role === 'admin' ? 'Pengurus Pura' : 'Donatur'}.</p>
        </div>
      </div>

      {/* Admin Tab Switcher */}
      {user?.role === 'admin' && (
        <div className="flex gap-1 border-b border-gray-200 mb-8 overflow-x-auto scrollbar-none">
          {[
            { id: 'overview', label: 'Ringkasan', icon: CreditCard },
            { id: 'pura_management', label: 'Kelola Pura', icon: MapPin },
            { id: 'event_management', label: 'Kelola Acara', icon: Calendar },
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
          TAB 1: OVERVIEW (Available for everyone)
          ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-primary to-orange-400 p-6 rounded-2xl text-white shadow-lg shadow-orange-100 transition-all hover:scale-[1.01]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-orange-50 mb-1 font-medium">Total Dana Punia</p>
                  <h2 className="text-3xl font-extrabold">Rp {totalPunia.toLocaleString('id-ID')}</h2>
                </div>
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <CreditCard size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:scale-[1.01]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-500 mb-1 font-medium">Pura Dibantu</p>
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
                <BarChart data={processDashboardChartData(donations, chartFilter)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              <h3 className="text-lg font-bold text-dark">Riwayat Transaksi</h3>
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
                  {donations.length === 0 ? (
                    <tr><td colSpan="4" className="py-4 text-center text-gray-500">Belum ada riwayat donasi</td></tr>
                  ) : donations.map((tx) => (
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
          TAB 2: KELOLA PURA (Admin Only)
          ======================================================== */}
      {activeTab === 'pura_management' && user?.role === 'admin' && (
        <div className="space-y-8">
          {/* Header Actions */}
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-dark">Pura yang Anda Kelola</h3>
            {!editingPura && (
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

          {/* Form Tambah Pura */}
          {showAddPura && (
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Gambar (Opsional)</label>
                  <input type="text" value={newPura.image_url} onChange={e => setNewPura({...newPura, image_url: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="https://..." />
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Gambar</label>
                  <input type="text" value={editingPura.image_url || ''} onChange={e => setEditingPura({...editingPura, image_url: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="https://..." />
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
                Anda belum mendaftarkan Pura. Klik tombol di atas untuk menambah Pura baru.
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
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">{pura.description}</p>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-gray-50">
                    <button onClick={() => { setEditingPura(pura); setEditingEvent(null); setShowAddPura(false); }} className="flex-1 bg-orange-50 text-primary py-2 rounded-lg font-semibold hover:bg-primary hover:text-white transition-all text-xs flex items-center justify-center gap-1">
                      <Edit size={14} />
                      <span>Edit Info Pura</span>
                    </button>
                    <a href={`/pura/${pura.id}`} target="_blank" rel="noopener noreferrer" className="px-3 bg-gray-50 text-gray-600 hover:bg-gray-100 py-2 rounded-lg font-semibold transition-all text-xs flex items-center justify-center">
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
                  <button type="button" onClick={() => setEditingEvent(null)} className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition-all text-sm">
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
                Mendaftarlah Pura terlebih dahulu di tab "Kelola Pura" sebelum bisa menambahkan acara.
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
    </div>
  );
};

export default Dashboard;
