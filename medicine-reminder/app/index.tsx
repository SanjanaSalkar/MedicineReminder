import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { useEffect } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

export default function SplashScreen() {
    const router = useRouter();

    useEffect(() => {
    

    const timer = setTimeout(() => {
      router.replace("/home");
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

    return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.iconContainer,
          
        ]}
        >
        <Ionicons name="medical" size={100} color="white" />
        <Text style={styles.appName}>Med Reminder</Text>
      </Animated.View>
    </View>
  );

}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3a846",
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    alignItems: "center",
  },
  appName: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 20,
    letterSpacing: 1,
  },
});
