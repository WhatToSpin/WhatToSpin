const { app } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
};

const filepath = {
  src: isDev ? path.join(__dirname, '../src') : path.join(app.getAppPath(), 'src'),
  utils: __dirname,
  
  assets: isDev ? path.join(__dirname, '../src/assets') : path.join(app.getAppPath(), 'src/assets'),
  icons: isDev ? path.join(__dirname, '../src/assets/icons') : path.join(app.getAppPath(), 'src/assets/icons'),
  
  unknownCover: isDev 
    ? path.join(__dirname, '../src/assets/covers/unknown.png')
    : path.join(app.getAppPath(), 'src/assets/covers/unknown.png'),
  
  userData: app.getPath('userData'),
  get userCovers() { 
    return ensureDir(path.join(app.getPath('userData'), 'covers')); 
  },
  
  isDev,
  
  getCoverPath(filename) {
    return path.join(this.userCovers, filename);
  },
  
  ensureUserDirectories() {
    ensureDir(this.userCovers);
  },
  
  logUserDataLocation() {
    if (this.isDev) {
      console.log('User data directory:', this.userData);
      console.log('Covers directory:', this.userCovers);
    }
  }
};

module.exports = filepath;