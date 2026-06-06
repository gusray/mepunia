const cloudinary = require('cloudinary').v2;

// 1. Configure Cloudinary
cloudinary.config({
  cloud_name: 'dzpkgzkjt',
  api_key: '467415877195723',
  api_secret: 'FEZ9RFYWbhe9gZr_cD7P5o1ZS6A'
});

const run = async () => {
  try {
    const imageUrl = 'https://res.cloudinary.com/demo/image/upload/dog.jpg';
    console.log('Uploading sample image to Cloudinary...');
    
    // 2. Upload an image
    const uploadResult = await cloudinary.uploader.upload(imageUrl, {
      folder: 'mepunia_test'
    });
    console.log('Upload successful!');
    console.log('Secure URL:', uploadResult.secure_url);
    console.log('Public ID:', uploadResult.public_id);
    
    // 3. Get image details
    console.log('\n--- Image Metadata ---');
    console.log('Width:', uploadResult.width);
    console.log('Height:', uploadResult.height);
    console.log('Format:', uploadResult.format);
    console.log('File Size (bytes):', uploadResult.bytes);
    
    // 4. Transform the image
    // f_auto (fetch_format: 'auto') -> Automatically selects the best image format (e.g. WebP, AVIF) based on browser support.
    // q_auto (quality: 'auto') -> Automatically adjusts the level of compression to minimize file size while maintaining visual quality.
    const transformedUrl = cloudinary.url(uploadResult.public_id, {
      fetch_format: 'auto',
      quality: 'auto',
      secure: true
    });
    
    console.log('\nDone! Click link below to see optimized version of the image. Check the size and the format.');
    console.log(transformedUrl);
  } catch (error) {
    console.error('Error during Cloudinary operations:', error);
  }
};

run();
