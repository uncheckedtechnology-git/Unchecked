// src/services/storageService.js
// Handles uploading profile photos to Firebase Storage and returning download URLs.

import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../config/firebase";

/**
 * Convert a local file URI to a Blob using XMLHttpRequest.
 * This is the only reliable method in React Native / Expo Go.
 * fetch().blob() fails silently on many Android versions.
 */
function uriToBlob(uri) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(xhr.response);
        xhr.onerror = () => reject(new Error("Failed to convert URI to blob"));
        xhr.responseType = "blob";
        xhr.open("GET", uri, true);
        xhr.send(null);
    });
}

/**
 * Upload a local image URI to Firebase Storage.
 * Path: users/{uid}/photos/{index}.jpg
 * Returns the public download URL.
 */
export async function uploadProfilePhoto(uid, localUri, index) {
    // 1. Convert local URI to blob via XHR (works in Expo Go + React Native)
    const blob = await uriToBlob(localUri);

    // 2. Create a storage reference
    const storageRef = ref(storage, `users/${uid}/photos/${index}.jpg`);

    // 3. Upload the blob
    await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });

    // 4. Close blob to free memory
    try { blob.close?.(); } catch (_) { }

    // 5. Get the public download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
}

/**
 * Upload multiple local photos and return array of { uri, type } objects.
 * Skips photos that are already uploaded (type === "remote").
 * Throws an error if any upload fails.
 */
export async function uploadAllPhotos(uid, photos) {
    const results = [];

    for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];

        if (!photo?.uri) continue;

        // Skip already-uploaded photos (already have a cloud URL)
        if (photo.type === "remote") {
            results.push(photo);
            continue;
        }

        // Upload local photo — throw on failure so user sees the error
        const downloadURL = await uploadProfilePhoto(uid, photo.uri, i);
        results.push({ uri: downloadURL, type: "remote" });
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
