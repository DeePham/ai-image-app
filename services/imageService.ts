import { supabase } from "@/utils/supabase";

export interface GeneratedImage {
  id: string;
  imageUrl: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  createdAt: string;
  userId?: string;
}

export const ImageService = {
  async saveToHistory(
    image: Omit<GeneratedImage, "id" | "createdAt">
  ): Promise<GeneratedImage> {
    try {
      console.log("Saving image to storage and database...");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("User not authenticated");
      }

      const base64Data = image.imageUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      const timestamp = new Date().getTime();
      const filename = `${user.id}/${timestamp}.jpg`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('generated-images')
        .upload(filename, byteArray, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('generated-images')
        .getPublicUrl(filename);

      const { data, error } = await supabase
        .from("generated_images")
        .insert({
          user_id: user.id,
          image_url: publicUrl,
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

      console.log("Image saved successfully to storage and database");
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
  },

  async getHistory(): Promise<GeneratedImage[]> {
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
  },

  async deleteFromHistory(id: string): Promise<void> {
    try {
      console.log("Deleting image from database:", id);

      const { data: imageData, error: fetchError } = await supabase
        .from("generated_images")
        .select("image_url")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      const url = new URL(imageData.image_url);
      const pathParts = url.pathname.split('/');
      const filename = pathParts[pathParts.length - 2] + '/' + pathParts[pathParts.length - 1];

      const { error: storageError } = await supabase.storage
        .from('generated-images')
        .remove([filename]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
      }

      const { error } = await supabase
        .from("generated_images")
        .delete()
        .eq("id", id);

      if (error) throw error;
      console.log("Image deleted successfully from storage and database");
    } catch (error) {
      console.error("Error deleting image from history:", error);
      throw error;
    }
  },

  async clearHistory(): Promise<void> {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) return;

      console.log("Clearing all images for user:", user.id);

      const { data: images, error: fetchError } = await supabase
        .from("generated_images")
        .select("image_url")
        .eq("user_id", user.id);

      if (fetchError) throw fetchError;

      if (images && images.length > 0) {
        const filenames = images.map(img => {
          const url = new URL(img.image_url);
          const pathParts = url.pathname.split('/');
          return pathParts[pathParts.length - 2] + '/' + pathParts[pathParts.length - 1];
        });

        const { error: storageError } = await supabase.storage
          .from('generated-images')
          .remove(filenames);

        if (storageError) {
          console.error("Storage delete error:", storageError);
        }
      }

      const { error } = await supabase
        .from("generated_images")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
      console.log("All images cleared successfully from storage and database");
    } catch (error) {
      console.error("Error clearing image history:", error);
      throw error;
    }
  }
}
