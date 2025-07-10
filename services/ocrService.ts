export const ocrImage = async (uri: string) => {
  // Đọc file ảnh thành base64
  const response = await fetch(uri);
  const blob = await response.blob();

  // Chuyển blob sang base64
  const toBase64 = (file: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const base64 = (await toBase64(blob)).replace(/^data:image\/(png|jpg|jpeg);base64,/, "");

  // Lấy key từ biến môi trường Expo
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY!;
  console.log("API KEY:", apiKey);
  const visionRes = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64 },
            features: [{ type: "TEXT_DETECTION" }],
          },
        ],
      }),
    }
  );
  const data = await visionRes.json();
  console.log("Google Vision response:", data);
  const text =
    data.responses &&
    data.responses[0] &&
    data.responses[0].fullTextAnnotation &&
    data.responses[0].fullTextAnnotation.text
      ? data.responses[0].fullTextAnnotation.text
      : "OCR failed";
  return { text };
}; 