import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

const ImageUploadBox = ({ label = 'Gambar', photo = null, onUpload, onRemove }) => {
  return (
    <View style={styles.container}>
      {/* Label */}
      <Text style={styles.label}>{label}</Text>

      {/* Input Box */}
      <View style={styles.inputWrapper}>
        <View style={styles.emptyBox} />
        <TouchableOpacity style={styles.uploadButton} onPress={onUpload}>
          <Text style={styles.uploadText}>Upload</Text>
        </TouchableOpacity>
      </View>

      {/* Preview below */}
      {photo && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: photo }} style={styles.imagePreview} />
          <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
            <Text style={styles.removeText}>×</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 12,
    backgroundColor: '#FFF9F2',
    overflow: 'hidden',
    height: 48,
  },
  emptyBox: {
    flex: 1,
    height: '100%',
  },
  uploadButton: {
    width: 100,
    height: '100%',
    backgroundColor: '#1D4949',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  imageContainer: {
    marginTop: 8,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 18,
    fontWeight: 'bold',
  },
});

export default ImageUploadBox;
