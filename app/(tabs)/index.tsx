import { useTheme } from "@/app/_layout";
import { AIService } from "@/services/aiService";
import { AuthService } from "@/services/authService";
import { ImageService } from "@/services/imageService";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from "expo-media-library";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import moment from "moment";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import Toast from 'react-native-toast-message';

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
  "A snowy village at night with glowing lanterns and festive decorations",
  "A futuristic city in the clouds with flying cars and glowing towers",
  "A peaceful Zen garden with falling cherry blossoms and koi fish pond",
  "A witch's cottage hidden deep in an enchanted forest, moonlit scene",
  "A retro diner in the 1950s with vintage neon signs and classic cars",
  "A spaceship interior with sleek design and glowing control panels",
  "A giant treehouse city connected with rope bridges and lanterns",
  "A desert oasis at sunset with camels and palm trees, cinematic lighting",
  "A fairytale castle floating above the clouds with sparkling waterfalls",
  "A vibrant street market in Morocco with colorful textiles and spices",
  "A jungle temple being reclaimed by nature, covered in vines and moss",
  "A fantasy battlefield with knights, dragons, and magical storms",
  "A glowing crystal cave with reflections on water and magical ambience",
  "A medieval library guarded by stone golems and ancient scrolls",
  "A tranquil mountain lake at dawn with mist and mirror-like water",
];

const modelData = [
  {
    label: "Flux (Default)",
    value: "flux",
    premium: false,
  },
  {
    label: "Turbo (Fast)",
    value: "turbo",
    premium: false,
  },
  {
    label: "Flux Realism",
    value: "flux-realism",
    premium: false,
  },
  {
    label: "Flux Cablyai",
    value: "flux-cablyai",
    premium: false,
  },
  {
    label: "Flux Anime",
    value: "flux-anime",
    premium: false,
  },
  {
    label: "Any Dark",
    value: "any-dark",
    premium: false,
  },
];

const aspectRatioData = [
  { label: "Square (1:1)", value: "1/1", icon: "square" },
  { label: "Landscape (16:9)", value: "16/9", icon: "tv" },
  { label: "Portrait (9:16)", value: "9/16", icon: "mobile" },
  { label: "Wide (21:9)", value: "21/9", icon: "desktop" },
];

export default function Index() {
  const [prompt, setPrompt] = useState<string>("");
  const [model, setModel] = useState<string>("flux"); // Changed default
  const [aspectRatio, setAspectRatio] = useState<string>("1/1");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  // Remove unused state and logic related to image-to-image

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const currentUser = await AuthService.getCurrentUser();
    setUser(currentUser);
  };

  const generatePrompt = () => {
    const selectedPrompt =
      examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
    setPrompt(selectedPrompt);
  };

  const generateImage = async () => {
    if (!user) {
      Toast.show({
        type: 'error',
        text1: 'Authentication Required',
        text2: 'Please sign in to generate images',
        position: 'top',
        visibilityTime: 4000,
        onPress: () => router.push("/auth/login")
      });
      return;
    }

    if (!prompt || !aspectRatio || !model) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please fill in all fields to generate an image',
        position: 'top',
        visibilityTime: 4000
      });
      return;
    }

    setIsLoading(true);

    try {
      const base64Data = await AIService.generateImage({
        prompt,
        model,
        aspectRatio,
      });

      setImageUrl(base64Data);
      setIsLoading(false);

      try {
        await ImageService.saveToHistory({
          imageUrl: base64Data,
          prompt,
          model,
          aspectRatio,
        });
        setPrompt("");
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Image generated successfully!',
          position: 'top',
          visibilityTime: 4000
        });
      } catch (saveError) {
        console.error("Failed to save image to history:", saveError);
        Toast.show({
          type: 'info',
          text1: 'Warning',
          text2: 'Image generated successfully but couldn\'t be saved to history.',
          position: 'top',
          visibilityTime: 4000
        });
        setPrompt("");
      }
    } catch (error) {
      console.error("Generation error:", error);
      setIsLoading(false);

      let errorMessage = "Failed to generate image. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("network")) {
          errorMessage = "Network error. Please check your internet connection.";
        } else if (error.message.includes("timeout")) {
          errorMessage = "Request timeout. Please try again.";
        }
      }

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
        position: 'top',
        visibilityTime: 4000
      });
    }
  };

  // Helper to pick image and convert to base64
  // Remove any unused imports (e.g., ImagePicker) if not used elsewhere

  // Image-to-Image generation
  // Remove any unused imports (e.g., ImagePicker) if not used elsewhere

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

  const handleDownload = async () => {
    if (!imageUrl) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No image to download',
        position: 'top',
        visibilityTime: 4000
      });
      return;
    }

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
        text2: 'Downloaded Successfully!',
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

  const handleShare = async () => {
    if (!imageUrl) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No image to share',
        position: 'top',
        visibilityTime: 4000
      });
      return;
    }

    try {
      const fileName = await downloadImageToFile(imageUrl);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileName, {
          mimeType: "image/jpeg",
          dialogTitle: "Share your AI-generated image",
          UTI: "public.jpeg",
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

  const { theme, themeName } = useTheme();
  const styles = createStyles(theme);

  // For header gradient
  const HeaderBackground = themeName === 'special' ? LinearGradient : View;
  const headerBackgroundProps = themeName === 'special'
    ? { colors: theme.gradient as [string, string, ...string[]], start: { x: 0, y: 0 }, end: { x: 1, y: 1 }, style: styles.header }
    : { colors: ['#fff', '#fff'] as [string, string], style: styles.header };
  // For footer gradient (if you have a footer section)

  const Background = themeName === 'special' ? LinearGradient : View;
  const backgroundProps = themeName === 'special'
    ? { colors: theme.gradient as [string, string, ...string[]], start: { x: 0, y: 0 }, end: { x: 1, y: 1 }, style: [styles.container, { flex: 1 }] }
    : { colors: ['#fff', '#fff'] as [string, string], style: styles.container };

  return (
    <Background {...backgroundProps}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>AI Image Generator</Text>
            <Text style={styles.headerSubtitle}>
              Transform your imagination into stunning visuals. You can describe a scene, or even describe how you want to transform an image (e.g., &quot;A cat sitting on a red couch, but as a tiger&quot;).
            </Text>
          </View>

          {/* Prompt Input (Encourage creative/transform prompts) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Describe Your Vision</Text>
            <View style={styles.promptContainer}>
              <TextInput
                placeholder="Describe your imagination or transformation in detail..."
                placeholderTextColor={theme.placeholder}
                style={styles.inputField}
                numberOfLines={4}
                multiline={true}
                value={prompt}
                onChangeText={setPrompt}
              />
              <TouchableOpacity style={styles.ideaBtn} onPress={generatePrompt}>
                <FontAwesome5 name="dice" size={20} color={theme.white} />
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
              containerStyle={themeName === 'special' ? { padding: 0, borderRadius: 12, overflow: 'hidden' } : { backgroundColor: theme.surface }}
              itemContainerStyle={themeName === 'special' ? { padding: 0 } : { backgroundColor: theme.surface }}
              itemTextStyle={themeName === 'special' ? { color: '#fff' } : { color: theme.text }}
              data={modelData}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder="Select AI model"
              value={model}
              onChange={(item) => setModel(item.value)}
              renderItem={(item) => (
                themeName === 'special' ? (
                  <LinearGradient
                    colors={theme.gradient as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 0, padding: 12 }}
                  >
                    <Text style={[styles.dropdownItemText, { color: '#fff' }]}>{item.label}</Text>
                    {item.premium && (
                      <View style={styles.premiumBadge}>
                        <Text style={styles.premiumText}>Premium</Text>
                      </View>
                    )}
                  </LinearGradient>
                ) : (
                  <View style={styles.dropdownItem}>
                    <Text style={styles.dropdownItemText}>{item.label}</Text>
                    {item.premium && (
                      <View style={styles.premiumBadge}>
                        <Text style={styles.premiumText}>Premium</Text>
                      </View>
                    )}
                  </View>
                )
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
                        ? theme.white
                        : theme.textSecondary
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
              <ActivityIndicator size="small" color={theme.white} />
            ) : (
              <FontAwesome5 name="magic" size={18} color={theme.white} />
            )}
            <Text style={styles.generateButtonText}>
              {isLoading ? "Generating..." : "Generate Image"}
            </Text>
          </TouchableOpacity>

          {/* Loading State */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
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
                  <FontAwesome5
                    name="download"
                    size={20}
                    color={theme.primary}
                  />
                  <Text style={styles.actionButtonText}>Download</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleShare}
                >
                  <FontAwesome5
                    name="share"
                    size={20}
                    color={theme.primary}
                  />
                  <Text style={styles.actionButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
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
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
    // backgroundColor removed to allow gradient background to show through
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: theme.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: "center",
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.text,
    marginBottom: 12,
  },
  promptContainer: {
    position: "relative",
  },
  inputField: {
    backgroundColor: theme.surface,
    padding: 20,
    borderRadius: 16,
    borderColor: theme.primary,
    borderWidth: 1,
    fontSize: 16,
    color: theme.text,
    textAlignVertical: "top",
    minHeight: 120,
  },
  ideaBtn: {
    backgroundColor: theme.primary,
    padding: 12,
    borderRadius: 25,
    position: "absolute",
    bottom: 15,
    right: 15,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdown: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderColor: theme.primary,
    borderWidth: 1,
    padding: 16,
  },
  placeholderStyle: {
    fontSize: 16,
    color: theme.placeholder,
  },
  selectedTextStyle: {
    fontSize: 16,
    color: theme.text,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.surface,
    padding: 12,
  },
  dropdownItemText: {
    fontSize: 16,
    color: theme.text,
  },
  premiumBadge: {
    backgroundColor: theme.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  premiumText: {
    fontSize: 10,
    color: theme.white,
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
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.backgroundSecondary,
    alignItems: "center",
    gap: 8,
  },
  aspectRatioItemSelected: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  aspectRatioText: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: "center",
  },
  aspectRatioTextSelected: {
    color: theme.white,
  },
  generateButton: {
    backgroundColor: theme.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    borderRadius: 16,
    gap: 10,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: theme.white,
    fontSize: 18,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    color: theme.textSecondary,
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
    borderColor: theme.primary,
    shadowColor: theme.black,
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
    backgroundColor: theme.surface,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  actionButtonText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  testButton: {
    backgroundColor: theme.warning,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  testButtonText: {
    color: theme.black,
    fontWeight: "600",
  },
  footerSwitcher: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.primary,
    marginHorizontal: 5,
  },
  footerButtonActive: {
    backgroundColor: theme.primary,
  },
  footerButtonText: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footerButtonTextActive: {
    color: theme.white,
  },
});
