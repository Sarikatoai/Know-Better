import { supabase } from './supabase';
import * as ImagePicker from 'expo-image-picker';

export async function pickAndUploadDogPhoto(dogId) {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled) return { canceled: true };

  const asset = result.assets[0];
  const uri = asset.uri;

  const response = await fetch(uri);
  const blob = await response.blob();
  const mimeType = blob.type || 'image/jpeg';
  const ext = mimeType.includes('png') ? 'png' : 'jpg';
  const path = `${dogId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('dog-profiles')
    .upload(path, blob, { contentType: mimeType, upsert: true });

  if (uploadError) {
    console.log('[PhotoUpload] upload error — message:', uploadError.message, '| status:', uploadError.statusCode ?? uploadError.status, '| full:', JSON.stringify(uploadError));
    return { error: uploadError, message: uploadError.message };
  }

  const { data: urlData } = supabase.storage.from('dog-profiles').getPublicUrl(path);
  const publicUrl = urlData?.publicUrl;

  const { error: updateError } = await supabase
    .from('dogs')
    .update({ profile_photo_url: publicUrl })
    .eq('dog_id', dogId);

  if (updateError) {
    console.log('[PhotoUpload] db update error — message:', updateError.message, '| full:', JSON.stringify(updateError));
    return { error: updateError, message: updateError.message };
  }

  console.log('[PhotoUpload] uploaded and saved:', publicUrl);
  return { url: publicUrl };
}
