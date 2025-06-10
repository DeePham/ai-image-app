import AuthGuard from "@/components/AuthGuard";
import { getCurrentUser } from "@/utils/auth";
import { Color } from "@/utils/Color";
import { getImageDimensions } from "@/utils/helper";
import { downloadImage, saveImageToHistory } from "@/utils/storage";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";

const examplePrompts = [
  "A mystical forest with glowing mushrooms and ethereal lighting",
  "A cyberpunk city at night with neon lights reflecting in rain puddles",
  "A cute robot sitting in a field of sunflowers, digital art style",
  "An astronaut floating in space with Earth in the background, cosmic colors",
  "A magical library with floating books and warm golden light",
  "A dragon made of cherry blossoms in a Japanese garden",
  "A steampunk flying machine soaring over Victorian London",
  "A underwater palace with mermaids and colorful coral reefs",
  "A cozy coffee shop on a rainy day, warm and inviting atmosphere",
  "A phoenix rising from ashes with vibrant fire colors",
];

const modelData = [
  {
    label: "FLUX.1-dev (Best Quality)",
    value: "black-forest-labs/FLUX.1-dev",
    premium: true,
  },
  {
    label: "FLUX.1-schnell (Fast)",
    value: "black-forest-labs/FLUX.1-schnell",
    premium: false,
  },
  {
    label: "Stable Diffusion 3.5L",
    value: "stabilityai/stable-diffusion-3.5-large",
    premium: true,
  },
  {
    label: "Stable Diffusion XL",
    value: "stabilityai/stable-diffusion-xl-base-1.0",
    premium: false,
  },
  {
    label: "Stable Diffusion v1.5",
    value: "stable-diffusion-v1-5/stable-diffusion-v1-5",
    premium: false,
  },
];

const aspectRatioData = [
  { label: "Square (1:1)", value: "1/1", icon: "square" },
  { label: "Landscape (16:9)", value: "16/9", icon: "tv" },
  { label: "Portrait (9:16)", value: "9/16", icon: "mobile" },
  { label: "Wide (21:9)", value: "21/9", icon: "desktop" },
];

function IndexContent() {
  const [prompt, setPrompt] = useState<string>("");
  const [model, setModel] = useState<string>(
    "black-forest-labs/FLUX.1-schnell"
  );
  const [aspectRatio, setAspectRatio] = useState<string>("1/1");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  const generatePrompt = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const selectedPrompt =
      examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
    setPrompt(selectedPrompt);
  };

  const generateImage = async () => {
    if (!user) {
      Alert.alert(
        "Authentication Required",
        "Please sign in to generate images",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Sign In", onPress: () => router.push("/auth/login") },
        ]
      );
      return;
    }

    if (!prompt || !aspectRatio || !model) {
      Alert.alert(
        "Missing Information",
        "Please fill in all fields to generate an image"
      );
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const MODEL_URL = `https://router.huggingface.co/hf-inference/models/${model}`;
    const { width, height } = getImageDimensions(aspectRatio);

    try {
      const response = await fetch(MODEL_URL, {
        headers: {
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_API_KEY}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: prompt,
          parameters: { width, height },
        }),
      });

      if (!response.ok) {
        throw new Error((await response.json()).error);
      }

      const blob = await response.blob();
      const fileReaderInstance = new FileReader();
      fileReaderInstance.readAsDataURL(blob);
      fileReaderInstance.onload = async () => {
        const base64Data = fileReaderInstance.result as string;
        setImageUrl(base64Data);
        setIsLoading(false);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Save to history with base64
        try {
          console.log("Attempting to save image to history...");
          await saveImageToHistory({
            imageUrl: base64Data,
            prompt,
            model,
            aspectRatio,
          });
          console.log("Image saved successfully!");
        } catch (saveError) {
          console.error("Failed to save image to history:", saveError);
          Alert.alert(
            "Warning",
            "Image generated successfully but couldn't be saved to history.",
            [{ text: "OK" }]
          );
        }
      };
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to generate image. Please try again.");
    }
  };

  const handleDownload = async () => {
    if (!imageUrl) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Show loading state
      Alert.alert("Downloading", "Saving image to your device...");

      const fileName = `ai-image-${Date.now()}`;
      await downloadImage(imageUrl, fileName);

      Alert.alert("Success", "Image saved to your gallery!");
    } catch (error: any) {
      console.error("Download error:", error);

      if (error.message?.includes("Permission")) {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library to save images.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                // You can add logic to open app settings here if needed
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", "Failed to save image. Please try again.");
      }
    }
  };

  const handleShare = async () => {
    if (!imageUrl) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: `Check out this AI-generated image: ${prompt}`,
        url: imageUrl,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Image Generator</Text>
          <Text style={styles.headerSubtitle}>
            Transform your imagination into stunning visuals
          </Text>
        </View>

        {/* Prompt Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Describe Your Vision</Text>
          <View style={styles.promptContainer}>
            <TextInput
              placeholder="Describe your imagination in detail..."
              placeholderTextColor={Color.placeholder}
              style={styles.inputField}
              numberOfLines={4}
              multiline={true}
              value={prompt}
              onChangeText={setPrompt}
            />
            <TouchableOpacity style={styles.ideaBtn} onPress={generatePrompt}>
              <FontAwesome5 name="dice" size={20} color={Color.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Model Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Model</Text>
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            data={modelData}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Select AI model"
            value={model}
            onChange={(item) => setModel(item.value)}
            renderItem={(item) => (
              <View style={styles.dropdownItem}>
                <Text style={styles.dropdownItemText}>{item.label}</Text>
                {item.premium && (
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumText}>Premium</Text>
                  </View>
                )}
              </View>
            )}
          />
        </View>

        {/* Aspect Ratio Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aspect Ratio</Text>
          <View style={styles.aspectRatioContainer}>
            {aspectRatioData.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.aspectRatioItem,
                  aspectRatio === item.value && styles.aspectRatioItemSelected,
                ]}
                onPress={() => setAspectRatio(item.value)}
              >
                <FontAwesome5
                  name={item.icon as any}
                  size={20}
                  color={
                    aspectRatio === item.value
                      ? Color.white
                      : Color.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.aspectRatioText,
                    aspectRatio === item.value &&
                      styles.aspectRatioTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[
            styles.generateButton,
            isLoading && styles.generateButtonDisabled,
          ]}
          onPress={generateImage}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={Color.white} />
          ) : (
            <FontAwesome5 name="magic" size={18} color={Color.white} />
          )}
          <Text style={styles.generateButtonText}>
            {isLoading ? "Generating..." : "Generate Image"}
          </Text>
        </TouchableOpacity>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Color.primary} />
            <Text style={styles.loadingText}>Creating your masterpiece...</Text>
          </View>
        )}

        {/* Generated Image */}
        {imageUrl && !isLoading && (
          <View style={styles.imageSection}>
            <Text style={styles.sectionTitle}>Your Creation</Text>
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUrl }} style={styles.image} />
            </View>
            <View style={styles.imageActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDownload}
              >
                <FontAwesome5 name="download" size={20} color={Color.primary} />
                <Text style={styles.actionButtonText}>Download</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShare}
              >
                <FontAwesome5 name="share" size={20} color={Color.primary} />
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

export default function Index() {
  return (
    <AuthGuard>
      <IndexContent />
    </AuthGuard>
  );
}

const windowWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: Color.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Color.textSecondary,
    textAlign: "center",
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Color.text,
    marginBottom: 12,
  },
  promptContainer: {
    position: "relative",
  },
  inputField: {
    backgroundColor: Color.surface,
    padding: 20,
    borderRadius: 16,
    borderColor: Color.primary,
    borderWidth: 1,
    fontSize: 16,
    color: Color.text,
    textAlignVertical: "top",
    minHeight: 120,
  },
  ideaBtn: {
    backgroundColor: Color.primary,
    padding: 12,
    borderRadius: 25,
    position: "absolute",
    bottom: 15,
    right: 15,
    shadowColor: Color.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdown: {
    backgroundColor: Color.surface,
    borderRadius: 12,
    borderColor: Color.primary,
    borderWidth: 1,
    padding: 16,
  },
  placeholderStyle: {
    fontSize: 16,
    color: Color.placeholder,
  },
  selectedTextStyle: {
    fontSize: 16,
    color: Color.text,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  dropdownItemText: {
    fontSize: 16,
    color: Color.text,
  },
  premiumBadge: {
    backgroundColor: Color.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  premiumText: {
    fontSize: 10,
    color: Color.white,
    fontWeight: "600",
  },
  aspectRatioContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  aspectRatioItem: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Color.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Color.backgroundSecondary,
    alignItems: "center",
    gap: 8,
  },
  aspectRatioItemSelected: {
    backgroundColor: Color.primary,
    borderColor: Color.primary,
  },
  aspectRatioText: {
    fontSize: 12,
    color: Color.textSecondary,
    textAlign: "center",
  },
  aspectRatioTextSelected: {
    color: Color.white,
  },
  generateButton: {
    backgroundColor: Color.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    borderRadius: 16,
    gap: 10,
    shadowColor: Color.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: Color.white,
    fontSize: 18,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    color: Color.textSecondary,
    fontSize: 16,
    marginTop: 16,
  },
  imageSection: {
    marginTop: 20,
  },
  imageContainer: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Color.primary,
    shadowColor: Color.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  image: {
    width: "100%",
    height: 300,
    resizeMode: "cover",
  },
  imageActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Color.surface,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    borderWidth: 1,
    borderColor: Color.primary,
  },
  actionButtonText: {
    color: Color.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  testButton: {
    backgroundColor: Color.warning,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  testButtonText: {
    color: Color.black,
    fontWeight: "600",
  },
});
