import { MainColor } from "@/constants/MainColor";
import { GeneratedImage, ImageService } from "@/services/imageService";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useFocusEffect } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import moment from "moment";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const windowWidth = Dimensions.get("window").width;
const imageWidth = (windowWidth - 60) / 2;

export default function History() {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(false);

  const loadImages = async () => {
    setLoading(true);
    try {
      const history = await ImageService.getHistory();
      setImages(history);
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
    Alert.alert("Delete Image", "Are you sure you want to delete this image?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await ImageService.deleteFromHistory(id);
            loadImages();
          } catch (error) {
            Alert.alert("Error", "Failed to delete image");
          }
        },
      },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear All History",
      "Are you sure you want to delete all images?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await ImageService.clearHistory();
              loadImages();
            } catch (error) {
              Alert.alert("Error", "Failed to clear history");
            }
          },
        },
      ]
    );
  };

  const handleDownload = async (imageUrl: string) => {
    try {
      const base64Code = imageUrl.split(",")[1];
      if (!base64Code) {
        alert("Invalid image data");
        return;
      }

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Sorry, we need media library permissions to save images!");
        return;
      }

      const date = moment().format("YYYYMMDDhhmmss");
      const fileName = `${FileSystem.documentDirectory}${date}.jpeg`;
      
      await FileSystem.writeAsStringAsync(fileName, base64Code, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const asset = await MediaLibrary.createAssetAsync(fileName);
      await MediaLibrary.createAlbumAsync("AI Images", asset, false);
      Alert.alert("Success", "Image downloaded successfully!");
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to download image");
    }
  };

  const handleShare = async (imageUrl: string) => {
    try {
      const base64Code = imageUrl.split(",")[1];
      if (!base64Code) {
        alert("Invalid image data");
        return;
      }

      const date = moment().format("YYYYMMDDhhmmss");
      const fileName = `${FileSystem.documentDirectory}${date}.jpeg`;
      
      await FileSystem.writeAsStringAsync(fileName, base64Code, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileName, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Share your AI-generated image',
          UTI: 'public.jpeg'
        });
      } else {
        alert("Sharing isn't available on your platform");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to share image");
    }
  };

  const renderImageItem = ({ item }: { item: GeneratedImage }) => (
    <View style={styles.imageItem}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.downloadBtn]}
          onPress={() => handleDownload(item.imageUrl)}
        >
          <FontAwesome5 name="download" size={16} color={MainColor.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.shareBtn]}
          onPress={() => handleShare(item.imageUrl)}
        >
          <FontAwesome5 name="share" size={16} color={MainColor.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => handleDeleteImage(item.id)}
        >
          <FontAwesome5 name="trash" size={16} color={MainColor.white} />
        </TouchableOpacity>
      </View>
      <View style={styles.imageInfo}>
        <Text style={styles.promptText} numberOfLines={2}>
          {item.prompt}
        </Text>
        <Text style={styles.metaText}>
          {item.model.split("/").pop()} • {item.aspectRatio}
        </Text>
        <Text style={styles.dateText}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
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
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearButton}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {images.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome5 name="image" size={64} color={MainColor.placeholder} />
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
