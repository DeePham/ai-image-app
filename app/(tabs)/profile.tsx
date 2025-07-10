import { useTheme } from "@/app/_layout";
import { AuthService } from "@/services/authService";
import { ImageService } from "@/services/imageService";
import { ocrImage } from "@/services/ocrService";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from 'expo-linear-gradient';
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  const canChangePassword = 'changePassword' in (AuthService as any) && typeof (AuthService as any).changePassword === 'function';
  const { theme, themeName, setThemeName } = useTheme();
  const styles = createStyles(theme);

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

  const handlePickAndOcr = async () => {
    const pickResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!pickResult.canceled && pickResult.assets && pickResult.assets[0].uri) {
      setOcrLoading(true);
      setOcrResult(null);
      try {
        const ocrRes = await ocrImage(pickResult.assets[0].uri);
        setOcrResult(ocrRes.text);
      } catch (e) {
        setOcrResult("OCR failed");
      }
      setOcrLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const Background = themeName === 'special' ? LinearGradient : View;
  const backgroundProps = themeName === 'special'
    ? { colors: theme.gradient as [string, string, ...string[]], start: { x: 0, y: 0 }, end: { x: 1, y: 1 }, style: [styles.container, { flex: 1 }] }
    : { colors: ['#fff', '#fff'] as [string, string], style: styles.container };

  return (
    <Background {...backgroundProps}>
      <ScrollView contentContainerStyle={{ alignItems: 'center', justifyContent: 'flex-start', paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarWrapper} activeOpacity={0.8}>
            <View style={styles.avatarShadow}>
              {isUploading ? (
                <ActivityIndicator size={64} color={theme.primary} style={styles.avatar} />
              ) : user.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <FontAwesome5 name="user" size={48} color={theme.placeholder} />
                </View>
              )}
              <View style={styles.avatarEditIcon}>
                <FontAwesome5 name="camera" size={18} color={theme.white} />
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
            <FontAwesome5 name="key" size={18} color={theme.white} />
            <Text style={[styles.actionText, { color: theme.white }]}>Change Password</Text>
          </TouchableOpacity>
        )}

        {/* Theme Selector */}
        <View style={{ marginTop: 24, marginBottom: 8, alignItems: 'center' }}>
          <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Theme</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              style={{
                backgroundColor: themeName === 'light' ? '#EEE' : 'transparent',
                borderRadius: 8,
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: themeName === 'light' ? theme.primary : '#CCC',
              }}
              onPress={() => setThemeName('light')}
            >
              <Text style={{ color: themeName === 'light' ? theme.primary : '#666' }}>Light</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: themeName === 'dark' ? '#222' : 'transparent',
                borderRadius: 8,
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: themeName === 'dark' ? theme.primary : '#CCC',
              }}
              onPress={() => setThemeName('dark')}
            >
              <Text style={{ color: themeName === 'dark' ? theme.primary : '#666' }}>Dark</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: themeName === 'special' ? 'linear-gradient(90deg, #7F00FF, #E100FF)' : 'transparent',
                borderRadius: 8,
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: themeName === 'special' ? theme.accent : '#CCC',
              }}
              onPress={() => setThemeName('special')}
            >
              <Text style={{ color: themeName === 'special' ? theme.accent : '#666' }}>Special</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal đổi mật khẩu */}
        <Modal visible={showChangePw} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="Old Password"
                  placeholderTextColor={theme.placeholder}
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
                  <FontAwesome5 name={showOldPw ? "eye-slash" : "eye"} size={18} color={theme.placeholder} />
                </TouchableOpacity>
              </View>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="New Password"
                  placeholderTextColor={theme.placeholder}
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
                  <FontAwesome5 name={showNewPw ? "eye-slash" : "eye"} size={18} color={theme.placeholder} />
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.primary }]} onPress={handleChangePassword} disabled={loading}>
                  {loading ? <ActivityIndicator color={theme.white} /> : <Text style={{ color: theme.white, fontWeight: 'bold' }}>Change</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.primary }]} onPress={() => setShowChangePw(false)} disabled={loading}>
                  <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Favorites Gallery */}
        <View style={{ marginTop: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 12 }}>My Favorites</Text>
          {loadingFavorites ? (
            <ActivityIndicator size="large" color={theme.primary} />
          ) : favorites.length === 0 ? (
            <Text style={{ color: theme.placeholder, textAlign: 'center' }}>No favorites yet</Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-start' }}>
              {favorites.map((img) => (
                <Image
                  key={img.id}
                  source={{ uri: img.imageUrl }}
                  style={{ width: 100, height: 100, borderRadius: 10, margin: 5, borderWidth: 1, borderColor: theme.primary }}
                />
              ))}
            </View>
          )}
        </View>

        {/* OCR Section */}
        <View style={{ marginTop: 32, width: '100%', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 12 }}>Image to Text (OCR)</Text>
          <TouchableOpacity onPress={handlePickAndOcr} style={[styles.actionBtn, { marginBottom: 12 }]}>
            <FontAwesome5 name="file-alt" size={18} color={theme.white} />
            <Text style={[styles.actionText, { color: theme.white }]}>Chọn ảnh để nhận diện chữ</Text>
          </TouchableOpacity>
          {ocrLoading && <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 10 }} />}
          {ocrResult && (
            <View style={{ marginTop: 10, backgroundColor: theme.surface, borderRadius: 10, padding: 12, width: '90%' }}>
              <Text style={{ color: theme.text, fontWeight: 'bold', marginBottom: 4 }}>Kết quả OCR:</Text>
              <Text selectable style={{ color: theme.text }}>{ocrResult}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </Background>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    padding: 24,
  },
  avatarSection: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 16,
  },
  avatarWrapper: {
    borderRadius: 70,
    overflow: "visible",
  },
  avatarShadow: {
    elevation: 8,
    borderRadius: 70,
    backgroundColor: theme.surface,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: theme.primary,
    backgroundColor: theme.surface,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.surface,
  },
  avatarEditIcon: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: theme.primary,
    borderRadius: 16,
    padding: 6,
    borderWidth: 2,
    borderColor: theme.surface,
    zIndex: 10,
  },
  avatarHint: {
    color: theme.placeholder,
    fontSize: 13,
    marginTop: 8,
  },
  infoCard: {
    width: "100%",
    backgroundColor: theme.surface,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.text,
    marginBottom: 6,
  },
  info: {
    fontSize: 15,
    color: theme.textSecondary,
    marginBottom: 0,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: theme.primary,
    gap: 10,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  actionText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderRadius: 18,
    padding: 28,
    alignItems: "center",
    width: "90%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.text,
    marginBottom: 18,
    textAlign: "center",
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    position: "relative",
  },
  input: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 10,
    padding: Platform.OS === "ios" ? 16 : 12,
    fontSize: 16,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.primary,
    paddingRight: 44,
    flex: 1,
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    top: Platform.OS === "ios" ? 18 : 14,
  },
  modalBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginHorizontal: 4,
  },
}); 