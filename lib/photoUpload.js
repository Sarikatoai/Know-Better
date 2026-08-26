import { supabase } from './supabase';
import * as ImagePicker from 'expo-image-picker';

export async function pickAndUploadDogPhoto(dogId) {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    base64: true,
  });

  if (result.canceled) return { canceled: true };

  const asset = result.assets[0];
  const uri = asset.uri;
  const base64 = asset.base64;

  const ext = uri.toLowerCase().includes('.png') ? 'png' : 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
  const path = `${dogId}.${ext}`;

  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

  const { error: uploadError } = await supabase.storage
    .from('dog-profiles')
    .upload(path, bytes, { contentType: mimeType, upsert: true });

  if (uploadError) {
    console.log('[PhotoUpload] upload error — message:', uploadError.message, '| status:', uploadError.statusCode ?? uploadError.status, '| full:', JSON.stringify(uploadError));
    return { error: uploadError, message: uploadError.message };
  }

  const { data: urlData } = supabase.storage.from('dog-profiles').getPublicUrl(path);
  const cleanUrl = urlData?.publicUrl;
  const cacheBustedUrl = `${cleanUrl}?t=${Date.now()}`;

  const { data: updateData, error: updateError } = await supabase
    .from('dogs')
    .update({ profile_photo_url: cleanUrl })
    .eq('dog_id', dogId)
    .select();

  console.log('[PhotoUpload] db update — dogId:', dogId, '| rows updated:', updateData?.length ?? 0, '| error:', JSON.stringify(updateError));

  if (updateError) {
    console.log('[PhotoUpload] db update error — message:', updateError.message, '| full:', JSON.stringify(updateError));
    return { error: updateError, message: updateError.message };
  }

  console.log('[PhotoUpload] uploaded and saved:', cacheBustedUrl);
  return { url: cacheBustedUrl };
}
