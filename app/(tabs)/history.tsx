import { MainColor } from "@/constants/MainColor";
import { AIService } from "@/services/aiService";
import { GeneratedImage, ImageService } from "@/services/imageService";
import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import moment from "moment";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from 'react-native-toast-message';

const windowWidth = Dimensions.get("window").width;
const imageWidth = (windowWidth - 60) / 2;

export default function History() {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [confirmClearAllVisible, setConfirmClearAllVisible] = useState(false);

  const loadImages = async () => {
    setLoading(true);
    try {
      const history = await ImageService.getHistory();
      setImages(history);
      // Load favorites
      const favs = await ImageService.getFavorites();
      setFavoriteIds(favs.map(img => img.id));
    } catch (error) {
      console.error("Error loading images:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadImages();
    }, [])
  );

  const handleDeleteImage = (id: string) => {
    Toast.show({
      type: 'info',
      text1: 'Delete Image',
      text2: 'Are you sure you want to delete this image?',
      position: 'top',
      visibilityTime: 4000,
      onPress: async () => {
        try {
          await ImageService.deleteFromHistory(id);
          loadImages();
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Image deleted successfully',
            position: 'top',
            visibilityTime: 4000
          });
        } catch (error) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to delete image',
            position: 'top',
            visibilityTime: 4000
          });
        }
      }
    });
  };

  const requestClearAll = () => {
    setConfirmClearAllVisible(true);
  };
  const handleConfirmClearAll = async () => {
    await handleClearAll();
    setConfirmClearAllVisible(false);
  };
  const handleCancelClearAll = () => {
    setConfirmClearAllVisible(false);
  };

  const handleToggleFavorite = async (imageId: string) => {
    try {
      if (favoriteIds.includes(imageId)) {
        await ImageService.removeFavorite(imageId);
        setFavoriteIds(favoriteIds.filter(id => id !== imageId));
      } else {
        await ImageService.addFavorite(imageId);
        setFavoriteIds([...favoriteIds, imageId]);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update favorite',
        position: 'top',
        visibilityTime: 4000
      });
    }
  };

  const handleRegenerate = async () => {
    if (!selectedImage) return;
    setRegenerating(true);
    try {
      const base64Data = await AIService.generateImage({
        prompt: selectedImage.prompt,
        model: selectedImage.model,
        aspectRatio: selectedImage.aspectRatio,
      });
      await ImageService.saveToHistory({
        imageUrl: base64Data,
        prompt: selectedImage.prompt,
        model: selectedImage.model,
        aspectRatio: selectedImage.aspectRatio,
      });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Image regenerated!',
        position: 'top',
        visibilityTime: 4000
      });
      loadImages();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to regenerate image',
        position: 'top',
        visibilityTime: 4000
      });
    } finally {
      setRegenerating(false);
    }
  };

  const downloadImageToFile = async (imageUrl: string): Promise<string> => {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const imageData = await response.arrayBuffer();
    const byteArray = new Uint8Array(imageData);
    
    const base64Data = btoa(String.fromCharCode(...byteArray));
    
    const date = moment().format("YYYYMMDDhhmmss");
    const fileName = `${FileSystem.documentDirectory}${date}.jpeg`;

    await FileSystem.writeAsStringAsync(fileName, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    return fileName;
  };

  const handleDownload = async (imageUrl: string) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Toast.show({
          type: 'error',
          text1: 'Permission Required',
          text2: 'Sorry, we need media library permissions to save images!',
          position: 'top',
          visibilityTime: 4000
        });
        return;
      }

      const fileName = await downloadImageToFile(imageUrl);
      const asset = await MediaLibrary.createAssetAsync(fileName);
      await MediaLibrary.createAlbumAsync("AI Images", asset, false);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Image downloaded successfully!',
        position: 'top',
        visibilityTime: 4000
      });
    } catch (error) {
      console.log(error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to download image',
        position: 'top',
        visibilityTime: 4000
      });
    }
  };

  const handleShare = async (imageUrl: string) => {
    try {
      const fileName = await downloadImageToFile(imageUrl);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileName, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Share your AI-generated image',
          UTI: 'public.jpeg'
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Sharing isn\'t available on your platform',
          position: 'top',
          visibilityTime: 4000
        });
      }
    } catch (error) {
      console.log(error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to share image',
        position: 'top',
        visibilityTime: 4000
      });
    }
  };

  const openImageModal = (img: GeneratedImage) => {
    setSelectedImage(img);
    setModalVisible(true);
  };
  const closeImageModal = () => {
    setModalVisible(false);
    setSelectedImage(null);
  };

  const requestDeleteImage = (id: string) => {
    setPendingDeleteId(id);
    setConfirmDeleteVisible(true);
  };
  const handleConfirmDelete = async () => {
    if (pendingDeleteId) {
      await handleDeleteImage(pendingDeleteId);
      setConfirmDeleteVisible(false);
      setPendingDeleteId(null);
      closeImageModal();
    }
  };
  const handleCancelDelete = () => {
    setConfirmDeleteVisible(false);
    setPendingDeleteId(null);
  };

  const handleClearAll = async () => {
    try {
      await ImageService.clearHistory();
      loadImages();
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'History cleared successfully',
        position: 'top',
        visibilityTime: 4000
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to clear history',
        position: 'top',
        visibilityTime: 4000
      });
    }
  };

  const renderImageItem = ({ item }: { item: GeneratedImage }) => (
    <TouchableOpacity onPress={() => openImageModal(item)} style={styles.imageItem}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={MainColor.primary} />
        <Text style={styles.loadingText}>Loading your images...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {images.length > 0 && (
          <TouchableOpacity onPress={requestClearAll}>
            <Text style={styles.clearButton}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {images.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="image" size={64} color={MainColor.placeholder} />
          <Text style={styles.emptyText}>No images generated yet</Text>
          <Text style={styles.emptySubText}>
            Generate your first AI image to see it here
          </Text>
        </View>
      ) : (
        <FlatList
          data={images}
          renderItem={renderImageItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeImageModal}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: MainColor.background, borderRadius: 16, padding: 20, alignItems: 'center', width: '85%' }}>
            {selectedImage && (
              <>
                <Image source={{ uri: selectedImage.imageUrl }} style={{ width: 250, height: 250, borderRadius: 12, marginBottom: 16 }} />
                <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
                  <TouchableOpacity onPress={() => { handleToggleFavorite(selectedImage.id); }}>
                    <FontAwesome
                      name={favoriteIds.includes(selectedImage.id) ? "heart" : "heart-o"}
                      size={28}
                      color={favoriteIds.includes(selectedImage.id) ? "#ff4081" : MainColor.primary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleRegenerate} disabled={regenerating}>
                    {regenerating ? (
                      <ActivityIndicator size={28} color={MainColor.primary} />
                    ) : (
                      <FontAwesome name="refresh" size={28} color={MainColor.primary} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { handleDownload(selectedImage.imageUrl); }}>
                    <FontAwesome name="download" size={28} color={MainColor.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { handleShare(selectedImage.imageUrl); }}>
                    <FontAwesome name="share" size={28} color={MainColor.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { requestDeleteImage(selectedImage.id); closeImageModal(); }}>
                    <FontAwesome name="trash" size={28} color={MainColor.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={{ color: MainColor.text, fontSize: 14, marginBottom: 4 }}>{selectedImage.prompt}</Text>
                <Text style={{ color: MainColor.placeholder, fontSize: 12 }}>{selectedImage.model.split("/").pop()} • {selectedImage.aspectRatio}</Text>
                <Text style={{ color: MainColor.placeholder, fontSize: 12 }}>{new Date(selectedImage.createdAt).toLocaleDateString()}</Text>
                <TouchableOpacity onPress={closeImageModal} style={{ marginTop: 18, padding: 10 }}>
                  <Text style={{ color: MainColor.accent, fontWeight: 'bold', fontSize: 16 }}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
      <Modal
        visible={confirmDeleteVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: MainColor.background, borderRadius: 12, padding: 24, alignItems: 'center', width: '80%' }}>
            <Text style={{ color: MainColor.text, fontSize: 16, marginBottom: 16, textAlign: 'center' }}>
              Are you sure you want to delete this image?
            </Text>
            {pendingDeleteId && favoriteIds.includes(pendingDeleteId) && (
              <Text style={{ color: MainColor.error, fontSize: 14, marginBottom: 10, textAlign: 'center' }}>
                This image is also in your favorites. Deleting it will remove it from your favorites as well.
              </Text>
            )}
            <View style={{ flexDirection: 'row', gap: 24 }}>
              <TouchableOpacity onPress={handleCancelDelete} style={{ padding: 10, minWidth: 80, alignItems: 'center' }}>
                <Text style={{ color: MainColor.primary, fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmDelete} style={{ padding: 10, minWidth: 80, alignItems: 'center' }}>
                <Text style={{ color: MainColor.error, fontWeight: 'bold', fontSize: 16 }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={confirmClearAllVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelClearAll}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: MainColor.background, borderRadius: 12, padding: 24, alignItems: 'center', width: '80%' }}>
            <Text style={{ color: MainColor.text, fontSize: 16, marginBottom: 16, textAlign: 'center' }}>
              Are you sure you want to delete all images?
            </Text>
            <View style={{ flexDirection: 'row', gap: 24 }}>
              <TouchableOpacity onPress={handleCancelClearAll} style={{ padding: 10, minWidth: 80, alignItems: 'center' }}>
                <Text style={{ color: MainColor.primary, fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmClearAll} style={{ padding: 10, minWidth: 80, alignItems: 'center' }}>
                <Text style={{ color: MainColor.error, fontWeight: 'bold', fontSize: 16 }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MainColor.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: MainColor.text,
  },
  clearButton: {
    color: MainColor.accent,
    fontSize: 16,
    fontWeight: "500",
  },
  listContainer: {
    padding: 10,
  },
  imageItem: {
    flex: 1,
    margin: 10,
    backgroundColor: MainColor.background,
    borderRadius: 10,
    borderColor: MainColor.accent,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: imageWidth,
    objectFit: "cover",
    resizeMode: "cover",
  },
  actionButtons: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  downloadBtn: {
    backgroundColor: "rgba(0, 122, 255, 0.7)",
  },
  shareBtn: {
    backgroundColor: "rgba(0, 150, 0, 0.7)",
  },
  deleteBtn: {
    backgroundColor: "rgba(255, 0, 0, 0.7)",
  },
  imageInfo: {
    padding: 12,
  },
  promptText: {
    color: MainColor.text,
    fontSize: 12,
    marginBottom: 4,
  },
  metaText: {
    color: MainColor.placeholder,
    fontSize: 10,
    marginBottom: 2,
  },
  dateText: {
    color: MainColor.placeholder,
    fontSize: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    color: MainColor.text,
    fontSize: 18,
    fontWeight: "500",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubText: {
    color: MainColor.placeholder,
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: MainColor.background,
  },
  loadingText: {
    color: MainColor.textSecondary,
    fontSize: 16,
    marginTop: 16,
  },
});
