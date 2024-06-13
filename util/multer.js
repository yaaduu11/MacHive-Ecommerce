const multer = require('multer')
const path = require('path')

// MULTER DISK STORAGE
function generateStorage(destination){

    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
          cb(null, `./public/admin/uploads/${destination}`);
        },
        filename: function (req, file, cb) {
          const fileExtention = path.extname(file.originalname)
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const filename = uniqueSuffix + fileExtention
          cb(null,filename );
        }
    });

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    const fileFilter = function (req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        if (imageExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files with extensions .jpg, .jpeg, .png, .gif are allowed!'), false);
        }
    };
    
    return multer({
      storage: storage,
      fileFilter: fileFilter,
      limits: {
          fileSize: 5 * 1024 * 1024,
      },
  });
   
}


module.exports = generateStorage