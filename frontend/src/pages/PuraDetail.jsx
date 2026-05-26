import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheck, Calendar, MapPin, CheckCircle } from 'lucide-react';

const mockPura = {
  id: '1',
  name: 'Pura Besakih',
  address: 'Desa Besakih, Kec. Rendang, Kabupaten Karangasem, Bali',
  image_url: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&q=80&w=1200',
  description: 'Pura Besakih adalah kompleks pura terbesar dan paling suci di Bali, Indonesia. Terletak di lereng Gunung Agung, gunung berapi utama di Bali. Kompleks ini terdiri dari 23 pura yang saling berhubungan, dengan Pura Penataran Agung sebagai pura utamanya.',
  verified: true,
};

const PuraDetail = () => {
  const { id } = useParams();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isMonthly, setIsMonthly] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const handleDonation = (e) => {
    e.preventDefault();
    if (!amount || amount < 10000) {
      alert('Minimal dana punia adalah Rp 10.000');
      return;
    }
    // Simulate Midtrans Snap
    setShowQR(true);
  };

  return (
    <div className="py-8">
      {/* Header Image */}
      <div className="h-64 sm:h-96 rounded-3xl overflow-hidden mb-8 relative shadow-lg">
        <img src={mockPura.image_url} alt={mockPura.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
          <div className="p-8 text-white w-full">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl sm:text-5xl font-bold">{mockPura.name}</h1>
              {mockPura.verified && <ShieldCheck className="text-secondary" size={32} />}
            </div>
            <p className="flex items-center gap-2 text-gray-200">
              <MapPin size={18} /> {mockPura.address}
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Details & Reports */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-dark mb-4">Tentang Pura</h2>
            <p className="text-gray-600 leading-relaxed">
              {mockPura.description}
            </p>
          </section>

          <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-dark mb-4 flex items-center gap-2">
              <CheckCircle className="text-green-500" /> Laporan Transparansi
            </h2>
            <p className="text-sm text-gray-500 mb-6">Laporan penggunaan dana punia yang diunggah oleh pengurus Pura.</p>
            
            <div className="space-y-4">
              {[1, 2].map((item) => (
                <div key={item} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-orange-50 text-primary rounded-lg">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-dark">Upacara Piodalan</h4>
                      <p className="text-sm text-gray-500">20 April 2026</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-dark">Rp 5.000.000</p>
                    <button className="text-sm text-primary hover:underline">Lihat Bukti</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Donation Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 sticky top-8">
            <h3 className="text-xl font-bold text-dark mb-6">Salurkan Dana Punia</h3>
            
            {showQR ? (
              <div className="text-center space-y-4">
                <div className="bg-gray-100 p-8 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <div className="w-48 h-48 bg-white mx-auto mb-4 border flex items-center justify-center">
                       <span className="text-gray-400 font-mono text-sm">[QRIS SIMULATION]</span>
                    </div>
                    <p className="font-bold text-dark text-xl mb-1">Rp {Number(amount).toLocaleString('id-ID')}</p>
                    <p className="text-sm text-gray-500">Scan dengan aplikasi M-Banking/e-Wallet Anda</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowQR(false)}
                  className="text-gray-500 hover:text-dark text-sm mt-4 underline"
                >
                  Batal / Kembali
                </button>
              </div>
            ) : (
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
                  className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
                >
                  Lanjutkan Pembayaran
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PuraDetail;
