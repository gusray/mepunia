import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Heart, Bell, Calendar, Clock, Search } from 'lucide-react';
import api from '../services/api';

const Home = () => {
  const [puras, setPuras] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPuras = puras.filter(pura => 
    pura.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    pura.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const fetchPuras = async () => {
      try {
        const res = await api.get('/puras');
        setPuras(res.data);
      } catch (error) {
        console.error('Failed to fetch puras', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchEvents = async () => {
      try {
        const res = await api.get('/events');
        // We only take the top 3 upcoming events for the homepage highlight
        setEvents(res.data.slice(0, 3));
      } catch (error) {
        console.error('Failed to fetch events', error);
      }
    };

    fetchPuras();
    fetchEvents();
  }, []);

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-8 sm:p-16 overflow-hidden">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 text-orange-200 opacity-50">
          <svg width="400" height="400" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="M45.7,-76.3C58.9,-69.3,69.1,-55.3,77.5,-40.8C85.9,-26.3,92.5,-11.3,91.8,3.4C91.1,18.1,83.1,32.5,73.4,45C63.7,57.5,52.3,68.1,38.6,75.4C24.9,82.7,8.9,86.7,-6.2,88.4C-21.3,90.1,-35.5,89.5,-47.8,82.4C-60.1,75.3,-70.5,61.7,-78.2,46.7C-85.9,31.7,-90.9,15.3,-89.6,0.8C-88.3,-13.7,-80.7,-26.7,-72.1,-38.6C-63.5,-50.5,-53.9,-61.3,-41.7,-68.8C-29.5,-76.3,-14.8,-80.5,0.7,-81.6C16.2,-82.7,32.5,-83.3,45.7,-76.3Z" transform="translate(100 100)" />
          </svg>
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-dark leading-tight mb-6">
            Digitalisasi Dana Punia untuk <span className="text-primary">Kesejahteraan Umat</span>
          </h1>
          <p className="text-lg text-gray-700 mb-8">
            Platform Mepunia memudahkan Anda untuk menyalurkan dana punia ke berbagai Pura di seluruh Nusantara dengan aman, transparan, dan terpercaya.
          </p>
          <div className="flex gap-4">
            <a href="#explore" className="bg-primary text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all flex items-center gap-2">
              Mulai Punia <ArrowRight size={20} />
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-orange-100 text-primary rounded-xl flex items-center justify-center mb-4">
            <ShieldCheck size={24} />
          </div>
          <h3 className="text-xl font-bold text-dark mb-2">Transparan & Aman</h3>
          <p className="text-gray-600">Semua transaksi tercatat rapi dan laporan penggunaan dana dapat diakses secara publik.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-yellow-100 text-secondary rounded-xl flex items-center justify-center mb-4">
            <Heart size={24} />
          </div>
          <h3 className="text-xl font-bold text-dark mb-2">Cashless via Midtrans</h3>
          <p className="text-gray-600">Mendukung berbagai metode pembayaran digital seperti QRIS, Bank Transfer, dan e-Wallet.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Bell size={24} />
          </div>
          <h3 className="text-xl font-bold text-dark mb-2">Pengingat Hari Raya</h3>
          <p className="text-gray-600">Dapatkan notifikasi otomatis untuk hari raya besar Hindu agar tidak terlewat berpunia.</p>
        </div>
      </section>

      {/* Upcoming Events Section */}
      {events.length > 0 && (
        <section className="bg-gradient-to-br from-orange-50/50 to-amber-50/30 p-6 sm:p-10 rounded-3xl border border-orange-100/40">
          <div className="mb-8">
            <span className="text-primary font-bold text-xs tracking-wider uppercase">Agenda Terdekat</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-dark mt-1">Upacara Pura Mendatang</h2>
            <p className="text-gray-600 text-sm sm:text-base mt-1">Mari berpartisipasi dan salurkan Dana Punia untuk mendukung kelancaran upacara keagamaan.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const eventDate = new Date(event.date);
              const day = eventDate.getDate();
              const month = eventDate.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase();
              const fullDate = eventDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

              return (
                <div key={event.id} className="bg-white rounded-2xl p-6 border border-orange-100/30 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    {/* Date and Temple Tag */}
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-orange-100/60 text-primary border border-orange-100 rounded-xl flex flex-col items-center justify-center font-extrabold flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                        <span className="text-lg leading-none font-extrabold">{day}</span>
                        <span className="text-[10px] tracking-wide font-bold">{month}</span>
                      </div>
                      <span className="px-3 py-1 bg-gray-50 text-gray-500 border border-gray-100 text-xs font-semibold rounded-full truncate max-w-[150px]">
                        {event.pura?.name || 'Pura'}
                      </span>
                    </div>

                    {/* Event Name */}
                    <h3 className="font-bold text-dark text-lg group-hover:text-primary transition-colors mb-2 line-clamp-1">{event.name}</h3>
                    
                    {/* Time / Info */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 font-medium">
                      <Calendar size={13} className="text-primary flex-shrink-0" />
                      <span className="truncate">{fullDate}</span>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed mb-6">{event.description}</p>
                  </div>

                  {/* Actions */}
                  <Link to={`/pura/${event.pura_id}`} className="flex items-center justify-center gap-2 w-full text-center bg-orange-50 hover:bg-primary hover:text-white text-primary hover:shadow-md hover:shadow-orange-100 font-bold py-2.5 px-4 rounded-xl transition-all text-xs">
                    <span>Punia Sekarang</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Explore Pura Section */}
      <section id="explore">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-dark mb-2">Jelajahi Pura</h2>
            <p className="text-gray-600">Pilih Pura yang ingin Anda salurkan dana punia.</p>
          </div>
          
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Cari Pura berdasarkan nama/lokasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-orange-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm shadow-orange-50"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            <div className="col-span-full text-center py-12 text-gray-500">Memuat daftar Pura...</div>
          ) : filteredPuras.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-2xl border border-orange-100/50 border-dashed">
              {puras.length === 0 ? 'Belum ada Pura yang terdaftar.' : 'Tidak ada Pura yang cocok dengan pencarian Anda.'}
            </div>
          ) : filteredPuras.map((pura) => (
            <div key={pura.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all group">
              <div className="h-48 overflow-hidden bg-gray-100">
                <img 
                  src={pura.image_url || 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&q=80&w=800'} 
                  alt={pura.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&q=80&w=800'; }}
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-dark mb-1 flex items-center gap-2">
                  {pura.name} {pura.is_verified && <ShieldCheck size={16} className="text-secondary" />}
                </h3>
                <p className="text-sm text-gray-500 mb-4">{pura.address}</p>
                <p className="text-gray-600 text-sm line-clamp-2 mb-6">
                  {pura.description}
                </p>
                <Link to={`/pura/${pura.id}`} className="block w-full text-center bg-orange-50 text-primary font-semibold py-2 rounded-lg hover:bg-primary hover:text-white transition-colors">
                  Detail & Punia
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
