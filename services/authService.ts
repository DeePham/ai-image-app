import { supabase } from "@/utils/supabase";

export const AuthService = {
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (data?.user) {
      await AuthService.ensureUserProfile(data.user);
    }
    return { data, error };
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (data?.user) {
      await AuthService.ensureUserProfile(data.user);
    }
    return { data, error };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    // Lấy thêm profile từ bảng users
    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();
    return { ...user, ...profile };
  },

  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
  },

  async changePassword(oldPassword: string, newPassword: string) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: { message: "Not authenticated" } };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: String(user.email),
      password: oldPassword,
    });
    if (signInError) {
      return { error: { message: "Old password is incorrect" } };
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return { error };
    }
    return { success: true };
  },

  async uploadAvatar(userId: string, base64: string) {
    try {
      // Always upload to the 'public/' subfolder inside the 'avatars' bucket
      const byteArray = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const filePath = `public/${userId}_${Date.now()}.jpg`;
      const { data, error } = await supabase
        .storage
        .from('avatars')
        .upload(filePath, byteArray, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: true,
          metadata: { userId }
        });
      console.log("Supabase upload:", { data, error });
      if (error) return { error };
      // Always get the public URL with the correct path (including 'public/')
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      return { url: urlData.publicUrl };
    } catch (err) {
      const errorObj = err as Error;
      console.log("UploadAvatar Exception:", errorObj);
      return { error: { message: errorObj.message || 'Unknown error' } };
    }
  },

  async updateUserProfile(userId: string, updates: { avatar_url?: string }) {
    console.log("Update userId:", userId);
    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId);
    if (error) {
      console.log("Update error:", error);
    }
    return { error };
  },

  async ensureUserProfile(user: any) {
    if (!user) return;
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();
    if (!data) {
      await supabase.from('users').insert({
        id: user.id,
        email: user.email,
        avatar_url: null
      });
    }
  },
};
