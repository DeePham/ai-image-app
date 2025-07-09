import { MainColor } from "@/constants/MainColor";
import { AuthService } from "@/services/authService";
import { ImageService } from "@/services/imageService";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Toast from 'react-native-toast-message';

const DANGER_COLOR = "#e74c3c";

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [showChangePw, setShowChangePw] = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  const canChangePassword = 'changePassword' in (AuthService as any) && typeof (AuthService as any).changePassword === 'function';

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await AuthService.getCurrentUser();
      console.log("Current user profile:", currentUser);
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const fetchFavorites = async () => {
        setLoadingFavorites(true);
        try {
          const favs = await ImageService.getFavorites();
          setFavorites(favs);
        } catch (e) {
          setFavorites([]);
        } finally {
          setLoadingFavorites(false);
        }
      };
      fetchFavorites();
    }, [])
  );

  const handleChangePassword = async () => {
    if (!oldPw || !newPw) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter both old and new password', position: 'top' });
      return;
    }
    if (oldPw === newPw) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'New password must be different from old password', position: 'top' });
      return;
    }
    setLoading(true);
    try {
      if (canChangePassword) {
        const result = await (AuthService as any).changePassword(oldPw, newPw);
        if (result?.error) {
          Toast.show({ type: 'error', text1: 'Error', text2: result.error.message || 'Failed to change password', position: 'top' });
        } else {
          Toast.show({ type: 'success', text1: 'Success', text2: 'Password changed successfully. Please log in again.', position: 'top' });
          setShowChangePw(false);
          setOldPw("");
          setNewPw("");
          setTimeout(async () => {
            await AuthService.signOut();
            router.replace("/auth/login");
          }, 1200);
        }
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Change password not implemented', position: 'top' });
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to change password', position: 'top' });
    } finally {
      setLoading(false);
    }
  };

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: (ImagePicker as any).MediaType?.IMAGE || (ImagePicker.MediaTypeOptions.Images as any),
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    console.log("ImagePicker result:", result);
    if (!result.canceled && result.assets && result.assets[0].base64) {
      const base64 = result.assets[0].base64;
      setIsUploading(true);
      const { url, error } = await AuthService.uploadAvatar(user.id, base64);
      console.log("Upload result:", { url, error });
      if (error) {
        setIsUploading(false);
        Toast.show({ type: 'error', text1: 'Error', text2: error.message, position: 'top' });
        console.log("Upload error:", error);
      } else {
        // Cập nhật avatar_url vào bảng user
        const { error: updateError } = await AuthService.updateUserProfile(user.id, { avatar_url: url });
        setIsUploading(false);
        if (!updateError) {
          // Fetch lại user profile từ Supabase để đảm bảo avatar_url mới nhất
          const updatedUser = await AuthService.getCurrentUser();
          setUser(updatedUser);
          Toast.show({ type: 'success', text1: 'Success', text2: 'Avatar updated!', position: 'top' });
        } else {
          Toast.show({ type: 'error', text1: 'Error', text2: updateError.message, position: 'top' });
          console.log("Update error:", updateError);
        }
      }
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={MainColor.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarWrapper} activeOpacity={0.8}>
          <View style={styles.avatarShadow}>
            {isUploading ? (
              <ActivityIndicator size={64} color={MainColor.primary} style={styles.avatar} />
            ) : user.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <FontAwesome5 name="user" size={48} color={MainColor.placeholder} />
              </View>
            )}
            <View style={styles.avatarEditIcon}>
              <FontAwesome5 name="camera" size={18} color={MainColor.white} />
            </View>
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>Tap avatar to change</Text>
      </View>

      {/* User Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.name}>{user.email || "No email"}</Text>
      </View>

      {/* Đổi mật khẩu */}
      {canChangePassword && (
        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowChangePw(true)}>
          <FontAwesome5 name="key" size={18} color={MainColor.primary} />
          <Text style={styles.actionText}>Change Password</Text>
        </TouchableOpacity>
      )}

      {/* Modal đổi mật khẩu */}
      <Modal visible={showChangePw} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="Old Password"
                placeholderTextColor={MainColor.placeholder}
                secureTextEntry={!showOldPw}
                value={oldPw}
                onChangeText={setOldPw}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowOldPw((v) => !v)}
              >
                <FontAwesome5 name={showOldPw ? "eye-slash" : "eye"} size={18} color={MainColor.placeholder} />
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="New Password"
                placeholderTextColor={MainColor.placeholder}
                secureTextEntry={!showNewPw}
                value={newPw}
                onChangeText={setNewPw}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowNewPw((v) => !v)}
              >
                <FontAwesome5 name={showNewPw ? "eye-slash" : "eye"} size={18} color={MainColor.placeholder} />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: MainColor.primary }]} onPress={handleChangePassword} disabled={loading}>
                {loading ? <ActivityIndicator color={MainColor.white} /> : <Text style={{ color: MainColor.white, fontWeight: 'bold' }}>Change</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: MainColor.surface, borderWidth: 1, borderColor: MainColor.primary }]} onPress={() => setShowChangePw(false)} disabled={loading}>
                <Text style={{ color: MainColor.primary, fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Favorites Gallery */}
      <View style={{ marginTop: 32 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: MainColor.text, marginBottom: 12 }}>My Favorites</Text>
        {loadingFavorites ? (
          <ActivityIndicator size="large" color={MainColor.primary} />
        ) : favorites.length === 0 ? (
          <Text style={{ color: MainColor.placeholder, textAlign: 'center' }}>No favorites yet</Text>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-start' }}>
            {favorites.map((img) => (
              <Image
                key={img.id}
                source={{ uri: img.imageUrl }}
                style={{ width: 100, height: 100, borderRadius: 10, margin: 5, borderWidth: 1, borderColor: MainColor.primary }}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MainColor.background,
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 24,
  },
  avatarSection: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
  },
  avatarWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    borderRadius: 70,
    backgroundColor: MainColor.surface,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: MainColor.primary,
    backgroundColor: MainColor.surface,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEditIcon: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: MainColor.primary,
    borderRadius: 16,
    padding: 6,
    borderWidth: 2,
    borderColor: MainColor.surface,
    zIndex: 10,
  },
  avatarHint: {
    color: MainColor.placeholder,
    fontSize: 13,
    marginTop: 8,
    marginBottom: 4,
  },
  infoCard: {
    width: "100%",
    backgroundColor: MainColor.surface,
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: MainColor.text,
    marginBottom: 6,
  },
  info: {
    fontSize: 15,
    color: MainColor.textSecondary,
    marginBottom: 0,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: MainColor.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: MainColor.primary,
    gap: 10,
    shadowColor: MainColor.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  actionText: {
    fontSize: 16,
    fontWeight: "600",
    color: MainColor.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: MainColor.surface,
    borderRadius: 18,
    padding: 28,
    width: 340,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: MainColor.text,
    marginBottom: 18,
    textAlign: "center",
  },
  inputGroup: {
    position: "relative",
    marginBottom: 12,
  },
  input: {
    backgroundColor: MainColor.backgroundSecondary,
    borderRadius: 10,
    padding: Platform.OS === "ios" ? 16 : 12,
    fontSize: 16,
    color: MainColor.text,
    borderWidth: 1,
    borderColor: MainColor.primary,
    paddingRight: 44,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: Platform.OS === "ios" ? 18 : 12,
    padding: 4,
    zIndex: 10,
  },
  modalBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
}); 