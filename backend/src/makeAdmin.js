const { User } = require('./models');

const email = process.argv[2];
if (!email) {
  console.log('Gunakan perintah: node src/makeAdmin.js <email>');
  process.exit(1);
}

const run = async () => {
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log(`User dengan email ${email} tidak ditemukan.`);
      process.exit(1);
    }
    
    await user.update({ role: 'admin' });
    console.log(`================================================`);
    console.log(`SUKSES: Mengubah peran user menjadi ADMIN!`);
    console.log(`Nama : ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`================================================`);
    process.exit(0);
  } catch (error) {
    console.error('Error saat mengubah peran:', error);
    process.exit(1);
  }
};

run();
