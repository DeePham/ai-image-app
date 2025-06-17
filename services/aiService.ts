import { getImageDimensions } from "@/utils/helper";

export interface GenerateImageRequest {
  prompt: string;
  model: string;
  aspectRatio: string;
}

export const AIService = {
  async generateImage(request: GenerateImageRequest): Promise<string> {
    const { width, height } = getImageDimensions(request.aspectRatio);

    try {
      // Pollinations API endpoint
      const pollinationsUrl = `https://pollinations.ai/p/${encodeURIComponent(
        request.prompt
      )}?width=${width}&height=${height}&model=${
        request.model
      }&nologo=true&enhance=true`;

      console.log("Generating image with Pollinations API...");
      console.log("URL:", pollinationsUrl);

      // Fetch image from Pollinations
      const response = await fetch(pollinationsUrl);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      // Convert to blob then to base64
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.readAsDataURL(blob);
        fileReader.onload = () => {
          console.log("Image generated successfully!");
          resolve(fileReader.result as string);
        };
        fileReader.onerror = () => {
          reject(new Error("Failed to convert image to base64"));
        };
      });
    } catch (error) {
      console.error("Pollinations API error:", error);
      throw error;
    }
  },
};
