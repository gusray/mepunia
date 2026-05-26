import { useState, useEffect } from 'react';
import { CreditCard, Calendar, Bell, Download, Search } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [donations, setDonations] = useState([]);
  const [totalPunia, setTotalPunia] = useState(0);
  const [puraCount, setPuraCount] = useState(0);
  const [user, setUser] = useState(null);
  
  // Admin Form States
  const [showAddPura, setShowAddPura] = useState(false);
  const [newPura, setNewPura] = useState({ name: '', address: '', description: '', image_url: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);

    const fetchDonations = async () => {
      try {
        const res = await api.get('/donations/history');
        const data = res.data;
        setDonations(data);
        
        // Calculate stats
        const total = data.reduce((acc, curr) => acc + Number(curr.amount), 0);
        setTotalPunia(total);
        
        const uniquePuras = new Set(data.map(d => d.pura_id));
        setPuraCount(uniquePuras.size);
      } catch (error) {
        console.error('Failed to fetch donations', error);
      }
    };
    fetchDonations();
  }, []);

  // Format data for chart (simple mock grouping for MVP)
  const chartData = [
    { name: 'Prev', amount: 0 },
    { name: 'Current', amount: totalPunia },
  ];

  const handleAddPura = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/puras', newPura);
      alert('Pura berhasil ditambahkan!');
      setShowAddPura(false);
      setNewPura({ name: '', address: '', description: '', image_url: '' });
      // In a real app, you might want to refresh a list of admin's puras here
    } catch (error) {
      console.error('Failed to add pura', error);
      alert('Gagal menambahkan pura.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-dark mb-2">Om Swastyastu, {user?.name || 'Umat'}!</h1>
          <p className="text-gray-600">Selamat datang di dashboard {user?.role === 'admin' ? 'Pengurus Pura' : 'Donatur'}.</p>
        </div>
        {user?.role === 'admin' && (
          <button 
            onClick={() => setShowAddPura(!showAddPura)}
            className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
          >
            {showAddPura ? 'Batal' : '+ Tambah Pura Baru'}
          </button>
        )}
      </div>

      {showAddPura && user?.role === 'admin' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 mb-8 animate-fade-in">
          <h3 className="text-xl font-bold text-dark mb-4">Form Tambah Pura Baru</h3>
          <form onSubmit={handleAddPura} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pura</label>
                <input required type="text" value={newPura.name} onChange={e => setNewPura({...newPura, name: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-primary focus:border-transparent outline-none" placeholder="Pura Ulun Danu" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                <input required type="text" value={newPura.address} onChange={e => setNewPura({...newPura, address: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-primary focus:border-transparent outline-none" placeholder="Jl. Raya Bedugul..." />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL Gambar (Opsional)</label>
              <input type="text" value={newPura.image_url} onChange={e => setNewPura({...newPura, image_url: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-primary focus:border-transparent outline-none" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Pura</label>
              <textarea required value={newPura.description} onChange={e => setNewPura({...newPura, description: e.target.value})} rows={3} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-primary focus:border-transparent outline-none" placeholder="Ceritakan sejarah atau info Pura..." />
            </div>
            <button type="submit" disabled={isSubmitting} className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors">
              {isSubmitting ? 'Menyimpan...' : 'Simpan Data Pura'}
            </button>
          </form>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-primary to-orange-400 p-6 rounded-2xl text-white shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-orange-100 mb-1">Total Dana Punia</p>
              <h2 className="text-3xl font-bold">Rp {totalPunia.toLocaleString('id-ID')}</h2>
            </div>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <CreditCard size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-500 mb-1">Pura Dibantu</p>
              <h2 className="text-3xl font-bold text-dark">{puraCount}</h2>
            </div>
            <div className="p-2 bg-orange-50 text-primary rounded-lg">
              <Calendar size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-1 gap-8">
        <div className="space-y-8">
          {/* Chart Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-dark">Grafik Punia 2026</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `Rp${value/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`Rp ${value.toLocaleString()}`, 'Punia']}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#F97316" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* History Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-dark">Riwayat Transaksi</h3>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Cari pura..." className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
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
                    <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
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
      </div>
    </div>
  );
};

export default Dashboard;
