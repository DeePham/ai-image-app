import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { supabase } from "./supabase";

export interface GeneratedImage {
  id: string;
  imageUrl: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  createdAt: string;
  userId?: string;
}

// Save image to Supabase database with base64
export const saveImageToHistory = async (
  image: Omit<GeneratedImage, "id" | "createdAt">
) => {
  try {
    console.log("Saving image to database...");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("generated_images")
      .insert({
        user_id: user.id,
        image_url: image.imageUrl, // Store base64 directly
        prompt: image.prompt,
        model: image.model,
        aspect_ratio: image.aspectRatio,
      })
      .select()
      .single();

    if (error) {
      console.error("Database save error:", error);
      throw error;
    }

    console.log("Image saved successfully to database");
    return {
      id: data.id,
      imageUrl: data.image_url,
      prompt: data.prompt,
      model: data.model,
      aspectRatio: data.aspect_ratio,
      createdAt: data.created_at,
      userId: data.user_id,
    };
  } catch (error) {
    console.error("Error saving image to history:", error);
    throw error;
  }
};

// Get images from Supabase
export const getImageHistory = async (): Promise<GeneratedImage[]> => {
  try {
    console.log("Fetching images from database...");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log("User not authenticated");
      return [];
    }

    const { data, error } = await supabase
      .from("generated_images")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database fetch error:", error);
      throw error;
    }

    console.log(`Fetched ${data?.length || 0} images from database`);

    return (
      data?.map((item) => ({
        id: item.id,
        imageUrl: item.image_url,
        prompt: item.prompt,
        model: item.model,
        aspectRatio: item.aspect_ratio,
        createdAt: item.created_at,
        userId: item.user_id,
      })) || []
    );
  } catch (error) {
    console.error("Error getting image history:", error);
    return [];
  }
};

export const deleteImageFromHistory = async (id: string) => {
  try {
    console.log("Deleting image from database:", id);

    const { error } = await supabase
      .from("generated_images")
      .delete()
      .eq("id", id);

    if (error) throw error;
    console.log("Image deleted successfully");
  } catch (error) {
    console.error("Error deleting image from history:", error);
    throw error;
  }
};

export const clearImageHistory = async () => {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return;

    console.log("Clearing all images for user:", user.id);

    const { error } = await supabase
      .from("generated_images")
      .delete()
      .eq("user_id", user.id);

    if (error) throw error;
    console.log("All images cleared successfully");
  } catch (error) {
    console.error("Error clearing image history:", error);
    throw error;
  }
};

// Download image to device
export const downloadImage = async (imageUrl: string, fileName: string) => {
  try {
    console.log("Downloading image:", fileName);

    // Request permission first
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Permission to access media library is required");
    }

    let fileUri: string;

    if (imageUrl.startsWith("data:")) {
      // Handle base64 data
      console.log("Converting base64 to file...");
      fileUri = FileSystem.documentDirectory + fileName + ".png";

      // Extract base64 data (remove data:image/png;base64, prefix)
      const base64Data = imageUrl.split(",")[1];

      // Write base64 to file
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } else {
      // Handle regular URL
      console.log("Downloading from URL...");
      fileUri = FileSystem.documentDirectory + fileName + ".png";
      const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);

      if (downloadResult.status !== 200) {
        throw new Error("Download failed");
      }
    }

    // Save to media library
    const asset = await MediaLibrary.createAssetAsync(fileUri);
    console.log("Image saved to gallery:", asset.uri);

    // Clean up temporary file
    await FileSystem.deleteAsync(fileUri, { idempotent: true });

    return asset.uri;
  } catch (error) {
    console.error("Error downloading image:", error);
    throw error;
  }
};
