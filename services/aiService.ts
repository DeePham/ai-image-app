import { getImageDimensions } from "@/utils/helper";

export interface GenerateImageRequest {
  prompt: string;
  model: string;
  aspectRatio: string;
}

export const AIService = {
  async generateImage(request: GenerateImageRequest): Promise<string> {
    const MODEL_URL = `https://router.huggingface.co/hf-inference/models/${request.model}`;
    const { width, height } = getImageDimensions(request.aspectRatio);

    try {
      const response = await fetch(MODEL_URL, {
        headers: {
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_API_KEY}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: request.prompt,
          parameters: { width, height },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate image");
      }

      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.readAsDataURL(blob);
        fileReader.onload = () => {
          resolve(fileReader.result as string);
        };
        fileReader.onerror = () => {
          reject(new Error("Failed to convert blob to base64"));
        };
      });
    } catch (error) {
      console.error("AI Service error:", error);
      throw error;
    }
  },
};
