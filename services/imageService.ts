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
          image_url: image.imageUrl,
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
  },

  async clearHistory(): Promise<void> {
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
  }
}
