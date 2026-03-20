import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getMedications, Medication } from "../utils/storage";

export default function MedicationExpiryScreen() {
  const router = useRouter();
  const [medications, setMedications] = useState<Medication[]>([]);

  const loadMedications = useCallback(async () => {
    try {
      const meds = await getMedications();
      setMedications(meds);
    } catch (error) {
      console.error("Error loading medications:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMedications();
    }, [loadMedications])
  );

  const isExpired = (expiryDate: string | undefined) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const isExpiringSoon = (expiryDate: string | undefined) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry;
  };

  const medicationsWithExpiry = medications.filter((med) => med.expiryDate);
  const expiredMeds = medicationsWithExpiry.filter((med) =>
    isExpired(med.expiryDate)
  );
  const expiringSoonMeds = medicationsWithExpiry.filter((med) =>
    isExpiringSoon(med.expiryDate)
  );
  const activeMeds = medicationsWithExpiry.filter(
    (med) => !isExpired(med.expiryDate) && !isExpiringSoon(med.expiryDate)
  );

  const renderMedicationCard = (medication: Medication, type: string) => {
    const expired = isExpired(medication.expiryDate);
    const expiringSoon = isExpiringSoon(medication.expiryDate);
    const daysUntil = medication.expiryDate
      ? getDaysUntilExpiry(medication.expiryDate)
      : 0;

    return (
      <View key={medication.id} style={styles.medicationCard}>
        <View
          style={[
            styles.medicationColor,
            { backgroundColor: medication.color },
          ]}
        />
        <View style={styles.medicationInfo}>
          <Text style={styles.medicationName}>{medication.name}</Text>
          <Text style={styles.medicationDosage}>{medication.dosage}</Text>
          {medication.expiryDate && (
            <View style={styles.expiryInfo}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={expired ? "#FF5252" : expiringSoon ? "#FF9800" : "#666"}
              />
              <Text
                style={[
                  styles.expiryText,
                  expired && styles.expiredText,
                  expiringSoon && styles.expiringSoonText,
                ]}
              >
                {expired
                  ? `Expired ${Math.abs(daysUntil)} days ago`
                  : expiringSoon
                  ? `Expires in ${daysUntil} days`
                  : `Expires ${new Date(
                      medication.expiryDate
                    ).toLocaleDateString()}`}
              </Text>
            </View>
          )}
        </View>
        {expired && (
          <View style={styles.expiredBadge}>
            <Ionicons name="alert-circle" size={20} color="#FF5252" />
            <Text style={styles.expiredBadgeText}>Expired</Text>
          </View>
        )}
        {expiringSoon && !expired && (
          <View style={styles.warningSoonBadge}>
            <Ionicons name="warning" size={20} color="#FF9800" />
            <Text style={styles.warningSoonText}>Soon</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#f3a846", "#f3a846"]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={28} color="#f3a846" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medicine Expiry</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {medicationsWithExpiry.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="medkit-outline" size={64} color="#ccc" />
              <Text style={styles.emptyStateTitle}>
                No expiry dates set
              </Text>
              <Text style={styles.emptyStateText}>
                Add expiry dates to your medications to track when they expire
              </Text>
            </View>
          ) : (
            <>
              {expiredMeds.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="alert-circle" size={24} color="#FF5252" />
                    <Text style={[styles.sectionTitle, styles.expiredTitle]}>
                      Expired ({expiredMeds.length})
                    </Text>
                  </View>
                  {expiredMeds.map((med) => renderMedicationCard(med, "expired"))}
                </View>
              )}

              {expiringSoonMeds.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="warning" size={24} color="#FF9800" />
                    <Text
                      style={[styles.sectionTitle, styles.expiringSoonTitle]}
                    >
                      Expiring Soon ({expiringSoonMeds.length})
                    </Text>
                  </View>
                  {expiringSoonMeds.map((med) =>
                    renderMedicationCard(med, "expiring-soon")
                  )}
                </View>
              )}

              {activeMeds.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                    <Text style={[styles.sectionTitle, styles.activeTitle]}>
                      Active ({activeMeds.length})
                    </Text>
                  </View>
                  {activeMeds.map((med) => renderMedicationCard(med, "active"))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === "ios" ? 140 : 120,
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "white",
    marginLeft: 15,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 10,
  },
  expiredTitle: {
    color: "#FF5252",
  },
  expiringSoonTitle: {
    color: "#FF9800",
  },
  activeTitle: {
    color: "#4CAF50",
  },
  medicationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  medicationColor: {
    width: 12,
    height: 50,
    borderRadius: 6,
    marginRight: 15,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  medicationDosage: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  expiryInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  expiryText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 5,
  },
  expiredText: {
    color: "#FF5252",
    fontWeight: "600",
  },
  expiringSoonText: {
    color: "#FF9800",
    fontWeight: "600",
  },
  expiredBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  expiredBadgeText: {
    color: "#FF5252",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 4,
  },
  warningSoonBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  warningSoonText: {
    color: "#FF9800",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    marginTop: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#666",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    lineHeight: 24,
  },
});
