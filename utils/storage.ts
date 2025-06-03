import AsyncStorage from "@react-native-async-storage/async-storage";

export interface GeneratedImage {
  id: string;
  imageUrl: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  createdAt: string;
}

const STORAGE_KEY = "generated_images";

export const saveImageToHistory = async (
  image: Omit<GeneratedImage, "id" | "createdAt">
) => {
  try {
    const existingImages = await getImageHistory();
    const newImage: GeneratedImage = {
      ...image,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updatedImages = [newImage, ...existingImages];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedImages));
    return newImage;
  } catch (error) {
    console.error("Error saving image to history:", error);
  }
};

export const getImageHistory = async (): Promise<GeneratedImage[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting image history:", error);
    return [];
  }
};

export const deleteImageFromHistory = async (id: string) => {
  try {
    const existingImages = await getImageHistory();
    const filteredImages = existingImages.filter((image) => image.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredImages));
  } catch (error) {
    console.error("Error deleting image from history:", error);
  }
};

export const clearImageHistory = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing image history:", error);
  }
};
