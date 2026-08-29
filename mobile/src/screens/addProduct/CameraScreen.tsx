import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AddProductStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useDraftStore } from '../../store/useDraftStore';

type Props = { navigation: NativeStackNavigationProp<AddProductStackParamList, 'Camera'> };

const MAX_IMAGES = 5;

export const CameraScreen: React.FC<Props> = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const cameraRef = useRef<CameraView>(null);
  const { createDraft, updateDraft } = useDraftStore();

  // ── Camera capture ─────────────────────────────────────────────
  const handleCapture = async () => {
    if (selectedImages.length >= MAX_IMAGES) {
      Alert.alert('Maximum Photos', `You can add up to ${MAX_IMAGES} product photos.`);
      return;
    }
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) {
        setSelectedImages((prev) => [...prev, photo.uri]);
      }
    } catch (e) {
      console.warn('Camera capture error', e);
      Alert.alert('Camera Error', 'Could not take photo. Please try again.');
    }
  };

  // ── Gallery picker (multi-select) ──────────────────────────────
  const handleGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Gallery Access Needed',
        'Allow gallery access to select product photos.',
        [{ text: 'OK' }]
      );
      return;
    }

    const remaining = MAX_IMAGES - selectedImages.length;
    if (remaining <= 0) {
      Alert.alert('Maximum Photos', `You can add up to ${MAX_IMAGES} product photos.`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.85,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uris = result.assets.map((a) => a.uri);
      setSelectedImages((prev) => [...prev, ...uris].slice(0, MAX_IMAGES));
    }
  };

  // ── Remove image from selection ────────────────────────────────
  const handleRemoveImage = (idx: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Proceed to AI Studio ───────────────────────────────────────
  const handleProceed = () => {
    if (selectedImages.length === 0) {
      Alert.alert('No Photos', 'Please take or select at least one product photo.');
      return;
    }
    createDraft();
    updateDraft({ images: selectedImages, image: selectedImages[0], step: 'ai_studio' });
    navigation.navigate('AIStudio', { imageUris: selectedImages });
  };

  // ── Permission not yet determined ──────────────────────────────
  if (!permission) return <View style={styles.loading} />;

  // ── Permission denied ──────────────────────────────────────────
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color={colors.textSecondary} />
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>Allow camera access to photograph your products</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Allow Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.permissionBtn, styles.galleryFallbackBtn]} onPress={handleGallery}>
          <Text style={styles.permissionBtnText}>Pick from Gallery</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        {/* Header */}
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {selectedImages.length === 0
                ? 'Take a Photo'
                : `${selectedImages.length}/${MAX_IMAGES} Photos`}
            </Text>
            <TouchableOpacity
              onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
              style={styles.iconBtn}
            >
              <Ionicons name="camera-reverse-outline" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Guide overlay */}
        <View style={styles.guideOverlay}>
          <View style={styles.guideBox}>
            {[styles.tl, styles.tr, styles.bl, styles.br].map((s, i) => (
              <View key={i} style={[styles.corner, s]} />
            ))}
          </View>
          <Text style={styles.guideTip}>Keep product flat and well-lit</Text>
        </View>

        {/* Selected images strip */}
        {selectedImages.length > 0 && (
          <View style={styles.imageStrip}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedImages.map((uri, idx) => (
                <View key={idx} style={styles.thumbContainer}>
                  <Image source={{ uri }} style={styles.thumb} />
                  <TouchableOpacity
                    style={styles.thumbRemove}
                    onPress={() => handleRemoveImage(idx)}
                  >
                    <Ionicons name="close-circle" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              {selectedImages.length < MAX_IMAGES && (
                <TouchableOpacity style={styles.addMoreBtn} onPress={handleGallery}>
                  <Ionicons name="add" size={28} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.addMoreText}>Add More</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}

        {/* Bottom controls */}
        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={handleGallery} style={styles.galleryBtn}>
            <Ionicons name="images-outline" size={28} color="#fff" />
            <Text style={styles.galleryText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleCapture} style={styles.captureBtn}>
            <View style={styles.captureInner} />
          </TouchableOpacity>

          {selectedImages.length > 0 ? (
            <TouchableOpacity onPress={handleProceed} style={styles.proceedBtn}>
              <Ionicons name="sparkles" size={20} color="#fff" />
              <Text style={styles.proceedText}>Enhance</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.flashBtn}>
              <Ionicons name="flash-outline" size={28} color="#fff" />
            </View>
          )}
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8,
  },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  iconBtn: { padding: 8 },
  guideOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  guideBox: { width: 240, height: 240, position: 'relative' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: '#fff', borderWidth: 3 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  guideTip: {
    color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 14,
    backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
  },
  imageStrip: {
    paddingHorizontal: 12, paddingBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  thumbContainer: { marginRight: 8, position: 'relative' },
  thumb: { width: 64, height: 64, borderRadius: 10, borderWidth: 2, borderColor: '#fff' },
  thumbRemove: { position: 'absolute', top: -6, right: -6 },
  addMoreBtn: {
    width: 64, height: 64, borderRadius: 10,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
  },
  addMoreText: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 2 },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingBottom: 40, paddingTop: 20, backgroundColor: 'rgba(0,0,0,0.3)',
  },
  galleryBtn: { alignItems: 'center' },
  galleryText: { color: '#fff', fontSize: 12, marginTop: 4 },
  captureBtn: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  captureInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff' },
  flashBtn: { padding: 8 },
  proceedBtn: {
    alignItems: 'center', backgroundColor: colors.primary,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
  },
  proceedText: { color: '#fff', fontSize: 12, fontWeight: '700', marginTop: 2 },
  permissionContainer: {
    flex: 1, backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  permissionTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginTop: 20, marginBottom: 10 },
  permissionText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: 28 },
  permissionBtn: {
    backgroundColor: colors.primary, borderRadius: 12,
    paddingHorizontal: 28, paddingVertical: 14, marginBottom: 12,
  },
  galleryFallbackBtn: { backgroundColor: colors.textSecondary },
  permissionBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
