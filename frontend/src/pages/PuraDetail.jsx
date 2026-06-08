import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheck, Calendar, MapPin, CheckCircle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const processChartData = (donationsList, filterType) => {
  const successDonations = donationsList;
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  if (filterType === 'weekly') {
    // Get Monday of the current week (local time)
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    return dayNames.map((name, index) => {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + index);
      const startOfDay = new Date(dayDate);
      startOfDay.setHours(0,0,0,0);
      const endOfDay = new Date(dayDate);
      endOfDay.setHours(23,59,59,999);
      
      const totalAmount = successDonations
        .filter(d => {
          const dDate = new Date(d.createdAt);
          return dDate >= startOfDay && dDate <= endOfDay;
        })
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
    console.log("processChartData successDonations:", successDonations, "currentYear:", currentYear);
    return monthNames.map((name, index) => {
      const totalAmount = successDonations
        .filter(d => {
          const dDate = new Date(d.createdAt);
          const monthMatch = dDate.getMonth() === index;
          const yearMatch = dDate.getFullYear() === currentYear;
          console.log(`Donation ${d.id}: d.createdAt=${d.createdAt}, parsedMonth=${dDate.getMonth()} (index=${index}), parsedYear=${dDate.getFullYear()} (currentYear=${currentYear}), monthMatch=${monthMatch}, yearMatch=${yearMatch}`);
          return monthMatch && yearMatch;
        })
        .reduce((sum, curr) => sum + Number(curr.amount), 0);
        
      return { name, amount: totalAmount };
    });
  }
  
  return [{ name: 'Belum ada data', amount: 0 }];
};

const PuraDetail = () => {
  const { id } = useParams();
  const [pura, setPura] = useState(null);
  const [events, setEvents] = useState([]);
  const [publicDonations, setPublicDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isMonthly, setIsMonthly] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chartFilter, setChartFilter] = useState('monthly');

  useEffect(() => {
    const fetchPura = async () => {
      try {
        const res = await api.get(`/puras/${id}`);
        setPura(res.data);
      } catch (error) {
        console.error('Failed to fetch pura detail', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchEvents = async () => {
      try {
        const res = await api.get(`/events/pura/${id}`);
        setEvents(res.data);
      } catch (error) {
        console.error('Failed to fetch pura events', error);
      }
    };

    const fetchPublicDonations = async () => {
      try {
        const res = await api.get(`/donations/public/pura/${id}`);
        setPublicDonations(res.data);
      } catch (error) {
        console.error('Failed to fetch public donations', error);
      }
    };

    fetchPura();
    fetchEvents();
    fetchPublicDonations();
  }, [id]);

  const handleDonation = async (e) => {
    e.preventDefault();
    if (!amount || amount < 10000) {
      alert('Minimal dana punia adalah Rp 10.000');
      return;
    }
    
    setIsProcessing(true);
    try {
      const res = await api.post('/donations', {
        pura_id: id,
        amount: Number(amount),
        message,
        is_anonymous: isAnonymous,
      });

      if (res.data.token) {
        window.snap.pay(res.data.token, {
          onSuccess: function(result){
            alert('Punia berhasil! Terima kasih atas keikhlasan Anda.');
            window.location.href = '/dashboard';
          },
          onPending: function(result){
            alert('Menunggu pembayaran Anda...');
            window.location.href = '/dashboard';
          },
          onError: function(result){
            alert('Pembayaran gagal.');
          },
          onClose: function(){
            alert('Anda menutup popup pembayaran sebelum menyelesaikannya.');
          }
        });
      }
    } catch (error) {
      console.error('Error creating donation:', error);
      alert('Gagal memproses donasi. Pastikan Anda sudah masuk (login) jika diperlukan.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="py-12 text-center text-gray-500">Memuat detail Pura...</div>;
  if (!pura) return <div className="py-12 text-center text-gray-500">Pura tidak ditemukan.</div>;

  const totalPuniaPura = publicDonations.reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <div className="py-8">
      {/* Header Image */}
      <div className="h-64 sm:h-96 rounded-3xl overflow-hidden mb-8 relative shadow-lg bg-gray-100">
        <img src={pura.image_url || 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&q=80&w=1200'} alt={pura.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&q=80&w=1200'; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
          <div className="p-8 text-white w-full">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl sm:text-5xl font-bold">{pura.name}</h1>
              {pura.is_verified && <ShieldCheck className="text-secondary" size={32} />}
            </div>
            <p className="flex items-center gap-2 text-gray-200">
              <MapPin size={18} /> {pura.address}
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Details & Events */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-dark mb-4">Tentang Pura</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
              {pura.description}
            </p>
          </section>

          {/* Jadwal Acara / Upacara Section */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-dark mb-6 flex items-center gap-2">
              <Calendar className="text-primary" />
              <span>Jadwal Upacara & Kegiatan</span>
            </h2>
            
            {events.length === 0 ? (
              <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                Belum ada jadwal upacara terdekat yang direncanakan.
              </div>
            ) : (
              <div className="space-y-6">
                {events.map((event) => {
                  const eventDate = new Date(event.date);
                  const day = eventDate.getDate();
                  const month = eventDate.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase();
                  const fullDate = eventDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

                  return (
                    <div key={event.id} className="group p-5 rounded-2xl border border-gray-100 hover:border-orange-200 bg-white hover:shadow-md transition-all duration-300 flex gap-5 items-start">
                      {/* Calendar Date Badge */}
                      <div className="flex-shrink-0 w-16 h-16 bg-orange-50 text-primary border border-orange-100 rounded-2xl flex flex-col items-center justify-center font-extrabold group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors duration-300">
                        <span className="text-2xl leading-none">{day}</span>
                        <span className="text-xs tracking-wider mt-0.5">{month}</span>
                      </div>

                      {/* Event Description */}
                      <div className="flex-grow space-y-2">
                        <h3 className="text-lg font-bold text-dark group-hover:text-primary transition-colors">{event.name}</h3>
                        <p className="text-xs text-gray-500 font-medium flex flex-wrap gap-x-4 gap-y-1">
                          <span className="flex items-center gap-1">
                            <Calendar size={13} className="text-primary group-hover:text-primary transition-colors" />
                            {fullDate}
                          </span>
                          {event.time && (
                            <span className="flex items-center gap-1">
                              <Clock size={13} className="text-primary group-hover:text-primary transition-colors" />
                              {event.time}
                            </span>
                          )}
                        </p>
                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{event.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Tren Dana Punia Chart Section */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-2">
              <h2 className="text-2xl font-bold text-dark flex items-center gap-2">
                <span className="text-primary font-bold"></span>
                <span>Tren Penerimaan Dana Punia</span>
              </h2>
              
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
            <p className="text-gray-500 text-sm mb-6">Grafik fluktuasi perolehan dana punia yang disalurkan umat dari waktu ke waktu.</p>
            
            {/* Total Punia Display */}
            <div className="bg-orange-50/60 border border-orange-100/50 rounded-2xl p-5 mb-6 animate-fade-in">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Total Dana Punia Terkumpul</p>
                <h3 className="text-3xl font-extrabold text-primary">Rp {totalPuniaPura.toLocaleString('id-ID')}</h3>
              </div>
            </div>
            
            {publicDonations.length === 0 ? (
              <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                Belum ada data transaksi punia masuk untuk pura ini.
              </div>
            ) : (
              <div className="h-64 mt-4 animate-fade-in">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={processChartData(publicDonations, chartFilter)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} tickFormatter={(value) => `Rp${value/1000}k`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value) => [`Rp ${value.toLocaleString('id-ID')}`, 'Dana Punia']}
                    />
                    <Bar dataKey="amount" fill="#F97316" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* Riwayat Penerimaan Punia Umat */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-dark mb-2 flex items-center gap-2">
              <span className="text-primary font-bold"></span>
              <span>Riwayat Dana Punia Umat</span>
            </h2>
            <p className="text-gray-500 text-sm mb-6">Daftar umat yang telah menyalurkan dana punia.</p>

            {publicDonations.length === 0 ? (
              <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                Belum ada riwayat punia masuk. Mari salurkan punia pertama Anda di kolom sebelah kanan!
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                {publicDonations.map((don) => {
                  const donDate = new Date(don.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                  const donAmount = Number(don.amount);
                  
                  return (
                    <div key={don.id} className="p-4 rounded-xl border border-gray-50 hover:bg-gray-55/50 transition-all flex justify-between items-start gap-4 hover:translate-x-0.5 duration-200">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-dark text-sm sm:text-base">
                            {don.is_anonymous ? 'Anonim' : (don.donatur?.name || 'Anonim')}
                          </h4>
                          {don.is_anonymous && (
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Anonim</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 font-medium">{donDate}</p>
                        {don.message && (
                          <p className="text-gray-600 text-sm bg-orange-50/40 p-2.5 rounded-xl border border-orange-50/30 italic mt-2">
                            "{don.message}"
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-primary font-extrabold text-sm sm:text-base whitespace-nowrap">
                          + Rp {donAmount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Donation Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 sticky top-8">
            <h3 className="text-xl font-bold text-dark mb-6">Salurkan Dana Punia</h3>
            <form onSubmit={handleDonation} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Nominal</label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {[25000, 50000, 100000, 500000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmount(val)}
                        className={`py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${amount == val ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary'}`}
                      >
                        Rp {val.toLocaleString('id-ID')}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Nominal lainnya"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pesan / Doa (Opsional)</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="Tulis pesan atau doa Anda..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">Sembunyikan nama saya (Anonim)</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isMonthly}
                      onChange={(e) => setIsMonthly(e.target.checked)}
                      className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">Jadikan donasi rutin (Bulanan)</span>
                  </label>
                </div>

                {amount >= 10000 && (
                  <div className="p-3 bg-gray-50 border border-gray-150 rounded-xl space-y-1.5 text-xs text-gray-500 animate-fade-in">
                    <p className="font-bold text-dark flex justify-between">
                      <span>Estimasi Dana Bersih Diterima Pura:</span>
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="bg-white p-2 rounded-lg border border-gray-100">
                        <span className="text-2xs text-gray-400 block font-medium">QRIS (Potongan 0.7%)</span>
                        <strong className="text-sm text-primary block mt-0.5">Rp {Math.round(amount * 0.993).toLocaleString('id-ID')}</strong>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-gray-100">
                        <span className="text-2xs text-gray-400 block font-medium">Bank VA (Potongan Rp4.000)</span>
                        <strong className="text-sm text-primary block mt-0.5">Rp {Math.max(0, amount - 4000).toLocaleString('id-ID')}</strong>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-relaxed italic mt-1.5">*Potongan biaya transaksi langsung dikenakan oleh sistem gerbang pembayaran Midtrans.</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`w-full text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg ${isProcessing ? 'bg-orange-300' : 'bg-primary hover:bg-orange-600 shadow-orange-200'}`}
                >
                  {isProcessing ? 'Memproses...' : 'Lanjutkan Pembayaran'}
                </button>
              </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PuraDetail;
