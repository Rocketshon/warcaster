import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Switch,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../contexts/ThemeContext';
import { useMarket } from '../../contexts/MarketContext';
import { FACTIONS } from '../../lib/factions';
import {
  CATEGORY_LABELS,
  CONDITION_LABELS,
  type ListingCategory,
  type ListingCondition,
} from '../../lib/marketTypes';

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [ListingCategory, string][];
const CONDITIONS = Object.entries(CONDITION_LABELS) as [ListingCondition, string][];
const MAX_PHOTOS = 5;

export default function CreateListingScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { createListing } = useMarket();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [factionId, setFactionId] = useState<string | null>(null);
  const [unitName, setUnitName] = useState('');
  const [category, setCategory] = useState<ListingCategory>('other');
  const [condition, setCondition] = useState<ListingCondition>('new_on_sprue');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [shipping, setShipping] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePickPhoto = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Limit Reached', `Maximum ${MAX_PHOTOS} photos allowed.`);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const uris = result.assets.map((a) => a.uri);
      setPhotos((prev) => [...prev, ...uris].slice(0, MAX_PHOTOS));
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) { Alert.alert('Required', 'Title is required'); return; }
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert('Required', 'Enter a valid price');
      return;
    }

    setLoading(true);
    try {
      await createListing(
        {
          title: title.trim(),
          description: description.trim(),
          faction_id: factionId ?? undefined,
          unit_name: unitName.trim() || undefined,
          category,
          price: parseFloat(price),
          condition,
          location: location.trim(),
          shipping,
        },
        photos,
      );
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      {/* Loading overlay */}
      {loading && (
        <View style={styles.overlay}>
          <View style={[styles.overlayBox, { backgroundColor: colors.bgCard }]}>
            <ActivityIndicator size="large" color={colors.accentGold} />
            <Text style={[styles.overlayText, { color: colors.textPrimary }]}>Posting listing...</Text>
          </View>
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Create Listing</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Title */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Title *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bgCard, borderColor: colors.borderColor, color: colors.textPrimary }]}
              placeholder="e.g. Space Marine Intercessor bits"
              placeholderTextColor={colors.textSecondary}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.bgCard, borderColor: colors.borderColor, color: colors.textPrimary }]}
              placeholder="Describe what you're selling..."
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Photos */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Photos ({photos.length}/{MAX_PHOTOS})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
              {photos.map((uri, index) => (
                <View key={index} style={styles.photoThumbContainer}>
                  <Image source={{ uri }} style={styles.photoThumb} />
                  <TouchableOpacity
                    style={[styles.removePhotoBtn, { backgroundColor: colors.error }]}
                    onPress={() => removePhoto(index)}
                  >
                    <Ionicons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < MAX_PHOTOS && (
                <TouchableOpacity
                  style={[styles.addPhotoBtn, { borderColor: colors.borderColor, backgroundColor: colors.bgCard }]}
                  onPress={handlePickPhoto}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera-outline" size={28} color={colors.textSecondary} />
                  <Text style={[styles.addPhotoText, { color: colors.textSecondary }]}>Add</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {/* Faction picker */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Faction</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    {
                      backgroundColor: !factionId ? colors.accentGold + '30' : colors.bgCard,
                      borderColor: !factionId ? colors.accentGold : colors.borderColor,
                    },
                  ]}
                  onPress={() => setFactionId(null)}
                >
                  <Text style={[styles.chipText, { color: !factionId ? colors.accentGold : colors.textSecondary }]}>
                    None
                  </Text>
                </TouchableOpacity>
                {FACTIONS.map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: factionId === f.id ? colors.accentGold + '30' : colors.bgCard,
                        borderColor: factionId === f.id ? colors.accentGold : colors.borderColor,
                      },
                    ]}
                    onPress={() => setFactionId(f.id)}
                  >
                    <Text style={[styles.chipText, { color: factionId === f.id ? colors.accentGold : colors.textSecondary }]}>
                      {f.icon} {f.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Unit name */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Unit Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bgCard, borderColor: colors.borderColor, color: colors.textPrimary }]}
              placeholder="e.g. Intercessors"
              placeholderTextColor={colors.textSecondary}
              value={unitName}
              onChangeText={setUnitName}
            />
          </View>

          {/* Category */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {CATEGORIES.map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: category === key ? colors.accentGold + '30' : colors.bgCard,
                        borderColor: category === key ? colors.accentGold : colors.borderColor,
                      },
                    ]}
                    onPress={() => setCategory(key)}
                  >
                    <Text style={[styles.chipText, { color: category === key ? colors.accentGold : colors.textSecondary }]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Condition */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Condition</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {CONDITIONS.map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: condition === key ? colors.accentGold + '30' : colors.bgCard,
                        borderColor: condition === key ? colors.accentGold : colors.borderColor,
                      },
                    ]}
                    onPress={() => setCondition(key)}
                  >
                    <Text style={[styles.chipText, { color: condition === key ? colors.accentGold : colors.textSecondary }]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Price */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Price ($) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bgCard, borderColor: colors.borderColor, color: colors.textPrimary }]}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Location */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Location</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bgCard, borderColor: colors.borderColor, color: colors.textPrimary }]}
              placeholder="City, State"
              placeholderTextColor={colors.textSecondary}
              value={location}
              onChangeText={setLocation}
            />
          </View>

          {/* Shipping */}
          <View style={[styles.shippingRow, { backgroundColor: colors.bgCard, borderColor: colors.borderColor }]}>
            <View>
              <Text style={[styles.shippingLabel, { color: colors.textPrimary }]}>Shipping Available</Text>
              <Text style={[styles.shippingSubtext, { color: colors.textSecondary }]}>
                Can you ship this item?
              </Text>
            </View>
            <Switch
              value={shipping}
              onValueChange={setShipping}
              trackColor={{ false: colors.borderColor, true: colors.accentGold }}
              thumbColor="#fff"
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.accentGold, opacity: loading ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.submitText}>Post Listing</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    flex: { flex: 1 },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 40,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 100,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    overlayBox: {
      borderRadius: 12,
      padding: 32,
      alignItems: 'center',
      gap: 16,
    },
    overlayText: { fontSize: 16, fontWeight: '600' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      letterSpacing: 1,
    },
    field: {
      marginBottom: 20,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.5,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    input: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
    },
    textArea: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      minHeight: 100,
    },
    photoRow: {
      flexDirection: 'row',
    },
    photoThumbContainer: {
      position: 'relative',
      marginRight: 10,
    },
    photoThumb: {
      width: 80,
      height: 80,
      borderRadius: 8,
    },
    removePhotoBtn: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addPhotoBtn: {
      width: 80,
      height: 80,
      borderRadius: 8,
      borderWidth: 2,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    addPhotoText: { fontSize: 11 },
    chipRow: {
      flexDirection: 'row',
      gap: 8,
    },
    chip: {
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    chipText: {
      fontSize: 13,
      fontWeight: '500',
    },
    shippingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderRadius: 8,
      padding: 16,
      marginBottom: 24,
    },
    shippingLabel: { fontSize: 15, fontWeight: '500' },
    shippingSubtext: { fontSize: 12, marginTop: 2 },
    submitButton: {
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 20,
    },
    submitText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 1,
    },
  });
}
