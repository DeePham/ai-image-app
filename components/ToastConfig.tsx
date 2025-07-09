import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import React from "react";
import { StyleSheet, View } from "react-native";
import { BaseToast, ErrorToast, InfoToast } from "react-native-toast-message";

export function createToastConfig(theme: any) {
  const styles = createStyles(theme);

  return {
    success: (props: any) => (
      <BaseToast
        {...props}
        style={[styles.toastBase, styles.successToast]}
        contentContainerStyle={styles.contentContainer}
        text1Style={styles.text1}
        text2Style={styles.text2}
        renderLeadingIcon={() => (
          <View style={styles.iconContainer}>
            <FontAwesome5 name="check-circle" size={20} color={theme.success} />
          </View>
        )}
      />
    ),
    error: (props: any) => (
      <ErrorToast
        {...props}
        style={[styles.toastBase, styles.errorToast]}
        contentContainerStyle={styles.contentContainer}
        text1Style={styles.text1}
        text2Style={styles.text2}
        renderLeadingIcon={() => (
          <View style={styles.iconContainer}>
            <FontAwesome5 name="exclamation-circle" size={20} color={theme.error} />
          </View>
        )}
      />
    ),
    info: (props: any) => (
      <InfoToast
        {...props}
        style={[styles.toastBase, styles.infoToast]}
        contentContainerStyle={styles.contentContainer}
        text1Style={styles.text1}
        text2Style={styles.text2}
        renderLeadingIcon={() => (
          <View style={styles.iconContainer}>
            <FontAwesome5 name="info-circle" size={20} color={theme.primary} />
          </View>
        )}
      />
    ),
  };
}

const createStyles = (theme: any) => StyleSheet.create({
  toastBase: {
    width: "90%",
    borderLeftWidth: 0,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  successToast: {
    backgroundColor: theme.surface,
  },
  errorToast: {
    backgroundColor: theme.surface,
  },
  infoToast: {
    backgroundColor: theme.surface,
  },
  contentContainer: {
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  text1: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
  },
  text2: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 16,
  },
});
