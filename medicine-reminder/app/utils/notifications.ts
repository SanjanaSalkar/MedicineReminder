import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Medication } from "./storage";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  if (Platform.OS === "web") {
    return null;
  }

  let token: string | null = null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  try {
    const response = await Notifications.getExpoPushTokenAsync();
    token = response.data;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#1a8e2d",
      });
    }

    return token;
  } catch (error) {
    console.error("Error getting push token:", error);
    return null;
  }
}

export async function scheduleMedicationReminder(
  medication: Medication
): Promise<string | undefined> {
  if (Platform.OS === "web") {
    return undefined;
  }

  if (!medication.reminderEnabled) return;

  try {
    for (const time of medication.times) {
      const [hours, minutes] = time.split(":").map(Number);
      const today = new Date();
      today.setHours(hours, minutes, 0, 0);

      if (today < new Date()) {
        today.setDate(today.getDate() + 1);
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Medication Reminder",
          body: `Time to take ${medication.name} (${medication.dosage})`,
          data: { medicationId: medication.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
        },
      });

      return identifier;
    }
  } catch (error) {
    console.error("Error scheduling medication reminder:", error);
    return undefined;
  }
}

export async function scheduleRefillReminder(
  medication: Medication
): Promise<string | undefined> {
  if (Platform.OS === "web") {
    return undefined;
  }

  if (!medication.refillReminder) return;

  try {
    if (medication.currentSupply <= medication.refillAt) {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Refill Reminder",
          body: `Your ${medication.name} supply is running low. Current supply: ${medication.currentSupply}`,
          data: { medicationId: medication.id, type: "refill" },
        },
        trigger: null,
      });

      return identifier;
    }
  } catch (error) {
    console.error("Error scheduling refill reminder:", error);
    return undefined;
  }
}

export async function cancelMedicationReminders(
  medicationId: string
): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }

  try {
    const scheduledNotifications =
      await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of scheduledNotifications) {
      const data = notification.content.data as {
        medicationId?: string;
      } | null;
      if (data?.medicationId === medicationId) {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier
        );
      }
    }
  } catch (error) {
    console.error("Error canceling medication reminders:", error);
  }
}

export async function updateMedicationReminders(
  medication: Medication
): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }

  try {
    await cancelMedicationReminders(medication.id);
    await scheduleMedicationReminder(medication);
    await scheduleRefillReminder(medication);
  } catch (error) {
    console.error("Error updating medication reminders:", error);
  }
}
