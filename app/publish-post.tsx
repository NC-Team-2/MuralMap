import { createPostAndSite } from "@/client/client.mjs";
import { UserContext } from "@/contexts/UserContext";
import { router, useLocalSearchParams } from "expo-router";
import { useContext, useEffect, useState } from "react";
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
import LocationSelector from "../components/LocationSelector";

export default function publishPhoto() {
  const { photoUri } = useLocalSearchParams<{ photoUri: string }>();
  const [caption, onCaptionChange] = useState<string>("");
  const [isPhotoPosting, setIsPhotoPosting] = useState<boolean>(false);
  const [regionCoordinates, setRegionCoordinates] = useState<null | {
    latitude: number;
    longitude: number;
  }>(null);
  const [isMapBySite, setIsMapBySite] = useState(false);
  // this will alternate between choosing a site and making a new site
  const { loggedInUser } = useContext(UserContext);

  useEffect(() => {
    // Get users location on load (load of app?) and push it to regionCoordinates for initalRegion
  }, []);

  async function uploadPhoto() {
    setIsPhotoPosting(true);
    const formData = new FormData();
    const cloudName = "drfu0sqz0";

    const fileType = photoUri.split(".").at(-1);

    const file: any = {
      uri: photoUri,
      name: `photo.${fileType}`,
      type: `image/${fileType}`,
    };

    formData.append("file", file);
    formData.append("upload_preset", "upload_preset");
    formData.append("folder", "postImages");

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const data = await response.json();

      // this is the url of the image now in cloud storage
      const cloudUrl = data.secure_url;
      await postPhoto({ img_url: cloudUrl });
      setIsPhotoPosting(false);
    } catch (error) {
      console.error("Error uploading image to the cloud:", error);
      setIsPhotoPosting(false);
    }
  }

  async function postPhoto({ img_url }: { img_url: string }) {
    const photoPayload = {
      user_id: loggedInUser.user_id,
      img_url,
      body: caption,
    };
    const sitePayload = { ...regionCoordinates, user_id: loggedInUser.user_id };
    try {
      const { post } = await createPostAndSite(photoPayload, sitePayload);
      console.log("This will need changing for diff route: post/:post_id");
      router.push({
        pathname: "/view-post",
        params: {
          post: JSON.stringify(post), // Now post is accessible
          author: JSON.stringify(loggedInUser),
        },
      });
    } catch {
      console.error("Error posting photo to database");
      setIsPhotoPosting(false);
    }
  }

  return (
    <View style={styles.container}>
      {photoUri ? (
        <>
          <Image source={{ uri: photoUri }} style={styles.photo} />
          <LocationSelector
            regionCoordinates={regionCoordinates}
            setRegionCoordinates={setRegionCoordinates}
          />
          <TextInput
            style={styles.captionInput}
            value={caption}
            onChangeText={onCaptionChange}
            placeholder="Caption..."
            placeholderTextColor={"#797979"}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={router.back}>
              <Text>Cancel</Text>
            </TouchableOpacity>
            {isPhotoPosting ? (
              <View style={styles.button}>
                <ActivityIndicator size="large" color="#ffffff" />
              </View>
            ) : (
              <TouchableOpacity style={styles.button} onPress={uploadPhoto}>
                <Text>Post</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      ) : null}
    </View>
  );
}

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
  },
  button: {
    backgroundColor: "#DD614A",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 50,
    width: screenWidth / 3,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    // flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    // alignItems: "center",
    height: 60,
    width: screenWidth,
    marginTop: 20,
  },
  photo: {
    width: screenWidth * 0.9,
    height: screenWidth * 0.9,
    borderColor: "#DD614A",
    borderStyle: "solid",
    borderWidth: 5,
    borderRadius: 5,
    marginBottom: 20,
  },
  map: {
    height: screenHeight * 0.3,
    width: "100%",
  },
  captionInput: {
    width: "70%",
    padding: 10,
    backgroundColor: "#e1e1e1",
    borderColor: "#DD614A",
    borderStyle: "solid",
    borderWidth: 5,
    borderRadius: 20,
    marginTop: 20,
  },
});
