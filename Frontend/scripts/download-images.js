const https = require('https');
const fs = require('fs');
const path = require('path');

const images = [
  {
    url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&auto=format',
    filename: 'classroom.jpg'
  },
  {
    url: 'https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1200&auto=format',
    filename: 'school.jpg'
  },
  {
    url: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=1200&auto=format',
    filename: 'students.jpg'
  },
  {
    url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=1200&auto=format',
    filename: 'library.jpg'
  },
  {
    url: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?q=80&w=1200&auto=format',
    filename: 'digital.jpg'
  }
];

const downloadImage = (url, filename) => {
  const filepath = path.join(__dirname, '../public/images', filename);
  
  https.get(url, (response) => {
    const fileStream = fs.createWriteStream(filepath);
    response.pipe(fileStream);

    fileStream.on('finish', () => {
      fileStream.close();
      console.log(`Downloaded: ${filename}`);
    });
  }).on('error', (err) => {
    console.error(`Error downloading ${filename}:`, err.message);
  });
};

// Create images directory if it doesn't exist
const imagesDir = path.join(__dirname, '../public/images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Download all images
images.forEach(img => {
  downloadImage(img.url, img.filename);
}); 