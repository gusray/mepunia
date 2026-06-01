import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheck, Calendar, MapPin, CheckCircle, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const processChartData = (donationsList) => {
  const sorted = [...donationsList].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const groups = {};
  sorted.forEach(d => {
    const dateStr = new Date(d.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const amount = Number(d.amount);
    groups[dateStr] = (groups[dateStr] || 0) + amount;
  });
  const data = Object.keys(groups).map(date => ({
    name: date,
    amount: groups[date]
  }));
  if (data.length === 0) {
    return [{ name: 'Belum ada data', amount: 0 }];
  }
  return data;
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
            <h2 className="text-2xl font-bold text-dark mb-2 flex items-center gap-2">
              <span className="text-primary font-bold"></span>
              <span>Tren Penerimaan Dana Punia</span>
            </h2>
            <p className="text-gray-500 text-sm mb-6">Grafik fluktuasi perolehan dana punia yang disalurkan umat dari waktu ke waktu.</p>
            
            {publicDonations.length === 0 ? (
              <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                Belum ada data transaksi punia masuk untuk pura ini.
              </div>
            ) : (
              <div className="h-64 mt-4 animate-fade-in">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={processChartData(publicDonations)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAmountPura" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} tickFormatter={(value) => `Rp${value/1000}k`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value) => [`Rp ${value.toLocaleString('id-ID')}`, 'Dana Punia']}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#F97316" strokeWidth={3} fillOpacity={1} fill="url(#colorAmountPura)" />
                  </AreaChart>
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
