import React from 'react';
import { Color } from "@/utils/Color";
import { Stack } from "expo-router";
import { Text, View, StyleSheet, TextInput, TouchableOpacity, Image, Dimensions, ActivityIndicator } from "react-native";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Dropdown } from 'react-native-element-dropdown';
import { useState } from "react";

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
  { label :"1/1", value:"1/1" },
  { label :"16/9", value:"16/9" },
  { label :"9/16", value:"9/16" },
]


export default function Index() {
  const [model, setModel] = useState<string>("");
  const [aspectRatio, setAspectRatio] = useState<string>("");
  const [isLoading, setisLoading] = useState<boolean>(false);
  

  return (
    <>
      <Stack.Screen
        options={{
          title: "AI Image Generator",
          headerStyle: { backgroundColor: Color.background },
          headerTitleStyle: { color: Color.text },
        }}
      />
      <View style={styles.container}>
        <View style={{ height: 150 }}>
          <TextInput placeholder="Describe your imagination in detail..."
            placeholderTextColor={Color.placeholder}
            style={styles.inputField}
            numberOfLines={3}
            multiline={true}
          />
          <TouchableOpacity style={styles.ideaBtn} onPress={() => { }}>
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
          onChange={item => {
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
          onChange={item => {
            setAspectRatio(item.value);
          }}
        />
        <TouchableOpacity style={styles.button} onPress={() => {}}>
          <Text style={styles.btnText}>Generate</Text>
        </TouchableOpacity>

        {isLoading &&( 
          <View style = {[styles.imageContainer, {justifyContent: "center"}]}>
          <ActivityIndicator size = {'large'}/>
        </View>
        )}    
        <View style={styles.imageContainer}>
          <Image source={require('@/sample-image.png')} style={styles.image} />
        </View>
        <View style ={styles.buttonContainer}>
        <TouchableOpacity style={styles.Downloadbtn} onPress={() => {}}>
          <FontAwesome5  name="download" size ={20} style={{left: 12}} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.Downloadbtn} onPress={() => {}}>
        <FontAwesome5 name="share" size ={20} style={{left: 12}}/>
        </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Color.background
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
    position: 'relative',
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
    padding:12,
    marginTop: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: {
    color: Color.black,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 1.2,
  },
  imageContainer: {
    height:300,
    width: windowWidth - 40,
    marginTop: 20,
    borderRadius: 10,
    borderColor: Color.accent,
    borderWidth: StyleSheet.hairlineWidth,
  },
  image: {
    flex: 1,
    width: '100%',
    resizeMode:'contain',
  },
  Downloadbtn:{
    height: 45,
    width:45,
    borderRadius: "50%",
    backgroundColor: "rgba(255,255,255,0.4)",
    justifyContent: 'center',
    alignContent:'center'
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop:10,
    justifyContent:"space-evenly"
  },
})
