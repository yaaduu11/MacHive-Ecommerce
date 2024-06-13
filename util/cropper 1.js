
import Cropper from 'cropperjs';

const initCropper = () => {
  const image = document.getElementById('image');
  const input = document.getElementById('imageUpload');
  let cropper;

  input.addEventListener('change', function (e) {
    const files = e.target.files;
    const reader = new FileReader();
    reader.onload = function () {
      if (cropper) {
        cropper.destroy();
      }
      image.src = reader.result;
      cropper = new Cropper(image, {
        aspectRatio: 1,
        viewMode: 1,
        guides: true,
        minCropBoxWidth: 50,
        minCropBoxHeight: 50,
        autoCropArea: 0.5,
      });
    };
    reader.readAsDataURL(files[0]);
  });
};

export default initCropper;
