const sharp = require('sharp');
const path = require('path');

async function createFavicon() {
  try {
    const inputPath = path.join(__dirname, '..', 'public', 'healthpal.mx logo(only fig).png');
    const outputPath = path.join(__dirname, '..', 'public', 'favicon.ico');
    
    // Recortar el espacio transparente y redimensionar a 32x32
    await sharp(inputPath)
      .trim() // Recorta automáticamente el espacio transparente
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    
    console.log('✅ Favicon creado exitosamente en public/favicon.ico');
    console.log('📌 Recarga tu navegador con Ctrl+Shift+R para ver los cambios');
  } catch (error) {
    console.error('❌ Error creando favicon:', error);
  }
}

createFavicon();
