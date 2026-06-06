import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, FileText, CheckCircle, Upload, Shield, Calendar, ArrowRight, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import axios from 'axios';

const ApplyAdmin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    // Personal Info
    fullName: '',
    phone: '',
    email: '',
    jabatan: 'Kelian Pura',
    // Pura Info
    puraName: '',
    puraAddress: '',
    puraDesa: '',
    puraKecamatan: '',
    puraKabupaten: '',
    puraProvinsi: 'Bali',
    puraDescription: '',
    puraEstablishedYear: '',
    // Documents
    skDocumentType: 'sk_pengurus',
    skDocumentUrl: '',
    identityType: 'ktp',
    identityDocumentUrl: '',
  });

  // Local file states (for preview & upload name)
  const [skFile, setSkFile] = useState(null);
  const [identityFile, setIdentityFile] = useState(null);
  const [skUploadProgress, setSkUploadProgress] = useState(0);
  const [identityUploadProgress, setIdentityUploadProgress] = useState(0);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!storedUser.id) {
      navigate('/login');
      return;
    }
    setUser(storedUser);
    
    // Set default email & name from logged-in user
    setFormData(prev => ({
      ...prev,
      fullName: storedUser.name || '',
      email: storedUser.email || '',
    }));
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Upload to Cloudinary helper (direct client-side upload using FormData)
  const uploadFile = async (file, setProgress) => {
    // Read from Vite env or fallback to your credentials
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dzpkgzkjt';
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'mepunia_preset';

    try {
      const data = new FormData();
      data.append('file', file);
      data.append('upload_preset', uploadPreset);
      
      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        data,
        {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
          }
        }
      );
      
      return res.data.secure_url;
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      const errMsg = err.response?.data?.error?.message || err.message;
      throw new Error(`Gagal mengunggah ke Cloudinary: ${errMsg}`);
    }
  };

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;

    if (fileType === 'sk') {
      setSkFile(file);
      setFormData(prev => ({ ...prev, skDocumentUrl: '' }));
      setSkUploadProgress(0);
    } else {
      setIdentityFile(file);
      setFormData(prev => ({ ...prev, identityDocumentUrl: '' }));
      setIdentityUploadProgress(0);
    }
  };

  const startUploads = async () => {
    if (!skFile || !identityFile) {
      setError('Harap pilih kedua dokumen verifikasi terlebih dahulu');
      return false;
    }

    try {
      setError('');
      setLoading(true);
      
      const skUrl = await uploadFile(skFile, setSkUploadProgress);
      const identityUrl = await uploadFile(identityFile, setIdentityUploadProgress);

      setFormData(prev => ({
        ...prev,
        skDocumentUrl: skUrl,
        identityDocumentUrl: identityUrl,
      }));

      return { skUrl, identityUrl };
    } catch (err) {
      setError(err.message || 'Gagal mengunggah dokumen. Silakan coba lagi.');
      setLoading(false);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step !== 3) return;

    setLoading(true);
    setError('');

    // First upload the files
    const urls = await startUploads();
    if (!urls) {
      setLoading(false);
      return;
    }

    try {
      await api.post('/admin-applications', {
        full_name: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        jabatan: formData.jabatan,
        pura_name: formData.puraName,
        pura_address: formData.puraAddress,
        pura_desa: formData.puraDesa,
        pura_kecamatan: formData.puraKecamatan,
        pura_kabupaten: formData.puraKabupaten,
        pura_provinsi: formData.puraProvinsi,
        pura_description: formData.puraDescription,
        pura_established_year: formData.puraEstablishedYear ? parseInt(formData.puraEstablishedYear) : null,
        sk_document_type: formData.skDocumentType,
        sk_document_url: urls.skUrl,
        identity_type: formData.identityType,
        identity_document_url: urls.identityUrl,
      });

      alert('Pengajuan Anda berhasil dikirim! Silakan tunggu verifikasi oleh Superadmin.');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengirim pengajuan. Coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    // Validate current step
    if (step === 1) {
      if (!formData.fullName || !formData.phone || !formData.email) {
        setError('Harap isi semua bidang informasi pribadi');
        return;
      }
    } else if (step === 2) {
      if (!formData.puraName || !formData.puraAddress || !formData.puraDesa || !formData.puraKecamatan || !formData.puraKabupaten || !formData.puraDescription) {
        setError('Harap isi bidang informasi Pura yang wajib');
        return;
      }
    }
    setError('');
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex p-3 bg-orange-50 text-primary rounded-full mb-4">
          <Shield size={32} />
        </div>
        <h1 className="text-3xl font-extrabold text-dark">Pengajuan Pengurus Pura</h1>
        <p className="mt-2 text-gray-600">
          Lengkapi data prasyarat untuk memverifikasi Pura Anda dan mengaktifkan panel administrasi.
        </p>
      </div>

      {/* Steps Indicator */}
      <div className="mb-10 flex justify-between items-center relative max-w-md mx-auto">
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-200 -translate-y-1/2 z-0"></div>
        {[
          { num: 1, label: 'Informasi Diri', icon: User },
          { num: 2, label: 'Detail Pura', icon: MapPin },
          { num: 3, label: 'Berkas Verifikasi', icon: FileText },
        ].map((s) => {
          const Icon = s.icon;
          const isActive = step >= s.num;
          const isCurrent = step === s.num;
          return (
            <div key={s.num} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 ${
                  isActive
                    ? 'bg-primary text-white border-primary shadow-lg shadow-orange-100'
                    : 'bg-white text-gray-400 border-gray-200'
                } ${isCurrent ? 'ring-4 ring-orange-100' : ''}`}
              >
                <Icon size={18} />
              </div>
              <span className={`text-xs mt-2 font-semibold ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-2xl text-sm border border-red-100 text-center font-medium">
          {error}
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-orange-100/30">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: PERSONAL INFO */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-xl font-bold text-dark border-b border-gray-50 pb-3 flex items-center gap-2">
                <User className="text-primary" size={20} />
                <span>Informasi Pengurus Pura</span>
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nama Lengkap Pengurus</label>
                  <input
                    required
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 mt-1.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="Nama Lengkap sesuai KTP"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Nomor HP Aktif (WhatsApp)</label>
                  <input
                    required
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 mt-1.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="e.g. 081234567890"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email Aktif</label>
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 mt-1.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="nama@email.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Jabatan di Pura</label>
                  <select
                    name="jabatan"
                    value={formData.jabatan}
                    onChange={handleChange}
                    className="w-full px-4 py-3 mt-1.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white transition-all"
                  >
                    <option value="Bendesa Adat">Bendesa Adat</option>
                    <option value="Kelian Pura">Kelian Pura</option>
                    <option value="Bendahara">Bendahara</option>
                    <option value="Sekretaris">Sekretaris</option>
                    <option value="Pengurus Lainnya">Pengurus Lainnya</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PURA INFO */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-xl font-bold text-dark border-b border-gray-50 pb-3 flex items-center gap-2">
                <MapPin className="text-primary" size={20} />
                <span>Detail Pura yang Diajukan</span>
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nama Pura</label>
                  <input
                    required
                    type="text"
                    name="puraName"
                    value={formData.puraName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 mt-1.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="e.g. Pura Agung Besakih"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Tahun Berdiri (Opsional)</label>
                  <input
                    type="number"
                    name="puraEstablishedYear"
                    value={formData.puraEstablishedYear}
                    onChange={handleChange}
                    className="w-full px-4 py-3 mt-1.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="e.g. 1920"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Alamat Pura (Nama Jalan / Banjar)</label>
                <input
                  required
                  type="text"
                  name="puraAddress"
                  value={formData.puraAddress}
                  onChange={handleChange}
                  className="w-full px-4 py-3 mt-1.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="e.g. Jl. Besakih, Dusun Kedundung"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Desa / Kelurahan</label>
                  <input
                    required
                    type="text"
                    name="puraDesa"
                    value={formData.puraDesa}
                    onChange={handleChange}
                    className="w-full px-4 py-3 mt-1.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="Desa Adat Besakih"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Kecamatan</label>
                  <input
                    required
                    type="text"
                    name="puraKecamatan"
                    value={formData.puraKecamatan}
                    onChange={handleChange}
                    className="w-full px-4 py-3 mt-1.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="Kec. Rendang"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Kabupaten / Kota</label>
                  <input
                    required
                    type="text"
                    name="puraKabupaten"
                    value={formData.puraKabupaten}
                    onChange={handleChange}
                    className="w-full px-4 py-3 mt-1.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="Kab. Karangasem"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Provinsi</label>
                  <input
                    required
                    type="text"
                    name="puraProvinsi"
                    value={formData.puraProvinsi}
                    onChange={handleChange}
                    className="w-full px-4 py-3 mt-1.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="Bali"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Deskripsi Singkat Pura</label>
                <textarea
                  required
                  rows={3}
                  name="puraDescription"
                  value={formData.puraDescription}
                  onChange={handleChange}
                  className="w-full px-4 py-3 mt-1.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="Ceritakan singkat sejarah, piodalan, atau fasilitas pura..."
                />
              </div>
            </div>
          )}

          {/* STEP 3: DOCUMENTS */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-dark border-b border-gray-50 pb-3 flex items-center gap-2">
                <FileText className="text-primary" size={20} />
                <span>Dokumen Verifikasi Asosiasi</span>
              </h2>

              {/* SK Upload Card */}
              <div className="p-5 border border-orange-50 bg-orange-50/20 rounded-2xl space-y-4">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                  <div>
                    <h3 className="font-bold text-dark text-sm">1. Surat Keterangan Pengurus (Wajib)</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Sebagai bukti resmi kepengurusan Anda di Pura tersebut.</p>
                  </div>
                  <select
                    name="skDocumentType"
                    value={formData.skDocumentType}
                    onChange={handleChange}
                    className="px-3 py-1.5 border border-gray-250 rounded-lg text-xs font-semibold bg-white outline-none"
                  >
                    <option value="sk_pengurus">Surat Keputusan (SK)</option>
                    <option value="sk_desa_adat">Surat Keterangan Desa Adat</option>
                    <option value="surat_tugas">Surat Tugas</option>
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 cursor-pointer hover:bg-gray-50 hover:border-primary transition-all">
                    <Upload size={14} className="text-primary" />
                    <span>Pilih Berkas SK</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileChange(e, 'sk')}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-gray-500 truncate max-w-xs font-medium">
                    {skFile ? skFile.name : 'Belum ada file dipilih'}
                  </span>
                </div>

                {skUploadProgress > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-2xs text-gray-500 font-semibold">
                      <span>Mengunggah ke Cloudinary...</span>
                      <span>{skUploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-full rounded-full transition-all duration-150" style={{ width: `${skUploadProgress}%` }}></div>
                    </div>
                  </div>
                )}
              </div>

              {/* ID Upload Card */}
              <div className="p-5 border border-orange-50 bg-orange-50/20 rounded-2xl space-y-4">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                  <div>
                    <h3 className="font-bold text-dark text-sm">2. Verifikasi Identitas Pengurus (Wajib)</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Sebagai identitas pendukung verifikasi akun Anda.</p>
                  </div>
                  <select
                    name="identityType"
                    value={formData.identityType}
                    onChange={handleChange}
                    className="px-3 py-1.5 border border-gray-250 rounded-lg text-xs font-semibold bg-white outline-none"
                  >
                    <option value="ktp">KTP</option>
                    <option value="sim">SIM (Opsional)</option>
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 cursor-pointer hover:bg-gray-50 hover:border-primary transition-all">
                    <Upload size={14} className="text-primary" />
                    <span>Pilih Berkas Identitas</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileChange(e, 'identity')}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-gray-500 truncate max-w-xs font-medium">
                    {identityFile ? identityFile.name : 'Belum ada file dipilih'}
                  </span>
                </div>

                {identityUploadProgress > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-2xs text-gray-500 font-semibold">
                      <span>Mengunggah ke Cloudinary...</span>
                      <span>{identityUploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-full rounded-full transition-all duration-150" style={{ width: `${identityUploadProgress}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-between pt-6 border-t border-gray-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-gray-50 border border-gray-150 rounded-xl text-sm font-semibold text-gray-650 hover:bg-gray-100 transition-all"
              >
                <ArrowLeft size={16} />
                <span>Kembali</span>
              </button>
            ) : (
              <div></div>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-orange-600 shadow-md shadow-orange-100 transition-all ml-auto"
              >
                <span>Lanjut</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-extrabold hover:bg-orange-600 shadow-lg shadow-orange-100 transition-all ml-auto"
              >
                {loading ? (
                  <span>Mengirim Pengajuan...</span>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    <span>Kirim Pengajuan</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyAdmin;
