import { useState } from 'react';
import { CreditCard, Calendar, Bell, Download, Search } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockDonations = [
  { id: '1', pura: 'Pura Besakih', date: '15 May 2026', amount: 150000, status: 'Success' },
  { id: '2', pura: 'Pura Uluwatu', date: '01 May 2026', amount: 50000, status: 'Success' },
  { id: '3', pura: 'Pura Tanah Lot', date: '20 Apr 2026', amount: 100000, status: 'Success' },
];

const data = [
  { name: 'Jan', amount: 100000 },
  { name: 'Feb', amount: 150000 },
  { name: 'Mar', amount: 50000 },
  { name: 'Apr', amount: 100000 },
  { name: 'May', amount: 200000 },
  { name: 'Jun', amount: 0 },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark mb-2">Om Swastyastu, Budi!</h1>
        <p className="text-gray-600">Selamat datang di dashboard donatur Anda.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-primary to-orange-400 p-6 rounded-2xl text-white shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-orange-100 mb-1">Total Dana Punia</p>
              <h2 className="text-3xl font-bold">Rp 650.000</h2>
            </div>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <CreditCard size={24} />
            </div>
          </div>
          <p className="text-sm text-orange-100 flex items-center gap-1">
            <span className="bg-white/20 px-2 py-1 rounded text-xs">+Rp 200.000 bulan ini</span>
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-500 mb-1">Pura Dibantu</p>
              <h2 className="text-3xl font-bold text-dark">3</h2>
            </div>
            <div className="p-2 bg-orange-50 text-primary rounded-lg">
              <Calendar size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-500 mb-1">Reminder Aktif</p>
              <h2 className="text-3xl font-bold text-dark">2</h2>
            </div>
            <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
              <Bell size={24} />
            </div>
          </div>
          <p className="text-sm text-gray-500">Galungan (2 minggu lagi)</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Chart Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-dark">Grafik Punia 2026</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  {mockDonations.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-4 text-dark font-medium">{tx.pura}</td>
                      <td className="py-4 text-gray-500 text-sm">{tx.date}</td>
                      <td className="py-4 text-dark font-bold text-right">Rp {tx.amount.toLocaleString()}</td>
                      <td className="py-4 text-right">
                        <span className="inline-block px-3 py-1 bg-green-50 text-green-600 text-xs font-semibold rounded-full">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="w-full mt-4 py-3 text-sm text-primary font-semibold hover:bg-orange-50 rounded-xl transition-colors">
              Lihat Semua Riwayat
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-dark mb-4 flex items-center gap-2">
              <Bell size={20} className="text-primary" /> Reminder Hari Raya
            </h3>
            <div className="space-y-4">
              <div className="p-4 border border-orange-100 bg-orange-50 rounded-xl flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-dark text-sm">Hari Raya Galungan</h4>
                  <p className="text-xs text-gray-500">24 Mei 2026</p>
                </div>
                <div className="w-10 h-6 bg-primary rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="p-4 border border-gray-100 rounded-xl flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-dark text-sm">Hari Raya Kuningan</h4>
                  <p className="text-xs text-gray-500">3 Juni 2026</p>
                </div>
                <div className="w-10 h-6 bg-gray-200 rounded-full relative cursor-pointer">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
            <button className="w-full mt-4 py-2 border border-dashed border-gray-300 text-gray-500 rounded-lg text-sm hover:border-primary hover:text-primary transition-colors">
              + Tambah Reminder
            </button>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-dark p-6 rounded-2xl shadow-sm text-white">
            <h3 className="text-lg font-bold mb-2">Laporan Tahunan</h3>
            <p className="text-gray-400 text-sm mb-4">Unduh rekap dana punia Anda untuk keperluan pajak (jika ada).</p>
            <button className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
              <Download size={16} /> Unduh PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
