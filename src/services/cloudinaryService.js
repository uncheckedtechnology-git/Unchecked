// src/services/cloudinaryService.js
// Uploads photos to Cloudinary (free tier: 25GB storage, 25GB bandwidth/month)
// No Firebase Storage needed.
//
// HOW TO SET UP (one-time, 2 minutes):
// 1. Go to https://cloudinary.com and sign up for free
// 2. Go to Dashboard → copy your "Cloud name"
// 3. Go to Settings → Upload → Add upload preset:
//    - Click "Add upload preset"
//    - Set "Signing Mode" to "Unsigned"
//    - Set folder to "unchecked_photos"
//    - Save → copy the preset name
// 4. Add to your .env file:
//    EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
//    EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset_name

const CLOUD_NAME = "dvs96gcmy";
const UPLOAD_PRESET = "unchecked_preset";

/**
 * Upload a local image URI to Cloudinary.
 * Uses unsigned upload — no server needed, no API secret exposed.
 * Returns the secure HTTPS URL of the uploaded image.
 */
export async function uploadToCloudinary(localUri, uid, index) {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
        throw new Error(
            "Cloudinary not configured. Add EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and " +
            "EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET to your .env file."
        );
    }

    // Create form data with the image file
    const formData = new FormData();
    formData.append("file", {
        uri: localUri,
        type: "image/jpeg",
        name: `photo_${uid}_${index}.jpg`,
    });
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", `unchecked_photos/${uid}`);
    formData.append("public_id", `photo_${index}`);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
            method: "POST",
            body: formData,
            headers: {
                "Accept": "application/json",
            },
        }
    );

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Cloudinary upload failed: ${errText}`);
    }

    const data = await response.json();
    return data.secure_url; // Public HTTPS URL — visible to all users
}

/**
 * Upload multiple local photos to Cloudinary.
 * Skips photos already uploaded (type === "remote").
 * Returns array of { uri, type: "remote" } with Cloudinary URLs.
 */
export async function uploadAllPhotosToCloudinary(uid, photos) {
    const results = [];

    for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (!photo?.uri) continue;

        // Already uploaded to cloud — skip
        if (photo.type === "remote") {
            results.push(photo);
            continue;
        }

        // Upload to Cloudinary
        const cloudUrl = await uploadToCloudinary(photo.uri, uid, i);
        results.push({ uri: cloudUrl, type: "remote" });
    }

    return results;
}

/**
 * Delete a photo from Cloudinary.
 * NOTE: Deletion requires a signed request (API secret).
 * For simplicity in this app, we just remove the photo from Firestore
 * and let Cloudinary keep the file (storage cost is minimal).
 * You can set up auto-delete via Cloudinary's admin API later.
 */
export async function deleteFromCloudinary(uid, index) {
    // For now, just log — implement server-side deletion when needed
    console.log(`Photo ${index} for user ${uid} removed from profile (still on Cloudinary)`);
}
