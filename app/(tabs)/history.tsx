import { MainColor } from "@/constants/MainColor";
import { GeneratedImage, ImageService } from "@/services/imageService";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useFocusEffect } from "@react-navigation/native";
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

  const renderImageItem = ({ item }: { item: GeneratedImage }) => (
    <View style={styles.imageItem}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDeleteImage(item.id)}
      >
        <FontAwesome5 name="trash" size={16} color={MainColor.white} />
      </TouchableOpacity>
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
  deleteBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 0, 0, 0.7)",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
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
