import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Alert, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { registerPushToken } from '../../services/notifications';
import { supabase } from '../../services/supabase';
import { Button, Card, Screen, styles, Title } from '../../ui';

export default function NotificationOptIn() {
  const { i18n, t } = useTranslation();
  const enable = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Guests still get on-device reminders (checklist, payments); server push needs an account.
      const current = await Notifications.getPermissionsAsync();
      const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
      Alert.alert(t(granted ? 'notificationsEnabled' : 'notificationsDenied'), t(granted ? 'guestRemindersEnabledBody' : 'notificationsDeniedBody'));
      router.replace('/(user)/(tabs)');
      return;
    }
    try {
      const token = await registerPushToken(user.id, i18n.language);
      Alert.alert(t(token ? 'notificationsEnabled' : 'notificationsDenied'), t(token ? 'notificationsEnabledBody' : 'notificationsDeniedBody'));
    } catch (error) {
      Alert.alert(t('notificationsNotEnabled'), error instanceof Error ? error.message : t('unknownError'));
    }
    router.replace('/(user)/(tabs)');
  };

  return <Screen><Title>{t('notificationOptInTitle')}</Title><Card><Text style={styles.label}>{t('notificationOptInLead')}</Text><Text style={styles.muted}>{t('notificationOptInBody')}</Text></Card><Button label={t('enableNotifications')} onPress={() => void enable()} /><Button label={t('notNow')} onPress={() => router.replace('/(user)/(tabs)')} secondary /></Screen>;
}
