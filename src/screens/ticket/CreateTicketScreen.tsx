import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ChevronDown, Layers, QrCode, Search, Tag, User, X } from "lucide-react-native";

import AppButton from "../../components/AppButton";
import { colors, tones, type StatusTone } from "../../theme/colors";
import { ApiError } from "../../services/apiClient";
import { getCurrentUser } from "../../services/authService";
import {
  createTicket,
  DEVICE_TYPES,
  fetchIncidentCategories,
  TICKET_PRIORITIES,
  type IncidentCategory,
  type TicketPriority,
} from "../../services/ticketService";
import {
  fetchOfflineAssetsForLookup,
  filterAssetLookupResults,
  searchHardwareAssets,
  type AssetLookupResult,
} from "../../services/assetLookupService";
import type { OfflineAssetDetail } from "../../services/offlineAssetService";

const PRIORITY_TONE: Record<TicketPriority, StatusTone> = {
  Critical: "red",
  High: "amber",
  Medium: "blue",
  Low: "neutral",
};

// Matches the web console's Create Service Request form — every field
// marked here also has a matching Alert.alert(...) check in handleSubmit
// below, so a required field is never silently skippable.
function FieldLabel({ children, required = false }: { children: string; required?: boolean }) {
  return (
    <Text style={styles.fieldLabel}>
      {children}
      {required ? <Text style={styles.requiredMark}> *</Text> : null}
    </Text>
  );
}

function formatSubmittedAt(date: Date) {
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CreateTicketScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const [createdBy, setCreatedBy] = useState("");
  const [submittedAt] = useState(() => formatSubmittedAt(new Date()));

  const [categories, setCategories] = useState<IncidentCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");

  const [offlineAssets, setOfflineAssets] = useState<AssetLookupResult[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("Medium");

  const [deviceType, setDeviceType] = useState("");
  const [assetIdInput, setAssetIdInput] = useState("");
  const [assetBrand, setAssetBrand] = useState("");
  const [assetModel, setAssetModel] = useState("");
  const [assetOS, setAssetOS] = useState("");

  const [assetResults, setAssetResults] = useState<AssetLookupResult[]>([]);
  const [assetDropdownOpen, setAssetDropdownOpen] = useState(false);
  const [assetSearchLoading, setAssetSearchLoading] = useState(false);
  const assetSearchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [category, setCategory] = useState<IncidentCategory | null>(null);
  const [subcategoryId, setSubcategoryId] = useState<number | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);

  const [deviceTypePickerOpen, setDeviceTypePickerOpen] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [subcategoryPickerOpen, setSubcategoryPickerOpen] = useState(false);
  const [detailPickerOpen, setDetailPickerOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getCurrentUser()
      .then((user) => {
        if (isMounted) setCreatedBy(user?.name || user?.username || "");
      })
      .catch(() => {
        // Field simply shows blank if this fails — not required for submit.
      });

    fetchIncidentCategories()
      .then((result) => {
        if (isMounted) setCategories(result);
      })
      .catch((error: any) => {
        if (isMounted) {
          setCategoriesError(
            error instanceof ApiError ? error.message : "Failed to load ticket categories."
          );
        }
      })
      .finally(() => {
        if (isMounted) setCategoriesLoading(false);
      });

    fetchOfflineAssetsForLookup()
      .then((result) => {
        if (isMounted) setOfflineAssets(result);
      })
      .catch(() => {
        // Asset Lookup still works via Hardware Inventory search alone.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Applies a QR-scanned Offline Asset's device info to the Asset section —
  // fired both on first mount (navigated here fresh from a scan) and when
  // popped back to from ScanAssetScreen with a new scan while this form was
  // already open (navigation.navigate re-merges params into this same,
  // still-mounted screen instead of stacking a duplicate).
  useFocusEffect(
    React.useCallback(() => {
      const prefill: OfflineAssetDetail | undefined = route.params?.prefillAsset;
      if (!prefill) return;

      setDeviceType(prefill.type || "");
      setAssetIdInput(prefill.assetTag || prefill.name || "");
      setAssetBrand(prefill.manufacturer || "");
      setAssetModel(prefill.model || "");
      setAssetOS(prefill.os || "");
      setAssetResults([]);
      setAssetDropdownOpen(false);

      navigation.setParams({ prefillAsset: undefined });
    }, [route.params?.prefillAsset, navigation])
  );

  useEffect(() => {
    if (assetSearchDebounce.current) clearTimeout(assetSearchDebounce.current);

    const term = assetIdInput.trim();
    if (term.length < 2) {
      setAssetResults(filterAssetLookupResults(offlineAssets, term).slice(0, 20));
      return;
    }

    assetSearchDebounce.current = setTimeout(async () => {
      setAssetSearchLoading(true);
      try {
        const hardwareResults = await searchHardwareAssets(term);
        const offlineResults = filterAssetLookupResults(offlineAssets, term);
        setAssetResults([...hardwareResults, ...offlineResults].slice(0, 30));
      } catch (_) {
        setAssetResults(filterAssetLookupResults(offlineAssets, term).slice(0, 20));
      } finally {
        setAssetSearchLoading(false);
      }
    }, 350);

    return () => {
      if (assetSearchDebounce.current) clearTimeout(assetSearchDebounce.current);
    };
  }, [assetIdInput, offlineAssets]);

  function selectAsset(asset: AssetLookupResult) {
    setAssetIdInput(asset.label);
    setAssetBrand(asset.brand);
    setAssetModel(asset.model);
    setAssetOS(asset.os);
    if (asset.deviceType) setDeviceType(asset.deviceType);
    setAssetDropdownOpen(false);
  }

  function selectCategory(next: IncidentCategory) {
    setCategory(next);
    setSubcategoryId(null);
    setDetailId(null);
    setCategoryPickerOpen(false);
  }

  function selectSubcategory(id: number) {
    setSubcategoryId(id);
    setDetailId(null);
    setSubcategoryPickerOpen(false);
  }

  const selectedSubcategory = useMemo(
    () => category?.subcategories.find((item) => item.id === subcategoryId) || null,
    [category, subcategoryId]
  );

  const canSubmit =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    !!deviceType &&
    assetIdInput.trim().length > 0 &&
    !!category &&
    !submitting;

  async function handleSubmit() {
    if (!deviceType) {
      Alert.alert("Device Type Required", "Please select a device type.");
      return;
    }
    if (!assetIdInput.trim()) {
      Alert.alert("Asset Required", "Please search and select an asset, or scan its QR code.");
      return;
    }
    if (!category) {
      Alert.alert("Category Required", "Please select a category for this ticket.");
      return;
    }
    if (category.subcategories.length > 0 && !subcategoryId) {
      Alert.alert("Subcategory Required", "Please select a subcategory.");
      return;
    }
    if (selectedSubcategory && selectedSubcategory.details.length > 0 && !detailId) {
      Alert.alert("Problem Detail Required", "Please select a problem detail.");
      return;
    }
    if (!title.trim()) {
      Alert.alert("Title Required", "Please enter a short title for this ticket.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Description Required", "Please describe the issue before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createTicket({
        title: title.trim(),
        description: description.trim(),
        priority,
        deviceType,
        assetId: assetIdInput.trim(),
        categoryId: category.id,
        subcategoryId,
        detailId,
      });
      navigation.replace("TicketConfirmation", { result });
    } catch (error: any) {
      const message =
        error instanceof ApiError ? error.message : "Failed to create ticket. Please try again.";
      Alert.alert("Submit Failed", message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <ArrowLeft size={20} color={colors.text} strokeWidth={2.7} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.pageLabel}>NEW SERVICE REQUEST</Text>
        <Text style={styles.pageTitle}>Create Ticket</Text>
        <Text style={styles.pageSubtitle}>
          Scan an asset's QR code to prefill its details, or search for it below.
        </Text>

        {/* Created By & Asset */}
        <View style={styles.formPanel}>
          <Text style={styles.sectionTitle}>Created By & Asset</Text>

          <Text style={styles.fieldLabel}>Created By</Text>
          <View style={styles.readonlyField}>
            <User size={16} color={colors.muted} strokeWidth={2.6} />
            <Text style={styles.readonlyFieldText} numberOfLines={1}>{createdBy || "Current User"}</Text>
          </View>

          <Text style={styles.fieldLabel}>Submitted At</Text>
          <View style={styles.readonlyField}>
            <Text style={styles.readonlyFieldText}>{submittedAt}</Text>
          </View>

          <FieldLabel required>Device Type</FieldLabel>
          <TouchableOpacity
            style={styles.selectField}
            activeOpacity={0.8}
            onPress={() => setDeviceTypePickerOpen(true)}
          >
            <Tag size={16} color={colors.blue} strokeWidth={2.6} />
            <Text style={[styles.selectFieldText, !deviceType && styles.selectFieldPlaceholder]} numberOfLines={1}>
              {deviceType || "Select Device Type"}
            </Text>
            <ChevronDown size={16} color={colors.muted} strokeWidth={2.6} />
          </TouchableOpacity>

          <FieldLabel required>Asset Lookup</FieldLabel>
          <View style={styles.assetRow}>
            <View style={styles.assetSearchField}>
              <Search size={15} color={colors.muted} strokeWidth={2.6} />
              <TextInput
                value={assetIdInput}
                onChangeText={(value) => {
                  setAssetIdInput(value);
                  setAssetDropdownOpen(true);
                }}
                onFocus={() => setAssetDropdownOpen(true)}
                placeholder="Search asset tag, brand or model"
                placeholderTextColor={colors.muted}
                style={styles.assetSearchInput}
              />
            </View>
            <TouchableOpacity
              style={styles.scanButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("ScanAsset")}
            >
              <QrCode size={18} color={colors.white} strokeWidth={2.6} />
            </TouchableOpacity>
          </View>

          {assetDropdownOpen ? (
            <View style={styles.assetDropdown}>
              {assetSearchLoading ? (
                <View style={styles.assetDropdownEmpty}>
                  <ActivityIndicator color={colors.blue} size="small" />
                </View>
              ) : assetResults.length === 0 ? (
                <Text style={styles.assetDropdownEmptyText}>
                  {assetIdInput.trim().length < 2
                    ? "Type at least 2 characters to search, or scan a QR code."
                    : "No matching assets found."}
                </Text>
              ) : (
                assetResults.map((asset) => (
                  <TouchableOpacity
                    key={asset.id}
                    style={styles.assetOption}
                    activeOpacity={0.75}
                    onPress={() => selectAsset(asset)}
                  >
                    <Text style={styles.assetOptionLabel} numberOfLines={1}>
                      {asset.label || "Unnamed asset"}
                      {asset.isOfflineAsset ? <Text style={styles.assetOptionBadge}>  Offline Asset</Text> : null}
                    </Text>
                    {asset.meta ? (
                      <Text style={styles.assetOptionMeta} numberOfLines={1}>{asset.meta}</Text>
                    ) : null}
                  </TouchableOpacity>
                ))
              )}
              <TouchableOpacity
                style={styles.assetDropdownClose}
                activeOpacity={0.8}
                onPress={() => setAssetDropdownOpen(false)}
              >
                <Text style={styles.assetDropdownCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.assetDetailRow}>
            <View style={styles.assetDetailField}>
              <Text style={styles.fieldLabel}>Asset Brand</Text>
              <TextInput
                value={assetBrand}
                onChangeText={setAssetBrand}
                placeholder="Brand"
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
            </View>
            <View style={styles.assetDetailField}>
              <Text style={styles.fieldLabel}>Asset Model</Text>
              <TextInput
                value={assetModel}
                onChangeText={setAssetModel}
                placeholder="Model"
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
            </View>
          </View>
          <Text style={styles.fieldLabel}>Asset OS</Text>
          <TextInput
            value={assetOS}
            onChangeText={setAssetOS}
            placeholder="Operating system"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
        </View>

        {/* Incident Classification */}
        <View style={styles.formPanel}>
          <Text style={styles.sectionTitle}>Incident Classification</Text>

          <FieldLabel required>Category</FieldLabel>
          <TouchableOpacity
            style={styles.selectField}
            activeOpacity={0.8}
            onPress={() => setCategoryPickerOpen(true)}
            disabled={categoriesLoading}
          >
            <Tag size={16} color={colors.blue} strokeWidth={2.6} />
            <Text style={[styles.selectFieldText, !category && styles.selectFieldPlaceholder]} numberOfLines={1}>
              {categoriesLoading ? "Loading categories..." : category?.name || "Select a category"}
            </Text>
            <ChevronDown size={16} color={colors.muted} strokeWidth={2.6} />
          </TouchableOpacity>
          {categoriesError ? <Text style={styles.errorText}>{categoriesError}</Text> : null}

          {category && category.subcategories.length > 0 ? (
            <>
              <FieldLabel required>Subcategory</FieldLabel>
              <TouchableOpacity
                style={styles.selectField}
                activeOpacity={0.8}
                onPress={() => setSubcategoryPickerOpen(true)}
              >
                <Layers size={16} color={colors.blue} strokeWidth={2.6} />
                <Text
                  style={[styles.selectFieldText, !selectedSubcategory && styles.selectFieldPlaceholder]}
                  numberOfLines={1}
                >
                  {selectedSubcategory?.name || "Select a subcategory"}
                </Text>
                <ChevronDown size={16} color={colors.muted} strokeWidth={2.6} />
              </TouchableOpacity>
            </>
          ) : null}

          {selectedSubcategory && selectedSubcategory.details.length > 0 ? (
            <>
              <FieldLabel required>Problem Detail</FieldLabel>
              <TouchableOpacity
                style={styles.selectField}
                activeOpacity={0.8}
                onPress={() => setDetailPickerOpen(true)}
              >
                <Layers size={16} color={colors.blue} strokeWidth={2.6} />
                <Text
                  style={[
                    styles.selectFieldText,
                    !selectedSubcategory.details.find((item) => item.id === detailId) && styles.selectFieldPlaceholder,
                  ]}
                  numberOfLines={1}
                >
                  {selectedSubcategory.details.find((item) => item.id === detailId)?.name || "Select a detail"}
                </Text>
                <ChevronDown size={16} color={colors.muted} strokeWidth={2.6} />
              </TouchableOpacity>
            </>
          ) : null}

          <FieldLabel required>Urgency Level</FieldLabel>
          <View style={styles.chipRow}>
            {TICKET_PRIORITIES.map((item) => {
              const active = item === priority;
              const tone = tones[PRIORITY_TONE[item]];

              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.chip,
                    { borderColor: tone.border, backgroundColor: active ? tone.bg : colors.background },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setPriority(item)}
                >
                  <Text style={[styles.chipText, { color: active ? tone.text : colors.textSoft }]}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <FieldLabel required>Title / Problem Description</FieldLabel>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Example: Unable to access internal HR portal"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />

          <FieldLabel required>Description</FieldLabel>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe issue, impact, error message and troubleshooting done."
            placeholderTextColor={colors.muted}
            style={styles.textarea}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        <AppButton
          title="Create Ticket"
          onPress={handleSubmit}
          loading={submitting}
          disabled={!canSubmit}
        />
      </ScrollView>

      <PickerModal
        visible={deviceTypePickerOpen}
        title="Select Device Type"
        options={DEVICE_TYPES.map((item) => ({ id: item, name: item }))}
        onSelect={(id) => {
          setDeviceType(String(id));
          setDeviceTypePickerOpen(false);
        }}
        onClose={() => setDeviceTypePickerOpen(false)}
      />

      <PickerModal
        visible={categoryPickerOpen}
        title="Select Category"
        options={categories.map((item) => ({ id: item.id, name: item.name }))}
        onSelect={(id) => {
          const next = categories.find((item) => item.id === id);
          if (next) selectCategory(next);
        }}
        onClose={() => setCategoryPickerOpen(false)}
      />

      <PickerModal
        visible={subcategoryPickerOpen}
        title="Select Subcategory"
        options={(category?.subcategories || []).map((item) => ({ id: item.id, name: item.name }))}
        onSelect={(id) => selectSubcategory(Number(id))}
        onClose={() => setSubcategoryPickerOpen(false)}
      />

      <PickerModal
        visible={detailPickerOpen}
        title="Select Problem Detail"
        options={(selectedSubcategory?.details || []).map((item) => ({ id: item.id, name: item.name }))}
        onSelect={(id) => {
          setDetailId(Number(id));
          setDetailPickerOpen(false);
        }}
        onClose={() => setDetailPickerOpen(false)}
      />

    </KeyboardAvoidingView>
  );
}

function PickerModal({
  visible,
  title,
  options,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: { id: string | number; name: string }[];
  onSelect: (id: string | number) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.8} style={styles.sheetClose}>
              <X size={18} color={colors.textSoft} strokeWidth={2.6} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sheetList} showsVerticalScrollIndicator={false}>
            {options.length === 0 ? (
              <Text style={styles.sheetEmpty}>No options available.</Text>
            ) : (
              options.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.sheetRow}
                  activeOpacity={0.75}
                  onPress={() => onSelect(item.id)}
                >
                  <Text style={styles.sheetRowText}>{item.name}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 16,
  },
  backText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 6,
  },
  pageLabel: {
    color: colors.blue,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  pageTitle: {
    color: colors.text,
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginTop: 6,
  },
  pageSubtitle: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 18,
  },

  formPanel: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 4,
  },
  requiredMark: {
    color: colors.red,
    fontWeight: "900",
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 8,
  },
  readonlyField: {
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  readonlyFieldText: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  selectField: {
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  selectFieldText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 10,
    marginRight: 8,
  },
  selectFieldPlaceholder: {
    color: colors.muted,
    fontWeight: "600",
  },
  errorText: {
    color: colors.red,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "800",
  },
  textarea: {
    minHeight: 110,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },

  assetRow: {
    flexDirection: "row",
    gap: 8,
  },
  assetSearchField: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  assetSearchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  scanButton: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  assetDropdown: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceHigh,
    maxHeight: 240,
    overflow: "hidden",
  },
  assetDropdownEmpty: {
    paddingVertical: 18,
    alignItems: "center",
  },
  assetDropdownEmptyText: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  assetOption: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  assetOptionLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  assetOptionBadge: {
    color: colors.blue,
    fontSize: 10,
    fontWeight: "900",
  },
  assetOptionMeta: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  assetDropdownClose: {
    paddingVertical: 10,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  assetDropdownCloseText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: "800",
  },
  assetDetailRow: {
    flexDirection: "row",
    gap: 10,
  },
  assetDetailField: {
    flex: 1,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.overlay,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: "70%",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetList: {
    marginTop: 4,
  },
  sheetEmpty: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "600",
    paddingVertical: 20,
    textAlign: "center",
  },
  sheetRow: {
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sheetRowText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
});
