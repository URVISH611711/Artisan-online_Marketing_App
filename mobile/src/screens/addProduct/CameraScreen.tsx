import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AddProductStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useDraftStore } from '../../store/useDraftStore';

type Props = { navigation: NativeStackNavigationProp<AddProductStackParamList, 'Camera'> };

export const CameraScreen: React.FC<Props> = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const cameraRef = useRef<CameraView>(null);
  const { createDraft, updateDraft } = useDraftStore();

  const handleCapture = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
      if (photo) {
        createDraft();
        updateDraft({ image: photo.uri, originalImage: photo.uri });
        navigation.navigate('AIStudio', { imageUri: photo.uri });
      }
    } catch (e) {
      console.warn('Camera error', e);
    }
  };

  const handleGallery = async () => {
    // Use mock URI in dev
    const mockUri = 'https://picsum.photos/600/600?random=99';
    createDraft();
    updateDraft({ image: mockUri, originalImage: mockUri });
    navigation.navigate('AIStudio', { imageUri: mockUri });
  };

  if (!permission) return <View style={styles.loading} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color={colors.textSecondary} />
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>Allow camera access to photograph your products</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Allow Camera</Text>
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
            <Text style={styles.headerTitle}>Take a Photo</Text>
            <TouchableOpacity onPress={() => setFacing(facing === 'back' ? 'front' : 'back')} style={styles.iconBtn}>
              <Ionicons name="camera-reverse-outline" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Guide overlay */}
        <View style={styles.guideOverlay}>
          <View style={styles.guideBox}>
            {/* Corner marks */}
            {[styles.tl, styles.tr, styles.bl, styles.br].map((s, i) => (
              <View key={i} style={[styles.corner, s]} />
            ))}
          </View>
          <View style={styles.detectedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.detectedText}>Product detected</Text>
          </View>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={handleGallery} style={styles.galleryBtn}>
            <Ionicons name="images-outline" size={28} color="#fff" />
            <Text style={styles.galleryText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleCapture} style={styles.captureBtn}>
            <View style={styles.captureInner} />
          </TouchableOpacity>

          <View style={styles.flashBtn}>
            <Ionicons name="flash-outline" size={28} color="#fff" />
          </View>
        </View>

        <Text style={styles.tip}>Keep the product flat and well-lit</Text>
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
  guideBox: {
    width: 260, height: 260,
    position: 'relative',
  },
  corner: {
    position: 'absolute', width: 24, height: 24,
    borderColor: '#fff', borderWidth: 3,
  },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  detectedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, marginTop: 20,
  },
  detectedText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingBottom: 40, paddingTop: 20,
  },
  galleryBtn: { alignItems: 'center' },
  galleryText: { color: '#fff', fontSize: 12, marginTop: 4 },
  captureBtn: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 4, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  captureInner: {
    width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff',
  },
  flashBtn: { padding: 8 },
  tip: {
    color: 'rgba(255,255,255,0.7)', textAlign: 'center',
    fontSize: 13, paddingBottom: 16,
  },
  permissionContainer: {
    flex: 1, backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  permissionTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginTop: 20, marginBottom: 10 },
  permissionText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: 28 },
  permissionBtn: {
    backgroundColor: colors.primary, borderRadius: 12,
    paddingHorizontal: 28, paddingVertical: 14,
  },
  permissionBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
