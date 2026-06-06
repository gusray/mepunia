const { User } = require('./models');
const { connectDB } = require('./config/database');

const makeAdmin = async () => {
  const email = process.argv[2];
  const role = process.argv[3] || 'admin';

  if (!email) {
    console.log('Penggunaan: node src/makeAdmin.js <email_user> [role]');
    console.log('Contoh: node src/makeAdmin.js test@example.com superadmin');
    process.exit(1);
  }

  if (!['user', 'admin', 'superadmin'].includes(role)) {
    console.log('Role tidak valid! Pilih antara: user, admin, superadmin');
    process.exit(1);
  }

  try {
    await connectDB();
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log(`Gagal: User dengan email "${email}" tidak ditemukan.`);
      process.exit(1);
    }

    user.role = role;
    await user.save();

    console.log(`Sukses: Peran user "${email}" telah diubah menjadi "${role}".`);
    process.exit(0);
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
    process.exit(1);
  }
};

makeAdmin();
