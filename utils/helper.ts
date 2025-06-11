export const getImageDimensions = (aspectRatio: string, baseSize = 512) => {
  const [width, height] = aspectRatio.split("/").map(Number);
  const scaleFactor = baseSize / Math.sqrt(width * height);

  let calculatedWidth = Math.round(width * scaleFactor);
  let calculatedHeight = Math.round(height * scaleFactor);

  // Ensure dimensions are multiples of 16 (AI model requirements)
  calculatedWidth = Math.floor(calculatedWidth / 16) * 16;
  calculatedHeight = Math.floor(calculatedHeight / 16) * 16;

  return {
    width: calculatedWidth,
    height: calculatedHeight,
  };
};

/**
 * Lý do kỹ thuật của AI models:
 * Convolutional Neural Networks (CNN): Các mô hình AI như Stable Diffusion sử dụng CNN với nhiều tầng pooling và convolution. 
 * Mỗi tầng thường giảm kích thước xuống 2x, nên cần kích thước chia hết cho 2^n.
 * U-Net Architecture: Stable Diffusion sử dụng U-Net với 4 tầng downsampling:
 * Input → /2 → /4 → /8 → /16
 * Để đảm bảo không bị lỗi dimension mismatch khi upsampling ngược lại
 * Memory Efficiency: Kích thước chia hết cho 16 giúp tối ưu việc sử dụng GPU memory và tăng tốc tính toán.
 * VAE (Variational Autoencoder): Component này encode/decode với factor 8, nên cần kích thước chia hết cho 8 (và 16 để an toàn hơn).
 */
