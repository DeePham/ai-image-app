import { Color } from "@/utils/Color";
import { getImageDimensions } from "@/utils/helper";
import { saveImageToHistory } from "@/utils/storage";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";

const examplePrompts = [
  "A jogger running fast, happy expression, airbrush caricature",
  "A futuristic hopeful busy city, purple and green color scheme",
  "Illustration of dinosaurs drawn by a child, the illustrations are cute and funny",
  "A sleepy cat lounging on a pile of books, cozy lighting, soft pastel tones",
  "A robot learning to paint in an art studio, digital painting style",
  "A surreal dream landscape with floating islands and glowing waterfalls",
  "A cheerful old man selling balloons on a rainy street, watercolor style",
  "A fantasy forest with giant mushrooms and glowing fireflies at dusk",
  "An astronaut playing guitar on the moon, retro 80s colors",
  "A group of penguins having a beach party, cartoon style, bright colors",
  "A child’s drawing of a dragon and a knight becoming best friends",
  "A sushi roll skateboarding down the street, comic book style",
  "A magical bakery run by cats, warm lighting, whimsical vibes",
  "A steampunk airship flying over a canyon at sunrise",
  "A frog wearing a crown and reading a book by a pond, fairy tale art",
  "A tiny house on top of a turtle, traveling across the ocean",
  "A group of vegetables having a rock band concert, fun and silly",
  "A post-apocalyptic city overgrown with nature, peaceful mood",
];

const modelData = [
  { label: "Flux.1-dev", value: "black-forest-labs/FLUX.1-dev" },
  { label: "FLUX.1-schnell", value: "black-forest-labs/FLUX.1-schnell" },
  {
    label: "Stable Diffusion 3.5L",
    value: "stabilityai/stable-diffusion-3.5-large",
  },
  {
    label: "Stable Diffusion XL",
    value: "stabilityai/stable-diffusion-xl-base-1.0",
  },
  {
    label: "Stable Diffusion v1.5",
    value: "stable-diffusion-v1-5/stable-diffusion-v1-5",
  },
];

const aspectRatioData = [
  { label: "1/1", value: "1/1" },
  { label: "16/9", value: "16/9" },
  { label: "9/16", value: "9/16" },
];

export default function Index() {
  const [prompt, setPrompt] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [aspectRatio, setAspectRatio] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<any>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const generatePrompt = () => {
    const prompt =
      examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
    setPrompt(prompt);
  };

  const generateImage = async () => {
    if (!prompt || !aspectRatio || !model) {
      Alert.alert("Error", "Missing fields", [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel",
        },
        { text: "OK", onPress: () => console.log("OK Pressed") },
      ]);
      return;
    }
    setIsLoading(true);
    const MODEL_URL = `https://router.huggingface.co/hf-inference/models/${model}`;
    const { width, height } = getImageDimensions(aspectRatio);
    console.log("RUNNING!!!")
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
      console.log(blob);

      const fileReaderInstance = new FileReader();
      fileReaderInstance.readAsDataURL(blob);
      fileReaderInstance.onload = async () => {
        const base64Data = fileReaderInstance.result as string;
        setImageUrl(base64Data);
        setIsLoading(false);
        // console.log("Image URL: ", base64Data);
        // Save to history
        await saveImageToHistory({
          imageUrl: base64Data,
          prompt,
          model,
          aspectRatio,
        });
      };
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <View style={{ height: 150 }}>
          <TextInput
            placeholder="Describe your imagination in detail..."
            placeholderTextColor={Color.placeholder}
            style={styles.inputField}
            numberOfLines={3}
            multiline={true}
            value={prompt}
            onChangeText={(text) => setPrompt(text)}
          />
          <TouchableOpacity style={styles.ideaBtn} onPress={generatePrompt}>
            <FontAwesome5 name="dice" size={20} color={Color.black} />
          </TouchableOpacity>
        </View>
        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          data={modelData}
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder="Select model"
          value={model}
          onChange={(item) => {
            setModel(item.value);
          }}
        />
        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          data={aspectRatioData}
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder="Select aspect ratio"
          value={aspectRatio}
          onChange={(item) => {
            setAspectRatio(item.value);
          }}
        />
        <TouchableOpacity style={styles.button} onPress={generateImage}>
          <Text style={styles.btnText}>Generate</Text>
        </TouchableOpacity>
        {isLoading && (
          <View style={[styles.imageContainer, { justifyContent: "center" }]}>
            <ActivityIndicator size={"large"} />
          </View>
        )}
        {imageUrl && (
          <>
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUrl }} style={styles.image} />
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.Downloadbtn} onPress={() => {}}>
                <FontAwesome5 name="download" size={20} style={{ left: 12 }} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.Downloadbtn} onPress={() => {}}>
                <FontAwesome5 name="share" size={20} style={{ left: 12 }} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </>
  );
}

const windowWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Color.background,
  },
  inputField: {
    backgroundColor: Color.dark,
    padding: 20,
    borderRadius: 10,
    borderColor: Color.accent,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 16,
    fontWeight: 500,
    letterSpacing: 0.2,
    height: 150,
    color: Color.text,
  },
  ideaBtn: {
    backgroundColor: Color.accent,
    padding: 16,
    borderRadius: "50%",
    alignSelf: "flex-end",
    position: "relative",
    bottom: 60,
    right: 15,
  },
  dropdown: {
    marginTop: 20,
    height: 50,
    backgroundColor: Color.dark,
    borderRadius: 10,
    borderColor: Color.accent,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  placeholderStyle: {
    fontSize: 16,
    color: Color.placeholder,
  },
  selectedTextStyle: {
    fontSize: 16,
    color: Color.placeholder,
  },
  button: {
    backgroundColor: Color.accent,
    padding: 12,
    marginTop: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: {
    color: Color.black,
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 1.2,
  },
  imageContainer: {
    height: 300,
    width: windowWidth - 40,
    marginTop: 20,
    borderRadius: 10,
    borderColor: Color.accent,
    borderWidth: StyleSheet.hairlineWidth,
  },
  image: {
    flex: 1,
    width: "100%",
    resizeMode: "contain",
  },
  Downloadbtn: {
    height: 45,
    width: 45,
    borderRadius: "50%",
    backgroundColor: "rgba(255,255,255,0.4)",
    justifyContent: "center",
    alignContent: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 10,
    justifyContent: "space-evenly",
  },
});
