// src/services/storageService.js
// Handles uploading profile photos to Firebase Storage and returning download URLs.

import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../config/firebase";

/**
 * Upload a local image URI to Firebase Storage.
 * Path: users/{uid}/photos/{index}.jpg
 * Returns the public download URL.
 */
export async function uploadProfilePhoto(uid, localUri, index) {
    // 1. Convert local URI to a blob (React Native compatible)
    const response = await fetch(localUri);
    const blob = await response.blob();

    // 2. Create a storage reference
    const storageRef = ref(storage, `users/${uid}/photos/${index}.jpg`);

    // 3. Upload the blob
    await uploadBytes(storageRef, blob);

    // 4. Get the public download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
}

/**
 * Upload multiple local photos and return array of { uri, type } objects.
 * Skips photos that are already uploaded (type === "remote").
 */
export async function uploadAllPhotos(uid, photos) {
    const results = [];

    for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];

        if (!photo?.uri) continue;

        // Skip already-uploaded photos
        if (photo.type === "remote") {
            results.push(photo);
            continue;
        }

        // Upload local photo
        try {
            const downloadURL = await uploadProfilePhoto(uid, photo.uri, i);
            results.push({ uri: downloadURL, type: "remote" });
        } catch (err) {
            console.warn(`Failed to upload photo ${i}:`, err);
            // Keep the local version as fallback
            results.push(photo);
        }
    }

    return results;
}

/**
 * Delete a photo from Firebase Storage by its index.
 */
export async function deleteProfilePhoto(uid, index) {
    try {
        const storageRef = ref(storage, `users/${uid}/photos/${index}.jpg`);
        await deleteObject(storageRef);
    } catch (err) {
        // File may not exist, that's okay
        console.warn(`Could not delete photo ${index}:`, err.message);
    }
}
