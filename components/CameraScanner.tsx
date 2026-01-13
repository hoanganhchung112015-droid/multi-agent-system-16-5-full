// Tìm trong CameraScanner.tsx hàm getCroppedImg và sửa phần return thành:
  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string); // Trả về Base64
        reader.readAsDataURL(file);
      } else {
        reject(new Error('Canvas is empty'));
      }
    }, 'image/jpeg', 0.8); // Nén 0.8 để nhẹ dung lượng
  });
