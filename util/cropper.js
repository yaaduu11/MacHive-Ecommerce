
document.addEventListener('DOMContentLoaded', function () {
    const image = document.getElementById('image');
    const input = document.getElementById('imageUpload');
    let cropper;

    input.addEventListener('change', function (e) {
      const files = e.target.files;
      const preview = document.getElementById('imagePreview');

      if (files.length === 0) {
        return;
      }

      const file = files[0];
      const reader = new FileReader();

      reader.onload = function (event) {
        image.style.display = 'block';
        image.src = event.target.result;

        if (cropper) {
          cropper.destroy();
        }

        cropper = new Cropper(image, {
          aspectRatio: 1,
          viewMode: 1,
          guides: true,
          minCropBoxWidth: 30,
          minCropBoxHeight: 30,
          autoCropArea: 0.5,
        });
      };

      reader.readAsDataURL(file);
    });
  });